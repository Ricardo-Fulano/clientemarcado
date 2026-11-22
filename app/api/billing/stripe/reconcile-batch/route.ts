import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { POST as reconcileEvent } from '../reconcile/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const json = (data:Record<string,unknown>, status=200) => NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}})
/** Fechamento seguro: processa inbox assinada em lotes, sem modificar perfis, billing_subscriptions nem acesso Premium.
 * O bloqueio de checkout é independente desta rota e permanece como estava.
 */
export async function POST(request:NextRequest){
 if(process.env.VERCEL_ENV!=='production'||process.env.MP_STRIPE_RECONCILE_READINESS_ENABLED!=='true'||process.env.MP_STRIPE_BATCH_ENABLED!=='true')return json({error:'BATCH_DISABLED'},503)
 // Rota batch antiga nao possui reserva por evento: falhar fechada no modo atomico.
 if(process.env.MP_STRIPE_ATOMIC_CLAIM_ENABLED==='true')return json({error:'BATCH_REQUIRES_ATOMIC_MIGRATION'},503)
 const batchSecret=process.env.MP_STRIPE_BATCH_SECRET
 const reconcileSecret=process.env.MP_STRIPE_RECONCILE_SECRET
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL
 const role=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!batchSecret||batchSecret.length<32||!reconcileSecret||reconcileSecret.length<32||!url||!role)return json({error:'CONFIG_MISSING'},503)
 if(request.headers.get('authorization')!==`Bearer ${batchSecret}`)return json({error:'UNAUTHORIZED'},401)
 if(request.headers.get('content-length') && Number(request.headers.get('content-length'))>32)return json({error:'INVALID_BODY'},400)
 const admin=createClient(url,role,{auth:{persistSession:false,autoRefreshToken:false}})
 const {data:events,error}=await admin.from('billing_stripe_inbox').select('event_id').eq('processing_status','received').order('created_at',{ascending:true}).limit(10)
 if(error)return json({error:'INBOX_READ_FAILED'},503)
 let reviewed=0, failed=0, alreadyProcessed=0
 const errors:string[]=[]
 for(const item of events||[]){
  if(typeof item.event_id!=='string'||!/^evt_[A-Za-z0-9]+$/.test(item.event_id)){failed++;continue}
  try{
   const synthetic=new NextRequest('https://minipage.pro/api/billing/stripe/reconcile',{method:'POST',headers:{authorization:`Bearer ${reconcileSecret}`,'content-type':'application/json'},body:JSON.stringify({eventId:item.event_id})})
   const result=await reconcileEvent(synthetic)
   const payload=await result.json() as {idempotent?:boolean;decision?:string;error?:string}
   if(result.status>=400){failed++;errors.push(payload.error||'RECONCILE_FAILED')}
   else if(payload.idempotent){
    alreadyProcessed++
    await admin.from('billing_stripe_inbox').update({processing_status:'review',updated_at:new Date().toISOString()}).eq('event_id',item.event_id).eq('processing_status','received')
   }
   else reviewed++
  }catch {failed++;errors.push('RECONCILE_EXCEPTION')}
 }
 return json({ok:failed===0,total:(events||[]).length,reviewed,alreadyProcessed,failed,errors,accessChanged:false,checkoutEnabledByThisRoute:false},failed?207:200)
}
export async function GET(){return json({error:'METHOD_NOT_ALLOWED'},405)}
