// Webhook do Resend (assinatura Svix): verificacao da assinatura + mapeamento de eventos para o acompanhamento do e-mail.
// Entrega "at-least-once" (duplicatas e fora de ordem): o status so AVANCA (ranking) e o tratamento e idempotente.
import { createHmac, timingSafeEqual } from 'node:crypto'

export interface CabecalhosSvix {
  id: string | null | undefined
  timestamp: string | null | undefined
  signature: string | null | undefined
}

/** Svix: HMAC-SHA256 de "<id>.<timestamp>.<corpo>" com a chave = base64 do segredo (sem o prefixo whsec_), tolerancia de 5 minutos */
export function verificarAssinaturaSvix(corpo: string, h: CabecalhosSvix, segredo: string, agoraMs: number = Date.now(), toleranciaS = 300): boolean {
  if (!h.id || !h.timestamp || !h.signature || !segredo) return false
  const ts = Number(h.timestamp)
  if (!Number.isInteger(ts) || Math.abs(agoraMs / 1000 - ts) > toleranciaS) return false
  let chave: Buffer
  try {
    chave = Buffer.from(segredo.startsWith('whsec_') ? segredo.slice(6) : segredo, 'base64')
  } catch {
    return false
  }
  if (chave.length === 0) return false
  const esperado = createHmac('sha256', chave).update(`${h.id}.${h.timestamp}.${corpo}`).digest()
  for (const par of h.signature.split(' ')) {
    const [versao, valor] = par.split(',')
    if (versao !== 'v1' || !valor) continue
    const recebido = Buffer.from(valor, 'base64')
    if (recebido.length === esperado.length && timingSafeEqual(recebido, esperado)) return true
  }
  return false
}

export type EmailStatus = 'solicitado' | 'entregue' | 'atrasado' | 'devolvido' | 'spam' | 'falhou' | 'indeterminado'

const RANK: Record<string, number> = { indeterminado: 0, solicitado: 1, atrasado: 2, entregue: 4, devolvido: 5, falhou: 5, spam: 6 }
const rank = (s: string | null | undefined): number => (s && s in RANK ? (RANK[s] as number) : 0)

const EVENTOS: Record<string, EmailStatus> = {
  'email.sent': 'solicitado',
  'email.delivery_delayed': 'atrasado',
  'email.delivered': 'entregue',
  'email.bounced': 'devolvido',
  'email.failed': 'falhou',
  'email.suppressed': 'falhou',
  'email.complained': 'spam',
}

export interface LinhaEmail {
  email_status: string | null
}

export interface WebhookStore {
  buscarPorResendId(resendId: string): Promise<LinhaEmail | null>
  /** atualizacao OTIMISTA: so grava se email_status ainda for "statusAtual" (evita sobrescrever um evento concorrente) */
  atualizar(resendId: string, statusAtual: string | null, patch: { email_status: EmailStatus; email_entregue_em?: string; email_erro?: string | null }): Promise<boolean>
}

export type ResultadoWebhook = { tipo: 'ignorado'; motivo: string } | { tipo: 'atualizado'; status: EmailStatus } | { tipo: 'sem_mudanca' }

function textoCurto(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 160) : null
}

export async function processarEventoResend(evento: unknown, store: WebhookStore, agora: () => Date = () => new Date()): Promise<ResultadoWebhook> {
  const e = evento && typeof evento === 'object' ? (evento as Record<string, unknown>) : null
  const tipo = typeof e?.type === 'string' ? e.type : ''
  const alvo = EVENTOS[tipo]
  if (!alvo) return { tipo: 'ignorado', motivo: 'evento_nao_acompanhado' } // opened, clicked, scheduled, received...
  const dados = e?.data && typeof e.data === 'object' ? (e.data as Record<string, unknown>) : {}
  const resendId = typeof dados.email_id === 'string' ? dados.email_id : ''
  if (!resendId) return { tipo: 'ignorado', motivo: 'sem_email_id' }

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const linha = await store.buscarPorResendId(resendId)
    if (!linha) return { tipo: 'ignorado', motivo: 'email_de_outro_fluxo' } // a mesma conta Resend envia outros e-mails: nao e erro
    // o status so AVANCA: duplicata ou evento fora de ordem (ex.: "atrasado" depois de "entregue") nao muda nada.
    // 'indeterminado' e nulo valem 0: qualquer evento real os resolve.
    if (linha.email_status === alvo || rank(alvo) <= rank(linha.email_status)) return { tipo: 'sem_mudanca' }
    const criado = typeof e?.created_at === 'string' && !Number.isNaN(new Date(e.created_at).getTime()) ? e.created_at : agora().toISOString()
    const patch: { email_status: EmailStatus; email_entregue_em?: string; email_erro?: string | null } = { email_status: alvo }
    if (alvo === 'entregue') patch.email_entregue_em = criado
    if (alvo === 'devolvido' || alvo === 'falhou') {
      const b = dados.bounce && typeof dados.bounce === 'object' ? (dados.bounce as Record<string, unknown>) : {}
      patch.email_erro = textoCurto(b.message) ?? textoCurto(dados.reason) ?? textoCurto(tipo)
    }
    if (await store.atualizar(resendId, linha.email_status, patch)) return { tipo: 'atualizado', status: alvo }
    // outro evento atualizou entre a leitura e a gravacao: le de novo e reavalia o ranking
  }
  throw new Error('webhook: conflito de atualizacao persistente')
}

// ---------------------------------------------------------------- adaptador Supabase do WebhookStore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClienteSb = { from: (tabela: string) => any }

export function criarWebhookStore(supabase: ClienteSb): WebhookStore {
  return {
    async buscarPorResendId(resendId) {
      const { data, error } = await supabase.from('convites_transferencia').select('email_status').eq('resend_email_id', resendId).maybeSingle()
      if (error) throw new Error(`buscarPorResendId: ${error.message}`)
      return data ? { email_status: (data.email_status as string | null) ?? null } : null
    },
    async atualizar(resendId, statusAtual, patch) {
      let q = supabase.from('convites_transferencia').update(patch).eq('resend_email_id', resendId)
      q = statusAtual === null ? q.is('email_status', null) : q.eq('email_status', statusAtual)
      const { data, error } = await q.select('id')
      if (error) throw new Error(`atualizar: ${error.message}`)
      return Array.isArray(data) && data.length === 1
    },
  }
}
