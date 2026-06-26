import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const xSignature = request.headers.get('x-signature') || ''
    const xRequestId = request.headers.get('x-request-id') || ''

    // Validar assinatura do webhook
    const secret = process.env.MP_WEBHOOK_SECRET!
    if (secret) {
      const params = new URL(request.url).searchParams
      const dataId = params.get('data.id') || ''
      const ts = xSignature.split(',').find(p => p.startsWith('ts='))?.split('=')[1] || ''
      const v1 = xSignature.split(',').find(p => p.startsWith('v1='))?.split('=')[1] || ''

      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(manifest)
      const digest = hmac.digest('hex')

      if (digest !== v1) {
        console.error('[WEBHOOK] Assinatura invalida')
        return NextResponse.json({ error: 'Assinatura invalida' }, { status: 401 })
      }
    }

    const evento = JSON.parse(body)
    const tipo = evento.type
    const dataId = evento.data?.id

    if (!dataId) {
      return NextResponse.json({ ok: true })
    }

    // Buscar detalhes do evento na API do MP
    let externalReference: string | null = null
    let subscriptionId: string | null = null
    let paymentId: string | null = null
    let status: string | null = null
    let valor: number | null = null

    if (tipo === 'subscription_preapproval') {
      const res = await fetch(`https://api.mercadopago.com/preapproval/${dataId}`, {
        headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
      })
      const data = await res.json()
      externalReference = data.external_reference || null
      subscriptionId = data.id || null
      status = data.status || null
    } else if (tipo === 'payment') {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
      })
      const data = await res.json()
      externalReference = data.external_reference || null
      paymentId = data.id?.toString() || null
      status = data.status || null
      valor = data.transaction_amount || null
    }

    if (!externalReference) {
      console.warn('[WEBHOOK] external_reference ausente, ignorando evento')
      return NextResponse.json({ ok: true })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Registrar evento para auditoria
    await supabase.from('mp_eventos').insert({
      user_id: externalReference,
      mp_subscription_id: subscriptionId,
      mp_payment_id: paymentId,
      status,
      valor,
      payload: evento,
    })

    // Ativar plano se pagamento aprovado
    const aprovado = status === 'authorized' || status === 'approved'
    if (aprovado) {
      const planoAte = new Date()
      planoAte.setDate(planoAte.getDate() + 30)

      await supabase.from('perfis').update({
        status_acesso: 'ativo',
        plano_ativo_ate: planoAte.toISOString(),
        ...(subscriptionId ? { mp_subscription_id: subscriptionId } : {}),
      }).eq('user_id', externalReference)

      console.log(`[WEBHOOK] Plano ativado para user_id: ${externalReference}`)
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[WEBHOOK] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}