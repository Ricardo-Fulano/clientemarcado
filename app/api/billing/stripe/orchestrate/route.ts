import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { POST as invoicePaid } from '../invoice-paid/route'
import { POST as lifecycle } from '../lifecycle/route'
import { POST as reconcile } from '../reconcile/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const reply = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, {status,headers:{'Cache-Control':'no-store'}})
const eventIdPattern = /^evt_[A-Za-z0-9]+$/
const lifecycleTypes = new Set(['customer.subscription.updated','customer.subscription.deleted','invoice.payment_failed'])
const reviewTypes = new Set(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','customer.subscription.created','charge.refunded','charge.dispute.created'])
// Somente falhas anteriores a qualquer RPC de efeito financeiro.
// Depois de uma operacao incerta, a reserva permanece retida para revisao humana.
const safeBeforeWriteFailures=new Set([
  'ATTEMPT_NOT_READY','ATTEMPT_UNAVAILABLE','INVOICE_NOT_PAID',
  'SUBSCRIPTION_NOT_CURRENT','NO_ATTEMPT_METADATA','SUBSCRIPTION_MISSING',
  'SUBSCRIPTION_NOT_FOUND','SUBSCRIPTION_PERIOD_MISSING','INVOICE_ID_INVALID',
  'EVENT_NOT_VERIFIED','EVENT_NOT_AUTHENTICATED',
])
/** Desativada por padrao. Nao faz checkout nem recebe eventos sem assinatura.
 * Apenas despacha eventos previamente autenticados na inbox Stripe Live.
 * IMPORTANTE: habilitacao exige validacao operacional e autorizacao especifica.
 */
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'production' || process.env.MP_STRIPE_ORCHESTRATION_ENABLED !== 'true') return reply({error:'ORCHESTRATION_DISABLED'},503)
  const token = process.env.MP_STRIPE_ORCHESTRATION_SECRET
  if (!token || token.length < 32 || request.headers.get('authorization') !== `Bearer ${token}`) return reply({error:'UNAUTHORIZED'},401)
  if (process.env.MP_STRIPE_RECONCILE_READINESS_ENABLED !== 'true') return reply({error:'RECONCILIATION_NOT_READY'},503)
  // Sem a função transacional de reserva instalada, não processar eventos em paralelo.
  if (process.env.MP_STRIPE_ATOMIC_CLAIM_ENABLED !== 'true') return reply({error:'ATOMIC_CLAIM_DISABLED'},503)
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, role=process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !role) return reply({error:'DB_CONFIG_MISSING'},503)
  // O webhook chama com apenas um eventId; o cron, sem corpo, processa uma fila curta.
  let requestedEventId=''
  try {
    const raw=await request.text()
    if(raw){
      const data:unknown=JSON.parse(raw)
      if(!data||typeof data!=='object'||Array.isArray(data))return reply({error:'INVALID_REQUEST'},422)
      const obj=data as Record<string,unknown>
      if(Object.keys(obj).length!==1||typeof obj.eventId!=='string'||!eventIdPattern.test(obj.eventId))return reply({error:'INVALID_EVENT_ID'},422)
      requestedEventId=obj.eventId
    }
  }catch{return reply({error:'INVALID_REQUEST'},422)}
  const db=createClient(url,role,{auth:{persistSession:false,autoRefreshToken:false}})
  let query=db.from('billing_stripe_inbox')
    .select('event_id,event_type,signature_verified,livemode,processing_status')
    .eq('processing_status','received').eq('signature_verified',true).eq('livemode',true)
  if(requestedEventId)query=query.eq('event_id',requestedEventId)
  const {data, error} = await query.order('created_at',{ascending:true}).limit(requestedEventId?1:5)
  if (error) return reply({error:'INBOX_UNAVAILABLE'},503)
  const results: Array<{eventId:string;handler:string;outcome:string}> = []
  for (const event of data ?? []) {
    const eventId=event.event_id, type=event.event_type
    if (typeof eventId!=='string' || !eventIdPattern.test(eventId) || typeof type!=='string') continue
    // Reserva transacional por evento: somente uma execução recebe a posse.
    // A função SQL só reserva registros autenticados que continuam 'received'.
    // Não ocorre retomada automática de reservas antigas; recuperação exige auditoria manual.
    const leaseToken=randomUUID()
    const {data:claimed,error:claimError}=await db.rpc('mp_stripe_claim_event_v2',{p_event_id:eventId,p_claim_token:leaseToken})
    if (claimError) return reply({error:'ATOMIC_CLAIM_UNAVAILABLE'},503)
    if (claimed!==true) {results.push({eventId,handler:'claim',outcome:'already_claimed_or_handled'});continue}
    let releaseWithoutDispatch=false
    let finished=false
    try {
    let handler='review', fn:typeof reconcile= reconcile, secret=process.env.MP_STRIPE_RECONCILE_SECRET
    if (type==='invoice.paid') {
      handler='invoice-paid'; fn=invoicePaid; secret=process.env.MP_STRIPE_INVOICE_ROUTER_SECRET
      if (process.env.MP_STRIPE_INVOICE_ROUTER_ENABLED!=='true') {releaseWithoutDispatch=true;results.push({eventId,handler,outcome:'disabled'});continue}
    } else if (lifecycleTypes.has(type)) {
      handler='lifecycle'; fn=lifecycle; secret=process.env.MP_STRIPE_LIFECYCLE_SECRET
      if (process.env.MP_STRIPE_LIFECYCLE_ENABLED!=='true') {releaseWithoutDispatch=true;results.push({eventId,handler,outcome:'disabled'});continue}
    } else if (!reviewTypes.has(type)) {
      releaseWithoutDispatch=true;results.push({eventId,handler:'unsupported',outcome:'needs_review'});continue
    }
    if (!secret || secret.length < 32) {releaseWithoutDispatch=true;results.push({eventId,handler,outcome:'missing_secret'});continue}
    try {
      const synthetic=new NextRequest('https://minipage.pro/api/billing/stripe/'+handler,{
        method:'POST',headers:{authorization:`Bearer ${secret}`,'content-type':'application/json',...(handler==='review'?{'x-mp-claim-token':leaseToken}:{})},
        body:JSON.stringify({eventId})
      })
      const res=await fn(synthetic)
      const payload=await res.json() as {ok?:boolean;result?:string;decision?:string;error?:string}
      if (!res.ok || payload.ok!==true) {
        // A Stripe reenviara eventos recebidos com HTTP 503. Somente quando o
        // handler informa explicitamente falha anterior a qualquer escrita
        // financeira e seguro soltar a reserva e permitir nova tentativa.
        if(typeof payload.error==='string'&&safeBeforeWriteFailures.has(payload.error)){
          releaseWithoutDispatch=true
          results.push({eventId,handler,outcome:'safe_retry_before_write'})
        }else results.push({eventId,handler,outcome:'held_for_manual_review'})
        continue
      }
      // NUNCA marcar como verificado somente porque a rota retornou HTTP 200.
      // Cada processador deve confirmar explicitamente o desfecho conhecido.
      const settled = handler==='invoice-paid' && (payload.result==='applied' || payload.result==='already_applied')
      const lifecycleApplied = handler==='lifecycle' && (payload.result==='updated' || payload.result==='already_applied')
      const nextStatus = settled || lifecycleApplied ? 'verified'
        : handler==='review' && payload.decision==='ignored' ? 'ignored' : 'review'
      // A conclusão e a liberação da reserva ocorrem na mesma transação SQL.
      // Nenhuma execução sem o token proprietário pode concluir o evento.
      const {data:completed,error:completeError}=await db.rpc('mp_stripe_finish_event_v2',{
        p_event_id:eventId,p_claim_token:leaseToken,p_next_status:nextStatus
      })
      finished=!completeError && completed===true
      results.push({eventId,handler,outcome:finished?(nextStatus==='verified'?'processed':nextStatus==='ignored'?'ignored':'reviewed'):'held_for_review'})
    } catch {
      results.push({eventId,handler,outcome:'retry_or_review'})
    }
    } finally {
      // Falhas depois do despacho podem envolver efeitos financeiros ja aplicados.
      // NUNCA reatribuir automaticamente uma reserva incerta por TTL.
      // Somente bloqueios ANTES do despacho liberam a reserva para nova tentativa.
      if (!finished && releaseWithoutDispatch) {
        await db.rpc('mp_stripe_release_event_v2',{p_event_id:eventId,p_claim_token:leaseToken})
      }
    }
  }
  return reply({ok:true,processed:results.filter(x=>x.outcome==='processed').length,examined:results.length,results,checkoutChanged:false},200)
}
export async function GET(){return reply({error:'METHOD_NOT_ALLOWED'},405)}
