import {NextResponse} from 'next/server'
import {randomUUID} from 'crypto'
import {admin,authenticated,allowedEmail,ready,methods,priceBR,validCpfCnpj,attemptTable,getAttempt,save,asaas,identifier,minor,apiCycle,pixPayload,cardPayload,publicAttempt,type Attempt} from '../../../../lib/billing/asaas/recorrente'
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
  const old=await getAttempt(db,user.id);if(old){if(old.plan_code!==b.plan||old.billing_cycle!==b.cycle||old.method!==b.method)return out({error:'PREVIOUS_CHECKOUT_REQUIRES_REVIEW',attempt:publicAttempt(old)},409);return out(publicAttempt(old))}
  const name=typeof b.name==='string'?b.name.trim():'';const cpf=typeof b.cpf==='string'?b.cpf.replace(/\D/g,''):''
  if(name.length<3||name.length>150||!validCpfCnpj(cpf)||!user.email)return out({error:'INVALID_CUSTOMER'},422)
  const id=randomUUID();const contract_ref='mp_'+id.replace(/-/g,'') // 35 chars; Pix contract limit
  // Atomic DB trigger serializes both providers. Only the successful INSERT may send to Asaas.
  const {data,error}=await db.from(attemptTable).insert({attempt_id:id,contract_ref,user_id:user.id,plan_code:price.plan,billing_cycle:price.cycle,amount_minor:price.amountMinor,method:b.method,status:'sending'}).select('*').single()
  if(error||!data)return out({error:'BILLING_RESERVATION_DENIED'},409)
  let a=data as Attempt
  try{
   // New dedicated customer, never reuse an unrelated CPF/email match. No retries after ambiguous network failure.
   const c=await asaas('/customers',{name,cpfCnpj:cpf,email:user.email,externalReference:contract_ref})
   if(!identifier(c.id)||c.externalReference!==contract_ref)throw new Error('INVALID_CUSTOMER_RESPONSE')
   a=await save(db,a,{customer_id:c.id})
   if(a.method==='card'){
    const s=await asaas('/checkouts',cardPayload(a,c.id));if(!identifier(s.id))throw new Error('INVALID_CHECKOUT_RESPONSE')
    a=await save(db,a,{checkout_id:s.id,status:'created'})
   }else{
    const p=await asaas('/pix/automatic/authorizations',pixPayload(a,c.id))
    if(!identifier(p.id)||p.customerId!==c.id||p.contractId!==a.contract_ref||p.frequency!==apiCycle(a.billing_cycle)||minor(p.value)!==a.amount_minor||p.paymentCreationMode!=='SUBSCRIPTION')throw new Error('INVALID_AUTHORIZATION_RESPONSE')
    // Persist the provider ID before checking display fields; an incomplete response must not release the reservation.
    a=await save(db,a,{authorization_id:p.id,authorization_status:p.status,conciliation_id:p.immediateQrCode?.conciliationIdentifier||null})
    if(typeof p.payload!=='string'||!p.payload||typeof p.encodedImage!=='string'||!p.encodedImage||!p.immediateQrCode?.expirationDate||!p.immediateQrCode?.conciliationIdentifier)throw new Error('INVALID_QR_RESPONSE')
    a=await save(db,a,{qr_payload:p.payload,qr_image:p.encodedImage,qr_expires:p.immediateQrCode.expirationDate,status:'created'})
   }
   return out(publicAttempt(a))
  }catch{await save(db,a,{status:'review'}).catch(()=>undefined);return out({error:'PREVIOUS_CHECKOUT_REQUIRES_REVIEW'},202)}
 }catch{return out({error:'TEMPORARILY_UNAVAILABLE'},503)}
}
