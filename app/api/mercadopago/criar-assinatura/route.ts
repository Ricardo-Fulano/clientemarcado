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

    // Le o plano do perfil. Mesma logica de criacao pro Essencial e pro Equipe -
    // so mudam reason/transaction_amount. Nao usa preapproval_plan_id (isso exigiria
    // card_token_id/Bricks na Mercado Pago, que decidimos nao implementar agora).
    const { data: perfil } = await supabase.from('perfis').select('plano_tipo').eq('user_id', userId).single()
    const planoTipo = perfil?.plano_tipo === 'equipe' ? 'equipe' : 'essencial'

    const reason = planoTipo === 'equipe' ? 'ClienteMarcado - Plano Equipe' : 'ClienteMarcado - Plano Mensal'
    const transactionAmount = planoTipo === 'equipe' ? 149.90 : 79.90

    const payload: any = {
      reason,
      external_reference: userId,
      payer_email: user.email,
      back_url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://clientemarcado.com.br') + '/painel?pagamento=sucesso',
      auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: transactionAmount, currency_id: 'BRL' },
    }
    console.log('[MP] user_id:', userId, '| plano_tipo:', planoTipo, '| valor:', transactionAmount)
    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.MP_ACCESS_TOKEN },
      body: JSON.stringify(payload),
    })
    const mpData = await mpResponse.json()
    console.log('[MP] status:', mpResponse.status, JSON.stringify(mpData))
    if (!mpResponse.ok || !mpData.init_point) return NextResponse.json({ error: 'Erro MP', plano_tipo: planoTipo }, { status: 500 })
    return NextResponse.json({ init_point: mpData.init_point, id: mpData.id })
  } catch (err) {
    console.error('[MP] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
