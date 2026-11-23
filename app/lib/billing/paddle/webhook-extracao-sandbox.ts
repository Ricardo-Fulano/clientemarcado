import type { EventoPagamento } from './webhook-decisoes-sandbox'
/** Extrai o minimo de um webhook cuja assinatura JA FOI validada. Nao autoriza pagamento. */
export function extrairEventoPagamentoSandbox(entrada:unknown):EventoPagamento {
 if(!entrada||typeof entrada!=='object'||Array.isArray(entrada)) throw new Error('EVENTO_INVALIDO')
 const evt=entrada as Record<string,unknown>
 const d=evt.data
 if(!d||typeof d!=='object'||Array.isArray(d)) throw new Error('DADOS_INVALIDOS')
 const data=d as Record<string,unknown>
 const c=data.custom_data
 if(!c||typeof c!=='object'||Array.isArray(c)) throw new Error('CORRELACAO_AUSENTE')
 const custom=c as Record<string,unknown>
 const items=data.items
 const primeira=Array.isArray(items)?items[0]:null
 const price=primeira&&typeof primeira==='object'?(primeira as Record<string,unknown>).price:null
 const priceObj=price&&typeof price==='object'?price as Record<string,unknown>:null
 return {
  eventId: typeof evt.event_id==='string'?evt.event_id:'',
  eventType: typeof evt.event_type==='string'?evt.event_type:'',
  transactionId: typeof data.id==='string'?data.id:'',
  userId: typeof custom.minipage_user_id==='string'?custom.minipage_user_id:'',
  attemptId: typeof custom.minipage_attempt_id==='string'?custom.minipage_attempt_id:'',
  status:typeof data.status==='string'?data.status:'',
  priceId:typeof priceObj?.id==='string'?priceObj.id:null,
 }
}
