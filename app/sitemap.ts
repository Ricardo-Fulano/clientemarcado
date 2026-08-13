import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// Sitemap das paginas publicas (MiniPage Pro). So leitura, nao expoe nada sensivel -
// os mesmos dados (nome_negocio, slug) ja sao publicos em qualquer /slug.
// Usa a service_role so porque essa rota roda no servidor/build; nao ha input do usuario aqui.
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: perfis, error } = await supabase
    .from('perfis')
    .select('slug, created_at, status_acesso')
    .not('slug', 'is', null)
    .neq('slug', '')

  if (error) {
    console.error('[sitemap] Erro ao buscar perfis:', error.message)
    return []
  }

  // Nao promove paginas de contas bloqueadas/canceladas no sitemap (continuam existindo,
  // so nao sao sugeridas para indexacao). Perfis 'ativo', 'trial' e 'em_atraso' entram
  // normalmente, ja que a pagina publica continua no ar nesses casos.
  const perfisPublicaveis = (perfis || []).filter(p => !['bloqueado', 'cancelado'].includes(p.status_acesso))

  const urlsPerfis: MetadataRoute.Sitemap = perfisPublicaveis.map(p => ({
    url: `https://minipage.pro/${p.slug}`,
    // perfis nao tem coluna updated_at hoje no banco - created_at e o melhor dado real disponivel.
    lastModified: p.created_at ? new Date(p.created_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // minipage.pro (raiz) redireciona para clientemarcado.com.br (ver middleware.ts),
  // entao nao faz sentido divulgar a raiz do minipage.pro no sitemap - so as paginas de perfil.
  return urlsPerfis
}
