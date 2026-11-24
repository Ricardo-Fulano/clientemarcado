import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { approvedPrice } from '../../../../lib/billing/stripe/live-catalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const respond = (data: Record<string, unknown>, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
const set = (v: unknown) => typeof v === 'string' && v.trim().length > 0

// SOMENTE LEITURA: recupera a escolha de uma tentativa Stripe anterior deste usuario.
// Nao cria sessao, nao marca pagamento, nao altera plano, nao toca no Asaas.
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token || token.length > 8192) return respond({ pending: false }, 401)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !secret) return respond({ pending: false }, 503)
  try {
    const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: { user }, error: authError } = await auth.auth.getUser(token)
    if (authError || !user) return respond({ pending: false }, 401)
    const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: profile, error: profileError } = await db.from('perfis')
      .select('plano_tipo,status_acesso,primeiro_pagamento_confirmado,gateway,gateway_customer_id,gateway_subscription_id,mp_subscription_id')
      .eq('user_id', user.id).maybeSingle()
    if (profileError) return respond({ pending: false }, 503)
    if (!profile || profile.primeiro_pagamento_confirmado === true ||
        set(profile.gateway) || set(profile.gateway_customer_id) ||
        set(profile.gateway_subscription_id) || set(profile.mp_subscription_id) ||
        !(profile.plano_tipo === 'free' &&
          (profile.status_acesso === 'ativo' || profile.status_acesso === 'aguardando_pagamento')))
      return respond({ pending: false })
    const { data: subs, error: subsError } = await db.from('billing_subscriptions').select('id')
      .eq('user_id', user.id)
      .in('status', ['active','trialing','past_due','pending','incomplete','unpaid'])
      .limit(1)
    if (subsError) return respond({ pending: false }, 503)
    if (subs?.length) return respond({ pending: false })
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: attempts, error: attemptsError } = await db.from('billing_stripe_checkout_attempts')
      .select('plan_code,billing_cycle,country,status,created_at')
      .eq('user_id', user.id).in('status', ['created','sending','reserved'])
      .gte('created_at', cutoff).order('created_at', { ascending: false }).limit(10)
    if (attemptsError) return respond({ pending: false }, 503)
    for (const a of attempts || []) {
      const plan = String(a.plan_code || '')
      const cycle = String(a.billing_cycle || '')
      const country = String(a.country || '').toUpperCase()
      if (country === 'BR' || !/^[A-Z]{2}$/.test(country)) continue
      if (!['minipage','agenda','loja','essencial'].includes(plan) || !['mensal','anual'].includes(cycle)) continue
      if (!approvedPrice(plan, cycle, country)) continue
      return respond({ pending: true, plan, cycle, country })
    }
    return respond({ pending: false })
  } catch {
    return respond({ pending: false }, 503)
  }
}
