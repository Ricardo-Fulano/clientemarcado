import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

// Logica do aceite de convite de transferencia, separada da rota para ser testavel.
// So roda no servidor (recebe um client com service_role).
//
// Etapas logadas (aparecem nos Runtime Logs da Vercel, filtre por "[convite/aceitar]"):
//   TRANSFER_INVITE_VALIDATE, AUTH_USER_LOOKUP, AUTH_USER_CREATE, AUTH_USER_ROLLBACK,
//   MINIPAGE_OWNER_TRANSFER (inclui a checagem de conflito de pagina, feita dentro da
//   transacao), INVITE_ACCEPT.
// Nunca logamos senha, token nem e-mail completo.

export type AceiteInput = { token?: string | null; senha?: string | null; bearer?: string | null }
export type AceiteResultado = { status: number; body: Record<string, unknown> }

const MSG_GENERICA = 'Não foi possível concluir a transferência. Tente novamente.'

function mascarar(email: string): string {
  const [u, d] = email.split('@')
  return `${(u || '').slice(0, 2)}***@${d || ''}`
}

function log(etapa: string, dados: Record<string, unknown> = {}) {
  console.log(`[convite/aceitar] ${etapa}`, JSON.stringify(dados))
}

// Em producao a resposta nunca carrega detalhe tecnico; em dev (ou com CONVITE_DEBUG=1)
// devolve o erro real para facilitar o diagnostico.
function comDetalhe(body: Record<string, unknown>, detalhe: unknown): Record<string, unknown> {
  const debug = process.env.NODE_ENV !== 'production' || process.env.CONVITE_DEBUG === '1'
  return debug && detalhe ? { ...body, detalhe } : body
}

// O Supabase devolve "email_exists"/"user_already_exists" como code, e a mensagem
// "A user with this email address has already been registered" (note: "already BEEN
// registered"). A checagem antiga procurava so "already registered" e nao reconhecia essa
// mensagem, caindo no erro generico. Aqui olhamos o code primeiro e depois varias formas
// de mensagem.
export function ehEmailJaCadastrado(err: { message?: string; code?: string } | null | undefined): boolean {
  if (!err) return false
  const code = (err.code || '').toLowerCase()
  if (code === 'email_exists' || code === 'user_already_exists') return true
  return /already\s+(been\s+)?registered|already\s+exists|email_exists/i.test(err.message || '')
}

function mapearErroTransferencia(msg: string): AceiteResultado {
  if (msg.includes('DESTINO_JA_TEM_PAGINA'))
    return { status: 409, body: { codigo: 'DESTINO_JA_TEM_PAGINA', error: 'Esta conta já possui uma página própria. Use outro e-mail para receber esta página, ou fale com o suporte.' } }
  if (msg.includes('CONVITE_EXPIRADO'))
    return { status: 400, body: { codigo: 'CONVITE_EXPIRADO', error: 'Este convite expirou. Peça um novo convite.' } }
  if (msg.includes('CONVITE_NAO_PENDENTE') || msg.includes('CONVITE_NAO_ENCONTRADO'))
    return { status: 400, body: { codigo: 'CONVITE_USADO', error: 'Este convite já foi utilizado ou substituído.' } }
  if (msg.includes('PERFIL_MUDOU_DE_DONO'))
    return { status: 409, body: { codigo: 'PERFIL_MUDOU_DE_DONO', error: 'Esta página já mudou de responsável. Peça um novo convite.' } }
  if (msg.includes('DESTINO_IGUAL_ORIGEM'))
    return { status: 400, body: { codigo: 'DESTINO_IGUAL_ORIGEM', error: 'Este e-mail já é o responsável por esta página.' } }
  return { status: 500, body: { codigo: 'TRANSFERENCIA_FALHOU', error: MSG_GENERICA } }
}

export async function aceitarConvite(supabase: SupabaseClient, input: AceiteInput): Promise<AceiteResultado> {
  const token = input.token || ''
  if (!token) return { status: 400, body: { codigo: 'CONVITE_INVALIDO', error: 'Convite inválido.' } }

  // ---- 1) Validar o convite (so pelo token; nunca pela sessao) ----
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const { data: convite, error: erroConvite } = await supabase
    .from('convites_transferencia').select('*').eq('token_hash', tokenHash).maybeSingle()
  log('TRANSFER_INVITE_VALIDATE', { achou: !!convite, status: convite?.status, erroBanco: erroConvite?.message })

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

  if (input.bearer) {
    // Pessoa ja logada: a conta logada TEM que ser a do e-mail do convite.
    const { data: sess, error: erroSess } = await supabase.auth.getUser(input.bearer)
    const logado = sess?.user
    log('AUTH_USER_LOOKUP', { via: 'sessao', ok: !!logado, erro: erroSess?.message })
    if (erroSess || !logado) return { status: 401, body: { codigo: 'SESSAO_INVALIDA', error: 'Sessão inválida. Entre novamente.' } }
    if ((logado.email || '').toLowerCase() !== String(convite.email_novo).toLowerCase())
      return { status: 403, body: { codigo: 'EMAIL_DIFERENTE', error: 'Este convite foi enviado para outro e-mail. Saia desta conta e entre com o e-mail do convite.' } }
    novoUserId = logado.id
  } else {
    if (!input.senha || input.senha.length < 6)
      return { status: 400, body: { codigo: 'SENHA_CURTA', error: 'A senha precisa ter pelo menos 6 caracteres.' } }

    // Lookup exato por e-mail (RPC). Se a RPC nao existir ainda, seguimos e tratamos o
    // conflito pelo erro do createUser.
    const { data: existenteId, error: erroLookup } = await supabase.rpc('auth_user_id_por_email', { p_email: convite.email_novo })
    log('AUTH_USER_LOOKUP', { via: 'rpc', existe: !!existenteId, email: mascarar(String(convite.email_novo)), erro: erroLookup?.message })
    if (existenteId) return { status: 409, body: { codigo: 'JA_TEM_CONTA', error: 'Este e-mail já possui uma conta. Entre para assumir a página.' } }

    const { data: criado, error: erroCriar } = await supabase.auth.admin.createUser({
      email: convite.email_novo, password: input.senha, email_confirm: true,
    })
    if (erroCriar || !criado?.user) {
      if (ehEmailJaCadastrado(erroCriar)) {
        log('AUTH_USER_CREATE', { resultado: 'email_ja_cadastrado', code: erroCriar?.code })
        return { status: 409, body: { codigo: 'JA_TEM_CONTA', error: 'Este e-mail já possui uma conta. Entre para assumir a página.' } }
      }
      console.error('[convite/aceitar] AUTH_USER_CREATE falhou', JSON.stringify({ message: erroCriar?.message, code: erroCriar?.code, status: (erroCriar as { status?: number } | null)?.status }))
      if ((erroCriar?.code || '').toLowerCase() === 'weak_password')
        return { status: 400, body: { codigo: 'SENHA_FRACA', error: 'Esta senha é muito fraca ou comum. Escolha outra senha.' } }
      return { status: 500, body: comDetalhe({ codigo: 'AUTH_CREATE_FALHOU', error: 'Não foi possível criar sua conta agora. Tente novamente em instantes.' }, erroCriar?.message) }
    }
    novoUserId = criado.user.id
    criadoAgora = true
    log('AUTH_USER_CREATE', { resultado: 'criado' })
  }

  // ---- 3) Transferencia atomica (uma transacao no banco) ----
  const { data: resumo, error: erroTransf } = await supabase.rpc('aceitar_convite_transferencia', {
    p_convite_id: convite.id, p_novo_user_id: novoUserId,
  })
  log('MINIPAGE_OWNER_TRANSFER', { ok: !erroTransf, erro: erroTransf?.message, perfil: convite.perfil_id })

  if (erroTransf) {
    // Se criamos o usuario agora e a transferencia falhou, desfaz: nada fica orfao e o
    // convite continua pendente (a transacao do banco ja foi revertida).
    if (criadoAgora) {
      const { error: erroDel } = await supabase.auth.admin.deleteUser(novoUserId)
      log('AUTH_USER_ROLLBACK', { ok: !erroDel, erro: erroDel?.message })
    }
    const r = mapearErroTransferencia(erroTransf.message || '')
    return { status: r.status, body: comDetalhe(r.body, erroTransf.message) }
  }

  log('INVITE_ACCEPT', { convite: convite.id, perfil: convite.perfil_id, tabelas: resumo })
  return { status: 200, body: { ok: true } }
}
