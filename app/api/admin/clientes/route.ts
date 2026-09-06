import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// E-mail unico autorizado a ver a lista de clientes cadastrados - constante isolada aqui
// em cima, facil de trocar se precisar no futuro. A validacao acontece 100% aqui dentro
// da API (server-side), nunca confiando so no frontend esconder o botao/aba - mesmo que
// alguem chame essa rota diretamente por fora do navegador, sem o token certo ou com um
// email diferente, a API bloqueia.
const EMAIL_AUTORIZADO = 'misteriosoviaje@gmail.com'

// Nomes amigaveis por plano - mesmos valores internos ja usados no resto do sistema
// (free/minipage/loja/essencial/equipe), sem inventar plano_tipo novo.
const NOME_PLANO: Record<string, string> = {
  free: 'MiniPage Free',
  minipage: 'MiniPage',
  loja: 'MiniPage Loja',
  essencial: 'MiniPage Pro',
  equipe: 'MiniPage Equipe',
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Valida o token recebido contra o proprio Supabase Auth - garante que a sessao e
    // real e nao foi forjada, antes de olhar o e-mail dela.
    const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    // Checagem central de autorizacao - unico ponto que decide quem pode ver os dados.
    // Case-insensitive por seguranca (e-mails no Supabase Auth normalmente ja vem em
    // minusculas, mas nao custa normalizar aqui tambem).
    if ((user.email || '').toLowerCase() !== EMAIL_AUTORIZADO.toLowerCase()) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 })
    }

    // So a partir daqui usamos a service role key - ela nunca fica exposta ao frontend,
    // so roda aqui dentro da API, depois de confirmar que quem pediu e o email certo.
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: perfis, error: perfisError } = await supabaseAdmin
      .from('perfis')
      .select('*')
      .order('created_at', { ascending: false })

    if (perfisError) {
      return NextResponse.json({ error: 'Erro ao buscar clientes: ' + perfisError.message }, { status: 500 })
    }

    // E-mail do cliente vem de auth.users, nao de perfis - busca em lote via admin API
    // (listUsers), depois junta pelo user_id. Evita 1 chamada por perfil.
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    if (usersError) {
      return NextResponse.json({ error: 'Erro ao buscar e-mails: ' + usersError.message }, { status: 500 })
    }
    const emailPorUserId = new Map(usersData.users.map(u => [u.id, u.email || '']))

    // Nomes de coluna variam ao longo do historico do projeto (nome_pagina, nome_negocio,
    // nome) e o campo de origem/cupom pode nao existir em toda instalacao - por isso os
    // fallbacks defensivos abaixo, sem quebrar se algum campo nao existir na linha.
    const clientes = (perfis || []).map((p: any) => ({
      user_id: p.user_id,
      nome_pagina: p.nome_pagina ?? p.nome_negocio ?? p.nome ?? null,
      email: emailPorUserId.get(p.user_id) || null,
      slug: p.slug || null,
      plano_tipo: p.plano_tipo || null,
      plano_nome: p.plano_tipo && NOME_PLANO[p.plano_tipo] ? NOME_PLANO[p.plano_tipo] : 'Plano não identificado',
      status_acesso: p.status_acesso || null,
      created_at: p.created_at,
      origem: p.indicado_por_cupom ?? p.parceiro_cupom ?? p.cupom_origem ?? null,
    }))

    return NextResponse.json({ success: true, clientes })
  } catch (e: any) {
    console.error('[admin/clientes] Erro:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
