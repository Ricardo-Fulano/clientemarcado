import { supabase } from '../../../lib/supabase'
import { limparTexto, montarManifesto, normalizarSlug } from '../../../lib/cartao'

// Manifesto PWA INDIVIDUAL da MiniPage: cada slug tem o seu (id, start_url e scope proprios), entao cada atalho instalado abre O PROPRIO cartao.
// Slug inexistente => 404 (nao da para instalar um cartao que nao existe). Dados: so nome publico, via view perfis_publicos.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug: bruto } = await ctx.params
  const slug = normalizarSlug(bruto)
  if (!slug) return new Response('Not found', { status: 404 })
  const { data: perfil } = await supabase.from('perfis_publicos').select('*').eq('slug', slug).single()
  if (!perfil) return new Response('Not found', { status: 404 })
  const manifesto = montarManifesto({ slug: (typeof perfil.slug === 'string' && perfil.slug) || slug, nome: limparTexto(perfil.nome_negocio, 60) })
  // Mantem ID, start_url e scope individuais. Atualiza somente as cores e o icone oficial da MiniPage Pro.
  const manifestoAtualizado = {
    ...manifesto,
    background_color: '#0B0A10',
    theme_color: '#0B0A10',
    icons: [
      { src: '/brand/minipage-cartao-v2-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/minipage-cartao-v2-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
  return new Response(JSON.stringify(manifestoAtualizado), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
