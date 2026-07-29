import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lista notificacoes do usuario autenticado, filtrando corretamente por papel:
// - admin: notificacoes onde destinatario_user_id = seu proprio user_id
// - profissional: notificacoes onde destinatario_profissional_id = o profissional_id do seu vinculo
// Acesso via service role - a tabela nao tem policy de SELECT pro cliente.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const { data: perfil } = await supabase.from('perfis').select('id').eq('user_id', user.id).maybeSingle()

    let query = supabase.from('notificacoes').select('*').order('created_at', { ascending: false }).limit(50)

    if (perfil) {
      // E a administradora: ve as notificacoes destinadas a ela mesma
      query = query.eq('destinatario_user_id', user.id)
    } else {
      // Pode ser uma profissional com acesso individual
      const { data: vinculo } = await supabase
        .from('membros_equipe')
        .select('profissional_id, role, ativo')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (!vinculo || !vinculo.ativo || vinculo.role !== 'profissional') {
        return NextResponse.json({ ok: true, notificacoes: [], naoLidas: 0 })
      }
      query = query.eq('destinatario_profissional_id', vinculo.profissional_id)
    }

    const { data: notificacoes, error } = await query
    if (error) {
      console.error('[notificacoes GET] Erro:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar notificacoes' }, { status: 500 })
    }

    const naoLidas = (notificacoes || []).filter(n => !n.lida).length

    return NextResponse.json({ ok: true, notificacoes: notificacoes || [], naoLidas })
  } catch (err) {
    console.error('[notificacoes GET] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
