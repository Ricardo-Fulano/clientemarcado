import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aplicarTemplate, templateIdValido } from '../../../lib/templates-onboarding'

// Aplica um modelo de MiniPage a conta do usuario logado (rota critica). A logica fica em
// app/lib/templates-onboarding.ts (testavel); a clonagem e feita pela funcao do banco
// aplicar_template_minipage (transacao unica, idempotente, executavel so por service_role).
//
// SEGURANCA: o user_id vem SOMENTE do token. Do corpo le-se APENAS template_id; qualquer
// user_id/p_user_id enviado pelo navegador e ignorado. So roda no servidor, com SUPABASE_SERVICE_ROLE_KEY.
export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => null)
    const templateId = body && typeof body === 'object' ? (body as { template_id?: unknown }).template_id : undefined
    if (!templateIdValido(templateId)) {
      return NextResponse.json({ codigo: 'TEMPLATE_INVALIDO', error: 'Modelo inválido.' }, { status: 400 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const r = await aplicarTemplate(supabaseAdmin, user.id, templateId)
    return NextResponse.json(r.body, { status: r.status, headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    console.error('[onboarding/aplicar-template] Erro interno:', e?.message)
    return NextResponse.json({ codigo: 'ERRO_INESPERADO', error: 'Não foi possível aplicar o modelo agora. Tente novamente em instantes.' }, { status: 500 })
  }
}
