import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Retorna apenas os agendamentos do profissional autenticado (via vinculo em membros_equipe).
// Roda no servidor com SUPABASE_SERVICE_ROLE_KEY - o filtro de seguranca e feito aqui,
// nao depende de RLS (que nao foi alterada nesta etapa).
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
      .select('perfil_id, profissional_id, role, ativo')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!vinculo || !vinculo.ativo || vinculo.role !== 'profissional') {
      return NextResponse.json({ error: 'Sem acesso a agenda individual' }, { status: 403 })
    }

    const { data: perfil } = await supabase.from('perfis').select('user_id, nome_negocio').eq('id', vinculo.perfil_id).single()
    if (!perfil) return NextResponse.json({ error: 'Negocio nao encontrado' }, { status: 404 })

    const { data: profissional } = await supabase.from('profissionais').select('nome').eq('id', vinculo.profissional_id).single()

    // Apenas campos nao-financeiros: cliente, servico, horario, status
    const { data: agendamentos, error: agsError } = await supabase
      .from('agendamentos')
      .select('id, cliente_nome, cliente_whatsapp, data_hora, status, observacoes, servicos(nome)')
      .eq('user_id', perfil.user_id)
      .eq('profissional_id', vinculo.profissional_id)
      .order('data_hora', { ascending: true })

    if (agsError) {
      console.error('[equipe/minha-agenda] Erro ao buscar agendamentos:', agsError.message)
      return NextResponse.json({ error: 'Erro ao buscar agenda' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      nome_negocio: perfil.nome_negocio,
      nome_profissional: profissional?.nome || '',
      agendamentos: agendamentos || [],
    })
  } catch (err) {
    console.error('[equipe/minha-agenda] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Atualiza status de um agendamento (ex: marcar como realizado) - so o proprio profissional, so seu proprio agendamento
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const { data: vinculo } = await supabase
      .from('membros_equipe')
      .select('perfil_id, profissional_id, role, ativo')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!vinculo || !vinculo.ativo || vinculo.role !== 'profissional') {
      return NextResponse.json({ error: 'Sem acesso a agenda individual' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const { agendamento_id, status } = body || {}
    const statusPermitidos = ['realizado', 'pendente', 'faltou', 'cancelado']
    if (!agendamento_id || !statusPermitidos.includes(status)) {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
    }

    const { data: perfil } = await supabase.from('perfis').select('user_id').eq('id', vinculo.perfil_id).single()
    if (!perfil) return NextResponse.json({ error: 'Negocio nao encontrado' }, { status: 404 })

    // So atualiza se o agendamento for do MESMO negocio e do MESMO profissional
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({ status })
      .eq('id', agendamento_id)
      .eq('user_id', perfil.user_id)
      .eq('profissional_id', vinculo.profissional_id)

    if (updateError) {
      console.error('[equipe/minha-agenda] Erro ao atualizar status:', updateError.message)
      return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[equipe/minha-agenda] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
