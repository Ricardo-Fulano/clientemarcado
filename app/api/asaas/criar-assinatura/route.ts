import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { criarOuReutilizarCheckout } from '../../../lib/asaas-checkout'

// Cria OU REUTILIZA o checkout do Asaas (idempotente: nunca duplica cliente nem assinatura).
// Toda a logica esta em app/lib/asaas-checkout.ts; aqui so autenticamos o usuario (Bearer).
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const r = await criarOuReutilizarCheckout({ supabase, env: process.env as Record<string, string | undefined> }, { userId: user.id, email: user.email ?? null, body })
    return NextResponse.json(r.body, { status: r.status })
  } catch (err) {
    console.error('[Asaas] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
