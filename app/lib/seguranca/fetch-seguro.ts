// SEGURANCA (B1): cliente HTTP/HTTPS para buscar paginas EXTERNAS informadas por usuarios, protegido contra SSRF.
// Garantias (cada uma tem teste isolado em testes_ssrf/):
//  * O DESTINO DA CONEXAO e fixado: um lookup proprio resolve o nome UMA vez, valida TODOS os enderecos (se qualquer um for nao publico, a requisicao inteira e recusada) e entrega
//    ao socket somente enderecos validados. Nao existe segunda resolucao entre validar e conectar (fecha DNS rebinding e corrida).
//  * Cada redirecionamento e revalidado por completo (esquema, porta, host, DNS). Maximo de 3.
//  * TLS padrao do Node (certificado e hostname verificados, SNI pelo nome, TLS >= 1.2). Se NODE_TLS_REJECT_UNAUTHORIZED=0 estiver no ambiente, HTTPS e RECUSADO.
//  * Usa Agent proprio (nunca o agente global: variaveis de proxy por ambiente nao o afetam; ver teste).
//  * So cabecalhos permitidos (User-Agent, Accept, Accept-Language): nunca Authorization, cookies nem Referer.
//  * Limites: tempo total, tamanho do corpo (APOS descompressao), tamanho de cabecalhos, tipos de conteudo. Ao ultrapassar QUALQUER limite a leitura e INTERROMPIDA e o resultado e
//    ok:false (o chamador usa o fallback seguro; um corpo truncado NUNCA e devolvido como se fosse valido).
//  * Qualquer falha devolve ok:false com um motivo; nada de excecao para o chamador.
import * as dns from 'node:dns'
import * as http from 'node:http'
import * as https from 'node:https'
import * as zlib from 'node:zlib'

import type { Readable } from 'node:stream'
import { ipEhPublico, validarUrlExterna } from './url-externa'

export type MotivoFalha = 'url' | 'bloqueado' | 'dns' | 'tls' | 'rede' | 'tempo' | 'limite' | 'tipo' | 'redirecionamentos' | 'http' | 'ambiente'
export interface OpcoesFetchSeguro { headers?: Record<string, string>; maxBytes?: number; timeoutMs?: number; maxRedirecionamentos?: number }
export interface RespostaSegura {
  ok: boolean
  status: number
  urlFinal: string
  motivo?: MotivoFalha
  text(): Promise<string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json(): Promise<any>
}
export interface DepsFetchSeguro {
  resolver?: (host: string) => Promise<Array<{ address: string; family: number }>>
  ehPublico?: (ip: string) => boolean
  validarUrl?: typeof validarUrlExterna
  ca?: string | Buffer
  env?: Record<string, string | undefined>
}

export const LIMITE_PADRAO_BYTES = 3 * 1024 * 1024
export const TEMPO_PADRAO_MS = 8000
export const REDIRECIONAMENTOS_PADRAO = 3
const MAX_CABECALHOS_BYTES = 16 * 1024
const HEADERS_PERMITIDOS = new Set(['user-agent', 'accept', 'accept-language'])
const TIPOS_OK = /^(text\/(html|plain|xml|json)|application\/(xhtml\+xml|xml|json|[\w.+-]+\+(json|xml)))\b/

const falha = (motivo: MotivoFalha, status = 0, urlFinal = ''): RespostaSegura => ({
  ok: false, status, urlFinal, motivo, text: async () => '', json: async () => { throw new Error('sem corpo') },
})
const sucesso = (status: number, urlFinal: string, corpo: Buffer): RespostaSegura => {
  const texto = () => new TextDecoder('utf-8').decode(corpo)
  return { ok: true, status, urlFinal, text: async () => texto(), json: async () => JSON.parse(texto()) }
}

type Resultado =
  | { tipo: 'ok'; status: number; corpo: Buffer }
  | { tipo: 'status'; status: number }
  | { tipo: 'redirect'; status: number; location: string }
  | { tipo: 'falha'; motivo: MotivoFalha }

function classificar(e: unknown): MotivoFalha {
  const codigo = String((e as { code?: string })?.code ?? '')
  if (codigo === 'ESSRF_BLOQUEADO') return 'bloqueado'
  if (/^(ERR_TLS_|ERR_SSL_|CERT_|DEPTH_ZERO|SELF_SIGNED|UNABLE_TO_(VERIFY|GET)|HOSTNAME_MISMATCH|ERR_TLS)/.test(codigo)) return 'tls'
  if (codigo === 'ENOTFOUND' || codigo === 'EAI_AGAIN' || codigo === 'ESSRF_DNS') return 'dns'
  if (codigo === 'HPE_HEADER_OVERFLOW' || codigo === 'ERR_HTTP_HEADERS_SENT') return 'limite'
  return 'rede'
}

export function criarFetchSeguro(deps: DepsFetchSeguro = {}) {
  const resolver = deps.resolver ?? (async (host: string) => dns.promises.lookup(host, { all: true, verbatim: true }))
  const ehPublico = deps.ehPublico ?? ipEhPublico
  const validar = deps.validarUrl ?? validarUrlExterna
  const env = deps.env ?? process.env

  // lookup do socket: resolve UMA vez, valida TODOS os enderecos e devolve somente validados.
  const lookupSeguro = (hostname: string, opcoes: unknown, cb: (...a: unknown[]) => void) => {
    const o = (typeof opcoes === 'object' && opcoes !== null ? opcoes : {}) as { all?: boolean; family?: number | string }
    resolver(hostname).then((lista) => {
      if (!lista.length) { const e = Object.assign(new Error('sem enderecos'), { code: 'ESSRF_DNS' }); return cb(e) }
      for (const a of lista) if (!ehPublico(a.address)) return cb(Object.assign(new Error('destino nao publico'), { code: 'ESSRF_BLOQUEADO' }))
      const fam = Number(o.family) === 4 || Number(o.family) === 6 ? Number(o.family) : 0
      const uteis = fam ? lista.filter((a) => a.family === fam) : lista
      if (!uteis.length) return cb(Object.assign(new Error('sem enderecos da familia'), { code: 'ESSRF_DNS' }))
      if (o.all) return cb(null, uteis.map((a) => ({ address: a.address, family: a.family })))
      return cb(null, uteis[0].address, uteis[0].family)
    }, (e) => cb(e))
  }

  function requisitar(v: { url: URL; hostname: string; ehIp: boolean }, headers: Record<string, string>, maxBytes: number, restanteMs: number): Promise<Resultado> {
    return new Promise<Resultado>((resolve) => {
      let concluido = false
      let req: http.ClientRequest | null = null
      const timer = setTimeout(() => { req?.destroy(); fim({ tipo: 'falha', motivo: 'tempo' }) }, Math.max(1, restanteMs))
      const fim = (r: Resultado) => { if (concluido) return; concluido = true; clearTimeout(timer); resolve(r) }
      const ehHttps = v.url.protocol === 'https:'
      const mod = ehHttps ? https : http
      const agent = new mod.Agent({ keepAlive: false, maxSockets: 1 })
      const opcoes: https.RequestOptions = {
        agent, protocol: v.url.protocol, hostname: v.hostname, port: v.url.port || (ehHttps ? 443 : 80), method: 'GET', path: v.url.pathname + v.url.search,
        headers, lookup: lookupSeguro as unknown as https.RequestOptions['lookup'], maxHeaderSize: MAX_CABECALHOS_BYTES,
      }
      if (ehHttps) { opcoes.minVersion = 'TLSv1.2'; opcoes.rejectUnauthorized = true; if (!v.ehIp) opcoes.servername = v.hostname; if (deps.ca) opcoes.ca = deps.ca }
      try {
        req = mod.request(opcoes, (res) => {
          const status = res.statusCode ?? 0
          const local = res.headers.location
          if (status >= 300 && status < 400 && typeof local === 'string' && local) { fim({ tipo: 'redirect', status, location: local }); res.destroy(); return }
          if (status < 200 || status >= 300) { fim({ tipo: 'status', status }); res.destroy(); return }
          const tipoConteudo = String(res.headers['content-type'] ?? '').toLowerCase().trim()
          if (tipoConteudo && !TIPOS_OK.test(tipoConteudo)) { fim({ tipo: 'falha', motivo: 'tipo' }); res.destroy(); return }
          const declarado = Number(res.headers['content-length'])
          if (Number.isFinite(declarado) && declarado > maxBytes) { fim({ tipo: 'falha', motivo: 'limite' }); res.destroy(); return }
          const codificacao = String(res.headers['content-encoding'] ?? '').toLowerCase().trim()
          let fluxo: Readable = res
          if (codificacao === 'gzip' || codificacao === 'x-gzip') fluxo = res.pipe(zlib.createGunzip())
          else if (codificacao === 'deflate') fluxo = res.pipe(zlib.createInflate())
          else if (codificacao === 'br') fluxo = res.pipe(zlib.createBrotliDecompress())
          else if (codificacao && codificacao !== 'identity') { fim({ tipo: 'falha', motivo: 'tipo' }); res.destroy(); return }
          const partes: Buffer[] = []
          let total = 0
          fluxo.on('data', (c: Buffer) => {
            total += c.length
            if (total > maxBytes) { fim({ tipo: 'falha', motivo: 'limite' }); res.destroy(); fluxo.destroy(); return } // INTERROMPE a leitura (o resultado e registrado ANTES de destruir o socket)
            partes.push(c)
          })
          fluxo.on('end', () => fim({ tipo: 'ok', status, corpo: Buffer.concat(partes) }))
          fluxo.on('error', () => fim({ tipo: 'falha', motivo: 'rede' }))
          res.on('error', () => fim({ tipo: 'falha', motivo: 'rede' }))
          res.on('aborted', () => fim({ tipo: 'falha', motivo: 'rede' }))
        })
      } catch (e) { return fim({ tipo: 'falha', motivo: classificar(e) }) }
      req.on('error', (e) => fim({ tipo: 'falha', motivo: classificar(e) }))
      req.end()
    })
  }

  return async function fetchSeguro(url: string, op: OpcoesFetchSeguro = {}): Promise<RespostaSegura> {
    try {
      const inicio = Date.now()
      const totalMs = op.timeoutMs ?? TEMPO_PADRAO_MS
      const maxBytes = op.maxBytes ?? LIMITE_PADRAO_BYTES
      const maxSaltos = op.maxRedirecionamentos ?? REDIRECIONAMENTOS_PADRAO
      const headers: Record<string, string> = { 'Accept-Encoding': 'gzip, deflate, br', Connection: 'close' }
      for (const [k, val] of Object.entries(op.headers ?? {})) if (HEADERS_PERMITIDOS.has(k.toLowerCase()) && typeof val === 'string') headers[k] = val.replace(/[\r\n]/g, ' ')
      let atual = url
      for (let salto = 0; salto <= maxSaltos; salto++) {
        const v = validar(atual)
        if (!v.ok) return falha('url', 0, atual)
        if (v.ehIp && !ehPublico(v.hostname)) return falha('bloqueado', 0, atual)
        if (v.url.protocol === 'https:' && env.NODE_TLS_REJECT_UNAUTHORIZED === '0') return falha('ambiente', 0, atual)
        const restante = totalMs - (Date.now() - inicio)
        if (restante <= 0) return falha('tempo', 0, atual)
        const r = await requisitar(v, headers, maxBytes, restante)
        if (r.tipo === 'ok') return sucesso(r.status, v.url.toString(), r.corpo)
        if (r.tipo === 'status') return falha('http', r.status, v.url.toString())
        if (r.tipo === 'falha') return falha(r.motivo, 0, v.url.toString())
        let proximo: string
        try { proximo = new URL(r.location, v.url).toString() } catch { return falha('url', r.status, v.url.toString()) }
        atual = proximo
      }
      return falha('redirecionamentos', 0, atual)
    } catch {
      return falha('rede')
    }
  }
}

/** Instancia de PRODUCAO (resolver DNS real, validacao real). A rota importa somente esta. */
export const fetchSeguro = criarFetchSeguro()
