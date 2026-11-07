import { supabase } from '../../lib/supabase'
import { extrairTelefone, gerarVcard, limparTexto, nomeArquivoVcf, normalizarSlug, urlPublica } from '../../lib/cartao'

// "Salvar contato": vCard com SOMENTE dados que a pagina publica ja mostra (nome, descricao curta, link da MiniPage, WhatsApp/telefone de um link
// ativo, endereco/cidade apenas se a secao Contato estiver visivel). Nao inventa dados; nunca inclui user_id, e-mail da conta, plano ou campos privados.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug: bruto } = await ctx.params
  const slug = normalizarSlug(bruto)
  if (!slug) return new Response('Not found', { status: 404 })
  const { data: perfil } = await supabase.from('perfis_publicos').select('*').eq('slug', slug).single()
  if (!perfil) return new Response('Not found', { status: 404 })
  const { data: links } = perfil.user_id
    ? await supabase.from('pagina_links').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('ordem')
    : { data: [] as never[] }
  const slugFinal = (typeof perfil.slug === 'string' && perfil.slug) || slug
  const mostrarContato = perfil.pagina_mostrar_contato !== false
  const vcard = gerarVcard({
    nome: limparTexto(perfil.nome_negocio, 100),
    telefone: extrairTelefone(links),
    descricao: limparTexto(perfil.pagina_descricao_curta || perfil.descricao, 300),
    url: urlPublica(slugFinal),
    endereco: mostrarContato ? perfil.endereco : null,
    cidade: mostrarContato ? perfil.cidade : null,
  })
  return new Response(vcard, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomeArquivoVcf(slugFinal)}"`,
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
