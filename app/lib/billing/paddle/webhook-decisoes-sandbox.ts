/** Projeta somente uma decisao de conciliacao. NAO altera perfis, assinaturas ou comissoes. */
export type EstadoTentativa = 'reserved'|'sending'|'created'|'completed'|'failed'|'expired'
export type TentativaWebhook = {
  userId:string; attemptId:string; transactionId:string|null;
  status:EstadoTentativa; priceId:string; planCode:string; billingCycle:string
}
export type EventoPagamento = {eventId:string; eventType:string; transactionId:string;
  userId:string;attemptId:string; status:string;priceId:string|null}
export type DecisaoWebhook =
  | {acao:'ignorar';motivo:string}
  | {acao:'conciliar';transactionId:string;attemptId:string;eventId:string}
  | {acao:'revisao_manual';motivo:string}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TX=/^txn_[a-z0-9]{26}$/
const EVT=/^evt_[a-z0-9]{10,80}$/
const PRICE=/^pri_[a-z0-9]{10,80}$/
export function decidirWebhookSandbox(e:EventoPagamento,r:TentativaWebhook|null):DecisaoWebhook {
  if(!EVT.test(e.eventId)||!TX.test(e.transactionId)||!UUID.test(e.userId)||!UUID.test(e.attemptId)) return {acao:'revisao_manual',motivo:'IDENTIFICADORES_INVALIDOS'}
  // Apenas o evento financeiro confirmado e elegivel para CONCILIACAO (nao ativacao).
  if(e.eventType!=='transaction.completed' || e.status!=='completed') return {acao:'ignorar',motivo:'EVENTO_NAO_CONFIRMADO'}
  if(!r) return {acao:'revisao_manual',motivo:'RESERVA_NAO_ENCONTRADA'}
  if(r.userId!==e.userId||r.attemptId!==e.attemptId) return {acao:'revisao_manual',motivo:'TITULAR_DIVERGENTE'}
  if(!r.transactionId||r.transactionId!==e.transactionId) return {acao:'revisao_manual',motivo:'TRANSACAO_DIVERGENTE'}
  if(!e.priceId||!PRICE.test(e.priceId)||r.priceId!==e.priceId) return {acao:'revisao_manual',motivo:'PRECO_DIVERGENTE'}
  if(r.status==='completed') return {acao:'ignorar',motivo:'JA_CONCILIADA'}
  if(r.status!=='created') return {acao:'revisao_manual',motivo:'ESTADO_INCOMPATIVEL'}
  return {acao:'conciliar',transactionId:e.transactionId,attemptId:e.attemptId,eventId:e.eventId}
}
