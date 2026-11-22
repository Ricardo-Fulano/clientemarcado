import { NextResponse } from 'next/server'
export const dynamic='force-dynamic'
/** Nao revela chaves, IDs financeiros ou estado de clientes. */
export function GET(){
  return NextResponse.json({
    stripe:'prepared',
    liveCheckoutEnabled:false,
    webhookIngestEnabled:process.env.STRIPE_LIVE_WEBHOOK_INGEST_ENABLED==='true' && process.env.VERCEL_ENV==='production',
    accessActivationEnabled:false,
  },{headers:{'Cache-Control':'no-store'}})
}
