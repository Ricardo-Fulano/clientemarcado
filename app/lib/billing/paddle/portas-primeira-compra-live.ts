/**
 * Portas reais para o processador da PRIMEIRA compra Paddle Live.
 * SOMENTE importacao no servidor: sem endpoints, sem cron, sem flags alteradas.
 * Operacao de registro exige autorizacao explicita do chamador + SQL instalado.
 * Nunca chamar com dados financeiros enviados pelo navegador.
 */
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PortasPrimeiraCompraLive } from './processador-primeira-compra-live'
import type { AssinaturaConciliacao, TransacaoConciliacao, EvidenciaConciliacao } from './conciliacao-inicial-live'

const ID_TX = /^txn_[a-z0-9]{26}$/
const ID_SUB = /^sub_[a-z0-9]{26}$/
const ID_EVT = /^evt_[a-z0-9]{10,80}$/
const KEY = /^pdl_live_apikey_[A-Za-z0-9_-]+$/
const API = 'https://api.paddle.com'
const isRecord = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const record = (x: unknown): Record<string, unknown> => isRecord(x) ? x : {}
const stringOrNull = (x: unknown): string | null => typeof x === 'string' ? x : null

function parseItems(value: unknown): Array<{price:{id:string};quantity:number}> {
  if (!Array.isArray(value) || value.length > 100) throw new Error('PADDLE_ITEMS_INVALIDOS')
  return value.map((it:unknown) => {
    const item = record(it)
    const price = record(item.price)
    if (typeof price.id !== 'string' || !Number.isSafeInteger(item.quantity) || (item.quantity as number) < 1)
      throw new Error('PADDLE_ITEM_INVALIDO')
    return {price:{id:price.id},quantity:item.quantity as number}
  })
}

async function getPaddle(path: string, apiKey: string, transport: typeof fetch): Promise<Record<string,unknown>> {
  if (!KEY.test(apiKey)) throw new Error('PADDLE_CHAVE_LIVE_INVALIDA')
  let response: Response
  try {
    response = await transport(`${API}${path}`, {
      method:'GET', headers:{Authorization:`Bearer ${apiKey}`},
      cache:'no-store', signal:AbortSignal.timeout(10000),
    })
  } catch { throw new Error('PADDLE_CONSULTA_INDETERMINADA') }
  if (!response.ok) throw new Error(`PADDLE_CONSULTA_HTTP_${response.status}`)
  let body:unknown
  try { body=await response.json() } catch { throw new Error('PADDLE_RESPOSTA_INVALIDA') }
  if (!isRecord(body) || !isRecord(body.data)) throw new Error('PADDLE_RESPOSTA_INVALIDA')
  return body.data
}

/** Acessa somente a inbox que foi populada pelo webhook com assinatura validada. */
export function criarPortasPrimeiraCompraPaddleLive(
  db: SupabaseClient,
  apiKey: string,
  transport: typeof fetch = fetch,
): PortasPrimeiraCompraLive {
  // Nao chamar API nem banco se a chave for de Sandbox ou vier faltando.
  if (!KEY.test(apiKey)) throw new Error('PADDLE_CHAVE_LIVE_INVALIDA')
  return {
    async buscarEvento(eventId) {
      if (!ID_EVT.test(eventId)) throw new Error('EVENTO_INVALIDO')
      const {data,error} = await db.from('billing_paddle_live_inbox')
        .select('event_id,event_type,entity_id,payload,signature_verified')
        .eq('event_id',eventId).maybeSingle()
      if (error) throw new Error('INBOX_INDISPONIVEL')
      if (!data) return null
      const payload = record(data.payload)
      const body = record(payload.data)
      return {
        event_id: String(data.event_id), event_type: String(data.event_type),
        signature_verified: data.signature_verified === true,
        transaction_id: typeof data.entity_id === 'string' ? data.entity_id : '',
        payloadTransactionId: typeof body.id === 'string' ? body.id : '',
        payloadStatus: typeof body.status === 'string' ? body.status : '',
      }
    },
    async buscarReserva(transactionId) {
      if (!ID_TX.test(transactionId)) throw new Error('TRANSACAO_INVALIDA')
      const {data,error}=await db.from('billing_paddle_live_checkout_attempts')
        .select('attempt_id,user_id,plan_code,billing_cycle,price_id,status,transaction_id')
        .eq('transaction_id',transactionId).maybeSingle()
      if (error) throw new Error('RESERVA_INDISPONIVEL')
      return data ?? null
    },
    async consultarTransacaoPaddle(transactionId): Promise<TransacaoConciliacao> {
      if (!ID_TX.test(transactionId)) throw new Error('TRANSACAO_INVALIDA')
      const data = await getPaddle(`/transactions/${transactionId}`,apiKey,transport)
      if (data.id !== transactionId) throw new Error('TRANSACAO_DIVERGENTE')
      return {
        id:transactionId,
        status:String(data.status ?? ''),
        collection_mode:String(data.collection_mode ?? ''),
        origin:typeof data.origin === 'string' ? data.origin : undefined,
        customer_id:stringOrNull(data.customer_id),
        subscription_id:stringOrNull(data.subscription_id),
        custom_data:isRecord(data.custom_data) ? data.custom_data : null,
        items:parseItems(data.items),
      }
    },
    async consultarAssinaturaPaddle(subscriptionId):Promise<AssinaturaConciliacao> {
      if (!ID_SUB.test(subscriptionId)) throw new Error('ASSINATURA_INVALIDA')
      const data=await getPaddle(`/subscriptions/${subscriptionId}`,apiKey,transport)
      if (data.id !== subscriptionId) throw new Error('ASSINATURA_DIVERGENTE')
      const period = record(data.current_billing_period)
      return {
        id:subscriptionId,
        status:String(data.status ?? ''),
        customer_id:stringOrNull(data.customer_id),
        items:parseItems(data.items),
        current_billing_period:
          typeof period.starts_at === 'string' && typeof period.ends_at === 'string'
          ? { starts_at:period.starts_at, ends_at:period.ends_at } : null,
      }
    },
    /** Requer RPC instalada e decisao previa do processador. Nao ativa plano. */
    async registrarPagamentoValidado(evidencia:EvidenciaConciliacao) {
      const {data,error} = await db.rpc('billing_paddle_live_stage_initial_payment', {
        p_event_id:evidencia.eventId,
        p_transaction_id:evidencia.transactionId,
        p_subscription_id:evidencia.subscriptionId,
        p_customer_id:evidencia.customerId,
        p_user_id:evidencia.userId,
        p_attempt_id:evidencia.attemptId,
        p_price_id:evidencia.priceId,
        p_period_end:evidencia.periodEnd,
      })
      if (error || (data !== 'staged' && data !== 'already_staged'))
        throw new Error('REGISTRO_FINANCEIRO_INDISPONIVEL')
      return data as 'staged'|'already_staged'
    },
  }
}
