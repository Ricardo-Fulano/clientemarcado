import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rota publica (sem login) usada pela pagina /parceiro/[cupom] pra o parceiro acompanhar
// so os proprios dados. Usa service role pra ler sem depender de sessao autenticada, mas
// SEMPRE filtra por cupom - nunca devolve lista geral nem dados de outro parceiro.
export async function GET(request: Request, { params }: { params: Promise<{ cupom: string }> }) {
  try {
    const { cupom } = await params
    const cupomLimpo = (cupom || '').toUpperCase().trim()
    if (!cupomLimpo) {
      return NextResponse.json({ error: 'Cupom invalido' }, { status: 400 })
    }

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

    const { data: indicacoes } = await supabase
      .from('indicacoes_parceiros')
      .select('*')
      .eq('parceiro_id', parceiro.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ parceiro, indicacoes: indicacoes || [] })
  } catch (e: any) {
    console.error('[api/parceiro/[cupom]] Erro:', e?.message)
    return NextResponse.json({ error: 'Erro ao carregar dados do parceiro' }, { status: 500 })
  }
}
