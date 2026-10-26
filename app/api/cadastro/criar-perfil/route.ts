import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { criarPerfilInicial } from '../../../lib/perfil-inicial'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Rede de seguranca: cria o perfil da PROPRIA pessoa logada caso ainda nao exista. O dono vem SEMPRE da
// sessao (Bearer), nunca de um user_id no corpo. O cadastro novo usa /api/cadastro/registrar.
//
// SEGURANCA (hotfix N1): esta rota NUNCA aceita plano nem ciclo de cobranca do navegador (o corpo e
// lido so para nome_negocio, tipo_negocio e cupom). Um perfil criado aqui nasce SEMPRE Free, e um perfil que
// ja existe NAO tem plano, ciclo nem status alterados. O plano pago so e concedido pelo fluxo de
// cadastro/pagamento (servidor), nunca por dados enviados pelo cliente.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const bearer = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    if (!bearer) return NextResponse.json({ error: 'Sessao obrigatoria' }, { status: 401 })
    const { data: sess, error: erroSess } = await supabase.auth.getUser(bearer)
    if (erroSess || !sess?.user) return NextResponse.json({ error: 'Sessao invalida' }, { status: 401 })
    if (!UUID_REGEX.test(sess.user.id)) return NextResponse.json({ error: 'user_id invalido' }, { status: 400 })

    const r = await criarPerfilInicial(supabase, {
      userId: sess.user.id, email: sess.user.email || '',
      nome_negocio: body.nome_negocio, tipo_negocio: body.tipo_negocio, cupom: body.cupom,
      // Plano e ciclo FIXOS no servidor: nada do corpo da requisicao entra aqui.
      plano_tipo: 'free', billing_cycle: null,
    })
    if (!r.ok) return NextResponse.json({ error: r.erro }, { status: 500 })
    return NextResponse.json(r.criado ? { ok: true, criado: true, slug: r.slug } : { ok: true, criado: false })
  } catch (err) {
    console.error('[criar-perfil] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
