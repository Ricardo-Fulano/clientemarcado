// Cartao digital da MiniPage: LOGICA PURA (sem Next, sem Supabase, sem rede). Testada em testes_cartao/.
// Tudo aqui e arquivo unico e sem imports relativos, para poder ser executado direto pelo Node nos testes.

export const HOST_CANONICO = 'https://minipage.pro'
export const URL_CADASTRO_GRATIS = 'https://www.clientemarcado.com.br/cadastro'
export const HOST_PAINEL = 'https://www.clientemarcado.com.br'
const HOSTS_PERMITIDOS = ['minipage.pro', 'clientemarcado.com.br', 'www.clientemarcado.com.br']

// ---------------------------------------------------------------- slug e URLs
/** Normaliza o slug vindo da rota ("@" opcional, percent-encoding residual). Devolve null para valores que nao podem ser um slug. */
export function normalizarSlug(bruto: unknown): string | null {
  if (typeof bruto !== 'string') return null
  let s = bruto
  try { s = decodeURIComponent(s) } catch { return null }
  s = s.trim()
  if (s.startsWith('@')) s = s.slice(1)
  if (s.length === 0 || s.length > 80) return null
  if (/[\u0000-\u001f\u007f\s/\\?#%@<>"'`]/.test(s)) return null
  return s
}

export const urlPublica = (slug: string): string => `${HOST_CANONICO}/${encodeURIComponent(slug)}`
/** Alvo do QR Code: a pagina publica canonica + origem (alimenta GA4/Pixel que a pagina ja carrega). Curta para gerar um QR mais simples. */
export const urlQr = (slug: string): string => `${urlPublica(slug)}?utm_source=qr&utm_medium=cartao`
export const urlCompartilhar = (slug: string): string => `${urlPublica(slug)}?utm_source=compartilhar&utm_medium=cartao`
export const urlCartao = (origem: string, slug: string): string => `${origem}/${encodeURIComponent(slug)}/cartao`
export const urlVcf = (slug: string): string => `/${encodeURIComponent(slug)}/contato.vcf`

/** Origem (esquema + host) da requisicao, SOMENTE se for um dos hosts da plataforma; senao o dominio canonico. Evita host header injection no manifesto. */
export function origemPermitida(hostHeader: string | null | undefined, producao: boolean = process.env.NODE_ENV === 'production'): string {
  const h = (hostHeader || '').split(',')[0]!.trim().toLowerCase()
  if (HOSTS_PERMITIDOS.includes(h)) return `https://${h}`
  if (!producao && /^(localhost|127\.0\.0\.1)(:\d{2,5})?$/.test(h)) return `http://${h}`
  return HOST_CANONICO
}

/**
 * Origem LOCAL de desenvolvimento, somente para "Abrir meu cartao" no painel quando o proprio painel roda em localhost.
 * Aceita APENAS os hosts exatos "localhost" e "127.0.0.1" (nunca "localhost.evil.com", "127.0.0.1.evil", IPv6, dominios): o resultado e sempre a mesma
 * origem local de quem esta usando, entao nao existe como apontar para um dominio arbitrario. Qualquer outra coisa => null.
 */
export function origemLocal(loc: { protocol?: string | null; hostname?: string | null; port?: string | null } | null | undefined): string | null {
  if (!loc) return null
  const host = (loc.hostname || '').toLowerCase()
  if (host !== 'localhost' && host !== '127.0.0.1') return null
  if (loc.protocol !== 'http:' && loc.protocol !== 'https:') return null
  const porta = loc.port || ''
  if (porta !== '' && !/^\d{2,5}$/.test(porta)) return null
  return `${loc.protocol}//${host}${porta ? ':' + porta : ''}`
}

/** Origem usada pelo painel para ABRIR o cartao: a local em desenvolvimento, senao o dominio publico canonico. O QR e os links compartilhados NUNCA usam isto. */
export function resolverOrigemCartao(loc: { protocol?: string | null; hostname?: string | null; port?: string | null } | null | undefined): string {
  return origemLocal(loc) ?? HOST_CANONICO
}

/**
 * Destino do botao "Entrar no painel": a PORTA DE ENTRADA normal da aplicacao (/painel). Quem nao tem sessao cai no login existente; quem tem, no painel.
 * Link puro: nao carrega token, sessao, slug nem identificacao do dono. A origem recebida deve ser uma das validadas por origemPermitida; qualquer
 * outra coisa cai no dominio do painel. minipage.pro nao hospeda o painel, entao aponta para o dominio do painel.
 */
export function urlPainel(origemDaPagina: string | null | undefined): string {
  const o = origemDaPagina || ''
  if (o === 'https://clientemarcado.com.br' || o === 'https://www.clientemarcado.com.br') return `${o}/painel`
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d{2,5})?$/.test(o)) return `${o}/painel`
  return `${HOST_PAINEL}/painel`
}

// ---------------------------------------------------------------- texto seguro
export function limparTexto(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

// ---------------------------------------------------------------- telefone a partir de links publicos
export interface LinkPublico {
  url?: string | null
  tipo?: string | null
  ativo?: boolean | null
  ordem?: number | null
}

function digitosParaE164(d: string): string | null {
  if (!/^\d+$/.test(d)) return null
  // Brasil so e presumido quando o formato brasileiro BATE (um numero dos EUA, 11 digitos, nao pode virar +55):
  if (/^55[1-9][1-9]\d{8,9}$/.test(d)) return '+' + d // Brasil ja com DDI (12-13 digitos)
  if (/^[1-9][1-9]9\d{8}$/.test(d)) return '+55' + d // celular brasileiro sem DDI: DDD + 9 + 8 digitos
  if (/^[1-9][1-9][2-5]\d{7}$/.test(d)) return '+55' + d // fixo brasileiro sem DDI: DDD + 8 digitos iniciando em 2-5
  if (d.length >= 8 && d.length <= 15) return '+' + d // demais: o numero ja e internacional (wa.me exige DDI)
  return null
}

/** Extrai um numero de telefone de UM link publico (wa.me/<numero>, api.whatsapp.com/send?phone=, tel:). Links sem numero (wa.me/message/..., grupos) => null. */
export function telefoneDeUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const u = url.trim()
  if (u.length === 0 || u.length > 600) return null
  const tel = /^tel:\+?([\d\s().-]{8,25})$/i.exec(u)
  if (tel) return digitosParaE164((tel[1] as string).replace(/\D/g, ''))
  const wa = /^(?:https?:\/\/)?(?:www\.)?wa\.me\/(\+?\d{8,15})(?:[/?#].*)?$/i.exec(u)
  if (wa) return digitosParaE164((wa[1] as string).replace(/\D/g, ''))
  const api = /^(?:https?:\/\/(?:api|web)\.whatsapp\.com\/send|whatsapp:\/\/send)\?(.*)$/i.exec(u)
  if (api) {
    const p = /(?:^|&)phone=(\+?\d{8,15})(?:&|#|$)/i.exec(api[1] as string)
    if (p) return digitosParaE164((p[1] as string).replace(/\D/g, ''))
  }
  return null
}

/** Primeiro numero (por "ordem") dentre os links ATIVOS da pagina: o mesmo contato que o visitante ja ve publicamente. */
export function extrairTelefone(links: LinkPublico[] | null | undefined): string | null {
  const ativos = (links || []).map((l, i) => ({ l, i })).filter(({ l }) => l && l.ativo !== false)
  ativos.sort((a, b) => (a.l.ordem ?? 1e9) - (b.l.ordem ?? 1e9) || a.i - b.i)
  for (const { l } of ativos) {
    const t = telefoneDeUrl(l.url)
    if (t) return t
  }
  return null
}

// ---------------------------------------------------------------- vCard 3.0
export interface DadosContato {
  nome: string
  telefone?: string | null
  descricao?: string | null
  url: string
  endereco?: string | null
  cidade?: string | null
}

/** RFC 2426: escapa barra invertida, virgula, ponto e virgula e quebras de linha (uma quebra NUNCA vira linha nova no arquivo). */
export function escaparVcard(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n|\u2028|\u2029/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

/** Dobra linhas com mais de 75 OCTETOS (RFC 2426), sem partir sequencias UTF-8. */
export function dobrarLinha(linha: string): string[] {
  const enc = new TextEncoder()
  const out: string[] = []
  let atual = ''
  let bytes = 0
  let maxOctetos = 75
  for (const ch of linha) {
    const n = enc.encode(ch).length
    if (bytes + n > maxOctetos) {
      out.push(atual)
      atual = ' ' // continuacao comeca com 1 espaco (conta nos 75)
      bytes = 1
      maxOctetos = 75
    }
    atual += ch
    bytes += n
  }
  out.push(atual)
  return out
}

export function gerarVcard(d: DadosContato): string {
  const nome = limparTexto(d.nome, 100) || 'MiniPage'
  const linhas: string[] = ['BEGIN:VCARD', 'VERSION:3.0', 'PRODID:-//MiniPage Pro//Cartao Digital//PT-BR']
  linhas.push(`FN:${escaparVcard(nome)}`)
  linhas.push(`N:${escaparVcard(nome)};;;;`)
  linhas.push(`ORG:${escaparVcard(nome)}`)
  linhas.push('X-ABShowAs:COMPANY')
  const tel = typeof d.telefone === 'string' && /^\+\d{8,15}$/.test(d.telefone) ? d.telefone : null // so numero E.164 validado
  if (tel) linhas.push(`TEL;TYPE=CELL,VOICE:${tel}`)
  if (/^https:\/\/[^\s]+$/.test(d.url)) linhas.push(`URL:${escaparVcard(d.url)}`)
  const rua = limparTexto(d.endereco, 200)
  const cidade = limparTexto(d.cidade, 100)
  if (rua || cidade) linhas.push(`ADR;TYPE=WORK:;;${escaparVcard(rua)};${escaparVcard(cidade)};;;`)
  const nota = limparTexto(d.descricao, 300)
  if (nota) linhas.push(`NOTE:${escaparVcard(nota)}`)
  linhas.push('END:VCARD')
  return linhas.flatMap(dobrarLinha).join('\r\n') + '\r\n'
}

export function nomeArquivoVcf(slug: string): string {
  const base = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  return `contato-${base || 'minipage'}.vcf`
}

// ---------------------------------------------------------------- manifesto PWA por MiniPage
export interface ManifestoEntrada {
  slug: string
  nome: string
}

/**
 * Manifesto INDIVIDUAL de uma MiniPage. id/start_url/scope sao relativos a origem de quem serve a pagina.
 * id (identidade do app) e o proprio caminho do cartao: slugs diferentes => aplicativos instalados diferentes.
 * scope termina em "/" (o escopo e prefixo de TEXTO: "/maria" casaria com "/mariana").
 */
export function montarManifesto({ slug, nome }: ManifestoEntrada): Record<string, unknown> {
  const s = encodeURIComponent(slug)
  const nomeLimpo = limparTexto(nome, 60) || 'MiniPage'
  const curto = nomeLimpo.length > 14 ? nomeLimpo.slice(0, 13).trimEnd() + '…' : nomeLimpo
  return {
    id: `/${s}/cartao`,
    name: nomeLimpo,
    short_name: curto,
    description: `Cartão digital de ${nomeLimpo}: QR Code, contato e MiniPage.`,
    lang: 'pt-BR',
    dir: 'ltr',
    start_url: `/${s}/cartao?origem=atalho`,
    scope: `/${s}/`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#08060A',
    theme_color: '#08060A',
    categories: ['business', 'social'],
    icons: [
      { src: '/cartao/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/cartao/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/cartao/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Meu QR Code', short_name: 'QR Code', url: `/${s}/cartao?origem=atalho&painel=qr`, icons: [{ src: '/cartao/icon-192.png', sizes: '192x192', type: 'image/png' }] },
    ],
  }
}
