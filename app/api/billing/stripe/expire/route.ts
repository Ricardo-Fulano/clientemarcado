import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const runtime='nodejs'
export const dynamic='force-dynamic'
type Obj=Record<string,unknown>
const obj=(v:unknown):Obj|null=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Obj:null
const str=(v:unknown)=>typeof v==='string'?v:''
const respond=(v:Obj,status=200)=>NextResponse.json(v,{status,headers:{'Cache-Control':'no-store'}})
const iso=(s:unknown)=>typeof s==='number'&&Number.isSafeInteger(s)&&s>0?new Date(s*1000).toISOString():null
/** Somente assinaturas Stripe CANCELADAS com periodo pago encerrado.
 * Nao trata inadimplencia, estorno ou disputa. Gatilhos de perfis permanecem ativos.
 * Nenhum cron aponta para esta rota automaticamente. Flags desativadas por padrao.
 */
export async function POST(req:NextRequest){
 if(process.env.VERCEL_ENV!=='production'||process.env.MP_STRIPE_EXPIRY_ENABLED!=='true')return respond({error:'EXPIRY_DISABLED'},503)
 const secret=process.env.MP_STRIPE_EXPIRY_SECRET
 if(!secret||secret.length<32||req.headers.get('authorization')!==`Bearer ${secret}`)return respond({error:'UNAUTHORIZED'},401)
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,role=process.env.SUPABASE_SERVICE_ROLE_KEY,key=process.env.STRIPE_LIVE_SECRET_KEY
 if(!url||!role||!key?.startsWith('sk_live_'))return respond({error:'CONFIG_MISSING'},503)
 const db=createClient(url,role,{auth:{autoRefreshToken:false,persistSession:false}})
 const {data,error}=await db.from('billing_subscriptions')
   .select('id,user_id,provider_subscription_id,provider_customer_id,current_period_end,status')
   .eq('provider','stripe').eq('status','canceled')
   .lt('current_period_end',new Date(Date.now()-300000).toISOString())
   .order('current_period_end',{ascending:true}).limit(10)
 if(error)return respond({error:'DB_READ_FAILED'},503)
 const results:Array<{subscription:string;outcome:string}>=[]
 for(const sub of data??[]){
  const subscription=str(sub.provider_subscription_id),customer=str(sub.provider_customer_id)
  if(!/^sub_[A-Za-z0-9]+$/.test(subscription)||!/^cus_[A-Za-z0-9]+$/.test(customer)){
    results.push({subscription:'invalid_id',outcome:'review'});continue
  }
  try{
   const r=await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscription)}`,{
     headers:{authorization:`Bearer ${key}`},cache:'no-store'})
   if(!r.ok){results.push({subscription,outcome:'stripe_unavailable'});continue}
   const live=obj(await r.json())
   const items=obj(live?.items),first=Array.isArray(items?.data)?obj(items.data[0]):null
   const end=iso(first?.current_period_end??live?.current_period_end)
   if(!live||live.livemode!==true||live.id!==subscription||live.status!=='canceled'
    ||str(live.customer)!==customer||!end||new Date(end).getTime()>Date.now()-300000){
      results.push({subscription,outcome:'review_stripe_state'});continue
   }
   const {data:outcome,error:rpcError}=await db.rpc('mp_stripe_expirar_cancelada_v1',{
    p_subscription_id:subscription,p_customer_id:customer,p_live_status:'canceled',p_live_period_end:end
   })
   results.push({subscription,outcome:rpcError?'review_rpc_error':str(outcome)||'review_unknown'})
  }catch{results.push({subscription,outcome:'review_fetch_error'})}
 }
 return respond({ok:true,scanned:(data??[]).length,results})
}
export async function GET(){return respond({error:'METHOD_NOT_ALLOWED'},405)}
