/**
 * MiniPage Checkout V1 - dominio separado dos gateways historicos.
 * Este modulo NAO cobra, NAO concede acesso e NAO registra dados no banco.
 * Internamente MiniPage Pro usa o identificador 'essencial'.
 */
export const PLANOS_PAGOS_GLOBAL = ['minipage', 'agenda', 'loja', 'essencial'] as const
export type PlanoGlobalPago = typeof PLANOS_PAGOS_GLOBAL[number]
export type PlanoGlobal = 'free' | PlanoGlobalPago
export type CicloGlobal = 'mensal' | 'anual'
export type ProvedorGlobal = 'ebanx' | 'stripe'
export type MetodoGlobal = 'pix_automatico' | 'cartao_recorrente' | 'google_pay' | 'apple_pay' | 'paypal_assinaturas' | 'upi_autopay' | 'nequi_recorrente' | 'capitec_recorrente' | 'opay_recorrente' | 'yape_recorrente' | 'maya_recorrente' | 'zalopay_recorrente' | 'ovo_recorrente' | 'dana_recorrente' | 'nupay_recorrente' | 'sepa_recorrente' | 'ach_recorrente' | 'pad_canada' | 'bacs_recorrente'
export type EstadoMetodo = 'candidato' | 'homologado' | 'indisponivel'

export interface EntidadeVendedoraGlobal {
  id: string // identificador interno; nunca numero de documento sensivel
  pais: string // ISO-3166-1 alpha-2
  provedoresAprovados: readonly ProvedorGlobal[]
}

/** Habilitacoes contratadas, explicitamente e por entidade. Nao inferir por pais de compradores. */
export interface HabilitacaoProvedorGlobal {
  entidadeId: string
  provedor: ProvedorGlobal
  paisesCompradores: readonly string[]
  metodosAutorizados: readonly MetodoGlobal[]
  moedasAutorizadas: readonly string[]
  aprovadoComercialmente: boolean
  homologacaoRecorrenciaAprovada: boolean
}

export interface MetodoCandidato {
  metodo: MetodoGlobal
  nome: string
  recorrente: true
  /** Nao confundir carteira com gateway. Google/Apple Pay sao metodos de cartao. */
  exigeDispositivoCompativel?: boolean
  ressalva?: string
}

export type DecisaoRoteamento =
  | { situacao: 'gratuito'; plano: 'free'; pais: string; mensagem: string }
  | { situacao: 'nao_habilitado'; plano: PlanoGlobalPago; pais: string; provedorPreferencial: ProvedorGlobal; moedaReferencia: string; metodosCandidatos: readonly MetodoCandidato[]; motivos: readonly string[] }
  | { situacao: 'habilitado'; plano: PlanoGlobalPago; pais: string; provedor: ProvedorGlobal; entidadeId: string; moeda: string; metodos: readonly MetodoCandidato[]; aviso: string }

export const MAPA_PLANO_COMERCIAL = {
  free: 'Free', minipage: 'MiniPage', agenda: 'MiniPage Agenda', loja: 'MiniPage Loja', essencial: 'MiniPage Pro',
} as const

export function validarPlanoGlobal(valor: unknown): PlanoGlobal {
  if (valor === 'free' || (typeof valor === 'string' && (PLANOS_PAGOS_GLOBAL as readonly string[]).includes(valor))) return valor as PlanoGlobal
  throw new Error('PLANO_NAO_OFERTADO')
}

export function validarCicloGlobal(valor: unknown): CicloGlobal {
  if (valor === 'mensal' || valor === 'anual') return valor
  throw new Error('CICLO_INVALIDO')
}

export function validarPaisGlobal(valor: unknown): string {
  if (typeof valor !== 'string' || !/^[A-Z]{2}$/.test(valor.trim().toUpperCase())) throw new Error('PAIS_INVALIDO')
  return valor.trim().toUpperCase()
}
