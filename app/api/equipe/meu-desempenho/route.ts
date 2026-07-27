import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Mesmo conceito de "realizado" usado no pedido - atendimento que de fato aconteceu.
// Nao inclui 'confirmado' (que no relatorio administrativo serve para estimar receita
// de agendamentos futuros ja confirmados - conceito diferente de producao individual).
const STATUS_REALIZADO = ['realizado', 'Realizado', 'concluido', 'concluído', 'finalizado', 'compareceu']

function getRangeData(periodo: string) {
  const agora = new Date()
  if (periodo === 'hoje') {
    const hojeStr = agora.toISOString().split('T')[0]
    return { inicio: hojeStr + 'T00:00:00', fim: hojeStr + 'T23:59:59' }
  }
  if (periodo === 'semana') {
    const inicioSemana = new Date(agora)
    inicioSemana.setDate(agora.getDate() - agora.getDay())
    inicioSemana.setHours(0, 0, 0, 0)
    return { inicio: inicioSemana.toISOString(), fim: agora.toISOString() }
  }
  if (periodo === 'mes') {
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    return { inicio: inicioMes.toISOString(), fim: agora.toISOString() }
  }
  return null // 'todos': sem filtro de data
}

// Retorna, com seguranca, apenas o desempenho do profissional autenticado.
// Roda no servidor com SUPABASE_SERVICE_ROLE_KEY - mesmo padrao de validacao
// ja usado em /api/equipe/minha-agenda (nao depende de RLS).
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
      return NextResponse.json({ error: 'Sem acesso a esta area' }, { status: 403 })
    }

    const { data: perfil } = await supabase.from('perfis').select('user_id').eq('id', vinculo.perfil_id).single()
    if (!perfil) return NextResponse.json({ error: 'Negocio nao encontrado' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const periodoParam = searchParams.get('periodo') || 'mes'
    const periodo = ['hoje', 'semana', 'mes', 'todos'].includes(periodoParam) ? periodoParam : 'mes'

    let query = supabase
      .from('agendamentos')
      .select('id, cliente_nome, data_hora, status, valor, servicos(nome, preco)')
      .eq('user_id', perfil.user_id)
      .eq('profissional_id', vinculo.profissional_id)
      .order('data_hora', { ascending: false })

    const range = getRangeData(periodo)
    if (range) query = query.gte('data_hora', range.inicio).lte('data_hora', range.fim)

    const { data: agendamentos, error: agsError } = await query

    if (agsError) {
      console.error('[equipe/meu-desempenho] Erro ao buscar agendamentos:', agsError.message)
      return NextResponse.json({ error: 'Erro ao buscar desempenho' }, { status: 500 })
    }

    const realizados = (agendamentos || []).filter((a: any) => STATUS_REALIZADO.includes(a.status || ''))

    const totalProduzido = realizados.reduce((acc: number, a: any) => acc + (a.valor || a.servicos?.preco || 0), 0)
    const totalAtendimentos = realizados.length
    const ticketMedio = totalAtendimentos > 0 ? totalProduzido / totalAtendimentos : 0

    const contagemServicos: Record<string, number> = {}
    realizados.forEach((a: any) => {
      const nome = a.servicos?.nome || 'Serviço'
      contagemServicos[nome] = (contagemServicos[nome] || 0) + 1
    })
    let servicoMaisRealizado = ''
    let maiorContagem = 0
    Object.entries(contagemServicos).forEach(([nome, qtd]) => {
      if (qtd > maiorContagem) { maiorContagem = qtd; servicoMaisRealizado = nome }
    })

    const atendimentos = realizados.map((a: any) => ({
      id: a.id,
      cliente_nome: a.cliente_nome,
      servico_nome: a.servicos?.nome || 'Serviço',
      data_hora: a.data_hora,
      valor: a.valor || a.servicos?.preco || 0,
      status: a.status,
    }))

    return NextResponse.json({
      ok: true,
      periodo,
      totalProduzido,
      totalAtendimentos,
      ticketMedio,
      servicoMaisRealizado,
      atendimentos,
    })
  } catch (err) {
    console.error('[equipe/meu-desempenho] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
