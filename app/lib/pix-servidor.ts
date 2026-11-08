// MINIPAGE PIX: leitura PUBLICA CONTROLADA, SOMENTE NO SERVIDOR (Server Component e rota de API). NUNCA importe este arquivo em componente 'use client'.
// O banco NAO oferece nenhuma leitura publica do Pix: nem tabela nem view para anon. As funcoes SQL pix_publico_resumo(slug) e pix_publico_codigo(slug) so aceitam
// EXECUTE de service_role, entao a unica porta e este modulo, que usa a SUPABASE_SERVICE_ROLE_KEY (mesma variavel ja usada pelas rotas de convite) apenas aqui no servidor.
// Consequencias: a API publica do Supabase nao lista nem consulta Pix; so passa pela rota do app (onde regras de abuso, como limite por IP na Vercel, se aplicam).
import { createClient } from '@supabase/supabase-js'

export interface ResumoPix { titulo: string; descricao: string | null; ordem: number }
export interface CodigoPix { titulo: string; descricao: string | null; payload: string }
export type NomeRpc = 'pix_publico_resumo' | 'pix_publico_codigo'
export type Rpc = (nome: NomeRpc, slug: string) => Promise<{ data: unknown; error: unknown }>

/** Mesmo criterio do banco (a funcao SQL revalida): 1 a 80 caracteres, sem controle, espaco, / \ ? # % @ < > " ' ou crase. */
export function slugPixValido(s: unknown): s is string {
  return typeof s === 'string' && s.length >= 1 && s.length <= 80 && !/[\u0000-\u001f\u007f\s/\\?#%@<>"'`]/.test(s)
}

function rpcDoServidor(): Rpc | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !chave) return null // sem a chave de servidor o Pix simplesmente nao aparece (nunca cai para a chave publica)
  const cliente = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } })
  return async (nome, slug) => {
    const r = await cliente.rpc(nome, { p_slug: slug })
    return { data: r.data, error: r.error }
  }
}

async function umaLinha(nome: NomeRpc, slug: unknown, rpc: Rpc | null | undefined): Promise<Record<string, unknown> | null> {
  if (!slugPixValido(slug)) return null
  const f = rpc === undefined ? rpcDoServidor() : rpc
  if (!f) return null
  try {
    const { data, error } = await f(nome, slug)
    if (error || !Array.isArray(data) || data.length !== 1) return null // 0 = nao existe/inativo; >1 nunca deveria acontecer: nao serve lista
    const linha = data[0]
    return linha && typeof linha === 'object' ? (linha as Record<string, unknown>) : null
  } catch {
    return null
  }
}

const textoOuNulo = (v: unknown): string | null => (typeof v === 'string' ? v : null)

/** Titulo, descricao e posicao do card Pix de UMA MiniPage ativa (sem o codigo). Para a pagina publica. */
export async function buscarResumoPix(slug: unknown, rpc?: Rpc | null): Promise<ResumoPix | null> {
  const r = await umaLinha('pix_publico_resumo', slug, rpc)
  if (!r || typeof r.titulo !== 'string' || typeof r.ordem !== 'number') return null
  return { titulo: r.titulo, descricao: textoOuNulo(r.descricao), ordem: r.ordem } // so estes campos, mesmo que o banco devolvesse mais
}

/** Codigo Pix de UMA MiniPage ativa. Para a tela de pagamento (quando o visitante toca no card). */
export async function buscarCodigoPix(slug: unknown, rpc?: Rpc | null): Promise<CodigoPix | null> {
  const r = await umaLinha('pix_publico_codigo', slug, rpc)
  if (!r || typeof r.titulo !== 'string' || typeof r.payload !== 'string') return null
  return { titulo: r.titulo, descricao: textoOuNulo(r.descricao), payload: r.payload }
}
