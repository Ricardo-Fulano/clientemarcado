'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
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
}
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

function money(q: Quote | undefined): string {
  if (!q || q.available !== true || !q.currency || !Number.isSafeInteger(q.amountMinor)) return 'Indisponível'
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: q.currency }).format((q.amountMinor || 0) / 100)
  } catch { return 'Indisponível' }
}

// ATENÇÃO: US é apenas a referência técnica de preço do catálogo único USD,
// e NUNCA representa o país de residência ou o endereço real do cliente.
// O endereço de faturamento é preenchido na Stripe (billing_address_collection=required).
const PRICE_REFERENCE: Record<Market, 'BR' | 'US'> = { BR: 'BR', INTL: 'US' }

export default function EscolherPlanosParaContratar() {
  const [market, setMarket] = useState<Market>('BR')
  const [cycle, setCycle] = useState<Cycle>('mensal')
  const [preferred, setPreferred] = useState<Plan>('minipage')
  const [quotes, setQuotes] = useState<Partial<Record<Plan, Quote>>>({})
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState<Plan | null>(null)
  const [cancelled, setCancelled] = useState(false)

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
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setQuotes({})
    const task = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Entre na sua conta antes de contratar.')
        const { data: profile, error: profileError } = await supabase.from('perfis')
          .select('plano_tipo,status_acesso,primeiro_pagamento_confirmado,gateway,gateway_customer_id,gateway_subscription_id,mp_subscription_id')
          .eq('user_id', user.id).maybeSingle()
        if (profileError || !profile) throw new Error('Seu perfil ainda não está pronto.')
        const free = profile.plano_tipo === 'free' &&
          ['ativo', 'aguardando_pagamento'].includes(profile.status_acesso) &&
          !profile.primeiro_pagamento_confirmado && !profile.gateway &&
          !profile.gateway_customer_id && !profile.gateway_subscription_id && !profile.mp_subscription_id
        if (active) setAllowed(free)
        if (!free) throw new Error('Esta conta já possui plano pago ou vínculo financeiro. Para evitar cobrança duplicada, consulte Meu Plano ou o suporte.')
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
        if (active) setError(e instanceof Error ? e.message : 'Não foi possível consultar os planos.')
      } finally { if (active) setLoading(false) }
    }
    void task()
    return () => { active = false }
  }, [market, cycle])

  const checkout = async (plan: Plan) => {
    const q = quotes[plan]
    if (market !== 'INTL' || !allowed || q?.checkoutEnabled !== true || sending || loading) return
    setSending(plan)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sua sessão expirou. Faça login novamente.')
      const response = await fetch('/api/billing/stripe/live-checkout', {
        method: 'POST', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ attemptId: crypto.randomUUID(), country: PRICE_REFERENCE.INTL, cycle, plan }),
      })
      const data = await response.json() as { state?: string; checkoutUrl?: string; error?: string; reason?: string }
      if (response.ok && data.state === 'ready' && data.checkoutUrl?.startsWith('https://checkout.stripe.com/')) {
        window.location.assign(data.checkoutUrl)
        return
      }
      if (data.state === 'pending_review') throw new Error('Sua tentativa exige conferência antes de abrir outro pagamento. Nenhuma nova cobrança deve ser iniciada; procure o suporte.')
      const explanations: Record<string, string> = {
        LIVE_CHECKOUT_TEST_ONLY: 'As contratações internacionais ainda não foram abertas ao público.',
        PREVIOUS_CHECKOUT_REQUIRES_REVIEW: 'Existe uma tentativa anterior que precisa ser verificada antes de tentar novamente.',
        PREVIOUS_CHECKOUT_STATUS_UNAVAILABLE: 'Não foi possível confirmar a situação da tentativa anterior. Procure o suporte.',
        EXISTING_BILLING_RELATIONSHIP: 'Esta conta já possui um vínculo financeiro. Consulte Meu Plano.',
        BRAZIL_USES_EBANX: 'Contratações em reais utilizarão a EBANX quando estiver disponível.',
        STRIPE_PRICE_MISMATCH: 'O preço não foi confirmado na Stripe. Nenhuma nova cobrança foi iniciada.',
      }
      const code = typeof data.error === 'string' && /^[A-Z][A-Z0-9_]{2,75}$/.test(data.error) ? data.error : 'UNAVAILABLE'
      throw new Error((explanations[code] || 'Não foi possível abrir o checkout com segurança.') + ` Referência: ${code}.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao abrir o checkout.')
      setSending(null)
    }
  }

  return <main style={{ minHeight: '100vh', padding: '42px 16px', background: '#0B0A10', color: '#FFFFFF', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
    <section style={{ maxWidth: 990, margin: '0 auto' }}>
      <Link href="/painel/criar-minipage" style={{ color: '#C9FA45', fontSize: 13, textDecoration: 'none' }}>← Voltar à minha MiniPage salva</Link>
      <h1 style={{ fontSize: 28, margin: '20px 0 10px', fontWeight: 850 }}>Escolha seu plano MiniPage Pro</h1>
      <p style={{ color: '#D4CADD', lineHeight: 1.6, fontSize: 14, maxWidth: 700 }}>
        Sua MiniPage está salva. Escolha a modalidade e o plano; a assinatura só será ativada depois da confirmação do pagamento.
      </p>
      <div style={{ background: '#21182D', padding: 20, border: '1px solid #483756', borderRadius: 18, marginTop: 24 }}>
        <p style={{ fontWeight: 800, margin: '0 0 12px' }}>Como deseja contratar?</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setMarket('BR')} aria-pressed={market === 'BR'}
            style={{ ...btnStyle, border: market === 'BR' ? '1px solid #C9FA45' : '1px solid #66546F', color: market === 'BR' ? '#0B0A10' : '#FFF', background: market === 'BR' ? '#C9FA45' : '#150F1D' }}>
            🇧🇷 Brasil · R$
          </button>
          <button type="button" onClick={() => setMarket('INTL')} aria-pressed={market === 'INTL'}
            style={{ ...btnStyle, border: market === 'INTL' ? '1px solid #C9FA45' : '1px solid #66546F', color: market === 'INTL' ? '#0B0A10' : '#FFF', background: market === 'INTL' ? '#C9FA45' : '#150F1D' }}>
            🌍 Internacional · US$
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#D4CADD', lineHeight: 1.6, margin: '14px 0 0' }}>
          {market === 'BR'
            ? 'Os planos brasileiros são cobrados em reais pela EBANX, assim que a integração estiver disponível.'
            : 'Um único preço internacional em dólares. Você informará o país e o endereço verdadeiro de faturamento diretamente na Stripe. A Stripe não altera o preço em US$ conforme o país.'}
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <label htmlFor="mp-cycle" style={{ fontSize: 13, fontWeight: 700 }}>Cobrança</label>
          <select id="mp-cycle" value={cycle} onChange={e => setCycle(e.target.value as Cycle)} style={selectStyle}>
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
          </select>
        </div>
      </div>
      {cancelled && <p role="status" style={{ color: '#F9DB9D', fontSize: 13, lineHeight: 1.5 }}>
        Você voltou sem concluir o pagamento. Seu plano não foi ativado; pode escolher novamente. A tentativa anterior será verificada antes de abrir outra sessão.
      </p>}
      {error && <p role="alert" style={{ color: '#FFC7C7', fontSize: 13, padding: '12px 0', lineHeight: 1.6 }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginTop: 22 }}>
        {PLANS.map(item => {
          const q = quotes[item.code]
          const canBuy = market === 'INTL' && allowed && q?.checkoutEnabled === true && !loading && !sending
          return <article key={item.code} style={{ background: '#21182D', border: item.code === preferred ? '1px solid #C9FA45' : '1px solid #483756', padding: 20, borderRadius: 17, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#C9FA45', minHeight: 16 }}>{item.code === preferred ? 'Plano escolhido anteriormente' : ''}</div>
            <h2 style={{ fontSize: 20, margin: 0 }}>{item.name}</h2>
            <p style={{ margin: 0, color: '#D4CADD', lineHeight: 1.5, fontSize: 13, minHeight: 58 }}>{item.description}</p>
            <strong style={{ fontSize: 25 }}>{loading ? 'Consultando...' : money(q)}</strong>
            <span style={{ color: '#D4CADD', fontSize: 12 }}>Cobrança {cycle === 'mensal' ? 'mensal' : 'anual'}</span>
            <button type="button" disabled={!canBuy} onClick={() => void checkout(item.code)}
              style={{ ...btnStyle, width: '100%', marginTop: 'auto', background: '#C9FA45', border: 0, color: '#0B0A10', opacity: canBuy ? 1 : .55, cursor: canBuy ? 'pointer' : 'not-allowed' }}>
              {market === 'BR' ? 'EBANX em implantação' : sending === item.code ? 'Abrindo Stripe...' : 'Assinar com Stripe'}
            </button>
          </article>
        })}
      </div>
      {market === 'INTL' && !loading && allowed && !Object.values(quotes).some(q => q?.checkoutEnabled === true) &&
        <p style={{ fontSize: 13, color: '#F9DB9D', lineHeight: 1.6 }}>A contratação internacional ainda está restrita nesta conta ou configuração. Os valores podem ser consultados, mas nenhuma cobrança será iniciada.</p>}
      <p style={{ color: '#BDB1C9', fontSize: 12, marginTop: 20, lineHeight: 1.6 }}>Acesso Free permanece disponível para sua MiniPage salva. Contas com assinatura ou vínculo financeiro existente não podem gerar uma segunda assinatura neste fluxo.</p>
      <Link href="/painel" style={{ color: '#D4CADD', fontSize: 13 }}>Continuar usando meu plano atual</Link>
    </section>
  </main>
}
