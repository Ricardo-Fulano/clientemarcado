import { prepararTransacaoSandbox } from './transacao-rascunho'
import type { RespostaTransacao } from './transacoes-api-sandbox'
import type { StatusReserva, Reserva } from './reservas-sandbox'

export type PedidoSandbox = { userId:string;attemptId:string;plano:string;ciclo:string;statusAcesso:string }
export type ResultadoOrquestracao =
  | {estado:'criada';transactionId:string}
  | {estado:'pendente_conciliacao';motivo:string}
  | {estado:'ja_existente';status:StatusReserva;transactionId:string|null}

export type PortaReservas = {
 reservar(i:{userId:string;attemptId:string;plano:string;ciclo:string}):Promise<{status:StatusReserva;reused:boolean}>
 iniciarEnvio(i:{userId:string;attemptId:string}):Promise<boolean>
 confirmarCriacao(i:{userId:string;attemptId:string;transactionId:string}):Promise<void>
 buscar(userId:string,attemptId:string):Promise<Reserva|null>
}
export type CriarPaddle = (i:PedidoSandbox)=>Promise<RespostaTransacao>

/** Nao faz retry de POST nem libera plano. O operador deve reconciliar estado sending.
 * O banco precisa ser o MESMO que autentica o titular; nao aponta para o Supabase de testes.
 */
export async function orquestrarCriacaoSandbox(
 pedido:PedidoSandbox,
 repositorio:PortaReservas,
 criar:CriarPaddle,
):Promise<ResultadoOrquestracao> {
  // Validacao ANTES de qualquer escrita no banco; dados devem vir do perfil no servidor.
  prepararTransacaoSandbox({userId:pedido.userId,tentativaId:pedido.attemptId,
    plano:pedido.plano,ciclo:pedido.ciclo,statusAcesso:pedido.statusAcesso})
  const chave={userId:pedido.userId,attemptId:pedido.attemptId}
  const reserva=await repositorio.reservar({...chave,plano:pedido.plano,ciclo:pedido.ciclo})
  if(reserva.status !== 'reserved') {
    const atual=await repositorio.buscar(pedido.userId,pedido.attemptId)
    return {estado:'ja_existente',status:reserva.status,transactionId:atual?.paddle_transaction_id ?? null}
  }
  // A RPC e atomicamente test-and-set, logo so um concorrente pode enviar POST.
  const claim=await repositorio.iniciarEnvio(chave)
  if(!claim){
    const atual=await repositorio.buscar(pedido.userId,pedido.attemptId)
    return {estado:'ja_existente',status:atual?.status ?? 'sending',transactionId:atual?.paddle_transaction_id ?? null}
  }
  let criada:RespostaTransacao
  try { criada=await criar(pedido) } catch {
    // NUNCA soltar ou repetir: API pode ter criado a transacao apesar do erro.
    return {estado:'pendente_conciliacao',motivo:'POST_RESULTADO_INDETERMINADO'}
  }
  if(criada.userId!==pedido.userId || criada.attemptId!==pedido.attemptId || !/^txn_[a-z0-9]{26}$/.test(criada.id)){
    return {estado:'pendente_conciliacao',motivo:'TRANSACAO_DIVERGENTE'}
  }
  try { await repositorio.confirmarCriacao({...chave,transactionId:criada.id}) } catch {
    return {estado:'pendente_conciliacao',motivo:'PERSISTENCIA_APOS_POST_INDETERMINADA'}
  }
  return {estado:'criada',transactionId:criada.id}
}
