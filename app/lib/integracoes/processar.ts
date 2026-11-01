import { createHash } from 'node:crypto'
import { decifrarSegredo, ErroCripto } from './cripto'
import { obterAdaptador } from './provedores'
import { LIMITE_REQUISICOES_POR_MINUTO_POR_IP, registrarEChecar, registrarFalha } from './limitador'
import { ErroDeValidacao, type ItemType, type NormalizedConversion } from './tipos'
import { ehMoedaIso, ehUuid, LIMITE_VALOR_MENOR_UNIDADE, lerCorpoLimitado } from './utilitarios'

// Processamento GENERICO do webhook (igual para qualquer provedor). So conhece o contrato do adaptador e o contrato de acesso a dados (DepsWebhook).
export interface ConexaoRegistro { id: string; user_id: string; provider: string; status: string }
export interface SegredosRegistro { ciphertext: string; key_version: number; prev_ciphertext: string | null; prev_key_version: number | null; prev_expires_at: string | null }
export interface AplicarEventoArgs { conexaoId: string; chave: string; tipoEvento: string | null; outcome: 'applied' | 'ignored'; conversao: Record<string, unknown> | null }

export class ErroBanco extends Error {
  constructor(public readonly codigo: string, mensagem: string) { super(mensagem); this.name = 'ErroBanco' }
}
export interface DepsWebhook {
  buscarConexao(publicId: string, provider: string): Promise<ConexaoRegistro | null>
  buscarSegredos(conexaoId: string): Promise<SegredosRegistro | null>
  entregasRecentes(conexaoId: string, desdeIso: string): Promise<number>
  itemDoDono(tipo: ItemType, itemId: string, userId: string): Promise<boolean>
  aplicarEvento(args: AplicarEventoArgs): Promise<string>
  purgarOportunista(): Promise<void>
}
export interface ResultadoWebhook { status: number; corpo: Record<string, unknown>; log: Record<string, unknown>; headers?: Record<string, string> }
export interface OpcoesProcessamento { agora?: () => number; aleatorio?: () => number }

const PROVIDER_RE = /^[a-z0-9_]{2,40}$/
const PUBLIC_ID_RE = /^[A-Za-z0-9_-]{22,64}$/
const LIMITE_ENTREGAS_POR_MINUTO = 120
const ERROS_DE_DADO = new Set(['22P02', '22003', '22001', '22023', '23514', '23502', '22007', '22008', '22021', '22P05'])
const nao_encontrado = { ok: false, error: 'not_found' }

export async function processarWebhook(req: Request, params: { provider: string; publicId: string }, deps: DepsWebhook, opcoes: OpcoesProcessamento = {}): Promise<ResultadoWebhook> {
  const agora = opcoes.agora ?? Date.now
  const inicio = agora()
  const aleatorio = opcoes.aleatorio ?? Math.random
  const log: Record<string, unknown> = { provider: String(params.provider).slice(0, 40), conexao: String(params.publicId).slice(0, 6) }
  const fim = (status: number, corpo: Record<string, unknown>, resultado: string, headers?: Record<string, string>): ResultadoWebhook => {
    log.status = status; log.resultado = resultado; log.ms = agora() - inicio
    return { status, corpo, log, ...(headers ? { headers } : {}) }
  }

  // 1) identificacao: qualquer falha = 404 uniforme (nao revela o que existe)
  if (!PROVIDER_RE.test(params.provider) || !PUBLIC_ID_RE.test(params.publicId)) return fim(404, nao_encontrado, 'params_invalidos')
  const adaptador = obterAdaptador(params.provider)
  if (!adaptador) return fim(404, nao_encontrado, 'provedor_desconhecido')

  // 2) contencao em memoria ANTES de qualquer consulta ao banco: por IP (quem testa IDs aleatorios) e por conexao
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim().slice(0, 64)
  const chaveIp = ip ? `ip:${ip}` : null
  if (chaveIp && !registrarEChecar(chaveIp, agora(), LIMITE_REQUISICOES_POR_MINUTO_POR_IP)) return fim(429, { ok: false, error: 'rate_limited' }, 'rate_limit_ip', { 'Retry-After': '60' })
  const chaveLimite = `${params.provider}:${params.publicId}`
  if (!registrarEChecar(chaveLimite, agora())) return fim(429, { ok: false, error: 'rate_limited' }, 'rate_limit_memoria', { 'Retry-After': '60' })

  // 3) tipo e tamanho do corpo
  const tipoConteudo = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (!adaptador.acceptedContentTypes.includes(tipoConteudo)) return fim(415, { ok: false, error: 'unsupported_media_type' }, 'content_type')
  const corpoCru = await lerCorpoLimitado(req, adaptador.maxBodyBytes ?? 262144)
  if (corpoCru === null) return fim(413, { ok: false, error: 'payload_too_large' }, 'corpo_grande')
  if (corpoCru.byteLength === 0) return fim(422, { ok: false, error: 'empty_body' }, 'corpo_vazio')

  try {
    // 4) conexao
    const conexao = await deps.buscarConexao(params.publicId, params.provider)
    if (!conexao || conexao.status === 'revoked') {
      if (chaveIp && !conexao) registrarFalha(chaveIp, agora()) // ID desconhecido conta como tentativa suspeita do IP
      return fim(404, nao_encontrado, 'conexao_inexistente_ou_revogada')
    }

    // 5) rate limit por conexao (contado no livro de entregas)
    if ((await deps.entregasRecentes(conexao.id, new Date(agora() - 60_000).toISOString())) >= LIMITE_ENTREGAS_POR_MINUTO) return fim(429, { ok: false, error: 'rate_limited' }, 'rate_limit_conexao', { 'Retry-After': '60' })

    // 6) segredo (atual + anterior, se ainda dentro da janela de rotacao) e assinatura
    if (adaptador.needsSecret) {
      const seg = await deps.buscarSegredos(conexao.id)
      if (!seg) { registrarFalha(chaveLimite, agora()); return fim(401, { ok: false, error: 'unauthorized' }, 'sem_segredo') }
      const segredos: string[] = []
      try { segredos.push(decifrarSegredo(seg.ciphertext, { conexaoId: conexao.id, provider: conexao.provider })) } catch (e) {
        log.erro_cripto = e instanceof ErroCripto ? e.codigo : 'desconhecido'
        return fim(500, { ok: false, error: 'server_error' }, 'cripto_falhou') // nossa configuracao: o provedor reenviara
      }
      if (seg.prev_ciphertext && seg.prev_expires_at && Date.parse(seg.prev_expires_at) > agora()) {
        try { segredos.push(decifrarSegredo(seg.prev_ciphertext, { conexaoId: conexao.id, provider: conexao.provider })) } catch { log.prev_ilegivel = true }
      }
      const v = adaptador.verify({ rawBody: corpoCru, headers: req.headers, url: new URL(req.url), secrets: segredos })
      if (!v.ok) { registrarFalha(chaveLimite, agora()); if (chaveIp) registrarFalha(chaveIp, agora()); log.motivo = v.reason; return fim(401, { ok: false, error: 'unauthorized' }, 'assinatura_invalida') }
    }

    // 7) autentico: parse + normalizacao (pura)
    let payload: unknown
    try { payload = adaptador.parse(corpoCru) } catch (e) { return fim(422, { ok: false, error: e instanceof ErroDeValidacao ? e.codigo : 'invalid_payload' }, 'payload_invalido') }
    const saida = adaptador.normalize(payload)
    if (saida.kind === 'ignore' && saida.semRegistro) return fim(200, { ok: true, ignored: true }, `ignorado_sem_registro:${saida.reason}`)
    if (saida.kind === 'invalid') return fim(422, { ok: false, error: saida.reason }, `invalido:${saida.reason}`)
    const chave = adaptador.idempotencyKey(payload, req.headers)
    if (!chave) return fim(422, { ok: false, error: 'missing_event_id' }, 'sem_chave_idempotencia')
    log.chave = createHash('sha256').update(chave).digest('hex').slice(0, 8)
    const tipoEvento = adaptador.eventType(payload)

    // 8) conversao: sanidade + atribuicao (o item so vale se for do MESMO dono da conexao)
    let conversao: Record<string, unknown> | null = null
    if (saida.kind === 'conversion') {
      const c = saida.conversion
      const problema = validarConversao(c)
      if (problema) return fim(422, { ok: false, error: problema }, `invalido:${problema}`)
      const attr = adaptador.readAttribution(c.tracking)
      let itemType: ItemType | null = null
      let itemId: string | null = null
      if (attr.itemType && attr.itemId && ehUuid(attr.itemId) && (await deps.itemDoDono(attr.itemType, attr.itemId, conexao.user_id))) { itemType = attr.itemType; itemId = attr.itemId }
      log.via_minipage = attr.viaMinipage
      log.item_atribuido = itemId !== null
      conversao = montarConversao(c, agora(), attr.viaMinipage, itemType, itemId)
    }

    // 9) uma transacao no banco: plano + pausa + idempotencia + merge
    const codigo = await deps.aplicarEvento({ conexaoId: conexao.id, chave, tipoEvento, outcome: saida.kind === 'conversion' ? 'applied' : 'ignored', conversao })
    let resposta: ResultadoWebhook
    if (codigo === 'applied' || codigo === 'ignored' || codigo === 'duplicate') resposta = fim(200, { ok: true, result: codigo }, codigo)
    else if (codigo === 'dropped_plan' || codigo === 'dropped_paused') resposta = fim(200, { ok: true, ignored: true }, codigo) // 200: evita tempestade de reenvios; nada foi gravado
    else if (codigo === 'inactive' || codigo === 'not_found') resposta = fim(404, nao_encontrado, codigo)
    else resposta = fim(500, { ok: false, error: 'server_error' }, 'codigo_desconhecido')

    if (resposta.status === 200 && aleatorio() < 0.01) { try { await deps.purgarOportunista() } catch { /* retencao e oportunista */ } }
    return resposta
  } catch (e) {
    if (e instanceof ErroBanco) {
      log.erro_banco = e.codigo
      if (ERROS_DE_DADO.has(e.codigo)) return fim(422, { ok: false, error: 'data_rejected' }, 'dado_rejeitado')
    }
    log.excecao = e instanceof Error ? e.name : 'desconhecida'
    return fim(500, { ok: false, error: 'server_error' }, 'erro_interno')
  }
}

function validarConversao(c: NormalizedConversion): string | null {
  if (!c.externalOrderId || c.externalOrderId.length > 200) return 'order_id_invalid'
  if (!ehMoedaIso(c.currency)) return 'currency_invalid'
  if (!Number.isSafeInteger(c.amountMinor) || c.amountMinor < 0 || c.amountMinor > LIMITE_VALOR_MENOR_UNIDADE) return 'amount_invalid'
  const r = c.refundedMinor ?? 0
  if (!Number.isSafeInteger(r) || r < 0 || r > c.amountMinor) return 'refunded_invalid'
  return null
}

function montarConversao(c: NormalizedConversion, agoraMs: number, via: boolean, itemType: ItemType | null, itemId: string | null): Record<string, unknown> {
  const iso = (d: Date | undefined) => (d ? d.toISOString() : null)
  const agoraIso = new Date(agoraMs).toISOString()
  return {
    external_order_id: c.externalOrderId,
    external_subscription_id: c.externalSubscriptionId ?? null,
    external_product_id: c.externalProductId ?? null,
    product_name: c.productName ?? null,
    status: c.status,
    amount_minor: c.amountMinor,
    refunded_minor: c.refundedMinor ?? 0,
    currency: c.currency,
    recurring: c.recurring ?? false,
    is_test: c.isTest ?? false,
    paid_at: iso(c.paidAt) ?? (c.status === 'paid' ? agoraIso : null),
    refunded_at: iso(c.refundedAt) ?? (c.status === 'refunded' || c.status === 'partially_refunded' ? agoraIso : null),
    chargeback_at: iso(c.chargebackAt) ?? (c.status === 'chargeback' ? agoraIso : null),
    via_minipage: via || itemId !== null,
    item_type: itemType,
    item_id: itemId,
    tracking: c.tracking,
  }
}
