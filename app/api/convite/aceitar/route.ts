import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aceitarConvite } from '../../../lib/convite-aceite'

// Aceita um convite de transferencia (rota critica). A logica fica em app/lib/convite-aceite.ts
// (testavel). Dois caminhos:
//  A) e-mail ainda sem conta -> a propria pessoa define a senha aqui; a conta e criada e a
//     transferencia acontece numa unica transacao no banco.
//  B) e-mail com conta -> a pessoa entra normalmente e confirma com a sessao dela (Bearer).
// So roda no servidor, com SUPABASE_SERVICE_ROLE_KEY.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const authHeader = request.headers.get('Authorization')
    const bearer = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const r = await aceitarConvite(supabase, { token: body?.token, senha: body?.senha, bearer })
    return NextResponse.json(r.body, { status: r.status })
  } catch (err) {
    console.error('[convite/aceitar] Erro interno:', err)
    return NextResponse.json({ codigo: 'ERRO_INTERNO', error: 'Não foi possível concluir a transferência. Tente novamente.' }, { status: 500 })
  }
}
