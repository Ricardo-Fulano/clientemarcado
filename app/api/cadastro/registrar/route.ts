import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { registrarConta } from '../../../lib/cadastro-registrar'

// Cadastro de conta nova. Roda no servidor: cria o usuario ja confirmado (sem e-mail de
// confirmacao), o perfil, e devolve a sessao. Ver app/lib/cadastro-registrar.ts.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') return NextResponse.json({ codigo: 'REQUISICAO_INVALIDA', error: 'Requisição inválida.' }, { status: 400 })

    // IP real do visitante (a Vercel preenche x-forwarded-for).
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip') || null

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const criarClienteAnon = () => createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })

    const r = await registrarConta(supabase, { ...body, ip }, criarClienteAnon)
    return NextResponse.json(r.body, { status: r.status })
  } catch (err) {
    console.error('[cadastro/registrar] Erro interno:', err)
    return NextResponse.json({ codigo: 'ERRO_INTERNO', error: 'Não conseguimos concluir seu cadastro agora. Tente novamente ou fale com nosso suporte.' }, { status: 500 })
  }
}
