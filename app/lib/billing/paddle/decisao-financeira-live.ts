import { identificarPrecoPaddleLive, type PlanoPaddleLive, type CicloPaddleLive } from './catalogo-live'

/** Camada pura de triagem: NÃO lê/grava banco, NÃO concede acesso e NÃO cria comissão.
 * Chamar SOMENTE após verificar Paddle-Signature, consultar transação na API Paddle LIVE
 * e recuperar reserva + titularidade de fonte confiável no banco.
 * Eventos de renovação sem attemptId seguem outra conciliação, não são ativados aqui.
 */
export type EvidenciaTransacaoLive = {
  origem: 'api-paddle-live'; id: string; status: string; collectionMode: string
  customerId: string | null; subscriptionId: string | null
  priceIds: string[]; userId: string | null; attemptId: string | null
}
export type ReservaConfiavelLive = {
  userId: string; attemptId: string; transactionId: string
  priceId: string; planCode: string; billingCycle: string
  status: 'reserved' | 'sending' | 'created' | 'completed' | 'failed' | 'expired'
}
export type DecisaoFinanceiraLive =
  | { acao: 'elegivel_conciliacao'; transactionId: string; subscriptionId: string; plano: PlanoPaddleLive; ciclo: CicloPaddleLive }
  | { acao: 'ignorar'; motivo: string }
  | { acao: 'revisao_manual'; motivo: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TX = /^txn_[a-z0-9]{26}$/
const SUB = /^sub_[a-z0-9]{26}$/
const CTM = /^ctm_[a-z0-9]{26}$/

export function decidirConciliacaoInicialPaddleLive(
  t: EvidenciaTransacaoLive,
  r: ReservaConfiavelLive | null,
): DecisaoFinanceiraLive {
  if (t.origem !== 'api-paddle-live') return { acao: 'revisao_manual', motivo: 'FONTE_NAO_CONFIAVEL' }
  if (!TX.test(t.id)) return { acao: 'revisao_manual', motivo: 'TRANSACAO_INVALIDA' }
  if (t.status !== 'completed') return { acao: 'ignorar', motivo: 'PAGAMENTO_NAO_COMPLETO' }
  if (t.collectionMode !== 'automatic') return { acao: 'revisao_manual', motivo: 'COBRANCA_NAO_AUTOMATICA' }
  if (!t.subscriptionId || !SUB.test(t.subscriptionId)) return { acao: 'revisao_manual', motivo: 'ASSINATURA_NAO_VINCULADA' }
  if (!t.customerId || !CTM.test(t.customerId)) return { acao: 'revisao_manual', motivo: 'CLIENTE_PADDLE_INVALIDO' }
  if (!t.userId || !UUID.test(t.userId) || !t.attemptId || !UUID.test(t.attemptId)) {
    return { acao: 'revisao_manual', motivo: 'CORRELACAO_AUSENTE_OU_INVALIDA' }
  }
  if (!r) return { acao: 'revisao_manual', motivo: 'RESERVA_NAO_ENCONTRADA' }
  if (r.status === 'completed') return { acao: 'ignorar', motivo: 'JA_CONCILIADA' }
  if (r.status !== 'created') return { acao: 'revisao_manual', motivo: 'RESERVA_ESTADO_INCOMPATIVEL' }
  if (t.id !== r.transactionId || t.userId !== r.userId || t.attemptId !== r.attemptId) {
    return { acao: 'revisao_manual', motivo: 'TITULARIDADE_OU_TRANSACAO_DIVERGENTE' }
  }
  // Apenas um item: nunca liberar plano a partir de cesta mista ou ID não cadastrado.
  if (t.priceIds.length !== 1 || t.priceIds[0] !== r.priceId) {
    return { acao: 'revisao_manual', motivo: 'PRECO_OU_ITENS_DIVERGENTES' }
  }
  const preco = identificarPrecoPaddleLive(t.priceIds[0])
  if (!preco || preco.plano !== r.planCode || preco.ciclo !== r.billingCycle) {
    return { acao: 'revisao_manual', motivo: 'PLANO_CICLO_DIVERGENTE' }
  }
  return { acao: 'elegivel_conciliacao', transactionId: t.id,
    subscriptionId: t.subscriptionId, plano: preco.plano, ciclo: preco.ciclo }
}
