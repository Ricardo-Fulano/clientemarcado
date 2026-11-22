import type { PlanoGlobalPago, ProvedorGlobal } from './esquema'
/** Evidencias normalizadas APOS verificacao autentica da assinatura do webhook, fora deste modulo. */
export interface PagamentoConfirmadoGlobal {
  assinaturaInternaId: string
  entidadeId: string
  provedor: ProvedorGlobal
  eventoExternoId: string
  pagamentoExternoId: string
  assinaturaExternaId: string
  contaInternaId: string
  plano: PlanoGlobalPago
  ciclo: 'mensal' | 'anual'
  moeda: string
  valorCentavos: number
  confirmadoNoGateway: boolean
  assinaturaWebhookVerificada: boolean
}
export interface ContratoPendenteGlobal {
  assinaturaInternaId: string
  contaInternaId: string
  entidadeId: string
  provedor: ProvedorGlobal
  assinaturaExternaId: string
  plano: PlanoGlobalPago
  ciclo: 'mensal'|'anual'
  moeda: string
  valorCentavos: number
}
export type ParecerConciliacao = { tipo:'registrar_evidencia'; chave:string } | { tipo:'rejeitar'; motivo:string } | { tipo:'ja_processado'; chave:string }

/** NAO atualiza plano_tipo nem registra pagamento. Faz apenas avaliacao fail-closed. */
export function conferirPagamentoGlobal(pagamento: PagamentoConfirmadoGlobal, contrato: ContratoPendenteGlobal, chavesProcessadas: ReadonlySet<string>): ParecerConciliacao {
  if (!pagamento.assinaturaWebhookVerificada || !pagamento.confirmadoNoGateway) return {tipo:'rejeitar',motivo:'PAGAMENTO_OU_ASSINATURA_NAO_VERIFICADOS'}
  if (!pagamento.eventoExternoId || !pagamento.pagamentoExternoId) return {tipo:'rejeitar',motivo:'IDS_EXTERNOS_AUSENTES'}
  const chave = `v1:${pagamento.entidadeId}:${pagamento.provedor}:${pagamento.eventoExternoId}`
  if (chavesProcessadas.has(chave)) return {tipo:'ja_processado',chave}
  if (pagamento.assinaturaInternaId!==contrato.assinaturaInternaId || pagamento.contaInternaId!==contrato.contaInternaId || pagamento.entidadeId!==contrato.entidadeId || pagamento.provedor!==contrato.provedor || pagamento.assinaturaExternaId!==contrato.assinaturaExternaId) return {tipo:'rejeitar',motivo:'VINCULO_ASSINATURA_INVALIDO'}
  if (pagamento.plano!==contrato.plano || pagamento.ciclo!==contrato.ciclo || pagamento.moeda!==contrato.moeda || !Number.isSafeInteger(pagamento.valorCentavos) || pagamento.valorCentavos!==contrato.valorCentavos || pagamento.valorCentavos<=0) return {tipo:'rejeitar',motivo:'PLANO_CICLO_MOEDA_OU_VALOR_INCOMPATIVEIS'}
  return {tipo:'registrar_evidencia',chave}
}
