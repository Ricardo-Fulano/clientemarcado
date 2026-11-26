import type {SupabaseClient} from '@supabase/supabase-js'
import {asaas,apiCycle,subscriptionCycle,minor,identifier,attemptTable,save,cardPayload,type Attempt} from './recorrente'
import {registrarComissaoParceiro} from '../../asaas-webhook'
const eventTable='billing_asaas_recurring_events'
const paid=['CONFIRMED','RECEIVED']
const validDate=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00-03:00'))?v+'T00:00:00-03:00':null
const encoded=(v:string)=>encodeURIComponent(v)
async function by(db:SupabaseClient,column:string,value:unknown):Promise<Attempt|null>{if(!identifier(value))return null;const {data,error}=await db.from(attemptTable).select('*').eq(column,value).maybeSingle();if(error)throw new Error('ATTEMPT_LOOKUP');return data as Attempt|null}
// Only the authenticated provider webhook may supply checkout references; browser callbacks never reach here.
function callbackReference(e:any):string|null{
 try{const u=new URL(e?.checkout?.callback?.successUrl);const ref=u.searchParams.get('mp_ref');return u.origin==='https://minipage.pro'&&u.pathname==='/painel/contratar'&&!!ref&&/^mp_[0-9a-f]{32}$/.test(ref)?ref:null}catch{return null}
}
async function attemptFor(db:SupabaseClient,e:any){
 return await by(db,'authorization_id',e.authorization?.id||e.paymentInstruction?.authorization?.id)||await by(db,'checkout_id',e.checkout?.id||e.payment?.checkoutSession||e.subscription?.checkoutSession)||await by(db,'subscription_id',e.subscription?.id||e.payment?.subscription)||await by(db,'contract_ref',e.authorization?.contractId||e.checkout?.externalReference||callbackReference(e))||await by(db,'customer_id',e.payment?.customer||e.subscription?.customer||e.authorization?.customerId||e.checkout?.customer)
}
export function hostedCheckoutMatches(a:Attempt,c:any){
 if(!a.hosted_card||!identifier(c?.id)||a.checkout_id&&c.id!==a.checkout_id||c.externalReference&&c.externalReference!==a.contract_ref)return false;
 if(c.externalReference!==a.contract_ref&&c.callback?.successUrl!==cardPayload(a).callback.successUrl)return false;
 return c.subscription?.cycle===subscriptionCycle(a.billing_cycle)&&Array.isArray(c.chargeTypes)&&c.chargeTypes.length===1&&c.chargeTypes[0]==='RECURRENT'&&Array.isArray(c.items)&&c.items.length===1&&c.items[0].quantity===1&&minor(c.items[0].value)===a.amount_minor;
}
export function hostedPaymentMatches(a:Attempt,p:any,s:any){
 return a.hosted_card===true&&!!a.checkout_id&&identifier(p?.id)&&identifier(p.customer)&&identifier(p.subscription)&&p.deleted!==true&&p.checkoutSession===a.checkout_id&&p.billingType==='CREDIT_CARD'&&minor(p.value)===a.amount_minor&&s?.id===p.subscription&&s.customer===p.customer&&s.checkoutSession===a.checkout_id&&s.cycle===subscriptionCycle(a.billing_cycle)&&s.billingType==='CREDIT_CARD'&&minor(s.value)===a.amount_minor&&(!a.customer_id||a.customer_id===p.customer)&&(!a.subscription_id||a.subscription_id===s.id);
}
async function bindHostedPayment(db:SupabaseClient,a:Attempt,p:any){
 if(!identifier(p.subscription))throw new Error('HOSTED_SUBSCRIPTION_MISSING');
 const s=await asaas('/subscriptions/'+encoded(p.subscription));
 if(!hostedPaymentMatches(a,p,s))throw new Error('HOSTED_PAYMENT_MISMATCH');
 const c=await asaas('/customers/'+encoded(p.customer));if(c.id!==p.customer||c.deleted===true)throw new Error('HOSTED_CUSTOMER_MISMATCH');
 // A payer can enter their own billing identity on Asaas. Ownership comes from the server-reserved checkout, not email/CPF.
 // Refuse reuse of a customer already tied to a different profile/contract; never silently merge accounts.
 const [profiles,contracts]=await Promise.all([db.from('perfis').select('user_id').eq('gateway_customer_id',p.customer).limit(1),db.from('billing_subscriptions').select('id').eq('provider','asaas').eq('provider_customer_id',p.customer).neq('id',a.attempt_id).limit(1)]);
 if(profiles.error||contracts.error||profiles.data?.length||contracts.data?.length)throw new Error('HOSTED_CUSTOMER_ALREADY_LINKED');
 // Unique customer_id and CAS protect concurrent claims, including other Asaas attempts.
 try{return await save(db,a,{customer_id:p.customer})}catch(e){const fresh=await by(db,'attempt_id',a.attempt_id);if(!fresh||fresh.customer_id!==p.customer||fresh.checkout_id!==a.checkout_id||fresh.status==='closed')throw e;return fresh}
}
async function repairLinks(db:SupabaseClient,a:Attempt,event:any){
 if(a.hosted_card){
  if(!a.checkout_id&&event?.checkout){const c=event.checkout;if(!hostedCheckoutMatches(a,c))throw new Error('HOSTED_CHECKOUT_RECOVERY_MISMATCH');a=await save(db,a,{checkout_id:c.id,status:'created',card_retry_safe:false});}
  if(a.customer_id)await verifyCustomer(a);
  return a;
 }
 if(!a.customer_id){
  const list=await asaas('/customers?externalReference='+encoded(a.contract_ref)+'&limit=2');
  if(!Array.isArray(list.data)||list.hasMore!==false||list.data.length!==1||list.data[0].externalReference!==a.contract_ref||!identifier(list.data[0].id))throw new Error('CUSTOMER_RECOVERY_REVIEW');
  a=await save(db,a,{customer_id:list.data[0].id});
 }
 await verifyCustomer(a);
 if(a.method==='pix'&&!a.authorization_id){
  const list=await asaas('/pix/automatic/authorizations?customerId='+encoded(a.customer_id!)+'&limit=20');
  if(!Array.isArray(list.data)||list.hasMore!==false)throw new Error('AUTHORIZATION_RECOVERY_REVIEW');
  const candidates=list.data.filter((x:any)=>x.contractId===a.contract_ref);
  if(candidates.length!==1||!identifier(candidates[0].id))throw new Error('AUTHORIZATION_RECOVERY_REVIEW');
  const auth=await asaas('/pix/automatic/authorizations/'+encoded(candidates[0].id));
  if(auth.id!==candidates[0].id||auth.customerId!==a.customer_id||auth.contractId!==a.contract_ref||auth.frequency!==apiCycle(a.billing_cycle)||!auth.immediateQrCode?.conciliationIdentifier||(!['CANCELLED','REFUSED','EXPIRED'].includes(auth.status)&&(minor(auth.value)!==a.amount_minor||auth.paymentCreationMode!=='SUBSCRIPTION')))throw new Error('AUTHORIZATION_RECOVERY_MISMATCH');
  a=await save(db,a,{authorization_id:auth.id,authorization_status:auth.status,conciliation_id:auth.immediateQrCode.conciliationIdentifier,qr_payload:auth.payload||null,qr_image:auth.encodedImage||null,qr_expires:auth.immediateQrCode.expirationDate||null,status:'created'});
 }
 if(a.method==='card'&&!a.checkout_id&&event?.checkout){
  const c=event.checkout;
  // Webhook autenticado. A referencia externa pode nao vir no evento; o cliente dedicado e o contrato precisam coincidir.
  if(!identifier(c.id)||c.customer!==a.customer_id||c.externalReference&&c.externalReference!==a.contract_ref||c.subscription?.cycle!==subscriptionCycle(a.billing_cycle)||!Array.isArray(c.chargeTypes)||c.chargeTypes.length!==1||c.chargeTypes[0]!=='RECURRENT'||!Array.isArray(c.items)||c.items.length!==1||c.items[0].quantity!==1||minor(c.items[0].value)!==a.amount_minor)throw new Error('CHECKOUT_RECOVERY_MISMATCH');
  a=await save(db,a,{checkout_id:c.id,status:'created'});
 }
 return a;
}
async function verifyCustomer(a:Attempt){if(!a.customer_id)throw new Error('NO_CUSTOMER');const c=await asaas('/customers/'+encoded(a.customer_id));if(c.id!==a.customer_id||(!a.hosted_card&&c.externalReference!==a.contract_ref)||c.deleted===true)throw new Error('CUSTOMER_MISMATCH')}
export async function verifySubscription(a:Attempt,id:string){if(!identifier(id))throw new Error('INVALID_SUBSCRIPTION');const s=await asaas('/subscriptions/'+encoded(id));if(s.id!==id||s.customer!==a.customer_id||s.cycle!==subscriptionCycle(a.billing_cycle)||minor(s.value)!==a.amount_minor)throw new Error('SUBSCRIPTION_MISMATCH');return s}
export async function readAuthorization(a:Attempt){if(!a.authorization_id)throw new Error('NO_AUTHORIZATION');const auth=await asaas('/pix/automatic/authorizations/'+encoded(a.authorization_id));if(auth.id!==a.authorization_id||auth.customerId!==a.customer_id||auth.contractId!==a.contract_ref||auth.frequency!==apiCycle(a.billing_cycle)||(!['CANCELLED','EXPIRED','REFUSED'].includes(auth.status)&&(minor(auth.value)!==a.amount_minor||auth.paymentCreationMode!=='SUBSCRIPTION'))||auth.immediateQrCode?.conciliationIdentifier!==a.conciliation_id)throw new Error('AUTHORIZATION_MISMATCH');return auth}
async function sync(db:SupabaseClient,a:Attempt,subscription:string|null,authStatus:string|null,renewal:boolean){const {error}=await db.rpc('mp_asaas_sync_renewal_v1',{p_attempt:a.attempt_id,p_customer:a.customer_id,p_subscription:subscription,p_auth_status:authStatus,p_renewal:renewal});if(error)throw new Error('SYNC_FAILED')}
async function closeIfNoFinancialObject(db:SupabaseClient,a:Attempt){
 // A terminal provider event alone is not enough: require no payment or subscription at all for this dedicated customer.
 if(!a.customer_id||a.initial_payment_id||a.subscription_id)throw new Error('CLOSURE_REQUIRES_REVIEW')
 const [payments,subscriptions]=await Promise.all([asaas('/payments?customer='+encoded(a.customer_id)+'&limit=1'),asaas('/subscriptions?customer='+encoded(a.customer_id)+'&limit=1')]);
 if(!Array.isArray(payments.data)||!Array.isArray(subscriptions.data)||payments.data.length||subscriptions.data.length||payments.hasMore!==false||subscriptions.hasMore!==false)throw new Error('CLOSURE_REQUIRES_REVIEW')
 const {error}=await db.rpc('mp_asaas_close_unpaid_v1',{p_attempt:a.attempt_id});if(error)throw new Error('CLOSE_FAILED')
}
export async function verifyPayment(db:SupabaseClient,a:Attempt,id:string,eventType?:string){
 const fresh=await by(db,'attempt_id',a.attempt_id);if(!fresh||fresh.status==='closed')throw new Error('ATTEMPT_CHANGED');a=fresh;
 if(!identifier(id))throw new Error('INVALID_PAYMENT_ID')
 const p=await asaas('/payments/'+encoded(id));if(p.id!==id||p.deleted===true||minor(p.value)!==a.amount_minor)throw new Error('PAYMENT_MISMATCH');
 if(a.hosted_card&&!a.customer_id)a=await bindHostedPayment(db,a,p);
 if(p.customer!==a.customer_id)throw new Error('PAYMENT_MISMATCH')
 let subId:string|null=a.subscription_id,renewal=false,authStatus=a.authorization_status
 if(a.method==='card'){
  if(!a.checkout_id||!identifier(p.subscription)||p.billingType!=='CREDIT_CARD'||(a.subscription_id?p.subscription!==a.subscription_id:p.checkoutSession!==a.checkout_id))throw new Error('CARD_PAYMENT_NOT_LINKED')
  const s=await verifySubscription(a,p.subscription);if(s.billingType!=='CREDIT_CARD'||(!a.subscription_id&&s.checkoutSession!==a.checkout_id))throw new Error('CARD_SUBSCRIPTION_NOT_LINKED');subId=s.id;renewal=s.status==='ACTIVE'&&s.deleted!==true
 }else{
  if(p.billingType!=='PIX')throw new Error('PIX_PAYMENT_NOT_LINKED')
  const auth=await readAuthorization(a);authStatus=auth.status
  if(identifier(auth.subscriptionId)){
   if(subId&&subId!==auth.subscriptionId)throw new Error('PIX_SUBSCRIPTION_CHANGED')
   const s=await verifySubscription(a,auth.subscriptionId);subId=s.id;renewal=auth.status==='ACTIVE'&&s.status==='ACTIVE'&&s.deleted!==true
  }
  // Initial charge may not belong to the subscription yet. Match the provider's actual Pix transaction to the authorization QR.
  if(!a.initial_payment_id||p.id===a.initial_payment_id){
   if(!identifier(p.pixTransaction)||!a.conciliation_id)throw new Error('PIX_INITIAL_TRANSACTION_MISSING')
   const t=await asaas('/pix/transactions/'+encoded(p.pixTransaction));if(t.id!==p.pixTransaction||t.payment!==p.id||t.conciliationIdentifier!==a.conciliation_id&&t.qrCode?.conciliationIdentifier!==a.conciliation_id||minor(t.value)!==a.amount_minor||t.type!=='CREDIT'||(paid.includes(p.status)&&t.status!=='DONE'))throw new Error('PIX_INITIAL_TRANSACTION_MISMATCH')
  }else if(!subId||p.subscription!==subId)throw new Error('PIX_RENEWAL_NOT_LINKED')
 }
 const due=validDate(p.dueDate);if(!due)throw new Error('PAYMENT_DUE_MISSING')
 // Estornos parciais podem coexistir com status de pagamento confirmado. Consulte o historico real.
 if(eventType==='PAYMENT_PARTIALLY_REFUNDED'||eventType==='PAYMENT_REFUND_IN_PROGRESS'||Array.isArray(p.refunds)&&p.refunds.length>0){
  const refunds=await asaas('/payments/'+encoded(p.id)+'/refunds');
  const list=Array.isArray(refunds)?refunds:Array.isArray(refunds.data)&&refunds.hasMore===false?refunds.data:null;
  if(!list)throw new Error('REFUND_LIST_REQUIRES_REVIEW');
  const done=list.filter((r:any)=>r.status==='DONE');
  if(done.some((r:any)=>minor(r.value)<=0))throw new Error('REFUND_VALUE_INVALID');
  const refunded=done.reduce((sum:number,r:any)=>sum+minor(r.value),0);
  if(refunded>a.amount_minor)throw new Error('REFUND_VALUE_MISMATCH');
  if(refunded>0||eventType==='PAYMENT_REFUND_IN_PROGRESS'){
   const reason=refunded===a.amount_minor?'refunded':refunded>0?'partial_refund':'refund_pending';
   const {error}=await db.rpc('mp_asaas_commission_adverse_v2',{p_attempt:a.attempt_id,p_payment:p.id,p_reason:reason});if(error)throw new Error('REFUND_REVIEW_FAILED');
   if(reason!=='refunded'||p.status!=='REFUNDED')return;
  }else if(eventType==='PAYMENT_PARTIALLY_REFUNDED')throw new Error('REFUND_NOT_YET_VERIFIED');
 }

 if(!paid.includes(p.status)){
  if(['OVERDUE','REFUNDED','CHARGEBACK_REQUESTED','CHARGEBACK_DISPUTE','AWAITING_CHARGEBACK_REVERSAL'].includes(p.status)){
   const status=p.status==='OVERDUE'?'overdue':p.status==='REFUNDED'?'refunded':'chargeback'
   const {error}=await db.rpc('mp_asaas_apply_adverse_v1',{p_attempt:a.attempt_id,p_payment:p.id,p_status:status,p_due:due});if(error)throw new Error('ADVERSE_PAYMENT_REVIEW')
  }
  return
 }
 const payDate=validDate(p.paymentDate)||validDate(p.confirmedDate)||validDate(p.clientPaymentDate);if(!payDate)throw new Error('PAYMENT_DATE_MISSING')
 const {data:registered,error:regError}=await db.from('billing_payments').select('subscription_id,status,amount_minor').eq('provider','asaas').eq('provider_payment_id',p.id).maybeSingle();if(regError)throw new Error('PAYMENT_LEDGER_READ');
 if(registered&&(registered.subscription_id!==a.attempt_id||Number(registered.amount_minor)!==a.amount_minor))throw new Error('PAYMENT_LEDGER_MISMATCH');
 if(a.initial_payment_id&&p.id!==a.initial_payment_id&&!registered&&subId){const overdue=await asaas('/payments?subscription='+encoded(subId)+'&status=OVERDUE&limit=1');if(!Array.isArray(overdue.data)||overdue.hasMore!==false||overdue.data.length)throw new Error('OTHER_OVERDUE_PAYMENT_REQUIRES_REVIEW')}
 const {error}=await db.rpc('mp_asaas_apply_payment_v1',{p_attempt:a.attempt_id,p_payment:p.id,p_customer:a.customer_id,p_subscription:subId,p_paid:payDate,p_due:due,p_status:p.status==='RECEIVED'?'settled':'confirmed',p_renewal:renewal});if(error)throw new Error('PAYMENT_APPLY_FAILED')
 if(a.method==='pix')await sync(db,a,subId,authStatus,renewal)
 // Existing commission RPC owns attribution, percentage, 12-month window and deduplication.
 // Strict mode retries transient failures instead of acknowledging a lost commission.
 await registrarComissaoParceiro(db,{userId:a.user_id,planoTipo:a.plan_code,payment:{...p,paymentDate:p.paymentDate||p.confirmedDate||p.clientPaymentDate},cicloCobranca:a.billing_cycle,strict:true})
}
export async function processRecurringEvent(db:SupabaseClient,event:any):Promise<{status:number;body:Record<string,unknown>}|null>{
 if(process.env.MP_ASAAS_RECURRING_SCHEMA_ENABLED!=='true')return null
 let a=await attemptFor(db,event);if(!a)return null
 const id=event?.id,type=event?.event;if(typeof id!=='string'||!id||id.length>200||typeof type!=='string'||type.length>100)return {status:400,body:{error:'INVALID_EVENT'}}
 const {error:insert}=await db.from(eventTable).upsert({event_id:id,attempt_id:a.attempt_id,event_type:type,payment_id:event.payment?.id||null},{onConflict:'event_id',ignoreDuplicates:true});if(insert)return {status:503,body:{error:'INBOX_FAILED'}}
 const {data:existing,error:read}=await db.from(eventTable).select('status,attempt_id,event_type').eq('event_id',id).single();if(read||!existing||existing.attempt_id!==a.attempt_id||existing.event_type!==type)return {status:503,body:{error:'INBOX_MISMATCH'}}
 if(existing.status==='processed')return {status:200,body:{ok:true,duplicate:true}}
 try{
  if(a.status==='closed'){
   // A late paid event on a closed attempt is never silently ignored.
   if(['PAYMENT_CONFIRMED','PAYMENT_RECEIVED','CHECKOUT_PAID'].includes(type))throw new Error('LATE_PAYMENT_ON_CLOSED_ATTEMPT')
  }else{
   a=await repairLinks(db,a,event)
   if(type.startsWith('PIX_AUTOMATIC_RECURRING_AUTHORIZATION_')){
    const auth=await readAuthorization(a);let sub=a.subscription_id;let renewal=false
    if(identifier(auth.subscriptionId)){if(sub&&sub!==auth.subscriptionId)throw new Error('SUBSCRIPTION_MISMATCH');const s=await verifySubscription(a,auth.subscriptionId);sub=s.id;renewal=auth.status==='ACTIVE'&&s.status==='ACTIVE'&&s.deleted!==true}
    if(auth.status==='ACTIVE'&&!sub)throw new Error('SUBSCRIPTION_PENDING')
    await sync(db,a,sub,auth.status,renewal)
    if(['CANCELLED','EXPIRED','REFUSED'].includes(auth.status)&&!a.initial_payment_id&&!sub){
     // Refused can happen AFTER payment. Reconcile every candidate; never create a second authorization on timeout.
     const list=await asaas('/payments?customer='+encoded(a.customer_id!)+'&limit=20');if(!Array.isArray(list.data)||list.hasMore!==false)throw new Error('PAYMENT_LIST_INCOMPLETE');
     for(const p of list.data)if(paid.includes(p.status))await verifyPayment(db,a,p.id)
     if(list.data.length===0)await closeIfNoFinancialObject(db,a)
    }
   }else if(type==='CHECKOUT_PAID'){
    if(a.method!=='card'||!a.checkout_id||event.checkout?.id!==a.checkout_id)throw new Error('CHECKOUT_MISMATCH')
    const list=await asaas('/payments?checkoutSession='+encoded(a.checkout_id)+'&limit=20');if(!Array.isArray(list.data)||list.hasMore!==false||!list.data.some((p:any)=>paid.includes(p.status)))throw new Error('PAYMENT_NOT_YET_AVAILABLE')
    for(const p of list.data)if(paid.includes(p.status))await verifyPayment(db,a,p.id)
   }else if(type==='CHECKOUT_CANCELED'||type==='CHECKOUT_EXPIRED'){
    if(a.method!=='card'||event.checkout?.id!==a.checkout_id||(!a.hosted_card&&event.checkout?.customer!==a.customer_id))throw new Error('CHECKOUT_MISMATCH')
    if(a.hosted_card&&!a.customer_id){
     if(a.initial_payment_id||a.subscription_id||!['CANCELED','CANCELLED','EXPIRED'].includes(event.checkout?.status))throw new Error('HOSTED_CLOSURE_REVIEW');
     const list=await asaas('/payments?checkoutSession='+encoded(a.checkout_id!)+'&limit=1');
     if(!Array.isArray(list.data)||list.hasMore!==false||list.data.length!==0)throw new Error('HOSTED_CLOSURE_REVIEW');
     const {data,error}=await db.rpc('mp_asaas_close_hosted_unpaid_v6',{p_attempt:a.attempt_id,p_checkout:a.checkout_id,p_updated_at:a.updated_at});if(error||data!==true)throw new Error('HOSTED_CLOSE_FAILED');
    }else await closeIfNoFinancialObject(db,a)
   }else if(type.startsWith('PAYMENT_')&&['PAYMENT_CONFIRMED','PAYMENT_RECEIVED','PAYMENT_OVERDUE','PAYMENT_REFUNDED','PAYMENT_PARTIALLY_REFUNDED','PAYMENT_REFUND_IN_PROGRESS','PAYMENT_REFUND_DENIED','PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_CHARGEBACK_DISPUTE','PAYMENT_AWAITING_CHARGEBACK_REVERSAL'].includes(type)){
    await verifyPayment(db,a,event.payment?.id,type)
   }else if(type.startsWith('SUBSCRIPTION_')&&a.subscription_id){
    if(event.subscription?.id!==a.subscription_id)throw new Error('SUBSCRIPTION_MISMATCH')
    const s=await verifySubscription(a,a.subscription_id);const auth=a.method==='pix'?await readAuthorization(a):null
    await sync(db,a,a.subscription_id,auth?.status||null,s.status==='ACTIVE'&&s.deleted!==true&&(a.method==='card'||auth?.status==='ACTIVE'))
   }
  }
  const {error}=await db.from(eventTable).update({status:'processed',updated_at:new Date().toISOString()}).eq('event_id',id);if(error)throw new Error('INBOX_FINALIZE')
  return {status:200,body:{ok:true,recurring:true}}
 }catch(err){console.error('[ASAAS_RECURRING]',id,err instanceof Error?err.message:'UNKNOWN');await db.from(eventTable).update({status:'review',updated_at:new Date().toISOString()}).eq('event_id',id).neq('status','processed');return {status:503,body:{error:'RECURRING_REQUIRES_RECONCILIATION'}}}
}

export async function reconcileExistingAttempt(db:SupabaseClient,a:Attempt){
 if(a.status==='closed')return;
 a=await repairLinks(db,a,null);
 if(a.method==='card'&&!a.checkout_id)throw new Error('CHECKOUT_RECOVERY_REQUIRES_WEBHOOK');
 let auth:any=null;
 if(a.method==='pix'){
  auth=await readAuthorization(a);let sub=a.subscription_id;let renewal=false;
  if(identifier(auth.subscriptionId)){if(sub&&sub!==auth.subscriptionId)throw new Error('SUBSCRIPTION_MISMATCH');const s=await verifySubscription(a,auth.subscriptionId);sub=s.id;renewal=auth.status==='ACTIVE'&&s.status==='ACTIVE'&&s.deleted!==true}
  await sync(db,a,sub,auth.status,renewal);
 }
 if(a.method==='card'&&a.subscription_id){const s=await verifySubscription(a,a.subscription_id);await sync(db,a,a.subscription_id,null,s.status==='ACTIVE'&&s.deleted!==true)}
 const filter=a.hosted_card?(a.subscription_id?'subscription='+encoded(a.subscription_id):'checkoutSession='+encoded(a.checkout_id!)):'customer='+encoded(a.customer_id!);
 const list=await asaas('/payments?'+filter+'&limit=100');
 if(!Array.isArray(list.data)||list.hasMore!==false)throw new Error('PAYMENT_LIST_INCOMPLETE');
 const {data:ledger,error:ledgerError}=await db.from('billing_payments').select('provider_payment_id,status').eq('subscription_id',a.attempt_id).eq('provider','asaas');if(ledgerError)throw new Error('PAYMENT_LEDGER_READ');
 const local=new Map((ledger||[]).map(x=>[x.provider_payment_id,x.status]));
 const {data:reviews,error:re}=await db.from(eventTable).select('payment_id').eq('attempt_id',a.attempt_id).in('status',['review','received']).limit(100);if(re)throw new Error('INBOX_READ');
 const retry=new Set((reviews||[]).map(x=>x.payment_id));
 const candidates=list.data.filter((x:any)=> (paid.includes(x.status)&&(!local.has(x.id)||local.get(x.id)!==(x.status==='RECEIVED'?'settled':'confirmed')||retry.has(x.id))) || ['OVERDUE','REFUNDED','CHARGEBACK_REQUESTED','CHARGEBACK_DISPUTE','AWAITING_CHARGEBACK_REVERSAL'].includes(x.status));
 // Process the earliest paid period before later ones. No provider mutations here.
 candidates.sort((x:any,y:any)=>String(x.dueDate).localeCompare(String(y.dueDate)));
 if(candidates.length>4)throw new Error('RECONCILIATION_BATCH_REVIEW');
 for(const payment of candidates)await verifyPayment(db,a,payment.id);
 if(auth&&['CANCELLED','EXPIRED','REFUSED'].includes(auth.status)&&list.data.length===0&&!a.initial_payment_id&&!auth.subscriptionId)await closeIfNoFinancialObject(db,a);
}
