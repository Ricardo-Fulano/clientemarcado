import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function formatarDataHora(dataHoraIso: string) {
  const d = new Date(dataHoraIso)
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return { data, hora }
}

// Cria notificacoes de "novo agendamento" para a administradora e, se aplicavel,
// para a profissional vinculada. Chamada pela pagina publica de agendamento
// SOMENTE depois que o agendamento ja foi inserido com sucesso - falha aqui
// nunca deve impedir o agendamento em si (o client ja trata isso com catch silencioso).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    const { user_id, servico_id, profissional_id, data_hora, cliente_nome } = body

    if (!user_id || !data_hora || !cliente_nome) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: perfil } = await supabase.from('perfis').select('id, user_id, plano_tipo').eq('user_id', user_id).maybeSingle()
    if (!perfil) return NextResponse.json({ ok: true }) // negocio nao encontrado: nao quebra nada, so nao notifica

    let servicoNome = ''
    if (servico_id) {
      const { data: servico } = await supabase.from('servicos').select('nome').eq('id', servico_id).eq('user_id', user_id).maybeSingle()
      servicoNome = servico?.nome || ''
    }

    let profissionalNome = ''
    if (profissional_id) {
      const { data: prof } = await supabase.from('profissionais').select('nome').eq('id', profissional_id).maybeSingle()
      profissionalNome = prof?.nome || ''
    }

    const { data: dataFormatada, hora: horaFormatada } = formatarDataHora(data_hora)

    // Notificacao para a administradora (sempre)
    await supabase.from('notificacoes').insert({
      perfil_id: perfil.id,
      destinatario_user_id: perfil.user_id,
      tipo: 'novo_agendamento',
      titulo: 'Novo agendamento',
      mensagem: `${cliente_nome} agendou ${servicoNome || 'um atendimento'}${profissionalNome ? ` com ${profissionalNome}` : ''} para ${dataFormatada} às ${horaFormatada}.`,
      link: '/painel/agendamentos',
    })

    // Notificacao para a profissional (so Plano Equipe + vinculo ativo)
    if (perfil.plano_tipo === 'equipe' && profissional_id) {
      const { data: vinculo } = await supabase
        .from('membros_equipe')
        .select('profissional_id, ativo, role')
        .eq('profissional_id', profissional_id)
        .eq('ativo', true)
        .eq('role', 'profissional')
        .maybeSingle()

      if (vinculo) {
        await supabase.from('notificacoes').insert({
          perfil_id: perfil.id,
          destinatario_profissional_id: profissional_id,
          tipo: 'novo_agendamento',
          titulo: 'Novo agendamento na sua agenda',
          mensagem: `${cliente_nome} agendou ${servicoNome || 'um atendimento'} com você para ${dataFormatada} às ${horaFormatada}.`,
          link: '/painel/minha-agenda',
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Nunca deixa isso "vazar" como erro critico - e so uma notificacao
    console.error('[publico/notificar-agendamento] Erro interno:', err)
    return NextResponse.json({ ok: true })
  }
}
