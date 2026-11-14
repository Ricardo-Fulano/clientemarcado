import { obterPrecoPlanoPorCiclo, type BillingCycle, type PlanoTipo } from '../planos'
import type { PrecoBilling } from './types'
import { selecionarMercado } from './mercado'

const PLANOS: readonly PlanoTipo[] = ['free', 'minipage', 'agenda', 'loja', 'essencial', 'equipe']
const CICLOS: readonly BillingCycle[] = ['mensal', 'anual']
export type TabelaUsd = Partial<Record<Exclude<PlanoTipo, 'free'>, Partial<Record<BillingCycle, number>>>>
export type TabelaEur = TabelaUsd

function centavosDeReais(valor: number): number {
  if (!Number.isFinite(valor) || valor < 0) throw new Error('PRECO_BRL_INVALIDO')
  return Math.round((valor + Number.EPSILON) * 100)
}

/** Valores internacionais sao centavos inteiros, nunca conversoes automaticas de BRL. */
function validarTabelaInternacional(tabela: TabelaUsd, moeda: 'USD' | 'EUR'): void {
  if (!tabela || typeof tabela !== 'object' || Array.isArray(tabela)) throw new Error(`TABELA_${moeda}_INVALIDA`)
  for (const [plano, ciclos] of Object.entries(tabela)) {
    if (!PLANOS.includes(plano as PlanoTipo) || plano === 'free' || !ciclos || typeof ciclos !== 'object' || Array.isArray(ciclos)) throw new Error(`PLANO_${moeda}_INVALIDO`)
    for (const [ciclo, centavos] of Object.entries(ciclos)) {
      if (!CICLOS.includes(ciclo as BillingCycle) || !Number.isSafeInteger(centavos) || centavos <= 0) throw new Error(`PRECO_${moeda}_INVALIDO`)
    }
  }
}
export function validarTabelaUsd(tabela: TabelaUsd): void { validarTabelaInternacional(tabela, 'USD') }
export function validarTabelaEur(tabela: TabelaEur): void { validarTabelaInternacional(tabela, 'EUR') }

export function cotarPlanoBilling(args: {
  plano: PlanoTipo
  ciclo: BillingCycle
  paisCobranca: string
  tabelaUsd?: TabelaUsd
  tabelaEur?: TabelaEur
}): PrecoBilling {
  const { plano, ciclo, paisCobranca, tabelaUsd = {}, tabelaEur = {} } = args
  if (!PLANOS.includes(plano) || !CICLOS.includes(ciclo)) throw new Error('PLANO_OU_CICLO_INVALIDO')
  const { mercado, moeda } = selecionarMercado(paisCobranca)
  if (plano === 'free') return { plano, ciclo, moeda, mercado, valorCentavos: 0 }
  if (moeda === 'BRL') {
    return { plano, ciclo, moeda, mercado, valorCentavos: centavosDeReais(obterPrecoPlanoPorCiclo(plano, ciclo)) }
  }
  if (moeda === 'EUR') {
    validarTabelaEur(tabelaEur)
    const valorCentavos = tabelaEur[plano]?.[ciclo]
    if (!valorCentavos) throw new Error('PRECO_EUR_NAO_CONFIGURADO')
    return { plano, ciclo, moeda, mercado, valorCentavos }
  }
  validarTabelaUsd(tabelaUsd)
  const valorCentavos = tabelaUsd[plano]?.[ciclo]
  if (!valorCentavos) throw new Error('PRECO_USD_NAO_CONFIGURADO')
  return { plano, ciclo, moeda, mercado, valorCentavos }
}

/** Formatacao de interface: locale nao determina moeda ou preco. */
export function formatarPrecoBilling(preco: PrecoBilling, idioma: string): string {
  const raiz = idioma.toLowerCase().split('-')[0]
  const locales: Record<string, string> = { pt: 'pt-BR', es: 'es-ES', en: 'en-US', fr: 'fr-FR', de: 'de-DE', it: 'it-IT' }
  return new Intl.NumberFormat(locales[raiz] || 'en-US', { style: 'currency', currency: preco.moeda }).format(preco.valorCentavos / 100)
}
