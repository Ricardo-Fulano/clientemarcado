import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const userId = user.id
    const payload: any = {
      reason: 'ClienteMarcado - Plano Mensal',
      external_reference: userId,
      back_url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://clientemarcado.com.br') + '/painel?pagamento=sucesso',
      auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: 79.90, currency_id: 'BRL' },
      payer_email: user.email,
    }
    console.log('[MP] user_id:', userId)
    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.MP_ACCESS_TOKEN },
      body: JSON.stringify(payload),
    })
    const mpData = await mpResponse.json()
    console.log('[MP] status:', mpResponse.status, JSON.stringify(mpData))
    if (!mpResponse.ok || !mpData.init_point) return NextResponse.json({ error: 'Erro MP' }, { status: 500 })
    return NextResponse.json({ init_point: mpData.init_point, id: mpData.id })
  } catch (err) {
    console.error('[MP] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
