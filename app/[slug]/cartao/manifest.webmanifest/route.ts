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
  return new Response(JSON.stringify(manifesto), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
