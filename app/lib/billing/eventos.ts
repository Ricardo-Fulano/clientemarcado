import type { EventoNormalizadoBilling, ProvedorBilling, TipoEventoBilling } from './types'

/** Eventos sao evidencias a conciliar. Nao ativam planos automaticamente. */
const ASAAS: Readonly<Record<string, TipoEventoBilling>> = {
  SUBSCRIPTION_CREATED: 'assinatura_criada', SUBSCRIPTION_UPDATED: 'assinatura_alterada',
  SUBSCRIPTION_INACTIVATED: 'assinatura_cancelada', SUBSCRIPTION_DELETED: 'assinatura_cancelada',
  PAYMENT_CONFIRMED: 'pagamento_confirmado', PAYMENT_RECEIVED: 'pagamento_confirmado',
  PAYMENT_OVERDUE: 'pagamento_atrasado', PAYMENT_REFUNDED: 'estorno',
}
const PADDLE: Readonly<Record<string, TipoEventoBilling>> = {
  'subscription.created': 'assinatura_criada', 'subscription.activated': 'assinatura_ativa',
  'subscription.updated': 'assinatura_alterada', 'subscription.past_due': 'pagamento_atrasado',
  'subscription.canceled': 'assinatura_cancelada',
  'transaction.completed': 'pagamento_confirmado', 'transaction.payment_failed': 'pagamento_atrasado',
  'adjustment.created': 'evento_desconhecido',
}

function objeto(v: unknown): Record<string, unknown> { return v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {} }
function str(v: unknown): string | undefined { return typeof v === 'string' && v.trim() ? v : undefined }

export function normalizarEventoBilling(provedor: ProvedorBilling, payload: unknown): EventoNormalizadoBilling {
  const p = objeto(payload)
  const data = objeto(p.data)
  const pg = objeto(p.payment)
  const tipoExterno = str(provedor === 'asaas' ? p.event : p.event_type) || ''
  const idEvento = str(provedor === 'asaas' ? p.id : p.event_id)
  if (!idEvento) throw new Error('EVENTO_SEM_ID')
  const tipo = (provedor === 'asaas' ? ASAAS : PADDLE)[tipoExterno] || 'evento_desconhecido'
  const idAssinaturaExterna = str(provedor === 'asaas' ? pg.subscription || objeto(p.subscription).id : data.subscription_id || (tipoExterno.startsWith('subscription.') ? data.id : undefined))
  const idPagamentoExterno = str(provedor === 'asaas' ? pg.id : (tipoExterno.startsWith('transaction.') ? data.id : undefined))
  return { provedor, idEvento, tipo, idAssinaturaExterna, idPagamentoExterno, instante: str(provedor === 'asaas' ? p.dateCreated : p.occurred_at) }
}

export function chaveIdempotencia(e: EventoNormalizadoBilling): string {
  return `${e.provedor}:${e.idEvento}`
}
