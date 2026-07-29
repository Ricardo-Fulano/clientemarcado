import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Chamada pelo client da administradora, depois que ela ja atualizou o status
// do agendamento (nao bloqueia nem depende dessa chamada). Notifica a profissional
// vinculada, se ela tiver login ativo (Plano Equipe).
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const agendamentoId = body?.agendamento_id
    const novoStatus = body?.novo_status
    if (!agendamentoId || !['realizado', 'pendente'].includes(novoStatus)) {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
    }

    const { data: perfil } = await supabase.from('perfis').select('id').eq('user_id', user.id).maybeSingle()
    if (!perfil) return NextResponse.json({ ok: true }) // nao e admin: apenas ignora, sem quebrar nada

    // Confirma que o agendamento pertence mesmo a essa administradora
    const { data: agendamento } = await supabase
      .from('agendamentos')
      .select('id, cliente_nome, profissional_id')
      .eq('id', agendamentoId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!agendamento || !agendamento.profissional_id) return NextResponse.json({ ok: true })

    const { data: vinculo } = await supabase
      .from('membros_equipe')
      .select('profissional_id, ativo, role')
      .eq('profissional_id', agendamento.profissional_id)
      .eq('ativo', true)
      .eq('role', 'profissional')
      .maybeSingle()

    if (!vinculo) return NextResponse.json({ ok: true })

    const clienteNome = agendamento.cliente_nome || 'um cliente'

    if (novoStatus === 'realizado') {
      await supabase.from('notificacoes').insert({
        perfil_id: perfil.id,
        destinatario_profissional_id: agendamento.profissional_id,
        tipo: 'atendimento_realizado',
        titulo: 'Atendimento realizado',
        mensagem: `Sua administradora marcou o atendimento de ${clienteNome} como realizado.`,
        link: '/painel/minha-agenda',
      })
    } else {
      await supabase.from('notificacoes').insert({
        perfil_id: perfil.id,
        destinatario_profissional_id: agendamento.profissional_id,
        tipo: 'desfazer_realizado',
        titulo: 'Atendimento reaberto',
        mensagem: `O atendimento de ${clienteNome} deixou de estar marcado como realizado.`,
        link: '/painel/minha-agenda',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notificacoes/evento-status] Erro interno:', err)
    return NextResponse.json({ ok: true })
  }
}
