import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizarPlano } from '../../../lib/planos'

// Planos que podem gerar comissao de parceiro - Free nunca entra aqui (sem mensalidade,
// sem pagamento real). 'essencial' e o valor interno do MiniPage Pro - nunca criamos 'pro'.
const PLANOS_COMISSIONAVEIS = ['minipage', 'loja', 'essencial', 'equipe']

// Fase 3B: tenta registrar a comissao de um parceiro para um pagamento ja confirmado pelo
// Asaas. Roda DEPOIS que o acesso do cliente ja foi liberado com sucesso (ver ponto de
// chamada dentro do handler) - qualquer falha aqui NUNCA desfaz nem afeta o pagamento
// principal, so loga e segue. Toda a logica de negocio sensivel (janela de 12 meses, limite
// de 12 comissoes, calculo do valor, idempotencia por asaas_payment_id) mora inteiramente
// dentro da funcao SQL registrar_comissao_pagamento (Fase 3A) - esta funcao SO localiza os
// dados corretos e valida o payload antes de chamar a RPC, nunca duplica essa logica.
async function registrarComissaoParceiro(
  supabase: any,
  params: { userId: string; planoTipo: string | null; payment: any; cicloCobranca?: string | null }
) {
  const prefixo = '[Webhook Asaas][Comissão]'
  const { userId, planoTipo, payment, cicloCobranca } = params

  try {
    // ---- Ajuste 2: plano precisa ser um dos 4 comissionaveis ----
    const planoNormalizado = normalizarPlano(planoTipo)
    if (!PLANOS_COMISSIONAVEIS.includes(planoNormalizado)) {
      console.log(`${prefixo} Plano não elegível para comissão (${planoNormalizado}) - user_id: ${userId} - nenhuma comissão gerada`)
      return
    }

    // ---- Ajuste 3: validacao do payload financeiro, antes de qualquer busca ----
    const paymentId = payment?.id
    if (!paymentId || typeof paymentId !== 'string' || !paymentId.trim()) {
      console.log(`${prefixo} payment.id ausente ou inválido - nenhuma comissão gerada`)
      return
    }

    const valorPago = Number(payment?.value)
    if (!Number.isFinite(valorPago) || valorPago <= 0) {
      console.log(`${prefixo} payment.value inválido (payment.id: ${paymentId}) - nenhuma comissão gerada`)
      return
    }

    // ---- Ajuste 1: data financeira confiavel, NUNCA new Date() como fallback ----
    const dataStr = payment?.paymentDate || payment?.confirmedDate
    const dataPagamento = dataStr ? new Date(dataStr) : null
    if (!dataStr || !dataPagamento || Number.isNaN(dataPagamento.getTime())) {
      console.log(`${prefixo} Pagamento sem data financeira confiável (payment.id: ${paymentId})`)
      return
    }

    // ---- Obtem o e-mail do usuario via Supabase Admin (perfis nao guarda email) ----
    const { data: userData, error: erroUser } = await supabase.auth.admin.getUserById(userId)
    if (erroUser || !userData?.user?.email) {
      console.error(`${prefixo} Não foi possível obter e-mail do usuário (user_id: ${userId}, payment.id: ${paymentId})`)
      return
    }
    const emailNormalizado = userData.user.email.trim().toLowerCase()

    // ---- Busca TODAS as indicacoes compatives - nunca .single(), pra poder detectar
    // ambiguidade em vez de escolher a primeira silenciosamente ----
    const { data: indicacoes, error: erroIndicacoes } = await supabase
      .from('indicacoes_parceiros')
      .select('id, parceiro_id')
      .eq('email', emailNormalizado)

    if (erroIndicacoes) {
      console.error(`${prefixo} Erro ao buscar indicação (payment.id: ${paymentId}):`, erroIndicacoes.message)
      return
    }

    if (!indicacoes || indicacoes.length === 0) {
      console.log(`${prefixo} Sem indicação de parceiro para este cliente (payment.id: ${paymentId}) - nenhuma comissão gerada`)
      return
    }

    if (indicacoes.length > 1) {
      console.error(`${prefixo} Ambiguidade: ${indicacoes.length} indicações encontradas para o mesmo e-mail (payment.id: ${paymentId}, user_id: ${userId}) - nenhuma comissão gerada`)
      return
    }

    const indicacao = indicacoes[0]

    // ---- Chama a RPC - toda a regra de negocio (janela, limite, calculo, idempotencia)
    // fica dentro dela, nao duplicada aqui ----
    const { error: erroRpc } = await (supabase.rpc as any)('registrar_comissao_pagamento', {
      p_indicacao_id: indicacao.id,
      p_parceiro_id: indicacao.parceiro_id,
      p_user_id: userId,
      p_asaas_payment_id: paymentId,
      p_plano_tipo: planoNormalizado,
      p_valor_pago: valorPago,
      p_percentual: 0.20,
      p_data_pagamento_cliente: dataPagamento.toISOString(),
      // Validacao estrita - NUNCA usar normalizarBillingCycle() aqui, ela transformaria
      // valor ausente em 'mensal' (fallback ja usado noutro lugar deste arquivo pra
      // calcular data de expiracao de acesso, mas errado pra congelar o ciclo real da
      // comissao). Melhor NULL do que informacao inventada.
      p_ciclo_cobranca: cicloCobranca === 'mensal' || cicloCobranca === 'anual' ? cicloCobranca : null,
    })

    if (erroRpc) {
      const msg = erroRpc.message || ''
      if (msg.includes('janela de 12 meses')) {
        console.log(`${prefixo} Fora da janela de 12 meses (payment.id: ${paymentId}, indicacao: ${indicacao.id})`)
      } else if (msg.includes('Limite de 12 comissões')) {
        console.log(`${prefixo} Limite de 12 comissões já atingido (payment.id: ${paymentId}, indicacao: ${indicacao.id})`)
      } else if (msg.includes('Divergência')) {
        console.error(`${prefixo} Divergência indicação/parceiro (payment.id: ${paymentId}):`, msg)
      } else {
        console.error(`${prefixo} Erro inesperado da RPC (payment.id: ${paymentId}):`, msg)
      }
      return
    }

    console.log(`${prefixo} Comissão registrada com sucesso (payment.id: ${paymentId}, indicacao: ${indicacao.id})`)
  } catch (err: any) {
    // Rede de seguranca final - qualquer excecao inesperada aqui NUNCA propaga pro handler
    // principal, so loga.
    console.error(`${prefixo} Erro inesperado ao processar comissão:`, err?.message || err)
  }
}

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

    let query = supabase.from('perfis').select('user_id, billing_cycle, status_acesso, plano_tipo')
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

      // Fase 3B: tenta registrar comissao de parceiro, se aplicavel. Roda DEPOIS que o
      // acesso ja foi confirmado com sucesso acima - qualquer erro aqui e isolado e nunca
      // afeta o pagamento/acesso do cliente (o helper ja tem seu proprio try/catch; este
      // aqui e uma segunda camada de seguranca).
      try {
        await registrarComissaoParceiro(supabase, {
          userId: perfil.user_id,
          planoTipo: perfil.plano_tipo,
          payment,
          cicloCobranca: perfil.billing_cycle,
        })
      } catch (erroComissao: any) {
        console.error('[Webhook Asaas][Comissão] Erro inesperado (fora do helper):', erroComissao?.message || erroComissao)
      }
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
