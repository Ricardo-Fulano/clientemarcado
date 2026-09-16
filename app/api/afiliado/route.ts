import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Mascara o email preservando so a primeira letra - usado apenas se a UI realmente
// precisar mostrar algo do email do indicado (minimiza PII exposta ao afiliado).
function mascararEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const [usuario, dominio] = email.split('@')
  if (!dominio) return null
  const primeira = usuario.slice(0, 1)
  return `${primeira}${'*'.repeat(Math.max(usuario.length - 1, 1))}@${dominio}`
}

// GET /api/afiliado - dados completos (financeiros) do parceiro vinculado ao usuario
// autenticado. A identidade e SEMPRE resolvida aqui, no servidor, via
// parceiros.user_id = user.id - nunca aceita parceiroId/cupom/email vindos do client.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    const supabaseAdmin: any = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Localiza o parceiro vinculado a esse usuario - o UNIQUE parcial (Fase 4A) garante
    // 0 ou 1 resultado. Se por corrupcao vier mais de 1, tratamos como erro em vez de
    // escolher arbitrariamente qual parceiro mostrar.
    const { data: parceiros, error: erroParceiro } = await supabaseAdmin
      .from('parceiros')
      .select('id, nome, cupom, ativo, tipo')
      .eq('user_id', user.id)

    if (erroParceiro) {
      console.error('[api/afiliado] Erro ao buscar parceiro:', erroParceiro.message)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
    if (!parceiros || parceiros.length === 0) {
      return NextResponse.json({ error: 'Você não possui vínculo de afiliado.' }, { status: 403 })
    }
    if (parceiros.length > 1) {
      console.error('[api/afiliado] Inconsistência: mais de um parceiro vinculado ao mesmo user_id:', user.id)
      return NextResponse.json({ error: 'Inconsistência de vínculo. Contate o suporte.' }, { status: 500 })
    }
    const parceiro = parceiros[0]

    // 1 query por tabela, sempre filtrada pelo parceiro atual - nunca N+1, nunca traz
    // dados de outros parceiros pra depois filtrar em memoria.
    const [indicacoesRes, comissoesRes, repassesRes] = await Promise.all([
      supabaseAdmin
        .from('indicacoes_parceiros')
        .select('id, nome_negocio, nome_responsavel, email, status, created_at, plano_tipo')
        .eq('parceiro_id', parceiro.id)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('comissoes_parceiros')
        .select('id, indicacao_id, plano_tipo, valor_pago, percentual, valor_comissao, competencia, status, data_pagamento_cliente, created_at, repasse_id')
        .eq('parceiro_id', parceiro.id)
        .order('data_pagamento_cliente', { ascending: false }),
      supabaseAdmin
        .from('repasses_parceiros')
        .select('id, competencia, valor_total, qtd_comissoes, data_repasse, status, created_at')
        .eq('parceiro_id', parceiro.id)
        .order('data_repasse', { ascending: false }),
    ])

    if (indicacoesRes.error || comissoesRes.error || repassesRes.error) {
      const erro = indicacoesRes.error || comissoesRes.error || repassesRes.error
      console.error('[api/afiliado] Erro ao carregar dados:', erro?.message)
      return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 })
    }

    const indicacoes = indicacoesRes.data || []
    const comissoes = comissoesRes.data || []
    const repasses = repassesRes.data || []

    // ===== Resumo - mesma logica ja usada no painel admin (Fase 3C/3D) =====
    const comissoesValidas = comissoes.filter((c: any) => c.status === 'pendente' || c.status === 'paga')
    const indicacoesComComissaoValida = new Set(comissoesValidas.map((c: any) => c.indicacao_id))
    const pagantes = indicacoes.filter((i: any) => indicacoesComComissaoValida.has(i.id)).length

    const agora = new Date()
    const competenciaAtual = `${agora.getUTCFullYear()}-${String(agora.getUTCMonth() + 1).padStart(2, '0')}-01`
    const comissaoDesteMes = comissoesValidas
      .filter((c: any) => c.competencia === competenciaAtual)
      .reduce((a: number, c: any) => a + Number(c.valor_comissao || 0), 0)

    const aReceber = comissoes
      .filter((c: any) => c.status === 'pendente')
      .reduce((a: number, c: any) => a + Number(c.valor_comissao || 0), 0)

    // Total recebido: soma de repasses (fonte autoritativa de "isso foi realmente pago"),
    // nunca soma direta de comissoes status='paga' - decisao ja tomada na Fase 4.1.
    const totalRecebido = repasses.reduce((a: number, r: any) => a + Number(r.valor_total || 0), 0)

    // ATENCAO: status_acesso nao e uma coluna fisica de indicacoes_parceiros (confirmado
    // via erro real de producao) - e derivado no painel admin via join client-side com
    // perfis, que essa rota nao replica ainda. Ate essa arquitetura ser resolvida (fora do
    // escopo desta fase), ativos/em atraso/cancelados ficam conservadoramente em 0 em vez
    // de crashar ou inventar um valor.
    const ativos = 0
    const emAtraso = 0
    const cancelados = 0

    // ===== Por indicacao: primeiro/ultimo pagamento, comissoes validas, acumulado,
    // janela de elegibilidade (formula identica a registrar_comissao_pagamento) =====
    const detalheIndicacoes = indicacoes.map((ind: any) => {
      const comissoesDaIndicacao = comissoesValidas.filter((c: any) => c.indicacao_id === ind.id)
      const datasPagamento = comissoesDaIndicacao.map((c: any) => new Date(c.data_pagamento_cliente).getTime())
      const primeiroPagamento = datasPagamento.length ? new Date(Math.min(...datasPagamento)).toISOString() : null
      const ultimoPagamento = datasPagamento.length ? new Date(Math.max(...datasPagamento)).toISOString() : null
      const comissaoAcumulada = comissoesDaIndicacao.reduce((a: number, c: any) => a + Number(c.valor_comissao || 0), 0)

      // Janela: replica exatamente "p_data_pagamento_cliente >= v_primeiro_pagamento +
      // interval '12 months'" da RPC - mesma aritmetica de timestamp UTC, sem conversao
      // de timezone (a RPC so usa America/Sao_Paulo pra bucket de competencia, nunca pra
      // essa comparacao de janela).
      let elegivelAteExclusivo: string | null = null
      if (primeiroPagamento) {
        const d = new Date(primeiroPagamento)
        d.setUTCMonth(d.getUTCMonth() + 12)
        elegivelAteExclusivo = d.toISOString()
      }

      return {
        id: ind.id,
        nomeNegocio: ind.nome_negocio,
        nomeResponsavel: ind.nome_responsavel,
        emailMascarado: mascararEmail(ind.email),
        status: ind.status,
        statusAcesso: null, // ver nota acima - status_acesso nao existe fisicamente ainda
        createdAt: ind.created_at,
        planoTipo: ind.plano_tipo,
        primeiroPagamento,
        ultimoPagamento,
        comissoesValidasGeradas: comissoesDaIndicacao.length,
        comissaoAcumulada,
        // Data-limite exclusiva (o proprio dia retornado ja NAO e mais elegivel, seguindo
        // a mesma condicao ">=" de rejeicao da RPC).
        elegivelAteExclusivo,
      }
    })

    return NextResponse.json(
      {
        parceiro: { nome: parceiro.nome, cupom: parceiro.cupom, ativo: parceiro.ativo, tipo: parceiro.tipo },
        resumo: {
          totalIndicados: indicacoes.length,
          pagantes,
          ativos,
          emAtraso,
          cancelados,
          comissaoDesteMes,
          aReceber,
          totalRecebido,
        },
        indicacoes: detalheIndicacoes,
        comissoes: comissoes.map((c: any) => ({
          id: c.id,
          indicacaoId: c.indicacao_id,
          planoTipo: c.plano_tipo,
          valorPago: c.valor_pago,
          percentual: c.percentual,
          valorComissao: c.valor_comissao,
          competencia: c.competencia,
          status: c.status,
          dataPagamentoCliente: c.data_pagamento_cliente,
        })),
        repasses: repasses.map((r: any) => ({
          id: r.id,
          competencia: r.competencia,
          valorTotal: r.valor_total,
          qtdComissoes: r.qtd_comissoes,
          dataRepasse: r.data_repasse,
          status: r.status,
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    console.error('[api/afiliado] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
