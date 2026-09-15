import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizarPlano, obterNomePlano, obterPrecoPlano } from '../../../lib/planos'

// Rota publica (sem login) usada pela pagina /parceiro/[cupom]. CORRECAO DE SEGURANCA: essa
// rota NUNCA mais devolve a lista individual de indicacoes (nome, email, slug de cada
// cliente indicado) - so agregados calculados aqui no servidor (cadastros, pagantes,
// comissao pendente/paga, resumo por plano). O cupom nunca foi um mecanismo de autenticacao
// de verdade (qualquer pessoa que o descobrisse via URL via dados pessoais de terceiros) -
// aqui reduzimos a exposicao ao minimo necessario pro parceiro acompanhar seus numeros,
// sem expor dados pessoais de ninguem. Sem alterar schema, sem criar autenticacao
// improvisada - so reduz o que a resposta publica revela.
//
// Usa a MESMA fonte de planos que o resto do sistema (lib/planos.ts) - antes esta rota
// tinha uma lista propria, hardcoded, que faltava o plano 'loja' inteiro (contando esses
// clientes erradamente dentro de 'essencial'/Pro) e tinha precos desatualizados.
function comissaoDoIndicado(ind: any) {
  // Regra ja combinada: 20% sobre o preco tabelado atual do plano (nao o valor real pago -
  // o sistema ainda nao persiste isso, ja documentado em /painel/parceiros).
  return obterPrecoPlano(normalizarPlano(ind?.plano_tipo)) * 0.2
}
const ehPagante = (ind: any) => ind.is_pagante || ind.status === 'pagante'

export async function GET(request: Request, { params }: { params: Promise<{ cupom: string }> }) {
  try {
    const { cupom } = await params
    const cupomLimpo = (cupom || '').toUpperCase().trim()
    if (!cupomLimpo) {
      return NextResponse.json({ error: 'Cupom invalido' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const inicioParam = searchParams.get('inicio')
    const fimParam = searchParams.get('fim')
    const inicio = inicioParam ? new Date(inicioParam) : null
    const fim = fimParam ? new Date(fimParam) : null

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: parceiro, error: erroParceiro } = await supabase
      .from('parceiros')
      .select('id, nome, cupom, tipo, ativo')
      .eq('cupom', cupomLimpo)
      .maybeSingle()

    if (erroParceiro || !parceiro) {
      return NextResponse.json({ error: 'Parceiro nao encontrado' }, { status: 404 })
    }

    const { data: indicacoesBrutas } = await supabase
      .from('indicacoes_parceiros')
      .select('*')
      .eq('parceiro_id', parceiro.id)
      .order('created_at', { ascending: false })

    const todas = indicacoesBrutas || []
    const filtradas = todas.filter(ind => {
      if (!inicio || !fim) return true
      if (!ind.created_at) return false
      const d = new Date(ind.created_at)
      return d >= inicio && d <= fim
    })

    const pagantes = filtradas.filter(ehPagante)
    const comissaoPendente = pagantes.filter(i => i.comissao_status !== 'paga').reduce((a, i) => a + comissaoDoIndicado(i), 0)
    const comissaoPaga = pagantes.filter(i => i.comissao_status === 'paga').reduce((a, i) => a + comissaoDoIndicado(i), 0)

    const comPlanoDefinido = filtradas.filter(i => i.plano_tipo !== null && i.plano_tipo !== undefined && i.plano_tipo !== '')
    // Free nunca entra nesse resumo comissionavel (nao tem mensalidade nem gera comissao) -
    // contado separadamente abaixo, so como informacao, sem misturar com os cards
    // financeiros.
    const cadastrosFree = comPlanoDefinido.filter(i => normalizarPlano(i.plano_tipo) === 'free').length
    const resumoPorPlano = (['minipage', 'loja', 'essencial', 'equipe'] as const).map(chave => {
      const doPlano = comPlanoDefinido.filter(i => normalizarPlano(i.plano_tipo) === chave)
      const pagantesDoPlano = doPlano.filter(ehPagante)
      const comissao = pagantesDoPlano.reduce((a, i) => a + comissaoDoIndicado(i), 0)
      return { chave, nome: obterNomePlano(chave), cadastros: doPlano.length, pagantes: pagantesDoPlano.length, comissao }
    })

    // Nunca inclui a lista bruta de indicacoes (nome, email, slug de cada cliente indicado)
    // na resposta - so os agregados calculados acima.
    return NextResponse.json({
      parceiro,
      agregados: {
        cadastros: filtradas.length,
        pagantes: pagantes.length,
        comissaoPendente,
        comissaoPaga,
        resumoPorPlano,
        cadastrosFree,
      },
    })
  } catch (e: any) {
    console.error('[api/parceiro/[cupom]] Erro:', e?.message)
    return NextResponse.json({ error: 'Erro ao carregar dados do parceiro' }, { status: 500 })
  }
}
