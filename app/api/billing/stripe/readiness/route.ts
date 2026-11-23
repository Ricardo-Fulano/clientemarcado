import {NextRequest,NextResponse} from 'next/server'
import {stripeLiveReadiness} from '../../../../lib/billing/stripe/live-readiness'
export const runtime='nodejs'
export const dynamic='force-dynamic'
/**
 * Diagnóstico restrito à presença/formato mínimo das configurações.
 * Não retorna valores, prefixos, comprimentos, tokens, usuários nem dados financeiros.
 * Mantém o readiness e o fail-closed originais; não ativa checkout.
 */
export function GET(request:NextRequest){
 const state=stripeLiveReadiness()
 const result:Record<string,unknown>={
  catalogo:'v1_aprovado',
  configuracaoCompleta:state.ready,
  processamentoConfigurado:state.flagsConfigured&&state.secretsConfigured,
  prontoParaCobrar:state.ready,
  observacao:'Requer homologação operacional e verificação de país/cobrança, além das flags.'
 }
 if(request.nextUrl.searchParams.get('diagnostico')==='1'){
  const tests:[string,boolean][]=[
   ['VERCEL_ENV_PRODUCTION',process.env.VERCEL_ENV==='production'],
   ['STRIPE_LIVE_SECRET_KEY',process.env.STRIPE_LIVE_SECRET_KEY?.startsWith('sk_live_')===true],
   ['STRIPE_LIVE_WEBHOOK_SECRET',process.env.STRIPE_LIVE_WEBHOOK_SECRET?.startsWith('whsec_')===true],
   ['NEXT_PUBLIC_SUPABASE_URL',Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)],
   ['NEXT_PUBLIC_SUPABASE_ANON_KEY',Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)],
   ['SUPABASE_SERVICE_ROLE_KEY',Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)],
   ['STRIPE_LIVE_RETURN_ORIGIN',process.env.STRIPE_LIVE_RETURN_ORIGIN==='https://minipage.pro']
  ]
  result.requisitosBasicosPendentes=tests.filter(([,ok])=>!ok).map(([name])=>name)
 }
 return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}})
}
