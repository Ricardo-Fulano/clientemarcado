import {NextResponse} from 'next/server'
import {randomUUID} from 'crypto'
import {admin,authenticated,allowedEmail,ready,methods,priceBR,validCpfCnpj,attemptTable,getAttempt,save,asaas,identifier,minor,apiCycle,pixPayload,cardPayload,publicAttempt,canRetryCard,AsaasRequestError,type Attempt} from '../../../../lib/billing/asaas/recorrente'
import {parseCardAddress,completeCustomer} from '../../../../lib/billing/asaas/dados-cartao'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const out=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}})
export async function POST(req:Request){
 try{
  const db=admin();const user=await authenticated(req);if(!user)return out({error:'UNAUTHENTICATED'},401)
  if(!allowedEmail(user.email)||!await ready(db))return out({error:'ASAAS_NOT_READY'},503)
  const b=await req.json();if(!b||typeof b!=='object'||Array.isArray(b)||b.consent!==true||!['card','pix'].includes(b.method)||typeof b.plan!=='string'||typeof b.cycle!=='string')return out({error:'INVALID_REQUEST'},422)
  if(b.method==='card'&&!methods().card||b.method==='pix'&&!methods().pix)return out({error:'METHOD_NOT_ENABLED'},409)
  const price=priceBR(b.plan,b.cycle);if(!price||price.currency!=='BRL')return out({error:'PRICE_NOT_APPROVED'},422)
  const old=await getAttempt(db,user.id);if(old&&(old.plan_code!==b.plan||old.billing_cycle!==b.cycle||old.method!==b.method||old.amount_minor!==price.amountMinor))return out({error:'PREVIOUS_CHECKOUT_REQUIRES_REVIEW',attempt:publicAttempt(old)},409)
  if(old&&!canRetryCard(old))return out(publicAttempt(old))
  const name=typeof b.name==='string'?b.name.trim():'';const cpf=typeof b.cpf==='string'?b.cpf.replace(/\D/g,''):''
  const address=b.method==='card'?parseCardAddress(b.address):null
  if(name.length<3||name.length>150||!validCpfCnpj(cpf)||!user.email)return out({error:'INVALID_CUSTOMER'},422)
  if(b.method==='card'&&!address)return out({error:'INVALID_BILLING_ADDRESS'},422)
  let a:Attempt
  if(old){
   // Retomada somente após rejeição explícita do checkout, nunca por timeout.
   // Confere titularidade financeira e ausência de qualquer outro objeto antes de alterar o cliente.
   const customer=encodeURIComponent(old.customer_id!);
   const [c,payments,subscriptions]=await Promise.all([asaas('/customers/'+customer),asaas('/payments?customer='+customer+'&limit=1'),asaas('/subscriptions?customer='+customer+'&limit=1')]);
   if(c.id!==old.customer_id||c.externalReference!==old.contract_ref||c.deleted===true||String(c.cpfCnpj||'').replace(/\D/g,'')!==cpf||String(c.email||'').toLowerCase()!==user.email.toLowerCase()||![payments,subscriptions].every(x=>Array.isArray(x.data)&&x.data.length===0&&x.hasMore===false))return out({error:'PREVIOUS_CHECKOUT_REQUIRES_REVIEW',attempt:publicAttempt(old)},409)
   const {data:profile,error:pe}=await db.from('perfis').select('plano_tipo,status_acesso,primeiro_pagamento_confirmado,gateway,gateway_customer_id,gateway_subscription_id,mp_subscription_id,modalidade_acesso').eq('user_id',user.id).single();
   if(pe||!profile||profile.plano_tipo!=='free'||!['ativo','aguardando_pagamento'].includes(profile.status_acesso)||profile.primeiro_pagamento_confirmado||profile.gateway||profile.gateway_customer_id||profile.gateway_subscription_id||profile.mp_subscription_id||(profile.modalidade_acesso||'comercial')!=='comercial')return out({error:'BILLING_RESERVATION_DENIED'},409)
   // CAS: apenas a requisição vencedora pode prosseguir. A reserva global permanece aberta.
   a=await save(db,old,{status:'sending',card_retry_safe:false,consent_at:new Date().toISOString()})
  }else{
   const id=randomUUID();const contract_ref='mp_'+id.replace(/-/g,'')
   const {data,error}=await db.from(attemptTable).insert({attempt_id:id,contract_ref,user_id:user.id,plan_code:price.plan,billing_cycle:price.cycle,amount_minor:price.amountMinor,method:b.method,status:'sending'}).select('*').single()
   if(error||!data)return out({error:'BILLING_RESERVATION_DENIED'},409)
   a=data as Attempt
  }
  let checkoutSent=false;let stage='customer'
  try{
   const customerPayload={name,cpfCnpj:cpf,email:user.email,externalReference:a.contract_ref,...(address||{})}
   const c=old?await asaas('/customers/'+encodeURIComponent(a.customer_id!),{...address},'PUT'):await asaas('/customers',customerPayload)
   if(!identifier(c.id)||c.externalReference!==a.contract_ref||(old&&c.id!==old.customer_id))throw new Error('INVALID_CUSTOMER_RESPONSE')
   if(!old)a=await save(db,a,{customer_id:c.id})
   if(a.method==='card'){
    stage='customer_address';const verified=await asaas('/customers/'+encodeURIComponent(c.id));
    if(verified.id!==c.id||verified.externalReference!==a.contract_ref||verified.deleted===true)throw new Error('INVALID_CUSTOMER_RESPONSE')
    if(!completeCustomer(verified)){
     a=await save(db,a,{status:'review',card_retry_safe:true});return out({error:'BILLING_ADDRESS_INCOMPLETE',attempt:publicAttempt(a)},422)
    }
    stage='checkout';checkoutSent=true;const s=await asaas('/checkouts',cardPayload(a,c.id));if(!identifier(s.id))throw new Error('INVALID_CHECKOUT_RESPONSE')
    a=await save(db,a,{checkout_id:s.id,status:'created',card_retry_safe:false})
   }else{
    stage='pix_authorization';const p=await asaas('/pix/automatic/authorizations',pixPayload(a,c.id))
    if(!identifier(p.id)||p.customerId!==c.id||p.contractId!==a.contract_ref||p.frequency!==apiCycle(a.billing_cycle)||minor(p.value)!==a.amount_minor||p.paymentCreationMode!=='SUBSCRIPTION')throw new Error('INVALID_AUTHORIZATION_RESPONSE')
    a=await save(db,a,{authorization_id:p.id,authorization_status:p.status,conciliation_id:p.immediateQrCode?.conciliationIdentifier||null})
    if(typeof p.payload!=='string'||!p.payload||typeof p.encodedImage!=='string'||!p.encodedImage||!p.immediateQrCode?.expirationDate||!p.immediateQrCode?.conciliationIdentifier)throw new Error('INVALID_QR_RESPONSE')
    a=await save(db,a,{qr_payload:p.payload,qr_image:p.encodedImage,qr_expires:p.immediateQrCode.expirationDate,status:'created'})
   }
   return out(publicAttempt(a))
  }catch(e){
   const rejected=e instanceof AsaasRequestError&&e.httpStatus===400&&e.missingBillingFields.length>0;
   const retry=a.method==='card'&&!!a.customer_id&&!a.checkout_id&&(!checkoutSent||rejected);
   // Logs sanitizados: sem CPF, nome, endereço, telefone, token ou corpo do provedor.
   console.error('[ASAAS_CHECKOUT]',{attempt:a.attempt_id,stage,http:e instanceof AsaasRequestError?e.httpStatus:null,missing:e instanceof AsaasRequestError?e.missingBillingFields:[],retry});
   const updated=await save(db,a,{status:'review',card_retry_safe:retry}).catch(()=>null);
   return out({error:retry&&updated?'BILLING_ADDRESS_INCOMPLETE':'PREVIOUS_CHECKOUT_REQUIRES_REVIEW',...(updated?{attempt:publicAttempt(updated)}:{})},retry&&updated?422:202)
  }
 }catch{return out({error:'TEMPORARILY_UNAVAILABLE'},503)}
}
