import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
type Obj = Record<string, unknown>
const obj=(v:unknown):Obj|null=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Obj:null
const str=(v:unknown)=>typeof v==='string'?v:''
const respond=(body:Obj,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})
const eventRe=/^evt_[A-Za-z0-9]+$/
const subRe=/^sub_[A-Za-z0-9]+$/
const cusRe=/^cus_[A-Za-z0-9]+$/
const allowed=new Set(['customer.subscription.updated','customer.subscription.deleted','invoice.payment_failed'])
/** Apenas administrativo, DESLIGADO por padrao. Nunca aceita status enviado pelo cliente.
 * Le status ATUAL da Stripe Live e faz RPC serializada somente para assinatura Stripe existente.
 * Estornos/disputas: revisao, nunca downgrade por um evento isolado.
 */
export async function POST(req:NextRequest){
 if(process.env.VERCEL_ENV!=='production'||process.env.MP_STRIPE_LIFECYCLE_ENABLED!=='true')return respond({error:'LIFECYCLE_DISABLED'},503)
 const secret=process.env.MP_STRIPE_LIFECYCLE_SECRET
 if(!secret||secret.length<32||req.headers.get('authorization')!==`Bearer ${secret}`)return respond({error:'UNAUTHORIZED'},401)
 const key=process.env.STRIPE_LIVE_SECRET_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL,role=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!key?.startsWith('sk_live_')||!url||!role)return respond({error:'CONFIG_MISSING'},503)
 let body:unknown
 try{body=await req.json()}catch{return respond({error:'INVALID_JSON'},400)}
 const b=obj(body), eventId=str(b?.eventId)
 if(!b||Object.keys(b).length!==1||!eventRe.test(eventId))return respond({error:'INVALID_EVENT_ID'},422)
 const admin=createClient(url,role,{auth:{autoRefreshToken:false,persistSession:false}})
 const {data:inbox,error:dbError}=await admin.from('billing_stripe_inbox')
  .select('event_id,event_type,livemode,signature_verified').eq('event_id',eventId).maybeSingle()
 if(dbError)return respond({error:'INBOX_UNAVAILABLE'},503)
 if(!inbox||inbox.livemode!==true||inbox.signature_verified!==true||!allowed.has(inbox.event_type))return respond({error:'EVENT_NOT_VERIFIED'},409)
 const get=async(path:string)=>{
  const r=await fetch(`https://api.stripe.com/v1/${path}`,{headers:{authorization:`Bearer ${key}`},cache:'no-store'})
  if(!r.ok)throw Error('STRIPE_API_ERROR')
  const v=obj(await r.json());if(!v||v.livemode!==true)throw Error('NOT_LIVE');return v
 }
 try{
  const event=await get(`events/${encodeURIComponent(eventId)}`)
  if(event.id!==eventId||event.type!==inbox.event_type)return respond({error:'EVENT_MISMATCH'},409)
  const data=obj(o(obj(event.data), 'object'))
  let subId=''
  if(inbox.event_type.startsWith('customer.subscription.'))subId=str(data?.id)
  else{
   const invoiceId=str(data?.id)
   if(!/^in_[A-Za-z0-9]+$/.test(invoiceId))return respond({error:'INVOICE_ID_INVALID'},409)
   const invoice=await get(`invoices/${encodeURIComponent(invoiceId)}`)
   if(invoice.id!==invoiceId)return respond({error:'INVOICE_MISMATCH'},409)
   subId=str(invoice.subscription)||str(obj(obj(invoice.parent)?.subscription_details)?.subscription)
  }
  if(!subRe.test(subId))return respond({error:'SUBSCRIPTION_NOT_FOUND'},409)
  const sub=await get(`subscriptions/${encodeURIComponent(subId)}`)
  const customerId=str(sub.customer)
  if(sub.id!==subId||!cusRe.test(customerId))return respond({error:'SUBSCRIPTION_MISMATCH'},409)
  const items=obj(sub.items)?.data
  if(!Array.isArray(items)||items.length!==1)return respond({error:'ITEM_COUNT_UNSUPPORTED'},409)
  const item=obj(items[0]);const timestamp=item?.current_period_end??sub.current_period_end
  if(typeof timestamp!=='number'||!Number.isSafeInteger(timestamp)||timestamp<=0)return respond({error:'PERIOD_MISSING'},409)
  const periodEnd=new Date(timestamp*1000).toISOString()
  const {data:result,error}=await admin.rpc('mp_stripe_sincronizar_estado_v1',{
   p_event_id:eventId,p_subscription_id:subId,p_customer_id:customerId,
   p_live_status:str(sub.status),p_period_end:periodEnd
  })
  if(error)return respond({error:'TRANSACTION_REJECTED',code:error.code||'UNKNOWN'},409)
  return respond({ok:true,result,accessChanged:false,eventId})
 }catch{return respond({error:'STRIPE_VERIFICATION_FAILED'},503)}
}
function o(v:Obj|null,k:string):unknown{return v?.[k]}
export async function GET(){return respond({error:'METHOD_NOT_ALLOWED'},405)}
