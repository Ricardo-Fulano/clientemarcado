import { resolverPrecoPaddleLive } from './catalogo-live'

/** Operacao remota isolada. Nao deve ser chamada sem reserva atomica em estado sending. */
const TX = /^txn_[a-z0-9]{26}$/
const KEY = /^pdl_live_apikey_[A-Za-z0-9_-]+$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const HOST = 'minipage.pro'

export function verificarLinkCheckout(url: unknown, id: string): string | null {
  if (typeof url !== 'string' || url.length > 2048 || !TX.test(id)) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || parsed.hostname !== HOST || parsed.username || parsed.password || parsed.port) return null
    if (parsed.searchParams.get('_ptxn') !== id) return null
    return parsed.toString()
  } catch { return null }
}

export function prepararCompraPaddleLive(input: { userId: string; attemptId: string; plano: unknown; ciclo: unknown }) {
  if (!UUID.test(input.userId) || !UUID.test(input.attemptId)) throw new Error('IDS_INVALIDOS')
  const preco = resolverPrecoPaddleLive(input.plano, input.ciclo)
  return {
    priceId: preco.priceId,
    payload: {
      collection_mode: 'automatic' as const,
      items: [{ price_id: preco.priceId, quantity: 1 }],
      custom_data: {
        minipage_user_id: input.userId,
        minipage_attempt_id: input.attemptId,
        plan_code: preco.plano,
        billing_cycle: preco.ciclo,
      },
    },
  }
}

export async function criarTransacaoPaddleLive(
  input: { userId: string; attemptId: string; plano: unknown; ciclo: unknown },
  apiKey: string,
  transport: typeof fetch = fetch,
): Promise<{ transactionId: string; checkoutUrl: string | null }> {
  if (!KEY.test(apiKey)) throw new Error('CHAVE_LIVE_INVALIDA')
  const { payload } = prepararCompraPaddleLive(input)
  let response: Response
  try {
    response = await transport('https://api.paddle.com/transactions', {
      method: 'POST',
      headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
  } catch { throw new Error('RESULTADO_INDETERMINADO_NAO_REPETIR') }
  // A resposta pode ter sido emitida apos o Paddle criar a transacao.
  if (!response.ok) throw new Error('RESULTADO_HTTP_INDETERMINADO_NAO_REPETIR')
  let decoded: unknown
  try { decoded = await response.json() } catch { throw new Error('RESPOSTA_INDETERMINADA_NAO_REPETIR') }
  const env = decoded as { data?: { id?: unknown; collection_mode?: unknown; custom_data?: Record<string, unknown> | null;
    items?: Array<{price?:{id?:string};quantity?:number}>; checkout?:{url?:unknown} } }
  const data = env && typeof env === 'object' ? env.data : undefined
  if (!data || typeof data.id !== 'string' || !TX.test(data.id) ||
      data.collection_mode !== 'automatic' ||
      data.custom_data?.minipage_user_id !== input.userId ||
      data.custom_data?.minipage_attempt_id !== input.attemptId ||
      !Array.isArray(data.items) || data.items.length !== 1 ||
      data.items[0]?.price?.id !== payload.items[0].price_id || data.items[0]?.quantity !== 1) {
    throw new Error('RESPOSTA_DIVERGENTE_NAO_REPETIR')
  }
  return {transactionId: data.id, checkoutUrl: verificarLinkCheckout(data.checkout?.url, data.id)}
}
