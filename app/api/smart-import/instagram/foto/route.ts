import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { abrir, COOKIE_TOKEN, type SessaoInstagram } from '../../../../lib/instagram-smart-auth'

export const runtime = 'nodejs'
const VERSION = 'v25.0'
const MAX_BYTES = 5 * 1024 * 1024
const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })

function fonteMetaPermitida(value: string): URL | null {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
    if (!['facebook.com', 'fbcdn.net', 'cdninstagram.com', 'instagram.com'].some(d => host === d || host.endsWith('.' + d))) return null
    return url
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!bearer || !url || !key) return jsonError('Faça login para importar a foto.', 401)
  const { data: { user }, error } = await createClient(url, key).auth.getUser(bearer)
  const sessao = abrir<SessaoInstagram>(req.cookies.get(COOKIE_TOKEN)?.value)
  if (error || !user || !sessao || user.id !== sessao.uid ||
      !Number.isFinite(sessao.created) || sessao.created > Date.now() ||
      Date.now() - sessao.created > 30 * 60 * 1000 ||
      !/^\d+$/.test(sessao.instagramId || ''))
    return jsonError('Conecte novamente sua conta profissional do Instagram.', 401)
  try {
    const endpoint = new URL(`https://graph.${sessao.provedor==='direto'?'instagram':'facebook'}.com/${VERSION}/${sessao.provedor==='direto'?'me':sessao.instagramId}`)
    endpoint.searchParams.set('fields', 'profile_picture_url')
    const profile = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${sessao.token}` },
      cache: 'no-store', signal: AbortSignal.timeout(9000)
    })
    if (!profile.ok) return jsonError('A Meta não liberou a foto de perfil.', 502)
    const data = await profile.json() as { profile_picture_url?: unknown }
    const imagem = typeof data.profile_picture_url === 'string' ? fonteMetaPermitida(data.profile_picture_url) : null
    if (!imagem) return jsonError('A Meta retornou uma URL de foto não suportada.', 502)
    const response = await fetch(imagem, {
      redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(9000),
      headers: { Accept: 'image/jpeg,image/png,image/webp' }
    })
    if (!response.ok || response.status >= 300) return jsonError('Não foi possível baixar a foto autorizada.', 502)
    const mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime))
      return jsonError('A imagem não está em um formato permitido.', 415)
    const length = Number(response.headers.get('content-length') || '0')
    if (length > MAX_BYTES) return jsonError('A foto excede 5 MB.', 413)
    const reader = response.body?.getReader()
    if (!reader) return jsonError('Foto indisponível.', 502)
    const parts: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_BYTES) { await reader.cancel(); return jsonError('A foto excede 5 MB.', 413) }
      parts.push(value)
    }
    if (!total) return jsonError('Foto vazia.', 502)
    const bytes = Buffer.concat(parts.map(p => Buffer.from(p)))
    return new NextResponse(new Uint8Array(bytes), {
      status: 200, headers: {
        'Content-Type': mime, 'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff', 'Content-Length': String(bytes.length)
      }
    })
  } catch {
    return jsonError('Não foi possível importar a foto neste momento.', 502)
  }
}
