import { decidirWebhookSandbox, type DecisaoWebhook, type EventoPagamento, type TentativaWebhook } from './webhook-decisoes-sandbox'
export type BuscarTentativaWebhook = (userId:string,attemptId:string)=>Promise<TentativaWebhook|null>
/** Somente leitura e decisao. Nunca grava estado financeiro ou concede acesso. */
export async function avaliarConciliacaoSandbox(e:EventoPagamento,buscar:BuscarTentativaWebhook):Promise<DecisaoWebhook>{
 // Nao busque informacao privilegiada se o evento nao tiver identificadores bem formados.
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(e.userId)||!e.attemptId) return {acao:'revisao_manual',motivo:'IDENTIFICADORES_INVALIDOS'}
 const reserva=await buscar(e.userId,e.attemptId)
 return decidirWebhookSandbox(e,reserva)
}
