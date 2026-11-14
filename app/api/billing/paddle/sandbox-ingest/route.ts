import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paddleSandboxHabilitado, segredoPaddleSandbox } from '../../../../lib/billing/paddle/config'
import { verificarAssinaturaPaddle } from '../../../../lib/billing/paddle/assinatura'
import { resumirWebhookPaddle } from '../../../../lib/billing/paddle/evento'
import { registrarWebhookPaddle } from '../../../../lib/billing/paddle/persistencia'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Sandbox somente: grava RECEIVED, jamais processa cobranca, plano ou comissao. */
export async function POST(request: NextRequest) {
  if (!paddleSandboxHabilitado() || process.env.PADDLE_BILLING_PERSISTENCE_ENABLED !== 'true') {
    return NextResponse.json({ error: 'PADDLE_PERSISTENCIA_DESABILITADA' }, { status: 503 })
  }
  const segredo = segredoPaddleSandbox()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!segredo || !url || !key) return NextResponse.json({ error: 'CONFIGURACAO_INCOMPLETA' }, { status: 503 })

  const declared = Number(request.headers.get('content-length') || 0)
  if (!Number.isFinite(declared) || declared > 131072) return NextResponse.json({ error: 'PAYLOAD_MUITO_GRANDE' }, { status: 413 })
  let body: string
  try { body = await request.text() } catch { return NextResponse.json({ error: 'CORPO_INVALIDO' }, { status: 400 }) }
  if (Buffer.byteLength(body, 'utf8') > 131072) return NextResponse.json({ error: 'PAYLOAD_MUITO_GRANDE' }, { status: 413 })
  if (!verificarAssinaturaPaddle(body, request.headers.get('paddle-signature'), segredo)) {
    return NextResponse.json({ error: 'ASSINATURA_INVALIDA' }, { status: 401 })
  }
  let resumo: ReturnType<typeof resumirWebhookPaddle>
  try { resumo = resumirWebhookPaddle(JSON.parse(body)) } catch {
    return NextResponse.json({ error: 'EVENTO_INVALIDO' }, { status: 400 })
  }
  try {
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
    const resultado = await registrarWebhookPaddle(supabase, resumo)
    return NextResponse.json({ ok: true, modo: 'sandbox-recebimento', evento: resultado, semProcessamento: true })
  } catch {
    // Erro transitorio: nunca reconhecer webhook como recebido quando a escrita falhou.
    return NextResponse.json({ error: 'PERSISTENCIA_INDISPONIVEL' }, { status: 503 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'NAO_ENCONTRADO' }, { status: 404 })
}
