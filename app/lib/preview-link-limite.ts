// B1: limites do endpoint /api/catalogo/preview-link.
//
// (1) CONCORRENCIA: no maximo 8 consultas simultaneas POR INSTANCIA do servidor. NAO e protecao global: na Vercel cada instancia/regiao tem o seu proprio contador, e o numero de
//     instancias nao e controlado aqui. Serve para limitar o consumo de recursos de uma instancia; o limite por usuario (abaixo) e o controle de frequencia.
// (2) LIMITE POR USUARIO via a funcao do banco checar_rate_limit: PENDENTE e DESATIVADO. A semantica de retorno da funcao NAO foi confirmada (definicao nao coletada); o codigo abaixo
//     assume, so quando ativado, que true = liberado e false = limite excedido. NAO ative sem confirmar a definicao (ver docs_ssrf/B1_RELATORIO.md, secao "Pendencias").
import { createClient } from '@supabase/supabase-js'

export interface LimitadorConcorrencia { tentar(): (() => void) | null; emUso(): number }
export function criarLimitadorConcorrencia(max: number): LimitadorConcorrencia {
  let emUso = 0
  return {
    tentar() {
      if (emUso >= max) return null
      emUso++
      let liberado = false
      return () => { if (!liberado) { liberado = true; emUso-- } }
    },
    emUso: () => emUso,
  }
}
export const MAX_CONCORRENTES_POR_INSTANCIA = 8
export const concorrenciaPreview = criarLimitadorConcorrencia(MAX_CONCORRENTES_POR_INSTANCIA)

/** PENDENTE: so mude para true depois de confirmar a definicao de checar_rate_limit (retorno e semantica). */
export const LIMITE_POR_USUARIO_CONFIRMADO = false
export const LIMITE_POR_USUARIO = { max: 20, janelaSegundos: 60 }
export type ResultadoLimite = { permitido: boolean; motivo: 'desativado' | 'ok' | 'limite' | 'indisponivel' }
export interface DepsLimite {
  ativo?: boolean
  chamarRpc?: (args: { p_chave: string; p_max: number; p_janela_segundos: number }) => Promise<{ data: unknown; error: unknown }>
}
async function rpcPadrao(args: { p_chave: string; p_max: number; p_janela_segundos: number }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !chave) return { data: null, error: new Error('configuracao ausente') }
  const cliente = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
  return cliente.rpc('checar_rate_limit', args)
}
export async function verificarLimiteUsuario(userId: string, deps: DepsLimite = {}): Promise<ResultadoLimite> {
  if (!(deps.ativo ?? LIMITE_POR_USUARIO_CONFIRMADO)) return { permitido: true, motivo: 'desativado' }
  try {
    const { data, error } = await (deps.chamarRpc ?? rpcPadrao)({ p_chave: 'preview-link:' + userId, p_max: LIMITE_POR_USUARIO.max, p_janela_segundos: LIMITE_POR_USUARIO.janelaSegundos })
    if (error) { console.error('[preview-link] limitador indisponivel (falha aberta)'); return { permitido: true, motivo: 'indisponivel' } }
    if (data === false) return { permitido: false, motivo: 'limite' }
    if (data === true) return { permitido: true, motivo: 'ok' }
    console.error('[preview-link] limitador devolveu formato inesperado (falha aberta)')
    return { permitido: true, motivo: 'indisponivel' }
  } catch {
    return { permitido: true, motivo: 'indisponivel' }
  }
}

/** Prazo maximo (ms) para RECEBER o corpo da requisicao. Um cliente lento nunca prende a rota alem disto. */
export const TEMPO_CORPO_MS = 5000

/**
 * Le o corpo JSON com teto de bytes E prazo. Devolve um objeto simples ou null (corpo invalido, grande demais, lento demais, cancelado pelo cliente).
 * A leitura e cancelada (reader.cancel) ao exceder o teto, ao esgotar o prazo ou quando o cliente aborta a conexao (request.signal), e a funcao NUNCA espera alem do prazo,
 * mesmo que o fluxo ignore o cancelamento (cada leitura compete com o prazo).
 */
export async function lerJsonLimitado(request: Request, maxBytes: number, timeoutMs: number = TEMPO_CORPO_MS): Promise<Record<string, unknown> | null> {
  const declarado = Number(request.headers.get('content-length'))
  if (Number.isFinite(declarado) && declarado > maxBytes) return null
  if (request.signal?.aborted) return null
  const leitor = request.body?.getReader()
  if (!leitor) return null
  type Fim = { done: true; value: undefined; esgotado: true }
  let timer: ReturnType<typeof setTimeout> | undefined
  let cancelado = false
  const cancelar = () => { if (cancelado) return; cancelado = true; leitor.cancel().catch(() => undefined) }
  const prazo = new Promise<Fim>((resolve) => { timer = setTimeout(() => { cancelar(); resolve({ done: true, value: undefined, esgotado: true }) }, timeoutMs) })
  const aoAbortar = () => cancelar()
  request.signal?.addEventListener('abort', aoAbortar, { once: true })
  const partes: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const lido = await Promise.race([leitor.read(), prazo])
      if ('esgotado' in lido) return null
      if (lido.done) break
      total += lido.value.length
      if (total > maxBytes) { cancelar(); return null }
      partes.push(lido.value)
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
    request.signal?.removeEventListener('abort', aoAbortar)
  }
  if (cancelado) return null
  try {
    const obj: unknown = JSON.parse(Buffer.concat(partes).toString('utf8'))
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj) ? (obj as Record<string, unknown>) : null
  } catch {
    return null
  }
}
