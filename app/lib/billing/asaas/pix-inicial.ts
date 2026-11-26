import {asaas,AsaasRequestError,identifier,minor,type Attempt} from './recorrente'
const esc=encodeURIComponent
const complete=(r:any)=>Array.isArray(r?.data)&&r.hasMore===false
const paid=(p:any)=>['CONFIRMED','RECEIVED'].includes(p?.status)
const day=(s:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s))
// Dedicated customer created for this attempt, never reused by the Pix checkout.
// Only use this alternative when the transaction API explicitly forbids access.
// Independent provider reads prove one authorization, one initial charge, and its recurring contract.
export async function verifyInitialPix(a:Attempt,p:any,auth:any,request:typeof asaas=asaas){
 if(!identifier(p?.id)||p.customer!==a.customer_id||p.billingType!=='PIX'||minor(p.value)!==a.amount_minor||p.deleted===true||!identifier(p.pixTransaction)||!a.conciliation_id)throw Error('PIX_INITIAL_TRANSACTION_MISSING');
 if(a.initial_payment_id===p.id)return; // immutable ID previously validated and uniquely persisted; payment/customer re-read above
 if(a.initial_payment_id)throw Error('PIX_INITIAL_ALREADY_BOUND');
 let t:any;
 try{t=await request('/pix/transactions/'+esc(p.pixTransaction))}catch(e){
  if(!(e instanceof AsaasRequestError)||e.httpStatus!==403)throw e;
  // Exact provider end-to-end lookup, if permitted. Never override a returned mismatch.
  if(identifier(auth.endToEndIdentifier)){
   try{const r=await request('/pix/transactions?endToEndIdentifier='+esc(auth.endToEndIdentifier)+'&type=CREDIT&limit=2');if(!complete(r)||r.data.length!==1)throw Error('PIX_E2E_AMBIGUOUS');t=r.data[0];}
   catch(x){if(!(x instanceof AsaasRequestError)||x.httpStatus!==403)throw x;}
  }
  if(!t){
   if(!paid(p)||auth.status!=='ACTIVE'||auth.id!==a.authorization_id||auth.customerId!==a.customer_id||auth.contractId!==a.contract_ref||auth.paymentCreationMode!=='SUBSCRIPTION'||minor(auth.value)!==a.amount_minor||auth.immediateQrCode?.conciliationIdentifier!==a.conciliation_id||!identifier(auth.subscriptionId)||a.subscription_id&&auth.subscriptionId!==a.subscription_id||!a.customer_id||a.hosted_card||a.previous_customer_id||p.subscription||p.paymentLink||p.installment||p.pixAutomaticAuthorizationId&&p.pixAutomaticAuthorizationId!==auth.id||p.externalReference&&p.externalReference!==a.contract_ref)throw Error('PIX_DEDICATED_PROOF_REQUIRED');
   const start=day(a.created_at),end=String(a.qr_expires||auth.immediateQrCode.expirationDate||'').slice(0,10);
   const within=(v:any)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}/.test(v)&&v.slice(0,10)>=start&&v.slice(0,10)<=end;
   if(!within(p.dateCreated)||!within(p.dueDate)||!within(p.paymentDate||p.clientPaymentDate||p.confirmedDate))throw Error('PIX_INITIAL_DATE_MISMATCH');
   const [c,authorizations,payments,subscriptions]=await Promise.all([request('/customers/'+esc(a.customer_id)),request('/pix/automatic/authorizations?customerId='+esc(a.customer_id)+'&limit=2'),request('/payments?customer='+esc(a.customer_id)+'&limit=100'),request('/subscriptions?customer='+esc(a.customer_id)+'&limit=2')]);
   if(c.id!==a.customer_id||c.externalReference!==a.contract_ref||c.deleted===true||!complete(authorizations)||authorizations.data.length!==1||authorizations.data[0].id!==auth.id||!complete(subscriptions)||subscriptions.data.length!==1||subscriptions.data[0].id!==auth.subscriptionId||subscriptions.data[0].customer!==a.customer_id||subscriptions.data[0].billingType!=='PIX'||minor(subscriptions.data[0].value)!==a.amount_minor||!complete(payments))throw Error('PIX_DEDICATED_CUSTOMER_AMBIGUOUS');
   const initial=payments.data.filter((x:any)=>!x.subscription);
   if(initial.length!==1||initial[0].id!==p.id||initial[0].pixTransaction!==p.pixTransaction||!paid(initial[0])||minor(initial[0].value)!==a.amount_minor||payments.data.some((x:any)=>x.customer!==a.customer_id||x.deleted===true||x.billingType!=='PIX'||minor(x.value)!==a.amount_minor||(x.id!==p.id&&(x.subscription!==auth.subscriptionId||String(x.dueDate)<=String(p.dueDate)))))throw Error('PIX_DEDICATED_PAYMENT_AMBIGUOUS');
   console.info('[ASAAS_PIX_INITIAL] dedicated_customer_verified',a.attempt_id);return;
  }
 }
 if(!t||t.id!==p.pixTransaction||t.payment!==p.id||(t.conciliationIdentifier!==a.conciliation_id&&t.qrCode?.conciliationIdentifier!==a.conciliation_id)||minor(t.value)!==a.amount_minor||t.type!=='CREDIT'||(paid(p)&&t.status!=='DONE'))throw Error('PIX_INITIAL_TRANSACTION_MISMATCH');
}
