// Resolvedor da ORDEM das secoes publicas da MiniPage (perfis.ordem_secoes_publicas).
// Funcao PURA, compartilhada pela pagina publica (/[slug]) e, na proxima fase, pelo painel
// (Minha MiniPage), para nunca divergirem.
//
// A ordem salva e um array jsonb de textos. Dois formatos convivem:
//   1. CHAVE DE TIPO (formato antigo): 'destaques' | 'albuns' | 'links' | 'agenda' | 'catalogo'
//      | 'videos' | 'cards' | 'spotify'.
//   2. INSTANCIA de uma secao: 'destaques:<uuid>' ou 'cards:<uuid>' (Destaques e Links visuais).
//
// Para 'destaques' e 'cards' a chave de tipo antiga significa "TODAS as secoes desse tipo que nao
// aparecem individualmente na ordem", expandidas naquela posicao, na ordem padrao das secoes.
// Assim, toda ordem antiga continua produzindo exatamente a sequencia de hoje.
//
// Regras (todas cobertas por testes):
//  - chaves/tokens desconhecidos, mal formados ou de outro tipo sao descartados em silencio;
//  - duplicatas: a PRIMEIRA ocorrencia vence;
//  - instancia cujo id nao existe entre as secoes recebidas (apagada, inativa, vazia ou de OUTRA
//    conta) e descartada - quem chama so passa as secoes do proprio usuario;
//  - uma instancia individual tem prioridade sobre o grupo do mesmo tipo;
//  - o que faltar e acrescentado no fim, na ordem de ORDEM_PADRAO_SECOES (mesmo comportamento do
//    antigo normalizarOrdemSecoes): chaves de tipo ausentes e secoes ainda nao referenciadas.
//    Se a chave de grupo antiga ('destaques'/'cards') existir na ordem, as secoes novas entram na
//    posicao dela (como hoje); sem ela, entram no fim.

// Mesma lista que antes estava duplicada em /[slug] e em Minha MiniPage.
export const ORDEM_PADRAO_SECOES = ['destaques', 'albuns', 'links', 'agenda', 'catalogo', 'videos', 'cards', 'spotify'] as const
export type TipoSecaoPublica = typeof ORDEM_PADRAO_SECOES[number]

// Tipos que aceitam instancias individuais nesta fase. Links comuns, Spotify, Catalogo e Albuns
// continuam como bloco unico por tipo.
export const TIPOS_COM_INSTANCIAS = ['destaques', 'cards'] as const
export type TipoComInstancias = typeof TIPOS_COM_INSTANCIAS[number]

export type SecoesPorTipo = { destaques?: readonly string[]; cards?: readonly string[] }
export type BlocoOrdem = { chave: string; tipo: TipoSecaoPublica; secaoId?: string }

// Protecao contra um array absurdo salvo por engano: nunca processa mais que isso.
const MAX_TOKENS = 200
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function ehTipo(v: string): v is TipoSecaoPublica {
  return (ORDEM_PADRAO_SECOES as readonly string[]).includes(v)
}
function ehTipoComInstancias(t: TipoSecaoPublica): t is TipoComInstancias {
  return (TIPOS_COM_INSTANCIAS as readonly string[]).includes(t)
}

export function chaveInstancia(tipo: TipoComInstancias, secaoId: string): string {
  return `${tipo}:${secaoId}`
}

// 'destaques:<uuid>' / 'cards:<uuid>' -> { tipo, id }. Qualquer outra coisa -> null.
export function interpretarInstancia(token: string): { tipo: TipoComInstancias; id: string } | null {
  const i = token.indexOf(':')
  if (i <= 0) return null
  const tipo = token.slice(0, i)
  const id = token.slice(i + 1)
  if (tipo !== 'destaques' && tipo !== 'cards') return null
  if (!UUID_RE.test(id)) return null
  return { tipo, id }
}

export function resolverOrdemPagina(ordemSalva: unknown, secoes: SecoesPorTipo): BlocoOrdem[] {
  const tokens: string[] = Array.isArray(ordemSalva)
    ? (ordemSalva as unknown[]).filter((v): v is string => typeof v === 'string').slice(0, MAX_TOKENS)
    : []

  // Secoes existentes por tipo: id (minusculo) -> id original, preservando a ordem recebida.
  const existentes: Record<TipoComInstancias, Map<string, string>> = { destaques: new Map(), cards: new Map() }
  for (const tipo of TIPOS_COM_INSTANCIAS) {
    for (const id of secoes[tipo] ?? []) {
      if (typeof id === 'string' && !existentes[tipo].has(id.toLowerCase())) existentes[tipo].set(id.toLowerCase(), id)
    }
  }

  // Pre-leitura: instancias validas citadas em QUALQUER posicao (o grupo nao as repete).
  const referenciadas = new Set<string>()
  for (const t of tokens) {
    const inst = interpretarInstancia(t)
    if (inst && existentes[inst.tipo].has(inst.id.toLowerCase())) referenciadas.add(`${inst.tipo}:${inst.id.toLowerCase()}`)
  }

  const saida: BlocoOrdem[] = []
  const colocadas = new Set<string>()
  const tiposVistos = new Set<TipoSecaoPublica>()

  const colocarInstancia = (tipo: TipoComInstancias, idOriginal: string) => {
    const k = `${tipo}:${idOriginal.toLowerCase()}`
    if (colocadas.has(k)) return
    colocadas.add(k)
    saida.push({ chave: chaveInstancia(tipo, idOriginal), tipo, secaoId: idOriginal })
  }
  const expandirGrupo = (tipo: TipoComInstancias) => {
    for (const [idMinusculo, idOriginal] of existentes[tipo]) {
      if (!referenciadas.has(`${tipo}:${idMinusculo}`)) colocarInstancia(tipo, idOriginal)
    }
  }
  const tratarTipo = (t: TipoSecaoPublica) => {
    if (tiposVistos.has(t)) return
    tiposVistos.add(t)
    if (ehTipoComInstancias(t)) expandirGrupo(t)
    else saida.push({ chave: t, tipo: t })
  }

  for (const t of tokens) {
    if (ehTipo(t)) { tratarTipo(t); continue }
    const inst = interpretarInstancia(t)
    if (!inst) continue
    const idOriginal = existentes[inst.tipo].get(inst.id.toLowerCase())
    if (idOriginal) colocarInstancia(inst.tipo, idOriginal)
  }
  for (const t of ORDEM_PADRAO_SECOES) tratarTipo(t)

  return saida
}
