import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { obterPrecoPlanoPorCiclo } from './planos'
import { avaliarAmbienteAsaas } from './asaas-ambiente'

// Altera o valor da assinatura MENSAL JA EXISTENTE de um cliente no Asaas (nunca cria assinatura).
// So roda no servidor. A rota fina (app/api/admin/clientes/alterar-plano/route.ts) so autentica o
// administrador e chama alterarPlano().
//
// DUAS operacoes (primeira versao):
//   upgrade        plano mensal -> plano mensal SUPERIOR (minipage < loja < essencial < equipe).
//                  Ordem: ASAAS PRIMEIRO, confirmado e verificado; BANCO DEPOIS (perfis.plano_tipo).
//                  Se o Asaas falhar, o plano antigo e mantido. Se o banco falhar, o valor e revertido.
//   sincronizacao  o plano do sistema ja esta certo, mas o valor da assinatura no Asaas esta MENOR
//                  que o preco do plano. Ajusta SO o valor futuro. ZERO escritas no Supabase.
//
// Fora do escopo (recusado): downgrade, free, anual, troca de ciclo/vencimento/forma de pagamento,
// cancelamento, criacao de nova assinatura, contas que nao estejam "ativo".
//
// O PUT envia somente { value } e, se houver cobranca em aberto, { updatePendingPayments: true }.
// Nunca envia description, nextDueDate, cycle, billingType, status nem customer.
//
// DRY RUN (padrao): so le (Supabase + GET no Asaas), nunca faz PUT, e devolve uma "confirmacao"
// (SHA-256 do estado lido). A execucao real exige dryRun === false E essa confirmacao; o servidor
// relê tudo e so prossegue se o estado ainda for identico. A confirmacao protege contra dados
// velhos/errados - nao e uma assinatura criptografica.
//
// Logs (Runtime Logs da Vercel, filtre por "[Asaas][alterar-plano]"): nunca registramos chave da API
// nem o corpo bruto das respostas.

// Mesmo padrao restrito de app/api/admin/clientes/route.ts: um unico e-mail autorizado.
export const EMAIL_ADMIN_ALTERAR_PLANO = 'misteriosoviaje@gmail.com'
export function ehAdminAlterarPlano(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === EMAIL_ADMIN_ALTERAR_PLANO
}

// Ordem crescente. Lista EXPLICITA: normalizarPlano() de planos.ts cai em 'essencial' (R$ 79,90) para
// qualquer valor desconhecido, entao NUNCA pode validar o plano de destino.
const ORDEM_PLANOS = ['minipage', 'loja', 'essencial', 'equipe'] as const
type PlanoPago = typeof ORDEM_PLANOS[number]
function planoPagoOuNull(v: unknown): PlanoPago | null {
  return typeof v === 'string' && (ORDEM_PLANOS as readonly string[]).includes(v) ? (v as PlanoPago) : null
}
const precoMensal = (p: PlanoPago): number => obterPrecoPlanoPorCiclo(p, 'mensal')

// Nesta versao so Pix. Cartao pode exigir tokenizacao na conta Asaas (configuracao manual): nao executa.
const BILLING_TYPES_PERMITIDOS = ['PIX']

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const centavos = (n: number) => Math.round(n * 100)

export type AlterarPlanoDeps = {
  supabase: SupabaseClient
  env: Record<string, string | undefined>
  fetchFn?: (url: string, init?: any) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>
}
export type AlterarPlanoInput = { userId: unknown; novoPlano: unknown; dryRun?: boolean; confirmacao?: unknown }
export type AlterarPlanoResultado = { status: number; body: Record<string, unknown> }

export type Cobranca = { id: string; status: string; valor: number; vencimento: string | null; billingType: string | null }
export type Analise = {
  operacao: 'upgrade' | 'sincronizacao' | 'downgrade' | 'invalida'
  recuperacao: boolean
  userId: string
  planoAtual: string | null
  planoDestino: string
  precoEsperado: number
  valorAtualAsaas: number | null
  billingType: string | null
  gatewaySubscriptionId: string | null
  gatewayCustomerId: string | null
  cicloPerfil: string | null
  cicloAsaas: string | null
  proximoVencimento: string | null
  statusAcesso: string | null
  cobrancasPendentes: Cobranca[]
  ambiente: string
  acaoNoAsaas: 'put_valor' | 'nenhuma'
  enviaraUpdatePendingPayments: boolean
  escreveNoBanco: boolean
  executavel: boolean
  bloqueios: string[]
}

class ErroAlterarPlano extends Error {
  constructor(public status: number, public corpo: Record<string, unknown>) { super(String(corpo.error || 'erro')) }
}
function log(etapa: string, dados: Record<string, unknown> = {}) { console.log(`[Asaas][alterar-plano] ${etapa}`, JSON.stringify(dados)) }
function logErro(etapa: string, dados: Record<string, unknown> = {}) { console.error(`[Asaas][alterar-plano] ${etapa}`, JSON.stringify(dados)) }

type RespostaAsaas = { ok: boolean; status: number; data: any }
type ClienteAsaas = { asaas: (metodo: string, caminho: string, corpo?: unknown) => Promise<RespostaAsaas>; ambiente: string }

function criarClienteAsaas(deps: AlterarPlanoDeps): ClienteAsaas {
  const amb = avaliarAmbienteAsaas(deps.env)
  if (!amb.ok) throw new ErroAlterarPlano(503, { codigo: 'GATEWAY_INDISPONIVEL', error: 'Configuração do Asaas inválida: ' + amb.motivo })
  const baseUrl = amb.baseUrl
  const fetchFn = deps.fetchFn || (fetch as any)
  async function asaas(metodo: string, caminho: string, corpo?: unknown): Promise<RespostaAsaas> {
    let res: { ok: boolean; status: number; text(): Promise<string> }
    try {
      res = await fetchFn(`${baseUrl}${caminho}`, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', access_token: deps.env.ASAAS_API_KEY || '' },
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
        signal: AbortSignal.timeout(15000),
      })
    } catch {
      throw new ErroAlterarPlano(502, { codigo: 'ASAAS_INDISPONIVEL', error: 'Não foi possível falar com o Asaas agora. Nada foi alterado.' })
    }
    const texto = await res.text()
    let data: any = {}
    try { data = texto ? JSON.parse(texto) : {} } catch { /* resposta nao-JSON */ }
    if (!res.ok) logErro(`${metodo} ${caminho.split('?')[0]} -> ${res.status}`, { erro: JSON.stringify(data?.errors || data?.error || '').slice(0, 300) })
    return { ok: res.ok, status: res.status, data }
  }
  return { asaas, ambiente: amb.ambiente }
}

function resumirErroAsaas(data: any): string {
  return JSON.stringify(data?.errors || data?.error || '').slice(0, 300)
}

async function listarPendentes(asaas: ClienteAsaas['asaas'], subId: string): Promise<Cobranca[]> {
  const todas: Cobranca[] = []
  for (const st of ['PENDING', 'OVERDUE']) {
    const r = await asaas('GET', `/payments?subscription=${encodeURIComponent(subId)}&status=${st}&limit=50`)
    if (!r.ok) throw new ErroAlterarPlano(502, { codigo: 'ASAAS_FALHA_LEITURA', error: 'Não foi possível consultar as cobranças da assinatura. Nada foi alterado.', asaasStatus: r.status })
    const lista = Array.isArray(r.data?.data) ? r.data.data : []
    for (const p of lista) {
      if (!p?.id || p.deleted === true || p.subscription !== subId) continue   // nunca confia so no filtro da URL
      todas.push({ id: String(p.id), status: String(p.status || st), valor: Number(p.value), vencimento: p.dueDate ? String(p.dueDate) : null, billingType: p.billingType ? String(p.billingType) : null })
    }
  }
  return todas
}

// Le o estado atual. SOMENTE LEITURA (Supabase .select + GET no Asaas). Usada pelo dryRun e pela execucao real.
async function analisar(deps: AlterarPlanoDeps, cli: ClienteAsaas, userId: string, novo: PlanoPago): Promise<{ analise: Analise; perfil: any }> {
  const { data: perfil, error: erroPerfil } = await deps.supabase.from('perfis')
    .select('plano_tipo, billing_cycle, status_acesso, gateway_customer_id, gateway_subscription_id, primeiro_pagamento_confirmado')
    .eq('user_id', userId).maybeSingle()
  if (erroPerfil) throw new ErroAlterarPlano(500, { error: 'Erro ao ler o perfil.' })
  if (!perfil) throw new ErroAlterarPlano(404, { codigo: 'PERFIL_NAO_ENCONTRADO', error: 'Perfil não encontrado.' })

  const bloqueios: string[] = []
  const atual = planoPagoOuNull(perfil.plano_tipo)
  const precoNovo = precoMensal(novo)

  let operacao: Analise['operacao'] = 'invalida'
  if (!atual) bloqueios.push('Plano atual inválido ou Free: esta operação só vale para planos pagos.')
  else {
    const iAtual = ORDEM_PLANOS.indexOf(atual), iNovo = ORDEM_PLANOS.indexOf(novo)
    if (iNovo > iAtual) operacao = 'upgrade'
    else if (iNovo === iAtual) operacao = 'sincronizacao'
    else { operacao = 'downgrade'; bloqueios.push('Downgrade não é suportado nesta versão.') }
  }

  if (perfil.status_acesso !== 'ativo') bloqueios.push(`Conta com status_acesso "${perfil.status_acesso}": só contas "ativo" são aceitas.`)
  if (perfil.primeiro_pagamento_confirmado !== true) bloqueios.push('Primeiro pagamento ainda não confirmado.')
  if (perfil.billing_cycle !== 'mensal') bloqueios.push(`Ciclo do perfil é "${perfil.billing_cycle}": só planos mensais são aceitos.`)
  const subId: string | null = perfil.gateway_subscription_id || null
  const customerId: string | null = perfil.gateway_customer_id || null
  if (!subId) bloqueios.push('Perfil sem gateway_subscription_id.')
  if (!customerId) bloqueios.push('Perfil sem gateway_customer_id.')

  let valorAtual: number | null = null
  let billingType: string | null = null
  let cicloAsaas: string | null = null
  let proximoVencimento: string | null = null
  let pendentes: Cobranca[] = []

  if (subId && customerId) {
    const r = await cli.asaas('GET', `/subscriptions/${encodeURIComponent(subId)}`)
    if (r.status === 404) bloqueios.push('Assinatura não existe no Asaas.')
    else if (!r.ok) throw new ErroAlterarPlano(502, { codigo: 'ASAAS_FALHA_LEITURA', error: 'Não foi possível consultar a assinatura no Asaas. Nada foi alterado.', asaasStatus: r.status })
    else {
      const s = r.data
      if (s?.id !== subId) bloqueios.push('Resposta do Asaas não corresponde à assinatura do perfil.')
      else {
        if (s.deleted === true) bloqueios.push('Assinatura removida no Asaas.')
        if (s.status !== 'ACTIVE') bloqueios.push(`Assinatura no Asaas com status "${s.status}": só ACTIVE é aceita.`)
        if (s.customer !== customerId) bloqueios.push('Assinatura pertence a outro cliente do Asaas.')
        cicloAsaas = s.cycle ? String(s.cycle) : null
        if (cicloAsaas !== 'MONTHLY') bloqueios.push(`Ciclo da assinatura no Asaas é "${cicloAsaas}": só MONTHLY é aceito.`)
        // Number(null) === 0 e Number('') === 0: so aceita numero (ou texto numerico) finito e MAIOR que zero.
        const brutoValor = typeof s.value === 'number' ? s.value : (typeof s.value === 'string' && s.value.trim() !== '' ? Number(s.value) : NaN)
        valorAtual = Number.isFinite(brutoValor) && brutoValor > 0 ? brutoValor : null
        if (valorAtual === null) bloqueios.push('Asaas não informou um valor válido para a assinatura.')
        billingType = s.billingType ? String(s.billingType) : null
        if (!billingType) bloqueios.push('Asaas não informou o billingType da assinatura: não é possível verificar se a edição é segura.')
        else if (!BILLING_TYPES_PERMITIDOS.includes(billingType)) bloqueios.push(`billingType "${billingType}" não suportado nesta versão (somente PIX). Cartão pode exigir configuração manual no Asaas.`)
        proximoVencimento = s.nextDueDate ? String(s.nextDueDate) : null
        pendentes = await listarPendentes(cli.asaas, subId)
      }
    }
  }

  // Regras de valor (so quando o plano atual e o valor do Asaas sao conhecidos).
  let recuperacao = false
  if (atual && valorAtual !== null && (operacao === 'upgrade' || operacao === 'sincronizacao')) {
    const precoAtualPlano = precoMensal(atual)
    if (operacao === 'upgrade') {
      if (centavos(valorAtual) === centavos(precoNovo)) recuperacao = true   // Asaas ja no valor novo (execucao anterior interrompida): so completa o banco
      else if (centavos(valorAtual) !== centavos(precoAtualPlano)) bloqueios.push(`Valor da assinatura no Asaas (R$ ${valorAtual.toFixed(2)}) não corresponde ao preço do plano atual (R$ ${precoAtualPlano.toFixed(2)}).`)
    } else {
      if (centavos(valorAtual) === centavos(precoNovo)) bloqueios.push('JA_SINCRONIZADO: o valor da assinatura no Asaas já é o preço do plano. Nada a sincronizar.')
      else if (centavos(valorAtual) > centavos(precoNovo)) bloqueios.push(`Valor da assinatura no Asaas (R$ ${valorAtual.toFixed(2)}) é MAIOR que o preço do plano (R$ ${precoNovo.toFixed(2)}): a sincronização só sobe valores.`)
    }
  }

  const acaoNoAsaas: Analise['acaoNoAsaas'] = recuperacao ? 'nenhuma' : 'put_valor'
  const analise: Analise = {
    operacao, recuperacao, userId, planoAtual: perfil.plano_tipo ?? null, planoDestino: novo, precoEsperado: precoNovo,
    valorAtualAsaas: valorAtual, billingType, gatewaySubscriptionId: subId, gatewayCustomerId: customerId,
    cicloPerfil: perfil.billing_cycle ?? null, cicloAsaas, proximoVencimento, statusAcesso: perfil.status_acesso ?? null,
    cobrancasPendentes: pendentes, ambiente: cli.ambiente, acaoNoAsaas,
    enviaraUpdatePendingPayments: acaoNoAsaas === 'put_valor' && pendentes.length > 0,
    escreveNoBanco: operacao === 'upgrade',
    executavel: bloqueios.length === 0, bloqueios,
  }
  return { analise, perfil }
}

function calcularConfirmacao(a: Analise): string {
  const pend = a.cobrancasPendentes.map(c => [c.id, c.status, centavos(c.valor)] as const).sort((x, y) => x[0].localeCompare(y[0]))
  const base = JSON.stringify([
    a.userId, a.gatewaySubscriptionId, a.gatewayCustomerId, a.operacao, a.planoAtual, a.planoDestino,
    a.valorAtualAsaas === null ? null : centavos(a.valorAtualAsaas), centavos(a.precoEsperado),
    a.billingType, a.cicloAsaas, a.proximoVencimento, a.ambiente, pend,
  ])
  return createHash('sha256').update(base).digest('hex')
}

// Confere, no Asaas, que o PUT mexeu SO no valor: mesma assinatura, cliente, ciclo, vencimento e forma de pagamento.
async function verificarPosPut(cli: ClienteAsaas, a: Analise): Promise<{ ok: boolean; motivo?: string }> {
  const subId = a.gatewaySubscriptionId as string
  const r = await cli.asaas('GET', `/subscriptions/${encodeURIComponent(subId)}`)
  if (!r.ok) return { ok: false, motivo: `não foi possível reler a assinatura (HTTP ${r.status})` }
  const s = r.data
  if (s?.id !== subId) return { ok: false, motivo: 'id da assinatura diferente' }
  if (s.deleted === true || s.status !== 'ACTIVE') return { ok: false, motivo: `assinatura ficou com status "${s.status}"` }
  if (s.customer !== a.gatewayCustomerId) return { ok: false, motivo: 'cliente da assinatura mudou' }
  if (String(s.cycle || '') !== (a.cicloAsaas || '')) return { ok: false, motivo: 'ciclo da assinatura mudou' }
  if ((s.nextDueDate ? String(s.nextDueDate) : null) !== a.proximoVencimento) return { ok: false, motivo: 'próximo vencimento mudou' }
  if ((s.billingType ? String(s.billingType) : null) !== a.billingType) return { ok: false, motivo: 'forma de pagamento mudou' }
  if (centavos(Number(s.value)) !== centavos(a.precoEsperado)) return { ok: false, motivo: `valor da assinatura ficou R$ ${Number(s.value)} em vez de R$ ${a.precoEsperado}` }
  const pend = await listarPendentes(cli.asaas, subId)
  const fora = pend.filter(c => centavos(c.valor) !== centavos(a.precoEsperado))
  if (fora.length) return { ok: false, motivo: `${fora.length} cobrança(s) em aberto não acompanharam o novo valor` }
  return { ok: true }
}

// Desfaz o PUT (volta o valor antigo). Melhor esforco: se falhar, registra para correcao manual.
async function reverterValor(cli: ClienteAsaas, a: Analise, contexto: string): Promise<boolean> {
  const subId = a.gatewaySubscriptionId as string
  const corpo: Record<string, unknown> = { value: a.valorAtualAsaas }
  if (a.cobrancasPendentes.length > 0) corpo.updatePendingPayments = true
  try {
    const r = await cli.asaas('PUT', `/subscriptions/${encodeURIComponent(subId)}`, corpo)
    if (r.ok) { log('ALTERAR_PLANO_REVERTIDO', { contexto, userId: a.userId, subscriptionId: subId, valorRestaurado: a.valorAtualAsaas }); return true }
  } catch { /* cai no log abaixo */ }
  logErro('ALTERAR_PLANO_INCONSISTENTE', { contexto, userId: a.userId, subscriptionId: subId, valorOriginal: a.valorAtualAsaas, valorNovo: a.precoEsperado, acao: 'REVERTER O VALOR NO ASAAS MANUALMENTE' })
  return false
}

// UNICA escrita no Supabase de todo o modulo. So e chamada na operacao "upgrade", depois do Asaas confirmado.
async function gravarPlano(deps: AlterarPlanoDeps, userId: string, atual: string, novo: PlanoPago): Promise<boolean> {
  const { data, error } = await deps.supabase.from('perfis').update({ plano_tipo: novo })
    .eq('user_id', userId).eq('plano_tipo', atual).select('user_id, plano_tipo')
  if (error) return false
  if (Array.isArray(data) && data.length > 0) return true
  // 0 linhas: outra chamada pode ter concluido antes. Se o plano ja e o novo, esta tudo certo (nao reverte o Asaas).
  const { data: p } = await deps.supabase.from('perfis').select('plano_tipo').eq('user_id', userId).maybeSingle()
  return p?.plano_tipo === novo
}

async function executar(deps: AlterarPlanoDeps, cli: ClienteAsaas, a: Analise, novo: PlanoPago): Promise<AlterarPlanoResultado> {
  const subId = a.gatewaySubscriptionId as string
  let enviouUpdatePending = false

  if (a.acaoNoAsaas === 'put_valor') {
    const corpo: Record<string, unknown> = { value: a.precoEsperado }
    if (a.cobrancasPendentes.length > 0) { corpo.updatePendingPayments = true; enviouUpdatePending = true }
    const put = await cli.asaas('PUT', `/subscriptions/${encodeURIComponent(subId)}`, corpo)
    if (!put.ok) {
      return { status: 502, body: { codigo: 'ASAAS_RECUSOU', error: 'O Asaas recusou a alteração. Nada foi alterado.', asaasStatus: put.status, detalhe: resumirErroAsaas(put.data), operacao: a.operacao } }
    }
    log('ALTERAR_PLANO_PUT_OK', { userId: a.userId, subscriptionId: subId, operacao: a.operacao, valorAnterior: a.valorAtualAsaas, valorNovo: a.precoEsperado, updatePendingPayments: enviouUpdatePending })
    const v = await verificarPosPut(cli, a)
    if (!v.ok) {
      const revertido = await reverterValor(cli, a, 'verificacao_pos_put_falhou: ' + v.motivo)
      return { status: revertido ? 502 : 500, body: { codigo: revertido ? 'VERIFICACAO_FALHOU_REVERTIDO' : 'VERIFICACAO_FALHOU_SEM_REVERSAO', error: revertido ? 'A verificação após a alteração falhou e o valor anterior foi restaurado. Nada foi alterado no banco.' : 'A verificação falhou e NÃO foi possível restaurar o valor. Corrija manualmente no Asaas.', motivo: v.motivo } }
    }
    log('ALTERAR_PLANO_VERIFICADO', { userId: a.userId, subscriptionId: subId })
  }

  let escreveuBanco = false
  if (a.operacao === 'upgrade') {
    const ok = await gravarPlano(deps, a.userId, a.planoAtual as string, novo)
    if (!ok) {
      const revertido = a.acaoNoAsaas === 'put_valor' ? await reverterValor(cli, a, 'falha_ao_gravar_plano_no_banco') : false
      logErro('ALTERAR_PLANO_FALHA_BANCO', { userId: a.userId, subscriptionId: subId, valorRevertido: revertido })
      return { status: 500, body: { codigo: 'FALHA_AO_GRAVAR_PLANO', error: revertido ? 'Não foi possível gravar o plano; o valor do Asaas foi restaurado.' : 'Não foi possível gravar o plano no banco. Verifique o valor da assinatura no Asaas.', valorRestaurado: revertido } }
    }
    escreveuBanco = true
    log('ALTERAR_PLANO_BANCO_OK', { userId: a.userId, planoAnterior: a.planoAtual, planoNovo: novo })
  }

  return { status: 200, body: {
    ok: true, dryRun: false, operacao: a.operacao, recuperacao: a.recuperacao,
    planoAnterior: a.planoAtual, planoNovo: novo, valorAnterior: a.valorAtualAsaas, valorNovo: a.precoEsperado,
    gatewaySubscriptionId: subId, enviouUpdatePendingPayments: enviouUpdatePending, escreveuNoBanco: escreveuBanco,
  } }
}

export async function alterarPlano(deps: AlterarPlanoDeps, input: AlterarPlanoInput): Promise<AlterarPlanoResultado> {
  try {
    const userId = typeof input.userId === 'string' ? input.userId.trim() : ''
    if (!UUID_RE.test(userId)) return { status: 400, body: { codigo: 'USER_ID_INVALIDO', error: 'userId inválido.' } }
    const novo = planoPagoOuNull(input.novoPlano)
    if (!novo) return { status: 400, body: { codigo: 'PLANO_INVALIDO', error: 'Plano de destino inválido. Use minipage, loja, essencial ou equipe.' } }
    // dryRun e o PADRAO: so a execucao real exige o booleano false explicito.
    const dryRun = input.dryRun !== false

    const cli = criarClienteAsaas(deps)
    const { analise } = await analisar(deps, cli, userId, novo)
    const confirmacao = calcularConfirmacao(analise)

    if (dryRun) {
      log('ALTERAR_PLANO_DRYRUN', { userId, operacao: analise.operacao, executavel: analise.executavel, billingType: analise.billingType })
      return { status: 200, body: { dryRun: true, ...analise, confirmacao } }
    }

    if (typeof input.confirmacao !== 'string' || !input.confirmacao)
      return { status: 400, body: { codigo: 'CONFIRMACAO_OBRIGATORIA', error: 'Rode primeiro o dryRun e envie a "confirmacao" que ele devolveu.' } }
    if (!analise.executavel)
      return { status: 409, body: { codigo: 'NAO_EXECUTAVEL', error: 'A operação não pode ser executada. Nada foi alterado.', bloqueios: analise.bloqueios } }
    if (input.confirmacao !== confirmacao)
      return { status: 409, body: { codigo: 'ESTADO_MUDOU', error: 'O estado mudou desde o dryRun. Rode o dryRun de novo. Nada foi alterado.' } }

    return await executar(deps, cli, analise, novo)
  } catch (err) {
    if (err instanceof ErroAlterarPlano) return { status: err.status, body: err.corpo }
    logErro('ERRO_INTERNO', { erro: err instanceof Error ? err.message : String(err) })
    return { status: 500, body: { error: 'Erro interno' } }
  }
}
