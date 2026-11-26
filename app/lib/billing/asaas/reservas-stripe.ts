import type { SupabaseClient } from '@supabase/supabase-js'

// A Stripe precisa confirmar a expiração. Nenhum POST ao provedor, nenhum cancelamento.
export function expiredUnpaidStripeSession(s:any, old:any, userId:string):boolean {
 return !!s && s.id===old.stripe_session_id && s.livemode===true && s.client_reference_id===userId && s.metadata?.user_id===userId && s.metadata?.attempt_id===old.attempt_id && s.status==='expired' && s.payment_status==='unpaid' && s.subscription===null
}
export async function reconcileExpiredStripeReservations(db:SupabaseClient,userId:string):Promise<'OK'|'STRIPE_RESERVATION_PENDING'|'STRIPE_RESERVATION_UNAVAILABLE'> {
 const {data,error}=await db.from('billing_stripe_checkout_attempts').select('attempt_id,status,stripe_session_id,updated_at').eq('user_id',userId).in('status',['reserved','sending','created','review']).limit(21)
 if(error||!Array.isArray(data)||data.length>20)return 'STRIPE_RESERVATION_UNAVAILABLE'
 if(!data.length)return 'OK'
 const key=process.env.STRIPE_LIVE_SECRET_KEY
 if(!/^(sk|rk)_live_/.test(key||''))return 'STRIPE_RESERVATION_UNAVAILABLE'
 for(const old of data){
  if(old.status!=='created'||typeof old.stripe_session_id!=='string'||!/^cs_live_[A-Za-z0-9]+$/.test(old.stripe_session_id))return 'STRIPE_RESERVATION_PENDING'
  let session:any
  try{
   const r=await fetch('https://api.stripe.com/v1/checkout/sessions/'+encodeURIComponent(old.stripe_session_id),{headers:{Authorization:'Bearer '+key},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)})
   if(!r.ok)return 'STRIPE_RESERVATION_UNAVAILABLE'
   session=await r.json()
  }catch{return 'STRIPE_RESERVATION_UNAVAILABLE'}
  if(!expiredUnpaidStripeSession(session,old,userId))return 'STRIPE_RESERVATION_PENDING'
  // CAS impede sobrescrever qualquer mudança concorrente na reserva. Gatilho existente protege a nova compra.
  const {data:saved,error:saveError}=await db.from('billing_stripe_checkout_attempts').update({status:'expired',updated_at:new Date().toISOString()}).eq('attempt_id',old.attempt_id).eq('user_id',userId).eq('status','created').eq('stripe_session_id',old.stripe_session_id).eq('updated_at',old.updated_at).select('attempt_id').maybeSingle()
  if(saveError||!saved)return 'STRIPE_RESERVATION_UNAVAILABLE'
 }
 return 'OK'
}
