/** Interpretacao apenas para diagnostico: nao da acesso nem registra pagamento. */
export type ResumoWebhookPaddle = {
  eventId: string
  eventType: string
  entityId: string | null
  occurredAt: string
  status: string | null
}

export function resumirWebhookPaddle(valor: unknown): ResumoWebhookPaddle {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) throw new Error('PADDLE_PAYLOAD_INVALIDO')
  const evento = valor as Record<string, unknown>
  const data = evento.data && typeof evento.data === 'object' && !Array.isArray(evento.data)
    ? evento.data as Record<string, unknown> : {}
  const eventId = evento.event_id
  const eventType = evento.event_type
  const occurredAt = evento.occurred_at
  if (typeof eventId !== 'string' || !/^evt_[a-z0-9]{10,80}$/.test(eventId)) throw new Error('PADDLE_EVENT_ID_INVALIDO')
  if (typeof eventType !== 'string' || !/^[a-z]+\.[a-z_]+$/.test(eventType)) throw new Error('PADDLE_EVENT_TYPE_INVALIDO')
  if (typeof occurredAt !== 'string' || Number.isNaN(Date.parse(occurredAt))) throw new Error('PADDLE_EVENT_DATE_INVALIDA')
  return {
    eventId,
    eventType,
    entityId: typeof data.id === 'string' && /^(sub|txn|ctm|adj)_[a-z0-9]+$/.test(data.id) ? data.id : null,
    occurredAt,
    status: typeof data.status === 'string' ? data.status.slice(0, 40) : null,
  }
}
