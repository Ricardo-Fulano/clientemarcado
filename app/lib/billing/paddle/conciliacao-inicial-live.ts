/** Conciliação inicial Paddle LIVE, SEM efeitos colaterais.
 * Entradas tx/sub DEVEM ter sido consultadas na API oficial da Paddle Live pelo servidor.
 * Inbox DEVE ter Paddle-Signature verificada; reserva DEVE vir do Supabase service_role.
 * Nao ativa, renova, cancela, comissiona ou grava em tabela alguma.
 */
export type TransacaoConciliacao = {
  id: string; status: string; collection_mode: string; origin?: string;
  customer_id: string | null; subscription_id: string | null;
  custom_data: Record<string, unknown> | null;
  items: Array<{price: {id: string}; quantity: number}>;
}
export type AssinaturaConciliacao = {
  id: string; status: string; customer_id: string | null;
  items: Array<{price: {id: string}; quantity: number}>;
  current_billing_period: {starts_at: string; ends_at: string} | null;
}
export type ReservaConciliacao = {
  attempt_id: string; user_id: string; plan_code: string;
  billing_cycle: string; price_id: string;
  status: string; transaction_id: string | null;
}
export type EventoConciliacao = {
  event_id: string; event_type: string; signature_verified: boolean;
  transaction_id: string;
}
export type EvidenciaConciliacao = {
  eventId: string; transactionId: string; subscriptionId: string;
  customerId: string; userId: string; attemptId: string;
  planCode: string; billingCycle: string; priceId: string;
  periodEnd: string;
}
export type ResultadoConciliacao =
  | {acao: 'preparar_registro'; evidencia: EvidenciaConciliacao}
  | {acao: 'revisao_manual'; motivo: string}
  | {acao: 'aguardar'; motivo: string}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const id = (prefix: string, value: unknown): value is string => typeof value === 'string' && new RegExp(`^${prefix}_[a-z0-9]{26}$`).test(value)

export function avaliarConciliacaoInicialLive(input: {
  evento: EventoConciliacao;
  transacao: TransacaoConciliacao;
  assinatura: AssinaturaConciliacao | null;
  reserva: ReservaConciliacao | null;
  agora?: Date;
}): ResultadoConciliacao {
  const {evento: e, transacao: t, assinatura: s, reserva: r} = input
  if (!e.signature_verified || !id('evt', e.event_id) || e.event_type !== 'transaction.completed' ||
      !id('txn', e.transaction_id) || t.id !== e.transaction_id) {
    return {acao:'revisao_manual', motivo:'EVENTO_NAO_CONFIAVEL'}
  }
  if (t.status !== 'completed') return {acao:'aguardar', motivo:'TRANSACAO_NAO_CONCLUIDA'}
  if (t.collection_mode !== 'automatic' || t.origin !== 'api') {
    return {acao:'revisao_manual', motivo:'TRANSACAO_NAO_INICIAL'}
  }
  if (!id('ctm', t.customer_id) || !id('sub', t.subscription_id) || !s ||
      s.id !== t.subscription_id || s.customer_id !== t.customer_id) {
    return {acao:'revisao_manual', motivo:'ASSINATURA_OU_CLIENTE_DIVERGENTE'}
  }
  if (s.status !== 'active') return {acao:'aguardar', motivo:'ASSINATURA_NAO_ATIVA'}
  if (!r || r.status !== 'created' || r.transaction_id !== t.id ||
      !uuid.test(r.user_id) || !uuid.test(r.attempt_id)) {
    return {acao:'revisao_manual', motivo:'RESERVA_INVALIDA'}
  }
  if (t.custom_data?.minipage_user_id !== r.user_id ||
      t.custom_data?.minipage_attempt_id !== r.attempt_id) {
    return {acao:'revisao_manual', motivo:'TITULARIDADE_DIVERGENTE'}
  }
  if (t.items.length !== 1 || t.items[0].quantity !== 1 ||
      s.items.length !== 1 || s.items[0].quantity !== 1 ||
      !id('pri', r.price_id) || t.items[0].price.id !== r.price_id ||
      s.items[0].price.id !== r.price_id) {
    return {acao:'revisao_manual', motivo:'ITEM_OU_PRECO_DIVERGENTE'}
  }
  const period = s.current_billing_period
  const inicio = period ? Date.parse(period.starts_at) : NaN
  const fim = period ? Date.parse(period.ends_at) : NaN
  const agora = (input.agora ?? new Date()).getTime()
  if (!Number.isFinite(inicio) || !Number.isFinite(fim) || !Number.isFinite(agora) ||
      inicio >= fim || fim <= agora || inicio > agora + 86400000) {
    return {acao:'revisao_manual', motivo:'VIGENCIA_INVALIDA'}
  }
  if (!['minipage','agenda','loja','essencial','equipe'].includes(r.plan_code) ||
      !['mensal','anual'].includes(r.billing_cycle)) {
    return {acao:'revisao_manual', motivo:'PLANO_OU_CICLO_INVALIDO'}
  }
  return {acao:'preparar_registro', evidencia: {
    eventId:e.event_id, transactionId:t.id, subscriptionId:s.id,
    customerId:t.customer_id, userId:r.user_id, attemptId:r.attempt_id,
    planCode:r.plan_code, billingCycle:r.billing_cycle, priceId:r.price_id,
    periodEnd: new Date(fim).toISOString(),
  }}
}
