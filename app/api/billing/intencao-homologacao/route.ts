import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { podeHabilitarIntencaoHomolog, validarIntencao } from '../../../lib/billing/intencoes-seguras'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const h = { 'Cache-Control': 'no-store' }
const responder = (valor: Record<string, unknown>, status: number) => NextResponse.json(valor, { status, headers: h })
/** Homologacao somente. Nao chama Paddle/Asaas, nao escreve em perfis nem ativa plano. */
export async function POST(request: NextRequest) {
  if (!podeHabilitarIntencaoHomolog(process.env)) return responder({ error: 'INTENCAO_HOMOLOG_DESABILITADA' }, 503)
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+([^\s]+)$/i)?.[1]
  if (!bearer || bearer.length > 8192) return responder({ error: 'SESSAO_OBRIGATORIA' }, 401)
  const tamanho = request.headers.get('content-length')
  if (tamanho && (!/^\d+$/.test(tamanho) || Number(tamanho) > 2048)) return responder({ error: 'ENTRADA_INVALIDA' }, 413)
  let pedido: unknown
  try {
    const raw = await request.text()
    if (raw.length < 1 || raw.length > 2048) return responder({ error: 'ENTRADA_INVALIDA' }, 413)
    pedido = JSON.parse(raw)
  } catch { return responder({ error: 'JSON_INVALIDO' }, 400) }
  const intent = validarIntencao(pedido)
  if (!intent) return responder({ error: 'PLANO_CICLO_OU_TENTATIVA_INVALIDA' }, 422)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const role = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !role) return responder({ error: 'CONFIG_INCOMPLETA' }, 503)
  try {
    const auth = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: { user }, error } = await auth.auth.getUser(bearer)
    if (error || !user) return responder({ error: 'SESSAO_INVALIDA' }, 401)
    const admin = createClient(url, role, { auth: { autoRefreshToken: false, persistSession: false } })
    // A RPC usa row lock no perfil e valida elegibilidade novamente dentro da transacao.
    const { data, error: dbError } = await admin.rpc('mp_billing_homolog_registrar_intencao', {
      p_user_id: user.id, p_attempt_id: intent.attemptId, p_plan_code: intent.plano, p_billing_cycle: intent.ciclo,
    })
    if (dbError) return responder({ error: 'INTENCAO_INDISPONIVEL_OU_NAO_ELEGIVEL' }, 409)
    const linha = Array.isArray(data) ? data[0] : null
    if (!linha || typeof linha.out_reused !== 'boolean' || linha.out_status !== 'pending' ||
        typeof linha.out_attempt_id !== 'string') return responder({ error: 'INTENCAO_INCONSISTENTE' }, 409)
    return responder({ estado: 'registrada', attemptId: linha.out_attempt_id, reutilizada: linha.out_reused, cobrancaCriada: false }, 200)
  } catch { return responder({ error: 'INTENCAO_INDISPONIVEL' }, 503) }
}
export async function GET() { return responder({ error: 'METODO_NAO_PERMITIDO' }, 405) }
