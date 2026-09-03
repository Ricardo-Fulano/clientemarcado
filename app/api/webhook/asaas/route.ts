import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Webhook do Asaas - rota NOVA e PARALELA ao webhook do Mercado Pago (app/api/webhook/
// mercadopago/route.ts, que continua funcionando sem nenhuma alteracao). Segue o mesmo
// padrao de logs/validacao/atualizacao de perfil, mas com nomes genericos (nao usa
// nomenclatura especifica do Mercado Pago).
//
// IMPORTANTE - validacao de assinatura do webhook:
// O Asaas permite configurar um "authToken" na tela de criacao do webhook, que ele passa
// de volta nas requisicoes. NAO encontrei, na documentacao publica consultada ate agora,
// confirmacao 100% clara de qual e o NOME EXATO do header que o Asaas usa pra enviar esse
// token de volta (candidatos comuns: "asaas-access-token", "access-token"). Por isso,
// implementei a checagem de forma DEFENSIVA: se a env var ASAAS_WEBHOOK_TOKEN existir,
// tenta validar contra os headers mais prováveis; se nenhum bater, rejeita. Se a env var
// NAO existir ainda (nao configurada), pula a validacao (mesmo padrao ja usado no webhook
// do Mercado Pago quando MP_WEBHOOK_SECRET esta vazio) - PRECISA ser confirmado e ajustado
// assim que a URL for cadastrada de verdade no painel Asaas (ver relatorio final).
export async function POST(request: NextRequest) {
  try {
    const bodyTexto = await request.text()

    const secret = process.env.ASAAS_WEBHOOK_TOKEN
    if (secret) {
      const tokenRecebido =
        request.headers.get('asaas-access-token') ||
        request.headers.get('access-token') ||
        ''
      if (tokenRecebido !== secret) {
        console.error('[Webhook Asaas] Token de validacao invalido ou ausente')
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
      }
    }

    let evento: any
    try {
      evento = JSON.parse(bodyTexto)
    } catch {
      console.error('[Webhook Asaas] Payload nao e JSON valido')
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const tipoEvento: string | undefined = evento?.event
    // O Asaas envia o objeto principal dentro de "payment" pra eventos de cobranca, e
    // possivelmente "subscription" pra eventos de assinatura - checa os dois, sem quebrar
    // se algum vier ausente.
    const payment = evento?.payment
    const subscription = evento?.subscription

    if (!tipoEvento) {
      console.error('[Webhook Asaas] Evento sem campo "event" - payload ignorado:', JSON.stringify(evento).slice(0, 300))
      return NextResponse.json({ ok: true })
    }

    console.log(`[Webhook Asaas] Evento recebido: ${tipoEvento}`)

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Identifica o perfil - preferencialmente pelo ID da assinatura (gateway_subscription_id),
    // ja que e o identificador mais estavel; se o evento nao tiver subscription (ex: cobranca
    // avulsa, plano anual sem recorrencia), usa o customer como fallback.
    const subscriptionId: string | null = payment?.subscription || subscription?.id || null
    const customerId: string | null = payment?.customer || subscription?.customer || null

    if (!subscriptionId && !customerId) {
      console.error('[Webhook Asaas] Evento sem subscription nem customer - nao foi possivel identificar o perfil')
      return NextResponse.json({ ok: true })
    }

    let query = supabase.from('perfis').select('user_id, billing_cycle, status_acesso')
    query = subscriptionId ? query.eq('gateway_subscription_id', subscriptionId) : query.eq('gateway_customer_id', customerId)
    const { data: perfil, error: erroBusca } = await query.maybeSingle()

    if (erroBusca) {
      console.error('[Webhook Asaas] Erro ao buscar perfil:', erroBusca.message)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
    if (!perfil) {
      // Nao encontrar o perfil correspondente nao deve derrubar o webhook (o Asaas pode
      // reenviar/retry) - loga e responde 200, seguindo boa pratica de webhooks.
      console.error(`[Webhook Asaas] Nenhum perfil encontrado para subscriptionId=${subscriptionId} / customerId=${customerId}`)
      return NextResponse.json({ ok: true })
    }

    // ===== PAGAMENTO CONFIRMADO/RECEBIDO - libera ou renova o acesso =====
    if (tipoEvento === 'PAYMENT_CONFIRMED' || tipoEvento === 'PAYMENT_RECEIVED') {
      const agora = new Date()
      const planoAtivoAte = new Date(agora)
      if (perfil.billing_cycle === 'anual') {
        planoAtivoAte.setFullYear(planoAtivoAte.getFullYear() + 1)
      } else {
        // 'mensal' ou billing_cycle ainda nao preenchido - assume mensal por seguranca
        planoAtivoAte.setDate(planoAtivoAte.getDate() + 30)
      }

      // NAO escreve em trial_ends_at aqui: ainda NAO temos confirmacao de qual evento do
      // Asaas representa exatamente "autorizacao de trial" (ver comentario extenso no
      // relatorio final) - por seguranca, nao inventamos essa logica agora. O trial, se for
      // usado, precisa ser tratado numa proxima etapa, so depois de confirmar isso.
      const { error: erroUpdate } = await supabase
        .from('perfis')
        .update({
          status_acesso: 'ativo',
          gateway: 'asaas',
          plano_ativo_ate: planoAtivoAte.toISOString(),
        })
        .eq('user_id', perfil.user_id)

      if (erroUpdate) {
        console.error('[Webhook Asaas] Erro ao atualizar perfil (pagamento confirmado):', erroUpdate.message)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
      }
      console.log(`[Webhook Asaas] Acesso liberado/renovado para user_id: ${perfil.user_id} (${tipoEvento})`)
    }

    // ===== PAGAMENTO VENCIDO/ESTORNADO/CONTESTADO - marca em atraso, nunca apaga nada =====
    else if (tipoEvento === 'PAYMENT_OVERDUE' || tipoEvento === 'PAYMENT_REFUNDED' || tipoEvento === 'PAYMENT_CHARGEBACK_REQUESTED') {
      const { error: erroUpdate } = await supabase
        .from('perfis')
        .update({ status_acesso: 'em_atraso' })
        .eq('user_id', perfil.user_id)

      if (erroUpdate) {
        console.error('[Webhook Asaas] Erro ao atualizar perfil (atraso/estorno):', erroUpdate.message)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
      }
      console.log(`[Webhook Asaas] Perfil marcado em_atraso para user_id: ${perfil.user_id} (${tipoEvento})`)
    }

    // ===== ASSINATURA CANCELADA - marca cancelado, nunca exclui nada =====
    else if (tipoEvento === 'SUBSCRIPTION_DELETED' || tipoEvento === 'SUBSCRIPTION_CANCELLED' || tipoEvento === 'PAYMENT_DELETED') {
      const { error: erroUpdate } = await supabase
        .from('perfis')
        .update({ status_acesso: 'cancelado' })
        .eq('user_id', perfil.user_id)

      if (erroUpdate) {
        console.error('[Webhook Asaas] Erro ao atualizar perfil (cancelamento):', erroUpdate.message)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
      }
      console.log(`[Webhook Asaas] Perfil marcado cancelado para user_id: ${perfil.user_id} (${tipoEvento})`)
    }

    // ===== SUBSCRIPTION_CREATED e outros eventos informativos - so loga, nao altera nada =====
    else {
      console.log(`[Webhook Asaas] Evento "${tipoEvento}" recebido mas nao tratado - apenas logado, nenhuma alteracao feita`)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Webhook Asaas] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
