import { createHmac, timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { POST as orchestrate } from '../orchestrate/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const json = (body: Record<string, unknown>, status: number) => NextResponse.json(body, {status,headers:{'Cache-Control':'no-store'}})
const relevantEvents = new Set([
  'checkout.session.completed', 'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed', 'invoice.paid', 'invoice.payment_failed',
  'customer.subscription.created', 'customer.subscription.updated',
  'customer.subscription.deleted', 'charge.refunded', 'charge.dispute.created',
])

/** Ingestao conservadora: autentica e registra evento, mas NAO altera plano/assinatura. */
export async function POST(request: NextRequest) {
  if (process.env.STRIPE_LIVE_WEBHOOK_INGEST_ENABLED !== 'true' || process.env.VERCEL_ENV !== 'production')
    return json({error:'WEBHOOK_DESABILITADO'},503)
  const secret=process.env.STRIPE_LIVE_WEBHOOK_SECRET
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole=process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret?.startsWith('whsec_') || !supabaseUrl || !serviceRole)
    return json({error:'CONFIG_INCOMPLETA'},503)
  const sig=request.headers.get('stripe-signature')
  if (!sig) return json({error:'ASSINATURA_AUSENTE'},400)
  const body=await request.text()
  if (Buffer.byteLength(body)>512_000) return json({error:'CORPO_MUITO_GRANDE'},413)
  const pieces=sig.split(',').map(v=>v.trim())
  const stamp=pieces.find(v=>/^t=\d+$/.test(v))?.slice(2)
  const signatures=pieces.filter(v=>/^v1=[a-f0-9]{64}$/i.test(v)).map(v=>v.slice(3))
  const timestamp=Number(stamp)
  if (!stamp || !signatures.length || !Number.isSafeInteger(timestamp) || Math.abs(Math.floor(Date.now()/1000)-timestamp)>300)
    return json({error:'ASSINATURA_INVALIDA'},400)
  const digest=createHmac('sha256',secret).update(`${stamp}.${body}`,'utf8').digest()
  const valid=signatures.some(hex=>{
    const supplied=Buffer.from(hex,'hex')
    return supplied.length===digest.length && timingSafeEqual(supplied,digest)
  })
  if (!valid) return json({error:'ASSINATURA_INVALIDA'},400)
  let event: Record<string,unknown>
  try {event=JSON.parse(body) as Record<string,unknown>}
  catch {return json({error:'EVENTO_INVALIDO'},400)}
  const id=event.id, type=event.type
  const obj=((event.data as {object?:{id?:unknown}}|undefined)?.object)
  if (typeof id!=='string' || !/^evt_[a-zA-Z0-9]+$/.test(id) || typeof type!=='string' || event.livemode!==true)
    return json({error:'EVENTO_NAO_LIVE_OU_INVALIDO'},400)
  if (!relevantEvents.has(type)) return json({ok:true,ignored:true},200)
  const admin=createClient(supabaseUrl,serviceRole,{auth:{autoRefreshToken:false,persistSession:false}})
  const {error}=await admin.from('billing_stripe_inbox').insert({
    event_id:id,event_type:type,object_id:typeof obj?.id==='string'?obj.id:null,
    livemode:true,signature_verified:true,processing_status:'received',
  })
  if (error && error.code!=='23505') return json({error:'PERSISTENCIA_INDISPONIVEL'},503)
  // Fast path opt-in. O registro é durável ANTES de qualquer processamento.
  // Em falha, 503 solicita retry da Stripe; a reserva atômica impede duplicação.
  if(process.env.MP_STRIPE_WEBHOOK_SYNC_DISPATCH_ENABLED==='true'){
    const dispatchSecret=process.env.MP_STRIPE_ORCHESTRATION_SECRET
    if(!dispatchSecret||dispatchSecret.length<32)return json({error:'DISPATCH_CONFIG_MISSING'},503)
    // Retentativas de eventos ja concluídos não devem voltar a processar o pagamento.
    if(error?.code==='23505'){
      const {data:stored,error:readError}=await admin.from('billing_stripe_inbox')
        .select('processing_status').eq('event_id',id).maybeSingle()
      if(readError)return json({error:'INBOX_READ_FAILED'},503)
      if(stored&&['verified','review','ignored'].includes(stored.processing_status))return json({ok:true,duplicate:true,handled:true},200)
    }
    const internal=new NextRequest('https://minipage.pro/api/billing/stripe/orchestrate',{
      method:'POST',headers:{authorization:`Bearer ${dispatchSecret}`,'content-type':'application/json'},
      body:JSON.stringify({eventId:id})
    })
    try{
      const result=await orchestrate(internal)
      if(!result.ok)return json({error:'DISPATCH_UNAVAILABLE'},503)
      const {data:stored,error:readError}=await admin.from('billing_stripe_inbox')
        .select('processing_status').eq('event_id',id).maybeSingle()
      if(readError||!stored||stored.processing_status==='received')return json({error:'EVENT_PENDING_RETRY_OR_MANUAL_REVIEW'},503)
      return json({ok:true,recorded:true,processed:stored.processing_status==='verified',status:stored.processing_status},200)
    }catch{return json({error:'DISPATCH_FAILED'},503)}
  }
  // Somente ingere quando fast path está desativado; cron de recuperação será necessário.
  return json({ok:true,recorded:true,duplicate:Boolean(error)},200)
}
export async function GET(){return json({error:'METODO_NAO_PERMITIDO'},405)}
