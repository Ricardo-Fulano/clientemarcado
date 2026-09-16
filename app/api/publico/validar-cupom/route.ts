import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Endpoint publico por necessidade funcional (o cadastro precisa validar cupom antes de o
// cliente ter conta) - mas retorna o MINIMO possivel: nunca nome, email, whatsapp, comissao
// ou qualquer dado administrativo do parceiro. Service Role usado so aqui dentro, nunca
// exposta ao navegador.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cupomBruto = searchParams.get('cupom')

    if (typeof cupomBruto !== 'string' || !cupomBruto.trim() || cupomBruto.length > 50) {
      return NextResponse.json({ valido: false })
    }
    const cupom = cupomBruto.trim().toUpperCase()

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Query exata por cupom - nunca aceita coluna/filtro arbitrario vindo do request.
    const { data: parceiro, error } = await supabaseAdmin
      .from('parceiros')
      .select('id, cupom, ativo')
      .eq('cupom', cupom)
      .maybeSingle()

    if (error) {
      console.error('[api/publico/validar-cupom] Erro:', error.message)
      return NextResponse.json({ valido: false })
    }

    // Mesma resposta pra "nao existe" e "existe mas inativo" - nao da pra um visitante
    // descobrir por tentativa qual cupom existe de verdade mas esta desativado.
    if (!parceiro || !parceiro.ativo) {
      return NextResponse.json({ valido: false })
    }

    return NextResponse.json({ valido: true, parceiroId: parceiro.id, cupom: parceiro.cupom })
  } catch (e: any) {
    console.error('[api/publico/validar-cupom] Erro interno:', e?.message)
    return NextResponse.json({ valido: false })
  }
}
