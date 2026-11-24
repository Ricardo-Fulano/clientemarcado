import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { approvedPriceForExisting } from '../../../../lib/billing/stripe/live-catalog'

export const runtime='nodejs'
export const dynamic='force-dynamic'
const response=(body:Record<string,unknown>,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})
type StripeObject=Record<string,unknown>
const obj=(value:unknown):StripeObject|null=>value!==null&&typeof value==='object'&&!Array.isArray(value)?value as StripeObject:null
const str=(value:unknown)=>typeof value==='string'?value:''
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i
const eventId=/^evt_[A-Za-z0-9]+$/
const noStore={cache:'no-store' as const}

/** Conciliacao de EVIDENCIAS, sem conceder Premium ou alterar tabelas financeiras.
 * Eventos nunca sao aceitos do cliente: o eventId precisa estar na inbox autenticada pelo webhook
 * e o evento e consultado novamente na API Stripe Live antes de ser usado.
 */
export async function POST(req:NextRequest){
 if(process.env.VERCEL_ENV!=='production'||process.env.MP_STRIPE_RECONCILE_READINESS_ENABLED!=='true')return response({error:'RECONCILE_DISABLED'},503)
 const secret=process.env.MP_STRIPE_RECONCILE_SECRET
 const provided=req.headers.get('authorization')
 if(!secret||secret.length<32||provided!==`Bearer ${secret}`)return response({error:'UNAUTHORIZED'},401)
 const key=process.env.STRIPE_LIVE_SECRET_KEY
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL
 const role=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!(/^(?:sk|rk)_live_/.test(key||''))||!url||!role)return response({error:'CONFIG_MISSING'},503)
 let input:unknown
 try{input=await req.json()}catch{return response({error:'INVALID_JSON'},400)}
 const b=obj(input)
 const id=str(b?.eventId)
 if(!b||Object.keys(b).length!==1||!eventId.test(id))return response({error:'INVALID_EVENT_ID'},422)
 const admin=createClient(url,role,{auth:{autoRefreshToken:false,persistSession:false}})
 // No modo de reserva atomica, apenas o orquestrador com posse valida pode conciliar.
 // Nenhuma chamada direta ou batch pode alterar o estado da inbox por fora da reserva.
 const atomicClaim=process.env.MP_STRIPE_ATOMIC_CLAIM_ENABLED==='true'
 if(atomicClaim){
  const claimToken=req.headers.get('x-mp-claim-token')||''
  if(!uuid.test(claimToken))return response({error:'ATOMIC_OWNER_REQUIRED'},409)
  const {data:owner,error:ownerError}=await admin.from('billing_stripe_processing_claims')
   .select('event_id').eq('event_id',id).eq('claim_token',claimToken).maybeSingle()
  if(ownerError)return response({error:'ATOMIC_OWNER_UNAVAILABLE'},503)
  if(!owner)return response({error:'ATOMIC_OWNER_INVALID'},409)
 }
 const {data:inbox,error:inboxError}=await admin.from('billing_stripe_inbox').select('event_id,event_type,livemode,signature_verified,processing_status').eq('event_id',id).maybeSingle()
 if(inboxError)return response({error:'INBOX_UNAVAILABLE'},503)
 if(!inbox||inbox.signature_verified!==true||inbox.livemode!==true)return response({error:'EVENT_NOT_AUTHENTICATED'},404)
 const {data:existing,error:existingError}=await admin.from('billing_stripe_evidence').select('decision,reason').eq('event_id',id).maybeSingle()
 if(existingError)return response({error:'EVIDENCE_UNAVAILABLE'},503)
 if(existing)return response({ok:true,idempotent:true,decision:existing.decision,reason:existing.reason})
 const stripe=async(path:string)=>{
  const r=await fetch(`https://api.stripe.com/v1/${path}`,{headers:{Authorization:`Bearer ${key}`},...noStore})
  if(!r.ok)throw new Error('STRIPE_LOOKUP_UNAVAILABLE')
  return obj(await r.json())
 }
 let event:StripeObject|null
 try{event=await stripe(`events/${encodeURIComponent(id)}`)}catch{return response({error:'STRIPE_LOOKUP_UNAVAILABLE'},503)}
 const type=str(event?.type)
 const payload=obj(event?.data)
 const data=obj(payload?.object)
 if(str(event?.id)!==id||event?.livemode!==true||type!==inbox.event_type||!data)return response({error:'STRIPE_EVENT_MISMATCH'},409)
 let reason='UNSUPPORTED_OR_UNMATCHED_EVENT', decision:'review'|'verified'|'ignored'='review'
 let observed='unverified', invoiceId='', subId='', attemptId='', userId='', priceId='', currency='', amountMinor:number|null=null
 try{
  const metadata=obj(data.metadata)
  attemptId=str(metadata?.attempt_id)
  if(type.startsWith('checkout.session.')){
   const full=await stripe(`checkout/sessions/${encodeURIComponent(str(data.id))}`)
   if(!full||full.livemode!==true)throw new Error('SESSION_NOT_LIVE')
   const m=obj(full.metadata)
   attemptId=str(m?.attempt_id)
   userId=str(full.client_reference_id)
   subId=str(full.subscription)
   observed=str(full.payment_status)
   if(type==='checkout.session.completed'&&observed!=='paid')reason='CHECKOUT_COMPLETE_NOT_PAID'
  }else if(type.startsWith('invoice.')){
   invoiceId=str(data.id)
   const full=await stripe(`invoices/${encodeURIComponent(invoiceId)}`)
   if(!full||full.livemode!==true)throw new Error('INVOICE_NOT_LIVE')
   observed=str(full.status)
   subId=str(full.subscription)
   if(!subId){const parent=obj(full.parent);const details=obj(parent?.subscription_details);subId=str(details?.subscription)}
   if(type==='invoice.paid'&&observed!=='paid')reason='INVOICE_NOT_PAID'
  }else if(type.startsWith('customer.subscription.')){
   subId=str(data.id)
   const full=await stripe(`subscriptions/${encodeURIComponent(subId)}`)
   if(!full||full.livemode!==true)throw new Error('SUBSCRIPTION_NOT_LIVE')
   observed=str(full.status)
   const m=obj(full.metadata)
   attemptId=str(m?.attempt_id)
  }else if(type.startsWith('charge.')){
   observed=type
   reason='REFUND_OR_DISPUTE_MANUAL_REVIEW'
  }else {decision='ignored';reason='NOT_APPLICABLE'}
  if(decision!=='ignored'&&attemptId&&uuid.test(attemptId)){
   const {data:attempt,error:aerr}=await admin.from('billing_stripe_checkout_attempts').select('attempt_id,user_id,plan_code,billing_cycle,country,currency,amount_minor,stripe_price_id,stripe_session_id').eq('attempt_id',attemptId).maybeSingle()
   if(aerr)throw new Error('ATTEMPT_LOOKUP_UNAVAILABLE')
   if(attempt){
    userId=str(attempt.user_id);priceId=str(attempt.stripe_price_id);currency=str(attempt.currency);amountMinor=Number(attempt.amount_minor)
    const expected=approvedPriceForExisting(str(attempt.plan_code),str(attempt.billing_cycle),str(attempt.country),str(attempt.stripe_price_id))
    if(expected?.priceId!==priceId||expected.currency!==currency||expected.amountMinor!==amountMinor)reason='APPROVED_PRICE_MISMATCH'
    else if(type.startsWith('checkout.session.')&&str(data.id)!==str(attempt.stripe_session_id))reason='SESSION_ATTEMPT_MISMATCH'
    else if((type==='checkout.session.completed'||type==='checkout.session.async_payment_succeeded')&&observed==='paid'&&subId) {reason='PAYMENT_EVIDENCE_REQUIRES_INVOICE_AND_SUBSCRIPTION';decision='review'}
    else if(type==='invoice.paid'&&observed==='paid') {reason='INVOICE_PAID_REQUIRES_SUBSCRIPTION_LINKAGE';decision='review'}
   }else reason='ATTEMPT_NOT_FOUND'
  }else if(decision!=='ignored')reason='NO_VERIFIED_ATTEMPT_LINKAGE'
 }catch{reason='EXTERNAL_CONSISTENCY_CHECK_FAILED';decision='review'}
 // Inspecao de evidencia nao e autorizacao de ativacao. Pessimismo deliberado.
 const record={event_id:id,stripe_subscription_id:subId||null,stripe_invoice_id:invoiceId||null,
  attempt_id:uuid.test(attemptId)?attemptId:null,user_id:uuid.test(userId)?userId:null,
  stripe_price_id:priceId||null,currency:currency||null,amount_minor:amountMinor,
  observed_state:observed,decision,reason,evidence:{stripe_event_type:type,live_confirmed:true,automated_access_change:false}}
 const {error:upsertError}=await admin.from('billing_stripe_evidence').insert(record)
 if(upsertError){if(upsertError.code==='23505')return response({ok:true,idempotent:true});return response({error:'EVIDENCE_WRITE_FAILED'},503)}
 // No modo atomico, SOMENTE mp_stripe_finish_event_v2 conclui a inbox.
 // O orquestrador decide o desfecho usando a evidencia persistida.
 if(atomicClaim)return response({ok:true,decision,reason,accessChanged:false,awaitingAtomicFinish:true})
 const {error:statusError}=await admin.from('billing_stripe_inbox').update({processing_status:decision==='ignored'?'ignored':'review',updated_at:new Date().toISOString()}).eq('event_id',id)
 if(statusError)return response({ok:true,decision,reason,warning:'INBOX_STATUS_NOT_UPDATED'},202)
 return response({ok:true,decision,reason,accessChanged:false})
}
export async function GET(){return response({error:'METHOD_NOT_ALLOWED'},405)}
