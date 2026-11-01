import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ErroDados, type DepsConexoes, type LinhaConexao, type LinhaSegredo, type MetaSegredo } from './conexoes'

// Acesso ao banco para as rotas de conexoes, com a chave de servico (mesmo padrao das rotas existentes).
// TODA consulta de conexao filtra tambem por user_id: o dono so enxerga e altera o que e dele.
const COLUNAS = 'id, user_id, public_id, provider, label, status, config, last_event_at, dropped_count, last_dropped_at, created_at, updated_at'
let clientePadrao: SupabaseClient | null = null
function clienteDeServico(): SupabaseClient {
  if (clientePadrao) return clientePadrao
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !chave) throw new ErroDados('config', 'variaveis do Supabase ausentes')
  clientePadrao = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
  return clientePadrao
}
const falha = (e: { code?: string; message?: string }): never => { throw new ErroDados(String(e.code ?? 'desconhecido'), String(e.message ?? '').slice(0, 200)) }

export function criarDepsConexoesSupabase(cliente?: SupabaseClient): DepsConexoes {
  const db = () => cliente ?? clienteDeServico()
  return {
    async usuarioDoToken(token) {
      const { data, error } = await db().auth.getUser(token)
      return error || !data?.user ? null : { id: data.user.id }
    },
    async elegivel(userId) {
      const { data, error } = await db().rpc('integracoes_elegivel', { p_user: userId })
      if (error) return falha(error)
      return data === true
    },
    async listar(userId) {
      const { data, error } = await db().from('minipage_conexoes_externas').select(COLUNAS).eq('user_id', userId).neq('status', 'revoked').order('created_at', { ascending: true })
      if (error) return falha(error)
      return (data ?? []) as LinhaConexao[]
    },
    async buscar(userId, id) {
      const { data, error } = await db().from('minipage_conexoes_externas').select(COLUNAS).eq('id', id).eq('user_id', userId).limit(1)
      if (error) return falha(error)
      return data && data[0] ? (data[0] as LinhaConexao) : null
    },
    async contarNaoRevogadas(userId) {
      const { count, error } = await db().from('minipage_conexoes_externas').select('id', { count: 'exact', head: true }).eq('user_id', userId).neq('status', 'revoked')
      if (error) return falha(error)
      return count ?? 0
    },
    async inserirConexao(nova) {
      const { error } = await db().from('minipage_conexoes_externas').insert(nova)
      if (!error) return 'ok'
      if (error.code === '23505' && /public_id/.test(error.message ?? '')) return 'public_id_duplicado'
      return falha(error)
    },
    async apagarConexao(userId, id) {
      const { error } = await db().from('minipage_conexoes_externas').delete().eq('id', id).eq('user_id', userId)
      if (error) falha(error)
    },
    async atualizarConexao(userId, id, patch, statusEsperado) {
      let q = db().from('minipage_conexoes_externas').update(patch).eq('id', id).eq('user_id', userId)
      if (statusEsperado) q = q.eq('status', statusEsperado)
      const { data, error } = await q.select('id')
      if (error) return falha(error)
      return Boolean(data && data.length === 1)
    },
    async metasSegredos(ids) {
      if (!ids.length) return []
      const { data, error } = await db().from('minipage_conexoes_segredos').select('conexao_id, rotated_at, prev_expires_at').in('conexao_id', ids)
      if (error) return falha(error)
      return (data ?? []) as MetaSegredo[]
    },
    async lerSegredo(conexaoId) {
      const { data, error } = await db().from('minipage_conexoes_segredos').select('conexao_id, ciphertext, key_version, prev_ciphertext, prev_key_version, prev_expires_at, rotated_at').eq('conexao_id', conexaoId).limit(1)
      if (error) return falha(error)
      return data && data[0] ? (data[0] as LinhaSegredo) : null
    },
    async inserirSegredo(conexaoId, novo) {
      const { error } = await db().from('minipage_conexoes_segredos').insert({ conexao_id: conexaoId, ciphertext: novo.ciphertext, key_version: novo.key_version })
      if (!error) return true
      if (error.code === '23505') return false
      return falha(error)
    },
    async trocarSegredo(conexaoId, ciphertextAtual, novo, anterior) {
      // Um UPDATE so (atomico): o token atual vira "anterior" (aceito por mais 24 h) e o novo assume. Condicao no ciphertext atual = sem corrida entre abas.
      const { data, error } = await db().from('minipage_conexoes_segredos')
        .update({ ciphertext: novo.ciphertext, key_version: novo.key_version, prev_ciphertext: anterior.ciphertext, prev_key_version: anterior.key_version, prev_expires_at: anterior.expires_at, rotated_at: new Date().toISOString() })
        .eq('conexao_id', conexaoId).eq('ciphertext', ciphertextAtual).select('conexao_id')
      if (error) return falha(error)
      return Boolean(data && data.length === 1)
    },
    async limparAnterior(conexaoId) {
      const { error } = await db().from('minipage_conexoes_segredos').update({ prev_ciphertext: null, prev_key_version: null, prev_expires_at: null }).eq('conexao_id', conexaoId)
      if (error) falha(error)
    },
    async apagarSegredo(conexaoId) {
      const { error } = await db().from('minipage_conexoes_segredos').delete().eq('conexao_id', conexaoId)
      if (error) falha(error)
    },
  }
}
