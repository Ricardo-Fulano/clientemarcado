import { ITEM_TYPES, type ItemType } from './tipos'
import type { VendasExport } from '../exportarDesempenho'

// Resumo das vendas externas para o Desempenho. Funcoes PURAS (sem rede, sem Node): o navegador as usa sobre as linhas que ja leu.
//
// COMO CADA STATUS ENTRA NAS METRICAS (cada pedido cai em UM balde, pelo status atual):
//   paid                -> venda confirmada, receita bruta = valor; sem reembolso/chargeback; liquida = valor
//   partially_refunded  -> venda confirmada, receita bruta = valor; REEMBOLSO (qtd 1, valor = refunded_minor); liquida = valor - reembolsado
//   refunded            -> venda confirmada, receita bruta = valor; REEMBOLSO (qtd 1, valor = reembolsado); liquida = 0
//   chargeback          -> venda confirmada, receita bruta = valor; CHARGEBACK (qtd 1, valor = valor do pedido); liquida = 0
// "Vendas confirmadas" = todos os pedidos do periodo (inclusive os depois reembolsados ou contestados: eles foram vendas).
// "Receita bruta" = soma do valor cobrado de todos eles. Reembolso e chargeback sao baldes EXCLUSIVOS (um chargeback depois de um reembolso conta so como chargeback).
// Cada MOEDA e somada separadamente, nunca misturada. Eventos de teste (is_test) nao chegam aqui (a consulta ja os exclui).

export const COLUNAS_CONVERSAO = 'provider, status, amount_minor, refunded_minor, currency, item_type, item_id, via_minipage, paid_at, created_at'
export const STATUS_DE_VENDA = ['paid', 'partially_refunded', 'refunded', 'chargeback'] as const
export type StatusDeVenda = (typeof STATUS_DE_VENDA)[number]

export interface LinhaConversao {
  provider: string; status: string; amount_minor: number | string; refunded_minor: number | string | null; currency: string
  item_type: string | null; item_id: string | null; via_minipage: boolean; paid_at: string | null; created_at: string
}
export interface TotaisMoeda {
  currency: string; vendas: number; pagas: number; brutaMinor: bigint
  reembolsos: { qtd: number; valorMinor: bigint }; chargebacks: { qtd: number; valorMinor: bigint }; liquidaMinor: bigint
}
export interface LinhaRanking {
  chave: string; kind: 'item' | 'provedor' | 'sem_atribuicao'; itemType?: ItemType; itemId?: string; provider?: string
  titulo: string | null; removido: boolean; vendas: number; porMoeda: { currency: string; vendas: number; brutaMinor: bigint }[]
}
export interface ResumoVendas {
  totalVendas: number; moedas: TotaisMoeda[]; porProvedor: LinhaRanking[]; porItem: LinhaRanking[]; viaMinipage: number; invalidas: number
}

const ZERO = BigInt(0) // o tsconfig do projeto mira ES2017: literais 0n nao compilam
const SEM_ATRIBUICAO = 'sem_atribuicao'
export const chaveDoItem = (tipo: string, id: string) => `${tipo}:${id.toLowerCase()}`

function paraBigInt(v: unknown): bigint | null {
  if (typeof v === 'number') return Number.isSafeInteger(v) && v >= 0 ? BigInt(v) : null
  if (typeof v === 'string' && /^\d{1,18}$/.test(v)) return BigInt(v)
  return null
}
// Data da venda = aprovacao; se a aprovacao ainda nao chegou (reembolso chegou antes), a data em que o registro nasceu.
export function dataDaVenda(l: Pick<LinhaConversao, 'paid_at' | 'created_at'>): string { return l.paid_at ?? l.created_at }

interface Normalizada { provider: string; status: StatusDeVenda; amount: bigint; refunded: bigint; currency: string; tipo: ItemType | null; itemId: string | null; via: boolean }
function normalizar(l: LinhaConversao): Normalizada | null {
  if (!l || typeof l.provider !== 'string' || !l.provider) return null
  if (!(STATUS_DE_VENDA as readonly string[]).includes(l.status)) return null
  if (typeof l.currency !== 'string' || !/^[A-Z]{3}$/.test(l.currency)) return null
  const amount = paraBigInt(l.amount_minor); if (amount === null) return null
  const refundedBruto = l.refunded_minor === null || l.refunded_minor === undefined ? ZERO : paraBigInt(l.refunded_minor); if (refundedBruto === null) return null
  const tipo = typeof l.item_type === 'string' && (ITEM_TYPES as readonly string[]).includes(l.item_type) ? (l.item_type as ItemType) : null
  const itemId = typeof l.item_id === 'string' && l.item_id ? l.item_id : null
  return { provider: l.provider, status: l.status as StatusDeVenda, amount, refunded: refundedBruto > amount ? amount : refundedBruto, currency: l.currency, tipo, itemId, via: l.via_minipage === true }
}

function somar(mapa: Map<string, LinhaRanking>, chave: string, base: Omit<LinhaRanking, 'vendas' | 'porMoeda'>, n: Normalizada) {
  let r = mapa.get(chave)
  if (!r) { r = { ...base, vendas: 0, porMoeda: [] }; mapa.set(chave, r) }
  r.vendas++
  let m = r.porMoeda.find((x) => x.currency === n.currency)
  if (!m) { m = { currency: n.currency, vendas: 0, brutaMinor: ZERO }; r.porMoeda.push(m) }
  m.vendas++; m.brutaMinor += n.amount
}

// titulos: chave "tipo:id" -> titulo (string), null/'' = item sem titulo; chave AUSENTE = item que nao existe mais.
export function resumirVendas(linhas: LinhaConversao[], titulos: Record<string, string | null | undefined> = {}): ResumoVendas {
  const moedas = new Map<string, TotaisMoeda>(); const porProv = new Map<string, LinhaRanking>(); const porItem = new Map<string, LinhaRanking>()
  let total = 0, via = 0, invalidas = 0
  for (const l of linhas) {
    const n = normalizar(l); if (!n) { invalidas++; continue }
    total++; if (n.via) via++
    let t = moedas.get(n.currency)
    if (!t) { t = { currency: n.currency, vendas: 0, pagas: 0, brutaMinor: ZERO, reembolsos: { qtd: 0, valorMinor: ZERO }, chargebacks: { qtd: 0, valorMinor: ZERO }, liquidaMinor: ZERO }; moedas.set(n.currency, t) }
    t.vendas++; t.brutaMinor += n.amount
    if (n.status === 'paid') { t.pagas++; t.liquidaMinor += n.amount }
    else if (n.status === 'chargeback') { t.chargebacks.qtd++; t.chargebacks.valorMinor += n.amount }
    else { t.reembolsos.qtd++; t.reembolsos.valorMinor += n.refunded; t.liquidaMinor += n.amount - n.refunded }
    somar(porProv, n.provider, { chave: n.provider, kind: 'provedor', provider: n.provider, titulo: null, removido: false }, n)
    if (n.tipo && n.itemId) {
      const k = chaveDoItem(n.tipo, n.itemId); const achado = Object.prototype.hasOwnProperty.call(titulos, k); const tit = achado ? titulos[k] : undefined
      somar(porItem, k, { chave: k, kind: 'item', itemType: n.tipo, itemId: n.itemId, titulo: tit ? tit : null, removido: !achado }, n)
    } else somar(porItem, SEM_ATRIBUICAO, { chave: SEM_ATRIBUICAO, kind: 'sem_atribuicao', titulo: null, removido: false }, n)
  }
  const ordemMoeda = (a: TotaisMoeda, b: TotaisMoeda) => b.vendas - a.vendas || a.currency.localeCompare(b.currency)
  return { totalVendas: total, moedas: [...moedas.values()].sort(ordemMoeda), porProvedor: [...porProv.values()].sort(porQuantidade), porItem: [...porItem.values()].sort(porQuantidade), viaMinipage: via, invalidas }
}
const porQuantidade = (a: LinhaRanking, b: LinhaRanking) =>
  b.vendas - a.vendas || (a.kind === 'sem_atribuicao' ? 1 : 0) - (b.kind === 'sem_atribuicao' ? 1 : 0) || a.chave.localeCompare(b.chave)

// Receita por moeda: cada ranking so mistura valores da MESMA moeda.
export function rankingPorReceita(lista: LinhaRanking[], currency: string, top = 5): { linha: LinhaRanking; brutaMinor: bigint; vendas: number }[] {
  return lista.flatMap((linha) => { const m = linha.porMoeda.find((x) => x.currency === currency); return m ? [{ linha, brutaMinor: m.brutaMinor, vendas: m.vendas }] : [] })
    .sort((a, b) => (a.brutaMinor === b.brutaMinor ? 0 : a.brutaMinor > b.brutaMinor ? -1 : 1) || b.vendas - a.vendas || (a.linha.kind === 'sem_atribuicao' ? 1 : 0) - (b.linha.kind === 'sem_atribuicao' ? 1 : 0) || a.linha.chave.localeCompare(b.linha.chave))
    .slice(0, top)
}
export const moedasDoRanking = (lista: LinhaRanking[]): string[] => [...new Set(lista.flatMap((l) => l.porMoeda.map((m) => m.currency)))].sort()

// ---------------- moeda ----------------
// Casas decimais ISO 4217: a MESMA tabela que o webhook usa para converter o valor em unidade menor (utilitarios.ts, que importa Node e por isso nao pode ser
// carregada no navegador). NAO usar o Intl aqui: o CLDR difere da ISO em algumas moedas (ex.: IQD) e o valor ficaria 1000x errado. Um teste confere as duas tabelas.
const SEM_CASAS = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'])
const TRES_CASAS = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'])
const QUATRO_CASAS = new Set(['CLF', 'UYW'])
export function exponenteDaMoeda(currency: string): number {
  if (SEM_CASAS.has(currency)) return 0
  if (TRES_CASAS.has(currency)) return 3
  if (QUATRO_CASAS.has(currency)) return 4
  return 2
}
export function valorEmUnidadeMaior(minor: bigint | number, currency: string): number { return Number(minor) / 10 ** exponenteDaMoeda(currency) }
export function formatarMoeda(minor: bigint | number, currency: string, locale = 'pt-BR'): string {
  const casas = exponenteDaMoeda(currency); const v = valorEmUnidadeMaior(minor, currency)
  try { return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v) } catch { return `${currency} ${v.toFixed(casas)}` }
}

// ---------------- cliques -> vendas ----------------
// So existe evento de clique para estes tipos de item (o tipo "card" nao tem).
export const EVENTO_POR_TIPO_ITEM: Partial<Record<ItemType, string>> = { link: 'link_rapido_click', destaque: 'destaque_click', catalogo: 'catalogo_click', video: 'video_click' }
export interface EventoClique { tipo_evento: string; item_id?: string | null }
export type MotivoNaoComparavel = 'sem_evento' | 'eventos_truncados' | 'eventos_sem_item' | 'sem_cliques' | 'vendas_maiores'
export interface LinhaCliquesVendas { chave: string; itemType: ItemType; itemId: string; titulo: string | null; removido: boolean; vendas: number; cliques: number | null; taxa: number | null; motivo: MotivoNaoComparavel | null }

// Regras de seguranca da comparacao (qualquer falha = SEM taxa, so vendas):
//  1) so vendas com origem na MiniPage (via_minipage) E item valido;  2) o tipo precisa ter evento de clique;
//  3) os eventos do periodo nao podem ter sido cortados pelo limite de carga;  4) TODO clique daquele tipo no periodo precisa ter item_id
//     (senao um clique sem id poderia pertencer ao item e o total ficaria subestimado);  5) tem de haver cliques e vendas <= cliques.
export function cliquesVsVendas(linhas: LinhaConversao[], eventos: EventoClique[], ctx: { eventosTruncados: boolean }, titulos: Record<string, string | null | undefined> = {}): LinhaCliquesVendas[] {
  const vendasPorItem = new Map<string, { tipo: ItemType; id: string; vendas: number }>()
  for (const l of linhas) {
    const n = normalizar(l); if (!n || !n.via || !n.tipo || !n.itemId) continue
    const k = chaveDoItem(n.tipo, n.itemId); const v = vendasPorItem.get(k) ?? { tipo: n.tipo, id: n.itemId, vendas: 0 }; v.vendas++; vendasPorItem.set(k, v)
  }
  const out: LinhaCliquesVendas[] = []
  for (const [chave, v] of vendasPorItem) {
    const evento = EVENTO_POR_TIPO_ITEM[v.tipo]; const achado = Object.prototype.hasOwnProperty.call(titulos, chave); const tit = achado ? titulos[chave] : undefined
    const base = { chave, itemType: v.tipo, itemId: v.id, titulo: tit ? tit : null, removido: !achado, vendas: v.vendas }
    let motivo: MotivoNaoComparavel | null = null; let cliques: number | null = null
    if (!evento) motivo = 'sem_evento'
    else if (ctx.eventosTruncados) motivo = 'eventos_truncados'
    else {
      const doTipo = eventos.filter((e) => e.tipo_evento === evento)
      if (doTipo.some((e) => !e.item_id)) motivo = 'eventos_sem_item'
      else {
        cliques = doTipo.filter((e) => String(e.item_id).toLowerCase() === v.id.toLowerCase()).length
        if (cliques === 0) motivo = 'sem_cliques'; else if (v.vendas > cliques) motivo = 'vendas_maiores'
      }
    }
    out.push({ ...base, cliques: motivo === null ? cliques : null, taxa: motivo === null && cliques ? (v.vendas / cliques) * 100 : null, motivo })
  }
  return out.sort((a, b) => b.vendas - a.vendas || a.chave.localeCompare(b.chave))
}

// ---------------- exportacao ----------------
export interface ContextoExportacaoVendas {
  permitido: boolean; temConexoes: boolean; testes: number; truncado: boolean; limite: number
  nomeProvedor: (id: string) => string; rotuloItem: (l: LinhaRanking) => string; rotuloTipo: (t: string) => string
}
export function montarVendasExport(resumo: ResumoVendas | null, cliques: LinhaCliquesVendas[], ctx: ContextoExportacaoVendas): VendasExport {
  const vazio: VendasExport = { permitido: ctx.permitido, temConexoes: ctx.temConexoes, testes: ctx.testes, truncado: ctx.truncado, limite: ctx.limite, viaMinipage: 0, totalVendas: 0, moedas: [], porProvedor: [], porItem: [], cliquesVendas: [] }
  if (!ctx.permitido || !resumo) return vazio
  const num = (m: bigint, c: string) => valorEmUnidadeMaior(m, c)
  return {
    ...vazio, viaMinipage: resumo.viaMinipage, totalVendas: resumo.totalVendas,
    moedas: resumo.moedas.map((m) => ({ currency: m.currency, casas: exponenteDaMoeda(m.currency), vendas: m.vendas, bruta: num(m.brutaMinor, m.currency), reembolsosQtd: m.reembolsos.qtd, reembolsosValor: num(m.reembolsos.valorMinor, m.currency), chargebacksQtd: m.chargebacks.qtd, chargebacksValor: num(m.chargebacks.valorMinor, m.currency), liquida: num(m.liquidaMinor, m.currency) })),
    porProvedor: resumo.porProvedor.flatMap((p) => p.porMoeda.map((m) => ({ nome: ctx.nomeProvedor(p.provider ?? p.chave), currency: m.currency, casas: exponenteDaMoeda(m.currency), vendas: m.vendas, receita: num(m.brutaMinor, m.currency) }))),
    porItem: resumo.porItem.flatMap((p) => p.porMoeda.map((m) => ({ nome: ctx.rotuloItem(p), currency: m.currency, casas: exponenteDaMoeda(m.currency), vendas: m.vendas, receita: num(m.brutaMinor, m.currency) }))),
    cliquesVendas: cliques.map((c) => ({ nome: `${ctx.rotuloItem({ chave: c.chave, kind: 'item', itemType: c.itemType, itemId: c.itemId, titulo: c.titulo, removido: c.removido, vendas: c.vendas, porMoeda: [] })} (${ctx.rotuloTipo(c.itemType)})`, vendas: c.vendas, cliques: c.cliques, taxa: c.taxa })),
  }
}
