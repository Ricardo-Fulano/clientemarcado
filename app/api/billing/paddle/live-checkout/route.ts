import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prepararCompraPaddleLive, criarTransacaoPaddleLive } from '../../../../lib/billing/paddle/criar-transacao-live'
import { repositorioReservasLive } from '../../../../lib/billing/paddle/reservas-live'
import { planoEstaNaOferta } from '../../../../lib/comercial/planos-ofertados'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = {'Cache-Control': 'no-store'}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const response = (body: Record<string, unknown>, status: number) => NextResponse.json(body, {status, headers})

/** PREPARADO, DESLIGADO por padrao e sem acesso de clientes na situacao atual.
 * Condicoes cumulativas para uma liberacao FUTURA, somente apos aprovacao formal e testes E2E.
 * Nao altera perfis, concede planos, comissiona ou substitui o Asaas.
 */
export async function POST(request: NextRequest) {
  const env = process.env
  if (env.PADDLE_LIVE_CHECKOUT_WRITE_ENABLED !== 'true' ||
      env.PADDLE_LIVE_COMPLIANCE_APPROVED !== 'true' ||
      env.PADDLE_ENVIRONMENT !== 'live' || env.VERCEL_ENV !== 'production') {
    return response({error:'CHECKOUT_LIVE_DESABILITADO'}, 503)
  }
  const apiKey = env.PADDLE_LIVE_API_KEY
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!apiKey || !supabaseUrl || !anonKey || !serviceKey) return response({error:'CONFIG_INCOMPLETA'}, 503)
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (!bearer || bearer.length > 8192) return response({error:'NAO_AUTENTICADO'},401)
  let body: unknown
  try { body = await request.json() } catch { return response({error:'JSON_INVALIDO'},400) }
  const candidate = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null
  // Cliente controla apenas UUID da tentativa. Plano, ciclo e preco vem SEMPRE do perfil.
  if (!candidate || Object.keys(candidate).length !== 1 || !UUID.test(String(candidate.attemptId || '')))
    return response({error:'TENTATIVA_INVALIDA'},422)
  const attemptId = candidate.attemptId as string
  try {
    const auth = createClient(supabaseUrl,anonKey,{auth:{autoRefreshToken:false,persistSession:false}})
    const {data:{user},error:authError} = await auth.auth.getUser(bearer)
    if (authError || !user) return response({error:'SESSAO_INVALIDA'},401)
    const admin = createClient(supabaseUrl,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}})
    const {data:perfil,error:perfilError} = await admin.from('perfis')
      .select('plano_tipo,billing_cycle,status_acesso,primeiro_pagamento_confirmado,gateway,gateway_customer_id,gateway_subscription_id,mp_subscription_id')
      .eq('user_id',user.id).maybeSingle()
    if (perfilError || !perfil) return response({error:'PERFIL_INDISPONIVEL'},422)
    if (!planoEstaNaOferta(perfil.plano_tipo) || perfil.plano_tipo === 'free')
      return response({error:'PLANO_FORA_DA_OFERTA'},422)
    // Nunca iniciar Paddle para conta que ja possui vinculo no Asaas ou outro gateway.
    // Especialmente importante para planos ANUAIS, que podem ter customer sem subscription.
    if (perfil.status_acesso !== 'aguardando_pagamento' || perfil.primeiro_pagamento_confirmado === true ||
        Boolean(perfil.gateway?.trim()) || Boolean(perfil.gateway_customer_id?.trim()) ||
        Boolean(perfil.gateway_subscription_id?.trim()) || Boolean(perfil.mp_subscription_id?.trim()))
      return response({error:'PERFIL_NAO_ELEGIVEL'},422)
    let compra: ReturnType<typeof prepararCompraPaddleLive>
    try { compra = prepararCompraPaddleLive({userId:user.id,attemptId,plano:perfil.plano_tipo,ciclo:perfil.billing_cycle}) }
    catch {return response({error:'PLANO_OU_CICLO_INVALIDO'},422)}
    const repo = repositorioReservasLive(admin)
    let reserva: Awaited<ReturnType<typeof repo.reservar>>
    try { reserva = await repo.reservar({userId:user.id,attemptId,plano:perfil.plano_tipo,ciclo:perfil.billing_cycle}) }
    catch {return response({error:'TENTATIVA_EXISTENTE_OU_NAO_ELEGIVEL'},409)}
    if (reserva.priceId !== compra.priceId) return response({error:'PRECO_DIVERGENTE'},409)
    if (reserva.status !== 'reserved' || reserva.reused) {
      // Nunca realizar novo POST automatico, inclusive para a mesma tentativa.
      return response({estado:'pendente_conciliacao',mensagem:'Tentativa existente. Nenhuma nova transacao foi criada.'},202)
    }
    let claim: boolean
    try {claim = await repo.iniciarEnvio(user.id,attemptId)}
    catch {return response({estado:'pendente_conciliacao',mensagem:'Nao foi possivel confirmar reserva atomica.'},202)}
    if (!claim) return response({estado:'pendente_conciliacao',mensagem:'Outra requisicao assumiu a tentativa.'},202)
    // A partir daqui, QUALQUER falha e indeterminada: NAO repetir POST.
    try {
      const transacao = await criarTransacaoPaddleLive({userId:user.id,attemptId,plano:perfil.plano_tipo,ciclo:perfil.billing_cycle},apiKey)
      await repo.confirmarCriacao(user.id,attemptId,transacao.transactionId)
      if (!transacao.checkoutUrl) return response({estado:'pendente_checkout',transactionId:transacao.transactionId,
        mensagem:'Transacao registrada, mas checkout nao disponivel. Requer conciliacao.'},202)
      return response({estado:'pronto',transactionId:transacao.transactionId,checkoutUrl:transacao.checkoutUrl},200)
    } catch {return response({estado:'pendente_conciliacao',mensagem:'Resultado incerto. Nao repetir ou gerar outra compra ate conciliar.'},202)}
  } catch {return response({error:'SERVICO_TEMPORARIAMENTE_INDISPONIVEL'},503)}
}

export async function GET(){return response({error:'METODO_NAO_PERMITIDO'},405)}
