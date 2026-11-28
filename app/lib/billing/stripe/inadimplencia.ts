import type {SupabaseClient} from '@supabase/supabase-js'
import {dataBrasilia,diasCalendarioAtraso} from '../../inadimplencia'
type O=Record<string,unknown>
const obj=(x:unknown):O=>x&&typeof x==='object'&&!Array.isArray(x)?x as O:{}
const str=(x:unknown)=>typeof x==='string'?x:''
const stamp=(x:unknown)=>typeof x==='number'&&Number.isSafeInteger(x)&&x>0&&x<4102444800?new Date(x*1000).toISOString():null
const id=(x:unknown,p:string)=>typeof x==='string'&&new RegExp('^'+p+'_[A-Za-z0-9]+$').test(x)
export function provaAtrasoStripe(sub:O,inv:O,s:O,paidUntil:string,agora=Date.now()){
 const customer=str(s.provider_customer_id),subscription=str(s.provider_subscription_id)
 if(sub.livemode!==true||inv.livemode!==true||sub.id!==subscription||sub.customer!==customer||!['past_due','unpaid'].includes(str(sub.status))||sub.latest_invoice!==inv.id||!id(inv.id,'in')||inv.customer!==customer||inv.status!=='open'||inv.billing_reason!=='subscription_cycle'||inv.paid===true||typeof inv.amount_remaining!=='number'||!Number.isSafeInteger(inv.amount_remaining)||inv.amount_remaining<=0||inv.amount_paid!==0||str(inv.currency).toUpperCase()!==s.currency)return null
 if((str(inv.subscription)||str(obj(obj(inv.parent).subscription_details).subscription))!==subscription)return null
 const items=obj(sub.items).data,lines=obj(inv.lines).data
 if(!Array.isArray(items)||items.length!==1||!Array.isArray(lines)||lines.length!==1||obj(inv.lines).has_more===true)return null
 const item=obj(items[0]),price=obj(item.price),line=obj(lines[0]),period=obj(line.period)
 const priceId=str(price.id),linePrice=str(obj(line.price).id)||str(obj(obj(line.pricing).price_details).price)
 if(!id(priceId,'price')||linePrice!==priceId||price.unit_amount!==s.contracted_amount_minor||str(price.currency).toUpperCase()!==s.currency||item.quantity!==1||line.quantity!==1)return null
 const rec=obj(price.recurring);if(rec.interval_count!==1||rec.interval!==(s.billing_cycle==='anual'?'year':'month'))return null
 const start=stamp(period.start),end=stamp(period.end)
 if(!start||!end||Date.parse(end)<=Date.parse(start)||!Number.isFinite(Date.parse(paidUntil))||Date.parse(start)<Date.parse(paidUntil)||Date.parse(start)>agora||Date.parse(paidUntil)>agora)return null
 const due=inv.collection_method==='send_invoice'?stamp(inv.due_date):inv.collection_method==='charge_automatically'&&inv.attempted===true?stamp(obj(inv.status_transitions).finalized_at):null
 if(!due)return null
 const date=dataBrasilia(new Date(Math.max(Date.parse(due),Date.parse(start),Date.parse(paidUntil))).toISOString())
 if(!date||(diasCalendarioAtraso(date,agora)??0)<1)return null
 return {invoice:str(inv.id),due:date,periodStart:start,status:str(sub.status),priceId}
}
export async function executarAtrasoStripe(db:SupabaseClient){
 const key=process.env.STRIPE_LIVE_SECRET_KEY
 const execute=process.env.MP_STRIPE_DOWNGRADE_AUTOMATICO_ENABLED==='true'
 const summary={mode:execute?'execucao':'simulacao',examined:0,downgraded:0,warning:0,review:0,simulation:0,skip:0}
 if(!/^(sk|rk)_live_/.test(key||''))throw Error('STRIPE_LIVE_KEY_MISSING')
 const get=async(path:string)=>{const res=await fetch('https://api.stripe.com/v1/'+path,{headers:{authorization:`Bearer ${key}`},cache:'no-store',signal:AbortSignal.timeout(7000)});if(!res.ok)throw Error('STRIPE_READ_FAILED');const v=obj(await res.json());if(v.livemode!==true)throw Error('NOT_LIVE');return v}
 const started=Date.now()
 const {data,error}=await db.rpc('mp26_stripe_candidatos',{p_limit:20})
 if(error)throw Error('STRIPE_BATCH_READ_FAILED')
 for(const s of data||[]){if(Date.now()-started>20000)break;summary.examined++
  try{
   const {error:touch}=await db.from('billing_subscriptions').update({mp26_checked_at:new Date().toISOString()}).eq('id',s.id).eq('provider','stripe');if(touch)throw Error('ROTATION_FAILED')
   const {data:p,error:pe}=await db.from('perfis').select('plano_tipo,status_acesso,plano_ativo_ate,gateway,gateway_subscription_id,motivo_downgrade').eq('user_id',s.user_id).single()
   if(pe)throw Error('PROFILE_READ_FAILED');if(!p||p.gateway!=='stripe'||p.gateway_subscription_id!==s.provider_subscription_id||p.plano_tipo!==s.plan_code||!['ativo','em_atraso'].includes(p.status_acesso)||!p.plano_ativo_ate||Date.parse(p.plano_ativo_ate)>Date.now()){summary.skip++;continue}
   const sid=str(s.provider_subscription_id);if(!id(sid,'sub'))throw Error('INVALID_SUBSCRIPTION')
   const sub=await get('subscriptions/'+encodeURIComponent(sid));if(!['past_due','unpaid'].includes(str(sub.status))||!id(sub.latest_invoice,'in')){summary.skip++;continue}
   const iid=str(sub.latest_invoice),invoice=await get('invoices/'+encodeURIComponent(iid)),proof=provaAtrasoStripe(sub,invoice,s,p.plano_ativo_ate)
   if(!proof){summary.review++;continue}
   const {data:contract,error:ce}=await db.from('billing_stripe_checkout_attempts').select('attempt_id').eq('user_id',s.user_id).eq('status','created').eq('stripe_price_id',proof.priceId).eq('plan_code',s.plan_code).eq('billing_cycle',s.billing_cycle).eq('currency',s.currency).eq('amount_minor',s.contracted_amount_minor).limit(1)
   if(ce||!contract?.length){summary.review++;continue}
   // Re-read the same current provider objects immediately before transactional compare-and-set.
   const sub2=await get('subscriptions/'+encodeURIComponent(sid)),inv2=await get('invoices/'+encodeURIComponent(iid)),final=provaAtrasoStripe(sub2,inv2,s,p.plano_ativo_ate)
   if(!final||JSON.stringify(final)!==JSON.stringify(proof)){summary.review++;continue}
   const {data:result,error:err}=await db.rpc('mp26_stripe_atraso',{p_subscription:sid,p_customer:s.provider_customer_id,p_invoice:proof.invoice,p_due:proof.due,p_paid_until:p.plano_ativo_ate,p_period_start:proof.periodStart,p_live_status:proof.status,p_execute:execute})
   if(err)throw Error('STRIPE_DOWNGRADE_RPC_FAILED')
   if(result==='downgraded')summary.downgraded++;else if(result==='warning')summary.warning++;else if(String(result).startsWith('simulation_'))summary.simulation++;else summary.review++
  }catch{summary.review++}
 }
 return summary
}
