import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { criarWebhookStore, processarEventoResend, verificarAssinaturaSvix } from '../../../lib/resend-webhook'

// Webhook do Resend: registra o resultado REAL do e-mail (entregue, atrasado, devolvido, spam, falhou) no convite correspondente.
// Publico, mas SO aceita eventos com assinatura Svix valida (RESEND_WEBHOOK_SECRET). Sem o segredo, recusa tudo (falha fechada).
// Atualiza apenas as colunas email_* de convites_transferencia, localizando o convite pelo resend_email_id.
export async function POST(request: NextRequest) {
  const segredo = process.env.RESEND_WEBHOOK_SECRET
  if (!segredo) {
    console.error('[webhook/resend] RESEND_WEBHOOK_SECRET não configurado.')
    return NextResponse.json({ error: 'Webhook não configurado.' }, { status: 500 })
  }
  const corpo = await request.text() // corpo CRU: a assinatura e calculada sobre ele
  const valido = verificarAssinaturaSvix(
    corpo,
    { id: request.headers.get('svix-id'), timestamp: request.headers.get('svix-timestamp'), signature: request.headers.get('svix-signature') },
    segredo,
  )
  if (!valido) return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 })

  let evento: unknown
  try {
    evento = JSON.parse(corpo)
  } catch {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 })
  }
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const r = await processarEventoResend(evento, criarWebhookStore(supabase))
    return NextResponse.json({ recebido: true, resultado: r.tipo })
  } catch (err) {
    // erro do banco: responde 500 para o Resend/Svix tentar de novo mais tarde
    console.error('[webhook/resend] Erro ao processar:', err instanceof Error ? err.message : 'desconhecido')
    return NextResponse.json({ error: 'Erro ao processar.' }, { status: 500 })
  }
}
