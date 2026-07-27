import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rota leve, usada pelo layout do painel pra saber se quem esta logado
// e uma profissional com acesso individual (ou a dona do negocio, comportamento padrao).
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const { data: vinculo } = await supabase
      .from('membros_equipe')
      .select('role, ativo, profissional_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!vinculo) return NextResponse.json({ role: null, ativo: false })

    let nome_profissional = ''
    if (vinculo.profissional_id) {
      const { data: profissional } = await supabase.from('profissionais').select('nome').eq('id', vinculo.profissional_id).single()
      nome_profissional = profissional?.nome || ''
    }

    return NextResponse.json({ role: vinculo.role, ativo: vinculo.ativo, nome_profissional })
  } catch (err) {
    console.error('[equipe/meu-vinculo] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
