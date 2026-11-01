import { ErroDeValidacao, type AtribuicaoLida, type ConversionStatus, type Outcome, type ProviderAdapter, type VerifyInput, type VerifyResult } from '../tipos'
import { dataParaUtc, dataPlausivel, decimalParaMenorUnidade, ehMoedaIso, hmacHex, igualConstante, inteiroMenorUnidade, lerAtribuicaoUtm, limparTexto, sanitizarTracking } from '../utilitarios'

// Adaptador da Kiwify. Contrato conferido na documentacao oficial (docs.kiwify.com.br, "Receber e validar webhooks" e "Eventos de assinatura"):
//  * POST em JSON; a Kiwify acrescenta a query `signature` = HMAC-SHA1 em hexadecimal minusculo (40 chars) do CORPO CRU,
//    com o `token` do webhook como chave (o token NAO e enviado). Vetor oficial testado em t_kiwify.
//  * Idempotencia: order_id + webhook_event_type. A assinatura NAO protege contra replay (nao inclui data nem id de entrega).
//  * Datas na raiz do JSON (approved_date, created_at, updated_at, refunded_at) vem em horario de Brasilia (YYYY-MM-DD HH:mm).
//  * Cada cobranca de assinatura e um pedido novo (order_id novo) com o mesmo subscription_id.
// PONTO A CONFIRMAR COM UM PAYLOAD REAL ("Testar Webhook" -> "Ver logs"): a documentacao omite `Commissions` e `TrackingParameters` dos exemplos.
// Por isso o valor, a moeda e o rastreio sao lidos de CAMINHOS CANDIDATOS e, se nao for possivel ler com seguranca, o evento e recusado (invalid)
// em vez de gravar um valor chutado.

const OFFSET_BRASILIA_MIN = -180 // sem horario de verao desde 2019
const STATUS_POR_EVENTO: Record<string, ConversionStatus> = { order_approved: 'paid', subscription_renewed: 'paid', order_refunded: 'refunded', chargeback: 'chargeback' }
const EVENTOS_QUE_NAO_SAO_VENDA = new Set(['billet_created', 'pix_created', 'order_rejected', 'subscription_canceled', 'subscription_late'])
const CAMINHOS_VALOR = ['Commissions.charge_amount', 'payment.charge_amount', 'charge_amount'] as const
const CAMINHOS_MOEDA = ['Commissions.charge_currency', 'Commissions.currency', 'payment.charge_currency', 'charge_currency', 'currency'] as const
const CAMINHOS_PRODUTO_ID = ['Product.product_id', 'product.id', 'product_id'] as const
const CAMINHOS_PRODUTO_NOME = ['Product.product_name', 'product.name', 'product_name'] as const
const CHAVES_RASTREIO = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 's1', 's2', 's3'] as const
const HOST_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

function obter(obj: unknown, caminho: string): unknown {
  let atual: unknown = obj
  for (const parte of caminho.split('.')) {
    if (atual && typeof atual === 'object' && !Array.isArray(atual) && Object.prototype.hasOwnProperty.call(atual, parte)) atual = (atual as Record<string, unknown>)[parte]
    else return undefined
  }
  return atual
}
function primeiro(obj: unknown, caminhos: readonly string[]): unknown {
  for (const c of caminhos) {
    const v = obter(obj, c)
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}
const invalido = (reason: string): Outcome => ({ kind: 'invalid', reason })

export const kiwifyAdapter: ProviderAdapter = {
  id: 'kiwify',
  name: { pt: 'Kiwify', en: 'Kiwify', es: 'Kiwify' },
  needsSecret: true,
  acceptedContentTypes: ['application/json'],
  maxBodyBytes: 262144,

  validateConfig(config: unknown): Record<string, unknown> {
    if (config === undefined || config === null) return {}
    if (typeof config !== 'object' || Array.isArray(config)) throw new ErroDeValidacao('config_invalida')
    const c = config as Record<string, unknown>
    for (const k of Object.keys(c)) if (k !== 'checkout_hosts' && k !== 'tag_links') throw new ErroDeValidacao('config_campo_desconhecido')
    const out: Record<string, unknown> = {}
    if (c.checkout_hosts !== undefined) {
      if (!Array.isArray(c.checkout_hosts) || c.checkout_hosts.length > 10) throw new ErroDeValidacao('checkout_hosts_invalido')
      const hosts = c.checkout_hosts.map((h) => (typeof h === 'string' ? h.trim().toLowerCase() : ''))
      if (hosts.some((h) => !HOST_RE.test(h))) throw new ErroDeValidacao('checkout_hosts_invalido')
      out.checkout_hosts = Array.from(new Set(hosts))
    }
    if (c.tag_links !== undefined) {
      if (typeof c.tag_links !== 'boolean') throw new ErroDeValidacao('tag_links_invalido')
      out.tag_links = c.tag_links
    }
    return out
  },

  verify({ rawBody, url, secrets }: VerifyInput): VerifyResult {
    const assinatura = url.searchParams.get('signature')
    if (!assinatura) return { ok: false, reason: 'missing' }
    if (!/^[0-9a-fA-F]{40}$/.test(assinatura)) return { ok: false, reason: 'bad_signature' }
    const validos = secrets.filter((s) => typeof s === 'string' && s.length >= 16) // nunca aceita token vazio/curto: assinar com chave vazia nao prova nada
    if (validos.length === 0) return { ok: false, reason: 'unconfigured' }
    const recebida = assinatura.toLowerCase()
    let confere = false
    for (const s of validos) if (igualConstante(hmacHex('sha1', s, rawBody), recebida)) confere = true // percorre todos (sem retorno antecipado)
    return confere ? { ok: true } : { ok: false, reason: 'bad_signature' }
  },

  parse(rawBody: Uint8Array): unknown {
    let texto: string
    try { texto = new TextDecoder('utf-8', { fatal: true }).decode(rawBody) } catch { throw new ErroDeValidacao('corpo_nao_utf8') }
    let dados: unknown
    try { dados = JSON.parse(texto) } catch { throw new ErroDeValidacao('json_invalido') }
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw new ErroDeValidacao('payload_nao_objeto')
    return dados
  },

  idempotencyKey(payload: unknown): string | null {
    const id = limparTexto(obter(payload, 'order_id'), 120)
    const tipo = limparTexto(obter(payload, 'webhook_event_type'), 60)
    return id && tipo ? `${id}:${tipo}` : null
  },

  eventType(payload: unknown): string | null {
    return limparTexto(obter(payload, 'webhook_event_type'), 80) ?? null
  },

  normalize(payload: unknown): Outcome {
    const tipo = limparTexto(obter(payload, 'webhook_event_type'), 60)
    if (!tipo) return { kind: 'ignore', reason: 'no_event_type', semRegistro: true } // ex.: carrinho abandonado (formato proprio, sem order_id)
    if (EVENTOS_QUE_NAO_SAO_VENDA.has(tipo)) return { kind: 'ignore', reason: `not_a_conversion:${tipo}` }
    const status = Object.prototype.hasOwnProperty.call(STATUS_POR_EVENTO, tipo) ? STATUS_POR_EVENTO[tipo] : undefined
    if (!status) return { kind: 'ignore', reason: 'unsupported_event' }

    const orderId = limparTexto(obter(payload, 'order_id'), 200)
    if (!orderId) return invalido('order_id_missing')

    const moedaBruta = primeiro(payload, CAMINHOS_MOEDA)
    const moeda = typeof moedaBruta === 'string' ? moedaBruta.trim().toUpperCase() : undefined
    if (!ehMoedaIso(moeda)) return invalido('currency_missing')

    const brutoValor = primeiro(payload, CAMINHOS_VALOR)
    if (brutoValor === undefined) return invalido('amount_missing')
    // Padrao da Kiwify (API de vendas): valores INTEIROS em unidade menor (centavos). Valor com casas decimais e tratado como unidade maior.
    const ehInteiro = typeof brutoValor === 'number' ? Number.isInteger(brutoValor) : typeof brutoValor === 'string' && /^\d+$/.test(brutoValor.trim())
    const amountMinor = ehInteiro ? inteiroMenorUnidade(brutoValor) : decimalParaMenorUnidade(brutoValor, moeda)
    if (amountMinor === null) return invalido('amount_invalid')

    const agora = Date.now()
    const aprovado = dataPlausivel(dataParaUtc(obter(payload, 'approved_date'), OFFSET_BRASILIA_MIN), agora)
    const atualizado = dataPlausivel(dataParaUtc(obter(payload, 'updated_at'), OFFSET_BRASILIA_MIN), agora)
    const reembolsadoEm = dataPlausivel(dataParaUtc(obter(payload, 'refunded_at'), OFFSET_BRASILIA_MIN), agora)

    const subscriptionId = limparTexto(obter(payload, 'subscription_id') ?? obter(payload, 'Subscription.id'), 200)
    const origemRastreio = obter(payload, 'TrackingParameters') ?? obter(payload, 'tracking')

    return {
      kind: 'conversion',
      conversion: {
        externalOrderId: orderId,
        ...(subscriptionId ? { externalSubscriptionId: subscriptionId } : {}),
        ...(limparTexto(primeiro(payload, CAMINHOS_PRODUTO_ID), 200) ? { externalProductId: limparTexto(primeiro(payload, CAMINHOS_PRODUTO_ID), 200) } : {}),
        ...(limparTexto(primeiro(payload, CAMINHOS_PRODUTO_NOME), 200) ? { productName: limparTexto(primeiro(payload, CAMINHOS_PRODUTO_NOME), 200) } : {}),
        status,
        amountMinor,
        refundedMinor: status === 'refunded' ? amountMinor : 0, // a Kiwify reembolsa o valor total
        currency: moeda,
        ...(aprovado ? { paidAt: aprovado } : {}),
        ...(status === 'refunded' && (reembolsadoEm ?? atualizado) ? { refundedAt: (reembolsadoEm ?? atualizado) as Date } : {}),
        ...(status === 'chargeback' && atualizado ? { chargebackAt: atualizado } : {}),
        recurring: Boolean(subscriptionId) || tipo === 'subscription_renewed',
        tracking: sanitizarTracking(origemRastreio, CHAVES_RASTREIO),
      },
    }
  },

  readAttribution(tracking: Record<string, string>): AtribuicaoLida {
    return lerAtribuicaoUtm(tracking)
  },
}
