import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ErroBanco, type ConexaoRegistro, type DepsWebhook, type SegredosRegistro } from './processar'
import type { ItemType } from './tipos'

// Acesso ao banco com a chave de servico (mesmo padrao das rotas existentes: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
// Tabelas de itens: lista FECHADA (o tipo vem do adaptador, nunca de texto livre).
const TABELA_DO_ITEM: Record<ItemType, string> = { link: 'pagina_links', destaque: 'pagina_destaques', catalogo: 'pagina_catalogo_itens', video: 'pagina_videos', card: 'pagina_cards' }

let clientePadrao: SupabaseClient | null = null
function clienteDeServico(): SupabaseClient {
  if (clientePadrao) return clientePadrao
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !chave) throw new ErroBanco('config', 'variaveis do Supabase ausentes')
  clientePadrao = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
  return clientePadrao
}
const falha = (e: { code?: string; message?: string }): never => { throw new ErroBanco(String(e.code ?? 'desconhecido'), String(e.message ?? '').slice(0, 200)) }

export function criarDepsSupabase(cliente?: SupabaseClient): DepsWebhook {
  const db = () => cliente ?? clienteDeServico()
  return {
    async buscarConexao(publicId, provider): Promise<ConexaoRegistro | null> {
      const { data, error } = await db().from('minipage_conexoes_externas').select('id, user_id, provider, status').eq('public_id', publicId).eq('provider', provider).limit(1)
      if (error) return falha(error)
      return (data && data[0]) ? (data[0] as ConexaoRegistro) : null
    },
    async buscarSegredos(conexaoId): Promise<SegredosRegistro | null> {
      const { data, error } = await db().from('minipage_conexoes_segredos').select('ciphertext, key_version, prev_ciphertext, prev_key_version, prev_expires_at').eq('conexao_id', conexaoId).limit(1)
      if (error) return falha(error)
      return (data && data[0]) ? (data[0] as SegredosRegistro) : null
    },
    async entregasRecentes(conexaoId, desdeIso): Promise<number> {
      const { count, error } = await db().from('minipage_webhook_entregas').select('id', { count: 'exact', head: true }).eq('conexao_id', conexaoId).gte('received_at', desdeIso)
      if (error) return falha(error)
      return count ?? 0
    },
    async itemDoDono(tipo, itemId, userId): Promise<boolean> {
      const tabela = Object.prototype.hasOwnProperty.call(TABELA_DO_ITEM, tipo) ? TABELA_DO_ITEM[tipo] : undefined
      if (!tabela) return false // tipo fora da lista fechada: nunca consulta tabela alguma
      const { data, error } = await db().from(tabela).select('id').eq('id', itemId).eq('user_id', userId).limit(1)
      if (error) return falha(error)
      return Boolean(data && data.length)
    },
    async aplicarEvento(a): Promise<string> {
      const { data, error } = await db().rpc('integracoes_aplicar_evento', { p_conexao_id: a.conexaoId, p_idempotency_key: a.chave, p_event_type: a.tipoEvento, p_outcome: a.outcome, p_conversao: a.conversao })
      if (error) return falha(error)
      return String(data)
    },
    async purgarOportunista(): Promise<void> {
      const { error } = await db().rpc('integracoes_purgar_entregas')
      if (error) falha(error)
    },
  }
}
