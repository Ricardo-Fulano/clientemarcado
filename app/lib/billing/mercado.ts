import type { MercadoBilling, MoedaBilling } from './types'

/** Mercado vem do pais de faturamento declarado/validado, NUNCA do idioma, IP ou bandeira visual. */
export function selecionarMercado(paisCobranca: string): { mercado: MercadoBilling; moeda: MoedaBilling } {
  const pais = paisCobranca.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(pais)) throw new Error('PAIS_COBRANCA_INVALIDO')
  return pais === 'BR' ? { mercado: 'BR', moeda: 'BRL' } : { mercado: 'GLOBAL', moeda: 'USD' }
}

export function validarMoedaParaPais(paisCobranca: string, moeda: string): MoedaBilling {
  const escolhida = selecionarMercado(paisCobranca).moeda
  if (moeda !== escolhida) throw new Error('MOEDA_INCOMPATIVEL_COM_PAIS')
  return escolhida
}
