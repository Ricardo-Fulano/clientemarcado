import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// Fundacao do modulo de Analytics/Desempenho da MiniPage Pro (Etapa 1).
// Essa rota E O UNICO lugar que grava em mini_page_eventos - a tabela nao tem policy de
// insert publico via RLS de proposito (a service role usada aqui ignora RLS por natureza,
// entao nao precisamos e nao queremos abrir insert direto pra clientes anonimos).
//
// Nesta etapa, NADA ainda chama essa rota (nem page_view, nem cliques) - e so a base pronta,
// testavel manualmente, pra proximas etapas ligarem o tracking de verdade.

const TIPOS_EVENTO_PERMITIDOS = [
  'page_view', 'link_rapido_click', 'destaque_click', 'video_click',
  'catalogo_click', 'whatsapp_click', 'agendar_click', 'social_click',
] as const

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function sanitizarTexto(valor: unknown, limite: number): string | null {
  if (typeof valor !== 'string') return null
  const limpo = valor.trim()
  if (!limpo) return null
  return limpo.slice(0, limite)
}

// Hash unidirecional do IP (nunca salvamos o IP puro) - so serve pra diferenciar
// visitantes distintos de forma aproximada, nao pra identificar ninguem.
function gerarIpHash(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32)
}

function obterIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'desconhecido'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })

    const { perfil_id, tipo_evento, item_id, item_titulo, item_url, origem, metadata } = body

    // 1. tipo_evento precisa estar na lista permitida
    if (!tipo_evento || !TIPOS_EVENTO_PERMITIDOS.includes(tipo_evento)) {
      return NextResponse.json({ error: 'tipo_evento inválido' }, { status: 400 })
    }

    // 2. perfil_id obrigatorio e com formato valido
    if (!perfil_id || typeof perfil_id !== 'string' || !UUID_REGEX.test(perfil_id)) {
      return NextResponse.json({ error: 'perfil_id inválido' }, { status: 400 })
    }

    // item_id, se vier, tambem precisa ser um UUID valido (ou nulo)
    const itemIdValido = item_id && typeof item_id === 'string' && UUID_REGEX.test(item_id) ? item_id : null

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3-4. Busca o perfil pelo perfil_id pra confirmar que existe e preencher user_id/slug/
    // plano_tipo a partir do BANCO - nunca confia cegamente no que o frontend mandou nesses campos.
    const { data: perfil, error: erroPerfil } = await supabase
      .from('perfis')
      .select('id, user_id, slug, plano_tipo')
      .eq('id', perfil_id)
      .maybeSingle()

    if (erroPerfil || !perfil) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // 5. Sanitiza textos (limites de tamanho)
    const itemTituloSan = sanitizarTexto(item_titulo, 200)
    const itemUrlSan = sanitizarTexto(item_url, 1000)
    const origemSan = sanitizarTexto(origem, 100)

    // 6. Referer e user_agent pelos headers (nunca confia em campo equivalente vindo do body)
    const referer = request.headers.get('referer') || null
    const userAgent = request.headers.get('user-agent') || null

    // 7. IP nunca salvo puro - so o hash
    const ip = obterIp(request)
    const ipHash = ip !== 'desconhecido' ? gerarIpHash(ip) : null

    const { error: erroInsert } = await supabase.from('mini_page_eventos').insert({
      perfil_id: perfil.id,
      user_id: perfil.user_id,
      slug: perfil.slug,
      plano_tipo: perfil.plano_tipo,
      tipo_evento,
      item_id: itemIdValido,
      item_titulo: itemTituloSan,
      item_url: itemUrlSan,
      origem: origemSan,
      referer,
      user_agent: userAgent,
      ip_hash: ipHash,
      metadata: metadata && typeof metadata === 'object' ? metadata : null,
    })

    if (erroInsert) {
      console.error('[eventos/registrar] Erro ao inserir:', erroInsert.message)
      return NextResponse.json({ error: 'Erro ao registrar evento' }, { status: 500 })
    }

    // 8. Retorna rapido, resposta minima
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[eventos/registrar] Erro inesperado:', e?.message)
    return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 })
  }
}
