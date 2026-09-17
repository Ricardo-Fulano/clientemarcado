import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_IDS = [
  '618aedd1-f174-4419-b4b2-b81b8dd1c47e', // canal19horas@gmail.com
  'f2203e3c-9d23-4635-9d14-b990b5198b8a', // misteriosoviaje@gmail.com
]

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

// Supabase JS nao tem um "getUserByEmail" direto no admin API - a forma segura server-side
// e paginar auth.admin.listUsers() e filtrar pelo email normalizado. Isso nunca fica
// exposto ao cliente (roda so aqui, dentro do endpoint autenticado como admin) e nunca
// retorna a lista inteira pro frontend - so o UUID encontrado (ou nada).
async function buscarUsuarioPorEmail(supabaseAdmin: any, emailNormalizado: string) {
  let pagina = 1
  const perPage = 200
  // Limite de seguranca pra nunca entrar em loop infinito caso a base cresca muito -
  // suficiente pra escala atual do projeto; se a base de usuarios crescer bastante, essa
  // busca precisara ser revista (RPC dedicada seria o proximo passo).
  const MAX_PAGINAS = 25
  while (pagina <= MAX_PAGINAS) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: pagina, perPage })
    if (error) throw new Error(error.message)
    const encontrado = data.users.find((u: any) => (u.email || '').toLowerCase().trim() === emailNormalizado)
    if (encontrado) return encontrado
    if (data.users.length < perPage) break // ultima pagina
    pagina++
  }
  return null
}

// POST /api/admin/parceiros/[id]/vinculo - vincula uma conta auth existente ao parceiro,
// localizada por email (o email so serve pra localizar a conta - a autorizacao futura do
// afiliado sera sempre pelo UUID real salvo aqui, nunca pelo email).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await autenticarAdmin(request)
    if (auth.erro) return auth.erro

    const { id } = await params
    const body = await request.json().catch(() => null)
    const emailBruto = body?.email

    if (typeof emailBruto !== 'string' || !emailBruto.trim() || !emailBruto.includes('@')) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }
    const emailNormalizado = emailBruto.trim().toLowerCase()

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Confirma que o parceiro existe.
    const { data: parceiro, error: erroParceiro } = await supabaseAdmin
      .from('parceiros')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle()

    if (erroParceiro) return NextResponse.json({ error: erroParceiro.message }, { status: 500 })
    if (!parceiro) return NextResponse.json({ error: 'Parceiro não encontrado.' }, { status: 404 })

    // 2. Localiza a conta auth pelo email.
    let usuarioEncontrado
    try {
      usuarioEncontrado = await buscarUsuarioPorEmail(supabaseAdmin, emailNormalizado)
    } catch (e: any) {
      console.error('[api/admin/parceiros/[id]/vinculo][POST] Erro ao buscar usuário:', e?.message)
      return NextResponse.json({ error: 'Erro ao buscar conta de usuário.' }, { status: 500 })
    }
    if (!usuarioEncontrado) {
      return NextResponse.json({ error: 'Nenhuma conta encontrada com este e-mail.' }, { status: 404 })
    }

    // 3. Idempotencia: mesma conta, mesmo parceiro - nao e erro, so confirma.
    if (parceiro.user_id === usuarioEncontrado.id) {
      return NextResponse.json({ ok: true, user_id: usuarioEncontrado.id, email: usuarioEncontrado.email, jaVinculado: true })
    }

    // 4. Parceiro ja vinculado a OUTRA conta - nunca sobrescreve silenciosamente.
    if (parceiro.user_id && parceiro.user_id !== usuarioEncontrado.id) {
      return NextResponse.json({ error: 'Este parceiro já possui uma conta vinculada. Desvincule antes de trocar.' }, { status: 409 })
    }

    // 5. Confirma se essa conta ja esta vinculada a OUTRO parceiro (o UNIQUE parcial no
    // banco tambem protege isso, mas aqui devolvemos uma mensagem amigavel antes de tentar).
    const { data: outroParceiro } = await supabaseAdmin
      .from('parceiros')
      .select('id, nome')
      .eq('user_id', usuarioEncontrado.id)
      .maybeSingle()

    if (outroParceiro) {
      return NextResponse.json({ error: `Esta conta já está vinculada ao parceiro "${outroParceiro.nome}".` }, { status: 409 })
    }

    // 6. Vincula.
    const { error: erroUpdate } = await supabaseAdmin
      .from('parceiros')
      .update({ user_id: usuarioEncontrado.id })
      .eq('id', id)

    if (erroUpdate) {
      console.error('[api/admin/parceiros/[id]/vinculo][POST] Erro ao vincular:', erroUpdate.message)
      return NextResponse.json({ error: erroUpdate.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, user_id: usuarioEncontrado.id, email: usuarioEncontrado.email, jaVinculado: false })
  } catch (e: any) {
    console.error('[api/admin/parceiros/[id]/vinculo][POST] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/admin/parceiros/[id]/vinculo - remove SOMENTE o vinculo (user_id = null).
// Nunca apaga a conta auth, o parceiro, indicacoes, comissoes ou repasses, e nunca
// desativa o parceiro automaticamente.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await autenticarAdmin(request)
    if (auth.erro) return auth.erro

    const { id } = await params
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: parceiro, error: erroParceiro } = await supabaseAdmin
      .from('parceiros')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (erroParceiro) return NextResponse.json({ error: erroParceiro.message }, { status: 500 })
    if (!parceiro) return NextResponse.json({ error: 'Parceiro não encontrado.' }, { status: 404 })

    const { error } = await supabaseAdmin.from('parceiros').update({ user_id: null }).eq('id', id)
    if (error) {
      console.error('[api/admin/parceiros/[id]/vinculo][DELETE] Erro:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/admin/parceiros/[id]/vinculo][DELETE] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET /api/admin/parceiros/[id]/vinculo?email=... - so VERIFICA se existe conta com esse
// email, sem vincular nada. Reaproveita a mesma busca segura ja usada no POST. Nunca
// retorna user_id, metadata ou lista de usuarios - so o minimo pra UI decidir o proximo
// passo (mostrar "Vincular acesso" ou "Nenhuma conta encontrada").
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await autenticarAdmin(request)
    if (auth.erro) return auth.erro

    const { id } = await params
    const emailBruto = request.nextUrl.searchParams.get('email')
    if (!emailBruto || !emailBruto.trim() || !emailBruto.includes('@')) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }
    const emailNormalizado = emailBruto.trim().toLowerCase()

    const supabaseAdmin: any = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    let usuarioEncontrado
    try {
      usuarioEncontrado = await buscarUsuarioPorEmail(supabaseAdmin, emailNormalizado)
    } catch (e: any) {
      console.error('[api/admin/parceiros/[id]/vinculo][GET] Erro ao buscar usuário:', e?.message)
      return NextResponse.json({ error: 'Erro ao verificar conta.' }, { status: 500 })
    }

    if (!usuarioEncontrado) {
      return NextResponse.json({ encontrada: false })
    }

    // Ja vinculado a este mesmo parceiro (nao e conflito, so ja esta vinculado aqui).
    const { data: parceiroAtual } = await supabaseAdmin.from('parceiros').select('user_id').eq('id', id).maybeSingle()
    if (parceiroAtual?.user_id === usuarioEncontrado.id) {
      return NextResponse.json({ encontrada: true, email: usuarioEncontrado.email })
    }

    // Conflito: essa conta ja esta vinculada a OUTRO parceiro.
    const { data: outroParceiro } = await supabaseAdmin
      .from('parceiros')
      .select('id')
      .eq('user_id', usuarioEncontrado.id)
      .maybeSingle()

    if (outroParceiro) {
      return NextResponse.json({ encontrada: true, conflito: true })
    }

    return NextResponse.json({ encontrada: true, email: usuarioEncontrado.email })
  } catch (e: any) {
    console.error('[api/admin/parceiros/[id]/vinculo][GET] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
