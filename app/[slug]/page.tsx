import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Fragment } from 'react'
import { detectarIdiomaHeader, getDicionario } from '../lib/i18n-publico'
import { supabase } from '../lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { Inter } from 'next/font/google'
import { Zap, CalendarDays, CheckCircle, Sparkles, GraduationCap, Crown, Globe, Link2, Music2, ShoppingBag, PlayCircle, BadgeCheck, MapPin, Calendar, Lock, Mail, Phone } from 'lucide-react'
import EmailLinkCard from '../components/EmailLinkCard'
import CatalogoItemCard from '../components/CatalogoItemCard'
import VideoItemCard from '../components/VideoItemCard'
import RegistrarPageView from '../components/RegistrarPageView'
import RegistradorDeCliques from '../components/RegistradorDeCliques'
import BannerVideo from '../components/BannerVideo'
import DestaqueItemCard from '../components/DestaqueItemCard'
import { resolverTema, getTema } from '../lib/tema-publico'
import { ehPlanoComGestao, permiteVideos, permiteDestaques, permiteAgendaEventos, obterLimiteCatalogos, podeUsarCatalogo, obterLimiteSecoesDestaques, obterLimiteLinksRapidos, ehPlanoFree } from '../lib/planos'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })

// Forca a pagina publica a NUNCA cachear dados - sem isso, o Next.js pode servir uma
// versao antiga da pagina mesmo depois de o dono editar links/destaques/catalogo, ate
// que algo dispare uma revalidacao (o que nao existe hoje em nenhum formulario do
// painel). Aceita o custo de sempre buscar do banco a cada visita, em troca de garantir
// que qualquer alteracao apareca imediatamente pro visitante.
export const dynamic = 'force-dynamic'
export const revalidate = 0

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%}
.hero{position:relative;width:100%;min-height:260px;display:block;overflow:hidden;border-radius:20px;border:1px solid rgba(255,255,255,.08);box-shadow:0 18px 50px rgba(0,0,0,.22)}
.hero.no-capa{min-height:190px}
.hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(var(--bg-rgb),0) 55%,rgba(var(--bg-rgb),.6) 100%)}
/* Por padrao (desktop e qualquer tela), a copia do perfil sobreposta ao video NUNCA aparece -
   ela so existe pro efeito hero especial do mobile, reativada dentro da media query abaixo.
   Sem essa regra global, o desktop mostrava essa copia (duplicando nome/icones) e ela ficava
   cortada pelo overflow:hidden do hero, ja que nao tinha posicionamento definido fora do mobile. */
/* Hero mobile (proporcao 4:5) fica escondido por padrao - so aparece dentro da media query
   mobile abaixo. O hero desktop tradicional continua sempre visivel por padrao (escondido
   so dentro da media query mobile, ja que la o mobile view assume). */
.mobile-hero-bg{display:none}
.mobile-hero-content{display:none}
.links-oficiais-titulo{display:none}
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
.social-ic:hover{transform:translateY(-2px);border-color:var(--accent)!important;box-shadow:0 0 10px var(--accent-glow)}
.bio-text{font-size:15px;color:var(--text-muted);max-width:560px;line-height:1.5;margin-bottom:6px}
.loc-text{font-size:13px;color:var(--text-muted);display:flex;align-items:center;gap:5px;margin-bottom:4px}
.destaque-grid{display:flex;flex-wrap:wrap;gap:12px;width:100%;max-width:100%;justify-content:flex-start}
.destaque-grid .destaque-item{flex:0 1 260px;max-width:260px;width:100%}
/* Desktop: grid FIXO de 3 colunas, sempre - independente de quantos itens a secao tem de
   verdade. Isso reproduz o padrao antigo aprovado: 1 item ocupa so a 1a coluna (nao estica
   pra virar full-width), 2 itens ocupam as 2 primeiras, 3+ preenchem a linha toda. Mobile
   fica intocado - continua usando o flex de 260px acima, que ja esta aprovado. */
@media(min-width:1024px){
  .destaque-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));justify-items:stretch}
  .destaque-grid .destaque-item{max-width:100%;flex:none}
}
.destaque-item{display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box}
.destaque-scroll{display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;gap:12px;width:100%;max-width:100%;padding-bottom:6px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.destaque-scroll .destaque-item-h{flex:0 0 260px;max-width:260px;scroll-snap-align:start}
.destaque-scroll::-webkit-scrollbar{height:5px}
.destaque-scroll::-webkit-scrollbar-thumb{background:var(--accent-border);border-radius:99px}
.destaque-card{display:flex;flex-direction:column;overflow:hidden;border-radius:16px;transition:transform .18s,box-shadow .18s,border-color .18s;width:100%;max-width:100%;box-sizing:border-box}
.destaque-card:hover{transform:translateY(-4px);border-color:var(--accent)!important;box-shadow:0 6px 18px var(--accent-glow)}
.destaque-card:hover .destaque-action{color:var(--accent)}
.destaque-img-wrap{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;flex-shrink:0}
.destaque-img-wrap img{width:100%;height:100%;object-fit:cover;display:block}
.destaque-body{padding:10px 14px 10px;display:flex;flex-direction:column;gap:2px}
.destaque-action{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;margin-top:0;opacity:.85}
.destaque-desc{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:11px!important}
.destaque-titulo{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:40px;line-height:1.25}
.video-grid{display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;gap:12px;width:100%;max-width:100%;align-items:flex-start;padding-bottom:6px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.video-grid::-webkit-scrollbar{height:5px}
.video-grid::-webkit-scrollbar-thumb{background:var(--accent-border);border-radius:99px}
.video-card{display:flex;flex-direction:column;overflow:hidden;border-radius:13px;transition:transform .18s,box-shadow .18s,border-color .18s;box-sizing:border-box}
.video-card.fmt-horizontal{width:230px;flex-shrink:0;scroll-snap-align:start}
.video-card:hover{transform:translateY(-4px);border-color:var(--accent)!important}
.video-card:hover .video-assistir{color:var(--accent);border-color:var(--accent)!important}
.video-thumb-wrap{position:relative;width:100%;overflow:hidden;flex-shrink:0;display:block;text-decoration:none;background:#000}
.video-thumb-wrap img{width:100%;height:100%;object-fit:cover;display:block}
.video-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:999px;background:rgba(0,0,0,.55);border:1.5px solid rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)}
.video-placeholder{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:14px;text-align:center}
.video-placeholder-play{width:44px;height:44px;border-radius:999px;background:rgba(255,255,255,.20);border:1.5px solid rgba(255,255,255,.55);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.video-placeholder-label{font-size:11px;font-weight:700;color:#fff;letter-spacing:.02em}
.video-placeholder-title{font-size:10px;color:rgba(255,255,255,.85);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:200px}
.video-body{padding:9px 12px 11px;display:flex;flex-direction:column;gap:2px}
.video-title{font-size:14px;font-weight:600;color:var(--text);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.video-desc{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:11px!important}
.video-btns{display:flex;flex-direction:column;gap:6px;margin-top:6px}
.video-cta{display:inline-flex;align-items:center;justify-content:center;gap:5px;font-size:12px;font-weight:700;padding:8px 14px;border-radius:9px;text-decoration:none;text-align:center}
.video-assistir{display:inline-flex;align-items:center;justify-content:center;gap:5px;font-size:11px;font-weight:600;padding:7px 14px;border-radius:9px;text-decoration:none;text-align:center;background:transparent}
.catalogo-scroll{display:flex;gap:12px;overflow-x:auto;overflow-y:hidden;padding-bottom:6px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.catalogo-scroll::-webkit-scrollbar{height:5px}
.catalogo-scroll::-webkit-scrollbar-thumb{background:var(--accent-border);border-radius:99px}
.catalogo-card{width:140px;flex-shrink:0;border-radius:16px;overflow:hidden;scroll-snap-align:start;transition:border-color .18s;display:flex;flex-direction:column}
.catalogo-card-img{width:100%;aspect-ratio:6/7;background:rgba(0,0,0,.15);overflow:hidden;border-radius:16px 16px 0 0;flex-shrink:0}
.catalogo-card-img img{width:100%;height:100%;object-fit:cover;object-position:center center;display:block}
.scroll-hint{display:none;font-size:11px;color:var(--text-muted);margin:-10px 0 12px;font-weight:600}
@media(max-width:767px){.scroll-hint{display:block}}
.catalogo-card-titulo{font-size:12px;font-weight:700;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:31px}
.catalogo-card-preco{font-size:14px;font-weight:800;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:18px}
@media(min-width:768px){.catalogo-card{width:170px}.catalogo-card-img{aspect-ratio:1/1}}
.video-mais summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;padding:11px 22px;border-radius:999px;margin:18px auto 0;width:fit-content}
.video-mais summary::-webkit-details-marker{display:none}
.video-mais[open] .video-mais-label-fechar{display:inline}
.video-mais[open] .video-mais-label-abrir{display:none}
.video-mais .video-mais-label-fechar{display:none}
.video-mais-grid{display:flex;flex-wrap:wrap;gap:18px;margin-top:16px;align-items:flex-start}
.link-card{display:flex;align-items:center;gap:14px;padding:16px 18px;box-sizing:border-box;border-radius:16px}
.link-icon{width:54px;height:54px;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.link-card:hover{border-color:var(--accent)!important;box-shadow:0 0 10px var(--accent-glow)}
.link-grid{display:grid;grid-template-columns:1fr;gap:11px;width:100%}
.link-title{font-size:16px;font-weight:600;color:var(--text);margin-bottom:2px;line-height:1.25}
.link-sub{font-size:13px;font-weight:400;color:var(--text-muted);line-height:1.3}
.link-arrow{font-size:16px;flex-shrink:0;opacity:.5}
.evento-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:22px 18px;box-sizing:border-box;border-radius:16px}
.evento-card:hover{border-color:var(--accent)!important}
.evento-titulo{font-size:14px;font-weight:600;color:var(--text);line-height:1.3;letter-spacing:.01em}
.evento-menu{font-size:16px;flex-shrink:0;opacity:.5;letter-spacing:1px}
@media(min-width:640px){
  .link-grid{grid-template-columns:repeat(2,1fr)}
}
@media(min-width:768px) and (max-width:1024px){
  /* Nao precisa mais de regra especifica aqui - o flex-wrap do .destaque-grid ja
     reorganiza sozinho quantos cards de 260px cabem por linha em qualquer largura. */
}
@media(max-width:767px){
  /* No mobile, o hero tradicional de desktop (banner horizontal) fica escondido - quem
     aparece e o novo hero-mobile-view (proporcao 4:5, avatar removido, perfil integrado). */
  .hero-desktop-view{display:none}
  .profile-row-desktop-view{display:none}

  /* Midia do topo mobile como camada de FUNDO FIXA (nao sticky) - fica presa na tela
     enquanto o usuario comeca a rolar. pointer-events:none pra nunca capturar cliques,
     ja que fica atras de tudo (z-index:0). */
  .mobile-hero-bg{
    display:block;position:fixed;top:0;left:0;right:0;height:75svh;z-index:0;
    overflow:hidden;pointer-events:none;
  }
  .mobile-hero-bg .hero-mobile-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .mobile-hero-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(var(--bg-rgb),0) 30%,rgba(var(--bg-rgb),.5) 65%,rgba(var(--bg-rgb),.9) 100%)}

  /* Conteudo do perfil (nome/@/icones/seguidores/bio): fica em fluxo normal, com a MESMA
     altura da midia de fundo - isso reserva o espaco certo antes do resto da pagina comecar,
     e o texto fica visualmente sobre a midia fixa (z-index:1 > 0), sem nenhum JS. */
  .mobile-hero-content{
    position:relative;z-index:1;min-height:75svh;display:flex;flex-direction:column;
    justify-content:flex-end;align-items:center;text-align:center;padding:0 20px 24px;
  }
  .hero-mobile-nome{font-size:clamp(26px,7vw,34px);font-weight:900;color:#fff;letter-spacing:-0.03em;line-height:1.1;margin:0;text-shadow:0 2px 12px rgba(0,0,0,.6)}
  .hero-mobile-slug{font-size:14px;color:rgba(255,255,255,.75);margin:4px 0 10px;text-shadow:0 1px 6px rgba(0,0,0,.6)}
  .hero-mobile-seguidores{font-size:13px;font-weight:600;color:rgba(255,255,255,.9);margin:8px 0 0;text-shadow:0 1px 6px rgba(0,0,0,.6)}
  .hero-mobile-bio{margin:8px auto 0!important;text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.6);max-width:300px}

  /* Cobertura solida: envolve TODO o conteudo depois do hero (links oficiais, destaques,
     catalogo, etc, sem mexer no CSS interno de nenhuma dessas secoes) - como esse bloco
     esta em fluxo normal (nunca fixed), ele sobe naturalmente ao rolar e, por ter fundo
     solido + z-index maior que a midia fixa, cobre ela visualmente aos poucos.
     padding-top + gradiente no ::before criam um respiro suave antes do "LINKS OFICIAIS",
     evitando o corte seco que existia entre a imagem de capa e a area de cards. */
  .mobile-conteudo-cobertura{
    position:relative;z-index:2;background:var(--bg);
    width:100vw;margin-left:calc(-50vw + 50%);margin-right:calc(-50vw + 50%);
    padding-left:16px;padding-right:16px;padding-top:6px;
  }
  .mobile-conteudo-cobertura::before{
    content:'';position:absolute;top:-28px;left:0;right:0;height:28px;
    background:linear-gradient(to bottom,transparent,var(--bg));pointer-events:none;
  }

  .links-oficiais-titulo{
    display:block;font-size:12px;font-weight:800;letter-spacing:.08em;color:var(--text-muted);
    text-align:center;margin:0 0 18px;text-transform:uppercase;
  }

  .benefit-grid{grid-template-columns:1fr}
  .destaque-grid{flex-direction:column!important;gap:12px!important;width:100%!important;max-width:100%!important}
  .destaque-grid .destaque-item{max-width:100%!important;flex-basis:auto!important}
  .destaque-body{padding:10px 14px 12px!important}
  .destaque-scroll{display:flex!important;grid-template-columns:none!important;gap:16px!important;overflow-x:auto!important;overflow-y:hidden!important;padding-bottom:6px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
  .destaque-item-h{flex:0 0 82vw!important;max-width:360px!important;min-width:0!important;scroll-snap-align:start}
  .destaque-card-horizontal .destaque-img-wrap{aspect-ratio:auto!important;height:180px!important}
  .destaque-card-horizontal .destaque-body{padding:12px 14px 14px!important}
  .video-grid{gap:10px!important}
  .video-card.fmt-horizontal{width:210px!important}
  .video-body{padding:9px 11px 11px!important}
  .link-grid{grid-template-columns:1fr!important;gap:10px!important}
  .hero-btns{flex-direction:column}
  .hero-btns a{width:100%;justify-content:center;text-align:center}
  .cta-inner{flex-direction:column!important;gap:16px!important}
  .cta-btns{width:100%!important;flex-direction:column!important}
  .cta-btns a{width:100%!important;justify-content:center!important}
  .wrap{padding:0 18px}
}
/* Breakpoint mobile estrito - valores explicitos e definitivos pra altura dos cards.
   Usa !important deliberadamente aqui: tentativas anteriores mais "suaves" nao foram
   suficientes, entao esse bloco garante que nada mais no arquivo consiga vencer essas
   regras especificas de altura/padding no celular. */
@media(max-width:480px){
  .link-card{height:76px!important;min-height:0!important;max-height:78px!important;padding:10px 14px!important;gap:12px!important;border-radius:16px!important}
  .link-icon{width:44px!important;height:44px!important;min-width:44px!important;border-radius:12px!important}
  .link-title{font-size:16px!important;font-weight:600!important;line-height:1.2!important;margin-bottom:0!important}
  .link-sub{font-size:13px!important;font-weight:400!important;line-height:1.25!important;margin-top:2px!important}
  .link-grid{gap:10px!important}

  .destaque-img-wrap{aspect-ratio:auto!important;height:170px!important;max-height:170px!important;min-height:0!important}
  .destaque-body{padding:12px 14px 11px!important;gap:2px!important}
  .destaque-action{font-size:13px!important;margin-top:5px!important}

  .video-body{padding:10px 12px 12px!important;gap:2px!important}
  .video-title{font-size:15px!important;line-height:1.25!important}
}
@media(max-width:340px){
  .wrap{padding:0 14px}
  .destaque-img-wrap{height:160px!important;max-height:160px!important}
}
`

// Comprime a imagem via Supabase Storage Image Transformation quando a URL for do proprio
// Storage do projeto - resolve o caso de fotos de perfil/capa grandes (2MB+) que o
// Instagram aceita mas o crawler do WhatsApp, mais rigoroso com tempo/tamanho, frequentemente
// falha em buscar (fica sem imagem grande na previa). Se a URL nao for reconhecida como
// Storage do proprio projeto (ex: fallback padrao /og-image.png), retorna sem alterar -
// nunca quebra o link original.
function otimizarImagemOG(url: string): string {
  const marcador = '/storage/v1/object/public/'
  if (!url.includes(marcador)) return url
  return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + (url.includes('?') ? '&' : '?') + 'width=1200&quality=80'
}

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
// REVERTIDO: a otimizacao com cache() do React causou 404 generalizado em producao/dev
// (paginas publicas reais deixaram de carregar). Priorizando "sempre funcionar" acima do
// ganho de performance - volta pra busca direta e simples, sem memoizacao entre
// generateMetadata e o componente da pagina.

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: slugBruto } = await params
  // Aceita tanto /gabigasparotti quanto /@gabigasparotti (link curto do minipage.pro) — mesmo perfil
  const slug = slugBruto.startsWith('@') ? slugBruto.slice(1) : slugBruto
  const { data: perfil } = await supabase.from('perfis').select('*').eq('slug', slug).single()

  if (!perfil) {
    return {
      title: 'MiniPage Pro | Página profissional',
      description: 'Links, vídeos, agenda e conteúdos em uma página profissional.',
    }
  }

  const nome = perfil.nome_negocio || 'MiniPage Pro'
  const descricao = perfil.pagina_descricao_curta || perfil.descricao || `Conheça a MiniPage de ${nome}: links, conteúdos, catálogo, vídeos e contatos em um só lugar.`
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
  const imagem = imagemBruta ? otimizarImagemOG(imagemBruta.startsWith('http') ? imagemBruta : `${base}${imagemBruta}`) : `${SITE_URL}/og-image.png?v=2`

  return {
    title: titulo,
    description: descricao,
    alternates: {
      canonical: url,
    },
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
  // Idioma do visitante, detectado pelo header enviado pelo navegador (server-side - o HTML
  // ja nasce traduzido, sem nenhuma logica no cliente, entao nao ha risco de hidratacao).
  // So traduz textos FIXOS do sistema; nada do conteudo cadastrado pelo cliente e afetado.
  let idiomaVisitante: 'pt' | 'en' | 'es' = 'pt'
  try {
    const h = await headers()
    idiomaVisitante = detectarIdiomaHeader(h.get('accept-language'))
  } catch { /* fora de contexto de requisicao (ex: build) - mantem portugues */ }
  const t = getDicionario(idiomaVisitante)
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

  const [{ data: servicos }, { data: profissionais }, { data: destaques }, { data: destaquesSecoesAtivas }, { data: linksRapidos }, { data: videos }, { data: eventos }, { data: catalogosAtivos }, { data: catalogoItensTodos }, { data: catalogoImagensTodas }] = await Promise.all([
    supabase.from('servicos').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('nome'),
    supabase.from('profissionais').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('nome'),
    supabase.from('pagina_destaques').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('ordem').order('created_at'),
    supabase.from('pagina_destaques_secoes').select('id,titulo,subtitulo').eq('user_id', perfil.user_id).eq('ativo', true).order('ordem'),
    supabase.from('pagina_links').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('ordem').order('created_at'),
    supabase.from('pagina_videos').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('ordem').order('created_at'),
    supabase.from('pagina_eventos').select('*').eq('user_id', perfil.user_id).eq('ativo', true).order('ordem').order('created_at'),
    supabase.from('pagina_catalogos').select('id,titulo,subtitulo').eq('user_id', perfil.user_id).eq('ativo', true).order('ordem'),
    supabase.from('pagina_catalogo_itens').select('id,catalogo_id,titulo,descricao_curta,descricao_completa,preco,preco_anterior,preco_exibicao,preco_texto_personalizado,selo_tipo,selo_texto,imagem_url,botao_texto,tipo_destino,destino_url,whatsapp,mensagem_whatsapp').eq('user_id', perfil.user_id).eq('ativo', true).order('ordem').order('created_at'),
    supabase.from('catalogo_item_imagens').select('id,item_id,imagem_url,ordem,is_capa').eq('user_id', perfil.user_id).order('ordem'),
  ])

  // Agrupa os destaques (ja filtrados por ativo=true) por secao, mesmo padrao ja usado pro
  // catalogo logo abaixo - secao sem nenhum destaque nao ocupa espaco. Tambem respeita o
  // limite de secoes do plano atual na exibicao publica (mesma regra que ja bloqueia
  // criacao no painel) - nunca apaga/desativa nada no banco, so nao renderiza secoes alem
  // do que o plano permite mostrar.
  const limiteSecoesDestaquesPublico = obterLimiteSecoesDestaques(perfil.plano_tipo)
  const secoesDestaquesComItens = (destaquesSecoesAtivas || [])
    .map((sec: any) => ({
      ...sec,
      itens: (destaques || []).filter((d: any) => d.secao_id === sec.id),
    }))
    .filter((sec: any) => sec.itens.length > 0)
    .slice(0, limiteSecoesDestaquesPublico)

  // Agrupa os itens (ja filtrados por ativo=true) por catalogo, e mantem so os catalogos
  // que realmente tem pelo menos 1 item pra mostrar - catalogo vazio nao ocupa espaco.
  // Depois, respeita o limite de catalogos do plano atual na EXIBICAO publica (mesma regra
  // ja usada pra bloquear criacao no painel) - nunca apaga/desativa dado nenhum no banco,
  // so nao renderiza catalogos alem do que o plano permite mostrar.
  const limiteCatalogosPublico = obterLimiteCatalogos(perfil.plano_tipo)
  const catalogosComItens = (catalogosAtivos || [])
    .map((cat: any) => ({
      ...cat,
      itens: (catalogoItensTodos || []).filter((it: any) => it.catalogo_id === cat.id).map((it: any) => {
        // Galeria efetiva: se o item tem imagens reais na tabela nova, usa elas (ordenadas,
        // capa primeiro). Senao, sintetiza 1 unica imagem a partir do campo imagem_url de
        // sempre - garante que item antigo (nunca editado na galeria nova) continua
        // funcionando exatamente como antes, sem nenhuma migracao de dados necessaria.
        const imagensReais = (catalogoImagensTodas || []).filter((img: any) => img.item_id === it.id)
        const galeria = imagensReais.length > 0
          ? [...imagensReais].sort((a: any, b: any) => (b.is_capa ? 1 : 0) - (a.is_capa ? 1 : 0) || a.ordem - b.ordem)
          : (it.imagem_url ? [{ id: 'legado', imagem_url: it.imagem_url, is_capa: true }] : [])
        return { ...it, galeria }
      }),
    }))
    .filter((cat: any) => cat.itens.length > 0)
    .slice(0, limiteCatalogosPublico)

  const temaId = resolverTema(perfil.public_theme || perfil.tema_publico || perfil.tema_cor || 'modelo2')
  const tema = getTema(temaId)
  // Icones/setas neutros (nao usam mais a cor forte de cada rede social) - se adaptam
  // automaticamente pro tema claro/champagne ou escuro, mantendo o visual premium consistente.
  const iconeBg = tema.mode === 'light' ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.06)'
  const iconeBorder = tema.mode === 'light' ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.10)'
  const iconeCor = 'var(--text)'
  const setaCor = 'var(--text-muted)'
  // Nos temas neon, os CARDS (nao os icones - esses continuam neutros por decisao de design
  // anterior) ganham borda colorida com glow real. Nos demais temas, mantem a borda neutra.
  const cardBorderFinal = tema.isNeon ? `1px solid ${tema.accent}61` : `1px solid ${iconeBorder}`
  const cardShadowNeon = tema.isNeon ? `0 0 18px ${tema.glow}, inset 0 0 18px ${tema.soft}` : undefined

  const nomeBusiness = perfil.nome_negocio || t.agendamentoOnline
  const bioCurta = perfil.pagina_descricao_curta || perfil.descricao || ''
  const endereco = perfil.endereco || perfil.cidade || ''
  // Free e uma "porta de entrada" - pagina simples de links, sem os elementos premium que
  // incentivam upgrade (capa/banner grande, video, selo oficial, icones sociais no topo).
  // Nao apaga nada do banco - so nao RENDERIZA esses elementos quando o plano for Free. Se
  // a conta fizer upgrade depois, os mesmos dados ja salvos voltam a aparecer normalmente,
  // sem precisar recadastrar nada.
  const isPlanoFree = ehPlanoFree(perfil.plano_tipo)
  const capaUrl = isPlanoFree ? '' : (perfil.capa_url || perfil.imagem_capa || perfil.banner_url || capaFallback || '')
  const fotoPerfilUrl = perfil.foto_perfil_url || ''
  const tituloBotaoAgenda = perfil.pagina_titulo_botao_agenda || t.agendarAgora
  // Toggles: null/undefined = comportamento antigo (tudo visivel)
  const mostrarAgenda = perfil.pagina_mostrar_agenda !== false && ehPlanoComGestao(perfil.plano_tipo)
  const mostrarServicos = perfil.pagina_mostrar_servicos !== false
  const mostrarEquipe = perfil.pagina_mostrar_equipe !== false
  const mostrarPorQueAgendar = perfil.pagina_mostrar_por_que_agendar !== false
  const mostrarContato = perfil.pagina_mostrar_contato !== false
  // Layout premium: secoes antigas de agenda completa ficam desativadas por padrao (codigo preservado, apenas nao renderiza)
  const SECOES_ANTIGAS_DESATIVADAS = false as boolean

  // Icones sociais pequenos no topo (nao duplica a lista completa de Links, so um atalho)

  // Se o cliente ja cadastrou um link rapido apontando para a propria agenda, nao criar outro automatico (evita duplicar)
  const jaTemLinkDeAgenda = (linksRapidos || []).some(l => (l.url || '').includes('/agendar'))
  const mostrarAgendaFallback = mostrarAgenda && !jaTemLinkDeAgenda

  // Icone/cor de cada tipo de link rapido
  function iconeLink(tipo:string){
    switch(tipo){
      case 'whatsapp': return { color:'#22C55E', svg:(<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>) }
      case 'instagram': return { color:'#EC4899', svg:(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>) }
      case 'tiktok': return { color:tema.text, I:Music2 }
      case 'youtube': return { color:'#FF3B30', I:PlayCircle }
      case 'shopee': return { color:'#EE4D2D', I:ShoppingBag }
      case 'mercadolivre': return { color:'#FFE600', I:ShoppingBag }
      case 'loja': return { color:tema.accent, I:ShoppingBag }
      case 'deezer': return { color:'#FEAA2D', I:Music2 }
      case 'telefone': return { color:tema.accent, I:Phone }
      case 'agenda': return { color:tema.accent, I:Calendar }
      case 'site': return { color:tema.accent, I:Globe }
      case 'curso': return { color:tema.accent, I:GraduationCap }
      case 'mentoria': return { color:tema.accent, I:Crown }
      case 'endereco': return { color:tema.accent, I:MapPin }
      case 'secreto': return { color:tema.accent, I:Lock }
      case 'email': return { color:tema.accent, I:Mail }
      case 'spotify': return { color:'#1DB954', svg:(<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.1 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>) }
      case 'facebook': return { color:'#1877F2', svg:(<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.8h2.6l.4-3h-3v-1.9c0-.87.24-1.46 1.5-1.46H16.6V4.14C16.3 4.1 15.3 4 14.1 4c-2.4 0-4.1 1.47-4.1 4.17V10.2H7.4v3h2.6V21h3.5z"/></svg>) }
      case 'x': return { color:tema.text, svg:(<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>) }
      case 'telegram': return { color:'#26A5E4', svg:(<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.05 3.51 2.6 10.72c-1.26.5-1.25 1.2-.23 1.51l4.72 1.47 1.82 5.53c.22.6.11.85.75.85.5 0 .72-.23 1-.5l2.4-2.32 4.98 3.67c.92.5 1.58.24 1.81-.85l3.28-15.44c.33-1.33-.5-1.94-1.38-1.53zM8.5 14.5l-1.1-3.6 10.5-6.6-8.4 8.4-.1.1z"/></svg>) }
      case 'linkedin': return { color:'#0A66C2', svg:(<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.11 20.45H3.56V9h3.55z"/></svg>) }
      case 'pinterest': return { color:'#E60023', svg:(<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.63 7.86 6.36 9.32-.09-.79-.16-2.01.03-2.87.18-.79 1.16-5.03 1.16-5.03s-.3-.6-.3-1.48c0-1.39.8-2.42 1.8-2.42.85 0 1.26.64 1.26 1.4 0 .85-.55 2.13-.83 3.32-.24.99.5 1.8 1.48 1.8 1.78 0 3.15-1.87 3.15-4.58 0-2.4-1.72-4.07-4.18-4.07-2.85 0-4.52 2.13-4.52 4.34 0 .86.33 1.78.75 2.28a.3.3 0 01.07.29c-.08.32-.25 1-.29 1.14-.04.19-.15.23-.35.14-1.3-.6-2.1-2.5-2.1-4.02 0-3.28 2.38-6.29 6.87-6.29 3.6 0 6.4 2.57 6.4 6 0 3.58-2.26 6.46-5.39 6.46-1.05 0-2.04-.55-2.38-1.19l-.65 2.47c-.23.9-.87 2.03-1.3 2.72.98.3 2.02.47 3.1.47 5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>) }
      case 'twitch': return { color:'#9146FF', svg:(<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4.32 2 2.4 6.72v13.44h4.8V22.4l3.36-2.24h3.36l6.72-6.72V2H4.32zm14.4 10.24-3.36 3.36h-3.36l-2.4 2.4v-2.4H6.24V3.6h12.48v8.64z"/><path d="M15.36 6.72h1.92v5.76h-1.92zM10.56 6.72h1.92v5.76h-1.92z"/></svg>) }
      case 'discord': return { color:'#5865F2', svg:(<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.32 5.37a18.6 18.6 0 0 0-4.6-1.44l-.23.42a17.1 17.1 0 0 1 4.06 1.42c-1.7-.9-3.55-1.55-5.55-1.86-.2.36-.4.75-.55 1.13a15.9 15.9 0 0 0-4.9 0c-.16-.38-.36-.77-.56-1.13-2 .3-3.85.96-5.55 1.86.03-.02.05-.03.06-.05C.87 8.4-.02 11.35.24 14.24a18.6 18.6 0 0 0 5.68 2.87c.46-.63.87-1.3 1.22-2a11.9 11.9 0 0 1-1.93-.94c.16-.12.32-.24.47-.37 3.72 1.72 7.78 1.72 11.46 0 .16.13.32.25.48.37-.62.36-1.27.68-1.94.94.35.7.76 1.37 1.22 2 1.98-.62 3.98-1.55 5.68-2.86.32-3.35-.55-6.27-2.26-8.88zM8.6 12.86c-.75 0-1.36-.7-1.36-1.55s.6-1.55 1.36-1.55c.76 0 1.37.7 1.36 1.55 0 .85-.6 1.55-1.36 1.55zm6.8 0c-.75 0-1.36-.7-1.36-1.55s.6-1.55 1.36-1.55c.76 0 1.37.7 1.36 1.55 0 .85-.6 1.55-1.36 1.55z"/></svg>) }
      default: return { color:tema.accent, I:Link2 }
    }
  }

  // Reconhece a plataforma automaticamente pela URL, mesmo que o tipo salvo no banco seja
  // generico ("outro"/"site"/etc). So retorna algo quando reconhece com confianca; caso
  // contrario retorna null e quem chamou usa o tipo salvo manualmente, como fallback.
  function detectarTipoPorUrl(url?: string): string | null {
    const u = (url || '').trim()
    if (!u) return null
    const uMin = u.toLowerCase()
    if (uMin.startsWith('mailto:') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return 'email'
    if (uMin.startsWith('tel:')) return 'telefone'
    if (uMin.includes('open.spotify.com') || uMin.includes('spotify.com')) return 'spotify'
    if (uMin.includes('deezer.com') || uMin.includes('deezer.page.link')) return 'deezer'
    if (uMin.includes('instagram.com')) return 'instagram'
    if (uMin.includes('tiktok.com')) return 'tiktok'
    if (uMin.includes('youtube.com') || uMin.includes('youtu.be')) return 'youtube'
    if (uMin.includes('wa.me') || uMin.includes('api.whatsapp.com') || uMin.includes('whatsapp.com')) return 'whatsapp'
    if (uMin.includes('shopee.com')) return 'shopee'
    if (uMin.includes('mercadolivre.com') || uMin.includes('mercadolibre.com')) return 'mercadolivre'
    if (uMin.includes('facebook.com') || uMin.includes('fb.com')) return 'facebook'
    if (uMin.includes('x.com') || uMin.includes('twitter.com')) return 'x'
    if (uMin.includes('t.me') || uMin.includes('telegram.me') || uMin.includes('telegram.org')) return 'telegram'
    if (uMin.includes('linkedin.com')) return 'linkedin'
    if (uMin.includes('pinterest.com') || uMin.includes('pin.it')) return 'pinterest'
    if (uMin.includes('twitch.tv')) return 'twitch'
    if (uMin.includes('discord.gg') || uMin.includes('discord.com')) return 'discord'
    return null
  }

  // Segunda camada de deteccao, usada quando a URL nao reconhece nada (vazia, encurtada,
  // ou dominio proprio). Olha o TITULO que o dono digitou pro link - assim "YouTube",
  // "Meu TikTok" ou "Loja" ganham o icone certo mesmo sem a URL confirmar. So entra em
  // jogo depois de detectarTipoPorUrl falhar - URL reconhecida sempre tem prioridade.
  function detectarTipoPorTitulo(titulo?: string): string | null {
    const tMin = (titulo || '').trim().toLowerCase()
    if (!tMin) return null
    if (tMin.includes('whatsapp') || tMin.includes('zap')) return 'whatsapp'
    if (tMin.includes('instagram') || tMin.includes('insta')) return 'instagram'
    if (tMin.includes('youtube') || tMin.includes('canal')) return 'youtube'
    if (tMin.includes('tiktok') || tMin.includes('tik tok')) return 'tiktok'
    if (tMin.includes('spotify')) return 'spotify'
    if (tMin.includes('deezer')) return 'deezer'
    if (tMin.includes('shopee')) return 'shopee'
    if (tMin.includes('mercado livre') || tMin.includes('mercadolivre')) return 'mercadolivre'
    if (tMin.includes('facebook') || tMin === 'face') return 'facebook'
    if (tMin.includes('telegram')) return 'telegram'
    if (tMin.includes('linkedin')) return 'linkedin'
    if (tMin.includes('pinterest')) return 'pinterest'
    if (tMin.includes('twitch')) return 'twitch'
    if (tMin.includes('discord')) return 'discord'
    if (tMin.includes('e-mail') || tMin.includes('email')) return 'email'
    if (tMin.includes('telefone') || tMin.includes('ligar') || tMin.includes('celular')) return 'telefone'
    if (tMin.includes('agenda') || tMin.includes('agendar') || tMin.includes('calendário') || tMin.includes('calendario')) return 'agenda'
    if (tMin.includes('loja') || tMin.includes('comprar') || tMin.includes('catálogo') || tMin.includes('catalogo') || tMin.includes('produto')) return 'loja'
    if (tMin.includes('site') || tMin.includes('website')) return 'site'
    return null
  }

  // Icones sociais do topo (abaixo do @slug): reconhece a plataforma de cada link rapido
  // usando a MESMA deteccao ja usada nos cards abaixo (URL primeiro, titulo como segunda
  // camada, campo tipo salvo manualmente por ultimo) - antes so olhava um campo "tipo" fixo
  // com uma lista de so 5 valores, entao Spotify/Deezer/Shopee/Facebook/etc nunca apareciam
  // no topo mesmo estando cadastrados corretamente como card.
  // So plataformas "sociais" reconhecidas entram aqui - links genericos, produtos, loja
  // fisica, catalogo, agenda ou botoes internos continuam so nos cards abaixo, por decisao
  // deliberada (nao faz sentido visual/semantico ícone de "loja" ou "agenda" no topo).
  const TIPOS_SOCIAIS_TOPO = ['whatsapp', 'instagram', 'youtube', 'tiktok', 'spotify', 'deezer', 'shopee', 'telegram', 'facebook', 'x', 'linkedin', 'pinterest', 'twitch', 'discord', 'email', 'site']
  const linksSociaisBrutos = (linksRapidos || [])
    .map(l => ({ ...l, tipoEfetivo: detectarTipoPorUrl(l.url) || detectarTipoPorTitulo(l.titulo) || l.tipo }))
    .filter(l => TIPOS_SOCIAIS_TOPO.includes(l.tipoEfetivo))
  // Deduplica por tipo - se houver 2 links de WhatsApp (ou Instagram em campo fixo + em
  // link rapido), mostra so o primeiro de cada tipo, nunca 2 icones iguais.
  const tiposJaVistos = new Set<string>()
  const linksSociais = linksSociaisBrutos.filter(l => {
    if (tiposJaVistos.has(l.tipoEfetivo)) return false
    tiposJaVistos.add(l.tipoEfetivo)
    return true
  }).slice(0, 8)

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
    // mqdefault.jpg e genuinamente 16:9, sem faixa preta "assada" na imagem (diferente do
    // hqdefault.jpg, que e um canvas 4:3 com letterbox embutido em muitos videos).
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : ''
  }
  // ID do video do YouTube, quando aplicavel - usado pro player embutido no modal (click-to-load)
  function extrairYoutubeId(url?: string): string | null {
    const m = (url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/)
    return m ? m[1] : null
  }
  // Padronizado em 16:9 pra todo mundo - independente da plataforma/formato detectado na origem
  // do video (Reels e TikTok, por exemplo, tendem a ser verticais). Decisao deliberada pra manter
  // consistencia visual dos cards, com object-fit:cover cuidando do enquadramento.
  function formatoClasse(_f?: string) {
    return 'fmt-horizontal'
  }
  // Rotulo amigavel do placeholder quando nao ha thumbnail (nunca aparenta "quebrado")
  function labelPlaceholder(v: { plataforma?: string; formato?: string }) {
    if (v.plataforma === 'instagram') return v.formato === '1:1' ? t.postDoInstagram : t.reelsDoInstagram
    if (v.plataforma === 'tiktok') return t.videoDoTiktok
    if (v.plataforma === 'vimeo') return t.video
    return t.conteudoEmVideo
  }

  // Promocao em destaque: aparece se ativa, com titulo e preco novo, e dentro do periodo (se houver datas)
  const hojeISO = new Date().toISOString().split('T')[0]
  const promoDentroPeriodo = (!perfil.promocao_data_inicio || perfil.promocao_data_inicio <= hojeISO) && (!perfil.promocao_data_fim || perfil.promocao_data_fim >= hojeISO)
  const promoVisivel = !!(perfil.promocao_ativa && perfil.promocao_titulo && perfil.promocao_preco_novo && promoDentroPeriodo)

  return (
    <main className={inter.className} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS + `
        :root { --accent: ${tema.accent}; --accent-border: ${tema.border}; --accent-glow: ${tema.glow}; --bg: ${tema.bg}; --bg-rgb: ${tema.bgRGB}; --card: ${tema.card}; --text: ${tema.text}; --text-muted: ${tema.textMuted}; }
        @media(max-width:767px){
          .hero-img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:${bannerMobilePos}!important;transform:scale(${bannerMobileScale})!important;transform-origin:${bannerMobilePos}!important}
          .hero-mobile-img{object-position:${bannerMobilePos}!important;transform:scale(${bannerMobileScale})!important;transform-origin:${bannerMobilePos}!important}
        }
      ` }} />

      <RegistrarPageView perfilId={perfil.id} />
      <RegistradorDeCliques perfilId={perfil.id} />

      {/* CONTEUDO */}
      <div className="wrap" style={{ paddingTop: '20px', paddingBottom: '60px' }}>

        {(() => {
          const usaVideoDesktop = perfil.banner_tipo === 'video' && !!perfil.banner_video_url && !ehPlanoFree(perfil.plano_tipo)

          // Midia dedicada do topo mobile (imagem ou video, proporcao 4:5) - se o cliente nao
          // configurou nada especifico pro mobile, cai no fallback: usa a MESMA midia do
          // desktop (capa ou video), sem quebrar contas que nunca mexeram nisso.
          const temTopoMobileDedicado = !!perfil.topo_mobile_url && !ehPlanoFree(perfil.plano_tipo)
          const midiaMobileUrl = temTopoMobileDedicado ? perfil.topo_mobile_url : (usaVideoDesktop ? perfil.banner_video_url : capaUrl)
          const midiaMobileTipo = temTopoMobileDedicado ? perfil.topo_mobile_tipo : (usaVideoDesktop ? 'video' : 'imagem')
          const temMidiaMobile = !!midiaMobileUrl

          // Exibe exatamente o texto que o cliente digitou - sem soma nem formatacao
          // automatica. Se estiver vazio, a secao de seguidores simplesmente nao aparece.
          const seguidoresTexto = perfil.seguidores_texto?.trim()

          return (
            <>
              {/* HERO / BANNER - DESKTOP: capa/banner tradicional, igual a antes */}
              <div className={`hero hero-desktop-view${(capaUrl || usaVideoDesktop) ? '' : ' no-capa'}${usaVideoDesktop ? ' hero-video' : ''}`}>
                {usaVideoDesktop ? (
                  <BannerVideo src={perfil.banner_video_url} className="hero-img" capaFallback={capaUrl || undefined} temaSoft={tema.soft} />
                ) : capaUrl ? (
                  <img src={capaUrl} alt={nomeBusiness} className="hero-img" decoding="async" fetchPriority="high"/>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top left,${tema.soft},transparent 40%),var(--card)` }}/>
                )}
                <div className="hero-overlay"/>
              </div>

              {/* HERO MOBILE - midia como camada de FUNDO FIXA (position:fixed, nao sticky),
                  presa na tela enquanto a pagina comeca a rolar. O conteudo do perfil fica
                  em fluxo normal logo depois, com a mesma altura da midia - por isso aparece
                  visualmente sobre ela. O resto da pagina (envolvido mais abaixo numa camada
                  solida) cobre a midia fixa aos poucos conforme rola - efeito Link.me sem
                  sticky e sem JS. */}
              <div className={`mobile-hero-bg${temMidiaMobile ? ' hero-mobile-com-midia' : ''}`}>
                {temMidiaMobile && (
                  midiaMobileTipo === 'video' ? (
                    <BannerVideo src={midiaMobileUrl} className="hero-mobile-img" capaFallback={capaUrl || undefined} temaSoft={tema.soft} />
                  ) : (
                    <img src={midiaMobileUrl} alt={nomeBusiness} className="hero-mobile-img" decoding="async" fetchPriority="high"/>
                  )
                )}
                {!temMidiaMobile && (
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top left,${tema.soft},transparent 40%),var(--card)` }}/>
                )}
                <div className="mobile-hero-overlay"/>
              </div>
              <div className="mobile-hero-content">
                {isPlanoFree && (
                  fotoPerfilUrl ? (
                    <img src={fotoPerfilUrl} alt={nomeBusiness} className="avatar-pro" decoding="async" fetchPriority="high" style={{ width: '112px', height: '112px', border: `3px solid ${tema.accent}`, boxShadow: `0 0 24px ${tema.glow}`, margin: '0 auto 16px' }} />
                  ) : (
                    <div className="avatar-pro" style={{ width: '112px', height: '112px', background: `linear-gradient(135deg,${tema.accent},${tema.secondary})`, border: `3px solid ${tema.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 800, color: tema.btnText, boxShadow: `0 0 24px ${tema.glow}`, margin: '0 auto 16px' }}>
                      {nomeBusiness.charAt(0).toUpperCase()}
                    </div>
                  )
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <h1 className="hero-mobile-nome">{nomeBusiness}</h1>
                  {!isPlanoFree && <BadgeCheck size={20} color="#3B82F6" style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.6))' }} />}
                </div>
                <p className="hero-mobile-slug">@{slug}</p>
                {!isPlanoFree && linksSociais.length > 0 && (
                  <div className="social-row" style={{ justifyContent: 'center', marginLeft: 0 }}>
                    {linksSociais.map(l => {
                      const cfg = iconeLink(l.tipoEfetivo)
                      return (
                        <a key={l.id} href={l.url} target={l.url && l.url.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="social-ic" style={{ background: iconeBg, border: `1px solid ${iconeBorder}`, color: iconeCor }} aria-label={l.titulo} data-track-tipo="social_click" data-track-item-titulo={l.titulo} data-track-item-url={l.url}>
                          {cfg.svg ? cfg.svg : (cfg.I ? <cfg.I size={16} color={iconeCor} /> : null)}
                        </a>
                      )
                    })}
                  </div>
                )}
                {seguidoresTexto && <p className="hero-mobile-seguidores">{seguidoresTexto}</p>}
                {bioCurta && <p className="bio-text hero-mobile-bio">{bioCurta}</p>}
              </div>

              {/* Bloco de perfil DESKTOP - avatar mantido, agora com @slug e seguidores */}
              <div className="profile-row profile-row-desktop-view">
                {fotoPerfilUrl ? (
                  <img src={fotoPerfilUrl} alt={nomeBusiness} className="avatar-pro" decoding="async" fetchPriority="high" style={{ border: `3px solid ${tema.accent}`, boxShadow: `0 0 24px ${tema.glow}` }} />
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
                    {!isPlanoFree && <BadgeCheck size={20} color="#3B82F6" style={{ flexShrink: 0 }} />}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>@{slug}{seguidoresTexto ? ` · ${seguidoresTexto}` : ''}</p>
                </div>
                {!isPlanoFree && linksSociais.length > 0 && (
                  <div className="social-row">
                    {linksSociais.map(l => {
                      const cfg = iconeLink(l.tipoEfetivo)
                      return (
                        <a key={l.id} href={l.url} target={l.url && l.url.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="social-ic" style={{ background: iconeBg, border: `1px solid ${iconeBorder}`, color: iconeCor }} aria-label={l.titulo} data-track-tipo="social_click" data-track-item-titulo={l.titulo} data-track-item-url={l.url}>
                          {cfg.svg ? cfg.svg : (cfg.I ? <cfg.I size={16} color={iconeCor} /> : null)}
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="profile-row-desktop-view">
                {bioCurta && <p className="bio-text">{bioCurta}</p>}
                {endereco && (
                  <p className="loc-text">
                    <MapPin size={12} color="var(--text-muted)" /> {endereco}
                  </p>
                )}
              </div>

              <div style={{ height: '10px' }} />
            </>
          )
        })()}

        {/* Camada de cobertura solida (so tem efeito visual no mobile, via CSS) - envolve TODO
            o resto da pagina (promocao/destaques/links/catalogo/videos/footer) sem alterar
            nada do conteudo interno de nenhuma dessas secoes. No mobile, isso cobre a midia
            fixa do hero conforme a pagina rola; no desktop, e completamente neutro (mesma
            posicao/fundo de sempre, position:relative sem side-effect nenhum). */}
        <div className="mobile-conteudo-cobertura">
          {/* Titulo "LINKS OFICIAIS" - so aparece no mobile (via CSS). Fica logo no inicio da
              cobertura solida de proposito: aparece sobre o FUNDO DO TEMA (nao mais sobre a
              imagem/video de capa), exatamente onde a transicao visual termina. */}
          <p className="links-oficiais-titulo">LINKS OFICIAIS</p>

        {/* PROMOCAO EM DESTAQUE — substituida por Destaques + Links Rapidos. Codigo/logica preservados, apenas nao renderiza. */}
        {SECOES_ANTIGAS_DESATIVADAS && promoVisivel && (
          <div style={{ marginBottom: '28px', background: `radial-gradient(circle at top right,${tema.soft},transparent 40%),var(--card)`, border: `1.5px solid ${tema.border}`, borderRadius: '18px', padding: '22px 24px', boxShadow: `0 0 32px ${tema.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: tema.accent, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>{t.ofertaDaSemana}</p>
              <p style={{ fontSize: '19px', fontWeight: 900, color: 'var(--text)', marginBottom: '4px' }}>{perfil.promocao_titulo}</p>
              {perfil.promocao_descricao && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{perfil.promocao_descricao}</p>}
              {perfil.promocao_observacao && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{perfil.promocao_observacao}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              {perfil.promocao_preco_antigo && <p style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'line-through', margin: 0 }}>De {fBRL(parseFloat(perfil.promocao_preco_antigo))}</p>}
              <p style={{ fontSize: '24px', fontWeight: 900, color: tema.accent, margin: 0 }}>{fBRL(parseFloat(perfil.promocao_preco_novo))}</p>
              <Link href={`/${slug}/agendar`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `linear-gradient(135deg,${tema.accent},${tema.accent2},${tema.secondary})`, color: tema.btnText, fontWeight: 800, padding: '11px 22px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', boxShadow: `0 8px 24px ${tema.glow}`, whiteSpace: 'nowrap' }} data-track-tipo="agendar_click" data-track-item-titulo={perfil.promocao_botao_texto || t.agendarPromocao} data-track-item-url={`/${slug}/agendar`}>
                {perfil.promocao_botao_texto || t.agendarPromocao} →
              </Link>
            </div>
          </div>
        )}

        {/* ORDEM DAS SECOES PUBLICAS: destaques/links/agenda/videos podem ser reordenados pelo
            cliente em /painel/perfil. Cada secao individual (conteudo, condicao de exibir, estilo)
            continua exatamente igual - so a ORDEM de renderizacao delas muda, via ordemSecoes. */}
        {(() => {
          const ORDEM_PADRAO_SECOES = ['destaques', 'links', 'agenda', 'catalogo', 'videos']
          const ordemSalva = (perfil as { ordem_secoes_publicas?: unknown }).ordem_secoes_publicas
          const ordemValida = Array.isArray(ordemSalva)
            && ordemSalva.length === ORDEM_PADRAO_SECOES.length
            && ORDEM_PADRAO_SECOES.every(s => ordemSalva.includes(s))
          const ordemSecoes: string[] = ordemValida ? (ordemSalva as string[]) : ORDEM_PADRAO_SECOES

          const destaquesFormato = perfil.destaques_formato === 'horizontal' ? 'horizontal' : 'vertical'

          const secoesMap: Record<string, ReactNode> = {
            destaques: (
// * DESTAQUES DA PAGINA - agora com multiplas secoes, cada uma com seu proprio titulo/
// subtitulo, seguindo o mesmo padrao ja usado no Catalogo (secoesComItens.map(...)).
// O formato horizontal/vertical continua sendo uma configuracao GLOBAL da conta (nao por
// secao), exatamente como ja funcionava antes desta mudanca.
secoesDestaquesComItens.length > 0 && permiteDestaques(perfil.plano_tipo) && (
          <>
            {secoesDestaquesComItens.map((secao: any) => (
              <div key={secao.id} style={{ marginBottom: '28px' }}>
                <p style={{ fontSize: '17px', fontWeight: 800, color: tema.text, marginBottom: secao.subtitulo ? '2px' : '10px' }}>{secao.titulo}</p>
                {secao.subtitulo && <p style={{ fontSize: '12px', color: tema.textMuted, marginBottom: '10px' }}>{secao.subtitulo}</p>}
                {destaquesFormato === 'horizontal' ? (
                  <>
                    <p className="scroll-hint">Deslize para ver mais →</p>
                    <div className="destaque-scroll">
                      {secao.itens.map((d: any) => (
                        <DestaqueItemCard
                          key={d.id}
                          d={d}
                          tema={tema}
                          iconeCor={iconeCor}
                          textoVerMais={t.verMais}
                          cardBorderFinal={cardBorderFinal}
                          cardShadowNeon={cardShadowNeon}
                          horizontal
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="destaque-grid">
                    {secao.itens.map((d: any) => (
                      <DestaqueItemCard
                        key={d.id}
                        d={d}
                        tema={tema}
                        iconeCor={iconeCor}
                        textoVerMais={t.verMais}
                        cardBorderFinal={cardBorderFinal}
                        cardShadowNeon={cardShadowNeon}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )
            ),
            links: (
// * LINKS RAPIDOS: apenas o que o cliente configurou no painel + fallback de agenda, se aplicavel
(mostrarAgendaFallback || (linksRapidos && linksRapidos.length > 0)) && (
          <div style={{ marginBottom: '32px' }}>
            <div className="link-grid">
              {mostrarAgendaFallback && (
                <a href={`/${slug}/agendar`} className="crd link-card" style={{ textDecoration: 'none', color: 'inherit', border: cardBorderFinal, boxShadow: cardShadowNeon }} data-track-tipo="agendar_click" data-track-item-titulo={tituloBotaoAgenda} data-track-item-url={`/${slug}/agendar`}>
                  <div className="link-icon" style={{ background: iconeBg, border: `1px solid ${iconeBorder}` }}>
                    <Calendar size={21} color={iconeCor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="link-title">{tituloBotaoAgenda}</p>
                    <p className="link-sub">{t.rapidoPraticoSeguro}</p>
                  </div>
                  <span className="link-arrow" style={{ color: setaCor }}>›</span>
                </a>
              )}
              {linksRapidos && linksRapidos.slice(0, obterLimiteLinksRapidos(perfil.plano_tipo)).map(l => {
                const tipoEfetivo = detectarTipoPorUrl(l.url) || detectarTipoPorTitulo(l.titulo) || l.tipo
                if (tipoEfetivo === 'email') {
                  const emailPuro = (l.url || '').replace(/^mailto:/i, '').trim()
                  return (
                    <EmailLinkCard key={l.id} itemId={l.id} email={emailPuro} titulo={l.titulo || 'E-mail'} descricao={l.descricao} iconeBg={iconeBg} iconeBorder={iconeBorder} iconeCor={iconeCor} setaCor={setaCor} textoCopiado={t.emailCopiado} />
                  )
                }
                const cfg = iconeLink(tipoEfetivo)
                const hrefFinal = urlFinalLink(l)
                return (
                  <a key={l.id} href={hrefFinal} target={hrefFinal.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="crd link-card" style={{ textDecoration: 'none', color: 'inherit', border: cardBorderFinal, boxShadow: cardShadowNeon }} data-track-tipo="link_rapido_click" data-track-item-id={l.id} data-track-item-titulo={l.titulo || ''} data-track-item-url={hrefFinal}>
                    <div className="link-icon" style={{ background: iconeBg, border: `1px solid ${iconeBorder}`, color: iconeCor }}>
                      {cfg.svg ? cfg.svg : (cfg.I ? <cfg.I size={21} color={iconeCor} /> : null)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="link-title">{l.titulo || (l.tipo === 'endereco' ? t.endereco : '')}</p>
                      {l.descricao && <p className="link-sub">{l.descricao}</p>}
                    </div>
                    <span className="link-arrow" style={{ color: setaCor }}>›</span>
                  </a>
                )
              })}
            </div>
          </div>
        )
            ),
            agenda: (
// * AGENDA / EVENTOS: aparece so se houver pelo menos 1 evento ativo. Fica entre Links Rapidos e Videos.
eventos && eventos.length > 0 && permiteAgendaEventos(perfil.plano_tipo) && (
          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '14px' }}>{t.agendaEventos}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {eventos.map((ev: { id: string; titulo: string; url: string }) => (
                <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer" className="crd evento-card" style={{ textDecoration: 'none', color: 'inherit', border: cardBorderFinal, boxShadow: cardShadowNeon }}>
                  <span className="evento-titulo">{ev.titulo}</span>
                  <span className="evento-menu" style={{ color: setaCor }}>⋮</span>
                </a>
              ))}
            </div>
          </div>
        )
            ),
            videos: (
// * VIDEOS EM DESTAQUE: aparece somente se houver pelo menos 1 video ativo. Fica depois de Links Rapidos.
videos && videos.length > 0 && permiteVideos(perfil.plano_tipo) && (() => {
          return (
            <div style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '6px' }}>{t.videosEmDestaque}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>Veja conteúdos, vídeos, apresentações e novidades em destaque.</p>
              <p className="scroll-hint">Deslize para ver mais →</p>
              <div className="video-grid">
                {videos.map((v: any) => (
                  <VideoItemCard
                    key={v.id}
                    v={v}
                    thumb={thumbnailVideo(v)}
                    youtubeId={extrairYoutubeId(v.url_video)}
                    iconeBorder={iconeBorder}
                    cardBorderFinal={cardBorderFinal}
                    cardShadowNeon={cardShadowNeon}
                    tema={tema}
                    iconeCor={iconeCor}
                    textoAssistir={t.assistirVideo}
                    textoSaibaMais={t.saibaMais}
                    labelPlaceholder={labelPlaceholder(v)}
                  />
                ))}
              </div>
            </div>
          )
        })()
            ),
            catalogo: (
              podeUsarCatalogo(perfil.plano_tipo) && catalogosComItens.length > 0 && (
                <>
                  {catalogosComItens.map((cat: any) => (
                    <div key={cat.id} style={{ marginBottom: '32px' }}>
                      <p className="sec-title" style={{ marginBottom: cat.subtitulo ? '2px' : '14px' }}>{cat.titulo || 'Catálogo'}</p>
                      {cat.subtitulo && (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>{cat.subtitulo}</p>
                      )}
                      <p className="scroll-hint">Deslize para ver mais →</p>
                      <div className="catalogo-scroll">
                        {cat.itens.map((item: any) => (
                          <CatalogoItemCard
                            key={item.id}
                            item={item}
                            iconeBorder={iconeBorder}
                            accent={tema.accent}
                            secondary={tema.secondary}
                            btnText={tema.btnText}
                            text={tema.text}
                            textMuted={tema.textMuted}
                            cardBg={tema.card}
                            perfilId={perfil.id}
                            slug={slug}
                            captacaoLeadsAtiva={!!perfil.captacao_leads_ativa}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )
            ),
          }

          return ordemSecoes.map(chave => (
            <Fragment key={chave}>{secoesMap[chave]}</Fragment>
          ))
        })()}

        {/* SERVICOS — desativado no novo layout premium (serviços continuam no fluxo /agendar). Codigo preservado, apenas nao renderiza. */}
        {SECOES_ANTIGAS_DESATIVADAS && mostrarServicos && servicos && servicos.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <p className="sec-title">{t.servicos}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '-8px', marginBottom: '14px' }}>{t.escolhaUmServicoParaAgendar}</p>
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
            <p className="sec-title">{t.equipe}</p>
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
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.cargo || t.profissional}</p>
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
          <p className="sec-title">{t.porQueAgendarAqui}</p>
          <div className="benefit-grid">
            {[
              { I: Zap, titulo: t.agendeEmSegundos, desc: t.semLigacaoSemEspera },
              { I: CalendarDays, titulo: t.horariosReais, desc: t.vejaApenasHorariosDisponiveis },
              { I: CheckCircle, titulo: t.tudoRegistrado, desc: t.suaAgendaFicaOrganizada },
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
            <p className="sec-title">{t.faleComONegocio}</p>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {perfil.whatsapp&&<a href={'https://wa.me/'+(String(perfil.whatsapp).replace(/\D/g,'').startsWith('55')?String(perfil.whatsapp).replace(/\D/g,''):'55'+String(perfil.whatsapp).replace(/\D/g,''))} target="_blank" rel="noopener noreferrer" className="crd" style={{display:'flex',alignItems:'center',gap:'14px',padding:'16px 18px',textDecoration:'none',color:'inherit',border:'1px solid rgba(34,197,94,.22)'}}>
                <div style={{width:'42px',height:'42px',borderRadius:'12px',background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.28)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="#22C55E"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></div>
                <div style={{flex:1,minWidth:0}}><p style={{fontWeight:700,fontSize:'14px',color:'#22C55E',marginBottom:'2px'}}>{t.chamarNoWhatsapp}</p></div>
              </a>}
              {perfil.instagram&&<a href={(()=>{const r=String(perfil.instagram||'').trim();return r.startsWith('http')?r:'https://instagram.com/'+r.replace('@','')})() } target="_blank" rel="noopener noreferrer" className="crd" style={{display:'flex',alignItems:'center',gap:'14px',padding:'16px 18px',textDecoration:'none',color:'inherit',border:'1px solid rgba(236,72,153,.22)'}}>
                <div style={{width:'42px',height:'42px',borderRadius:'12px',background:'rgba(236,72,153,.12)',border:'1px solid rgba(236,72,153,.28)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></div>
                <div style={{flex:1,minWidth:0}}><p style={{fontWeight:700,fontSize:'14px',color:'#EC4899',marginBottom:'2px'}}>{t.verNoInstagram}</p><p style={{fontSize:'12px',color:'var(--text-muted)'}}>{String(perfil.instagram||'').startsWith('@')?String(perfil.instagram):'@'+String(perfil.instagram).replace('@','')}</p></div>
              </a>}
              {(perfil.endereco||perfil.cidade)&&<div className="crd" style={{display:'flex',alignItems:'center',gap:'14px',padding:'16px 18px'}}>
                <div style={{width:'42px',height:'42px',borderRadius:'12px',background:tema.soft,border:`1px solid ${tema.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tema.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                <div style={{flex:1,minWidth:0}}><p style={{fontWeight:700,fontSize:'14px',color:'var(--text)',marginBottom:'2px'}}>{t.endereco}</p><p style={{fontSize:'12px',color:'var(--text-muted)'}}>{String(perfil.endereco||perfil.cidade||'')}</p></div>
              </div>}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', marginBottom: '8px' }}>
          <a href="https://minipage.pro/modelos" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '9px 18px', borderRadius: '999px', background: 'var(--card)', border: `1px solid ${tema.accent}22` }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: tema.accent }}>{t.crieSuaMiniPagePro}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.umaSolucaoClienteMarcado}</span>
          </a>
        </div>
        </div>
      </div>
    </main>
  )
}
