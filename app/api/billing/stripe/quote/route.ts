import {NextRequest,NextResponse} from 'next/server'
import {approvedPrice} from '../../../../lib/billing/stripe/live-catalog'
import {stripeLiveReadiness} from '../../../../lib/billing/stripe/live-readiness'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const out=(v:Record<string,unknown>,status=200)=>NextResponse.json(v,{status,headers:{'Cache-Control':'no-store'}})
/** Cotação pública somente de itens explicitamente aprovados, nunca da tabela indicativa Paddle. */
export function GET(req:NextRequest){
 const p=req.nextUrl.searchParams
 const plan=p.get('plan')||'',cycle=p.get('cycle')||'',country=(p.get('country')||'').toUpperCase()
 const item=approvedPrice(plan,cycle,country)
 if(!item)return out({available:false,reason:'PRICE_NOT_APPROVED'},404)
 return out({available:true,plan:item.plan,cycle:item.cycle,country:item.country,currency:item.currency,amountMinor:item.amountMinor,checkoutEnabled:stripeLiveReadiness().ready})
}
