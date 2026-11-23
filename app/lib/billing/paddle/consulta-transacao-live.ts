/** Consulta LIVE estritamente de leitura. Nunca chamar do navegador. */
const PADDLE_API_LIVE = 'https://api.paddle.com'
const TX = /^txn_[a-z0-9]{26}$/
const KEY = /^pdl_live_apikey_[A-Za-z0-9_-]+$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type TransacaoPaddleAPI = {
  id: string
  status: string
  collection_mode: string
  origin?: string
  customer_id: string | null
  subscription_id: string | null
  custom_data: Record<string, unknown> | null
  items: Array<{ price: { id: string }; quantity: number }>
  billing_period?: { starts_at: string; ends_at: string } | null
}

function objeto(x: unknown): Record<string, unknown> | null {
  return x !== null && typeof x === 'object' && !Array.isArray(x) ? x as Record<string, unknown> : null
}

/** O retorno ainda NÃO é um pagamento conciliado: é evidência externa para confrontar com a reserva. */
export async function consultarTransacaoPaddleLive(
  transacaoId: string,
  apiKey: string,
  transporte: typeof fetch = fetch,
): Promise<TransacaoPaddleAPI> {
  if (!TX.test(transacaoId)) throw new Error('PADDLE_ID_INVALIDO')
  if (!KEY.test(apiKey)) throw new Error('PADDLE_CREDENCIAL_NAO_LIVE')
  let resp: Response
  try {
    resp = await transporte(`${PADDLE_API_LIVE}/transactions/${transacaoId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}`, 'Paddle-Version': '1' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    throw new Error('PADDLE_CONSULTA_INDETERMINADA')
  }
  if (!resp.ok) throw new Error(`PADDLE_HTTP_${resp.status}`)
  let body: unknown
  try { body = await resp.json() } catch { throw new Error('PADDLE_RESPOSTA_INVALIDA') }
  const envelope = objeto(body)
  const data = objeto(envelope?.data)
  if (!data || data.id !== transacaoId || typeof data.status !== 'string' ||
      typeof data.collection_mode !== 'string' || !Array.isArray(data.items)) {
    throw new Error('PADDLE_RESPOSTA_INVALIDA')
  }
  const items: TransacaoPaddleAPI['items'] = []
  for (const it of data.items) {
    const item = objeto(it)
    const price = objeto(item?.price)
    if (!price || typeof price.id !== 'string' || typeof item?.quantity !== 'number' ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1) throw new Error('PADDLE_ITEM_INVALIDO')
    items.push({price: {id: price.id}, quantity: item.quantity})
  }
  const custom = objeto(data.custom_data)
  const period = objeto(data.billing_period)
  const billingPeriod = period && typeof period.starts_at === 'string' && typeof period.ends_at === 'string'
    ? {starts_at: period.starts_at, ends_at: period.ends_at} : null
  return {
    id: transacaoId, status: data.status, collection_mode: data.collection_mode,
    origin: typeof data.origin === 'string' ? data.origin : undefined,
    customer_id: typeof data.customer_id === 'string' ? data.customer_id : null,
    subscription_id: typeof data.subscription_id === 'string' ? data.subscription_id : null,
    custom_data: custom,
    items,
    billing_period: billingPeriod,
  }
}

export type TentativaLocalConfiavel = {
  userId: string
  attemptId: string
  transactionId: string
  priceId: string
  status: 'reserved'|'sending'|'created'|'completed'|'failed'|'expired'
}

export type ComprovanteInicial = {
  transactionId: string
  subscriptionId: string
  customerId: string
  userId: string
  attemptId: string
  priceId: string
}

/** Fail-closed: aceita só primeira compra com reserva anterior confirmada.
 * Renovações, descontos, impostos, estornos e cancelamentos exigem fluxo separado.
 */
export function validarPagamentoInicialLive(
  tx: TransacaoPaddleAPI,
  reserva: TentativaLocalConfiavel | null,
  idEventoWebhook: string,
  transacaoDoWebhook: string,
): ComprovanteInicial {
  if (!/^evt_[a-z0-9]{26}$/.test(idEventoWebhook)) throw new Error('EVENTO_INVALIDO')
  if (tx.id !== transacaoDoWebhook || !TX.test(tx.id)) throw new Error('TRANSACAO_DIVERGENTE')
  if (tx.status !== 'completed' || tx.collection_mode !== 'automatic') throw new Error('NAO_CONFIRMADO')
  if (tx.origin !== 'api') throw new Error('ORIGEM_NAO_INICIAL')
  if (!/^ctm_[a-z0-9]{26}$/.test(tx.customer_id || '')) throw new Error('CUSTOMER_INVALIDO')
  if (!/^sub_[a-z0-9]{26}$/.test(tx.subscription_id || '')) throw new Error('ASSINATURA_AUSENTE')
  if (tx.items.length !== 1 || tx.items[0].quantity !== 1) throw new Error('ITENS_INCOMPATIVEIS')
  if (!reserva || reserva.status !== 'created') throw new Error('RESERVA_NAO_CONFIRMADA')
  if (reserva.transactionId !== tx.id || reserva.priceId !== tx.items[0].price.id) throw new Error('PRECO_TRANSACAO_DIVERGENTE')
  if (tx.custom_data?.minipage_user_id !== reserva.userId ||
      tx.custom_data?.minipage_attempt_id !== reserva.attemptId) throw new Error('TITULARIDADE_DIVERGENTE')
  if (!UUID.test(reserva.userId) || !UUID.test(reserva.attemptId)) throw new Error('UUID_INVALIDO')
  return { transactionId: tx.id, subscriptionId: tx.subscription_id!, customerId: tx.customer_id!,
    userId: reserva.userId, attemptId: reserva.attemptId, priceId: reserva.priceId }
}
