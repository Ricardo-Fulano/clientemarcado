import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ehEmailJaCadastrado } from './auth-erros'
import { criarPerfilInicial } from './perfil-inicial'
import { normalizarPlano } from './planos'

// Cadastro feito PELO SERVIDOR: cria o usuario ja confirmado (auth.admin.createUser com
// email_confirm:true), cria o perfil, entrega uma sessao e nunca depende do interruptor
// "Confirm email" do painel do Supabase. So roda no servidor (usa service_role).
//
// Etapas logadas (Runtime Logs da Vercel, filtre por "[cadastro/registrar]"):
//   REGISTER_START, REGISTER_EMAIL_LOOKUP, REGISTER_CREATE_AUTH_USER,
//   REGISTER_CREATE_PROFILE, REGISTER_CREATE_SESSION (+ REGISTER_RATE_LIMIT, REGISTER_ROLLBACK).
// Nunca logamos senha nem tokens nem e-mail completo.

export type RegistroInput = {
  nome?: unknown; email?: unknown; senha?: unknown; termos?: unknown
  plano_tipo?: unknown; billing_cycle?: unknown; cupom?: unknown; website?: unknown
  ip?: string | null
}
export type RegistroResultado = { status: number; body: Record<string, unknown> }

// Limites (tentativas por janela). IP generoso para nao travar rede compartilhada de salao;
// e-mail mais baixo para barrar tentativas repetidas no mesmo endereco.
export const LIMITE_IP = { max: 10, janelaSeg: 900 }
export const LIMITE_EMAIL = { max: 5, janelaSeg: 900 }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function sha(s: string) { return crypto.createHash('sha256').update(s).digest('hex').slice(0, 32) }
function mascarar(email: string) { const [u, d] = email.split('@'); return `${(u || '').slice(0, 2)}***@${d || ''}` }
function log(etapa: string, dados: Record<string, unknown> = {}) { console.log(`[cadastro/registrar] ${etapa}`, JSON.stringify(dados)) }
const MSG_GENERICA = 'Não conseguimos concluir seu cadastro agora. Tente novamente ou fale com nosso suporte.'

// true = pode seguir. Se a funcao do banco nao existir (migration nao aplicada) seguimos
// (fail-open, para nao derrubar o cadastro) mas deixamos um erro ALTO no log.
async function dentroDoLimite(supabase: SupabaseClient, chave: string, lim: { max: number; janelaSeg: number }): Promise<boolean> {
  const { data, error } = await supabase.rpc('checar_rate_limit', { p_chave: chave, p_max: lim.max, p_janela_segundos: lim.janelaSeg })
  if (error) { console.error('[cadastro/registrar] REGISTER_RATE_LIMIT_INDISPONIVEL', JSON.stringify({ erro: error.message })); return true }
  return data === true
}

export async function registrarConta(
  supabase: SupabaseClient,
  input: RegistroInput,
  criarClienteAnon: () => SupabaseClient,
): Promise<RegistroResultado> {
  // Campo-isca preenchido = robo. Resposta generica, sem detalhe.
  if (typeof input.website === 'string' && input.website.trim() !== '')
    return { status: 400, body: { codigo: 'REQUISICAO_INVALIDA', error: MSG_GENERICA } }

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const senha = typeof input.senha === 'string' ? input.senha : ''
  const nome = typeof input.nome === 'string' ? input.nome.trim() : ''
  log('REGISTER_START', { email: email ? mascarar(email) : null })

  if (!email || email.length > 254 || !EMAIL_REGEX.test(email))
    return { status: 400, body: { codigo: 'EMAIL_INVALIDO', error: 'Confira se o e-mail foi digitado corretamente.' } }
  if (senha.length < 6 || senha.length > 72)
    return { status: 400, body: { codigo: 'SENHA_INVALIDA', error: 'A senha precisa ter entre 6 e 72 caracteres.' } }
  if (nome.length < 2 || nome.length > 100)
    return { status: 400, body: { codigo: 'NOME_OBRIGATORIO', error: 'Informe seu nome.' } }
  if (input.termos !== true)
    return { status: 400, body: { codigo: 'TERMOS_OBRIGATORIOS', error: 'Aceite os termos para criar sua conta.' } }

  // Limite de abuso: por IP e por e-mail (chaves guardadas so como hash).
  const chaveIp = 'ip:' + (input.ip ? sha(input.ip) : 'desconhecido')
  const okIp = await dentroDoLimite(supabase, chaveIp, input.ip ? LIMITE_IP : { max: 30, janelaSeg: 900 })
  const okEmail = okIp && await dentroDoLimite(supabase, 'email:' + sha(email), LIMITE_EMAIL)
  if (!okIp || !okEmail) {
    log('REGISTER_RATE_LIMIT', { bloqueado: !okIp ? 'ip' : 'email' })
    return { status: 429, body: { codigo: 'MUITAS_TENTATIVAS', error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' } }
  }

  // E-mail ja cadastrado?
  const { data: existenteId, error: erroLookup } = await supabase.rpc('auth_user_id_por_email', { p_email: email })
  log('REGISTER_EMAIL_LOOKUP', { existe: !!existenteId, erro: erroLookup?.message })
  if (existenteId)
    return { status: 409, body: { codigo: 'JA_TEM_CONTA', error: 'Este e-mail já possui uma conta. Entre para continuar.' } }

  const plano = normalizarPlano(typeof input.plano_tipo === 'string' ? input.plano_tipo : null)
  const cupom = typeof input.cupom === 'string' && input.cupom.trim() && input.cupom.length <= 50 ? input.cupom.trim().toUpperCase() : null

  // Cria o usuario JA CONFIRMADO. Nenhum e-mail do Supabase e enviado por este caminho.
  const { data: criado, error: erroCriar } = await supabase.auth.admin.createUser({
    email, password: senha, email_confirm: true,
    user_metadata: { nome_negocio: nome, nome_usuario: nome, cupom_indicacao: cupom, plano_tipo: plano },
  })
  if (erroCriar || !criado?.user) {
    if (ehEmailJaCadastrado(erroCriar)) {
      log('REGISTER_CREATE_AUTH_USER', { resultado: 'email_ja_cadastrado' })
      return { status: 409, body: { codigo: 'JA_TEM_CONTA', error: 'Este e-mail já possui uma conta. Entre para continuar.' } }
    }
    console.error('[cadastro/registrar] REGISTER_CREATE_AUTH_USER falhou', JSON.stringify({ message: erroCriar?.message, code: erroCriar?.code }))
    if ((erroCriar?.code || '').toLowerCase() === 'weak_password')
      return { status: 400, body: { codigo: 'SENHA_FRACA', error: 'Esta senha é muito fraca ou comum. Escolha outra senha.' } }
    return { status: 500, body: { codigo: 'AUTH_CREATE_FALHOU', error: MSG_GENERICA } }
  }
  const userId = criado.user.id
  log('REGISTER_CREATE_AUTH_USER', { resultado: 'criado' })

  // Perfil. Se falhar, desfaz a conta: nada fica pela metade.
  const perfil = await criarPerfilInicial(supabase, {
    userId, email, nome_negocio: nome, plano_tipo: plano, billing_cycle: input.billing_cycle, cupom,
  })
  log('REGISTER_CREATE_PROFILE', { ok: perfil.ok, criado: perfil.ok ? perfil.criado : undefined })
  if (!perfil.ok) {
    const { error: erroDel } = await supabase.auth.admin.deleteUser(userId)
    log('REGISTER_ROLLBACK', { ok: !erroDel, erro: erroDel?.message })
    return { status: 500, body: { codigo: 'PERFIL_FALHOU', error: MSG_GENERICA } }
  }

  // Sessao: entra com a senha recem-criada (client separado, sem persistir) e devolve os
  // tokens para o navegador assumir a sessao. Se falhar, a conta ja existe: o navegador
  // tenta entrar sozinho e, no pior caso, manda para o login.
  let session: { access_token: string; refresh_token: string } | null = null
  try {
    const { data: login, error: erroLogin } = await criarClienteAnon().auth.signInWithPassword({ email, password: senha })
    if (!erroLogin && login?.session) session = { access_token: login.session.access_token, refresh_token: login.session.refresh_token }
    log('REGISTER_CREATE_SESSION', { ok: !!session, erro: erroLogin?.message })
  } catch (e) { log('REGISTER_CREATE_SESSION', { ok: false, erro: String(e) }) }

  return { status: 200, body: { ok: true, session } }
}
