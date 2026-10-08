import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ehEmailJaCadastrado } from './auth-erros'

// Logica do aceite de convite de transferencia, separada da rota para ser testavel.
// So roda no servidor (recebe um client com service_role).
//
// O TOKEN e a fonte de verdade: ele determina a MiniPage, o e-mail do destinatario, a
// validade e o status. A sessao do navegador nunca troca o destinatario.
//
// Etapas logadas (Runtime Logs da Vercel, filtre por "[convite/aceitar]"):
//   TRANSFER_VALIDATE_TOKEN, TRANSFER_LOOKUP_USER, TRANSFER_CREATE_USER, TRANSFER_LOGIN,
//   TRANSFER_PROFILE_CHECK, TRANSFER_CHANGE_OWNER, TRANSFER_MARK_ACCEPTED (+ TRANSFER_ROLLBACK).
// Nunca logamos senha, token, tokens de sessao nem e-mail completo.
// Este fluxo NAO envia nenhum e-mail do Supabase: o usuario novo e criado ja confirmado.

export type AceiteInput = {
  token?: string | null; senha?: string | null; confirmar?: string | null
  nome?: string | null; termos?: boolean | null; bearer?: string | null
}
export type AceiteResultado = { status: number; body: Record<string, unknown> }

export { ehEmailJaCadastrado }

const MSG_GENERICA = 'Não foi possível concluir a transferência. Tente novamente.'
export const MSG_OUTRO_EMAIL = 'Este convite foi enviado para outro e-mail. Entre com o endereço correto para continuar.'

function mascarar(email: string): string {
  const [u, d] = email.split('@')
  return `${(u || '').slice(0, 2)}***@${d || ''}`
}
function log(etapa: string, dados: Record<string, unknown> = {}) {
  console.log(`[convite/aceitar] ${etapa}`, JSON.stringify(dados))
}
// Em producao a resposta nunca carrega detalhe tecnico; em dev (ou CONVITE_DEBUG=1) devolve
// o erro real para diagnostico.
function comDetalhe(body: Record<string, unknown>, detalhe: unknown): Record<string, unknown> {
  const debug = process.env.NODE_ENV !== 'production' || process.env.CONVITE_DEBUG === '1'
  return debug && detalhe ? { ...body, detalhe } : body
}

function mapearErroTransferencia(msg: string): AceiteResultado {
  if (msg.includes('DESTINO_JA_TEM_PAGINA'))
    return { status: 409, body: { codigo: 'DESTINO_JA_TEM_PAGINA', error: 'Esta conta já possui uma página própria. Use outro e-mail para receber esta página, ou fale com o suporte.' } }
  if (msg.includes('CONVITE_EXPIRADO'))
    return { status: 400, body: { codigo: 'CONVITE_EXPIRADO', error: 'Este convite expirou. Peça um novo convite.' } }
  if (msg.includes('CONVITE_NAO_PENDENTE') || msg.includes('CONVITE_NAO_ENCONTRADO'))
    return { status: 400, body: { codigo: 'CONVITE_USADO', error: 'Este convite já foi utilizado.' } }
  if (msg.includes('PERFIL_MUDOU_DE_DONO'))
    return { status: 409, body: { codigo: 'PERFIL_MUDOU_DE_DONO', error: 'Esta página já mudou de responsável. Peça um novo convite.' } }
  if (msg.includes('DESTINO_IGUAL_ORIGEM'))
    return { status: 400, body: { codigo: 'DESTINO_IGUAL_ORIGEM', error: 'Este e-mail já é o responsável por esta página.' } }
  return { status: 500, body: { codigo: 'TRANSFERENCIA_FALHOU', error: MSG_GENERICA } }
}

export async function aceitarConvite(
  supabase: SupabaseClient,
  input: AceiteInput,
  criarClienteAnon?: () => SupabaseClient,
): Promise<AceiteResultado> {
  const token = input.token || ''
  if (!token) return { status: 400, body: { codigo: 'CONVITE_INVALIDO', error: 'Convite inválido.' } }

  // ---- 1) Validar o convite (so pelo token; nunca pela sessao) ----
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const { data: convite, error: erroConvite } = await supabase
    .from('convites_transferencia').select('*').eq('token_hash', tokenHash).maybeSingle()
  log('TRANSFER_VALIDATE_TOKEN', { achou: !!convite, status: convite?.status, erroBanco: erroConvite?.message })

  if (erroConvite) return { status: 500, body: comDetalhe({ codigo: 'ERRO_BANCO', error: MSG_GENERICA }, erroConvite.message) }
  if (!convite) return { status: 404, body: { codigo: 'CONVITE_INEXISTENTE', error: 'Este convite não existe ou foi substituído por um mais recente.' } }
  if (convite.status === 'aceito') return { status: 400, body: { codigo: 'CONVITE_USADO', error: 'Este convite já foi utilizado.' } }
  if (convite.status === 'cancelado') return { status: 400, body: { codigo: 'CONVITE_SUBSTITUIDO', error: 'Este convite foi substituído por um mais recente. Use o link do último e-mail enviado.' } }
  if (convite.status !== 'pendente' || new Date(convite.expira_em) < new Date()) {
    if (convite.status === 'pendente') await supabase.from('convites_transferencia').update({ status: 'expirado' }).eq('id', convite.id)
    return { status: 400, body: { codigo: 'CONVITE_EXPIRADO', error: 'Este convite expirou. Peça um novo convite.' } }
  }

  // ---- 2) Descobrir/criar o novo dono ----
  let novoUserId: string
  let criadoAgora = false
  let senhaDaCriacao: string | null = null

  if (input.bearer) {
    // Pessoa logada: a conta logada TEM que ser a do e-mail do convite.
    const { data: sess, error: erroSess } = await supabase.auth.getUser(input.bearer)
    const logado = sess?.user
    log('TRANSFER_LOGIN', { via: 'sessao', ok: !!logado, erro: erroSess?.message })
    if (erroSess || !logado) return { status: 401, body: { codigo: 'SESSAO_INVALIDA', error: 'Sessão inválida. Entre novamente.' } }
    if ((logado.email || '').toLowerCase() !== String(convite.email_novo).toLowerCase())
      return { status: 403, body: { codigo: 'EMAIL_DIFERENTE', error: MSG_OUTRO_EMAIL } }
    novoUserId = logado.id

    // Antes de mexer em qualquer coisa: o destino ja e dono de OUTRA pagina? (O banco tambem
    // confere dentro da transacao; aqui devolvemos o erro cedo e claro.)
    const { data: outraPagina } = await supabase.from('perfis').select('id').eq('user_id', novoUserId).neq('id', convite.perfil_id).limit(1)
    log('TRANSFER_PROFILE_CHECK', { destinoTemOutraPagina: !!(outraPagina && outraPagina.length) })
    if (outraPagina && outraPagina.length)
      return mapearErroTransferencia('DESTINO_JA_TEM_PAGINA')
  } else {
    if (!input.senha || input.senha.length < 6 || input.senha.length > 72)
      return { status: 400, body: { codigo: 'SENHA_CURTA', error: 'A senha precisa ter entre 6 e 72 caracteres.' } }
    if (input.confirmar != null && input.confirmar !== input.senha)
      return { status: 400, body: { codigo: 'SENHAS_DIFERENTES', error: 'As senhas não coincidem.' } }
    // Criacao de conta pelo convite: nome e aceite dos termos obrigatorios (validados aqui,
    // no servidor, nao so no formulario).
    const nomeLimpo = (input.nome || '').trim()
    if (nomeLimpo.length < 2)
      return { status: 400, body: { codigo: 'NOME_OBRIGATORIO', error: 'Informe seu nome.' } }
    if (input.termos !== true)
      return { status: 400, body: { codigo: 'TERMOS_OBRIGATORIOS', error: 'Aceite os termos de uso para continuar.' } }

    // Lookup exato por e-mail (RPC). Se a RPC nao existir, seguimos e tratamos o conflito
    // pelo erro do createUser.
    const { data: existenteId, error: erroLookup } = await supabase.rpc('auth_user_id_por_email', { p_email: convite.email_novo })
    log('TRANSFER_LOOKUP_USER', { existe: !!existenteId, email: mascarar(String(convite.email_novo)), erro: erroLookup?.message })
    if (existenteId) return { status: 409, body: { codigo: 'JA_TEM_CONTA', error: 'Este e-mail já possui uma conta. Entre para assumir a página.' } }

    // Usuario criado JA CONFIRMADO (sem e-mail de confirmacao).
    const { data: criado, error: erroCriar } = await supabase.auth.admin.createUser({
      email: convite.email_novo, password: input.senha, email_confirm: true,
      user_metadata: { nome_usuario: nomeLimpo },
    })
    if (erroCriar || !criado?.user) {
      if (ehEmailJaCadastrado(erroCriar)) {
        log('TRANSFER_CREATE_USER', { resultado: 'email_ja_cadastrado', code: erroCriar?.code })
        return { status: 409, body: { codigo: 'JA_TEM_CONTA', error: 'Este e-mail já possui uma conta. Entre para assumir a página.' } }
      }
      console.error('[convite/aceitar] TRANSFER_CREATE_USER falhou', JSON.stringify({ message: erroCriar?.message, code: erroCriar?.code, status: (erroCriar as { status?: number } | null)?.status }))
      if ((erroCriar?.code || '').toLowerCase() === 'weak_password')
        return { status: 400, body: { codigo: 'SENHA_FRACA', error: 'Esta senha é muito fraca ou comum. Escolha outra senha.' } }
      return { status: 500, body: comDetalhe({ codigo: 'AUTH_CREATE_FALHOU', error: 'Não foi possível criar sua conta agora. Tente novamente em instantes.' }, erroCriar?.message) }
    }
    novoUserId = criado.user.id
    criadoAgora = true
    senhaDaCriacao = input.senha
    log('TRANSFER_CREATE_USER', { resultado: 'criado' })
  }

  // ---- 3) Transferencia atomica (uma transacao no banco: dono, conteudo e convite aceito) ----
  const { data: resumo, error: erroTransf } = await supabase.rpc('aceitar_convite_transferencia', {
    p_convite_id: convite.id, p_novo_user_id: novoUserId,
  })
  log('TRANSFER_CHANGE_OWNER', { ok: !erroTransf, erro: erroTransf?.message, perfil: convite.perfil_id })

  if (erroTransf) {
    // Usuario criado agora + transferencia falhou: desfaz. A transacao do banco ja foi
    // revertida (dono antigo mantido, convite continua pendente), e nenhuma conta fica orfa.
    if (criadoAgora) {
      const { error: erroDel } = await supabase.auth.admin.deleteUser(novoUserId)
      log('TRANSFER_ROLLBACK', { ok: !erroDel, erro: erroDel?.message })
    }
    const r = mapearErroTransferencia(erroTransf.message || '')
    return { status: r.status, body: comDetalhe(r.body, erroTransf.message) }
  }

  // O convite foi marcado como aceito dentro da mesma transacao acima.
  log('TRANSFER_MARK_ACCEPTED', { convite: convite.id, perfil: convite.perfil_id, tabelas: resumo })

  // Conta nova: entra com a senha recem-criada e devolve a sessao (o navegador a assume).
  let session: { access_token: string; refresh_token: string } | null = null
  if (criadoAgora && senhaDaCriacao && criarClienteAnon) {
    try {
      const { data: login, error: erroLogin } = await criarClienteAnon().auth.signInWithPassword({ email: String(convite.email_novo), password: senhaDaCriacao })
      if (!erroLogin && login?.session) session = { access_token: login.session.access_token, refresh_token: login.session.refresh_token }
      log('TRANSFER_LOGIN', { via: 'senha_nova', ok: !!session, erro: erroLogin?.message })
    } catch (e) { log('TRANSFER_LOGIN', { via: 'senha_nova', ok: false, erro: String(e) }) }
  }
  return { status: 200, body: { ok: true, session } }
}
