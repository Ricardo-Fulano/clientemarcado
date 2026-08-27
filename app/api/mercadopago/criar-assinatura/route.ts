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

    // Le o plano do perfil. Mesma logica de criacao pro MiniPage, Essencial e Equipe -
    // so mudam reason/transaction_amount. Nao usa preapproval_plan_id (isso exigiria
    // card_token_id/Bricks na Mercado Pago, que decidimos nao implementar agora).
    const { data: perfil } = await supabase.from('perfis').select('plano_tipo').eq('user_id', userId).single()
    const planoTipo = perfil?.plano_tipo === 'equipe' ? 'equipe' : perfil?.plano_tipo === 'minipage' ? 'minipage' : 'essencial'

    // Gate explicito pro plano MiniPage: exige MP_PLAN_ID_MINIPAGE configurada antes de
    // aceitar cobranca de verdade. O valor em si nao e usado no payload (essa rota cria a
    // assinatura dinamicamente, sem precisar de preapproval_plan_id), mas a presenca dessa
    // variavel funciona como confirmacao de que o plano MiniPage ja foi validado/aprovado
    // pra cobranca real no Mercado Pago - evita ativar cobranca de um preco ainda nao revisado.
    if (planoTipo === 'minipage' && !process.env.MP_PLAN_ID_MINIPAGE) {
      console.error('[MP] MP_PLAN_ID_MINIPAGE nao configurada - bloqueando criacao de assinatura MiniPage')
      return NextResponse.json({ error: 'O plano MiniPage ainda não está disponível para cobrança automática. Fale com o suporte.' }, { status: 500 })
    }

    const reason = planoTipo === 'equipe' ? 'MiniPage Pro - Plano Equipe' : planoTipo === 'minipage' ? 'MiniPage Pro - Plano MiniPage' : 'MiniPage Pro - Plano Profissional'
    const transactionAmount = planoTipo === 'equipe' ? 149.90 : planoTipo === 'minipage' ? 39.90 : 79.90

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
