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
     if(!isFree)throw new Error('Esta conta já tem uma assinatura ou vínculo financeiro. Para evitar cobrança duplicada, consulte Meu Plano ou o suporte.')
     const {data:{session}}=await supabase.auth.getSession()
     const response=await fetch(`/api/billing/stripe/quote?plan=${encodeURIComponent(plan)}&cycle=${encodeURIComponent(cycle)}&country=${encodeURIComponent(country)}`,{
      cache:'no-store',headers:session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{},
     })
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
     // Mostra o motivo tecnico controlado que a API ja devolve. Nao mostra chaves, dados bancarios ou erros brutos da Stripe.
     const codigo=typeof data.error==='string'&&/^[A-Z][A-Z0-9_]{2,75}$/.test(data.error)?data.error:'UNKNOWN_CHECKOUT_ERROR'
     const mensagem=codigo==='EXISTING_BILLING_RELATIONSHIP'?'Esta conta já tem vínculo financeiro. Não foi criada uma nova assinatura.':codigo==='PREVIOUS_CHECKOUT_REQUIRES_REVIEW'?'A tentativa anterior exige revisão antes de iniciar outra cobrança.':codigo==='PREVIOUS_CHECKOUT_STATUS_UNAVAILABLE'?'Não foi possível consultar com segurança a sessão anterior na Stripe.':codigo==='PENDING_CHECK_UNAVAILABLE'?'Não foi possível consultar as tentativas anteriores na MiniPage.':codigo==='LIVE_CHECKOUT_TEST_ONLY'?'Esta conta não está autorizada para a fase restrita do checkout.':codigo==='STRIPE_PRICE_LOOKUP_FAILED'?'A Stripe não autorizou a consulta do preço; verifique a permissão da chave de produção.':codigo==='STRIPE_PRICE_MISMATCH'?'O preço retornado pela Stripe não corresponde ao catálogo aprovado.':codigo==='REGIONAL_PRICE_COUNTRY_MISMATCH'?'Preço regional incompatível. Confirme seu país de faturamento e atualize o preço.':codigo==='BILLING_COUNTRY_REQUIRED'?'Informe seu país real de faturamento.':codigo==='REGIONAL_LOCATION_REVIEW_REQUIRED'?'O país da sua conexão é diferente do país do preço escolhido. Para evitar abuso de preços regionais, esta contratação exige revisão. Se você mora no país selecionado e está viajando, contate o suporte.':codigo==='REGIONAL_LOCATION_UNKNOWN'?'Não conseguimos determinar o país da conexão com segurança. Solicite revisão antes de pagar.':codigo==='BRAZIL_USES_EBANX'?'No Brasil, o checkout pago será oferecido pela EBANX quando estiver disponível.':'Não foi possível abrir o checkout. Nenhuma nova cobrança foi iniciada por esta solicitação.'
     throw new Error(mensagem+' Código: '+codigo+'. Não repita a cobrança até verificar a situação.')
   }catch(e){setError(e instanceof Error?e.message:'Não foi possível iniciar o checkout.');setSending(false)}
 }
 return <main style={{minHeight:'100vh',background:'#0B0A10',color:'#FFFFFF',padding:'38px 16px',fontFamily:'system-ui,-apple-system,sans-serif'}}>
  <section style={{maxWidth:650,margin:'0 auto',background:'#21182D',border:'1px solid #483756',padding:24,borderRadius:20}}>
   <Link href="/painel/plano" style={{color:'#C9FA45'}}>← Meu plano</Link>
   <h1 style={{fontSize:27,margin:'20px 0 8px'}}>Contratar MiniPage Pro</h1>
   <p style={{color:'#D4CADD',fontSize:13,lineHeight:1.6}}>O pagamento internacional é realizado pela Stripe; no Brasil, a EBANX será utilizada quando estiver habilitada. O plano só muda após pagamento confirmado.</p>
   <label style={{display:'block',marginTop:22,fontWeight:700,fontSize:13}}>Plano</label>
   <select value={plan} onChange={e=>{setPlan(e.target.value as Plan);setCancelled(false)}} style={selectStyle}>
    {plans.map(p=><option key={p} value={p}>{labels[p]}</option>)}
   </select>
   <label style={{display:'block',marginTop:16,fontWeight:700,fontSize:13}}>Ciclo</label>
   <select value={cycle} onChange={e=>{setCycle(e.target.value as 'mensal'|'anual');setCancelled(false)}} style={selectStyle}><option value="mensal">Mensal</option><option value="anual">Anual</option></select>
   <label style={{display:'block',marginTop:16,fontWeight:700,fontSize:13}}>País da oferta e moeda</label>
   <select value={country} onChange={e=>{setCountry(e.target.value);setCancelled(false);setError('')}} style={selectStyle}>
    {supported.map(c=><option key={c} value={c}>{new Intl.DisplayNames(['pt-BR'],{type:'region'}).of(c)} ({c})</option>)}
   </select>
    <p style={{fontSize:12,color:'#D4CADD',lineHeight:1.6,marginTop:12}}>O valor e a moeda acima são os da oferta escolhida. Na Stripe, informe seu endereço real de faturamento. A aprovação depende também do cartão e das regras da Stripe.</p>
   <div style={{margin:'22px 0',padding:18,background:'#150F1D',borderRadius:12,border:'1px solid #493855'}}>
    <p style={{fontSize:12,color:'#CFC1D9',margin:0}}>Total {cycle==='mensal'?'por mês':'por ano'}</p>
    <strong style={{fontSize:28}}>{loading?'Consultando...':quote?new Intl.NumberFormat('pt-BR',{style:'currency',currency:quote.currency}).format((quote.amountMinor||0)/100):'Indisponível'}</strong>
    <p style={{fontSize:12,color:'#CFC1D9'}}>O preço e a moeda mostrados serão mantidos; informe o endereço real de faturamento na Stripe.</p>
   </div>
   {cancelled&&<p role="status" style={{color:'#F9DB9D',fontSize:13}}>Você voltou sem concluir o pagamento. Pode retomar a sessão ou escolher outro plano e país; verificaremos a tentativa anterior na Stripe antes de continuar.</p>}
   {error&&<p role="alert" style={{color:'#FFC7C7',fontSize:13,lineHeight:1.6}}>{error}</p>}
   {!quote?.checkoutEnabled&&<p role="status" style={{fontSize:13,color:'#F9DB9D',lineHeight:1.6}}>{country==='BR'?'Assinaturas pagas no Brasil serão processadas pela EBANX quando habilitada. Enquanto isso, não é possível contratar um plano pago em BRL.': quote?.reason==='REGIONAL_LOCATION_REVIEW_REQUIRED'?'País de conexão diferente do país selecionado. Para proteger os preços regionais, o checkout está suspenso até revisão. Se estiver viajando, procure o suporte.':quote?.reason==='REGIONAL_LOCATION_UNKNOWN'?'Não foi possível confirmar a região aproximada da conexão. O checkout requer revisão antes de criar uma cobrança.':'Checkout internacional indisponível para esta conta ou configuração neste momento. Nenhuma cobrança foi criada.'}</p>}
   <button type="button" disabled={!allowed||!quote?.checkoutEnabled||loading||sending} onClick={()=>void start()}
    style={{width:'100%',padding:16,border:0,borderRadius:11,background:'#C9FA45',color:'#0B0A10',fontWeight:850,fontSize:14,opacity:!allowed||!quote?.checkoutEnabled||loading||sending?.45:1,cursor:!allowed||!quote?.checkoutEnabled||loading||sending?'not-allowed':'pointer'}}>
     {sending?'Preparando checkout...':'Continuar para pagamento seguro'}
   </button>
    <Link href="/painel/criar-minipage" style={{display:'block',marginTop:14,padding:13,textAlign:'center',borderRadius:10,border:'1px solid #66546F',color:'#F8F4F7',textDecoration:'none',fontSize:13,fontWeight:700}}>← Voltar à MiniPage salva</Link>
   <p style={{fontSize:11,color:'#BDB1C9',lineHeight:1.55}}>Contas já vinculadas ao Asaas ou a outra assinatura não podem gerar uma segunda assinatura neste fluxo.</p>
  </section>
 </main>
}
const selectStyle:CSSProperties={width:'100%',padding:'12px 13px',marginTop:7,borderRadius:10,border:'1px solid #5F4D71',background:'#150F1D',color:'#FFFFFF',fontSize:14}
