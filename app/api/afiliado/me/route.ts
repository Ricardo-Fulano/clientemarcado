import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Endpoint leve pro sidebar saber se o usuario atual e afiliado - nunca carrega dados
// financeiros (indicacoes/comissoes/repasses), so o minimo pra decidir se mostra a secao
// AFILIADOS. A identidade do afiliado e sempre resolvida aqui, no servidor, via
// parceiros.user_id = user.id - o frontend nunca informa quem e o parceiro.
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

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Filtro sempre pelo user_id do token - nunca aceita nenhum identificador vindo do
    // client. O indice unico parcial (Fase 4A) garante 0 ou 1 resultado; se por algum
    // problema vier mais de 1, tratamos como erro em vez de escolher arbitrariamente.
    const { data: parceiros, error } = await supabaseAdmin
      .from('parceiros')
      .select('nome, cupom, ativo')
      .eq('user_id', user.id)

    if (error) {
      console.error('[api/afiliado/me] Erro ao consultar parceiro:', error.message)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    if (!parceiros || parceiros.length === 0) {
      return NextResponse.json({ afiliado: false }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (parceiros.length > 1) {
      console.error('[api/afiliado/me] Inconsistência: mais de um parceiro vinculado ao mesmo user_id:', user.id)
      return NextResponse.json({ error: 'Inconsistência de vínculo. Contate o suporte.' }, { status: 500 })
    }

    const parceiro = parceiros[0]
    // Parceiro inativo continua sendo afiliado (a flag "ativo" e sobre a parceria
    // comercial, nao sobre a existencia do vinculo/identidade).
    return NextResponse.json(
      { afiliado: true, parceiro: { nome: parceiro.nome, cupom: parceiro.cupom, ativo: parceiro.ativo } },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    console.error('[api/afiliado/me] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
