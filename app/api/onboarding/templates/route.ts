import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { listarTemplatesDisponiveis } from '../../../lib/templates-onboarding'

// Lista os modelos de MiniPage que o usuario logado pode escolher no onboarding.
// A logica fica em app/lib/templates-onboarding.ts (testavel). A identidade do usuario e sempre
// resolvida aqui, no servidor, pelo token - o frontend nunca informa quem e o usuario.
// So roda no servidor, com SUPABASE_SERVICE_ROLE_KEY. O navegador nunca consulta minipage_templates.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return NextResponse.json({ codigo: 'NAO_AUTENTICADO', error: 'Faça login para continuar.' }, { status: 401 })
    }

    const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ codigo: 'SESSAO_INVALIDA', error: 'Sessão inválida. Entre novamente.' }, { status: 401 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const r = await listarTemplatesDisponiveis(supabaseAdmin, user.id)
    return NextResponse.json(r.body, { status: r.status, headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    console.error('[onboarding/templates] Erro interno:', e?.message)
    return NextResponse.json({ codigo: 'ERRO_INTERNO', error: 'Não foi possível carregar os modelos agora. Tente novamente.' }, { status: 500 })
  }
}
