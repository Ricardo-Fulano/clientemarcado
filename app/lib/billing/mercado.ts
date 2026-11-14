import type { MercadoBilling, MoedaBilling } from './types'

/** Zona do euro em novembro de 2026 (inclui Bulgaria desde janeiro de 2026). */
export const PAISES_EURO = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES',
])

/** Pais de cobranca declarado e validado; idioma, navegador e IP nao determinam moeda. */
export function selecionarMercado(paisCobranca: string): { mercado: MercadoBilling; moeda: MoedaBilling } {
  const pais = paisCobranca.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(pais)) throw new Error('PAIS_COBRANCA_INVALIDO')
  if (pais === 'BR') return { mercado: 'BR', moeda: 'BRL' }
  if (PAISES_EURO.has(pais)) return { mercado: 'EU', moeda: 'EUR' }
  return { mercado: 'GLOBAL', moeda: 'USD' }
}

export function validarMoedaParaPais(paisCobranca: string, moeda: string): MoedaBilling {
  const escolhida = selecionarMercado(paisCobranca).moeda
  if (moeda !== escolhida) throw new Error('MOEDA_INCOMPATIVEL_COM_PAIS')
  return escolhida
}
