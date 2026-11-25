import {NextRequest,NextResponse} from 'next/server'
import {approvedPrice} from '../../../../lib/billing/stripe/live-catalog'
import {stripeLiveReadiness} from '../../../../lib/billing/stripe/live-readiness'
import {admin,authenticated,allowedEmail,ready,methods,configured} from '../../../../lib/billing/asaas/recorrente'
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
 if(country==='BR'){
  let enabled=false;let publicCheckoutAvailable=false;const m=methods()
  if(configured()&&(m.card||m.pix)){
   try{
    const user=await authenticated(req)
    const publicEnabled=process.env.MP_ASAAS_PUBLIC_CHECKOUT_ENABLED==='true'
    const authorized=!!user&&allowedEmail(user.email)
    if(publicEnabled||authorized){
     const schemaReady=await ready(admin())
     publicCheckoutAvailable=publicEnabled&&schemaReady
     enabled=authorized&&schemaReady
    }
   }catch{enabled=false;publicCheckoutAvailable=false}
  }
  return out({available:true,plan:item.plan,cycle:item.cycle,country:item.country,currency:item.currency,amountMinor:item.amountMinor,checkoutEnabled:enabled,publicCheckoutAvailable,gateway:'asaas',methods:enabled?m:{card:false,pix:false},reason:enabled?null:'ASAAS_NOT_ENABLED'})
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
