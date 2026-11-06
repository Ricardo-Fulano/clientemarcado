// Adaptador do ConviteStore para o cliente supabase-js (service role, SOMENTE no servidor). Cada metodo e UMA operacao simples;
// erros do banco viram excecao (a logica decide retentar, registrar ou responder erro). Nenhum metodo cancela por perfil sem o filtro de data.
import type { ConviteCriado, ConviteStore } from './convite-criar'

// forma minima do cliente (evita importar o pacote aqui; o supabase-js real satisfaz esta forma)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClienteSupabase = { from: (tabela: string) => any }

const T = 'convites_transferencia'

function falhar(op: string, error: { message?: string } | null): never {
  throw new Error(`${op}: ${error?.message ?? 'sem retorno'}`)
}

export function criarConviteStore(supabase: ClienteSupabase): ConviteStore {
  return {
    async inserirPendente(p) {
      const { data, error } = await supabase
        .from(T)
        .insert({ perfil_id: p.perfilId, user_id_atual: p.userIdAtual, email_novo: p.emailNovo, token_hash: p.tokenHash, status: 'pendente', expira_em: p.expiraEm })
        .select('id, criado_em')
        .single()
      if (error || !data) falhar('inserirPendente', error)
      return { id: data.id as string, criado_em: data.criado_em as string } satisfies ConviteCriado
    },

    async existePendenteRecente(perfilId, desdeIso) {
      const { data, error } = await supabase.from(T).select('id').eq('perfil_id', perfilId).eq('status', 'pendente').gte('criado_em', desdeIso).limit(1)
      if (error) falhar('existePendenteRecente', error)
      return Array.isArray(data) && data.length > 0
    },

    async registrarSolicitado(conviteId, resendId, quandoIso) {
      const { data, error } = await supabase
        .from(T)
        .update({ resend_email_id: resendId, email_status: 'solicitado', email_enviado_em: quandoIso, email_erro: null })
        .eq('id', conviteId)
        .select('id')
      if (error) falhar('registrarSolicitado', error)
      if (!Array.isArray(data) || data.length !== 1) falhar('registrarSolicitado', { message: 'nenhuma linha atualizada' })
    },

    async falharConvite(conviteId, erro) {
      // um unico UPDATE: cancela o convite novo e registra o motivo (ninguem recebeu o link)
      const { error } = await supabase.from(T).update({ status: 'cancelado', email_status: 'falhou', email_erro: erro }).eq('id', conviteId).eq('status', 'pendente')
      if (error) falhar('falharConvite', error)
    },

    async registrarIndeterminado(conviteId, erro) {
      const { error } = await supabase.from(T).update({ email_status: 'indeterminado', email_erro: erro }).eq('id', conviteId)
      if (error) falhar('registrarIndeterminado', error)
    },

    async cancelarAnteriores(perfilId, conviteId, criadoEm) {
      // SO os pendentes do mesmo perfil criados ANTES deste convite (o mais novo sempre vence; nunca cancela o proprio nem os mais novos)
      const { data, error } = await supabase
        .from(T)
        .update({ status: 'cancelado' })
        .eq('perfil_id', perfilId)
        .eq('status', 'pendente')
        .neq('id', conviteId)
        .lt('criado_em', criadoEm)
        .select('id')
      if (error) falhar('cancelarAnteriores', error)
      return Array.isArray(data) ? data.length : 0
    },
  }
}

// ---------------------------------------------------------------- painel: ultimos convites do dono (sem token, e-mail mascarado)
export interface ConviteResumo {
  email: string
  status: string
  criado_em: string
  expira_em: string
  aceito_em: string | null
  email_status: string | null
  email_enviado_em: string | null
  email_entregue_em: string | null
  email_erro: string | null
}

export function mascararEmail(e: string): string {
  const [u = '', d = ''] = e.split('@')
  const ponto = d.lastIndexOf('.')
  return `${u.slice(0, 1)}***@${d.slice(0, 1)}***${ponto > 0 ? d.slice(ponto) : ''}`
}

export async function ultimosConvites(supabase: ClienteSupabase, perfilId: string, limite = 3): Promise<ConviteResumo[]> {
  const { data, error } = await supabase
    .from(T)
    .select('email_novo, status, criado_em, expira_em, aceito_em, email_status, email_enviado_em, email_entregue_em, email_erro')
    .eq('perfil_id', perfilId)
    .order('criado_em', { ascending: false })
    .limit(limite)
  if (error) falhar('ultimosConvites', error)
  return (data ?? []).map((r: Record<string, string | null>) => ({
    email: mascararEmail(String(r.email_novo ?? '')),
    status: String(r.status ?? ''),
    criado_em: String(r.criado_em ?? ''),
    expira_em: String(r.expira_em ?? ''),
    aceito_em: r.aceito_em ?? null,
    email_status: r.email_status ?? null,
    email_enviado_em: r.email_enviado_em ?? null,
    email_entregue_em: r.email_entregue_em ?? null,
    email_erro: r.email_erro ? String(r.email_erro).slice(0, 160) : null,
  }))
}
