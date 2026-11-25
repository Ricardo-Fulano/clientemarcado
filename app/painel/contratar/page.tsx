'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useIdiomaGlobal } from '../../components/IdiomaProviderGlobal'
import { textoCheckout } from '../../lib/i18n-global/checkout-copy'
import { asaasCopy } from '../../lib/i18n-global/asaas-copy'
import { supabase } from '../../lib/supabase'

type Plan = 'minipage' | 'agenda' | 'loja' | 'essencial'
type Cycle = 'mensal' | 'anual'
type Market = 'BR' | 'INTL'
type Quote = {
  available?: boolean
  checkoutEnabled?: boolean
  currency?: string
  amountMinor?: number
  reason?: string
  methods?: { card: boolean; pix: boolean }
}
type AsaasAttempt = { attemptId:string; plan:Plan; cycle:Cycle; method:'card'|'pix'; state:string; renewalActive:boolean; paymentConfirmed:boolean; checkoutUrl?:string; qrImage?:string; qrPayload?:string; expires?:string; paidUntil?:string }
const PLANS: { code: Plan; name: string; description: string }[] = [
  { code: 'minipage', name: 'MiniPage', description: 'Links, vídeo, destaques, Spotify e presença profissional.' },
  { code: 'agenda', name: 'Agenda', description: 'Tudo do MiniPage, com agendamentos e serviços.' },
  { code: 'loja', name: 'Loja', description: 'Tudo do Agenda, com catálogo e links para vendas externas.' },
  { code: 'essencial', name: 'Pro', description: 'Tudo do Loja, com gestão de clientes, financeiro e relatórios.' },
]
const planCodes: Plan[] = PLANS.map(p => p.code)
const selectStyle: CSSProperties = {
  background: '#150F1D', color: '#fff', border: '1px solid #564369', padding: '11px 12px',
  borderRadius: 10, fontSize: 14,
}
const btnStyle: CSSProperties = { padding: '12px 16px', borderRadius: 11, fontWeight: 800, cursor: 'pointer' }

function money(q: Quote | undefined, idioma: string): string {
  if (!q || q.available !== true || !q.currency || !Number.isSafeInteger(q.amountMinor)) return textoCheckout(idioma, 6)
  try {
    return new Intl.NumberFormat(idioma, { style: 'currency', currency: q.currency, currencyDisplay: 'code' }).format((q.amountMinor || 0) / 100)
  } catch { return textoCheckout(idioma, 6) }
}

// ATENÇÃO: US é apenas a referência técnica de preço do catálogo único USD,
// e NUNCA representa o país de residência ou o endereço real do cliente.
// O endereço de faturamento é preenchido na Stripe (billing_address_collection=required).
const PRICE_REFERENCE: Record<Market, 'BR' | 'US'> = { BR: 'BR', INTL: 'US' }

export default function EscolherPlanosParaContratar() {
  const { idioma } = useIdiomaGlobal()
  const [initialized, setInitialized] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [market, setMarket] = useState<Market>('BR')
  const [cycle, setCycle] = useState<Cycle>('mensal')
  const [preferred, setPreferred] = useState<Plan>('minipage')
  const [quotes, setQuotes] = useState<Partial<Record<Plan, Quote>>>({})
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState<Plan | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const [method, setMethod] = useState<''|'card'|'pix'>('')
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [consent, setConsent] = useState(false)
  const [attempt, setAttempt] = useState<AsaasAttempt|null>(null)
  const [checking,setChecking]=useState(false)
  const [copied, setCopied] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const t = (i:number) => asaasCopy(idioma,i)
  useEffect(()=>{setConsent(false)},[cycle,method,market])
  useEffect(()=>{
    if(!initialized||market!=='BR')return
    let alive=true
    const poll=async()=>{try{
      const {data:{session}}=await supabase.auth.getSession();if(!session)return
      const r=await fetch('/api/billing/asaas/status',{cache:'no-store',headers:{Authorization:`Bearer ${session.access_token}`}})
      if(r.ok){const data=await r.json();if(alive){setAttempt(data.attempt||null);if(data.attempt)setUncertain(false)}}
    }catch{/* Never create another charge because polling failed. */}}
    void poll();const timer=window.setInterval(()=>void poll(),6000)
    return()=>{alive=false;window.clearInterval(timer)}
  },[initialized,market])

  useEffect(() => {
    const url = new URLSearchParams(window.location.search)
    const p = url.get('plan')
    if (p && planCodes.includes(p as Plan)) setPreferred(p as Plan)
    const c = url.get('cycle')
    if (c === 'mensal' || c === 'anual') setCycle(c)
    const marketParam = (url.get('market') || '').toUpperCase()
    const oldCountry = (url.get('country') || '').toUpperCase()
    setMarket(marketParam === 'INTL' || (oldCountry && oldCountry !== 'BR') ? 'INTL' : 'BR')
    setCancelled(url.get('stripe_return') === 'cancel')
    setConfirm((url.get('confirm') === '1' || url.get('stripe_return') === 'cancel') && !!p && planCodes.includes(p as Plan) && (c === 'mensal' || c === 'anual'))
    setInitialized(true)
  }, [])

  useEffect(() => {
    if (!initialized) return
    let active = true
    setLoading(true)
    setError('')
    setQuotes({})
    const task = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error(textoCheckout(idioma, 7))
        const { data: profile, error: profileError } = await supabase.from('perfis')
          .select('plano_tipo,status_acesso,primeiro_pagamento_confirmado,gateway,gateway_customer_id,gateway_subscription_id,mp_subscription_id')
          .eq('user_id', user.id).maybeSingle()
        if (profileError || !profile) throw new Error(textoCheckout(idioma, 8))
        const free = profile.plano_tipo === 'free' &&
          ['ativo', 'aguardando_pagamento'].includes(profile.status_acesso) &&
          !profile.primeiro_pagamento_confirmado && !profile.gateway &&
          !profile.gateway_customer_id && !profile.gateway_subscription_id && !profile.mp_subscription_id
        if (active) setAllowed(free)
        if (!free) throw new Error(textoCheckout(idioma, 9))
        const { data: { session } } = await supabase.auth.getSession()
        const headers: HeadersInit = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
        const results = await Promise.all(PLANS.map(async item => {
          const url = `/api/billing/stripe/quote?plan=${item.code}&cycle=${cycle}&country=${PRICE_REFERENCE[market]}`
          const response = await fetch(url, { cache: 'no-store', headers })
          const q = await response.json() as Quote
          return [item.code, response.ok ? q : { available: false }] as const
        }))
        if (active) setQuotes(Object.fromEntries(results) as Partial<Record<Plan, Quote>>)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : textoCheckout(idioma, 10))
      } finally { if (active) setLoading(false) }
    }
    void task()
    return () => { active = false }
  }, [market, cycle, idioma, initialized])

  const checkout = async (plan: Plan) => {
    const q = quotes[plan]
    if (!allowed || q?.checkoutEnabled !== true || sending || loading) return
    if(market==='BR'&&(!method||!q.methods?.[method]||!consent||attempt||uncertain))return
    setSending(plan)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error(textoCheckout(idioma, 11))
      if(market==='BR'){
        setConsent(false)
        setUncertain(true)
        const r=await fetch('/api/billing/asaas/checkout',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({plan,cycle,method,name,cpf,consent:true})})
        const d=await r.json()
        if(d.attemptId||d.attempt){const a:AsaasAttempt=d.attempt||d;setAttempt(a);setUncertain(false);if(a.checkoutUrl?.startsWith('https://asaas.com/checkoutSession/show?id=')){window.location.assign(a.checkoutUrl);return}}
        else if(r.status===422){setUncertain(false);throw new Error(t(18))}
        else if(r.status===409||r.status===202){setError(t(16))}
        else{setError(t(19))}
        setSending(null);return
      }
      const response = await fetch('/api/billing/stripe/live-checkout', {
        method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ attemptId: crypto.randomUUID(), country: PRICE_REFERENCE.INTL, cycle, plan, locale: idioma === 'pt-BR' ? idioma : idioma.split('-')[0] }),
      })
      const data = await response.json() as { state?: string; checkoutUrl?: string; error?: string; reason?: string }
      if (response.ok && data.state === 'ready' && data.checkoutUrl?.startsWith('https://checkout.stripe.com/')) {
        window.location.assign(data.checkoutUrl)
        return
      }
      if (data.state === 'pending_review') throw new Error(textoCheckout(idioma, 12))
      const explanations: Record<string, string> = {
        LIVE_CHECKOUT_TEST_ONLY: textoCheckout(idioma, 13),
        PREVIOUS_CHECKOUT_REQUIRES_REVIEW: textoCheckout(idioma, 14),
        PREVIOUS_CHECKOUT_STATUS_UNAVAILABLE: textoCheckout(idioma, 15),
        EXISTING_BILLING_RELATIONSHIP: textoCheckout(idioma, 16),
        BRAZIL_USES_ASAAS: textoCheckout(idioma, 17),
        STRIPE_PRICE_MISMATCH: textoCheckout(idioma, 18),
      }
      const code = typeof data.error === 'string' && /^[A-Z][A-Z0-9_]{2,75}$/.test(data.error) ? data.error : 'UNAVAILABLE'
      throw new Error((explanations[code] || textoCheckout(idioma, 19)) + ` (${code})`)
    } catch (e) {
      setError(e instanceof Error ? e.message : textoCheckout(idioma, 20))
      setSending(null)
    }
  }

  if (!initialized) return <main style={{padding:24,color:'#FFFFFF',background:'#0B0A10'}} role="status">{textoCheckout(idioma, 36)}</main>

  return <main style={{ minHeight: '100vh', padding: '42px 16px', background: '#0B0A10', color: '#FFFFFF', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
    <section style={{ maxWidth: 990, margin: '0 auto' }}>
      <Link href="/painel/criar-minipage" style={{ color: '#C9FA45', fontSize: 13, textDecoration: 'none' }}>{textoCheckout(idioma, 21)}</Link>
      <h1 style={{ fontSize: 28, margin: '20px 0 10px', fontWeight: 850 }}>{confirm ? textoCheckout(idioma, 23) : textoCheckout(idioma, 22)}</h1>
      <p style={{ color: '#D4CADD', lineHeight: 1.6, fontSize: 14, maxWidth: 700 }}>
        {textoCheckout(idioma, 25)}
      </p>
      {!confirm && <div style={{ background: '#21182D', padding: 20, border: '1px solid #483756', borderRadius: 18, marginTop: 24 }}>
        <p style={{ fontWeight: 800, margin: '0 0 12px' }}>{textoCheckout(idioma, 26)}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => { if (market !== 'BR') { setLoading(true); setQuotes({}); setMarket('BR') } }} disabled={!!sending} aria-pressed={market === 'BR'}
            style={{ ...btnStyle, border: market === 'BR' ? '1px solid #C9FA45' : '1px solid #66546F', color: market === 'BR' ? '#0B0A10' : '#FFF', background: market === 'BR' ? '#C9FA45' : '#150F1D' }}>
            {textoCheckout(idioma, 27)}
          </button>
          <button type="button" onClick={() => { if (market !== 'INTL') { setLoading(true); setQuotes({}); setMarket('INTL') } }} disabled={!!sending} aria-pressed={market === 'INTL'}
            style={{ ...btnStyle, border: market === 'INTL' ? '1px solid #C9FA45' : '1px solid #66546F', color: market === 'INTL' ? '#0B0A10' : '#FFF', background: market === 'INTL' ? '#C9FA45' : '#150F1D' }}>
            {textoCheckout(idioma, 28)}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#D4CADD', lineHeight: 1.6, margin: '14px 0 0' }}>
          {market === 'BR'
            ? t(0)
            : textoCheckout(idioma, 30)}
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <label htmlFor="mp-cycle" style={{ fontSize: 13, fontWeight: 700 }}>{textoCheckout(idioma, 31)}</label>
          <select id="mp-cycle" disabled={!!sending} value={cycle} onChange={e => { setLoading(true); setQuotes({}); setCycle(e.target.value as Cycle) }} style={selectStyle}>
            <option value="mensal">{textoCheckout(idioma, 32)}</option>
            <option value="anual">{textoCheckout(idioma, 33)}</option>
          </select>
        </div>
      </div>}
      {cancelled && <p role="status" style={{ color: '#F9DB9D', fontSize: 13, lineHeight: 1.5 }}>
        {textoCheckout(idioma, 34)}
      </p>}
      {market==='BR'&&attempt&&<section style={{background:'#21182D',border:'1px solid #9552F5',padding:20,borderRadius:16,marginTop:16}}>
        <h2 style={{fontSize:20}}>{attempt.state==='expired'?t(23):attempt.paymentConfirmed?t(12):t(7)}</h2>
        <p>{PLANS.find(p=>p.code===attempt.plan)?.name} · {attempt.cycle==='mensal'?textoCheckout(idioma,4):textoCheckout(idioma,5)}</p>
        {attempt.state==='expired'?<><p>{t(24)}</p><Link href="/painel/suporte" style={{color:'#C9FA45'}}>{t(25)}</Link></>:attempt.paymentConfirmed?<><p>{attempt.renewalActive?t(13):t(14)}</p>{attempt.paidUntil&&<p>{t(17)} {new Date(attempt.paidUntil).toLocaleDateString(idioma,{timeZone:'America/Sao_Paulo'})}</p>}<Link href="/painel" style={{color:'#C9FA45'}}>{t(20)}</Link></>:<>
        {attempt.qrImage&&attempt.qrPayload&&<><p>{t(8)}</p><img alt="Pix QR Code" src={'data:image/png;base64,'+attempt.qrImage} style={{width:240,maxWidth:'100%',background:'#fff',padding:8}}/><p>{t(21)}: {attempt.expires}</p><textarea readOnly value={attempt.qrPayload} aria-label={t(9)} style={{...selectStyle,width:'100%',boxSizing:'border-box',height:75}}/><button type="button" style={{...btnStyle,background:'#C9FA45',color:'#0B0A10',border:0}} onClick={async()=>{try{await navigator.clipboard.writeText(attempt.qrPayload!);setCopied(true)}catch{setCopied(false)}}}>{copied?t(10):t(9)}</button></>}
        {attempt.checkoutUrl?.startsWith('https://asaas.com/checkoutSession/show?id=')&&<p><a href={attempt.checkoutUrl} style={{color:'#C9FA45'}}>{t(11)}</a></p>}
        <button type="button" disabled={checking} style={{...btnStyle,background:'#21182D',color:'#C9FA45',border:'1px solid #9552F5'}} onClick={async()=>{setChecking(true);setError('');try{const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error(t(16));const r=await fetch('/api/billing/asaas/status',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`}});if(!r.ok)throw new Error(t(16));const d=await r.json();setAttempt(d.attempt||null);setUncertain(false)}catch{setError(t(16))}finally{setChecking(false)}}}>{checking?t(19):t(22)}</button>
        <p role="status">{attempt.state==='review'?t(16):t(15)}</p></>}
      </section>}
      {market==='BR'&&allowed&&!attempt&&!uncertain&&!loading&&Object.values(quotes).some(q=>q?.checkoutEnabled)&&<section style={{background:'#21182D',padding:20,borderRadius:16,marginTop:16,display:'grid',gap:12}}>
        <h2 style={{fontSize:18,margin:0}}>{t(0)}</h2>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>{(['card','pix'] as const).filter(m=>Object.values(quotes).some(q=>q?.methods?.[m])).map(m=><label key={m}><input type="radio" name="asaas-method" checked={method===m} disabled={!!sending} onChange={()=>setMethod(m)}/> {t(m==='card'?1:2)}</label>)}</div>
        <label>{t(3)}<input autoComplete="name" maxLength={150} value={name} onChange={e=>{setName(e.target.value);setConsent(false)}} style={{...selectStyle,display:'block',width:'100%',boxSizing:'border-box'}}/></label>
        <label>{t(4)}<input inputMode="numeric" maxLength={18} value={cpf} onChange={e=>{setCpf(e.target.value);setConsent(false)}} style={{...selectStyle,display:'block',width:'100%',boxSizing:'border-box'}}/></label>
        <label><input type="checkbox" checked={consent} disabled={!method||!!sending} onChange={e=>setConsent(e.target.checked)}/> {t(5)}</label>
      </section>}
      {market==='BR'&&!loading&&allowed&&!attempt&&!Object.values(quotes).some(q=>q?.checkoutEnabled)&&<p role="status">{t(6)}</p>}
      {market==='BR'&&uncertain&&!attempt&&<p role="status">{t(16)}</p>}
      {error && !attempt?.paymentConfirmed && <p role="alert" style={{ color: '#FFC7C7', fontSize: 13, padding: '12px 0', lineHeight: 1.6 }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginTop: 22 }}>
        {PLANS.filter(item => !confirm || item.code === preferred).map(item => {
          const q = quotes[item.code]
          const canBuy = allowed && q?.checkoutEnabled === true && !loading && !sending && (market==='INTL'||!!method&&!!q.methods?.[method]&&consent&&name.trim().length>=3&&[11,14].includes(cpf.replace(/\D/g,'').length)&&!attempt&&!uncertain)
          return <article key={item.code} style={{ background: '#21182D', border: item.code === preferred ? '1px solid #C9FA45' : '1px solid #483756', padding: 20, borderRadius: 17, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#C9FA45', minHeight: 16 }}>{item.code === preferred ? textoCheckout(idioma, 35) : ''}</div>
            <h2 style={{ fontSize: 20, margin: 0 }}>{item.code === 'loja' ? textoCheckout(idioma, 67) : item.name}</h2>
            <p style={{ margin: 0, color: '#D4CADD', lineHeight: 1.5, fontSize: 13, minHeight: 58 }}>{[textoCheckout(idioma, 49),textoCheckout(idioma, 50),textoCheckout(idioma, 51),textoCheckout(idioma, 52)][planCodes.indexOf(item.code)]}</p>
            <strong style={{ fontSize: 25 }}>{loading ? textoCheckout(idioma, 36) : money(q, idioma)}</strong>
            <span style={{ color: '#D4CADD', fontSize: 12 }}>{cycle === 'mensal' ? textoCheckout(idioma, 4) : textoCheckout(idioma, 5)}</span>
            <p style={{margin:0,color:'#D4CADD',fontSize:12,lineHeight:1.5}}>{textoCheckout(idioma, 63)}</p>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',fontSize:12}}><Link target="_blank" href="/termos-de-uso" style={{color:'#C9FA45'}}>{textoCheckout(idioma, 64)}</Link><Link target="_blank" href="/politica-de-privacidade" style={{color:'#C9FA45'}}>{textoCheckout(idioma, 65)}</Link><Link target="_blank" href="/politica-de-reembolso" style={{color:'#C9FA45'}}>{textoCheckout(idioma, 66)}</Link></div>
            <button type="button" disabled={!canBuy} onClick={() => void checkout(item.code)}
              style={{ ...btnStyle, width: '100%', marginTop: 'auto', background: '#C9FA45', border: 0, color: '#0B0A10', opacity: canBuy ? 1 : .55, cursor: canBuy ? 'pointer' : 'not-allowed' }}>
              {sending === item.code ? textoCheckout(idioma, 40) : market==='BR'&&!q?.checkoutEnabled ? t(6) : textoCheckout(idioma, 41)}
            </button>
          </article>
        })}
      </div>
      {market === 'INTL' && !loading && allowed && !(confirm ? quotes[preferred]?.checkoutEnabled === true : Object.values(quotes).some(q => q?.checkoutEnabled === true)) &&
        <p style={{ fontSize: 13, color: '#F9DB9D', lineHeight: 1.6 }}>{textoCheckout(idioma, 42)}</p>}
      <p style={{ color: '#BDB1C9', fontSize: 12, marginTop: 20, lineHeight: 1.6 }}>{textoCheckout(idioma, 43)}</p>
      <Link href="/painel" style={{ color: '#D4CADD', fontSize: 13 }}>{textoCheckout(idioma, 44)}</Link>
    </section>
  </main>
}
