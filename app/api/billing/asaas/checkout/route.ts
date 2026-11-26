import {NextResponse} from 'next/server'
import {randomUUID} from 'crypto'
import {admin,authenticated,allowedEmail,ready,methods,priceBR,validCpfCnpj,attemptTable,getAttempt,save,asaas,identifier,minor,apiCycle,pixPayload,cardPayload,publicAttempt,canRetryCard,AsaasRequestError,type Attempt} from '../../../../lib/billing/asaas/recorrente'
import {reconcileExpiredStripeReservations} from '../../../../lib/billing/asaas/reservas-stripe'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const out=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}})
const safeReasons=['PROFILE_NOT_ELIGIBLE','BILLING_ALREADY_EXISTS','ASAAS_ATTEMPT_EXISTS','STRIPE_ATTEMPT_EXISTS']
function reservationReason(error:{message?:string;code?:string}|null){return safeReasons.includes(error?.message||'')?error!.message!:error?.code==='23505'?'RESERVATION_CONFLICT':'RESERVATION_DB_ERROR'}
export async function POST(req:Request){
 let stage='auth'; let trace:string=randomUUID();
 try{
  const db=admin();const user=await authenticated(req);if(!user)return out({error:'UNAUTHENTICATED'},401)
  if(!allowedEmail(user.email)||!await ready(db))return out({error:'ASAAS_NOT_READY'},503)
  const b=await req.json();if(!b||typeof b!=='object'||Array.isArray(b)||b.consent!==true||!['card','pix'].includes(b.method)||typeof b.plan!=='string'||typeof b.cycle!=='string')return out({error:'INVALID_REQUEST'},422)
  if(b.method==='card'&&!methods().card||b.method==='pix'&&!methods().pix)return out({error:'METHOD_NOT_ENABLED'},409)
  const price=priceBR(b.plan,b.cycle);if(!price||price.currency!=='BRL')return out({error:'PRICE_NOT_APPROVED'},422)
  stage='read_attempt'; const old=await getAttempt(db,user.id);if(old&&(old.plan_code!==b.plan||old.billing_cycle!==b.cycle||old.method!==b.method||old.amount_minor!==price.amountMinor))return out({error:'PREVIOUS_CHECKOUT_REQUIRES_REVIEW',attempt:publicAttempt(old)},409)
  if(old&&!canRetryCard(old))return out(publicAttempt(old))
  const name=typeof b.name==='string'?b.name.trim():'';const cpf=typeof b.cpf==='string'?b.cpf.replace(/\D/g,''):''
  if(b.method==='pix'&&(name.length<3||name.length>150||!validCpfCnpj(cpf)||!user.email))return out({error:'INVALID_CUSTOMER'},422)
  let a:Attempt
  if(old){
   if(!user.email)return out({error:'INVALID_CUSTOMER'},422)
   // Retomada somente após rejeição explícita do checkout, nunca por timeout.
   // Confere titularidade financeira e ausência de qualquer outro objeto antes de alterar o cliente.
   stage='verify_previous_customer'; const customer=encodeURIComponent(old.customer_id!);
   const [c,payments,subscriptions]=await Promise.all([asaas('/customers/'+customer),asaas('/payments?customer='+customer+'&limit=1'),asaas('/subscriptions?customer='+customer+'&limit=1')]);
   if(c.id!==old.customer_id||c.externalReference!==old.contract_ref||c.deleted===true||String(c.email||'').toLowerCase()!==user.email.toLowerCase())return out({error:'PREVIOUS_CUSTOMER_MISMATCH',attempt:publicAttempt(old)},409)
   if(![payments,subscriptions].every(x=>Array.isArray(x.data)&&x.data.length===0&&x.hasMore===false))return out({error:'PREVIOUS_CUSTOMER_FINANCIAL_LINK',attempt:publicAttempt(old)},409)
   stage='verify_profile';
   const {data:profile,error:pe}=await db.from('perfis').select('plano_tipo,status_acesso,primeiro_pagamento_confirmado,gateway,gateway_customer_id,gateway_subscription_id,mp_subscription_id,modalidade_acesso').eq('user_id',user.id).single();
   if(pe||!profile||profile.plano_tipo!=='free'||!['ativo','aguardando_pagamento'].includes(profile.status_acesso)||profile.primeiro_pagamento_confirmado||profile.gateway||profile.gateway_customer_id||profile.gateway_subscription_id||profile.mp_subscription_id||(profile.modalidade_acesso||'comercial')!=='comercial')return out({error:'PROFILE_NOT_ELIGIBLE',attempt:publicAttempt(old)},409)
   // CAS: apenas a requisição vencedora pode prosseguir. A reserva global permanece aberta.
   stage='claim_previous'; a=await save(db,old,{status:'sending',card_retry_safe:false,hosted_card:true,previous_customer_id:old.customer_id,customer_id:null,consent_at:new Date().toISOString()})
  }else{
   stage='reconcile_stripe'; const stripe=await reconcileExpiredStripeReservations(db,user.id)
   if(stripe!=='OK')return out({error:stripe,trace},stripe==='STRIPE_RESERVATION_PENDING'?409:503)
   stage='reserve'; const id=randomUUID();const contract_ref='mp_'+id.replace(/-/g,'')
   const {data,error}=await db.from(attemptTable).insert({attempt_id:id,contract_ref,user_id:user.id,plan_code:price.plan,billing_cycle:price.cycle,amount_minor:price.amountMinor,method:b.method,status:'sending',hosted_card:b.method==='card'}).select('*').single()
   if(error||!data){const reason=reservationReason(error);console.warn('[ASAAS_RESERVATION]',{trace,reason,sqlstate:error?.code||null});return out({error:reason,trace},409)}
   a=data as Attempt
  }
  stage='checkout';
  try{
   if(a.method==='card'){
    // The hosted page collects identity and billing address. No customer creation here.
    const c=await asaas('/checkouts',cardPayload(a));if(!identifier(c.id))throw new Error('INVALID_CHECKOUT_RESPONSE');
    try{a=await save(db,a,{checkout_id:c.id,status:'created',card_retry_safe:false})}catch(e){
     const fresh=await getAttempt(db,user.id);if(!fresh||fresh.attempt_id!==a.attempt_id||fresh.checkout_id!==c.id)throw e;a=fresh;
    }
   }else{
    stage='customer';const c=await asaas('/customers',{name,cpfCnpj:cpf,email:user.email,externalReference:a.contract_ref});
    if(!identifier(c.id)||c.externalReference!==a.contract_ref)throw new Error('INVALID_CUSTOMER_RESPONSE');
    a=await save(db,a,{customer_id:c.id});
    stage='pix_authorization';const p=await asaas('/pix/automatic/authorizations',pixPayload(a,c.id))
    if(!identifier(p.id)||p.customerId!==c.id||p.contractId!==a.contract_ref||p.frequency!==apiCycle(a.billing_cycle)||minor(p.value)!==a.amount_minor||p.paymentCreationMode!=='SUBSCRIPTION')throw new Error('INVALID_AUTHORIZATION_RESPONSE')
    a=await save(db,a,{authorization_id:p.id,authorization_status:p.status,conciliation_id:p.immediateQrCode?.conciliationIdentifier||null})
    if(typeof p.payload!=='string'||!p.payload||typeof p.encodedImage!=='string'||!p.encodedImage||!p.immediateQrCode?.expirationDate||!p.immediateQrCode?.conciliationIdentifier)throw new Error('INVALID_QR_RESPONSE')
    a=await save(db,a,{qr_payload:p.payload,qr_image:p.encodedImage,qr_expires:p.immediateQrCode.expirationDate,status:'created'})
   }
   return out(publicAttempt(a))
  }catch(e){
   // An uncertain provider response never authorizes another charge automatically.
   console.error('[ASAAS_CHECKOUT]',{attempt:a.attempt_id,stage,http:e instanceof AsaasRequestError?e.httpStatus:null});
   const updated=await save(db,a,{status:'review',card_retry_safe:false}).catch(()=>null);
   return out({error:'ASAAS_CHECKOUT_REVIEW',trace,...(updated?{attempt:publicAttempt(updated)}:{})},202)
  }
 }catch(e){console.error('[ASAAS_CHECKOUT_PREPARE]',{trace,stage,http:e instanceof AsaasRequestError?e.httpStatus:null});return out({error:'CHECKOUT_'+stage.toUpperCase()+'_UNAVAILABLE',trace},503)}
}
