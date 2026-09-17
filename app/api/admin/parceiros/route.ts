import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Mesmos UUIDs ja usados em app/painel/parceiros/page.tsx - nao criar uma regra paralela
// divergente. Se um dia isso mudar, precisa mudar nos dois lugares (ou extrair pra um
// helper compartilhado numa proxima refatoracao maior).
const ADMIN_IDS = [
  '618aedd1-f174-4419-b4b2-b81b8dd1c47e', // canal19horas@gmail.com
  'f2203e3c-9d23-4635-9d14-b990b5198b8a', // misteriosoviaje@gmail.com
]

// Endpoint administrativo (Fase 3C): agrega em uma unica resposta tudo que o painel
// /painel/parceiros precisa - incluindo comissoes_parceiros e repasses_parceiros, que tem
// RLS habilitado sem policy pra client-side, entao so podem ser lidas aqui, no servidor,
// com Service Role - nunca diretamente do navegador.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Valida o token contra o proprio Supabase Auth - garante que a sessao e real, nao
    // forjada, antes de olhar quem e o usuario.
    const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    // Checagem central de autorizacao - unico ponto que decide quem pode ver os dados
    // financeiros dos parceiros. Nunca aceita admin/user_id vindo de query ou body.
    if (!ADMIN_IDS.includes(user.id)) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 })
    }

    // So a partir daqui usamos a service role key - nunca exposta ao frontend.
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const [parceirosRes, indicacoesRes, comissoesRes, repassesRes, convitesRes] = await Promise.all([
      supabaseAdmin.from('parceiros').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('indicacoes_parceiros').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('comissoes_parceiros').select('*').order('data_pagamento_cliente', { ascending: false }),
      supabaseAdmin.from('repasses_parceiros').select('*').order('data_repasse', { ascending: false }),
      supabaseAdmin.from('convites_parceiros').select('parceiro_id, email_convidado, status, expira_em').eq('status', 'pendente'),
    ])

    if (parceirosRes.error || indicacoesRes.error || comissoesRes.error || repassesRes.error || convitesRes.error) {
      const erro = parceirosRes.error || indicacoesRes.error || comissoesRes.error || repassesRes.error || convitesRes.error
      console.error('[api/admin/parceiros] Erro ao carregar dados:', erro?.message)
      return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 })
    }

    return NextResponse.json({
      parceiros: parceirosRes.data || [],
      indicacoes: indicacoesRes.data || [],
      comissoes: comissoesRes.data || [],
      repasses: repassesRes.data || [],
      convitesPendentes: convitesRes.data || [],
    })
  } catch (e: any) {
    console.error('[api/admin/parceiros] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Whitelist explicita de campos aceitos no criar/editar parceiro - nunca um update(body)
// direto. Campos como id/created_at/comissao_fixa nunca sao aceitos vindo do client aqui.
function extrairCamposPermitidos(body: any) {
  const payload: any = {}
  if (typeof body?.nome === 'string') payload.nome = body.nome.trim()
  if (typeof body?.cupom === 'string') payload.cupom = body.cupom.trim().toUpperCase()
  if (typeof body?.whatsapp === 'string') payload.whatsapp = body.whatsapp.trim() || null
  if (typeof body?.email === 'string') payload.email = body.email.trim().toLowerCase() || null
  if (typeof body?.tipo === 'string') payload.tipo = body.tipo.trim()
  if (typeof body?.ativo === 'boolean') payload.ativo = body.ativo
  return payload
}

async function autenticarAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { erro: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }

  const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
  if (authError || !user) return { erro: NextResponse.json({ error: 'Sessão inválida' }, { status: 401 }) }

  if (!ADMIN_IDS.includes(user.id)) return { erro: NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 }) }

  return { user }
}

// POST /api/admin/parceiros - cria um novo parceiro (S0.A: antes feito client-side)
export async function POST(request: NextRequest) {
  try {
    const auth = await autenticarAdmin(request)
    if (auth.erro) return auth.erro

    const body = await request.json().catch(() => null)
    const payload = extrairCamposPermitidos(body)

    if (!payload.nome || !payload.cupom) {
      return NextResponse.json({ error: 'Nome e cupom são obrigatórios' }, { status: 400 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await supabaseAdmin.from('parceiros').insert(payload).select().single()

    if (error) {
      console.error('[api/admin/parceiros][POST] Erro:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ parceiro: data })
  } catch (e: any) {
    console.error('[api/admin/parceiros][POST] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
