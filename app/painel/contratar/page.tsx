'use client'
import {useEffect,useState,type CSSProperties} from 'react'
import {supabase} from '../../lib/supabase'
import Link from 'next/link'

type Quote={available?:boolean;checkoutEnabled?:boolean;currency?:string;amountMinor?:number;reason?:string}
const supported=["AR", "BO", "BR", "BZ", "CL", "CO", "CR", "DE", "ES", "FR", "GT", "HN", "MX", "NI", "PA", "PE", "PT", "PY", "SV", "US"]
const plans=['minipage','agenda','loja','essencial'] as const
type Plan=(typeof plans)[number]
const labels:Record<Plan,string>={minipage:'MiniPage',agenda:'Agenda',loja:'Loja',essencial:'Pro'}
const legalCountries=new Set<string>(supported)
export default function ContratarStripe(){
 const [plan,setPlan]=useState<Plan>('minipage')
 const [cycle,setCycle]=useState<'mensal'|'anual'>('mensal')
 const [country,setCountry]=useState('BR')
 const [quote,setQuote]=useState<Quote|null>(null)
 const [loading,setLoading]=useState(true)
 const [sending,setSending]=useState(false)
 const [error,setError]=useState('')
 const [allowed,setAllowed]=useState(false)
 const [cancelled,setCancelled]=useState(false)
 useEffect(()=>{
   const params=new URLSearchParams(window.location.search)
   const p=params.get('plan'),c=params.get('cycle'),ct=(params.get('country')||'BR').toUpperCase()
   if(params.get('stripe_return')==='cancel')setCancelled(true)
   if(p&&plans.includes(p as Plan))setPlan(p as Plan)
   if(c==='anual'||c==='mensal')setCycle(c)
   if(legalCountries.has(ct))setCountry(ct)
 },[])
 useEffect(()=>{
   let active=true
   const task=async()=>{
    setLoading(true);setError('');setQuote(null)
    try{
     const {data:{user}}=await supabase.auth.getUser()
     if(!user)throw new Error('Entre na sua conta antes de contratar.')
     const {data:profile,error:profileError}=await supabase.from('perfis')
       .select('plano_tipo,status_acesso,primeiro_pagamento_confirmado,gateway,gateway_customer_id,gateway_subscription_id,mp_subscription_id')
       .eq('user_id',user.id).maybeSingle()
     if(profileError||!profile)throw new Error('Seu perfil ainda não está pronto.')
     const isFree=profile.plano_tipo==='free' && profile.status_acesso==='ativo' && !profile.primeiro_pagamento_confirmado &&
       !profile.gateway && !profile.gateway_customer_id && !profile.gateway_subscription_id && !profile.mp_subscription_id
     if(active)setAllowed(Boolean(isFree))
     if(!isFree)throw new Error('Sua conta já possui vínculo financeiro ou plano pago. Solicite mudanças pelo suporte.')
     const response=await fetch(`/api/billing/stripe/quote?plan=${encodeURIComponent(plan)}&cycle=${encodeURIComponent(cycle)}&country=${encodeURIComponent(country)}`,{cache:'no-store'})
     const data=await response.json() as Quote
     if(!response.ok||data.available!==true||!data.currency||typeof data.amountMinor!=='number')throw new Error('Este país ou plano ainda não possui preço aprovado.')
     if(active)setQuote(data)
    }catch(e){if(active)setError(e instanceof Error?e.message:'Não foi possível consultar o preço.')}
    finally{if(active)setLoading(false)}
   }
   void task()
   return ()=>{active=false}
 },[plan,cycle,country])
 const start=async()=>{
   if(!allowed||!quote?.checkoutEnabled||loading||sending)return
   setSending(true);setError('')
   try{
     const {data:{session}}=await supabase.auth.getSession()
     if(!session?.access_token)throw new Error('Sua sessão expirou. Entre novamente.')
     const attemptId=crypto.randomUUID()
     const response=await fetch('/api/billing/stripe/live-checkout',{
       method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},
       body:JSON.stringify({attemptId,country,cycle,plan}),cache:'no-store'
     })
     const data=await response.json() as {state?:string;checkoutUrl?:string;error?:string;reason?:string}
     if(response.ok&&data.state==='ready'&&data.checkoutUrl?.startsWith('https://checkout.stripe.com/')){
       window.location.assign(data.checkoutUrl);return
     }
     if(data.state==='pending_review')throw new Error('A solicitação ficou pendente de verificação. NÃO tente cobrar novamente: procure o suporte para conferir a tentativa.')
     throw new Error(data.error==='EXISTING_BILLING_RELATIONSHIP'?'Esta conta já tem vínculo financeiro. Não foi criada uma nova assinatura.':'Não foi possível abrir o checkout. Nenhuma nova tentativa deve ser feita até verificar a situação.')
   }catch(e){setError(e instanceof Error?e.message:'Não foi possível iniciar o checkout.');setSending(false)}
 }
 return <main style={{minHeight:'100vh',background:'#0B0A10',color:'#FFFFFF',padding:'38px 16px',fontFamily:'system-ui,-apple-system,sans-serif'}}>
  <section style={{maxWidth:650,margin:'0 auto',background:'#21182D',border:'1px solid #483756',padding:24,borderRadius:20}}>
   <Link href="/painel/plano" style={{color:'#C9FA45'}}>← Meu plano</Link>
   <h1 style={{fontSize:27,margin:'20px 0 8px'}}>Contratar MiniPage Pro</h1>
   <p style={{color:'#D4CADD',fontSize:13,lineHeight:1.6}}>O pagamento é realizado com segurança na Stripe. Seu plano só muda após confirmação pelo servidor.</p>
   <label style={{display:'block',marginTop:22,fontWeight:700,fontSize:13}}>Plano</label>
   <select value={plan} onChange={e=>setPlan(e.target.value as Plan)} style={selectStyle}>
    {plans.map(p=><option key={p} value={p}>{labels[p]}</option>)}
   </select>
   <label style={{display:'block',marginTop:16,fontWeight:700,fontSize:13}}>Ciclo</label>
   <select value={cycle} onChange={e=>setCycle(e.target.value as 'mensal'|'anual')} style={selectStyle}><option value="mensal">Mensal</option><option value="anual">Anual</option></select>
   <label style={{display:'block',marginTop:16,fontWeight:700,fontSize:13}}>País de cobrança</label>
   <select value={country} onChange={e=>setCountry(e.target.value)} style={selectStyle}>
    {supported.map(c=><option key={c} value={c}>{new Intl.DisplayNames(['pt-BR'],{type:'region'}).of(c)} ({c})</option>)}
   </select>
   <div style={{margin:'22px 0',padding:18,background:'#150F1D',borderRadius:12,border:'1px solid #493855'}}>
    <p style={{fontSize:12,color:'#CFC1D9',margin:0}}>Total {cycle==='mensal'?'por mês':'por ano'}</p>
    <strong style={{fontSize:28}}>{loading?'Consultando...':quote?new Intl.NumberFormat('pt-BR',{style:'currency',currency:quote.currency}).format((quote.amountMinor||0)/100):'Indisponível'}</strong>
    <p style={{fontSize:12,color:'#CFC1D9'}}>O país informado deverá corresponder ao seu endereço de cobrança real.</p>
   </div>
   {cancelled&&<p role="status" style={{color:'#F9DB9D',fontSize:13}}>Você saiu do checkout. Antes de tentar novamente, confira sua assinatura ou solicite suporte.</p>}
   {error&&<p role="alert" style={{color:'#FFC7C7',fontSize:13,lineHeight:1.6}}>{error}</p>}
   {!quote?.checkoutEnabled&&<p role="status" style={{fontSize:13,color:'#F9DB9D',lineHeight:1.6}}>Checkout temporariamente indisponível enquanto concluímos a homologação financeira. Nenhuma cobrança foi criada.</p>}
   <button type="button" disabled={!allowed||!quote?.checkoutEnabled||loading||sending} onClick={()=>void start()}
    style={{width:'100%',padding:16,border:0,borderRadius:11,background:'#C9FA45',color:'#0B0A10',fontWeight:850,fontSize:14,opacity:!allowed||!quote?.checkoutEnabled||loading||sending?.45:1,cursor:!allowed||!quote?.checkoutEnabled||loading||sending?'not-allowed':'pointer'}}>
     {sending?'Preparando checkout...':'Continuar para pagamento seguro'}
   </button>
   <p style={{fontSize:11,color:'#BDB1C9',lineHeight:1.55}}>Contas já vinculadas ao Asaas ou a outra assinatura não podem gerar uma segunda assinatura neste fluxo.</p>
  </section>
 </main>
}
const selectStyle:CSSProperties={width:'100%',padding:'12px 13px',marginTop:7,borderRadius:10,border:'1px solid #5F4D71',background:'#150F1D',color:'#FFFFFF',fontSize:14}
