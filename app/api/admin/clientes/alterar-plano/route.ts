import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { alterarPlano, ehAdminAlterarPlano } from '../../../../lib/asaas-alterar-plano'

// POST /api/admin/clientes/alterar-plano
// Altera o valor da assinatura mensal EXISTENTE no Asaas (upgrade para plano mensal superior, ou
// sincronizacao quando o plano do sistema ja esta certo mas o valor no Asaas esta menor).
// Toda a logica esta em app/lib/asaas-alterar-plano.ts; aqui so autenticamos o administrador.
//
// Corpo: { userId, novoPlano, dryRun?, confirmacao? }
//   - dryRun e o PADRAO (so le, nunca altera). A execucao real exige dryRun: false E a "confirmacao"
//     devolvida pelo dryRun.
//   - O preco NUNCA vem do navegador: e lido de app/lib/planos.ts.
//
// Autorizacao: mesmo padrao restrito de app/api/admin/clientes/route.ts - um unico e-mail, validado
// aqui no servidor contra o token real (nunca confiando so no frontend).
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })

    if (!ehAdminAlterarPlano(user.email)) return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 })

    const body = await request.json().catch(() => null)

    // So a partir daqui usamos a service role key - nunca exposta ao frontend.
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const r = await alterarPlano(
      { supabase: supabaseAdmin, env: process.env as Record<string, string | undefined> },
      { userId: body?.userId, novoPlano: body?.novoPlano, dryRun: body?.dryRun, confirmacao: body?.confirmacao },
    )
    return NextResponse.json(r.body, { status: r.status, headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    console.error('[api/admin/clientes/alterar-plano] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
