import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { previewCheckoutSandboxHabilitado, resolverPrecoSandbox } from '../../../../lib/billing/paddle/checkout-preview'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'no-store' }

/** Bloco 9A: resolve apenas o ID de preco Paddle Sandbox vinculado ao
 * plano/ciclo do PERFIL autenticado. Nao cria transacao, nao inicia checkout,
 * nao altera perfis, nao recebe plano do navegador, nao concede acesso.
 */
export async function POST(request: NextRequest) {
  if (!previewCheckoutSandboxHabilitado(process.env)) {
    return NextResponse.json({ error: 'PREVIEW_DESABILITADO' }, { status: 503, headers })
  }
  const token = (request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (!token || token.length > 8192) {
    return NextResponse.json({ error: 'NAO_AUTENTICADO' }, { status: 401, headers })
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'CONFIGURACAO_INCOMPLETA' }, { status: 503, headers })
  }
  try {
    // Autentica o token no Supabase; nao aceita userId enviado pelo navegador.
    const auth = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: { user }, error: authError } = await auth.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'SESSAO_INVALIDA' }, { status: 401, headers })

    // Usa service role somente apos autenticacao e filtra por user.id autenticado.
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: perfil, error: profileError } = await admin.from('perfis')
      .select('plano_tipo,billing_cycle,status_acesso').eq('user_id', user.id).maybeSingle()
    if (profileError) throw new Error('PERFIL_INDISPONIVEL')
    if (!perfil) return NextResponse.json({ error: 'PERFIL_NAO_ENCONTRADO' }, { status: 404, headers })
    if (perfil.status_acesso !== 'aguardando_pagamento') {
      return NextResponse.json({ error: 'ACESSO_FORA_DO_FLUXO_DE_COMPRA' }, { status: 409, headers })
    }
    let preco: ReturnType<typeof resolverPrecoSandbox>
    try { preco = resolverPrecoSandbox(perfil.plano_tipo, perfil.billing_cycle) } catch {
      return NextResponse.json({ error: 'PLANO_OU_CICLO_INVALIDO' }, { status: 422, headers })
    }
    return NextResponse.json({ ok: true, sandbox: true, somenteConsulta: true,
      plano: preco.plano, ciclo: preco.ciclo, priceId: preco.priceId,
      checkoutCriado: false, planoAtivado: false }, { headers })
  } catch {
    return NextResponse.json({ error: 'CONSULTA_INDISPONIVEL' }, { status: 503, headers })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'METODO_NAO_PERMITIDO' }, { status: 405, headers })
}
