import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { criarPerfilInicial } from '../../../lib/perfil-inicial'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Cria/atualiza o perfil da PROPRIA pessoa logada. O dono vem SEMPRE da sessao (Bearer),
// nunca de um user_id no corpo. O cadastro novo usa /api/cadastro/registrar; esta rota
// continua disponivel (e segura) para quem ja tem sessao.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const bearer = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    if (!bearer) return NextResponse.json({ error: 'Sessao obrigatoria' }, { status: 401 })
    const { data: sess, error: erroSess } = await supabase.auth.getUser(bearer)
    if (erroSess || !sess?.user) return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 })
    if (!UUID_REGEX.test(sess.user.id)) return NextResponse.json({ error: 'user_id invalido' }, { status: 400 })

    const r = await criarPerfilInicial(supabase, {
      userId: sess.user.id, email: sess.user.email || '',
      nome_negocio: body.nome_negocio, tipo_negocio: body.tipo_negocio, plano_tipo: body.plano_tipo,
      cpf_cnpj: body.cpf_cnpj, billing_cycle: body.billing_cycle, cupom: body.cupom,
    })
    if (!r.ok) return NextResponse.json({ error: r.erro }, { status: 500 })
    return NextResponse.json(r.criado ? { ok: true, criado: true, slug: r.slug } : { ok: true, criado: false })
  } catch (err) {
    console.error('[criar-perfil] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
