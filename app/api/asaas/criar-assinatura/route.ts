import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizarPlano, obterReasonMercadoPago, obterPrecoPlanoPorCiclo, ehPlanoFree, normalizarBillingCycle } from '../../../lib/planos'

// Rota NOVA e PARALELA a /api/mercadopago/criar-assinatura - nao substitui nada ainda.
// Contas antigas continuam usando o Mercado Pago normalmente; esta rota so e chamada
// quando explicitamente decidirmos direcionar o fluxo pro Asaas (proxima etapa, ainda
// nao aplicada). Mesmo padrao de seguranca da rota do Mercado Pago: autenticacao via
// Bearer token do Supabase, valida plano antes de criar qualquer cobranca real.
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const userId = user.id

    const { data: perfil } = await supabase.from('perfis').select('plano_tipo, cpf_cnpj, nome_negocio, billing_cycle').eq('user_id', userId).single()
    const planoTipoOriginal = perfil?.plano_tipo

    // BLOQUEIO 1: Free nunca gera assinatura - mesmo padrao ja usado na rota do Mercado Pago.
    if (ehPlanoFree(planoTipoOriginal)) {
      return NextResponse.json({ error: 'Plano Free não gera assinatura.' }, { status: 400 })
    }

    // BLOQUEIO 2: so aceita os 4 planos pagos conhecidos - nunca assume um valor por padrao
    // pra uma cobranca real.
    const PLANOS_PAGOS_VALIDOS = ['minipage', 'loja', 'essencial', 'equipe']
    if (!planoTipoOriginal || !PLANOS_PAGOS_VALIDOS.includes(planoTipoOriginal)) {
      console.error('[Asaas] plano_tipo inválido/desconhecido:', planoTipoOriginal, '- bloqueando por segurança')
      return NextResponse.json({ error: 'Não foi possível identificar seu plano. Entre em contato com o suporte.' }, { status: 400 })
    }

    // BLOQUEIO 3: CPF/CNPJ e obrigatorio pra criar o customer no Asaas. Contas criadas
    // ANTES desta etapa (via Mercado Pago) nunca tiveram esse campo coletado - por isso
    // pedimos aqui, com mensagem clara, em vez de falhar silenciosamente na chamada do Asaas.
    const cpfCnpjLimpo = (perfil?.cpf_cnpj || '').replace(/\D/g, '')
    if (cpfCnpjLimpo.length !== 11 && cpfCnpjLimpo.length !== 14) {
      return NextResponse.json({ error: 'Precisamos do seu CPF ou CNPJ para gerar a cobrança. Atualize seu cadastro e tente novamente.' }, { status: 400 })
    }

    const planoTipo = normalizarPlano(planoTipoOriginal)
    // Le billing_cycle priorizando o valor ja salvo no perfil (fonte de verdade) - so usa o
    // corpo da requisicao como fallback pra contas antigas que ainda nao tem esse campo
    // preenchido (criadas antes desta etapa). Sempre normaliza pra 'mensal'|'anual', nunca
    // deixa passar um valor invalido adiante.
    const bodyRecebido = await request.json().catch(() => ({}))
    const billingCycle = normalizarBillingCycle(perfil?.billing_cycle || bodyRecebido?.billing_cycle)
    const valor = obterPrecoPlanoPorCiclo(planoTipo, billingCycle)
    const descricao = `${obterReasonMercadoPago(planoTipo)} (${billingCycle === 'anual' ? 'Anual' : 'Mensal'})`

    const ASAAS_ENV = process.env.ASAAS_ENV || 'sandbox'
    const ASAAS_API_URL = ASAAS_ENV === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3'
    const headers = {
      'Content-Type': 'application/json',
      'access_token': process.env.ASAAS_API_KEY || '',
    }

    // Parse seguro: le o texto bruto da resposta ANTES de tentar interpretar como JSON.
    // Se a API do Asaas devolver algo vazio/nao-JSON (ex: erro de autenticacao, URL errada),
    // isso evita o crash silencioso "Unexpected end of JSON input" e loga o status + corpo
    // bruto de verdade, revelando a causa real do problema.
    async function parseRespostaAsaas(res: Response, contexto: string) {
      const textoBruto = await res.text()
      console.log(`[Asaas] ${contexto} - status:`, res.status, '| corpo bruto:', textoBruto || '(vazio)')
      try {
        return textoBruto ? JSON.parse(textoBruto) : {}
      } catch {
        return {}
      }
    }

    // 1) Cria (ou reaproveita, se ja existir) o customer no Asaas. O Asaas nao tem endpoint
    // de "buscar ou criar" - por seguranca, sempre criamos um novo aqui nesta primeira
    // versao; se o usuario tentar de novo, cria outro customer (efeito colateral aceitavel
    // nesta fase de testes em sandbox, sem impacto real).
    const customerRes = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: perfil?.nome_negocio || user.email,
        email: user.email,
        cpfCnpj: cpfCnpjLimpo,
        externalReference: userId,
      }),
    })
    const customerData = await parseRespostaAsaas(customerRes, 'criar customer')
    if (!customerRes.ok || !customerData.id) {
      console.error('[Asaas] Erro ao criar customer:', customerRes.status, JSON.stringify(customerData))
      return NextResponse.json({ error: 'Não foi possível iniciar a cobrança. Tente novamente ou fale com o suporte.' }, { status: 500 })
    }

    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    const nextDueDate = amanha.toISOString().slice(0, 10) // formato AAAA-MM-DD

    // ===================================================================
    // ANUAL: cobranca UNICA (nunca recorrente) - endpoint /payments direto,
    // sem passar por /subscriptions em nenhum momento.
    // ===================================================================
    if (billingCycle === 'anual') {
      const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer: customerData.id,
          billingType: 'UNDEFINED', // cliente escolhe Pix/cartao/boleto no checkout hospedado
          value: valor,
          dueDate: nextDueDate,
          description: descricao,
          externalReference: userId,
        }),
      })
      const paymentData = await parseRespostaAsaas(paymentRes, 'criar cobranca anual (payment unico)')
      if (!paymentRes.ok || !paymentData.id || !paymentData.invoiceUrl) {
        console.error('[Asaas] Erro ao criar cobrança anual:', paymentRes.status, JSON.stringify(paymentData))
        return NextResponse.json({ error: 'Não foi possível gerar a cobrança anual. Tente novamente ou fale com o suporte.' }, { status: 500 })
      }

      // Anual NUNCA grava gateway_subscription_id (nao existe assinatura recorrente aqui) -
      // o webhook identifica esse perfil pelo gateway_customer_id (fallback ja existente,
      // nao precisou de nenhum campo novo tipo gateway_payment_id).
      await supabase.from('perfis').update({
        gateway: 'asaas',
        gateway_customer_id: customerData.id,
        gateway_subscription_id: null,
        billing_cycle: 'anual',
      }).eq('user_id', userId)

      return NextResponse.json({ init_point: paymentData.invoiceUrl, id: paymentData.id })
    }

    // ===================================================================
    // MENSAL: comportamento EXATAMENTE igual ao que ja funcionava e foi validado -
    // nenhuma linha desta parte mudou de logica, so ficou dentro do bloco condicional.
    // ===================================================================
    const subscriptionRes = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer: customerData.id,
        billingType: 'UNDEFINED',
        value: valor,
        nextDueDate,
        cycle: 'MONTHLY',
        description: descricao,
        externalReference: userId,
      }),
    })
    const subscriptionData = await parseRespostaAsaas(subscriptionRes, 'criar subscription')
    if (!subscriptionRes.ok || !subscriptionData.id) {
      console.error('[Asaas] Erro ao criar subscription:', subscriptionRes.status, JSON.stringify(subscriptionData))
      return NextResponse.json({ error: 'Não foi possível criar a assinatura. Tente novamente ou fale com o suporte.' }, { status: 500 })
    }

    // Busca a primeira cobranca gerada pela assinatura, pra pegar o link do checkout
    // hospedado (invoiceUrl) - a subscription em si nao retorna esse link diretamente.
    const paymentsRes = await fetch(`${ASAAS_API_URL}/payments?subscription=${subscriptionData.id}`, { headers })
    const paymentsData = await parseRespostaAsaas(paymentsRes, 'buscar payments')
    const primeiraCobranca = paymentsData?.data?.[0]
    if (!primeiraCobranca?.invoiceUrl) {
      console.error('[Asaas] Assinatura criada mas sem cobranca/invoiceUrl associada:', JSON.stringify(paymentsData))
      return NextResponse.json({ error: 'Assinatura criada, mas não foi possível gerar o link de pagamento. Fale com o suporte.' }, { status: 500 })
    }

    // Salva as referencias no perfil - gateway='asaas' distingue de contas antigas do
    // Mercado Pago (que continuam com gateway=null/'mercadopago'). Nao mexe em
    // mp_subscription_id nem em nenhum campo usado pelo fluxo antigo.
    await supabase.from('perfis').update({
      gateway: 'asaas',
      gateway_customer_id: customerData.id,
      gateway_subscription_id: subscriptionData.id,
      billing_cycle: 'mensal',
    }).eq('user_id', userId)

    return NextResponse.json({ init_point: primeiraCobranca.invoiceUrl, id: subscriptionData.id })
  } catch (err) {
    console.error('[Asaas] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
