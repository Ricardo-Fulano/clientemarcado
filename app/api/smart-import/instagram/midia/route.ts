import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { abrir, COOKIE_TOKEN, type SessaoInstagram } from '../../../../lib/instagram-smart-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const GRAPH_VERSION = 'v25.0'
const MAX_BYTES = 8 * 1024 * 1024
const noStore = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
const err = (error: string, status: number) => NextResponse.json({ error }, { status, headers: noStore })

type GraphItem = { id?: string; media_type?: string; media_url?: string; caption?: string }
function authorizedMetaUrl(value: string): URL | null {
  try {
    const u = new URL(value)
    const host = u.hostname.toLowerCase()
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null
    if (!['fbcdn.net', 'cdninstagram.com', 'instagram.com', 'facebook.com'].some(d => host === d || host.endsWith('.' + d))) return null
    return u
  } catch { return null }
}

async function graph(path: string, token: string, fields: string, direto=false) {
  const u = new URL(`https://graph.${direto?'instagram':'facebook'}.com/${GRAPH_VERSION}/${path}`)
  u.searchParams.set('fields', fields)
  if (path.endsWith('/media')) u.searchParams.set('limit', '100')
  const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) })
  if (!r.ok) throw new Error('GRAPH_ERROR')
  return r.json() as Promise<{ id?: string; data?: GraphItem[]; media_url?: string; media_type?: string }>
}

// Baixa apenas fotos de uma publicação pertencente à conta Instagram autorizada.
// Nunca aceita URL remota escolhida pelo navegador (evita SSRF e cópia de mídia arbitrária).
export async function GET(req: NextRequest) {
  const midiaId = req.nextUrl.searchParams.get('midiaId') || ''
  if (!/^\d{5,40}$/.test(midiaId)) return err('Publicação inválida.', 422)
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!bearer || !dbUrl || !anon) return err('Entre na sua conta.', 401)
  const auth = createClient(dbUrl, anon, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: { user }, error } = await auth.auth.getUser(bearer)
  const session = abrir<SessaoInstagram>(req.cookies.get(COOKIE_TOKEN)?.value)
  if (error || !user || !session || session.uid !== user.id || !/^\d+$/.test(session.instagramId || '') ||
      !Number.isFinite(session.created) || session.created > Date.now() || Date.now() - session.created > 30 * 60 * 1000)
    return err('Reconecte seu Instagram para importar.', 401)
  try {
    // Os primeiros 12 posts disponibilizados no seletor ficam incluídos nesta lista.
    const owned = await graph(`${session.provedor==='direto'?'me':session.instagramId}/media`, session.token, 'id',session.provedor==='direto')
    if (!Array.isArray(owned.data) || !owned.data.some(m => m.id === midiaId)) return err('Publicação não autorizada.', 403)
    const media = await graph(midiaId, session.token, 'id,media_type,media_url',session.provedor==='direto')
    if (media.id !== midiaId || !['IMAGE', 'CAROUSEL_ALBUM'].includes(media.media_type || ''))
      return err('Álbuns / Fotos recebe apenas imagens. Vídeos precisam de um bloco próprio.', 415)
    const target = authorizedMetaUrl(media.media_url || '')
    if (!target) return err('A imagem não está disponível em formato seguro.', 502)
    const r = await fetch(target, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { Accept: 'image/jpeg,image/png,image/webp' } })
    if (!r.ok || r.status >= 300) return err('Não foi possível obter a imagem do Instagram.', 502)
    const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return err('Formato da foto não suportado.', 415)
    const length = Number(r.headers.get('content-length') || '0')
    if (length > MAX_BYTES) return err('A imagem excede 8 MB.', 413)
    const reader = r.body?.getReader()
    if (!reader) return err('Imagem indisponível.', 502)
    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_BYTES) { await reader.cancel(); return err('A imagem excede 8 MB.', 413) }
      chunks.push(value)
    }
    if (!total) return err('Imagem vazia.', 502)
    const data = Buffer.concat(chunks.map(v => Buffer.from(v)))
    return new NextResponse(new Uint8Array(data), { status: 200, headers: { ...noStore, 'Content-Type': type, 'Content-Length': String(data.byteLength) } })
  } catch { return err('Não foi possível importar esta imagem. Reconecte seu Instagram e tente novamente.', 502) }
}
