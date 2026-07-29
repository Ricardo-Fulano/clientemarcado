import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Marca TODAS as notificacoes do usuario autenticado como lidas - escopo sempre
// restrito a ele mesmo (destinatario_user_id ou destinatario_profissional_id).
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const { data: perfil } = await supabase.from('perfis').select('id').eq('user_id', user.id).maybeSingle()

    let updateQuery = supabase.from('notificacoes').update({ lida: true, updated_at: new Date().toISOString() }).eq('lida', false)

    if (perfil) {
      updateQuery = updateQuery.eq('destinatario_user_id', user.id)
    } else {
      const { data: vinculo } = await supabase
        .from('membros_equipe')
        .select('profissional_id, role, ativo')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      if (!vinculo || !vinculo.ativo || vinculo.role !== 'profissional') {
        return NextResponse.json({ error: 'Sem acesso' }, { status: 403 })
      }
      updateQuery = updateQuery.eq('destinatario_profissional_id', vinculo.profissional_id)
    }

    const { error } = await updateQuery
    if (error) {
      console.error('[notificacoes marcar-todas-lidas] Erro:', error.message)
      return NextResponse.json({ error: 'Erro ao marcar todas como lidas' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notificacoes marcar-todas-lidas] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
