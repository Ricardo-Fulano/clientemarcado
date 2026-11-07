import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { ehPlanoFree } from '../../lib/planos'
import { caminhoQr } from '../../lib/qr'
import { HOST_CANONICO, URL_CADASTRO_GRATIS, limparTexto, normalizarSlug, origemPermitida, urlCompartilhar, urlPainel, urlPublica, urlQr, urlVcf } from '../../lib/cartao'
import CartaoApp from './CartaoApp'

// Cartao digital publico da MiniPage: /{slug}/cartao. Mesma fonte de dados da pagina publica (view perfis_publicos, chave anon):
// NUNCA le a tabela perfis nem expoe user_id, plano detalhado ou dados privados. Liberado para TODOS os planos (nenhum bloqueio).
export const viewport: Viewport = { themeColor: '#08060A', colorScheme: 'dark', width: 'device-width', initialScale: 1, viewportFit: 'cover' }

async function carregar(slugBruto: string) {
  const slug = normalizarSlug(slugBruto)
  if (!slug) return null
  const { data: perfil } = await supabase.from('perfis_publicos').select('*').eq('slug', slug).single()
  if (!perfil) return null
  return { slug: (typeof perfil.slug === 'string' && perfil.slug) || slug, perfil }
}

async function origemAtual(): Promise<string> {
  try {
    const h = await headers()
    return origemPermitida(h.get('x-forwarded-host') || h.get('host'))
  } catch {
    return HOST_CANONICO
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: bruto } = await params
  const r = await carregar(bruto)
  if (!r) return { title: 'Cartão digital | MiniPage Pro', robots: { index: false, follow: false } }
  const origem = await origemAtual() // manifesto e icones DEVEM ser da mesma origem da pagina (o metadataBase global e outro dominio)
  const nome = limparTexto(r.perfil.nome_negocio, 80) || 'MiniPage'
  const s = encodeURIComponent(r.slug)
  const curto = nome.length > 14 ? nome.slice(0, 13).trimEnd() + '…' : nome
  return {
    title: `${nome} | Cartão digital`,
    description: `Cartão digital de ${nome}: QR Code, contato e MiniPage.`,
    manifest: `${origem}/${s}/cartao/manifest.webmanifest`,
    icons: {
      icon: [{ url: `${origem}/cartao/icon-192.png`, sizes: '192x192', type: 'image/png' }, { url: `${origem}/cartao/icon-512.png`, sizes: '512x512', type: 'image/png' }],
      apple: [{ url: `${origem}/cartao/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' }],
    },
    appleWebApp: { capable: true, title: curto, statusBarStyle: 'black-translucent' },
    robots: { index: false, follow: false }, // a pagina que deve ranquear e a MiniPage publica, nao o cartao
    alternates: { canonical: urlPublica(r.slug) },
  }
}

export default async function CartaoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: bruto } = await params
  const r = await carregar(bruto)
  if (!r) return notFound()
  const origem = await origemAtual()
  const { slug, perfil } = r
  const nome = limparTexto(perfil.nome_negocio, 80) || 'MiniPage'
  const bruta = typeof perfil.foto_perfil_url === 'string' ? perfil.foto_perfil_url.trim() : ''
  const fotoUrl = /^https?:\/\//i.test(bruta) ? bruta : bruta.startsWith('/') ? `${origem}${bruta}` : null
  const qr = caminhoQr(urlQr(slug))
  return (
    <CartaoApp
      nome={nome}
      fotoUrl={fotoUrl}
      slug={slug}
      enderecoCurto={`minipage.pro/${slug}`}
      urlPublica={urlPublica(slug)}
      urlPainel={urlPainel(origem)}
      urlCompartilhar={urlCompartilhar(slug)}
      urlQr={urlQr(slug)}
      qrCaminho={qr.d}
      qrTamanho={qr.tamanho}
      vcfHref={urlVcf(slug)}
      ehFree={ehPlanoFree(perfil.plano_tipo)}
      cadastroUrl={`${URL_CADASTRO_GRATIS}?origem=cartao`}
    />
  )
}
