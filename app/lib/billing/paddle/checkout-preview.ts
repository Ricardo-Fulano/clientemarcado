/** Bloco 9A - identificadores de teste existentes na Paddle Sandbox.
 * NAO sao IDs Live. Nenhuma chamada externa ou concessao de plano neste arquivo.
 * Atualizar IDs apenas com auditoria e aprovacao explicita.
 */
export const PRECO_IDS_SANDBOX = {
  minipage: { mensal: 'pri_01m7dfrnp1j43rr8ec2kbb3p94', anual: 'pri_01m7drfv417wh37dp91bvby9ht' },
  agenda: { mensal: 'pri_01m7drpdgjt9n4sy09armkqsr4', anual: 'pri_01m7drpdpw7g3yahxy08w5bcz4' },
  loja: { mensal: 'pri_01m7fx65zg93gtrp8csa7whnv5', anual: 'pri_01m7fx665m2jrefz90brgjwa73' },
  essencial: { mensal: 'pri_01m7fx68nj8a64rqhhqxzht9te', anual: 'pri_01m7fx68vhqtznfe8g624ap00j' },
  equipe: { mensal: 'pri_01m7fx6b12xj00sh40m0n2f1jh', anual: 'pri_01m7fx6b6swtvwvcb8jc1p0cdw' },
} as const

export type CodigoPago = keyof typeof PRECO_IDS_SANDBOX
export type CicloPaddle = 'mensal' | 'anual'

/** Valida dados CRUDOS do banco. Nao usa normalizarPlano() nem normalizarBillingCycle()
 * porque os fallbacks desses helpers poderiam selecionar outro plano sem querer. */
export function resolverPrecoSandbox(plano: unknown, ciclo: unknown): { plano: CodigoPago; ciclo: CicloPaddle; priceId: string } {
  if (typeof plano !== 'string' || !Object.prototype.hasOwnProperty.call(PRECO_IDS_SANDBOX, plano)) {
    throw new Error('PLANO_PADDLE_INVALIDO')
  }
  if (ciclo !== 'mensal' && ciclo !== 'anual') throw new Error('CICLO_PADDLE_INVALIDO')
  const codigo = plano as CodigoPago
  return { plano: codigo, ciclo, priceId: PRECO_IDS_SANDBOX[codigo][ciclo] }
}

/** Falha fechada: somente localhost de desenvolvimento ou preview da Vercel.
 * Em producao retorna falso mesmo se alguem configurar flags por engano. */
export function previewCheckoutSandboxHabilitado(env: Record<string, string | undefined>): boolean {
  const ambienteNaoProd = env.VERCEL_ENV === 'preview' || (!env.VERCEL_ENV && env.NODE_ENV === 'development')
  return ambienteNaoProd && env.PADDLE_ENVIRONMENT === 'sandbox' &&
    env.MINIPAGE_PADDLE_SANDBOX_CHECKOUT_PREVIEW_ENABLED === 'true'
}
