/** Contratos independentes de gateway. Nenhuma funcao neste modulo inicia pagamentos. */
import type { BillingCycle, PlanoTipo } from '../planos'

export type MoedaBilling = 'BRL' | 'USD'
export type ProvedorBilling = 'asaas' | 'paddle'
export type MercadoBilling = 'BR' | 'GLOBAL'
export type StatusAssinaturaBilling =
  | 'rascunho' | 'aguardando_pagamento' | 'ativa' | 'em_atraso'
  | 'cancelamento_agendado' | 'cancelada' | 'expirada'
export type TipoEventoBilling =
  | 'assinatura_criada' | 'assinatura_ativa' | 'assinatura_alterada'
  | 'pagamento_confirmado' | 'pagamento_atrasado'
  | 'cancelamento_agendado' | 'assinatura_cancelada' | 'estorno'
  | 'evento_desconhecido'

export interface PrecoBilling {
  plano: PlanoTipo
  ciclo: BillingCycle
  moeda: MoedaBilling
  valorCentavos: number
  mercado: MercadoBilling
}

export interface ContextoCompraBilling {
  userId: string
  perfilId?: string
  plano: PlanoTipo
  ciclo: BillingCycle
  paisCobranca: string
  idioma: string // idioma nao altera a moeda
  moeda: MoedaBilling
  valorCentavos: number
  identificadorTentativa: string
}

export interface EventoNormalizadoBilling {
  provedor: ProvedorBilling
  idEvento: string
  tipo: TipoEventoBilling
  idAssinaturaExterna?: string
  idPagamentoExterno?: string
  instante?: string
  /** IDs externos, nunca credenciais ou dados pessoais. */
}

export interface ResultadoCheckoutBilling {
  provedor: ProvedorBilling
  checkoutUrl: string
  idCheckoutExterno: string
}

export interface GatewayBilling {
  readonly nome: ProvedorBilling
  criarCheckout(contexto: ContextoCompraBilling): Promise<ResultadoCheckoutBilling>
  verificarWebhook(payload: string, headers: Readonly<Record<string, string>>): Promise<boolean>
  normalizarEvento(payload: string): EventoNormalizadoBilling
}
