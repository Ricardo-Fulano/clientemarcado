import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_IDS = [
  '618aedd1-f174-4419-b4b2-b81b8dd1c47e', // canal19horas@gmail.com
  'f2203e3c-9d23-4635-9d14-b990b5198b8a', // misteriosoviaje@gmail.com
]

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

// PATCH /api/admin/parceiros/[id] - edita parceiro (tambem usado pra ativar/desativar,
// enviando so { ativo: true/false })
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await autenticarAdmin(request)
    if (auth.erro) return auth.erro

    const { id } = await params
    const body = await request.json().catch(() => null)
    const payload = extrairCamposPermitidos(body)

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await supabaseAdmin.from('parceiros').update(payload).eq('id', id).select().single()

    if (error) {
      console.error('[api/admin/parceiros/[id]][PATCH] Erro:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ parceiro: data })
  } catch (e: any) {
    console.error('[api/admin/parceiros/[id]][PATCH] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/admin/parceiros/[id] - exclui SOMENTE se nao houver nenhuma indicacao
// vinculada (o que automaticamente cobre comissoes/repasses, ja que essas dependem de uma
// indicacao existir). Preserva exatamente a mesma protecao que ja existia no client -
// nunca apaga fisicamente um parceiro com historico.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await autenticarAdmin(request)
    if (auth.erro) return auth.erro

    const { id } = await params
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { count, error: erroCheck } = await supabaseAdmin
      .from('indicacoes_parceiros')
      .select('id', { count: 'exact', head: true })
      .eq('parceiro_id', id)

    if (erroCheck) {
      console.error('[api/admin/parceiros/[id]][DELETE] Erro ao checar histórico:', erroCheck.message)
      return NextResponse.json({ error: 'Erro ao verificar histórico' }, { status: 500 })
    }

    if ((count || 0) > 0) {
      return NextResponse.json({ error: 'Este parceiro possui indicações ou comissões vinculadas e não pode ser excluído permanentemente. Desative-o para preservar o histórico.' }, { status: 409 })
    }

    const { error } = await supabaseAdmin.from('parceiros').delete().eq('id', id)
    if (error) {
      console.error('[api/admin/parceiros/[id]][DELETE] Erro:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/admin/parceiros/[id]][DELETE] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
