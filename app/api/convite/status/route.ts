import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ultimosConvites } from '../../../lib/convite-store'

// Status dos ultimos convites do dono (acompanhamento do e-mail pelo Resend). Somente leitura; nunca devolve token, hash,
// ids internos nem o e-mail completo do destinatario (mascarado).
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const {
      data: { user: admin },
      error: authError,
    } = await supabase.auth.getUser(authHeader.slice(7))
    if (authError || !admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { data: perfil } = await supabase.from('perfis').select('id').eq('user_id', admin.id).maybeSingle()
    if (!perfil) return NextResponse.json({ convites: [] }, { headers: { 'Cache-Control': 'no-store' } })

    const convites = await ultimosConvites(supabase, perfil.id, 3)
    return NextResponse.json({ convites }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[convite/status] Erro interno:', err instanceof Error ? err.message : 'desconhecido')
    return NextResponse.json({ error: 'Erro ao consultar os convites.' }, { status: 500 })
  }
}
