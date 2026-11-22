/** Catálogo comercial exclusivo para apresentação e validação da seleção.
 * NÃO cria assinatura, altera plano_tipo nem determina permissões.
 * O backend de cobrança valida elegibilidade, plano e valor independentemente. */
export const PLANOS_OFERTADOS = ['free', 'minipage', 'agenda', 'loja', 'essencial'] as const
export type PlanoOfertado = (typeof PLANOS_OFERTADOS)[number]
export const HERANCA_PLANOS: Readonly<Record<PlanoOfertado, readonly PlanoOfertado[]>> = {
  free: [],
  minipage: ['free'],
  agenda: ['free','minipage'],
  loja: ['free','minipage','agenda'],
  essencial: ['free','minipage','agenda','loja'],
}
export function planoEstaNaOferta(valor: unknown): valor is PlanoOfertado {
  return typeof valor === 'string' && (PLANOS_OFERTADOS as readonly string[]).includes(valor)
}
export function recursoHerdado(plano: PlanoOfertado, de: PlanoOfertado): boolean {
  return plano === de || HERANCA_PLANOS[plano].includes(de)
}
