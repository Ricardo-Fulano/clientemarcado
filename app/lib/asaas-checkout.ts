import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizarPlano, obterReasonMercadoPago, obterPrecoPlanoPorCiclo, ehPlanoFree, normalizarBillingCycle } from './planos'
import { avaliarAmbienteAsaas, urlEhSandbox } from './asaas-ambiente'

// Cria OU REUTILIZA o checkout do Asaas para o usuario autenticado. IDEMPOTENTE: clicar em
// "Finalizar assinatura" varias vezes nunca cria cliente nem assinatura em duplicidade.
// So roda no servidor. A rota fina (app/api/asaas/criar-assinatura/route.ts) so autentica e
// chama esta funcao.
//
// Ordem (cada etapa so cria o que ainda NAO existe):
//   1. cliente  : perfis.gateway_customer_id (conferido no Asaas) -> busca por
//                 externalReference=userId -> cria. O id e salvo no perfil NA HORA.
//   2. mensal   : perfis.gateway_subscription_id (conferido: precisa estar ACTIVE) -> busca
//                 assinatura ACTIVE do cliente -> cria. O id e salvo no perfil NA HORA.
//      anual    : cobranca unica PENDING do cliente (mesmo valor) -> cria.
//   3. link     : cobranca PENDING (ou OVERDUE) ja existente; so gera link novo se nao houver.
// Etapas logadas (Runtime Logs da Vercel, filtre por "[Asaas][checkout]"): CHECKOUT_START,
// CHECKOUT_ENV_BLOQUEADO, CHECKOUT_CUSTOMER_*, CHECKOUT_SUBSCRIPTION_*, CHECKOUT_PAYMENT_*.
// Nunca logamos CPF/CNPJ, chave da API nem o corpo bruto das respostas.

export type CheckoutResultado = { status: number; body: Record<string, unknown> }
export type CheckoutDeps = {
  supabase: SupabaseClient
  env: Record<string, string | undefined>
  fetchFn?: (url: string, init?: any) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>
  esperar?: (ms: number) => Promise<void>
}

const MSG_INDISPONIVEL = 'Não foi possível iniciar o pagamento agora. Tente novamente em alguns instantes.'
const PAGAS = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']

class ErroCheckout extends Error {
  constructor(public status: number, public corpo: Record<string, unknown>) { super(String(corpo.error || 'erro')) }
}
function log(etapa: string, dados: Record<string, unknown> = {}) { console.log(`[Asaas][checkout] ${etapa}`, JSON.stringify(dados)) }

export async function criarOuReutilizarCheckout(
  deps: CheckoutDeps,
  input: { userId: string; email: string | null; body: any },
): Promise<CheckoutResultado> {
  const { supabase, env } = deps
  const fetchFn = deps.fetchFn || (fetch as any)
  const esperar = deps.esperar || ((ms: number) => new Promise<void>(r => setTimeout(r, ms)))
  const { userId, email } = input
  const body = input.body || {}

  try {
    const { data: perfil } = await supabase.from('perfis')
      .select('plano_tipo, cpf_cnpj, nome_negocio, billing_cycle, status_acesso, gateway_customer_id, gateway_subscription_id, primeiro_pagamento_confirmado')
      .eq('user_id', userId).maybeSingle()
    log('CHECKOUT_START', { status: perfil?.status_acesso, temCliente: !!perfil?.gateway_customer_id, temAssinatura: !!perfil?.gateway_subscription_id })

    const planoTipoOriginal = perfil?.plano_tipo
    // Free nunca gera assinatura.
    if (ehPlanoFree(planoTipoOriginal)) return { status: 400, body: { error: 'Plano Free não gera assinatura.' } }
    // So os 4 planos pagos conhecidos - nunca assume um valor para uma cobranca real.
    const PLANOS_PAGOS_VALIDOS = ['minipage', 'loja', 'essencial', 'equipe']
    if (!planoTipoOriginal || !PLANOS_PAGOS_VALIDOS.includes(planoTipoOriginal)) {
      console.error('[Asaas][checkout] plano_tipo invalido/desconhecido - bloqueando por seguranca:', planoTipoOriginal)
      return { status: 400, body: { error: 'Não foi possível identificar seu plano. Entre em contato com o suporte.' } }
    }
    // Esta rota so atende quem esta aguardando o primeiro pagamento. Quem ja pagou nao pode
    // gerar outra cobranca (evita cobranca dupla).
    if (perfil?.status_acesso !== 'aguardando_pagamento') {
      if (perfil?.primeiro_pagamento_confirmado === true && perfil?.status_acesso === 'ativo')
        return { status: 409, body: { codigo: 'JA_ATIVA', error: 'Sua assinatura já está ativa.' } }
      return { status: 409, body: { codigo: 'STATUS_NAO_PERMITE', error: 'Sua conta não está aguardando pagamento.' } }
    }

    // CPF/CNPJ: do corpo (coletado no checkout) ou ja salvo no perfil.
    const cpfDoBody = String(body?.cpfCnpj || '').replace(/\D/g, '')
    const cpfSalvo = String(perfil?.cpf_cnpj || '').replace(/\D/g, '')
    const cpfBodyValido = cpfDoBody.length === 11 || cpfDoBody.length === 14
    const cpf = cpfBodyValido ? cpfDoBody : cpfSalvo
    if (cpf.length !== 11 && cpf.length !== 14)
      return { status: 400, body: { error: 'Precisamos do seu CPF ou CNPJ para gerar a cobrança. Informe um documento válido e tente novamente.' } }

    // Forma de pagamento escolhida pelo cliente: so cartao ou Pix (nunca UNDEFINED).
    const metodo = body?.metodoPagamento
    if (!['CREDIT_CARD', 'PIX'].includes(metodo))
      return { status: 400, body: { error: 'Selecione uma forma de pagamento válida (cartão de crédito ou Pix).' } }

    // PROTECAO DE AMBIENTE: nunca manda cliente real para o checkout de teste.
    const amb = avaliarAmbienteAsaas(env)
    if (!amb.ok) {
      console.error(`[Asaas][checkout] CHECKOUT_ENV_BLOQUEADO - configuracao incorreta do gateway: ${amb.motivo}`)
      return { status: 503, body: { codigo: 'GATEWAY_INDISPONIVEL', error: MSG_INDISPONIVEL } }
    }

    // Anti clique-duplo: uma tentativa por usuario a cada 15s (reaproveita a funcao de limite
    // ja existente). Se a funcao nao existir, segue (as etapas abaixo ja sao idempotentes).
    const { data: liberado, error: erroLimite } = await supabase.rpc('checar_rate_limit', { p_chave: 'checkout:' + userId, p_max: 1, p_janela_segundos: 15 })
    if (erroLimite) console.error('[Asaas][checkout] limite de cliques indisponivel:', erroLimite.message)
    else if (liberado === false) return { status: 429, body: { codigo: 'AGUARDE', error: 'Estamos preparando seu pagamento. Aguarde alguns segundos e tente novamente.' } }

    // CPF novo vindo do corpo: guarda no perfil (nao bloqueia se falhar).
    if (cpfBodyValido && cpfDoBody !== cpfSalvo) await supabase.from('perfis').update({ cpf_cnpj: cpfDoBody }).eq('user_id', userId)

    const planoTipo = normalizarPlano(planoTipoOriginal)
    // billing_cycle vazio (conta transferida/antiga) cai em 'mensal'.
    const ciclo = normalizarBillingCycle(perfil?.billing_cycle || body?.billing_cycle)
    const valor = obterPrecoPlanoPorCiclo(planoTipo, ciclo)
    const descricao = `${obterReasonMercadoPago(planoTipo)} (${ciclo === 'anual' ? 'Anual' : 'Mensal'})`
    const SITE_URL = env.NEXT_PUBLIC_SITE_URL || 'https://clientemarcado.com.br'
    const successUrl = `${SITE_URL}/pos-confirmacao?aguardando=1`
    const nextDueDate = new Date().toISOString().slice(0, 10)

    async function asaas(metodoHttp: string, caminho: string, corpo?: any) {
      const res = await fetchFn(`${amb.ok ? amb.baseUrl : ''}${caminho}`, {
        method: metodoHttp,
        headers: { 'Content-Type': 'application/json', access_token: env.ASAAS_API_KEY || '' },
        body: corpo ? JSON.stringify(corpo) : undefined,
      })
      const texto = await res.text()
      let data: any = {}
      try { data = texto ? JSON.parse(texto) : {} } catch { /* resposta nao-JSON */ }
      if (!res.ok) console.error(`[Asaas][checkout] ${metodoHttp} ${caminho.split('?')[0]} -> ${res.status}`, JSON.stringify(data?.errors || data?.error || '').slice(0, 300))
      return { ok: res.ok, status: res.status, data }
    }
    const erroTemporario = (): never => { throw new ErroCheckout(502, { error: MSG_INDISPONIVEL }) }

    // ---------- 1) CLIENTE ----------
    let customerId: string | null = perfil?.gateway_customer_id || null
    if (customerId) {
      const r = await asaas('GET', `/customers/${customerId}`)
      const deOutroUsuario = !!r.data?.externalReference && r.data.externalReference !== userId   // cliente que pertence a OUTRA pessoa
      if (r.ok && r.data?.id && r.data.deleted !== true && !deOutroUsuario) log('CHECKOUT_CUSTOMER_REUSED')
      else if (r.status === 404 || r.data?.deleted === true || deOutroUsuario) { log('CHECKOUT_CUSTOMER_STALE', { motivo: deOutroUsuario ? 'cliente pertence a outro usuario' : 'nao existe neste ambiente do Asaas' }); customerId = null }
      else erroTemporario()   // erro de rede/5xx: nao arrisca criar duplicado
    }
    if (!customerId) {
      const busca = await asaas('GET', `/customers?externalReference=${encodeURIComponent(userId)}&limit=10`)
      if (!busca.ok) erroTemporario()
      const achado = (Array.isArray(busca.data?.data) ? busca.data.data : []).find((c: any) => c?.id && c.deleted !== true && c.externalReference === userId)   // nunca confia so no filtro da URL
      if (achado) { customerId = achado.id; log('CHECKOUT_CUSTOMER_FOUND') }
      else {
        const c = await asaas('POST', '/customers', { name: perfil?.nome_negocio || email, email, cpfCnpj: cpf, externalReference: userId })
        if (!c.ok || !c.data?.id) throw new ErroCheckout(500, { error: 'Não foi possível iniciar a cobrança. Tente novamente ou fale com o suporte.' })
        customerId = c.data.id as string; log('CHECKOUT_CUSTOMER_CREATED')
      }
      // Guarda NA HORA: se uma etapa abaixo falhar, o proximo clique reaproveita este cliente.
      await supabase.from('perfis').update({ gateway: 'asaas', gateway_customer_id: customerId }).eq('user_id', userId)
    }

    // Garante a forma de pagamento escolhida numa cobranca pendente ja existente.
    async function linkDaCobranca(pend: any): Promise<string> {
      let url: string = pend.invoiceUrl
      if (pend.billingType && pend.billingType !== metodo) {
        const up = await asaas('PUT', `/payments/${pend.id}`, { billingType: metodo })
        if (up.ok && up.data?.invoiceUrl) url = up.data.invoiceUrl
        else console.error('[Asaas][checkout] nao foi possivel trocar a forma de pagamento da cobranca pendente; usando o link existente')
      }
      return url
    }

    let init_point: string
    let referencia: string

    if (ciclo === 'anual') {
      // ---------- ANUAL: cobranca unica ----------
      const lista = await asaas('GET', `/payments?customer=${customerId}&status=PENDING&limit=20`)
      if (!lista.ok) erroTemporario()
      const pend = (Array.isArray(lista.data?.data) ? lista.data.data : []).find((p: any) =>
        p?.id && p.invoiceUrl && p.deleted !== true && !p.subscription && p.customer === customerId && p.externalReference === userId && Math.abs(Number(p.value) - valor) < 0.005)
      if (pend) { init_point = await linkDaCobranca(pend); referencia = pend.id; log('CHECKOUT_PAYMENT_REUSED', { ciclo }) }
      else {
        const p = await asaas('POST', '/payments', { customer: customerId, billingType: metodo, value: valor, dueDate: nextDueDate, description: descricao, externalReference: userId, callback: { successUrl } })
        if (!p.ok || !p.data?.id || !p.data?.invoiceUrl) throw new ErroCheckout(500, { error: 'Não foi possível gerar a cobrança anual. Tente novamente ou fale com o suporte.' })
        init_point = p.data.invoiceUrl; referencia = p.data.id; log('CHECKOUT_PAYMENT_CREATED', { ciclo })
      }
      await supabase.from('perfis').update({ gateway: 'asaas', gateway_customer_id: customerId, gateway_subscription_id: null, billing_cycle: 'anual' }).eq('user_id', userId)
    } else {
      // ---------- MENSAL: assinatura recorrente ----------
      let subscriptionId: string | null = perfil?.gateway_subscription_id || null
      let criadaAgora = false
      if (subscriptionId) {
        const r = await asaas('GET', `/subscriptions/${subscriptionId}`)
        if (r.ok && r.data?.id && r.data.deleted !== true && r.data.status === 'ACTIVE' && r.data.customer === customerId) log('CHECKOUT_SUBSCRIPTION_REUSED')
        else if (r.status === 404 || r.data?.deleted === true || (r.ok && r.data?.id && (r.data.status !== 'ACTIVE' || r.data.customer !== customerId))) { log('CHECKOUT_SUBSCRIPTION_STALE', { motivo: 'inexistente, inativa ou de outro cliente' }); subscriptionId = null }
        else erroTemporario()
      }
      if (!subscriptionId) {
        const lista = await asaas('GET', `/subscriptions?customer=${customerId}&status=ACTIVE&limit=10`)
        if (!lista.ok) erroTemporario()
        const achada = (Array.isArray(lista.data?.data) ? lista.data.data : []).find((s: any) => s?.id && s.deleted !== true && s.customer === customerId && s.status === 'ACTIVE')
        if (achada) { subscriptionId = achada.id; log('CHECKOUT_SUBSCRIPTION_FOUND') }
        else {
          const s = await asaas('POST', '/subscriptions', { customer: customerId, billingType: metodo, value: valor, nextDueDate, cycle: 'MONTHLY', description: descricao, externalReference: userId, callback: { successUrl } })
          if (!s.ok || !s.data?.id) throw new ErroCheckout(500, { error: 'Não foi possível criar a assinatura. Tente novamente ou fale com o suporte.' })
          subscriptionId = s.data.id as string; criadaAgora = true; log('CHECKOUT_SUBSCRIPTION_CREATED')
        }
        // Guarda NA HORA: o webhook identifica o perfil por este id.
        await supabase.from('perfis').update({ gateway: 'asaas', gateway_customer_id: customerId, gateway_subscription_id: subscriptionId, billing_cycle: 'mensal' }).eq('user_id', userId)
      }

      if (!subscriptionId) throw new ErroCheckout(500, { error: 'Não foi possível criar a assinatura. Tente novamente ou fale com o suporte.' })
      // Cobranca da assinatura: reutiliza a pendente; so depende de gerar link se nao houver.
      let cobrancas: any[] = []
      for (let tentativa = 0; tentativa < 2; tentativa++) {
        const r = await asaas('GET', `/payments?subscription=${subscriptionId}&limit=20`)
        if (!r.ok) erroTemporario()
        cobrancas = Array.isArray(r.data?.data) ? r.data.data.filter((p: any) => p?.deleted !== true && p.subscription === subscriptionId) : []
        if (cobrancas.length || !criadaAgora) break
        await esperar(700)   // a primeira cobranca de uma assinatura nova pode demorar um instante
      }
      const pend = cobrancas.find(p => p.status === 'PENDING' && p.invoiceUrl) || cobrancas.find(p => p.status === 'OVERDUE' && p.invoiceUrl)
      if (!pend) {
        if (cobrancas.some(p => PAGAS.includes(p.status)))
          return { status: 409, body: { codigo: 'PAGAMENTO_EM_PROCESSAMENTO', error: 'Seu pagamento já foi identificado. Aguarde alguns instantes que a confirmação é automática.' } }
        console.error('[Asaas][checkout] assinatura sem cobranca/invoiceUrl utilizavel')
        throw new ErroCheckout(500, { error: 'Assinatura criada, mas não foi possível gerar o link de pagamento. Fale com o suporte.' })
      }
      init_point = await linkDaCobranca(pend); referencia = subscriptionId
      if (!criadaAgora) log('CHECKOUT_PAYMENT_REUSED', { ciclo })
    }

    // Defesa final: no site de producao, nunca devolve link do checkout de teste.
    if (amb.siteProducao && env.ASAAS_PERMITIR_SANDBOX !== '1' && urlEhSandbox(init_point)) {
      console.error('[Asaas][checkout] CHECKOUT_ENV_BLOQUEADO - o Asaas devolveu um link de SANDBOX no site de producao; nao enviado ao cliente')
      return { status: 503, body: { codigo: 'GATEWAY_INDISPONIVEL', error: MSG_INDISPONIVEL } }
    }
    return { status: 200, body: { init_point, id: referencia } }
  } catch (err) {
    if (err instanceof ErroCheckout) return { status: err.status, body: err.corpo }
    console.error('[Asaas][checkout] Erro interno:', err)
    return { status: 500, body: { error: 'Erro interno' } }
  }
}
