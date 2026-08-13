import type { Metadata } from 'next'
import { supabase } from '../lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { Zap, CalendarDays, CheckCircle, Sparkles, GraduationCap, Crown, Globe, Link2, Music2, ShoppingBag, PlayCircle, BadgeCheck, MapPin, Calendar } from 'lucide-react'
import { resolverTema, getTema } from '../lib/tema-publico'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%}
.hero{position:relative;width:100%;min-height:260px;display:block;overflow:hidden;border-radius:20px;border:2px solid var(--accent);box-shadow:0 0 14px var(--accent-glow)}
.hero.no-capa{min-height:190px}
.hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(var(--bg-rgb),0) 55%,rgba(var(--bg-rgb),.6) 100%)}
.crd{background:var(--card);border:1px solid var(--accent-border);border-radius:16px;transition:border-color .2s,box-shadow .2s}
.wrap{max-width:1100px;margin:0 auto;padding:0 20px}
.svc-card{display:flex;align-items:center;gap:14px;padding:16px 18px;text-decoration:none;color:inherit}
.svc-card:hover{border-color:var(--accent-border)!important;box-shadow:0 0 20px var(--accent-glow)}
.sec-title{font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
.benefit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.hero-btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px;margin-bottom:28px}
.profile-row{display:flex;align-items:flex-end;gap:16px;margin-top:-48px;margin-bottom:18px;flex-wrap:wrap;position:relative;z-index:2}
.avatar-pro{width:96px;height:96px;border-radius:999px;object-fit:cover;flex-shrink:0}
.social-row{display:flex;gap:8px;margin-left:auto;flex-wrap:wrap}
.social-ic{width:38px;height:38px;border-radius:999px;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-decoration:none;transition:transform .18s}
.social-ic:hover{transform:translateY(-2px)}
.bio-text{font-size:15px;color:var(--text-muted);max-width:560px;line-height:1.5;margin-bottom:6px}
.loc-text{font-size:13px;color:var(--text-muted);display:flex;align-items:center;gap:5px;margin-bottom:4px}
.destaque-grid{display:grid;gap:16px;width:100%;max-width:100%}
.destaque-grid.cols-1{grid-template-columns:1fr}
.destaque-grid.cols-2{grid-template-columns:repeat(2,1fr)}
.destaque-grid.cols-3{grid-template-columns:repeat(3,1fr)}
.destaque-item{display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box}
.destaque-card{display:flex;flex-direction:column;overflow:hidden;border-radius:16px;transition:transform .18s,box-shadow .18s,border-color .18s;width:100%;max-width:100%;box-sizing:border-box}
.destaque-card:hover{transform:translateY(-4px);border-color:var(--accent)!important;box-shadow:0 6px 18px var(--accent-glow)}
.destaque-img-wrap{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;flex-shrink:0}
.destaque-img-wrap img{width:100%;height:100%;object-fit:cover;display:block}
.destaque-body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:4px}
.destaque-action{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;margin-top:8px}
.destaque-desc{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.video-grid{display:flex;flex-wrap:wrap;gap:18px;width:100%;max-width:100%;align-items:flex-start}
.video-card{display:flex;flex-direction:column;overflow:hidden;border-radius:16px;transition:transform .18s,box-shadow .18s,border-color .18s;box-sizing:border-box}
.video-card.fmt-horizontal,.video-card.fmt-classic{width:100%;max-width:360px;flex:1 1 320px}
.video-card.fmt-vertical{width:100%;max-width:280px;flex:0 1 260px}
.video-card.fmt-square{width:100%;max-width:300px;flex:1 1 260px}
.video-card:hover{transform:translateY(-4px);border-color:var(--accent)!important}
.video-thumb-wrap{position:relative;width:100%;overflow:hidden;flex-shrink:0;display:block;text-decoration:none;background:#000}
.video-thumb-wrap img{width:100%;height:100%;object-fit:cover;display:block}
.video-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:52px;height:52px;border-radius:999px;background:rgba(0,0,0,.55);border:1.5px solid rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)}
.video-placeholder{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:18px;text-align:center}
.video-placeholder-play{width:52px;height:52px;border-radius:999px;background:rgba(255,255,255,.20);border:1.5px solid rgba(255,255,255,.55);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.video-placeholder-label{font-size:12px;font-weight:800;color:#fff;letter-spacing:.02em}
.video-placeholder-title{font-size:11px;color:rgba(255,255,255,.85);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:220px}
.video-body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:4px}
.video-desc{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.video-btns{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.video-cta{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:13px;font-weight:800;padding:11px 16px;border-radius:11px;text-decoration:none;text-align:center}
.video-assistir{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:700;padding:9px 16px;border-radius:11px;text-decoration:none;text-align:center;background:transparent}
.video-mais summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;padding:11px 22px;border-radius:999px;margin:18px auto 0;width:fit-content}
.video-mais summary::-webkit-details-marker{display:none}
.video-mais[open] .video-mais-label-fechar{display:inline}
.video-mais[open] .video-mais-label-abrir{display:none}
.video-mais .video-mais-label-fechar{display:none}
.video-mais-grid{display:flex;flex-wrap:wrap;gap:18px;margin-top:16px;align-items:flex-start}
.link-card{display:flex;align-items:center;gap:14px;padding:17px 20px;box-sizing:border-box}
.link-icon{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.link-card:hover{border-color:var(--accent)!important;box-shadow:0 0 12px var(--accent-glow)}
@media(min-width:768px) and (max-width:1024px){
  .destaque-grid.cols-3{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:767px){
  .hero, .hero.no-capa{height:170px!important;max-height:170px!important;min-height:170px!important;border-radius:18px!important;border-width:2px!important;overflow:hidden!important;position:relative!important}
  .profile-row{margin-top:-56px;flex-direction:column;align-items:center;text-align:center}
  .avatar-pro{width:112px;height:112px}
  .social-row{margin-left:0;justify-content:center}
  .bio-text{margin-left:auto;margin-right:auto;text-align:center}
  .loc-text{justify-content:center}
  .benefit-grid{grid-template-columns:1fr}
  .destaque-grid,.destaque-grid.cols-1,.destaque-grid.cols-2,.destaque-grid.cols-3{grid-template-columns:1fr!important;gap:14px!important;width:100%!important;max-width:100%!important}
  .video-grid,.video-mais-grid{gap:14px!important}
  .video-card.fmt-horizontal,.video-card.fmt-classic,.video-card.fmt-square{max-width:100%!important;flex-basis:100%!important}
  .video-card.fmt-vertical{max-width:280px!important;flex-basis:100%!important;margin:0 auto}
  .link-card{padding:13px 15px!important;gap:12px!important}
  .link-icon{width:40px!important;height:40px!important}
  .hero-btns{flex-direction:column}
  .hero-btns a{width:100%;justify-content:center;text-align:center}
  .cta-inner{flex-direction:column!important;gap:16px!important}
  .cta-btns{width:100%!important;flex-direction:column!important}
  .cta-btns a{width:100%!important;justify-content:center!important}
  .wrap{padding:0 14px}
}
`

// Domínio base do site, para montar URLs absolutas na prévia de compartilhamento.
// Usa a mesma variável já documentada no projeto (.env.local / Vercel), com fallback pro domínio oficial.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://clientemarcado.com.br'

// Detecta se a requisição veio pelo domínio minipage.pro (link curto das páginas públicas)
// ou pelo clientemarcado.com.br (sistema principal), pra montar URL/metadata corretas nos dois.
async function resolverDominioAtual(slugLimpo: string) {
  let ehMinipage = false
  try {
    const h = await headers()
    const host = (h.get('host') || '').toLowerCase()
    ehMinipage = host.includes('minipage.pro')
  } catch { /* fora de contexto de requisição (ex: build) — assume domínio padrão */ }
  const base = ehMinipage ? 'https://minipage.pro' : SITE_URL
  const url = ehMinipage ? `${base}/@${slugLimpo}` : `${base}/${slugLimpo}`
  return { base, url, ehMinipage }
}

// Metadados dinâmicos por negócio (WhatsApp, redes sociais, etc). Cada /[slug] passa a ter
// título, descrição e imagem próprios, em vez da prévia genérica do ClienteMarcado.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: slugBruto } = await params
  // Aceita tanto /gabigasparotti quanto /@gabigasparotti (link curto do minipage.pro) — mesmo perfil
  const slug = slugBruto.startsWith('@') ? slugBruto.slice(1) : slugBruto
  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!perfil) {
    return {
      title: 'MiniPage Pro | Página profissional',
      description: 'Links, vídeos, agenda e conteúdos em uma página profissional.',
    }
  }

  const nome = perfil.nome_negocio || 'MiniPage Pro'
  const descricao = perfil.pagina_descricao_curta || perfil.descricao || 'Acesse agenda, links, vídeos e redes sociais em um só lugar.'
  const titulo = `${nome} | MiniPage Pro`

  // Mesmo fallback de capa por tipo de negócio já usado na renderização da página pública
  let capaFallback = ''
  if (!perfil.capa_url) {
    const tipoNeg = (perfil.tipo_negocio || '').toLowerCase()
    const slugRef = tipoNeg.includes('barbearia') ? 'domcorte' : (tipoNeg.includes('est') || tipoNeg.includes('sal') || tipoNeg.includes('bel') ? 'studiobella' : '')
    if (slugRef) {
      const { data: perfilRef } = await supabase.from('perfis').select('capa_url').eq('slug', slugRef).single()
      capaFallback = perfilRef?.capa_url || ''
    }
  }

  const { base } = await resolverDominioAtual(slug)
  // Link canonico da pagina publica agora e sempre o minipage.pro/@slug (o link curto oficial),
  // independente de qual dominio serviu essa requisicao especifica.
  // Link oficial divulgado: https://minipage.pro/slug (sem @, mais simples de compartilhar).
  const url = `https://minipage.pro/${slug}`
  const imagemBruta = perfil.capa_url || perfil.imagem_capa || perfil.banner_url || capaFallback || perfil.foto_perfil_url || ''
  const imagem = imagemBruta ? (imagemBruta.startsWith('http') ? imagemBruta : `${base}${imagemBruta}`) : `${SITE_URL}/og-image.png?v=2`

  return {
    title: titulo,
    description: descricao,
    openGraph: {
      title: titulo,
      description: descricao,
      url,
      siteName: 'MiniPage Pro',
      type: 'website',
      images: [{ url: imagem, width: 1200, height: 630, alt: `${nome} - Página profissional` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: descricao,
      images: [imagem],
    },
  }
}

export default async function PaginaPublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: slugBruto } = await params
  // Aceita tanto /gabigasparotti quanto /@gabigasparotti (link curto do minipage.pro) — mesmo perfil
  const slug = slugBruto.startsWith('@') ? slugBruto.slice(1) : slugBruto
  const { data: perfil } = await supabase.from('perfis').select('*').eq('slug', slug).single()
  if (!perfil) return notFound()
  // Buscar capa padrao dinamicamente pelos slugs de referencia
  let capaFallback = ''
  if (!perfil.capa_url) {
    const tipoNeg = (perfil.tipo_negocio || '').toLowerCase()
    const slugRef = tipoNeg.includes('barbearia') ? 'domcorte' : (tipoNeg.includes('est') || tipoNeg.includes('sal') || tipoNeg.includes('bel') ? 'studiobella' : '')
    if (slugRef) {
      const { data: perfilRef } = await supabase.from('perfis').select('capa_url').eq('slug', slugRef).single()
      capaFallback = perfilRef?.capa_url || ''
    }
  }

  const [{ data: servicos }, { data: profissionais }, { data: destaques }, { data: linksRapidos }, { data: videos }] = await Promise.all([
    supabase.from('servicos').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('nome'),
    supabase.from('profissionais').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('nome'),
    supabase.from('pagina_destaques').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('ordem').order('created_at'),
    supabase.from('pagina_links').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('ordem').order('created_at'),
    supabase.from('pagina_videos').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('ordem').order('created_at'),
  ])

  const temaId = resolverTema(perfil.public_theme || perfil.tema_publico || perfil.tema_cor || 'modelo2')
  const tema = getTema(temaId)

  const nomeBusiness = perfil.nome_negocio || 'Agendamento Online'
  const bioCurta = perfil.pagina_descricao_curta || perfil.descricao || ''
  const endereco = perfil.endereco || perfil.cidade || ''
  const capaUrl = perfil.capa_url || perfil.imagem_capa || perfil.banner_url || capaFallback || ''
  const fotoPerfilUrl = perfil.foto_perfil_url || ''
  const tituloBotaoAgenda = perfil.pagina_titulo_botao_agenda || 'Agendar agora'
  // Toggles: null/undefined = comportamento antigo (tudo visivel)
  const mostrarAgenda = perfil.pagina_mostrar_agenda !== false
  const mostrarServicos = perfil.pagina_mostrar_servicos !== false
  const mostrarEquipe = perfil.pagina_mostrar_equipe !== false
  const mostrarPorQueAgendar = perfil.pagina_mostrar_por_que_agendar !== false
  const mostrarContato = perfil.pagina_mostrar_contato !== false
  // Layout premium: secoes antigas de agenda completa ficam desativadas por padrao (codigo preservado, apenas nao renderiza)
  const SECOES_ANTIGAS_DESATIVADAS = false as boolean

  // Icones sociais pequenos no topo (nao duplica a lista completa de Links, so um atalho)
  const TIPOS_SOCIAIS = ['instagram', 'tiktok', 'youtube', 'whatsapp', 'site']
  const linksSociais = (linksRapidos || []).filter(l => TIPOS_SOCIAIS.includes(l.tipo)).slice(0, 5)

  // Se o cliente ja cadastrou um link rapido apontando para a propria agenda, nao criar outro automatico (evita duplicar)
  const jaTemLinkDeAgenda = (linksRapidos || []).some(l => (l.url || '').includes('/agendar'))
  const mostrarAgendaFallback = mostrarAgenda && !jaTemLinkDeAgenda

  // Icone/cor de cada tipo de link rapido
  function iconeLink(tipo:string){
    switch(tipo){
      case 'whatsapp': return { color:'#22C55E', svg:(<svg width="18" height="18" viewBox="0 0 24 24" fill="#22C55E"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>) }
      case 'instagram': return { color:'#EC4899', svg:(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>) }
      case 'tiktok': return { color:tema.text, I:Music2 }
      case 'youtube': return { color:'#FF3B30', I:PlayCircle }
      case 'shopee': return { color:'#EE4D2D', I:ShoppingBag }
      case 'mercadolivre': return { color:'#FFE600', I:ShoppingBag }
      case 'site': return { color:tema.accent, I:Globe }
      case 'curso': return { color:tema.accent, I:GraduationCap }
      case 'mentoria': return { color:tema.accent, I:Crown }
      case 'endereco': return { color:tema.accent, I:MapPin }
      default: return { color:tema.accent, I:Link2 }
    }
  }

  const fBRL = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  // Monta a URL final de um link rapido: endereco em texto normal vira busca no Google Maps automaticamente;
  // se ja for um link (http/https) - seja Maps ou qualquer outro - usa como esta.
  // Enquadramento do banner no mobile, configuravel por perfil (Configuracoes > Imagem de capa).
  // Cada negocio tem uma composicao diferente de banner, entao isso substitui o valor fixo antigo.
  const BANNER_MOBILE_POSICAO: Record<string, string> = {
    padrao: '50% 50%', centro: '50% 50%', topo: '50% 25%',
    esquerda: '35% 50%', direita: '65% 50%', inferior: '50% 75%',
  }
  const BANNER_MOBILE_ZOOM: Record<string, number> = { normal: 1.15, medio: 1.30, alto: 1.45 }
  const bannerMobilePos = BANNER_MOBILE_POSICAO[perfil.banner_mobile_position || 'padrao'] || '50% 50%'
  const bannerMobileScale = BANNER_MOBILE_ZOOM[perfil.banner_mobile_zoom || 'normal'] || 1.15

  function urlFinalLink(l: { tipo?: string; url?: string }) {
    const v = (l.url || '').trim()
    if (!v) return ''
    if (v.startsWith('http://') || v.startsWith('https://')) return v
    if (l.tipo === 'endereco') return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`
    return v
  }

  // Thumbnail automatica do YouTube (sem precisar de API/upload); outras plataformas caem no fallback com gradiente
  function thumbnailVideo(v: { thumbnail_url?: string; url_video?: string }) {
    if (v.thumbnail_url) return v.thumbnail_url
    const m = (v.url_video || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/)
    return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : ''
  }
  const FORMATO_RATIO: Record<string, string> = { '16:9': '16/9', '9:16': '9/16', '4:3': '4/3', '1:1': '1/1' }
  function formatoClasse(f?: string) {
    if (f === '9:16') return 'fmt-vertical'
    if (f === '1:1') return 'fmt-square'
    if (f === '4:3') return 'fmt-classic'
    return 'fmt-horizontal'
  }
  // Rotulo amigavel do placeholder quando nao ha thumbnail (nunca aparenta "quebrado")
  function labelPlaceholder(v: { plataforma?: string; formato?: string }) {
    if (v.plataforma === 'instagram') return v.formato === '1:1' ? 'Post do Instagram' : 'Reels do Instagram'
    if (v.plataforma === 'tiktok') return 'Vídeo do TikTok'
    if (v.plataforma === 'vimeo') return 'Vídeo'
    return 'Conteúdo em vídeo'
  }

  // Promocao em destaque: aparece se ativa, com titulo e preco novo, e dentro do periodo (se houver datas)
  const hojeISO = new Date().toISOString().split('T')[0]
  const promoDentroPeriodo = (!perfil.promocao_data_inicio || perfil.promocao_data_inicio <= hojeISO) && (!perfil.promocao_data_fim || perfil.promocao_data_fim >= hojeISO)
  const promoVisivel = !!(perfil.promocao_ativa && perfil.promocao_titulo && perfil.promocao_preco_novo && promoDentroPeriodo)

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS + `
        :root { --accent: ${tema.accent}; --accent-border: ${tema.border}; --accent-glow: ${tema.glow}; --bg: ${tema.bg}; --bg-rgb: ${tema.bgRGB}; --card: ${tema.card}; --text: ${tema.text}; --text-muted: ${tema.textMuted}; }
        @media(max-width:767px){
          .hero-img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:${bannerMobilePos}!important;transform:scale(${bannerMobileScale})!important;transform-origin:${bannerMobilePos}!important}
        }
      ` }} />

      {/* CONTEUDO */}
      <div className="wrap" style={{ paddingTop: '20px', paddingBottom: '60px' }}>

        {/* HERO / BANNER */}
        <div className={`hero${capaUrl ? '' : ' no-capa'}`}>
          {capaUrl && <img src={capaUrl} alt={nomeBusiness} className="hero-img"/>}
          {!capaUrl && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top left,${tema.soft},transparent 40%),var(--card)` }}/>}
          <div className="hero-overlay"/>
        </div>

        {/* PERFIL: avatar, nome, redes sociais */}
        <div className="profile-row">
          {fotoPerfilUrl ? (
            <img src={fotoPerfilUrl} alt={nomeBusiness} className="avatar-pro" style={{ border: `3px solid ${tema.accent}`, boxShadow: `0 0 24px ${tema.glow}` }} />
          ) : (
            <div className="avatar-pro" style={{ background: `linear-gradient(135deg,${tema.accent},${tema.secondary})`, border: `3px solid ${tema.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', fontWeight: 800, color: tema.btnText, boxShadow: `0 0 24px ${tema.glow}` }}>
              {nomeBusiness.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: '160px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <h1 style={{ fontSize: 'clamp(22px,4.5vw,32px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                {nomeBusiness}
              </h1>
              <BadgeCheck size={20} color={tema.accent} style={{ flexShrink: 0 }} />
            </div>
          </div>
          {linksSociais.length > 0 && (
            <div className="social-row">
              {linksSociais.map(l => {
                const cfg = iconeLink(l.tipo)
                return (
                  <a key={l.id} href={l.url} target={l.url && l.url.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="social-ic" style={{ background: `${cfg.color}1F`, border: `1px solid ${cfg.color}48` }} aria-label={l.titulo}>
                    {cfg.svg ? cfg.svg : (cfg.I ? <cfg.I size={16} color={cfg.color} /> : null)}
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {bioCurta && <p className="bio-text">{bioCurta}</p>}
        {endereco && (
          <p className="loc-text">
            <MapPin size={12} color="var(--text-muted)" /> {endereco}
          </p>
        )}
        <div style={{ height: '28px' }} />

        {/* PROMOCAO EM DESTAQUE — substituida por Destaques + Links Rapidos. Codigo/logica preservados, apenas nao renderiza. */}
        {SECOES_ANTIGAS_DESATIVADAS && promoVisivel && (
          <div style={{ marginBottom: '28px', background: `radial-gradient(circle at top right,${tema.soft},transparent 40%),var(--card)`, border: `1.5px solid ${tema.border}`, borderRadius: '18px', padding: '22px 24px', boxShadow: `0 0 32px ${tema.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: tema.accent, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>Oferta da semana</p>
              <p style={{ fontSize: '19px', fontWeight: 900, color: 'var(--text)', marginBottom: '4px' }}>{perfil.promocao_titulo}</p>
              {perfil.promocao_descricao && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{perfil.promocao_descricao}</p>}
              {perfil.promocao_observacao && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{perfil.promocao_observacao}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              {perfil.promocao_preco_antigo && <p style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'line-through', margin: 0 }}>De {fBRL(parseFloat(perfil.promocao_preco_antigo))}</p>}
              <p style={{ fontSize: '24px', fontWeight: 900, color: tema.accent, margin: 0 }}>{fBRL(parseFloat(perfil.promocao_preco_novo))}</p>
              <Link href={`/${slug}/agendar`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `linear-gradient(135deg,${tema.accent},${tema.accent2},${tema.secondary})`, color: tema.btnText, fontWeight: 800, padding: '11px 22px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', boxShadow: `0 8px 24px ${tema.glow}`, whiteSpace: 'nowrap' }}>
                {perfil.promocao_botao_texto || 'Agendar promoção'} →
              </Link>
            </div>
          </div>
        )}

        {/* DESTAQUES DA PAGINA */}
        {destaques && destaques.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div className={`destaque-grid cols-${Math.min(destaques.length, 3)}`}>
              {destaques.map(d => {
                const conteudo = (
                  <div className="crd destaque-card" style={{ border: `2px solid ${tema.accent}`, boxShadow: `0 0 12px ${tema.glow}` }}>
                    <div className="destaque-img-wrap">
                      {d.imagem_url ? (
                        <img src={d.imagem_url} alt={d.titulo} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${tema.accent},${tema.secondary})` }} />
                      )}
                    </div>
                    <div className="destaque-body">
                      <p style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text)' }}>{d.titulo}</p>
                      {d.descricao && <p className="destaque-desc" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{d.descricao}</p>}
                      {d.url && (
                        <span className="destaque-action" style={{ color: tema.accent }}>
                          {d.texto_botao || 'Ver mais'} →
                        </span>
                      )}
                    </div>
                  </div>
                )
                return d.url ? (
                  <a key={d.id} href={d.url} target={d.url.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="destaque-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {conteudo}
                  </a>
                ) : (
                  <div key={d.id} className="destaque-item">{conteudo}</div>
                )
              })}
            </div>
          </div>
        )}

        {/* LINKS RAPIDOS: apenas o que o cliente configurou no painel + fallback de agenda, se aplicavel */}
        {(mostrarAgendaFallback || (linksRapidos && linksRapidos.length > 0)) && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {mostrarAgendaFallback && (
                <a href={`/${slug}/agendar`} className="crd link-card" style={{ textDecoration: 'none', color: 'inherit', border: `1.5px solid ${tema.accent}`, boxShadow: `0 0 8px ${tema.glow}` }}>
                  <div className="link-icon" style={{ background: tema.accent }}>
                    <Calendar size={19} color={tema.btnText} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '2px' }}>{tituloBotaoAgenda}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rápido, prático e seguro</p>
                  </div>
                  <span style={{ fontSize: '18px', color: tema.accent, flexShrink: 0 }}>›</span>
                </a>
              )}
              {linksRapidos && linksRapidos.map(l => {
                const cfg = iconeLink(l.tipo)
                const hrefFinal = urlFinalLink(l)
                return (
                  <a key={l.id} href={hrefFinal} target={hrefFinal.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="crd link-card" style={{ textDecoration: 'none', color: 'inherit', border: `1.5px solid ${tema.accent}`, boxShadow: `0 0 8px ${tema.glow}` }}>
                    <div className="link-icon" style={{ background: `${cfg.color}1F`, border: `1px solid ${cfg.color}48` }}>
                      {cfg.svg ? cfg.svg : (cfg.I ? <cfg.I size={19} color={cfg.color} /> : null)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '2px' }}>{l.titulo || (l.tipo === 'endereco' ? 'Endereço' : '')}</p>
                      {l.descricao && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.descricao}</p>}
                    </div>
                    <span style={{ fontSize: '18px', color: tema.accent, flexShrink: 0 }}>›</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* VIDEOS EM DESTAQUE: aparece somente se houver pelo menos 1 video ativo. Fica depois de Links Rapidos. */}
        {videos && videos.length > 0 && (() => {
          const primeiros = videos.slice(0, 3)
          const resto = videos.slice(3)
          const renderVideoCard = (v: { id: string; titulo: string; descricao?: string; url_video: string; formato?: string; plataforma?: string; thumbnail_url?: string; link_destino?: string; texto_cta?: string; texto_botao_video?: string; abrir_nova_aba?: boolean }) => {
            const thumb = thumbnailVideo(v)
            const ratio = FORMATO_RATIO[v.formato || '16:9'] || '16/9'
            return (
              <div key={v.id} className={`crd video-card ${formatoClasse(v.formato)}`} style={{ border: `2px solid ${tema.accent}`, boxShadow: `0 0 16px ${tema.glow}` }}>
                <a href={v.url_video} target={v.abrir_nova_aba === false ? '_self' : '_blank'} rel="noopener noreferrer" className="video-thumb-wrap" style={{ aspectRatio: ratio }}>
                  {thumb ? (
                    <>
                      <img src={thumb} alt={v.titulo} />
                      <div className="video-play"><PlayCircle size={26} color="#fff" /></div>
                    </>
                  ) : (
                    <div className="video-placeholder" style={{ background: `radial-gradient(circle at 30% 20%,${tema.soft},transparent 60%),linear-gradient(135deg,${tema.accent},${tema.secondary})` }}>
                      <div className="video-placeholder-play"><PlayCircle size={24} color="#fff" /></div>
                      <span className="video-placeholder-label">{labelPlaceholder(v)}</span>
                      {v.titulo && <span className="video-placeholder-title">{v.titulo}</span>}
                    </div>
                  )}
                </a>
                <div className="video-body">
                  <p style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>{v.titulo}</p>
                  {v.descricao && <p className="video-desc" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{v.descricao}</p>}
                  <div className="video-btns">
                    {v.link_destino && (
                      <a href={v.link_destino} target="_blank" rel="noopener noreferrer" className="video-cta" style={{ background: tema.accent, color: tema.btnText }}>
                        {v.texto_cta || 'Saiba mais'}
                      </a>
                    )}
                    <a href={v.url_video} target={v.abrir_nova_aba === false ? '_self' : '_blank'} rel="noopener noreferrer" className="video-assistir" style={{ border: `1px solid ${tema.border}`, color: tema.accent }}>
                      {v.texto_botao_video || 'Assistir vídeo'}
                    </a>
                  </div>
                </div>
              </div>
            )
          }
          return (
            <div style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '6px' }}>Vídeos em destaque</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>Assista conteúdos, apresentações, cursos, mentorias ou novidades do negócio.</p>
              <div className="video-grid">
                {primeiros.map(renderVideoCard)}
              </div>
              {resto.length > 0 && (
                <details className="video-mais">
                  <summary style={{ background: tema.soft, border: `1px solid ${tema.border}`, color: tema.accent }}>
                    <span className="video-mais-label-abrir">Ver mais vídeos</span>
                    <span className="video-mais-label-fechar">Ver menos</span>
                  </summary>
                  <div className="video-mais-grid">
                    {resto.map(renderVideoCard)}
                  </div>
                </details>
              )}
            </div>
          )
        })()}

        {/* SERVICOS — desativado no novo layout premium (serviços continuam no fluxo /agendar). Codigo preservado, apenas nao renderiza. */}
        {SECOES_ANTIGAS_DESATIVADAS && mostrarServicos && servicos && servicos.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <p className="sec-title">Serviços</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '-8px', marginBottom: '14px' }}>Escolha um serviço para agendar</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {servicos.map(s => (
                <Link key={s.id} href={`/${slug}/agendar?servico=${s.id}`} className="crd svc-card" style={{ border: `1px solid ${tema.border}` }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: tema.soft, border: `1px solid ${tema.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={18} color={tema.accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '3px' }}>{s.nome}</p>
                    {s.descricao && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px', lineHeight: 1.4 }}>{s.descricao}</p>}
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {s.duracao && <span>{s.duracao} min</span>}
                      {s.duracao && s.preco ? <span style={{ margin: '0 5px' }}>·</span> : null}
                      {s.preco && <span style={{ color: tema.accent, fontWeight: 700 }}>{fBRL(parseFloat(s.preco))}</span>}
                    </p>
                  </div>
                  <span style={{ fontSize: '18px', color: tema.accent, flexShrink: 0 }}>›</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* EQUIPE — desativado no novo layout premium (equipe continua no fluxo /agendar). Codigo preservado, apenas nao renderiza. */}
        {SECOES_ANTIGAS_DESATIVADAS && mostrarEquipe && profissionais && profissionais.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <p className="sec-title">Equipe</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {profissionais.map(p => (
                <div key={p.id} className="crd" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} style={{ width: '44px', height: '44px', borderRadius: '999px', objectFit: 'cover', border: `1px solid ${tema.border}`, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '44px', height: '44px', borderRadius: '999px', background: tema.soft, border: `1px solid ${tema.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: tema.accent, flexShrink: 0 }}>
                      {(p.nome || 'P').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{p.nome}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.cargo || 'Profissional'}</p>
                  </div>
                  <span style={{ fontSize: '18px', color: tema.accent }}>›</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POR QUE AGENDAR — desativado no novo layout premium (não combina com a bio profissional). Codigo preservado, apenas nao renderiza. */}
        {SECOES_ANTIGAS_DESATIVADAS && mostrarPorQueAgendar && (
        <div style={{ marginBottom: '32px' }}>
          <p className="sec-title">Por que agendar aqui?</p>
          <div className="benefit-grid">
            {[
              { I: Zap, titulo: 'Agende em segundos', desc: 'Sem ligação. Sem espera.' },
              { I: CalendarDays, titulo: 'Horários reais', desc: 'Veja apenas horários disponíveis.' },
              { I: CheckCircle, titulo: 'Tudo registrado', desc: 'Sua agenda fica organizada.' },
            ].map(b => (
              <div key={b.titulo} className="crd" style={{ padding: '18px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: tema.soft, border: `1px solid ${tema.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <b.I size={16} color={tema.accent} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{b.titulo}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* FALE COM O NEGOCIO — desativado no novo layout premium (contato agora e via links rapidos configurados). Codigo preservado, apenas nao renderiza. */}
        {SECOES_ANTIGAS_DESATIVADAS && mostrarContato && !!(perfil.whatsapp||perfil.instagram||perfil.endereco||perfil.cidade)&&(
          <div style={{marginBottom:'32px'}}>
            <p className="sec-title">Fale com o neg&#xF3;cio</p>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {perfil.whatsapp&&<a href={'https://wa.me/'+(String(perfil.whatsapp).replace(/\D/g,'').startsWith('55')?String(perfil.whatsapp).replace(/\D/g,''):'55'+String(perfil.whatsapp).replace(/\D/g,''))} target="_blank" rel="noopener noreferrer" className="crd" style={{display:'flex',alignItems:'center',gap:'14px',padding:'16px 18px',textDecoration:'none',color:'inherit',border:'1px solid rgba(34,197,94,.22)'}}>
                <div style={{width:'42px',height:'42px',borderRadius:'12px',background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.28)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="#22C55E"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></div>
                <div style={{flex:1,minWidth:0}}><p style={{fontWeight:700,fontSize:'14px',color:'#22C55E',marginBottom:'2px'}}>Chamar no WhatsApp</p></div>
              </a>}
              {perfil.instagram&&<a href={(()=>{const r=String(perfil.instagram||'').trim();return r.startsWith('http')?r:'https://instagram.com/'+r.replace('@','')})() } target="_blank" rel="noopener noreferrer" className="crd" style={{display:'flex',alignItems:'center',gap:'14px',padding:'16px 18px',textDecoration:'none',color:'inherit',border:'1px solid rgba(236,72,153,.22)'}}>
                <div style={{width:'42px',height:'42px',borderRadius:'12px',background:'rgba(236,72,153,.12)',border:'1px solid rgba(236,72,153,.28)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></div>
                <div style={{flex:1,minWidth:0}}><p style={{fontWeight:700,fontSize:'14px',color:'#EC4899',marginBottom:'2px'}}>Ver no Instagram</p><p style={{fontSize:'12px',color:'var(--text-muted)'}}>{String(perfil.instagram||'').startsWith('@')?String(perfil.instagram):'@'+String(perfil.instagram).replace('@','')}</p></div>
              </a>}
              {(perfil.endereco||perfil.cidade)&&<div className="crd" style={{display:'flex',alignItems:'center',gap:'14px',padding:'16px 18px'}}>
                <div style={{width:'42px',height:'42px',borderRadius:'12px',background:tema.soft,border:`1px solid ${tema.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tema.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                <div style={{flex:1,minWidth:0}}><p style={{fontWeight:700,fontSize:'14px',color:'var(--text)',marginBottom:'2px'}}>Endere&#xE7;o</p><p style={{fontSize:'12px',color:'var(--text-muted)'}}>{String(perfil.endereco||perfil.cidade||'')}</p></div>
              </div>}
            </div>
          </div>
        )}
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '24px' }}>
          Página criada com <span style={{ color: tema.accent, fontWeight: 700 }}>ClienteMarcado</span>
        </p>
      </div>
    </main>
  )
}
