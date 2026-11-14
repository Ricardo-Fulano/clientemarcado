import { NextRequest, NextResponse } from 'next/server'
import { paddleSandboxHabilitado, segredoPaddleSandbox } from '../../../../lib/billing/paddle/config'
import { verificarAssinaturaPaddle } from '../../../../lib/billing/paddle/assinatura'
import { resumirWebhookPaddle } from '../../../../lib/billing/paddle/evento'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Endpoint DIAGNOSTICO, so em desenvolvimento ou preview com flag e segredo de SANDBOX.
 * Nao grava banco, nao cria pagamento, nao chama ASAAS e NAO ativa planos.
 * Nao configurar este destino como webhook de producao da Paddle.
 */
export async function POST(request: NextRequest) {
  if (!paddleSandboxHabilitado()) {
    return NextResponse.json({ error: 'PADDLE_SANDBOX_DESABILITADA' }, { status: 503 })
  }
  const segredo = segredoPaddleSandbox()
  if (!segredo) return NextResponse.json({ error: 'PADDLE_SANDBOX_SEM_SEGREDO' }, { status: 503 })
  if (Number(request.headers.get('content-length') || 0) > 131072) {
    return NextResponse.json({ error: 'PAYLOAD_MUITO_GRANDE' }, { status: 413 })
  }
  let corpo: string
  try { corpo = await request.text() } catch { return NextResponse.json({ error: 'CORPO_INVALIDO' }, { status: 400 }) }
  if (Buffer.byteLength(corpo, 'utf8') > 131072) return NextResponse.json({ error: 'PAYLOAD_MUITO_GRANDE' }, { status: 413 })
  if (!verificarAssinaturaPaddle(corpo, request.headers.get('paddle-signature'), segredo)) {
    return NextResponse.json({ error: 'ASSINATURA_INVALIDA' }, { status: 401 })
  }
  try {
    const resumo = resumirWebhookPaddle(JSON.parse(corpo))
    return NextResponse.json({ ok: true, modo: 'sandbox-diagnostico', semPersistencia: true, ...resumo })
  } catch {
    return NextResponse.json({ error: 'EVENTO_INVALIDO' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'disabled-by-default', modulo: 'paddle-sandbox-diagnostico' }, { status: 404 })
}
