// Etapa 3D: logica PURA do consentimento OAuth e das conexoes de IA (sem React, sem Supabase, sem efeitos).
// Tudo que decide seguranca no navegador fica aqui, para ser testado isoladamente. O BANCO continua sendo a autoridade final
// (identidade por auth.uid(), plano, beta, validade, escopos, redirects aprovados). Nada aqui usa user_id, nem le tabelas.
// ATENCAO: o token da solicitacao (req) NUNCA pode ir para console, analytics, mensagens de erro ou telemetria.

export const ISS_ESPERADO = 'https://mcp.minipage.pro'

const REQ_REGEX = /^mcpreq_[0-9a-f]{64}$/
const NEXT_REGEX = /^\/oauth\/consent\?req=(mcpreq_[0-9a-f]{64})$/
const CODE_REGEX = /^mcpac_[0-9a-f]{64}$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function reqValido(v: unknown): v is string {
  return typeof v === 'string' && REQ_REGEX.test(v)
}

/** Le o req da query string. Exige EXATAMENTE um parametro req no formato mcpreq_ + 64 hex; qualquer outra coisa = null. */
export function reqDaBusca(search: string): string | null {
  const todos = new URLSearchParams(search).getAll('req')
  if (todos.length !== 1) return null
  const v = todos[0]
  return reqValido(v) ? v : null
}

export function caminhoConsentimento(req: string): string {
  return '/oauth/consent?req=' + req
}

/** Destino do login para quem chegou ao consentimento sem sessao. O unico valor possivel de next e o caminho do consentimento com req valido. */
export function urlLoginParaConsentimento(req: string): string {
  return '/login?next=' + encodeURIComponent(caminhoConsentimento(req))
}

/**
 * Destino apos o login. Retorna o consentimento SOMENTE se next for exatamente "/oauth/consent?req=mcpreq_<64 hex>".
 * Qualquer outra coisa (URL absoluta, //host, javascript:, data:, outro caminho, /painel, valor recodificado, parametro repetido) = "/painel".
 * O destino e RECONSTRUIDO a partir do req validado; o valor da query nunca e devolvido como veio.
 */
export function destinoAposLogin(search: string): string {
  const todos = new URLSearchParams(search).getAll('next')
  if (todos.length !== 1) return '/painel'
  const m = NEXT_REGEX.exec(todos[0] as string)
  return m ? caminhoConsentimento(m[1] as string) : '/painel'
}

// ---------------------------------------------------------------- escopos
export const ESCOPOS = {
  'analytics:read': {
    titulo: 'Desempenho da sua MiniPage',
    texto: 'Ver métricas de desempenho da sua MiniPage, como visualizações, cliques e itens mais acessados.',
  },
  'sales:read': {
    titulo: 'Vendas externas',
    texto: 'Ver resumos de vendas externas conectadas, sem dados pessoais de compradores.',
  },
} as const
export type Escopo = keyof typeof ESCOPOS

/** Mantem apenas escopos RECONHECIDOS (sem repeticao). Escopo desconhecido nunca e exibido nem enviado de volta. */
export function escoposConhecidos(raw: unknown): Escopo[] {
  if (!Array.isArray(raw)) return []
  const out: Escopo[] = []
  for (const s of raw) {
    if (typeof s === 'string' && Object.prototype.hasOwnProperty.call(ESCOPOS, s) && !out.includes(s as Escopo)) out.push(s as Escopo)
  }
  return out
}

/** Texto vindo do banco para exibicao: remove controles e marcas de direcao (anti-spoofing), limita o tamanho. React ainda escapa na renderizacao. */
export function limparTexto(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '').trim().slice(0, max)
}

// ---------------------------------------------------------------- erros
export type CodigoErro =
  | 'rede'
  | 'request_invalid'
  | 'beta_required'
  | 'plan_required'
  | 'invalid_scope'
  | 'grants_limit'
  | 'resposta_invalida'
  | 'inesperado'

export const MENSAGENS: Record<CodigoErro, { titulo: string; texto: string }> = {
  rede: { titulo: 'Não foi possível carregar', texto: 'Houve um problema de conexão. Verifique sua internet e tente novamente.' },
  request_invalid: { titulo: 'Pedido expirado ou já utilizado', texto: 'Este pedido de autorização expirou ou já foi usado. Volte ao aplicativo e tente conectar novamente.' },
  beta_required: { titulo: 'Recurso em fase de testes', texto: 'As integrações com IA estão em fase de testes fechada e ainda não foram liberadas para a sua conta.' },
  plan_required: { titulo: 'Recurso não incluído no seu plano', texto: 'As integrações com IA estão disponíveis nos planos Loja, Pro e Equipe. Você pode ver as opções em Meu plano.' },
  invalid_scope: { titulo: 'Permissões inválidas', texto: 'Não foi possível confirmar as permissões deste pedido. Volte ao aplicativo e tente novamente.' },
  grants_limit: { titulo: 'Limite de conexões atingido', texto: 'Você atingiu o limite de aplicativos conectados. Revogue algum acesso em Integrações com IA e tente novamente.' },
  resposta_invalida: { titulo: 'Não foi possível concluir', texto: 'A resposta recebida não pôde ser confirmada com segurança. Por precaução, nada foi aberto. Tente novamente pelo aplicativo.' },
  inesperado: { titulo: 'Algo deu errado', texto: 'Não foi possível concluir agora. Tente novamente em instantes.' },
}

const CODIGOS_DO_BANCO = new Set<string>(['request_invalid', 'beta_required', 'plan_required', 'invalid_scope', 'grants_limit'])

function obj(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

// ---------------------------------------------------------------- mcp_consent_get
export interface ConsentDados {
  clienteNome: string
  clienteHost: string | null
  redirectHost: string
  escopos: Escopo[]
  conta: string
}

export type LeituraConsent = { tipo: 'ok'; dados: ConsentDados } | { tipo: 'erro'; codigo: CodigoErro } | { tipo: 'login' }

export function interpretarConsentGet(data: unknown): LeituraConsent {
  const d = obj(data)
  if (!d) return { tipo: 'erro', codigo: 'resposta_invalida' }
  if (d.ok !== true) {
    if (d.error === 'unauthenticated') return { tipo: 'login' }
    return { tipo: 'erro', codigo: typeof d.error === 'string' && CODIGOS_DO_BANCO.has(d.error) ? (d.error as CodigoErro) : 'inesperado' }
  }
  const redirectHost = limparTexto(d.redirect_host, 253)
  const escopos = escoposConhecidos(d.scopes)
  if (!redirectHost || escopos.length === 0) return { tipo: 'erro', codigo: 'resposta_invalida' }
  return {
    tipo: 'ok',
    dados: {
      clienteNome: limparTexto(d.client_name, 100) || 'Aplicativo sem nome',
      clienteHost: limparTexto(d.client_host, 253) || null,
      redirectHost,
      escopos,
      conta: limparTexto(d.account, 100),
    },
  }
}

// ---------------------------------------------------------------- redirect final
/**
 * Monta a URL de retorno ao aplicativo SOMENTE com o que a RPC mcp_consent_decide devolveu e apos validar:
 * https (ou http em loopback com porta), sem credenciais nem fragmento, mesmo host que a tela de consentimento exibiu,
 * iss esperado, code no formato certo (aprovacao) ou access_denied (cancelamento). Qualquer divergencia = null (nao navegar).
 */
export function montarRedirectFinal(data: unknown, aprovou: boolean, redirectHostEsperado: string): string | null {
  const d = obj(data)
  if (!d || d.ok !== true) return null
  const ru = d.redirect_uri
  if (typeof ru !== 'string' || ru.length === 0 || ru.length > 512 || /[\u0000-\u0020\u007f\\]/.test(ru)) return null
  let u: URL
  try {
    u = new URL(ru)
  } catch {
    return null
  }
  if (u.username || u.password || u.hash) return null
  const loopback = u.protocol === 'http:' && (u.hostname === '127.0.0.1' || u.hostname === 'localhost' || u.hostname === '[::1]') && u.port !== ''
  if (u.protocol !== 'https:' && !loopback) return null
  if (!redirectHostEsperado || u.host.toLowerCase() !== redirectHostEsperado.toLowerCase()) return null
  if (d.iss !== ISS_ESPERADO) return null
  const state = d.state
  if (state !== null && state !== undefined && (typeof state !== 'string' || state.length > 512)) return null
  if (aprovou) {
    if (typeof d.code !== 'string' || !CODE_REGEX.test(d.code) || d.error !== undefined) return null
    u.searchParams.set('code', d.code)
  } else {
    if (d.error !== 'access_denied' || d.code !== undefined) return null
    u.searchParams.set('error', 'access_denied')
  }
  if (typeof state === 'string' && state.length > 0) u.searchParams.set('state', state)
  u.searchParams.set('iss', ISS_ESPERADO)
  return u.toString()
}

// ---------------------------------------------------------------- orquestracao (testavel com dependencias falsas)
export interface RpcResult {
  data: unknown
  error: unknown
}
export interface ConsentDeps {
  /** true se ha usuario autenticado na sessao atual do Supabase */
  temSessao: () => Promise<boolean>
  /** chamada de RPC com o cliente Supabase autenticado. fn so assume as 4 RPCs da Etapa 3B */
  rpc: (fn: 'mcp_consent_get' | 'mcp_consent_decide' | 'mcp_grants_list' | 'mcp_grant_revoke', args: Record<string, unknown>) => Promise<RpcResult>
}

export type Inicio =
  | { tipo: 'invalido' }
  | { tipo: 'login'; url: string }
  | { tipo: 'erro'; codigo: CodigoErro }
  | { tipo: 'pronto'; req: string; dados: ConsentDados }

function jwtInvalido(e: unknown): boolean {
  const o = obj(e)
  return !!o && o.code === 'PGRST301'
}

/** 1) valida o req localmente (sem RPC se invalido) 2) exige sessao (senao login com retorno seguro) 3) pergunta ao banco. */
export async function iniciarConsentimento(search: string, deps: ConsentDeps): Promise<Inicio> {
  const req = reqDaBusca(search)
  if (!req) return { tipo: 'invalido' }
  try {
    if (!(await deps.temSessao())) return { tipo: 'login', url: urlLoginParaConsentimento(req) }
    const r = await deps.rpc('mcp_consent_get', { p_request_token: req })
    if (r.error) return jwtInvalido(r.error) ? { tipo: 'login', url: urlLoginParaConsentimento(req) } : { tipo: 'erro', codigo: 'rede' }
    const leitura = interpretarConsentGet(r.data)
    if (leitura.tipo === 'login') return { tipo: 'login', url: urlLoginParaConsentimento(req) }
    if (leitura.tipo === 'erro') return leitura
    return { tipo: 'pronto', req, dados: leitura.dados }
  } catch {
    return { tipo: 'erro', codigo: 'rede' }
  }
}

export type Decisao =
  | { tipo: 'redirect'; url: string }
  | { tipo: 'login'; url: string }
  | { tipo: 'erro'; codigo: CodigoErro; retentavel: boolean }

/** Autoriza (com SOMENTE os escopos reconhecidos e exibidos) ou cancela. O banco decide; o redirect e validado antes de qualquer navegacao. */
export async function decidirConsentimento(req: string, dados: ConsentDados, aprovar: boolean, deps: ConsentDeps): Promise<Decisao> {
  if (!reqValido(req)) return { tipo: 'erro', codigo: 'inesperado', retentavel: false }
  try {
    const r = await deps.rpc('mcp_consent_decide', { p_request_token: req, p_approve: aprovar, p_scopes: aprovar ? [...dados.escopos] : null })
    if (r.error) return jwtInvalido(r.error) ? { tipo: 'login', url: urlLoginParaConsentimento(req) } : { tipo: 'erro', codigo: 'rede', retentavel: true }
    const d = obj(r.data)
    if (!d) return { tipo: 'erro', codigo: 'resposta_invalida', retentavel: false }
    if (d.ok !== true) {
      if (d.error === 'unauthenticated') return { tipo: 'login', url: urlLoginParaConsentimento(req) }
      const codigo: CodigoErro = typeof d.error === 'string' && CODIGOS_DO_BANCO.has(d.error) ? (d.error as CodigoErro) : 'inesperado'
      return { tipo: 'erro', codigo, retentavel: false }
    }
    const url = montarRedirectFinal(d, aprovar, dados.redirectHost)
    return url ? { tipo: 'redirect', url } : { tipo: 'erro', codigo: 'resposta_invalida', retentavel: false }
  } catch {
    return { tipo: 'erro', codigo: 'rede', retentavel: true }
  }
}

/** Trava contra duplo envio: enquanto houver decisao em andamento ou concluida, novas chamadas recebem a MESMA promessa (nenhuma RPC extra). So erro retentavel libera. */
export function criarTrava<T extends { tipo: string; retentavel?: boolean }>(): (fn: () => Promise<T>) => Promise<T> {
  let atual: Promise<T> | null = null
  return (fn) => {
    if (atual) return atual
    const p = fn().then(
      (r) => {
        if (r.tipo === 'erro' && r.retentavel) atual = null
        return r
      },
      (e) => {
        atual = null
        throw e
      },
    )
    atual = p
    return p
  }
}

// ---------------------------------------------------------------- conexoes (/painel/ia)
export interface Conexao {
  id: string
  cliente: string
  escopos: Escopo[]
  criadaEm: string | null
  ultimoUso: string | null
  consultas7d: number
  status: 'active' | 'suspended_beta' | 'suspended_plan' | 'desconhecido'
}

export type LeituraConexoes = { tipo: 'ok'; conexoes: Conexao[] } | { tipo: 'login' } | { tipo: 'erro' }

function dataIso(v: unknown): string | null {
  if (typeof v !== 'string' || Number.isNaN(new Date(v).getTime())) return null
  return v
}

export function interpretarConexoes(data: unknown): LeituraConexoes {
  const d = obj(data)
  if (!d) return { tipo: 'erro' }
  if (d.ok !== true) return d.error === 'unauthenticated' ? { tipo: 'login' } : { tipo: 'erro' }
  if (!Array.isArray(d.grants)) return { tipo: 'erro' }
  const conexoes: Conexao[] = []
  for (const g of d.grants) {
    const o = obj(g)
    if (!o || typeof o.grant_id !== 'string' || !UUID_REGEX.test(o.grant_id)) continue
    const st = o.status
    conexoes.push({
      id: o.grant_id,
      cliente: limparTexto(o.client_name, 100) || 'Aplicativo sem nome',
      escopos: escoposConhecidos(o.scopes),
      criadaEm: dataIso(o.created_at),
      ultimoUso: dataIso(o.last_used_at),
      consultas7d: typeof o.calls_7d === 'number' && Number.isFinite(o.calls_7d) && o.calls_7d >= 0 ? Math.floor(o.calls_7d) : 0,
      status: st === 'active' || st === 'suspended_beta' || st === 'suspended_plan' ? st : 'desconhecido',
    })
  }
  return { tipo: 'ok', conexoes }
}

export type ResultadoRevogacao = 'ok' | 'ja_revogada' | 'login' | 'erro'

export async function revogarConexao(id: string, deps: ConsentDeps): Promise<ResultadoRevogacao> {
  if (!UUID_REGEX.test(id)) return 'erro'
  try {
    const r = await deps.rpc('mcp_grant_revoke', { p_grant_id: id })
    if (r.error) return jwtInvalido(r.error) ? 'login' : 'erro'
    const d = obj(r.data)
    if (!d) return 'erro'
    if (d.ok === true) return 'ok'
    if (d.error === 'not_found') return 'ja_revogada'
    return d.error === 'unauthenticated' ? 'login' : 'erro'
  } catch {
    return 'erro'
  }
}

export async function listarConexoes(deps: ConsentDeps): Promise<LeituraConexoes> {
  try {
    const r = await deps.rpc('mcp_grants_list', {})
    if (r.error) return jwtInvalido(r.error) ? { tipo: 'login' } : { tipo: 'erro' }
    return interpretarConexoes(r.data)
  } catch {
    return { tipo: 'erro' }
  }
}
