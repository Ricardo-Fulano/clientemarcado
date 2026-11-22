import { NextRequest, NextResponse } from 'next/server'
import { POST as orchestrate } from '../orchestrate/route'
export const runtime='nodejs'
export const dynamic='force-dynamic'
/** Endpoint para Vercel Cron; requer CRON_SECRET e flags explicitas.
 * A instalacao NAO adiciona agenda nem habilita processamento de eventos.
 */
export async function GET(request:NextRequest){
 if(process.env.VERCEL_ENV!=='production'||process.env.MP_STRIPE_CRON_ENABLED!=='true')
  return NextResponse.json({error:'CRON_DISABLED'},{status:503})
 const cronSecret=process.env.CRON_SECRET
 if(!cronSecret||cronSecret.length<32||request.headers.get('authorization')!==`Bearer ${cronSecret}`)
  return NextResponse.json({error:'UNAUTHORIZED'},{status:401})
 const dispatchSecret=process.env.MP_STRIPE_ORCHESTRATION_SECRET
 if(!dispatchSecret||dispatchSecret.length<32)return NextResponse.json({error:'DISPATCH_NOT_CONFIGURED'},{status:503})
 const inner=new NextRequest('https://minipage.pro/api/billing/stripe/orchestrate',{
  method:'POST',headers:{authorization:`Bearer ${dispatchSecret}`}
 })
 return orchestrate(inner)
}
export async function POST(){return NextResponse.json({error:'METHOD_NOT_ALLOWED'},{status:405})}
