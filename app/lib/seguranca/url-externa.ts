// SEGURANCA (B1): validacao de URLs externas e classificacao de enderecos IP. Modulo PURO (sem rede).
// Usado por fetch-seguro.ts. Regras: somente http/https, portas 80/443, sem usuario/senha, sem hosts internos, IP somente PUBLICO (IPv4 fora das faixas especiais da IANA;
// IPv6 somente unicast global 2000::/3 menos faixas especiais). A URL e validada DEPOIS do parser WHATWG (que normaliza 0x7f.1, 2130706433, 017700000001, 127.1, largura total...).
import { isIP } from 'node:net'

export type MotivoUrl = 'invalida' | 'tamanho' | 'esquema' | 'credenciais' | 'porta' | 'host' | 'ip'
export type ResultadoUrl = { ok: true; url: URL; hostname: string; ehIp: boolean } | { ok: false; motivo: MotivoUrl }

export const TAMANHO_MAXIMO_URL = 2048
const PORTAS_PERMITIDAS = ['', '80', '443']

// IPv4 nao publico: [base, bits]
const BLOQUEADOS_V4: Array<[string, number]> = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
]
function v4ParaInt(ip: string): number | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip)
  if (!m) return null
  const p = [m[1], m[2], m[3], m[4]].map(Number)
  if (p.some((n) => n > 255)) return null
  return (((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0)
}
function v4Publico(ip: string): boolean {
  const n = v4ParaInt(ip)
  if (n === null) return false
  for (const [base, bits] of BLOQUEADOS_V4) {
    const b = v4ParaInt(base) as number
    const mascara = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
    if (((n & mascara) >>> 0) === ((b & mascara) >>> 0)) return false
  }
  return true
}
/** Expande IPv6 (com '::' e IPv4 embutido) para 16 bytes; null se invalido ou com zona (%). */
export function expandirIpv6(ip: string): number[] | null {
  if (ip.includes('%')) return null
  let s = ip.toLowerCase()
  const m4 = /^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(s)
  if (m4) {
    const p = m4[2].split('.').map(Number)
    if (p.some((n) => n > 255)) return null
    s = m4[1] + (((p[0] << 8) | p[1]).toString(16)) + ':' + (((p[2] << 8) | p[3]).toString(16))
  }
  const dbl = s.split('::')
  if (dbl.length > 2) return null
  const cabeca = dbl[0] ? dbl[0].split(':') : []
  const cauda = dbl.length === 2 && dbl[1] ? dbl[1].split(':') : []
  let grupos: string[]
  if (dbl.length === 2) {
    const falta = 8 - cabeca.length - cauda.length
    if (falta < 1) return null
    grupos = [...cabeca, ...Array<string>(falta).fill('0'), ...cauda]
  } else grupos = cabeca
  if (grupos.length !== 8) return null
  const bytes: number[] = []
  for (const g of grupos) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null
    const v = parseInt(g, 16)
    bytes.push(v >> 8, v & 255)
  }
  return bytes
}
function v6Publico(ip: string): boolean {
  const b = expandirIpv6(ip)
  if (!b) return false
  // IPv4 mapeado (::ffff:a.b.c.d): vale a regra do IPv4 embutido
  if (b.slice(0, 10).every((x) => x === 0) && b[10] === 0xff && b[11] === 0xff) return v4Publico(`${b[12]}.${b[13]}.${b[14]}.${b[15]}`)
  if ((b[0] & 0xe0) !== 0x20) return false // fora de 2000::/3 (inclui ::, ::1, ULA fc00::/7, link-local fe80::/10, multicast, NAT64 64:ff9b::/96, 100::/64...)
  if (b[0] === 0x20 && b[1] === 0x01 && (b[2] & 0xfe) === 0) return false // 2001::/23 (Teredo, benchmarking, ORCHID, protocolos IETF)
  if (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x0d && b[3] === 0xb8) return false // 2001:db8::/32 documentacao
  if (b[0] === 0x20 && b[1] === 0x02) return false // 2002::/16 (6to4: embute IPv4)
  if (b[0] === 0x3f && b[1] === 0xff && (b[2] & 0xf0) === 0) return false // 3fff::/20 documentacao
  return true
}
/** true somente para enderecos IP publicos e roteaveis. Qualquer coisa que nao seja IP valido => false. */
export function ipEhPublico(ip: string): boolean {
  const familia = isIP(ip)
  if (familia === 4) return v4Publico(ip)
  if (familia === 6) return v6Publico(ip)
  return false
}

const SUFIXOS_INTERNOS = ['.localhost', '.local', '.localdomain', '.internal', '.intranet', '.lan', '.home', '.home.arpa', '.corp', '.private']
const ROTULO = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
/** true se o NOME de host e proibido (interno, sem ponto, invalido). Nao se aplica a IP literal. */
export function hostnameProibido(hostname: string): boolean {
  let h = hostname.toLowerCase()
  if (h.endsWith('.')) h = h.slice(0, -1)
  if (!h || h.length > 253) return true
  if (h === 'localhost' || SUFIXOS_INTERNOS.some((s) => h.endsWith(s))) return true
  if (!h.includes('.')) return true
  return !h.split('.').every((r) => ROTULO.test(r))
}

export function validarUrlExterna(entrada: string): ResultadoUrl {
  if (typeof entrada !== 'string') return { ok: false, motivo: 'invalida' }
  if (entrada.length > TAMANHO_MAXIMO_URL) return { ok: false, motivo: 'tamanho' }
  if (/[\u0000-\u001f\u007f]/.test(entrada)) return { ok: false, motivo: 'invalida' }
  let url: URL
  try { url = new URL(entrada) } catch { return { ok: false, motivo: 'invalida' } }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, motivo: 'esquema' }
  if (url.username || url.password) return { ok: false, motivo: 'credenciais' }
  if (!PORTAS_PERMITIDAS.includes(url.port)) return { ok: false, motivo: 'porta' }
  const bruto = url.hostname
  const colchetes = bruto.startsWith('[') && bruto.endsWith(']')
  const hostname = colchetes ? bruto.slice(1, -1) : bruto
  const familia = isIP(hostname)
  if (familia !== 0) return ipEhPublico(hostname) ? { ok: true, url, hostname, ehIp: true } : { ok: false, motivo: 'ip' }
  if (colchetes) return { ok: false, motivo: 'ip' }
  if (hostnameProibido(hostname)) return { ok: false, motivo: 'host' }
  return { ok: true, url, hostname, ehIp: false }
}
