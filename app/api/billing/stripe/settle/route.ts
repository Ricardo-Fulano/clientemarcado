import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { approvedPrice } from '../../../../lib/billing/stripe/live-catalog'
export const runtime='nodejs'
export const dynamic='force-dynamic'
type O=Record<string,unknown>
const o=(x:unknown):O|null=>x!==null&&typeof x==='object'&&!Array.isArray(x)?x as O:null
const s=(x:unknown)=>typeof x==='string'?x:''
const num=(x:unknown)=>typeof x==='number'&&Number.isSafeInteger(x)?x:null
const eventPattern=/^evt_[A-Za-z0-9]+$/
const id=(x:unknown)=>s(x)
const reply=(v:O,status=200)=>NextResponse.json(v,{status,headers:{'Cache-Control':'no-store'}})
const unix=(x:unknown)=>{const n=num(x);return n&&n>0?new Date(n*1000).toISOString():null}
/** Rotina administrativa, NUNCA chamada pelo navegador e nunca pelo retorno do Checkout.
 * Liberacao somente apos comprovacao direta de invoice.paid + subscription + checkout.session
 * na Stripe Live e funcao transacional com service_role. Flags desativadas por padrao.
 */
export async function POST(req:NextRequest){
 if(process.env.VERCEL_ENV!=='production'||process.env.MP_STRIPE_ACTIVATION_ENABLED!=='true')return reply({error:'ACTIVATION_DISABLED'},503)
 const secret=process.env.MP_STRIPE_SETTLE_SECRET
 if(!secret||secret.length<32||req.headers.get('authorization')!==`Bearer ${secret}`)return reply({error:'UNAUTHORIZED'},401)
 const key=process.env.STRIPE_LIVE_SECRET_KEY
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL
 const role=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!(/^(?:sk|rk)_live_/.test(key||''))||!url||!role)return reply({error:'CONFIG_MISSING'},503)
 let body:unknown
 try{body=await req.json()}catch{return reply({error:'INVALID_JSON'},400)}
 const input=o(body)
 const eventId=s(input?.eventId)
 if(!input||Object.keys(input).length!==1||!eventPattern.test(eventId))return reply({error:'INVALID_EVENT_ID'},422)
 const admin=createClient(url,role,{auth:{autoRefreshToken:false,persistSession:false}})
 const {data:inbox,error:inboxError}=await admin.from('billing_stripe_inbox')
  .select('event_id,event_type,livemode,signature_verified').eq('event_id',eventId).maybeSingle()
 if(inboxError)return reply({error:'INBOX_UNAVAILABLE'},503)
 if(!inbox||inbox.event_type!=='invoice.paid'||inbox.livemode!==true||inbox.signature_verified!==true)
  return reply({error:'EVENT_NOT_AUTHENTICATED'},409)
 const get=async(path:string):Promise<O>=>{
  const r=await fetch(`https://api.stripe.com/v1/${path}`,{headers:{authorization:`Bearer ${key}`},cache:'no-store'})
  if(!r.ok)throw new Error('STRIPE_READ_FAILED')
  const v=o(await r.json());if(!v||v.livemode!==true)throw new Error('NOT_LIVE')
  return v
 }
 try{
  const event=await get(`events/${encodeURIComponent(eventId)}`)
  const invoiceId=s(o(o(event.data)?.object)?.id)
  if(event.id!==eventId||event.type!=='invoice.paid'||!/^in_[A-Za-z0-9]+$/.test(invoiceId))
   return reply({error:'EVENT_INVOICE_MISMATCH'},409)
  const invoice=await get(`invoices/${encodeURIComponent(invoiceId)}`)
  if(invoice.id!==invoiceId||invoice.status!=='paid'||invoice.paid!==true||invoice.paid_out_of_band===true)
   return reply({error:'INVOICE_NOT_PAID'},409)
  const details=o(o(invoice.parent)?.subscription_details)
  const subscriptionId=s(invoice.subscription)||s(details?.subscription)
  if(!/^sub_[A-Za-z0-9]+$/.test(subscriptionId))return reply({error:'NO_SUBSCRIPTION_LINK'},409)
  const subscription=await get(`subscriptions/${encodeURIComponent(subscriptionId)}`)
  const latest=typeof subscription.latest_invoice==='string'?subscription.latest_invoice:s(o(subscription.latest_invoice)?.id)
  if(subscription.id!==subscriptionId||subscription.status!=='active'||latest!==invoiceId)
   return reply({error:'SUBSCRIPTION_NOT_CURRENT'},409)
  const attemptId=s(o(subscription.metadata)?.attempt_id)
  if(!/^[a-f0-9-]{36}$/i.test(attemptId))return reply({error:'NO_ATTEMPT_METADATA'},409)
  const {data:attempt,error:attemptError}=await admin.from('billing_stripe_checkout_attempts')
   .select('attempt_id,user_id,plan_code,billing_cycle,country,currency,amount_minor,stripe_price_id,stripe_session_id,status')
   .eq('attempt_id',attemptId).maybeSingle()
  if(attemptError)return reply({error:'ATTEMPT_UNAVAILABLE'},503)
  if(!attempt||attempt.status!=='created'||!s(attempt.stripe_session_id).startsWith('cs_live_'))
   return reply({error:'ATTEMPT_NOT_READY'},409)
  const approved=approvedPrice(s(attempt.plan_code),s(attempt.billing_cycle),s(attempt.country))
  if(!approved||approved.priceId!==attempt.stripe_price_id||approved.currency!==attempt.currency||approved.amountMinor!==attempt.amount_minor)
   return reply({error:'APPROVED_CATALOG_MISMATCH'},409)
  const items=o(subscription.items)?.data
  if(!Array.isArray(items)||items.length!==1)return reply({error:'SUBSCRIPTION_ITEM_COUNT'},409)
  const item=o(items[0]);const livePrice=o(item?.price)
  if(!item||!livePrice||livePrice.id!==approved.priceId||s(livePrice.currency).toUpperCase()!==approved.currency||livePrice.unit_amount!==approved.amountMinor)
   return reply({error:'SUBSCRIPTION_PRICE_MISMATCH'},409)
  const lines=o(invoice.lines)?.data
  if(!Array.isArray(lines)||lines.length!==1)return reply({error:'INVOICE_LINE_COUNT'},409)
  const line=o(lines[0]);const linePrice=s(o(line?.price)?.id)||s(o(o(line?.pricing)?.price_details)?.price)
  if(linePrice!==approved.priceId)return reply({error:'INVOICE_PRICE_MISMATCH'},409)
  if(s(invoice.currency).toUpperCase()!==approved.currency||invoice.amount_paid!==approved.amountMinor)
   return reply({error:'INVOICE_AMOUNT_OR_CURRENCY_MISMATCH'},409)
  const session=await get(`checkout/sessions/${encodeURIComponent(s(attempt.stripe_session_id))}`)
  const userId=s(attempt.user_id)
  const customerId=s(subscription.customer)
  if(!/^cus_[A-Za-z0-9]+$/.test(customerId)||session.id!==attempt.stripe_session_id||session.subscription!==subscriptionId||session.customer!==customerId||invoice.customer!==customerId||session.client_reference_id!==userId||s(o(session.metadata)?.attempt_id)!==attemptId||session.payment_status!=='paid')
   return reply({error:'CHECKOUT_LINKAGE_MISMATCH'},409)
  // Pais selecionado define tabela/preco, sem inferir residencia por IP ou cartao.
  // Integridade: invoice paga, assinatura ativa, price ID, moeda, valor e metadados continuam obrigatorios.
  const priceCountry=s(attempt.country).trim().toUpperCase()
  const metaCountry=s(o(session.metadata)?.price_country).trim().toUpperCase()
  const subscriptionCountry=s(o(subscription.metadata)?.price_country).trim().toUpperCase()
  if(priceCountry==='BR'||(metaCountry&&metaCountry!==priceCountry)||(subscriptionCountry&&subscriptionCountry!==priceCountry)){
    return reply({ok:true,result:'regional_review',reason:priceCountry==='BR'?'BRAZIL_USES_EBANX':'PRICE_COUNTRY_METADATA_MISMATCH',accessChanged:false,eventId})
  }
  const periodStart=unix(item.current_period_start??subscription.current_period_start)
  const periodEnd=unix(item.current_period_end??subscription.current_period_end)
  if(!periodStart||!periodEnd)return reply({error:'SUBSCRIPTION_PERIOD_MISSING'},409)
  const {data,error}=await admin.rpc('mp_stripe_confirmar_fatura_v1',{
   p_user_id:userId,p_attempt_id:attemptId,p_event_id:eventId,p_invoice_id:invoiceId,
   p_stripe_subscription_id:subscriptionId,p_stripe_customer_id:customerId,
   p_price_id:approved.priceId,p_currency:approved.currency,p_amount_minor:approved.amountMinor,
   p_period_start:periodStart,p_period_end:periodEnd
  })
  if(error)return reply({error:'TRANSACTION_REJECTED',code:error.code||'UNKNOWN'},409)
  return reply({ok:true,result:data,accessChanged:data==='applied',eventId})
 }catch{return reply({error:'EXTERNAL_VERIFICATION_FAILED'},503)}
}
export async function GET(){return reply({error:'METHOD_NOT_ALLOWED'},405)}
