import { supabase } from './supabase'

// Pede ao SERVIDOR (POST /api/cadastro/criar-perfil) que garanta um perfil FREE para a pessoa logada. O navegador NAO faz mais
// INSERT em "perfis". Nada e enviado alem do token da sessao: plano, nome e cupom nao saem da tela, e o servidor ignora o corpo.
// Perfil que ja existe nao e alterado; profissional de equipe ativo nao ganha perfil (motivo 'PROFISSIONAL_DE_EQUIPE').
export type MotivoGarantirPerfil = 'JA_EXISTE' | 'PROFISSIONAL_DE_EQUIPE'
export type ResultadoGarantirPerfil =
  | { ok: true; criado: boolean; slug?: string; motivo?: MotivoGarantirPerfil }
  | { ok: false; erro: string }

type Deps = { obterToken?: () => Promise<string | null>; chamar?: typeof fetch }

export async function garantirPerfilNoServidor(deps: Deps = {}): Promise<ResultadoGarantirPerfil> {
  const obterToken = deps.obterToken ?? (async () => { const { data } = await supabase.auth.getSession(); return data.session?.access_token ?? null })
  const chamar: typeof fetch = deps.chamar ?? ((...a) => fetch(...a))

  const token = await obterToken()
  if (!token) return { ok: false, erro: 'Sua sessão expirou. Entre novamente.' }

  let res: Response
  try {
    res = await chamar('/api/cadastro/criar-perfil', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })
  } catch {
    return { ok: false, erro: 'Falha de conexão. Tente novamente.' }
  }
  if (res.status === 401) return { ok: false, erro: 'Sua sessão expirou. Entre novamente.' }
  if (res.status === 429) return { ok: false, erro: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' }
  const corpo: any = await res.json().catch(() => null)
  if (res.status !== 200 || !corpo || corpo.ok !== true) return { ok: false, erro: 'Não foi possível criar o perfil agora. Tente novamente.' }
  const motivo: MotivoGarantirPerfil | undefined = corpo.motivo === 'JA_EXISTE' || corpo.motivo === 'PROFISSIONAL_DE_EQUIPE' ? corpo.motivo : undefined
  return { ok: true, criado: corpo.criado === true, slug: typeof corpo.slug === 'string' ? corpo.slug : undefined, motivo }
}
