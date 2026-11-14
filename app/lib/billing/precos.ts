import { obterPrecoPlanoPorCiclo, type BillingCycle, type PlanoTipo } from '../planos'
import type { PrecoBilling } from './types'
import { selecionarMercado } from './mercado'

const PLANOS: readonly PlanoTipo[] = ['free', 'minipage', 'agenda', 'loja', 'essencial', 'equipe']
const CICLOS: readonly BillingCycle[] = ['mensal', 'anual']
export type TabelaUsd = Partial<Record<Exclude<PlanoTipo, 'free'>, Partial<Record<BillingCycle, number>>>>

function centavosDeReais(valor: number): number {
  if (!Number.isFinite(valor) || valor < 0) throw new Error('PRECO_BRL_INVALIDO')
  return Math.round((valor + Number.EPSILON) * 100)
}

/** Valores em USD sao centavos INTEIROS. Nao converte BRL automaticamente. */
export function validarTabelaUsd(tabela: TabelaUsd): void {
  for (const [plano, ciclos] of Object.entries(tabela)) {
    if (!PLANOS.includes(plano as PlanoTipo) || plano === 'free' || !ciclos || typeof ciclos !== 'object') throw new Error('PLANO_USD_INVALIDO')
    for (const [ciclo, centavos] of Object.entries(ciclos)) {
      if (!CICLOS.includes(ciclo as BillingCycle) || !Number.isSafeInteger(centavos) || centavos <= 0) throw new Error('PRECO_USD_INVALIDO')
    }
  }
}

export function cotarPlanoBilling(args: {
  plano: PlanoTipo
  ciclo: BillingCycle
  paisCobranca: string
  tabelaUsd?: TabelaUsd
}): PrecoBilling {
  const { plano, ciclo, paisCobranca, tabelaUsd = {} } = args
  if (!PLANOS.includes(plano) || !CICLOS.includes(ciclo)) throw new Error('PLANO_OU_CICLO_INVALIDO')
  const { mercado, moeda } = selecionarMercado(paisCobranca)
  if (plano === 'free') return { plano, ciclo, moeda, mercado, valorCentavos: 0 }
  if (moeda === 'BRL') {
    return { plano, ciclo, moeda, mercado, valorCentavos: centavosDeReais(obterPrecoPlanoPorCiclo(plano, ciclo)) }
  }
  validarTabelaUsd(tabelaUsd)
  const valorCentavos = tabelaUsd[plano]?.[ciclo]
  if (!valorCentavos) throw new Error('PRECO_USD_NAO_CONFIGURADO')
  return { plano, ciclo, moeda, mercado, valorCentavos }
}

/** Somente apresentacao, sem alterar o valor financeiro. */
export function formatarPrecoBilling(preco: PrecoBilling, idioma: string): string {
  const locale = idioma.toLowerCase().startsWith('pt') ? 'pt-BR' : idioma.toLowerCase().startsWith('es') ? 'es-ES' : 'en-US'
  return new Intl.NumberFormat(locale, { style: 'currency', currency: preco.moeda }).format(preco.valorCentavos / 100)
}
