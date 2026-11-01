// Parte 3 / Etapa B: contrato generico de provedores de venda (Kiwify, Stripe, Hotmart, Shopify...).
// Provider-neutro: moeda ISO 4217 em unidade menor (inteiro), datas em UTC, status em ingles tecnico.
// Os adaptadores sao PUROS (sem rede, sem banco): recebem bytes/JSON e devolvem dados normalizados.

export type ConversionStatus = 'paid' | 'partially_refunded' | 'refunded' | 'chargeback'
export const ITEM_TYPES = ['link', 'destaque', 'catalogo', 'video', 'card'] as const
export type ItemType = (typeof ITEM_TYPES)[number]

export interface NormalizedConversion {
  externalOrderId: string
  externalSubscriptionId?: string
  externalProductId?: string
  productName?: string
  status: ConversionStatus
  amountMinor: number // valor BRUTO cobrado, em unidade menor da moeda (centavos, cents, ienes...)
  refundedMinor?: number
  currency: string // ISO 4217, maiusculas
  paidAt?: Date
  refundedAt?: Date
  chargebackAt?: Date
  recurring?: boolean
  isTest?: boolean // ex.: Stripe livemode=false
  tracking: Record<string, string> // so chaves de rastreio permitidas, sanitizadas
}

export type Outcome =
  | { kind: 'conversion'; conversion: NormalizedConversion }
  | { kind: 'ignore'; reason: string; semRegistro?: boolean } // evento valido que nao e venda; semRegistro = nem entra no livro (ex.: carrinho abandonado)
  | { kind: 'invalid'; reason: string }

export type VerifyResult = { ok: true } | { ok: false; reason: 'missing' | 'bad_signature' | 'stale' | 'unconfigured' }

export interface VerifyInput {
  rawBody: Uint8Array // bytes EXATOS recebidos (a assinatura e calculada sobre eles)
  headers: Headers
  url: URL
  secrets: string[] // segredo atual (+ anterior, durante a janela de rotacao)
}

export interface AtribuicaoLida {
  viaMinipage: boolean
  itemType?: ItemType
  itemId?: string
}

export interface ProviderAdapter {
  readonly id: string
  readonly name: Record<'pt' | 'en' | 'es', string>
  readonly needsSecret: boolean
  readonly acceptedContentTypes: readonly string[]
  readonly maxBodyBytes?: number
  validateConfig(config: unknown): Record<string, unknown>
  verify(input: VerifyInput): VerifyResult
  parse(rawBody: Uint8Array): unknown
  idempotencyKey(payload: unknown, headers: Headers): string | null
  eventType(payload: unknown): string | null
  normalize(payload: unknown): Outcome
  readAttribution(tracking: Record<string, string>): AtribuicaoLida
  // Marcacao de links (tagLink/checkoutHosts) NAO faz parte desta etapa: entra na Etapa F.
}

export class ErroDeValidacao extends Error {
  constructor(public readonly codigo: string) {
    super(codigo)
    this.name = 'ErroDeValidacao'
  }
}
