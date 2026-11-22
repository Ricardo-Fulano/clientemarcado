import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { approvedPrice } from '../../../../lib/billing/stripe/live-catalog'
export const runtime='nodejs'
export const dynamic='force-dynamic'
type O=Record<string,unknown>
const obj=(x:unknown):O|null=>x!==null&&typeof x==='object'&&!Array.isArray(x)?x as O:null
const str=(x:unknown)=>typeof x==='string'?x:''
const respond=(v:O,status=200)=>NextResponse.json(v,{status,headers:{'Cache-Control':'no-store'}})
const stamp=(x:unknown)=>typeof x==='number'&&Number.isSafeInteger(x)&&x>0?new Date(x*1000).toISOString():null
const reEvt=/^evt_[A-Za-z0-9]+$/
const reIn=/^in_[A-Za-z0-9]+$/
const reSub=/^sub_[A-Za-z0-9]+$/
const reCus=/^cus_[A-Za-z0-9]+$/
/** Renova faturas de assinaturas Stripe JA existentes. Nao cria conta, checkout ou assinatura.
 * Desativado por padrao; requer aprovacao separada da operacao Live.
 */
export async function POST(req:NextRequest){
 if(process.env.VERCEL_ENV!=='production'||process.env.MP_STRIPE_RENEWAL_ENABLED!=='true')return respond({error:'RENEWAL_DISABLED'},503)
 const secret=process.env.MP_STRIPE_RENEWAL_SECRET
 if(!secret||secret.length<32||req.headers.get('authorization')!==`Bearer ${secret}`)return respond({error:'UNAUTHORIZED'},401)
 const key=process.env.STRIPE_LIVE_SECRET_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL,role=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!key?.startsWith('sk_live_')||!url||!role)return respond({error:'CONFIG_MISSING'},503)
 let data:unknown;try{data=await req.json()}catch{return respond({error:'INVALID_JSON'},400)}
 const b=obj(data),eventId=str(b?.eventId)
 if(!b||Object.keys(b).length!==1||!reEvt.test(eventId))return respond({error:'INVALID_EVENT'},422)
 const db=createClient(url,role,{auth:{autoRefreshToken:false,persistSession:false}})
 const {data:inbox,error:inboxError}=await db.from('billing_stripe_inbox')
 .select('event_id,event_type,livemode,signature_verified').eq('event_id',eventId).maybeSingle()
 if(inboxError)return respond({error:'INBOX_UNAVAILABLE'},503)
 if(!inbox||inbox.event_type!=='invoice.paid'||inbox.livemode!==true||inbox.signature_verified!==true)return respond({error:'EVENT_NOT_VERIFIED'},409)
 const get=async(path:string):Promise<O>=>{
  const res=await fetch(`https://api.stripe.com/v1/${path}`,{headers:{authorization:`Bearer ${key}`},cache:'no-store'})
  if(!res.ok)throw Error('STRIPE_API_READ_FAILED')
  const value=obj(await res.json());if(!value||value.livemode!==true)throw Error('NOT_LIVE');return value
 }
 try{
  const event=await get(`events/${encodeURIComponent(eventId)}`)
  const invoiceId=str(obj(obj(event.data)?.object)?.id)
  if(event.id!==eventId||event.type!=='invoice.paid'||!reIn.test(invoiceId))return respond({error:'EVENT_MISMATCH'},409)
  const invoice=await get(`invoices/${encodeURIComponent(invoiceId)}`)
  if(invoice.id!==invoiceId||invoice.status!=='paid'||invoice.paid!==true||invoice.paid_out_of_band===true)
   return respond({error:'INVOICE_NOT_PAID'},409)
  const subId=str(invoice.subscription)||str(obj(obj(invoice.parent)?.subscription_details)?.subscription)
  if(!reSub.test(subId))return respond({error:'SUBSCRIPTION_MISSING'},409)
  const sub=await get(`subscriptions/${encodeURIComponent(subId)}`)
  const customerId=str(sub.customer)
  if(sub.id!==subId||!reCus.test(customerId)||sub.status!=='active'||invoice.customer!==customerId)
   return respond({error:'SUBSCRIPTION_NOT_ACTIVE'},409)
  const {data:stored,error:storedError}=await db.from('billing_subscriptions')
   .select('id,user_id,provider,plan_code,billing_cycle,currency,contracted_amount_minor,provider_customer_id,provider_subscription_id')
   .eq('provider','stripe').eq('provider_subscription_id',subId).maybeSingle()
  if(storedError)return respond({error:'SUBSCRIPTION_DB_ERROR'},503)
  if(!stored)return respond({error:'NOT_RENEWAL'},409)
  if(stored.provider_customer_id!==customerId)return respond({error:'CUSTOMER_MISMATCH'},409)
  const {data:attempt,error:attemptError}=await db.from('billing_stripe_checkout_attempts')
   .select('country,stripe_price_id,plan_code,billing_cycle,currency,amount_minor')
   .eq('user_id',stored.user_id).eq('plan_code',stored.plan_code)
   .eq('billing_cycle',stored.billing_cycle).eq('status','created').order('created_at',{ascending:true}).limit(1).maybeSingle()
  if(attemptError)return respond({error:'ATTEMPT_DB_ERROR'},503)
  const approved=approvedPrice(str(stored.plan_code),str(stored.billing_cycle),str(attempt?.country))
  if(!approved||!attempt||approved.priceId!==attempt.stripe_price_id||approved.currency!==stored.currency
   ||approved.amountMinor!==stored.contracted_amount_minor||approved.amountMinor!==attempt.amount_minor)
   return respond({error:'ORIGINAL_CATALOG_MISMATCH'},409)
  const items=obj(sub.items)?.data
  if(!Array.isArray(items)||items.length!==1)return respond({error:'SUBSCRIPTION_ITEMS_UNSUPPORTED'},409)
  const item=obj(items[0]),price=obj(item?.price)
  if(!item||!price||price.id!==approved.priceId||str(price.currency).toUpperCase()!==approved.currency
   ||price.unit_amount!==approved.amountMinor||item.quantity!==1)return respond({error:'SUBSCRIPTION_PRICE_MISMATCH'},409)
  // Distinguimos o preco contratual do montante efetivamente pago (imposto/desconto).
  // Nao aceita credito integral, boleto externo ou montante nao liquidado.
  const lines=obj(invoice.lines)?.data
  if(!Array.isArray(lines)||lines.length!==1||obj(invoice.lines)?.has_more===true)return respond({error:'INVOICE_LINES_UNSUPPORTED'},409)
  const line=obj(lines[0]),linePrice=str(obj(line?.price)?.id)||str(obj(obj(line?.pricing)?.price_details)?.price)
  const period=obj(line?.period)
  const periodStart=stamp(period?.start),periodEnd=stamp(period?.end)
  if(!line||linePrice!==approved.priceId||line.quantity!==1||!periodStart||!periodEnd
   ||str(invoice.currency).toUpperCase()!==approved.currency||(typeof invoice.amount_paid!=='number'||!Number.isSafeInteger(invoice.amount_paid)||invoice.amount_paid<=0)
   ||invoice.amount_remaining!==0||invoice.total!==invoice.amount_paid)
   return respond({error:'INVOICE_TERMS_MISMATCH'},409)
  const {data:outcome,error:rpcError}=await db.rpc('mp_stripe_renovar_fatura_v2',{
   p_event_id:eventId,p_invoice_id:invoiceId,p_subscription_id:subId,p_customer_id:customerId,
   p_price_id:approved.priceId,p_currency:approved.currency,p_amount_minor:approved.amountMinor,
   p_paid_minor:invoice.amount_paid,
   p_period_start:periodStart,p_period_end:periodEnd
  })
  if(rpcError)return respond({error:'TRANSACTION_REJECTED',code:rpcError.code||'UNKNOWN'},409)
  return respond({ok:true,result:outcome,accessChanged:outcome==='applied',eventId})
 }catch{return respond({error:'STRIPE_VERIFICATION_FAILED'},503)}
}
export async function GET(){return respond({error:'METHOD_NOT_ALLOWED'},405)}
