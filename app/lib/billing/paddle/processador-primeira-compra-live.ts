/**
 * Conciliação controlada da PRIMEIRA compra Paddle Live.
 * SEM endpoint, sem chaves, sem banco integrado, sem alterações em perfis/Asaas/comissões.
 * Usa os dados retornados por funções de acesso confiáveis do servidor, nunca dados do navegador.
 * Registro somente quando autorizacao.registrar === true; as chamadas reais permanecem por conectar.
 */
import { avaliarConciliacaoInicialLive, type TransacaoConciliacao, type AssinaturaConciliacao,
  type ReservaConciliacao, type EventoConciliacao, type EvidenciaConciliacao,
} from './conciliacao-inicial-live'

export type RegistroFinanceiro = 'staged'|'already_staged'
export interface PortasPrimeiraCompraLive {
  buscarEvento(eventId: string): Promise<(EventoConciliacao & { payloadTransactionId: string; payloadStatus: string }) | null>
  buscarReserva(transactionId: string): Promise<ReservaConciliacao | null>
  consultarTransacaoPaddle(transactionId: string): Promise<TransacaoConciliacao>
  consultarAssinaturaPaddle(subscriptionId: string): Promise<AssinaturaConciliacao>
  // Implementação real deve invocar APENAS billing_paddle_live_stage_initial_payment no banco confiável.
  registrarPagamentoValidado(evidencia: EvidenciaConciliacao): Promise<RegistroFinanceiro>
}
export type ResultadoProcessamentoLive =
  | { estado:'nao_habilitado' }
  | { estado:'pendente'; motivo:string }
  | { estado:'revisao_manual'; motivo:string }
  | { estado:'apto_sem_gravar'; evidencia:EvidenciaConciliacao }
  | { estado:'registrado'|'ja_registrado'; transacaoId:string }

const EVENTO = /^evt_[a-z0-9]{10,80}$/
const TX = /^txn_[a-z0-9]{26}$/
const SUB = /^sub_[a-z0-9]{26}$/

/**
 * O chamador precisa conferir conta/domínio aprovados, ambiente LIVE, acesso administrativo e backup,
 * ALÉM de conectar as portas de API/banco. Proibir uso via rota pública sem autenticação.
 * permitirConsulta: false -> nem mesmo a API Paddle é consultada.
 * permitirRegistro: false -> nem mesmo a função de staging é chamada.
 */
export async function processarPrimeiraCompraLive(
  input: {eventId:string;transactionId:string;permitirConsulta:boolean;permitirRegistro:boolean},
  portas:PortasPrimeiraCompraLive,
):Promise<ResultadoProcessamentoLive> {
  if (!input.permitirConsulta) return {estado:'nao_habilitado'}
  if (!EVENTO.test(input.eventId) || !TX.test(input.transactionId))
    return {estado:'revisao_manual',motivo:'IDENTIFICADORES_INVALIDOS'}

  // Apenas registros inseridos por webhook autenticado e persistidos no servidor.
  const evento = await portas.buscarEvento(input.eventId)
  if (!evento || evento.event_type !== 'transaction.completed' || !evento.signature_verified ||
      evento.transaction_id !== input.transactionId ||
      evento.payloadTransactionId !== input.transactionId || evento.payloadStatus !== 'completed')
    return {estado:'revisao_manual',motivo:'EVENTO_INBOX_INCOMPATIVEL'}

  // Toda verificação financeira é refeita no gateway; não confiar apenas no webhook.
  const reserva = await portas.buscarReserva(input.transactionId)
  if (!reserva) return {estado:'revisao_manual',motivo:'RESERVA_AUSENTE'}
  const transacao = await portas.consultarTransacaoPaddle(input.transactionId)
  if (!SUB.test(transacao.subscription_id || ''))
    return {estado:'pendente',motivo:'AGUARDANDO_ASSINATURA'}
  const assinatura = await portas.consultarAssinaturaPaddle(transacao.subscription_id!)
  const decisao = avaliarConciliacaoInicialLive({evento,transacao,assinatura,reserva})
  if (decisao.acao === 'aguardar') return {estado:'pendente',motivo:decisao.motivo}
  if (decisao.acao === 'revisao_manual') return {estado:'revisao_manual',motivo:decisao.motivo}
  if (!input.permitirRegistro) return {estado:'apto_sem_gravar',evidencia:decisao.evidencia}

  // A RPC de staging valida novamente a reserva, o evento e a elegibilidade, atomicamente.
  // NÃO ativa plano, NÃO credita comissão e NÃO altera a tabela de perfis.
  const registro = await portas.registrarPagamentoValidado(decisao.evidencia)
  if (registro !== 'staged' && registro !== 'already_staged') throw new Error('REGISTRO_INESPERADO')
  return {estado:registro === 'staged' ? 'registrado' : 'ja_registrado',transacaoId:decisao.evidencia.transactionId}
}
