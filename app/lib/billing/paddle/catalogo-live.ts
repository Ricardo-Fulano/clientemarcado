/** Catálogo Paddle Live criado em 15/11/2026 e confirmado por inventário pós-aplicação.
 * NÃO ativa checkout nem autoriza cobrança. Nunca usar IDs Sandbox aqui.
 */
export const PRECO_IDS_PADDLE_LIVE = {
  minipage: { mensal: 'pri_01m7gk1ywam5zv87a60rkn98jq', anual: 'pri_01m7gk1z1y1qyhrd2g7a6p8yqc' },
  agenda: { mensal: 'pri_01m7gk1zemyy154rme500peyfc', anual: 'pri_01m7gk1zm9eh7jc063nqphv1zy' },
  loja: { mensal: 'pri_01m7gk2014tcn6vdatdknjrbnd', anual: 'pri_01m7gk206jwjebxj4jjr7047br' },
  essencial: { mensal: 'pri_01m7gk20k229eg98thmaz360jc', anual: 'pri_01m7gk20r8en3vwvrm52r0set4' },
  equipe: { mensal: 'pri_01m7gk214cee5b47n0azywnnkb', anual: 'pri_01m7gk219mrqww0bh7e6x0adya' },
} as const

export const PRODUTO_IDS_PADDLE_LIVE = {
  minipage: 'pro_01m7gk1yp99enx4y458njhh87j',
  agenda: 'pro_01m7gk1z9m0ne2e4en7f9w3s92',
  loja: 'pro_01m7gk1zw21kesc312aw0kfhrx',
  essencial: 'pro_01m7gk20dw057ypt2mh61dypk0',
  equipe: 'pro_01m7gk20zb93qc2drr64nwbxhk',
} as const

export type PlanoPaddleLive = keyof typeof PRECO_IDS_PADDLE_LIVE
export type CicloPaddleLive = 'mensal' | 'anual'

/** Não usar normalizarPlano(): seu fallback para 'essencial' pode liberar plano indevido. */
export function resolverPrecoPaddleLive(plano: unknown, ciclo: unknown) {
  if (typeof plano !== 'string' || !Object.prototype.hasOwnProperty.call(PRECO_IDS_PADDLE_LIVE, plano)) {
    throw new Error('PLANO_PADDLE_LIVE_INVALIDO')
  }
  if (ciclo !== 'mensal' && ciclo !== 'anual') throw new Error('CICLO_PADDLE_LIVE_INVALIDO')
  const codigo = plano as PlanoPaddleLive
  return { plano: codigo, ciclo, priceId: PRECO_IDS_PADDLE_LIVE[codigo][ciclo], productId: PRODUTO_IDS_PADDLE_LIVE[codigo] }
}

/** Retorna null para ID desconhecido: jamais adivinhar plano, preço ou ciclo. */
export function identificarPrecoPaddleLive(precoId: unknown): { plano: PlanoPaddleLive; ciclo: CicloPaddleLive } | null {
  if (typeof precoId !== 'string') return null
  for (const plano of Object.keys(PRECO_IDS_PADDLE_LIVE) as PlanoPaddleLive[]) {
    for (const ciclo of ['mensal', 'anual'] as const) {
      if (PRECO_IDS_PADDLE_LIVE[plano][ciclo] === precoId) return { plano, ciclo }
    }
  }
  return null
}
