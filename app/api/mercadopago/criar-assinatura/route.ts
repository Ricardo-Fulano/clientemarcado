import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizarPlano, obterReasonMercadoPago, obterPrecoPlano, ehPlanoFree } from '../../../lib/planos'

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
    const planoTipoOriginal = perfil?.plano_tipo

    // BLOQUEIO 1: Free nunca gera assinatura - nunca chama o Mercado Pago, nunca tenta
    // transaction_amount 0. Verifica o valor original (nao normalizado) pra nao depender
    // do fallback do normalizarPlano().
    if (ehPlanoFree(planoTipoOriginal)) {
      return NextResponse.json({ error: 'Plano Free não gera assinatura.' }, { status: 400 })
    }

    // BLOQUEIO 2: valida que o plano_tipo salvo e um dos 4 planos pagos conhecidos - NAO
    // confia no fallback silencioso do normalizarPlano() (que cairia em 'essencial'/R$79,90
    // pra qualquer valor nulo/invalido). Nesta rota especifica, que gera cobranca real,
    // um plano desconhecido bloqueia em vez de assumir um valor por padrao.
    const PLANOS_PAGOS_VALIDOS = ['minipage', 'loja', 'essencial', 'equipe']
    if (!planoTipoOriginal || !PLANOS_PAGOS_VALIDOS.includes(planoTipoOriginal)) {
      console.error('[MP] plano_tipo invalido/desconhecido:', planoTipoOriginal, '- bloqueando por seguranca, sem chamar o Mercado Pago')
      return NextResponse.json({ error: 'Não foi possível identificar seu plano. Entre em contato com o suporte.' }, { status: 400 })
    }

    const planoTipo = normalizarPlano(planoTipoOriginal)

    // Gate explicito pro plano MiniPage: exige MP_PLAN_ID_MINIPAGE configurada antes de
    // aceitar cobranca de verdade. O valor em si nao e usado no payload (essa rota cria a
    // assinatura dinamicamente, sem precisar de preapproval_plan_id), mas a presenca dessa
    // variavel funciona como confirmacao de que o plano MiniPage ja foi validado/aprovado
    // pra cobranca real no Mercado Pago - evita ativar cobranca de um preco ainda nao revisado.
    if (planoTipo === 'minipage' && !process.env.MP_PLAN_ID_MINIPAGE) {
      console.error('[MP] MP_PLAN_ID_MINIPAGE nao configurada - bloqueando criacao de assinatura MiniPage')
      return NextResponse.json({ error: 'O plano MiniPage ainda não está disponível para cobrança automática. Fale com o suporte.' }, { status: 500 })
    }

    // Mesmo gate, agora pro plano Loja (novo, ainda sem confirmacao de que a cobranca real
    // foi testada/aprovada) - mesmo padrao ja usado acima pro MiniPage.
    if (planoTipo === 'loja' && !process.env.MP_PLAN_ID_LOJA) {
      console.error('[MP] MP_PLAN_ID_LOJA nao configurada - bloqueando criacao de assinatura Loja')
      return NextResponse.json({ error: 'Plano MiniPage Loja ainda não está habilitado para cobrança automática.' }, { status: 500 })
    }

    const reason = obterReasonMercadoPago(planoTipo)
    const transactionAmount = obterPrecoPlano(planoTipo)

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
