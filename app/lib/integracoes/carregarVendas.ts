import type { SupabaseClient } from '@supabase/supabase-js'
import { COLUNAS_CONVERSAO, type LinhaConversao } from './resumo'
import { ITEM_TYPES, type ItemType } from './tipos'

// Leitura das vendas externas para o Desempenho. SOMENTE LEITURA, com o cliente do navegador (chave publica + login do usuario): quem decide o que
// pode ser lido e a RLS do banco (dono E plano elegivel). Mesmo assim, toda consulta filtra tambem por user_id (defesa em profundidade, como no resto da pagina).
// Nunca seleciona identificadores externos (pedido, assinatura, produto), rastreio nem nada do comprador: so as colunas de COLUNAS_CONVERSAO.
export const LIMITE_CONVERSOES = 5000
// Mesmas tabelas de itens do webhook (lista FECHADA); um teste confere com deps-supabase.ts.
export const TABELA_DO_ITEM: Record<ItemType, string> = { link: 'pagina_links', destaque: 'pagina_destaques', catalogo: 'pagina_catalogo_itens', video: 'pagina_videos', card: 'pagina_cards' }

export interface ResumoConexoes { total: number; ativas: number; teste: number; pausadas: number }
export interface DadosVendas { linhas: LinhaConversao[]; truncado: boolean; testes: number; conexoes: ResumoConexoes; titulos: Record<string, string | null> }
type Cliente = Pick<SupabaseClient, 'from'>

// Venda dentro do periodo = aprovada (paid_at) a partir do inicio; sem aprovacao ainda (reembolso chegou antes), vale a data de criacao do registro.
export const filtroPeriodo = (inicioIso: string) => `paid_at.gte.${inicioIso},and(paid_at.is.null,created_at.gte.${inicioIso})`

export async function carregarVendasExternas(db: Cliente, userId: string, inicioIso: string | null): Promise<DadosVendas> {
  const falha = () => new Error('falha_vendas_externas')
  const rc = await db.from('minipage_conexoes_externas').select('status').eq('user_id', userId).neq('status', 'revoked')
  if (rc.error) throw falha()
  const st = (rc.data ?? []) as { status: string }[]
  const conexoes: ResumoConexoes = { total: st.length, ativas: st.filter((c) => c.status === 'active').length, teste: st.filter((c) => c.status === 'test').length, pausadas: st.filter((c) => c.status === 'paused').length }

  let q = db.from('minipage_conversoes').select(COLUNAS_CONVERSAO).eq('user_id', userId).eq('is_test', false)
  if (inicioIso) q = q.or(filtroPeriodo(inicioIso))
  const rv = await q.order('paid_at', { ascending: false, nullsFirst: false }).limit(LIMITE_CONVERSOES + 1)
  if (rv.error) throw falha()
  const todas = (rv.data ?? []) as unknown as LinhaConversao[]
  const truncado = todas.length > LIMITE_CONVERSOES; const linhas = truncado ? todas.slice(0, LIMITE_CONVERSOES) : todas

  let qt = db.from('minipage_conversoes').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_test', true)
  if (inicioIso) qt = qt.or(filtroPeriodo(inicioIso))
  const rt = await qt
  if (rt.error) throw falha()

  const idsPorTipo = new Map<ItemType, Set<string>>()
  for (const l of linhas) if (l.item_id && (ITEM_TYPES as readonly string[]).includes(l.item_type ?? '')) { const t = l.item_type as ItemType; (idsPorTipo.get(t) ?? idsPorTipo.set(t, new Set()).get(t)!).add(l.item_id) }
  const titulos: Record<string, string | null> = {}
  for (const [tipo, ids] of idsPorTipo) {
    const lista = [...ids]
    for (let i = 0; i < lista.length; i += 100) {
      const r = await db.from(TABELA_DO_ITEM[tipo]).select('id, titulo').eq('user_id', userId).in('id', lista.slice(i, i + 100))
      if (r.error) throw falha()
      for (const it of (r.data ?? []) as unknown as { id: string; titulo: string | null }[]) titulos[`${tipo}:${String(it.id).toLowerCase()}`] = it.titulo ?? null
    }
  }
  return { linhas, truncado, testes: rt.count ?? 0, conexoes, titulos }
}
