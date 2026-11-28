import type {SupabaseClient} from '@supabase/supabase-js'
import {asaas,attemptTable,configured,identifier,minor,type Attempt} from './recorrente'
import {reconcileExistingAttempt,readAuthorization,verifySubscription,verifyPayment} from './webhook-recorrente'
import {oitavoDiaAtraso} from '../../inadimplencia'
const terminalAuth = ['CANCELLED','EXPIRED','REFUSED']
const paid = ['CONFIRMED','RECEIVED']
export async function pertenceAoRecorrente(db:SupabaseClient,userId:string,customerId:string|null){
 if(!customerId)return false
 const {data,error}=await db.from(attemptTable).select('attempt_id').eq('user_id',userId).eq('customer_id',customerId).neq('status','closed').maybeSingle()
 if(error)throw new Error('RECURRING_LOOKUP_FAILED')
 return !!data
}
// A known inactive recurring contract may still have a payable outstanding charge.
export function podeExpirar(renovacaoInativa:boolean,periodEnd:string,agora:number,payments:{status:string}[]){
 return renovacaoInativa&&Number.isFinite(Date.parse(periodEnd))&&Date.parse(periodEnd)<=agora&&payments.length>0&&payments.every(p=>paid.includes(p.status))
}
async function revisarVigencia(db:SupabaseClient,a:Attempt){
 if(a.status!=='paid'||!a.initial_payment_id||!a.customer_id)return 'skip'
 const {data:s,error}=await db.from('billing_subscriptions').select('current_period_end,status').eq('id',a.attempt_id).eq('user_id',a.user_id).single()
 if(error||!s)throw new Error('CONTRACT_READ')
 if(s.status==='expired')return 'skip'
 if(!s.current_period_end||Date.parse(s.current_period_end)>Date.now())return 'skip'
 const auth=a.method==='pix'?await readAuthorization(a):null
 const sub=a.subscription_id?await verifySubscription(a,a.subscription_id):null
 // No subscription object is valid only for an initial Pix paid without active authorization.
 const inactive=a.method==='pix'?!!auth&&terminalAuth.includes(auth.status)&&(!sub||['INACTIVE','EXPIRED'].includes(sub.status)||sub.deleted===true):!!sub&&(['INACTIVE','EXPIRED'].includes(sub.status)||sub.deleted===true)
 const active=!!sub&&sub.status==='ACTIVE'&&sub.deleted!==true&&(a.method==='card'||auth?.status==='ACTIVE')
 const filter=a.hosted_card&&a.subscription_id?'subscription='+encodeURIComponent(a.subscription_id):'customer='+encodeURIComponent(a.customer_id);
 const list=await asaas('/payments?'+filter+'&limit=100')
 if(!Array.isArray(list.data)||list.hasMore!==false||!list.data.length||list.data.some((p:any)=>p.customer!==a.customer_id||!identifier(p.id)||minor(p.value)!==a.amount_minor))throw new Error('PAYMENT_LIST_REVIEW')
 if(active&&a.subscription_id){
  const due=list.data.filter((p:any)=>p.subscription===a.subscription_id&&p.status==='OVERDUE').sort((x:any,y:any)=>String(x.dueDate).localeCompare(String(y.dueDate)))[0]
  if(!due||!oitavoDiaAtraso(due.dueDate,Date.now()))return 'skip'
  if(list.data.some((p:any)=>paid.includes(p.status)&&String(p.dueDate)>=String(due.dueDate)))throw new Error('OVERDUE_PERIOD_REVIEW')
  await verifyPayment(db,a,due.id,'PAYMENT_OVERDUE')
  const p=await asaas('/payments/'+encodeURIComponent(due.id));if(p.id!==due.id||p.customer!==a.customer_id||p.subscription!==a.subscription_id||p.status!=='OVERDUE'||p.dueDate!==due.dueDate||p.deleted===true||minor(p.value)!==a.amount_minor)throw new Error('OVERDUE_REVALIDATION')
  const latest=await verifySubscription(a,a.subscription_id);if(latest.status!=='ACTIVE'||latest.deleted===true)throw new Error('SUBSCRIPTION_CHANGED')
  if(a.method==='pix'&&(await readAuthorization(a)).status!=='ACTIVE')throw new Error('AUTHORIZATION_CHANGED')
  if(process.env.ASAAS_DOWNGRADE_AUTOMATICO_ENABLED!=='true')return 'overdue_simulation'
  const {data,error}=await db.rpc('mp_asaas_downgrade_recurring_v3',{p_attempt:a.attempt_id,p_payment:p.id,p_due:p.dueDate,p_expected_end:s.current_period_end});if(error)throw new Error('DOWNGRADE_FAILED');return data?'downgraded':'skip'
 }
 if(!podeExpirar(inactive,s.current_period_end,Date.now(),list.data))return 'skip'
 // Read ledger for all charges. No unregistered payment can be ignored at expiration.
 const {data:ledger,error:le}=await db.from('billing_payments').select('provider_payment_id,status').eq('subscription_id',a.attempt_id).eq('provider','asaas');if(le)throw new Error('LEDGER_READ')
 if(list.data.some((p:any)=>!(ledger||[]).some(x=>x.provider_payment_id===p.id&&['confirmed','settled'].includes(x.status))))throw new Error('UNREGISTERED_PAYMENT')
 if(process.env.MP_ASAAS_EXPIRATION_ENABLED!=='true')return 'expiration_simulation'
 const {data,error:ee}=await db.rpc('mp_asaas_expire_access_v3',{p_attempt:a.attempt_id,p_expected_end:s.current_period_end});if(ee)throw new Error('EXPIRATION_FAILED');return data?'expired':'skip'
}
export async function executarCicloRecorrente(db:SupabaseClient){
 const summary={processed:0,review:0,expired:0,downgraded:0,simulation:0}
 if(!configured())return summary
 // Fair rotation; webhook remains primary. Bounded fallback for missing events, not high-frequency polling.
 const {data,error}=await db.from(attemptTable).select('*').neq('status','closed').order('last_reconciled_at',{ascending:true,nullsFirst:true}).limit(2)
 if(error)throw new Error('RECURRING_BATCH_READ')
 const overdue=await db.rpc('mp26_asaas_candidatos',{p_limit:6})
 // Schema ainda nao instalado: preservar a rotacao existente, mas nunca ignorar outros erros.
 if(overdue.error&&overdue.error.code!=='PGRST202')throw new Error('OVERDUE_ATTEMPTS_READ')
 const queue=[...new Map([...(overdue.error?[]:overdue.data||[]),...(data||[])].map(x=>[x.attempt_id,x])).values()]
 const started=Date.now()
 for(const row of queue){
  if(Date.now()-started>20000)break
  const a=row as Attempt
  try{
   const now=new Date(),cutoff=new Date(now.getTime()-60000).toISOString()
   const {data:claim,error:ce}=await db.from(attemptTable).update({last_reconciled_at:now.toISOString()}).eq('attempt_id',a.attempt_id).or('last_reconciled_at.is.null,last_reconciled_at.lt.'+cutoff).select('attempt_id').maybeSingle();if(ce)throw new Error('CLAIM_FAILED');if(!claim)continue
   const {data:contract,error:contractError}=await db.from('billing_subscriptions').select('status').eq('id',a.attempt_id).maybeSingle();if(contractError)throw new Error('CONTRACT_READ')
   if(contract?.status==='expired')continue
   await reconcileExistingAttempt(db,a)
   const {data:fresh,error:fe}=await db.from(attemptTable).select('*').eq('attempt_id',a.attempt_id).single();if(fe||!fresh)throw new Error('ATTEMPT_READ')
   const result=await revisarVigencia(db,fresh as Attempt);summary.processed++
   if(result==='expired')summary.expired++;if(result==='downgraded')summary.downgraded++;if(result.endsWith('_simulation'))summary.simulation++
  }catch(e){summary.review++;console.error('[ASAAS_RECURRING_CRON]',a.attempt_id,e instanceof Error?e.message:'UNKNOWN')}
 }
 return summary
}
