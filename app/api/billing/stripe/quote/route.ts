import {NextRequest,NextResponse} from 'next/server'
import {approvedPrice} from '../../../../lib/billing/stripe/live-catalog'
import {stripeLiveReadiness} from '../../../../lib/billing/stripe/live-readiness'
import {verificarPaisIp} from '../../../../lib/billing/stripe/pais-ip-checkout'
import {createClient} from '@supabase/supabase-js'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const out=(v:Record<string,unknown>,status=200)=>NextResponse.json(v,{status,headers:{'Cache-Control':'no-store'}})
/** Cotação pública somente de itens explicitamente aprovados, nunca da tabela indicativa Paddle. */
export async function GET(req:NextRequest){
 const p=req.nextUrl.searchParams
 const plan=p.get('plan')||'',cycle=p.get('cycle')||'',country=(p.get('country')||'').toUpperCase()
 const item=approvedPrice(plan,cycle,country)
 if(!item)return out({available:false,reason:'PRICE_NOT_APPROVED'},404)
 // Fail closed: so a EBANX pode processar novas assinaturas BR.
 if(country==='BR')return out({available:true,plan:item.plan,cycle:item.cycle,country:item.country,currency:item.currency,amountMinor:item.amountMinor,checkoutEnabled:false,gateway:'ebanx',reason:'EBANX_NOT_ENABLED'})
 // Preco sempre visivel, mas nao permita checkout se a localizacao aproximada
 // do IP nao coincidir com o pais informado para obter preco regional.
 if(process.env.VERCEL_ENV==='production'){
  const decision=verificarPaisIp(country,req.headers.get('x-vercel-ip-country'))
  if(decision!=='match')return out({available:true,plan:item.plan,cycle:item.cycle,country:item.country,currency:item.currency,amountMinor:item.amountMinor,checkoutEnabled:false,reason:decision==='unknown'?'REGIONAL_LOCATION_UNKNOWN':'REGIONAL_LOCATION_REVIEW_REQUIRED'})
 }
 let checkoutEnabled=false
 if(stripeLiveReadiness().ready){
  if(process.env.MP_STRIPE_PUBLIC_CHECKOUT_ENABLED==='true')checkoutEnabled=true
  else {
   const email=(process.env.MP_STRIPE_TEST_ACCOUNT_EMAIL||'').trim().toLowerCase()
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   const bearer=req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
   if(email&&url&&anon&&bearer&&bearer.length<8192){
    try{
     const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}})
     const {data:{user}}=await client.auth.getUser(bearer)
     checkoutEnabled=Boolean(user&&user.email?.trim().toLowerCase()===email)
    }catch{checkoutEnabled=false}
   }
  }
 }
 return out({available:true,plan:item.plan,cycle:item.cycle,country:item.country,currency:item.currency,amountMinor:item.amountMinor,checkoutEnabled})
}
