import type { ResumoWebhookPaddle } from './evento'

/** Persistencia apenas de evidencia de webhook autenticado. Nao ativa plano. */
export type RegistroWebhookBilling = {
  provider: 'paddle'
  provider_event_id: string
  event_type: string
  status: 'received'
  signature_verified: true
}

export function prepararRegistroPaddle(resumo: ResumoWebhookPaddle): RegistroWebhookBilling {
  if (!/^evt_[a-z0-9]{10,80}$/.test(resumo.eventId)) throw new Error('ID_EVENTO_INVALIDO')
  if (!/^[a-z]+\.[a-z_]+$/.test(resumo.eventType)) throw new Error('TIPO_EVENTO_INVALIDO')
  return {
    provider: 'paddle',
    provider_event_id: resumo.eventId,
    event_type: resumo.eventType,
    status: 'received',
    signature_verified: true,
  }
}

/** Tipo minimo: aceita cliente Supabase injetado, sem depender de chaves neste modulo. */
export interface PersistenciaWebhookPaddle {
  from(table: 'billing_webhook_events'): {
    insert(record: RegistroWebhookBilling): PromiseLike<{ error: { code?: string; message?: string } | null }>
  }
}

export type ResultadoPersistenciaPaddle = 'registrado' | 'duplicado'

/** A constraint UNIQUE(provider,provider_event_id) e a fonte da idempotencia. */
export async function registrarWebhookPaddle(
  db: PersistenciaWebhookPaddle,
  resumo: ResumoWebhookPaddle,
): Promise<ResultadoPersistenciaPaddle> {
  const registro = prepararRegistroPaddle(resumo)
  const { error } = await db.from('billing_webhook_events').insert(registro)
  if (!error) return 'registrado'
  if (error.code === '23505') return 'duplicado'
  throw new Error('PERSISTENCIA_WEBHOOK_INDISPONIVEL')
}
