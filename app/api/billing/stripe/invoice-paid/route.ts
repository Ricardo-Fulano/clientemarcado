import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { POST as settle } from '../settle/route'
import { POST as renew } from '../renew/route'
export const runtime='nodejs'
export const dynamic='force-dynamic'
type O=Record<string,unknown>
const object=(v:unknown):O|null=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as O:null
const text=(v:unknown)=>typeof v==='string'?v:''
const reply=(v:O,status=200)=>NextResponse.json(v,{status,headers:{'Cache-Control':'no-store'}})
/** Roteia invoice.paid: primeira compra -> settle; assinatura conhecida -> renew. */
export async function POST(req:NextRequest){
 if(process.env.VERCEL_ENV!=='production'||process.env.MP_STRIPE_INVOICE_ROUTER_ENABLED!=='true')return reply({error:'INVOICE_ROUTER_DISABLED'},503)
 const token=process.env.MP_STRIPE_INVOICE_ROUTER_SECRET
 if(!token||token.length<32||req.headers.get('authorization')!==`Bearer ${token}`)return reply({error:'UNAUTHORIZED'},401)
 const key=process.env.STRIPE_LIVE_SECRET_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL,role=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!key?.startsWith('sk_live_')||!url||!role)return reply({error:'CONFIG_MISSING'},503)
 let input:unknown;try{input=await req.json()}catch{return reply({error:'INVALID_JSON'},400)}
 const body=object(input),eventId=text(body?.eventId)
 if(!body||Object.keys(body).length!==1||!/^evt_[A-Za-z0-9]+$/.test(eventId))return reply({error:'INVALID_EVENT'},422)
 const db=createClient(url,role,{auth:{persistSession:false,autoRefreshToken:false}})
 const {data:inbox,error}=await db.from('billing_stripe_inbox')
 .select('event_type,livemode,signature_verified').eq('event_id',eventId).maybeSingle()
 if(error)return reply({error:'INBOX_UNAVAILABLE'},503)
 if(!inbox||inbox.event_type!=='invoice.paid'||inbox.livemode!==true||inbox.signature_verified!==true)
  return reply({error:'EVENT_NOT_VERIFIED'},409)
 try{
  const get=async(path:string)=>{
   const r=await fetch('https://api.stripe.com/v1/'+path,{headers:{authorization:`Bearer ${key}`},cache:'no-store'})
   if(!r.ok)throw Error('STRIPE_READ_FAILED')
   const result=object(await r.json())
   if(!result||result.livemode!==true)throw Error('NOT_LIVE');return result
  }
  const evt=await get(`events/${encodeURIComponent(eventId)}`)
  const invoiceId=text(object(object(evt.data)?.object)?.id)
  if(evt.id!==eventId||evt.type!=='invoice.paid'||!/^in_[A-Za-z0-9]+$/.test(invoiceId))
   return reply({error:'EVENT_MISMATCH'},409)
  const invoice=await get(`invoices/${encodeURIComponent(invoiceId)}`)
  const subId=text(invoice.subscription)||text(object(object(invoice.parent)?.subscription_details)?.subscription)
  if(invoice.id!==invoiceId||!/^sub_[A-Za-z0-9]+$/.test(subId))return reply({error:'SUBSCRIPTION_MISSING'},409)
  const {data:existing,error:lookupError}=await db.from('billing_subscriptions')
   .select('id').eq('provider','stripe').eq('provider_subscription_id',subId).maybeSingle()
  if(lookupError)return reply({error:'SUBSCRIPTION_DB_ERROR'},503)
  const route=existing?'renew':'settle'
  // Cada operacao exige sua propria autorizacao, sem obrigar a outra a estar ativa.
  if(existing && process.env.MP_STRIPE_RENEWAL_ENABLED!=='true')return reply({error:'RENEWAL_DISABLED'},503)
  if(!existing && process.env.MP_STRIPE_ACTIVATION_ENABLED!=='true')return reply({error:'ACTIVATION_DISABLED'},503)
  const delegatedSecret=existing?process.env.MP_STRIPE_RENEWAL_SECRET:process.env.MP_STRIPE_SETTLE_SECRET
  if(!delegatedSecret||delegatedSecret.length<32)return reply({error:'DELEGATE_NOT_CONFIGURED'},503)
  const synthetic=new NextRequest(`https://minipage.pro/api/billing/stripe/${route}`,{
   method:'POST',headers:{authorization:`Bearer ${delegatedSecret}`,'content-type':'application/json'},
   body:JSON.stringify({eventId})
  })
  const result=await (existing?renew(synthetic):settle(synthetic))
  const payload=await result.json() as O
  return reply({ ...payload, handler:route },result.status)
 }catch{return reply({error:'INVOICE_ROUTING_FAILED'},503)}
}
export async function GET(){return reply({error:'METHOD_NOT_ALLOWED'},405)}
