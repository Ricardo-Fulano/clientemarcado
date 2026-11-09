import { gerarCodigoTransferencia, hashConviteProtegido } from './convite-seguranca'
// Criacao de convites de transferencia: LOGICA PURA (sem Next, sem Supabase, sem rede). Tudo que toca o mundo externo entra por
// "deps" (banco e e-mail), para ser testada de verdade com falsos programaveis.
//
// ORDEM DO FLUXO (a unica que nao deixa ninguem sem convite valido):
//   1. grava o convite NOVO como 'pendente' (o link ja e valido quando o e-mail chegar) e NAO cancela nada;
//   2. envia pelo Resend (com Idempotency-Key = id do convite: repetir o envio nunca duplica o e-mail);
//   3. se o Resend ACEITOU: registra o id e SO ENTAO cancela os convites pendentes MAIS ANTIGOS do mesmo perfil;
//   4. se o Resend RECUSOU de forma definitiva: cancela so o convite novo (ninguem recebeu o link); o anterior continua valido;
//   5. se o resultado e INCERTO (timeout/rede/5xx): tenta de novo com a MESMA chave; se continuar incerto, mantem o novo
//      'pendente' (o e-mail pode ter saido) e NAO cancela o anterior.
// A funcao de banco aceitar_convite_transferencia nao e tocada: ela ja trava o convite e o perfil e exige que o dono atual
// ainda seja o user_id_atual, entao mesmo dois convites validos ao mesmo tempo nunca geram duas transferencias.

export type EnvioResultado =
  | { tipo: 'aceito'; id: string }
  | { tipo: 'rejeitado'; http: number; codigo: string }
  | { tipo: 'incerto'; motivo: string }

export interface ConviteCriado {
  id: string
  criado_em: string
}

export interface ConviteStore {
  /** insere o convite NOVO como 'pendente' (nao cancela nada) */
  inserirPendente(p: { perfilId: string; userIdAtual: string; emailNovo: string; tokenHash: string; expiraEm: string }): Promise<ConviteCriado>
  /** existe convite 'pendente' deste perfil criado a partir de "desdeIso"? (protecao contra duplo clique / disparo em massa) */
  existePendenteRecente(perfilId: string, desdeIso: string): Promise<boolean>
  registrarSolicitado(conviteId: string, resendId: string, quandoIso: string): Promise<void>
  /** recusa definitiva: marca o convite como cancelado + email_status 'falhou' (UMA unica atualizacao) */
  falharConvite(conviteId: string, erro: string): Promise<void>
  registrarIndeterminado(conviteId: string, erro: string): Promise<void>
  /** cancela os pendentes do perfil criados ANTES deste convite; devolve quantos */
  cancelarAnteriores(perfilId: string, conviteId: string, criadoEm: string): Promise<number>
}

export interface EmailSender {
  enviar(msg: { para: string; assunto: string; html: string }, chaveIdempotencia: string): Promise<EnvioResultado>
}

export interface CriarDeps {
  store: ConviteStore
  email: EmailSender
  agora: () => Date
  gerarToken: () => { tokenCru: string; tokenHash: string }
  esperar: (ms: number) => Promise<void>
  log: (evento: string, dados?: Record<string, unknown>) => void
}

export interface CriarInput {
  adminId: string
  adminEmail: string
  perfil: { id: string; nome_negocio: string | null }
  emailNovo: unknown
  siteUrl: string
}

export interface CriarResposta {
  status: number
  body: Record<string, unknown>
}

export const COOLDOWN_MS = 30_000
export const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000
export const TENTATIVAS_ENVIO = 2
export const ESPERA_ENTRE_TENTATIVAS_MS = 1_500

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function escaparHtml(valor: string): string {
  return valor.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

export function montarEmail(nomeNegocio: string, linkConvite: string): { assunto: string; html: string } {
  const nome = escaparHtml(nomeNegocio)
  const link = escaparHtml(linkConvite)
  const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#181018;">
        <h1 style="font-size:24px;margin-bottom:16px;">
          Você recebeu acesso a uma página profissional
        </h1>

        <p style="font-size:16px;line-height:1.6;color:#3f3540;">
          Você foi convidada(o) a assumir o acesso da página profissional
          <strong>${nome}</strong> na MiniPage Pro.
        </p>

        <p style="font-size:16px;line-height:1.6;color:#3f3540;">
          Clique no botão abaixo para aceitar o convite e criar sua própria senha de acesso.
        </p>

        <p style="margin:28px 0;">
          <a href="${link}"
             style="display:inline-block;background:#EC4899;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;">
            Aceitar convite e criar senha
          </a>
        </p>

        <p style="font-size:13px;color:#6b5f6b;">
          Este link expira em 7 dias e só pode ser usado uma vez.
          Se você não esperava este convite, pode ignorar este e-mail.
        </p>

        <hr style="border:0;border-top:1px solid #eee2ee;margin:28px 0;" />

        <p style="font-size:13px;color:#8a7c8a;">
          MiniPage Pro<br/>
          Página profissional, agenda online e gestão para beleza e estética.
        </p>
      </div>
    `
  return { assunto: `Você recebeu acesso à página profissional ${nomeNegocio}`, html }
}

/** executa uma operacao de banco com UMA nova tentativa (falha transitoria); devolve o erro final em vez de lancar */
async function comRetentativa<T>(fn: () => Promise<T>): Promise<{ ok: true; valor: T } | { ok: false; erro: unknown }> {
  let ultimo: unknown
  for (let i = 0; i < 2; i++) {
    try {
      return { ok: true, valor: await fn() }
    } catch (e) {
      ultimo = e
    }
  }
  return { ok: false, erro: ultimo }
}

const curto = (e: unknown): string => String((e as { message?: unknown } | null)?.message ?? e ?? 'erro').slice(0, 200)

export async function criarConvite(input: CriarInput, deps: CriarDeps): Promise<CriarResposta> {
  const { store, email, agora, gerarToken, esperar, log } = deps

  const emailNovo = typeof input.emailNovo === 'string' ? input.emailNovo.trim().toLowerCase() : ''
  if (!emailNovo || !EMAIL_RE.test(emailNovo)) return { status: 400, body: { error: 'Informe um e-mail vÃ¡lido.' } }
  if (emailNovo === (input.adminEmail || '').toLowerCase()) {
    return { status: 400, body: { error: 'O novo e-mail precisa ser diferente do e-mail atual.' } }
  }

  // protecao contra duplo clique e disparo em massa: ja existe um convite pendente criado ha menos de 30 s
  try {
    const desde = new Date(agora().getTime() - COOLDOWN_MS).toISOString()
    if (await store.existePendenteRecente(input.perfil.id, desde)) {
      return { status: 429, body: { error: 'Aguarde alguns segundos antes de enviar outro convite.', codigo: 'AGUARDE' } }
    }
  } catch (e) {
    log('cooldown_falhou', { erro: curto(e) })
    return { status: 500, body: { error: 'NÃ£o foi possÃ­vel criar o convite agora.' } }
  }

  // 1) convite novo, PENDENTE, sem cancelar nada
  // O token do link e o codigo de autorizacao sao independentes.
  // O codigo e mostrado apenas UMA VEZ ao proprietario, nunca enviado no mesmo e-mail.
  const { tokenCru } = gerarToken()
  const codigoAutorizacao = gerarCodigoTransferencia()
  const tokenHash = hashConviteProtegido(tokenCru, codigoAutorizacao)
  let novo: ConviteCriado
  try {
    novo = await store.inserirPendente({
      perfilId: input.perfil.id,
      userIdAtual: input.adminId,
      emailNovo,
      tokenHash,
      expiraEm: new Date(agora().getTime() + VALIDADE_MS).toISOString(),
    })
  } catch (e) {
    log('insercao_falhou', { erro: curto(e) })
    return { status: 500, body: { error: 'NÃ£o foi possÃ­vel criar o convite agora.' } } // nada foi enviado, nada foi cancelado
  }

  // 2) envio (a mesma chave e o mesmo conteudo em todas as tentativas: o Resend nao duplica o e-mail)
  const link = `${input.siteUrl.replace(/\/$/, '')}/convite/${tokenCru}`
  const { assunto, html } = montarEmail(input.perfil.nome_negocio || 'MiniPage Pro', link)
  const chave = `convite-transferencia-${novo.id}`
  let envio: EnvioResultado = { tipo: 'incerto', motivo: 'nao_tentou' }
  for (let tentativa = 1; tentativa <= TENTATIVAS_ENVIO; tentativa++) {
    try {
      envio = await email.enviar({ para: emailNovo, assunto, html }, chave)
    } catch (e) {
      envio = { tipo: 'incerto', motivo: curto(e) }
    }
    if (envio.tipo !== 'incerto') break
    if (tentativa < TENTATIVAS_ENVIO) await esperar(ESPERA_ENTRE_TENTATIVAS_MS)
  }

  // 4) recusa definitiva: ninguem recebeu o link. Cancela SO o convite novo; o anterior continua valido.
  if (envio.tipo === 'rejeitado') {
    const motivoRecusa = `Resend recusou o envio (HTTP ${envio.http} ${envio.codigo})`.slice(0, 200)
    const r = await comRetentativa(() => store.falharConvite(novo.id, motivoRecusa))
    if (!r.ok) log('registro_falha_falhou', { conviteId: novo.id, erro: curto(r.erro) })
    return {
      status: 502,
      body: { error: 'NÃ£o foi possÃ­vel enviar o e-mail do convite. O convite anterior, se existir, continua vÃ¡lido.', codigo: 'ENVIO_REJEITADO' },
    }
  }

  // 5) resultado incerto: o e-mail PODE ter saido. Mantem o novo pendente e NAO cancela o anterior.
  if (envio.tipo === 'incerto') {
    const motivoIncerto = `Resultado do envio incerto: ${envio.motivo}`.slice(0, 200)
    const r = await comRetentativa(() => store.registrarIndeterminado(novo.id, motivoIncerto))
    if (!r.ok) log('registro_indeterminado_falhou', { conviteId: novo.id, erro: curto(r.erro) })
    return {
      status: 503,
      body: {
        error: 'NÃ£o foi possÃ­vel confirmar o envio do e-mail. O convite anterior continua vÃ¡lido. Aguarde alguns instantes, confira o status abaixo e, se o e-mail nÃ£o chegar, envie novamente.',
        codigo: 'ENVIO_INDETERMINADO',
      },
    }
  }

  // 3) o Resend aceitou: registra o id (acompanhamento) e SO ENTAO cancela os convites mais antigos
  const resendId = envio.id
  const registro = await comRetentativa(() => store.registrarSolicitado(novo.id, resendId, agora().toISOString()))
  if (!registro.ok) log('registro_solicitado_falhou', { conviteId: novo.id, erro: curto(registro.erro) })

  const cancel = await comRetentativa(() => store.cancelarAnteriores(input.perfil.id, novo.id, novo.criado_em))
  if (!cancel.ok) {
    log('cancelamento_anteriores_falhou', { conviteId: novo.id, erro: curto(cancel.erro) })
    return {
      status: 503,
      body: {
        error: 'O e-mail do novo convite foi enviado, mas nÃ£o foi possÃ­vel cancelar os convites anteriores. Eles continuam vÃ¡lidos atÃ© expirarem; envie o convite novamente para concluir.',
        codigo: 'CANCELAMENTO_PENDENTE',
        email_enviado: true,
      },
    }
  }

  return {
    status: 200,
    body: {
      ok: true,
      estado: 'solicitado', // o provedor ACEITOU o envio; a entrega efetiva so e confirmada pelo webhook
      anteriores_canceladas: cancel.valor,
      acompanhamento: registro.ok, // false = o e-mail saiu, mas o id nao pode ser registrado
      link_convite: link,
      codigo_autorizacao: codigoAutorizacao, // so devolvido ao dono autenticado, uma vez
    },
  }
}
