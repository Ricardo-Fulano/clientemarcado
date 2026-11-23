import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verificarAssinaturaPaddle } from '../../../../lib/billing/paddle/assinatura'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }
const MAX_BYTES = 131072
const EVENT_ID = /^evt_[a-z0-9]{10,80}$/
const EVENT_TYPE = /^[a-z]+\.[a-z_]+$/

/** Somente RECEPCAO duravel. NAO ativa planos, cobra, cancela nem comissiona.
 * Desativado por padrao. Nao configurar destino Live enquanto dominio/conta nao forem aprovados.
 * Ao habilitar, exige migracao revisada e segredo exclusivo de notificacao Paddle Live.
 */
export async function POST(request: NextRequest) {
  const env = process.env
  if (env.PADDLE_LIVE_WEBHOOK_INGEST_ENABLED !== 'true' ||
      env.PADDLE_ENVIRONMENT !== 'live' ||
      env.VERCEL_ENV !== 'production') {
    return NextResponse.json({ error: 'DESABILITADO' }, { status: 503, headers: noStore })
  }
  const secret = env.PADDLE_LIVE_WEBHOOK_SECRET?.trim()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const role = env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret || secret.length < 16 || !url || !role) {
    return NextResponse.json({ error: 'CONFIG_INCOMPLETA' }, { status: 503, headers: noStore })
  }
  const declaredLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) {
    return NextResponse.json({ error: 'PAYLOAD_GRANDE' }, { status: 413, headers: noStore })
  }
  let raw: string
  try { raw = await request.text() } catch {
    return NextResponse.json({ error: 'CORPO_INVALIDO' }, { status: 400, headers: noStore })
  }
  if (Buffer.byteLength(raw, 'utf8') > MAX_BYTES) {
    return NextResponse.json({ error: 'PAYLOAD_GRANDE' }, { status: 413, headers: noStore })
  }
  if (!verificarAssinaturaPaddle(raw, request.headers.get('paddle-signature'), secret)) {
    return NextResponse.json({ error: 'ASSINATURA_INVALIDA' }, { status: 401, headers: noStore })
  }
  let payload: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalido')
    payload = parsed as Record<string, unknown>
  } catch { return NextResponse.json({ error: 'EVENTO_INVALIDO' }, { status: 400, headers: noStore }) }
  const id = payload.event_id
  const type = payload.event_type
  const occurred = payload.occurred_at
  if (typeof id !== 'string' || !EVENT_ID.test(id) ||
      typeof type !== 'string' || !EVENT_TYPE.test(type) ||
      typeof occurred !== 'string' || !Number.isFinite(Date.parse(occurred))) {
    return NextResponse.json({ error: 'METADADOS_INVALIDOS' }, { status: 400, headers: noStore })
  }
  const data = payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data as Record<string, unknown> : null
  const entityId = typeof data?.id === 'string' && data.id.length <= 96 ? data.id : null
  try {
    const db = createClient(url, role, { auth: { autoRefreshToken: false, persistSession: false } })
    const { error } = await db.from('billing_paddle_live_inbox').insert({
      event_id: id, event_type: type, occurred_at: occurred, entity_id: entityId,
      payload, signature_verified: true, processing_status: 'pending',
    })
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: 'PERSISTENCIA_INDISPONIVEL' }, { status: 503, headers: noStore })
    }
    // 2xx apenas APOS persistir, ou quando o mesmo event_id ja estava registrado.
    return NextResponse.json({ ok: true, received: true }, { status: 200, headers: noStore })
  } catch {
    return NextResponse.json({ error: 'PERSISTENCIA_INDISPONIVEL' }, { status: 503, headers: noStore })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'METODO_NAO_PERMITIDO' }, { status: 405, headers: noStore })
}
