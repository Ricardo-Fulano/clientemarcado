import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function gerarSenhaTemporaria() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let senha = ''
  for (let i = 0; i < 10; i++) senha += chars[crypto.randomInt(0, chars.length)]
  return senha
}

// Cria o login individual de uma profissional (Plano Equipe apenas).
// So funciona no servidor, com SUPABASE_SERVICE_ROLE_KEY - nunca no client.
// Lista os vinculos de acesso ja criados para o perfil da administradora autenticada
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: admin }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !admin) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const { data: perfil } = await supabase.from('perfis').select('id').eq('user_id', admin.id).single()
    if (!perfil) return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })

    const { data: membros } = await supabase
      .from('membros_equipe')
      .select('profissional_id, email, ativo')
      .eq('perfil_id', perfil.id)

    return NextResponse.json({ ok: true, membros: membros || [] })
  } catch (err) {
    console.error('[equipe/criar-acesso GET] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: admin }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !admin) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    const { profissional_id, email } = body
    if (!profissional_id || typeof profissional_id !== 'string') return NextResponse.json({ error: 'profissional_id invalido' }, { status: 400 })
    if (!email || typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'E-mail invalido' }, { status: 400 })

    // Confirma que quem chama e dona de um perfil no Plano Equipe
    const { data: perfil } = await supabase.from('perfis').select('id, plano_tipo').eq('user_id', admin.id).single()
    if (!perfil) return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })
    if (perfil.plano_tipo !== 'equipe') {
      return NextResponse.json({ error: 'Login individual para profissionais esta disponivel no Plano Equipe.' }, { status: 403 })
    }

    // Confirma que o profissional_id pertence a ESSE perfil (evita criar acesso pra profissional de outro negocio)
    const { data: profissional } = await supabase.from('profissionais').select('id, perfil_id, nome').eq('id', profissional_id).single()
    if (!profissional || profissional.perfil_id !== perfil.id) {
      return NextResponse.json({ error: 'Profissional nao encontrado neste negocio' }, { status: 403 })
    }

    // Evita duplicar acesso
    const { data: vinculoExistente } = await supabase.from('membros_equipe').select('id').eq('profissional_id', profissional_id).maybeSingle()
    if (vinculoExistente) {
      return NextResponse.json({ error: 'Este profissional ja possui um acesso criado.' }, { status: 409 })
    }

    const senhaTemporaria = gerarSenhaTemporaria()

    const { data: novoUsuario, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: { role: 'profissional', nome: profissional.nome },
    })

    if (createUserError || !novoUsuario?.user) {
      console.error('[equipe/criar-acesso] Erro ao criar usuario auth:', createUserError?.message)
      const msg = createUserError?.message?.includes('already been registered')
        ? 'Este e-mail ja esta cadastrado no sistema.'
        : 'Erro ao criar acesso. Tente novamente.'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const { error: insertError } = await supabase.from('membros_equipe').insert({
      perfil_id: perfil.id,
      profissional_id,
      auth_user_id: novoUsuario.user.id,
      email,
      role: 'profissional',
      ativo: true,
    })

    if (insertError) {
      console.error('[equipe/criar-acesso] Erro ao vincular membro:', insertError.message)
      // Tenta desfazer a criacao do usuario auth pra nao deixar orfao
      await supabase.auth.admin.deleteUser(novoUsuario.user.id).catch(() => {})
      return NextResponse.json({ error: 'Erro ao vincular acesso. Tente novamente.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, email, senha_temporaria: senhaTemporaria })
  } catch (err) {
    console.error('[equipe/criar-acesso] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
