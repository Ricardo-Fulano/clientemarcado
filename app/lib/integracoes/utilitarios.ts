import { createHmac, timingSafeEqual } from 'node:crypto'
import { ITEM_TYPES, type AtribuicaoLida, type ItemType } from './tipos'

export function hmacHex(algoritmo: 'sha1' | 'sha256', chave: string, dados: Uint8Array): string {
  return createHmac(algoritmo, chave).update(dados).digest('hex')
}

// Comparacao em tempo constante (tamanhos diferentes = falso; o tamanho nao e segredo).
export function igualConstante(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

// ---------------- moeda (ISO 4217) ----------------
const SEM_CASAS = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'])
const TRES_CASAS = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'])
const QUATRO_CASAS = new Set(['CLF', 'UYW'])
export const LIMITE_VALOR_MENOR_UNIDADE = 100_000_000_000_000 // mesmo limite do CHECK do banco

export function ehMoedaIso(m: unknown): m is string {
  return typeof m === 'string' && /^[A-Z]{3}$/.test(m)
}
export function exponenteMoeda(moeda: string): number {
  if (SEM_CASAS.has(moeda)) return 0
  if (TRES_CASAS.has(moeda)) return 3
  if (QUATRO_CASAS.has(moeda)) return 4
  return 2
}
// Valor JA em unidade menor (inteiro >= 0). Aceita number inteiro ou string de digitos.
export function inteiroMenorUnidade(v: unknown): number | null {
  let n: number
  if (typeof v === 'number') n = v
  else if (typeof v === 'string' && /^\d{1,15}$/.test(v.trim())) n = Number(v.trim())
  else return null
  if (!Number.isSafeInteger(n) || n < 0 || n > LIMITE_VALOR_MENOR_UNIDADE) return null
  return n
}
// Valor decimal em unidade MAIOR (ex.: "103.88") convertido com aritmetica exata (sem float). Casas a mais so se forem zeros.
export function decimalParaMenorUnidade(v: unknown, moeda: string): number | null {
  const s = typeof v === 'number' ? (Number.isFinite(v) ? String(v) : '') : typeof v === 'string' ? v.trim() : ''
  const m = /^(\d{1,15})(?:\.(\d{1,12}))?$/.exec(s)
  if (!m) return null
  const exp = exponenteMoeda(moeda)
  const frac = m[2] ?? ''
  if (frac.length > exp && /[1-9]/.test(frac.slice(exp))) return null
  const inteiro = BigInt(m[1] + frac.slice(0, exp).padEnd(exp, '0'))
  if (inteiro > BigInt(LIMITE_VALOR_MENOR_UNIDADE)) return null
  return Number(inteiro)
}

// ---------------- texto ----------------
// Remove caracteres de controle e surrogates soltos (invalidos em UTF-8/JSON do banco) e limita o tamanho.
export function limparTexto(valor: unknown, max: number): string | undefined {
  if (typeof valor !== 'string' && typeof valor !== 'number') return undefined
  const s = String(valor)
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c <= 0x08 || c === 0x0b || c === 0x0c || (c >= 0x0e && c <= 0x1f) || c === 0x7f || c === 0xfffe || c === 0xffff) continue
    if (c >= 0xd800 && c <= 0xdbff) {
      const n = s.charCodeAt(i + 1)
      if (n >= 0xdc00 && n <= 0xdfff) { out += s[i] + s[i + 1]; i++ }
      continue
    }
    if (c >= 0xdc00 && c <= 0xdfff) continue
    out += s[i]
  }
  out = out.trim()
  if (!out) return undefined
  return out.length > max ? out.slice(0, max) : out
}

export function ehUuid(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v)
}

// So as chaves permitidas, valores texto <= 200, no maximo 12 chaves e ~1000 bytes no total (limite do banco: 1024).
export function sanitizarTracking(origem: unknown, chavesPermitidas: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {}
  if (!origem || typeof origem !== 'object' || Array.isArray(origem)) return out
  let tamanho = 2
  for (const chave of chavesPermitidas) {
    if (Object.keys(out).length >= 12) break
    const v = limparTexto((origem as Record<string, unknown>)[chave], 200)
    if (v === undefined) continue
    const custo = JSON.stringify(chave).length + JSON.stringify(v).length + 2
    if (tamanho + custo > 1000) continue
    out[chave] = v
    tamanho += custo
  }
  return out
}

// ---------------- datas ----------------
// Aceita "YYYY-MM-DD HH:mm[:ss]" no fuso local informado (offset em minutos em relacao ao UTC, ex.: Brasilia = -180)
// ou ISO 8601 com "Z"/offset. Devolve UTC ou null.
export function dataParaUtc(valor: unknown, offsetLocalMin: number): Date | null {
  if (typeof valor !== 'string') return null
  const s = valor.trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(s)
  if (m) {
    const [a, mo, d, h, mi, se] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0)]
    const baseMs = Date.UTC(a, mo - 1, d, h, mi, se)
    const chk = new Date(baseMs)
    if (chk.getUTCFullYear() !== a || chk.getUTCMonth() !== mo - 1 || chk.getUTCDate() !== d || chk.getUTCHours() !== h || chk.getUTCMinutes() !== mi) return null
    return new Date(baseMs - offsetLocalMin * 60000)
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/.test(s)) {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}
// Data plausivel: >= 2000-01-01 e no maximo 2 dias no futuro (o banco recusa < 2000).
export function dataPlausivel(d: Date | null, agoraMs: number): Date | undefined {
  if (!d) return undefined
  const t = d.getTime()
  if (Number.isNaN(t) || t < Date.UTC(2000, 0, 1) || t > agoraMs + 2 * 86400000) return undefined
  return d
}

// ---------------- corpo da requisicao ----------------
// Le o corpo CRU com teto de tamanho (null = excedeu). Nao confia so no Content-Length.
export async function lerCorpoLimitado(req: Request, max: number): Promise<Uint8Array | null> {
  const cl = req.headers.get('content-length')
  if (cl && /^\d+$/.test(cl) && Number(cl) > max) return null
  if (!req.body) return new Uint8Array(0)
  const reader = req.body.getReader()
  const partes: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > max) {
      try { await reader.cancel() } catch { /* ignora */ }
      return null
    }
    partes.push(value)
  }
  const out = new Uint8Array(total)
  let o = 0
  for (const p of partes) { out.set(p, o); o += p.byteLength }
  return out
}

// ---------------- atribuicao generica por UTM ----------------
// Convencao da MiniPage para a marcacao de links (etapa futura): utm_source=minipage, utm_medium=<tipo do item>, utm_content=<id do item>.
export function lerAtribuicaoUtm(tracking: Record<string, string>): AtribuicaoLida {
  if ((tracking.utm_source ?? '').toLowerCase() !== 'minipage') return { viaMinipage: false }
  const medio = (tracking.utm_medium ?? '').toLowerCase()
  const itemType = (ITEM_TYPES as readonly string[]).includes(medio) ? (medio as ItemType) : undefined
  const itemId = ehUuid(tracking.utm_content) ? tracking.utm_content.toLowerCase() : undefined
  return { viaMinipage: true, ...(itemType && itemId ? { itemType, itemId } : {}) }
}
