import {NextRequest,NextResponse} from 'next/server'
import {createClient} from '@supabase/supabase-js'
import {approvedPrice} from '../../../../lib/billing/stripe/live-catalog'
import {stripeLiveReadiness} from '../../../../lib/billing/stripe/live-readiness'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const out=(v:Record<string,unknown>,status=200)=>NextResponse.json(v,{status,headers:{'Cache-Control':'no-store'}})
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i
const stripeId=/^price_[a-zA-Z0-9]+$/
const ids=(v:unknown)=>typeof v==='string'&&v.trim().length>0
export async function POST(request:NextRequest){
 if(!stripeLiveReadiness().ready)return out({error:'LIVE_CHECKOUT_DISABLED_OR_PROCESSING_NOT_READY'},503)
 const key=process.env.STRIPE_LIVE_SECRET_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY
 const publicUrl=process.env.STRIPE_LIVE_RETURN_ORIGIN
 if(!key?.startsWith('sk_live_')||!url||!anon||!service||!publicUrl||!/^https:\/\/[^/]+$/.test(publicUrl))return out({error:'LIVE_CONFIG_INCOMPLETE'},503)
 const bearer=request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
 if(!bearer||bearer.length>8192)return out({error:'UNAUTHENTICATED'},401)
 let body:unknown
 try{body=await request.json()}catch{return out({error:'INVALID_JSON'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return out({error:'INVALID_REQUEST'},422)
 const b=body as Record<string,unknown>
 if(Object.keys(b).sort().join(',')!=='attemptId,country,cycle,plan')return out({error:'INVALID_FIELDS'},422)
 const attemptId=b.attemptId,plan=b.plan,cycle=b.cycle,country=b.country
 if(typeof attemptId!=='string'||!uuid.test(attemptId)||typeof plan!=='string'||typeof cycle!=='string'||typeof country!=='string')return out({error:'INVALID_FIELDS'},422)
 const price=approvedPrice(plan,cycle,country)
 if(!price||!stripeId.test(price.priceId))return out({error:'PRICE_NOT_APPROVED'},422)
 try{
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error:authError}=await auth.auth.getUser(bearer)
  if(authError||!user)return out({error:'INVALID_SESSION'},401)
  // Fechamento gradual: uma conta de homologacao pode comprar antes da abertura publica.
  // Sem permissao publica e sem e-mail de teste correspondente, nenhuma sessao e criada.
  const publicEnabled=process.env.MP_STRIPE_PUBLIC_CHECKOUT_ENABLED==='true'
  const testEmail=(process.env.MP_STRIPE_TEST_ACCOUNT_EMAIL||'').trim().toLowerCase()
  if(!publicEnabled&&(!testEmail||user.email?.trim().toLowerCase()!==testEmail))
    return out({error:'LIVE_CHECKOUT_TEST_ONLY'},403)
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:profile,error:profileError}=await admin.from('perfis').select('plano_tipo,status_acesso,primeiro_pagamento_confirmado,gateway,gateway_customer_id,gateway_subscription_id,mp_subscription_id').eq('user_id',user.id).maybeSingle()
  if(profileError||!profile)return out({error:'PROFILE_UNAVAILABLE'},422)
  // Conservador: não permite outra compra para contas já vinculadas a qualquer gateway.
  if(profile.primeiro_pagamento_confirmado===true||ids(profile.gateway)||ids(profile.gateway_customer_id)||ids(profile.gateway_subscription_id)||ids(profile.mp_subscription_id))return out({error:'EXISTING_BILLING_RELATIONSHIP'},409)
  if(!(profile.status_acesso==='aguardando_pagamento'||(profile.plano_tipo==='free'&&profile.status_acesso==='ativo')))return out({error:'ACCESS_STATE_NOT_ELIGIBLE'},409)
  const {data:subscriptions,error:subError}=await admin.from('billing_subscriptions').select('id').eq('user_id',user.id).in('status',['active','trialing','past_due','pending','incomplete','unpaid']).limit(1)
  if(subError)return out({error:'SUBSCRIPTION_CHECK_UNAVAILABLE'},503)
  if(subscriptions?.length)return out({error:'SUBSCRIPTION_ALREADY_EXISTS'},409)
  // Bloqueia novas sessões enquanto houver outra tentativa não resolvida para a mesma conta.
  const {data:pending,error:pendingError}=await admin.from('billing_stripe_checkout_attempts')
    .select('attempt_id,status').eq('user_id',user.id)
    .in('status',['reserved','sending','created']).limit(1).maybeSingle()
  if(pendingError)return out({error:'PENDING_CHECK_UNAVAILABLE'},503)
  if(pending)return out({error:'PREVIOUS_CHECKOUT_REQUIRES_REVIEW'},409)
  // Confere preço Live na Stripe ANTES de reservar tentativa e de qualquer criação.
  const priceResponse=await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(price.priceId)}`,{headers:{Authorization:`Bearer ${key}`},cache:'no-store'})
  if(!priceResponse.ok)return out({error:'STRIPE_PRICE_LOOKUP_FAILED'},503)
  const livePrice=await priceResponse.json() as {id?:string;active?:boolean;livemode?:boolean;currency?:string;unit_amount?:number;recurring?:{interval?:string}}
  if(livePrice.id!==price.priceId||livePrice.active!==true||livePrice.livemode!==true||livePrice.currency?.toUpperCase()!==price.currency||livePrice.unit_amount!==price.amountMinor||livePrice.recurring?.interval!==(cycle==='mensal'?'month':'year'))return out({error:'STRIPE_PRICE_MISMATCH'},409)
  const {error:insertError}=await admin.from('billing_stripe_checkout_attempts').insert({attempt_id:attemptId,user_id:user.id,plan_code:plan,billing_cycle:cycle,country,currency:price.currency,amount_minor:price.amountMinor,stripe_price_id:price.priceId,status:'reserved'})
  if(insertError)return out({state:'pending_review',reason:'ATTEMPT_ALREADY_EXISTS_OR_DB_UNAVAILABLE',message:'No new checkout created. Reconcile before retry.'},409)
  const {data:claimed,error:claimError}=await admin.from('billing_stripe_checkout_attempts').update({status:'sending',updated_at:new Date().toISOString()}).eq('attempt_id',attemptId).eq('user_id',user.id).eq('status','reserved').select('attempt_id').maybeSingle()
  if(claimError||!claimed)return out({state:'pending_review',reason:'ATTEMPT_CLAIM_FAILED'},202)
  const payload=new URLSearchParams()
  payload.set('mode','subscription');payload.set('line_items[0][price]',price.priceId);payload.set('line_items[0][quantity]','1')
  payload.set('billing_address_collection','required')
  payload.set('client_reference_id',user.id)
  payload.set('success_url',`${publicUrl}/painel/plano?stripe_return=success&session_id={CHECKOUT_SESSION_ID}`)
  payload.set('cancel_url',`${publicUrl}/painel/contratar?plan=${encodeURIComponent(plan)}&cycle=${encodeURIComponent(cycle)}&country=${encodeURIComponent(country)}&stripe_return=cancel`)
  payload.set('metadata[attempt_id]',attemptId);payload.set('metadata[user_id]',user.id);payload.set('metadata[plan]',plan);payload.set('metadata[cycle]',cycle)
  payload.set('subscription_data[metadata][attempt_id]',attemptId);payload.set('subscription_data[metadata][user_id]',user.id)
  let session:{id?:string;url?:string;livemode?:boolean}
  try{
   const result=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':`mp-live-${attemptId}`},body:payload,cache:'no-store'})
   if(!result.ok)return out({state:'pending_review',reason:'STRIPE_CREATE_UNCERTAIN'},202)
   session=await result.json() as typeof session
  }catch{return out({state:'pending_review',reason:'STRIPE_CREATE_UNCERTAIN'},202)}
  if(!session.id?.startsWith('cs_live_')||!session.url?.startsWith('https://checkout.stripe.com/')||session.livemode!==true)return out({state:'pending_review',reason:'INVALID_STRIPE_RESPONSE'},202)
  const {data:saved,error:saveError}=await admin.from('billing_stripe_checkout_attempts').update({stripe_session_id:session.id,status:'created',updated_at:new Date().toISOString()}).eq('attempt_id',attemptId).eq('user_id',user.id).eq('status','sending').select('attempt_id').maybeSingle()
  if(saveError||!saved)return out({state:'pending_review',reason:'STRIPE_SESSION_NOT_PERSISTED'},202)
  return out({state:'ready',checkoutUrl:session.url},200)
 }catch{return out({error:'TEMPORARILY_UNAVAILABLE'},503)}
}
export async function GET(){return out({error:'METHOD_NOT_ALLOWED'},405)}
