import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aceitarConvite } from '../../../lib/convite-aceite'

// Aceita um convite de transferencia (rota critica). A logica fica em app/lib/convite-aceite.ts
// (testavel). Dois caminhos:
//  A) e-mail ainda sem conta -> a propria pessoa informa nome, senha e termos; a conta e criada
//     ja confirmada e a transferencia acontece numa unica transacao no banco.
//  B) e-mail com conta -> a pessoa entra normalmente e confirma com a sessao dela (Bearer).
// So roda no servidor, com SUPABASE_SERVICE_ROLE_KEY.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const authHeader = request.headers.get('Authorization')
    const bearer = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const criarClienteAnon = () => createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
    const r = await aceitarConvite(supabase, {
      token: body?.token, senha: body?.senha, confirmar: body?.confirmar, nome: body?.nome, termos: body?.termos === true, bearer,
    }, criarClienteAnon)
    return NextResponse.json(r.body, { status: r.status })
  } catch (err) {
    console.error('[convite/aceitar] Erro interno:', err)
    return NextResponse.json({ codigo: 'ERRO_INTERNO', error: 'Não foi possível concluir a transferência. Tente novamente.' }, { status: 500 })
  }
}
