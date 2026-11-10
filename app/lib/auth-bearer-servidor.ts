// B1: autenticacao Bearer para rotas de API que recebem o token da sessao do navegador (mesmo padrao de /api/cadastro/criar-perfil).
// O servidor valida o token com supabase.auth.getUser(token) (consulta o servidor de autenticacao). Nunca confia em IDs vindos do cliente.
import { createClient } from '@supabase/supabase-js'

export interface UsuarioAutenticado { id: string }
export interface DepsAuthBearer {
  getUser?: (token: string) => Promise<{ data: { user: { id?: string } | null }; error: unknown }>
}
const BEARER = /^Bearer\s+([A-Za-z0-9._~+/-]{20,4096}=*)$/i

export function extrairBearer(cabecalho: string | null | undefined): string | null {
  if (typeof cabecalho !== 'string') return null
  const m = BEARER.exec(cabecalho.trim())
  return m ? m[1] : null
}

let clientePadrao: ((token: string) => ReturnType<NonNullable<DepsAuthBearer['getUser']>>) | null = null
function getUserPadrao(token: string) {
  if (!clientePadrao) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !chave) return Promise.resolve({ data: { user: null }, error: new Error('configuracao ausente') })
    const cliente = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    clientePadrao = (t: string) => cliente.auth.getUser(t) as ReturnType<NonNullable<DepsAuthBearer['getUser']>>
  }
  return clientePadrao(token)
}

/** Usuario do token Bearer, ou null (cabecalho ausente/malformado, token invalido/expirado, falha de configuracao). Nunca lanca. */
export async function usuarioDoBearer(cabecalho: string | null | undefined, deps: DepsAuthBearer = {}): Promise<UsuarioAutenticado | null> {
  const token = extrairBearer(cabecalho)
  if (!token) return null
  try {
    const { data, error } = await (deps.getUser ?? getUserPadrao)(token)
    const id = data?.user?.id
    if (error || typeof id !== 'string' || !id) return null
    return { id }
  } catch {
    return null
  }
}
