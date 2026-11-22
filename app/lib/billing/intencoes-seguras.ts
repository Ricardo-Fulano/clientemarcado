/** Somente preparacao de intencao na homologacao; NUNCA ativa acesso ou cria cobranca. */
export const PLANOS_NOVOS_PAGOS = ['minipage', 'agenda', 'loja', 'essencial'] as const
export type PlanoNovoPago = typeof PLANOS_NOVOS_PAGOS[number]
export type CicloIntencao = 'mensal' | 'anual'
export type IntencaoValida = { plano: PlanoNovoPago; ciclo: CicloIntencao; attemptId: string }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function validarIntencao(valor: unknown): IntencaoValida | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null
  const c = valor as Record<string, unknown>
  if (Object.keys(c).length !== 3 || typeof c.plano !== 'string' || typeof c.ciclo !== 'string' || typeof c.attemptId !== 'string') return null
  if (!(PLANOS_NOVOS_PAGOS as readonly string[]).includes(c.plano)) return null
  if (c.ciclo !== 'mensal' && c.ciclo !== 'anual') return null
  if (!UUID.test(c.attemptId)) return null
  return { plano: c.plano as PlanoNovoPago, ciclo: c.ciclo as CicloIntencao, attemptId: c.attemptId }
}
export function podeHabilitarIntencaoHomolog(env: Record<string, string | undefined>): boolean {
  return env.MP_BILLING_INTENT_HOMOLOG_ENABLED === 'true' &&
    env.MP_BILLING_INTENT_DB_READY === 'true' &&
    env.VERCEL_ENV !== 'production' && env.MP_BILLING_INTENT_HOMOLOG_ACK === 'HOMOLOGACAO_SEM_COBRANCA'
}
