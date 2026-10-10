import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizarPlano, obterPrecoPlanoPorCiclo, normalizarBillingCycle } from './planos'
import { avaliarAmbienteAsaas } from './asaas-ambiente'

// =====================================================================================
// Processamento dos webhooks do Asaas. So roda no servidor.
//
// O Asaas entrega webhooks "pelo menos uma vez": o MESMO evento pode chegar varias vezes e
// fora de ordem. Regras desta implementacao:
//  1. IDEMPOTENCIA por ID de evento: cada evento e reivindicado de forma ATOMICA no banco
//     (asaas_evento_reivindicar). Evento repetido responde 200 e NAO repete nenhuma regra.
//  2. NUNCA ativa so porque o payload diz "pago": consulta o pagamento no Asaas e confere dono
//     (cliente/assinatura), valor do plano, ciclo e status.
//  3. NUNCA cria acesso a partir de pagamento antigo: respeita o estado atual da conta
//     (cancelado nao reativa sozinho) e a ordem das cobrancas.
//  4. Pagamento sem perfil NAO e perdido: fica gravado como "orfao" para reconciliacao.
//  5. O fim do acesso (plano_ativo_ate) e calculado pelo periodo da COBRANCA, nunca por "agora".
// Estados do evento (tabela asaas_eventos): processado | ignorado | rejeitado | orfao | erro.
// Procure alertas nos Runtime Logs da Vercel por "[Webhook Asaas][ALERTA]".
// =====================================================================================

export type WebhookResultado = { status: number; body: Record<string, unknown> }
export type WebhookDeps = {
  supabase: SupabaseClient
  env: Record<string, string | undefined>
  fetchFn?: (url: string, init?: any) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>
}

const PAGAMENTO = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']
const ATRASO = ['PAYMENT_OVERDUE', 'PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED']
const CANCELAMENTO = ['SUBSCRIPTION_DELETED', 'SUBSCRIPTION_CANCELLED']
const STATUS_PAGO = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const COLUNAS_PERFIL = 'user_id, billing_cycle, status_acesso, plano_tipo, plano_ativo_ate, primeiro_pagamento_confirmado, data_primeiro_pagamento, gateway_customer_id, gateway_subscription_id'

class ErroTemporario extends Error {}   // o Asaas deve tentar de novo (responde 500)

function log(etapa: string, dados: Record<string, unknown> = {}) { console.log(`[Webhook Asaas] ${etapa}`, JSON.stringify(dados)) }
function alerta(motivo: string, dados: Record<string, unknown> = {}) { console.error(`[Webhook Asaas][ALERTA] ${motivo}`, JSON.stringify(dados)) }

// ---------- Token ----------
export function emProducao(env: Record<string, string | undefined>): boolean {
  return env.VERCEL_ENV ? env.VERCEL_ENV === 'production' : env.NODE_ENV === 'production'
}

// Normaliza o token antes de comparar: tira espacos, quebras de linha (\n, \r) e aspas acidentais
// nas pontas. Aplicado dos DOIS lados (o enviado pelo Asaas e o da variavel de ambiente).
export function limparToken(v: string | undefined | null): string {
  let t = (v || '').trim()
  if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) t = t.slice(1, -1).trim()
  return t
}
const impressao = (t: string) => (t ? crypto.createHash('sha256').update(t).digest('hex').slice(0, 8) : null)

// Diagnostico SEM segredo: nunca contem o token. A "impressao" sao so os 8 primeiros caracteres do
// SHA-256 do token (nao reversivel para um token longo e aleatorio); serve para comparar, sem expor
// o valor, se o token que chegou e o configurado sao o mesmo (dá para calcular a mesma impressao do
// token que voce tem guardado e conferir).
export type DiagnosticoToken = {
  tokenRecebidoExiste: boolean; tokenEsperadoExiste: boolean
  tamanhoRecebido: number; tamanhoEsperado: number
  tokensIguais: boolean; impressaoRecebido: string | null; impressaoEsperado: string | null
}

// Em PRODUCAO o token e obrigatorio: sem ASAAS_WEBHOOK_TOKEN configurado, TODA requisicao e recusada.
// Fora de producao (desenvolvimento/preview) sem token configurado, nao valida (como antes).
export function validarTokenWebhook(env: Record<string, string | undefined>, tokenRecebido: string): { ok: boolean; motivo?: string; diagnostico: DiagnosticoToken } {
  const esperado = limparToken(env.ASAAS_WEBHOOK_TOKEN)
  const recebido = limparToken(tokenRecebido)
  const a = crypto.createHash('sha256').update(recebido).digest()
  const b = crypto.createHash('sha256').update(esperado).digest()
  const iguais = !!esperado && crypto.timingSafeEqual(a, b)   // comparacao em tempo constante
  const diagnostico: DiagnosticoToken = {
    tokenRecebidoExiste: !!recebido, tokenEsperadoExiste: !!esperado,
    tamanhoRecebido: recebido.length, tamanhoEsperado: esperado.length,
    tokensIguais: iguais, impressaoRecebido: impressao(recebido), impressaoEsperado: impressao(esperado),
  }
  if (!esperado) return emProducao(env) ? { ok: false, motivo: 'ASAAS_WEBHOOK_TOKEN ausente em producao: webhook recusado', diagnostico } : { ok: true, diagnostico }
  return iguais ? { ok: true, diagnostico } : { ok: false, motivo: recebido ? 'token recebido diferente do configurado' : 'token ausente na requisicao (nenhum header de token recebido)', diagnostico }
}

// ---------- Regra de comissao (copiada SEM alteracao do webhook anterior; idempotente por payment id no banco) ----------
// Planos que podem gerar comissao de parceiro - Free nunca entra aqui (sem mensalidade,
// sem pagamento real). 'essencial' e o valor interno do MiniPage Pro - nunca criamos 'pro'.
const PLANOS_COMISSIONAVEIS = ['minipage', 'loja', 'essencial', 'equipe']

// Fase 3B: tenta registrar a comissao de um parceiro para um pagamento ja confirmado pelo
// Asaas. Roda DEPOIS que o acesso do cliente ja foi liberado com sucesso (ver ponto de
// chamada dentro do handler) - qualquer falha aqui NUNCA desfaz nem afeta o pagamento
// principal, so loga e segue. Toda a logica de negocio sensivel (janela de 12 meses, limite
// de 12 comissoes, calculo do valor, idempotencia por asaas_payment_id) mora inteiramente
// dentro da funcao SQL registrar_comissao_pagamento (Fase 3A) - esta funcao SO localiza os
// dados corretos e valida o payload antes de chamar a RPC, nunca duplica essa logica.
export async function registrarComissaoParceiro(
  supabase: any,
  params: { userId: string; planoTipo: string | null; payment: any; cicloCobranca?: string | null }
) {
  const prefixo = '[Webhook Asaas][Comissão]'
  const { userId, planoTipo, payment, cicloCobranca } = params

  try {
    // ---- Ajuste 2: plano precisa ser um dos 4 comissionaveis ----
    const planoNormalizado = normalizarPlano(planoTipo)
    if (!PLANOS_COMISSIONAVEIS.includes(planoNormalizado)) {
      console.log(`${prefixo} Plano não elegível para comissão (${planoNormalizado}) - user_id: ${userId} - nenhuma comissão gerada`)
      return
    }

    // ---- Ajuste 3: validacao do payload financeiro, antes de qualquer busca ----
    const paymentId = payment?.id
    if (!paymentId || typeof paymentId !== 'string' || !paymentId.trim()) {
      console.log(`${prefixo} payment.id ausente ou inválido - nenhuma comissão gerada`)
      return
    }

    const valorPago = Number(payment?.value)
    if (!Number.isFinite(valorPago) || valorPago <= 0) {
      console.log(`${prefixo} payment.value inválido (payment.id: ${paymentId}) - nenhuma comissão gerada`)
      return
    }

    // ---- Ajuste 1: data financeira confiavel, NUNCA new Date() como fallback ----
    const dataStr = payment?.paymentDate || payment?.confirmedDate
    const dataPagamento = dataStr ? new Date(dataStr) : null
    if (!dataStr || !dataPagamento || Number.isNaN(dataPagamento.getTime())) {
      console.log(`${prefixo} Pagamento sem data financeira confiável (payment.id: ${paymentId})`)
      return
    }

    // ---- Obtem o e-mail do usuario via Supabase Admin (perfis nao guarda email) ----
    const { data: userData, error: erroUser } = await supabase.auth.admin.getUserById(userId)
    if (erroUser || !userData?.user?.email) {
      console.error(`${prefixo} Não foi possível obter e-mail do usuário (user_id: ${userId}, payment.id: ${paymentId})`)
      return
    }
    const emailNormalizado = userData.user.email.trim().toLowerCase()

    // ---- Busca TODAS as indicacoes compatives - nunca .single(), pra poder detectar
    // ambiguidade em vez de escolher a primeira silenciosamente ----
    const { data: indicacoes, error: erroIndicacoes } = await supabase
      .from('indicacoes_parceiros')
      .select('id, parceiro_id')
      .eq('email', emailNormalizado)

    if (erroIndicacoes) {
      console.error(`${prefixo} Erro ao buscar indicação (payment.id: ${paymentId}):`, erroIndicacoes.message)
      return
    }

    if (!indicacoes || indicacoes.length === 0) {
      console.log(`${prefixo} Sem indicação de parceiro para este cliente (payment.id: ${paymentId}) - nenhuma comissão gerada`)
      return
    }

    if (indicacoes.length > 1) {
      console.error(`${prefixo} Ambiguidade: ${indicacoes.length} indicações encontradas para o mesmo e-mail (payment.id: ${paymentId}, user_id: ${userId}) - nenhuma comissão gerada`)
      return
    }

    const indicacao = indicacoes[0]

    // ---- Chama a RPC - toda a regra de negocio (janela, limite, calculo, idempotencia)
    // fica dentro dela, nao duplicada aqui ----
    const { error: erroRpc } = await (supabase.rpc as any)('registrar_comissao_pagamento', {
      p_indicacao_id: indicacao.id,
      p_parceiro_id: indicacao.parceiro_id,
      p_user_id: userId,
      p_asaas_payment_id: paymentId,
      p_plano_tipo: planoNormalizado,
      p_valor_pago: valorPago,
      p_percentual: 0.20,
      p_data_pagamento_cliente: dataPagamento.toISOString(),
      // Validacao estrita - NUNCA usar normalizarBillingCycle() aqui, ela transformaria
      // valor ausente em 'mensal' (fallback ja usado noutro lugar deste arquivo pra
      // calcular data de expiracao de acesso, mas errado pra congelar o ciclo real da
      // comissao). Melhor NULL do que informacao inventada.
      p_ciclo_cobranca: cicloCobranca === 'mensal' || cicloCobranca === 'anual' ? cicloCobranca : null,
    })

    if (erroRpc) {
      const msg = erroRpc.message || ''
      if (msg.includes('janela de 12 meses')) {
        console.log(`${prefixo} Fora da janela de 12 meses (payment.id: ${paymentId}, indicacao: ${indicacao.id})`)
      } else if (msg.includes('Limite de 12 comissões')) {
        console.log(`${prefixo} Limite de 12 comissões já atingido (payment.id: ${paymentId}, indicacao: ${indicacao.id})`)
      } else if (msg.includes('Divergência')) {
        console.error(`${prefixo} Divergência indicação/parceiro (payment.id: ${paymentId}):`, msg)
      } else {
        console.error(`${prefixo} Erro inesperado da RPC (payment.id: ${paymentId}):`, msg)
      }
      return
    }

    console.log(`${prefixo} Comissão registrada com sucesso (payment.id: ${paymentId}, indicacao: ${indicacao.id})`)
  } catch (err: any) {
    // Rede de seguranca final - qualquer excecao inesperada aqui NUNCA propaga pro handler
    // principal, so loga.
    console.error(`${prefixo} Erro inesperado ao processar comissão:`, err?.message || err)
  }
}

// ---------- Datas (periodo da COBRANCA, nunca "agora") ----------
function dataISO(v: unknown): string | null { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null }
function addMeses(base: string, n: number): Date {
  const [a, m, d] = base.split('-').map(Number)
  const alvo = new Date(Date.UTC(a, m - 1 + n, 1))
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate()
  alvo.setUTCDate(Math.min(d, ultimoDia))   // 31/jan + 1 mes = 28 ou 29/fev, nunca 3/mar
  return alvo
}
// Fim do acesso coberto por UMA cobranca: 1 mes (mensal) ou 12 meses (anual) a partir do maior entre
// o vencimento e a data do pagamento. Depende so da cobranca: reprocessar da o mesmo resultado.
export function fimDoAcesso(pg: any, ciclo: 'mensal' | 'anual'): Date | null {
  const venc = dataISO(pg?.dueDate)
  const pago = dataISO(pg?.paymentDate) || dataISO(pg?.confirmedDate) || dataISO(pg?.clientPaymentDate)
  const base = [venc, pago].filter((x): x is string => !!x).sort().pop()
  return base ? addMeses(base, ciclo === 'anual' ? 12 : 1) : null
}

// ID do evento (o Asaas manda "id" no topo). Sem ele, usa uma chave sintetica estavel para ainda deduplicar.
function idDoEvento(evento: any, bodyTexto: string): { id: string; sintetico: boolean } {
  const bruto = typeof evento?.id === 'string' ? evento.id.trim() : ''
  if (bruto) return { id: bruto.slice(0, 200), sintetico: false }
  const ref = evento?.payment?.id || evento?.subscription?.id
  const sufixo = ref || crypto.createHash('sha256').update(bodyTexto || '').digest('hex').slice(0, 32)
  return { id: `sintetico:${evento?.event}:${sufixo}`, sintetico: true }
}

// ---------- Localizar o perfil (assinatura -> cliente -> referencia externa segura) ----------
async function localizarPerfil(supabase: SupabaseClient, ids: { subscriptionId: string | null; customerId: string | null; externalRef: string | null }) {
  const buscar = async (coluna: string, valor: string) => {
    const { data, error } = await supabase.from('perfis').select(COLUNAS_PERFIL).eq(coluna, valor).limit(2)
    if (error) throw new ErroTemporario('erro ao buscar perfil: ' + error.message)
    return (data || []) as any[]
  }
  if (ids.subscriptionId) {
    const r = await buscar('gateway_subscription_id', ids.subscriptionId)
    if (r.length > 1) return { ambiguo: true as const }
    if (r.length === 1) return { perfil: r[0], via: 'assinatura' as const }
  }
  if (ids.customerId) {
    const r = await buscar('gateway_customer_id', ids.customerId)
    if (r.length > 1) return { ambiguo: true as const }
    if (r.length === 1) return { perfil: r[0], via: 'cliente' as const }
  }
  // Referencia externa (user_id gravado por nos no Asaas): so vale se NAO contradiz os ids ja salvos no perfil.
  if (ids.externalRef && UUID.test(ids.externalRef)) {
    const r = await buscar('user_id', ids.externalRef)
    const p = r[0]
    if (p && (!p.gateway_customer_id || !ids.customerId || p.gateway_customer_id === ids.customerId)
          && (!p.gateway_subscription_id || !ids.subscriptionId || p.gateway_subscription_id === ids.subscriptionId))
      return { perfil: p, via: 'referencia_externa' as const }
  }
  return {}
}

// ---------- Confirmar o pagamento no proprio Asaas ----------
async function consultarPagamento(deps: WebhookDeps, paymentId: string): Promise<{ ok: true; pg: any } | { ok: false; motivo: string }> {
  const amb = avaliarAmbienteAsaas(deps.env)
  if (!amb.ok) throw new ErroTemporario('ambiente do Asaas invalido para confirmar o pagamento: ' + amb.motivo)
  const f = deps.fetchFn || (fetch as any)
  const res = await f(`${amb.baseUrl}/payments/${encodeURIComponent(paymentId)}`, { method: 'GET', headers: { 'Content-Type': 'application/json', access_token: deps.env.ASAAS_API_KEY || '' } })
  if (res.status === 404) return { ok: false, motivo: 'pagamento nao existe no Asaas' }
  if (!res.ok) throw new ErroTemporario(`Asaas respondeu ${res.status} ao confirmar o pagamento`)
  let pg: any = {}
  try { pg = JSON.parse(await res.text()) } catch { /* fica vazio */ }
  if (pg?.id !== paymentId) return { ok: false, motivo: 'resposta do Asaas nao corresponde ao pagamento do evento' }
  return { ok: true, pg }
}

// Devolve o motivo da recusa, ou null se o pagamento confere com o perfil.
export function conferirPagamento(pg: any, perfil: any): string | null {
  if (!STATUS_PAGO.includes(pg?.status)) return `status do pagamento no Asaas: ${pg?.status || 'desconhecido'} (nao esta pago)`
  const plano = normalizarPlano(perfil.plano_tipo)
  if (plano === 'free') return 'perfil e Free: nao deve gerar ativacao por pagamento'
  // 1) o pagamento e DESTE cliente
  if (perfil.gateway_customer_id) { if (pg.customer !== perfil.gateway_customer_id) return 'pagamento pertence a outro cliente do Asaas' }
  else if (pg.externalReference !== perfil.user_id) return 'perfil sem cliente salvo e pagamento sem referencia deste usuario'
  // 2) ciclo: mensal = pagamento da assinatura registrada no perfil; anual = cobranca unica (sem assinatura)
  const ciclo = normalizarBillingCycle(perfil.billing_cycle)
  if (ciclo === 'mensal') {
    if (!perfil.gateway_subscription_id || pg.subscription !== perfil.gateway_subscription_id) return 'pagamento nao pertence a assinatura registrada no perfil'
  } else if (pg.subscription) return 'ciclo anual mas o pagamento e de uma assinatura recorrente'
  // 3) valor: o preco do plano/ciclo na configuracao do sistema (mesma fonte usada para criar a cobranca)
  const esperado = obterPrecoPlanoPorCiclo(plano, ciclo)
  if (!Number.isFinite(Number(pg.value)) || Math.abs(Number(pg.value) - esperado) > 0.009) return `valor pago R$ ${pg.value} diferente do esperado R$ ${esperado} (${plano}/${ciclo})`
  return null
}

// =====================================================================================
export async function processarEventoAsaas(deps: WebhookDeps, evento: any, bodyTexto: string): Promise<WebhookResultado> {
  const { supabase } = deps
  const tipo: string | undefined = evento?.event
  if (!tipo) return { status: 200, body: { ok: true, ignorado: 'sem campo event' } }
  const acao = PAGAMENTO.includes(tipo) ? 'pago' : ATRASO.includes(tipo) ? 'atraso' : CANCELAMENTO.includes(tipo) ? 'cancelamento' : null
  // Eventos informativos (PAYMENT_CREATED, PAYMENT_UPDATED, PAYMENT_DELETED...) nao alteram acesso.
  // PAYMENT_DELETED NAO cancela mais a conta: excluir UMA cobranca nao e cancelar a assinatura.
  if (!acao) { log('EVENTO_INFORMATIVO', { tipo }); return { status: 200, body: { ok: true, ignorado: 'evento informativo' } } }

  const payment = evento?.payment
  const subscription = evento?.subscription
  const paymentId: string | null = payment?.id || null
  const subscriptionId: string | null = payment?.subscription || subscription?.id || null
  const customerId: string | null = payment?.customer || subscription?.customer || null
  const externalRef: string | null = payment?.externalReference || subscription?.externalReference || null
  const { id: eventId, sintetico } = idDoEvento(evento, bodyTexto)
  const valorEvt = Number(payment?.value)
  const vencEvt = dataISO(payment?.dueDate)
  const dataEvt = dataISO(payment?.paymentDate) || dataISO(payment?.confirmedDate) || dataISO(evento?.dateCreated)

  // ---- 1) IDEMPOTENCIA: reivindicacao atomica do evento ----
  const { data: reiv, error: erroReiv } = await supabase.rpc('asaas_evento_reivindicar', {
    p_event_id: eventId, p_tipo: tipo, p_payment_id: paymentId, p_subscription_id: subscriptionId, p_customer_id: customerId,
    p_valor: Number.isFinite(valorEvt) ? valorEvt : null, p_vencimento: vencEvt, p_data_evento: dataEvt, p_payload: evento,
  })
  if (erroReiv) {
    // Sem a trava de idempotencia NAO se processa pagamento (fail-closed): o Asaas tenta de novo depois.
    alerta('IDEMPOTENCIA INDISPONIVEL: migration asaas_eventos nao aplicada? Evento NAO processado', { tipo, erro: erroReiv.message })
    return { status: 503, body: { error: 'Idempotência indisponível' } }
  }
  if (reiv?.acao === 'duplicado') { log('EVENTO_DUPLICADO', { eventId, tipo, statusAnterior: reiv.status }); return { status: 200, body: { ok: true, duplicado: true } } }
  if (reiv?.acao === 'em_andamento') { log('EVENTO_EM_ANDAMENTO', { eventId, tipo }); return { status: 409, body: { error: 'Evento em processamento' } } }
  if (sintetico) log('EVENTO_SEM_ID', { tipo, chave: eventId })

  const fechar = async (status: 'processado' | 'ignorado' | 'rejeitado' | 'orfao' | 'erro', motivo: string | null, extra: { userId?: string; vencimento?: string | null; valor?: number } = {}) => {
    const upd: Record<string, unknown> = { status, motivo, atualizado_em: new Date().toISOString() }
    if (extra.userId) upd.user_id = extra.userId
    if (extra.vencimento) upd.vencimento = extra.vencimento
    if (extra.valor !== undefined && Number.isFinite(extra.valor)) upd.valor = extra.valor
    const { error } = await supabase.from('asaas_eventos').update(upd).eq('event_id', eventId)
    if (error) console.error('[Webhook Asaas] nao foi possivel fechar o evento (os efeitos sao idempotentes; sera reprocessado se reenviado):', error.message)
  }
  const ok = (resultado: string, extra: Record<string, unknown> = {}): WebhookResultado => ({ status: 200, body: { ok: true, resultado, ...extra } })

  try {
    // ---- 2) Localizar o perfil ----
    const loc = await localizarPerfil(supabase, { subscriptionId, customerId, externalRef })
    if ('ambiguo' in loc) {
      alerta('ID do gateway pertence a mais de um perfil - nada foi ativado', { eventId, paymentId, subscriptionId, customerId })
      await fechar('rejeitado', 'mais de um perfil com o mesmo id do gateway'); return ok('rejeitado')
    }
    const perfil = (loc as any).perfil
    if (!perfil) {
      if (acao === 'pago') {
        // Pagamento SEM perfil: nunca e descartado. Fica gravado (com o payload completo) para reconciliacao.
        alerta('PAGAMENTO ORFAO - cliente pagou e nenhum perfil foi localizado (reconciliar na tabela asaas_eventos, status=orfao)', { eventId, paymentId, subscriptionId, customerId, valor: valorEvt, vencimento: vencEvt })
        await fechar('orfao', 'nenhum perfil localizado por assinatura, cliente ou referencia externa'); return ok('orfao')
      }
      await fechar('ignorado', 'perfil nao localizado (evento nao financeiro de ativacao)'); return ok('ignorado')
    }
    const userId: string = perfil.user_id
    const rejeitar = async (motivo: string, extra: Record<string, unknown> = {}) => { alerta('EVENTO REJEITADO: ' + motivo, { eventId, tipo, paymentId, userId, ...extra }); await fechar('rejeitado', motivo, { userId }); return ok('rejeitado', { motivo }) }
    const ignorar = async (motivo: string) => { log('EVENTO_IGNORADO', { eventId, tipo, motivo }); await fechar('ignorado', motivo, { userId }); return ok('ignorado', { motivo }) }

    // Maior vencimento ja APLICADO como pago para este usuario (para ordenar as obrigacoes)
    const ultimoVencimentoPago = async (): Promise<string | null> => {
      const { data, error } = await supabase.from('asaas_eventos').select('vencimento').eq('user_id', userId).eq('status', 'processado').in('tipo', PAGAMENTO).order('vencimento', { ascending: false }).limit(1)
      if (error) throw new ErroTemporario('erro ao consultar historico: ' + error.message)
      return (data as any[])?.[0]?.vencimento || null
    }

    // ================= PAGAMENTO CONFIRMADO/RECEBIDO =================
    if (acao === 'pago') {
      if (!paymentId) return rejeitar('evento de pagamento sem id do pagamento')
      // Conta cancelada nunca reativa sozinha por um evento (pode ser reenvio antigo): revisao manual.
      if (perfil.status_acesso === 'cancelado') return rejeitar('conta CANCELADA: pagamento exige revisao manual (nao reativa sozinho)')
      // O mesmo pagamento chega como CONFIRMED e depois RECEIVED: so o primeiro tem efeito.
      const { data: anterior, error: erroAnt } = await supabase.from('asaas_eventos').select('event_id').eq('payment_id', paymentId).eq('status', 'processado').in('tipo', PAGAMENTO).neq('event_id', eventId).limit(1)
      if (erroAnt) throw new ErroTemporario('erro ao consultar historico: ' + erroAnt.message)
      if ((anterior as any[])?.length) return ignorar(`pagamento ja aplicado pelo evento ${(anterior as any[])[0].event_id}`)

      // Confirmacao no Asaas (nao confia so no corpo recebido)
      const v = await consultarPagamento(deps, paymentId)
      if (!v.ok) return rejeitar(v.motivo)
      const pg = v.pg
      const motivoRecusa = conferirPagamento(pg, perfil)
      if (motivoRecusa) return rejeitar(motivoRecusa, { valorPago: pg.value })

      const ciclo = normalizarBillingCycle(perfil.billing_cycle)
      const vencimento = dataISO(pg.dueDate)
      // Ordem das obrigacoes: um pagamento mais antigo que o ultimo ja aplicado nao muda a conta.
      if (perfil.status_acesso !== 'aguardando_pagamento' && vencimento) {
        const ultimo = await ultimoVencimentoPago()
        if (ultimo && vencimento <= ultimo) return ignorar(`pagamento (venc. ${vencimento}) nao e posterior ao ultimo aplicado (venc. ${ultimo})`)
      }
      const fim = fimDoAcesso(pg, ciclo)
      if (!fim) return rejeitar('cobranca sem data de vencimento nem de pagamento: nao da para calcular o periodo')
      const atual = perfil.plano_ativo_ate ? new Date(perfil.plano_ativo_ate) : null
      const novoFim = atual && !Number.isNaN(atual.getTime()) && atual > fim ? atual : fim   // nunca reduz

      const { error: erroUpd } = await supabase.from('perfis').update({ status_acesso: 'ativo', gateway: 'asaas', plano_ativo_ate: novoFim.toISOString() }).eq('user_id', userId)
      if (erroUpd) throw new ErroTemporario('erro ao liberar acesso: ' + erroUpd.message)
      log('ACESSO_LIBERADO', { userId, tipo, paymentId, ate: novoFim.toISOString().slice(0, 10) })

      // Comissao: roda DEPOIS do acesso; usa o pagamento CONFIRMADO no Asaas; a regra no banco e idempotente por payment id.
      try {
        await registrarComissaoParceiro(supabase, { userId, planoTipo: perfil.plano_tipo, payment: pg, cicloCobranca: perfil.billing_cycle })
      } catch (erroComissao: any) {
        console.error('[Webhook Asaas][Comissão] Erro inesperado (fora do helper):', erroComissao?.message || erroComissao)
      }
      // PRIMEIRO pagamento: marcado uma unica vez, depois do acesso e da comissao.
      if (perfil.primeiro_pagamento_confirmado !== true) {
        const dp = dataISO(pg.paymentDate) || dataISO(pg.confirmedDate)
        const dataPrimeiro = dp ? new Date(dp + 'T00:00:00.000Z') : new Date()
        const { error: erroPrim } = await supabase.from('perfis').update({
          primeiro_pagamento_confirmado: true,
          ...(perfil.data_primeiro_pagamento ? {} : { data_primeiro_pagamento: dataPrimeiro.toISOString() }),
        }).eq('user_id', userId)
        if (erroPrim) console.error('[Webhook Asaas] Erro ao marcar primeiro pagamento (acesso ja liberado):', erroPrim.message)
      }
      await fechar('processado', null, { userId, vencimento, valor: Number(pg.value) })
      return ok('processado')
    }

    // ================= ATRASO / ESTORNO / CONTESTACAO =================
    if (acao === 'atraso') {
      // So derruba quem esta ATIVO; nunca mexe em conta aguardando o 1o pagamento, ja em atraso ou cancelada.
      if (perfil.status_acesso !== 'ativo') return ignorar(`conta esta "${perfil.status_acesso}": evento nao altera`)
      if (perfil.gateway_customer_id && customerId && perfil.gateway_customer_id !== customerId) return rejeitar('evento de outro cliente do Asaas')
      if (perfil.gateway_subscription_id && subscriptionId && perfil.gateway_subscription_id !== subscriptionId) return ignorar('cobranca de outra assinatura (nao e a atual do perfil)')
      // Atraso de uma cobranca que JA foi paga nao pode derrubar quem pagou.
      if (tipo === 'PAYMENT_OVERDUE' && paymentId) {
        const { data: paga } = await supabase.from('asaas_eventos').select('event_id').eq('payment_id', paymentId).eq('status', 'processado').in('tipo', PAGAMENTO).limit(1)
        if ((paga as any[])?.length) return ignorar('cobranca ja foi paga')
      }
      const ultimo = await ultimoVencimentoPago()
      if (ultimo && vencEvt && vencEvt < ultimo) return ignorar(`evento de cobranca antiga (venc. ${vencEvt}) anterior ao ultimo pagamento aplicado (venc. ${ultimo})`)
      const { error: erroUpd } = await supabase.from('perfis').update({ status_acesso: 'em_atraso' }).eq('user_id', userId)
      if (erroUpd) throw new ErroTemporario('erro ao marcar atraso: ' + erroUpd.message)
      log('MARCADO_EM_ATRASO', { userId, tipo })
      await fechar('processado', null, { userId }); return ok('processado')
    }

    // ================= ASSINATURA CANCELADA =================
    const subId = subscription?.id || payment?.subscription || null
    if (!perfil.gateway_subscription_id || perfil.gateway_subscription_id !== subId) return ignorar('assinatura cancelada nao e a atual do perfil (ex: duplicada removida)')
    if (perfil.status_acesso === 'cancelado') return ignorar('conta ja cancelada')
    if (perfil.status_acesso === 'aguardando_pagamento') return ignorar('assinatura removida antes do primeiro pagamento: o checkout cria outra')
    const { error: erroCanc } = await supabase.from('perfis').update({ status_acesso: 'cancelado' }).eq('user_id', userId)
    if (erroCanc) throw new ErroTemporario('erro ao cancelar: ' + erroCanc.message)
    log('MARCADO_CANCELADO', { userId, tipo })
    await fechar('processado', null, { userId }); return ok('processado')
  } catch (err: any) {
    // Falha temporaria (banco, Asaas fora do ar): marca como erro e responde 500 -> o Asaas reenvia e o evento e reprocessado.
    console.error('[Webhook Asaas] Falha ao processar evento (sera reenviado):', err?.message || err)
    await fechar('erro', String(err?.message || err).slice(0, 300))
    return { status: 500, body: { error: 'Erro interno' } }
  }
}
