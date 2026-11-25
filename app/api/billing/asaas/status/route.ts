import {NextResponse} from 'next/server'
import {admin,authenticated,getAttempt,publicAttempt,attemptTable,configured} from '../../../../lib/billing/asaas/recorrente'
import {reconcileExistingAttempt} from '../../../../lib/billing/asaas/webhook-recorrente'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(req:Request){try{
 const user=await authenticated(req);if(!user)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});
 if(process.env.MP_ASAAS_RECURRING_SCHEMA_ENABLED!=='true')return NextResponse.json({attempt:null},{headers:{'Cache-Control':'no-store'}})
 const db=admin(),a=await getAttempt(db,user.id);let paidUntil:string|null=null,expired=false
 if(a?.initial_payment_id){const {data,error}=await db.from('billing_subscriptions').select('current_period_end,status').eq('id',a.attempt_id).eq('user_id',user.id).maybeSingle();if(error)throw new Error('DB_READ');paidUntil=data?.current_period_end||null;expired=data?.status==='expired'}
 return NextResponse.json({attempt:a?{...publicAttempt(a),paidUntil,...(expired?{state:'expired',renewalActive:false}: {})}:null},{headers:{'Cache-Control':'no-store'}})
}catch{return NextResponse.json({error:'TEMPORARILY_UNAVAILABLE'},{status:503})}}

export async function POST(req:Request){try{
 const user=await authenticated(req);if(!user)return NextResponse.json({error:'UNAUTHENTICATED'},{status:401});
 if(!configured())return NextResponse.json({error:'TEMPORARILY_UNAVAILABLE'},{status:503});
 const db=admin(),a=await getAttempt(db,user.id);if(!a)return NextResponse.json({attempt:null});
 const now=new Date(),cutoff=new Date(now.getTime()-60000).toISOString();
 const {data,error}=await db.from(attemptTable).update({last_reconciled_at:now.toISOString()}).eq('attempt_id',a.attempt_id).eq('user_id',user.id).or('last_reconciled_at.is.null,last_reconciled_at.lt.'+cutoff).select('attempt_id').maybeSingle();
 if(error||!data)return NextResponse.json({error:'RECONCILIATION_COOLDOWN'},{status:429});
 await reconcileExistingAttempt(db,a);return GET(req);
}catch{return NextResponse.json({error:'RECONCILIATION_REQUIRES_REVIEW'},{status:503})}}
