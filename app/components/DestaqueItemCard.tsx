'use client'
import { useState, useEffect } from 'react'
import { Share2, Check, PlayCircle } from 'lucide-react'

// Detecta se a URL do destaque e de uma plataforma com embed oficial disponivel
// (YouTube, Spotify ou TikTok) e monta a URL do player correspondente. Se nao reconhecer
// nenhuma das 3, retorna null e o card mantem o comportamento antigo (so linka pra fora).
function detectarEmbed(url?: string | null): { plataforma: 'youtube' | 'spotify' | 'tiktok'; embedUrl: string; aspectRatio: string } | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') {
      let videoId: string | null = null
      if (host === 'youtu.be') videoId = u.pathname.slice(1)
      else if (u.pathname.startsWith('/shorts/')) videoId = u.pathname.split('/')[2]
      else videoId = u.searchParams.get('v')
      if (!videoId) return null
      return { plataforma: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`, aspectRatio: '16/9' }
    }

    if (host === 'open.spotify.com') {
      // O Spotify pode inserir um prefixo de idioma antes do tipo, ex:
      // /intl-pt/artist/{id} em vez de so /artist/{id} - por isso procuramos o tipo valido
      // em qualquer posicao do caminho, e pegamos o segmento seguinte como id, em vez de
      // assumir que os 2 primeiros segmentos sao sempre [tipo, id].
      const tiposValidos = ['track', 'album', 'playlist', 'episode', 'show', 'artist']
      const partes = u.pathname.split('/').filter(Boolean)
      const idxTipo = partes.findIndex(p => tiposValidos.includes(p))
      if (idxTipo === -1 || !partes[idxTipo + 1]) return null
      const tipo = partes[idxTipo]
      const id = partes[idxTipo + 1]
      return { plataforma: 'spotify', embedUrl: `https://open.spotify.com/embed/${tipo}/${id}`, aspectRatio: tipo === 'track' ? '456/152' : '1/1' }
    }

    if (host === 'tiktok.com') {
      // /@usuario/video/{id}
      const match = u.pathname.match(/\/video\/(\d+)/)
      if (!match) return null
      return { plataforma: 'tiktok', embedUrl: `https://www.tiktok.com/player/v1/${match[1]}`, aspectRatio: '9/16' }
    }

    return null
  } catch {
    return null
  }
}

// Card de destaque + modal de detalhes ao clicar - mesmo padrao ja usado em CatalogoItemCard.
// Client Component porque a pagina publica (app/[slug]/page.tsx) e Server Component e nao
// pode ter onClick/useState.
//
// IMPORTANTE sobre descricao: a tabela de destaques so tem 1 campo de descricao (nao existe
// "curta" e "longa" separadas, diferente do catalogo) - por isso reaproveitamos o MESMO campo
// pros dois lugares: no card fechado ele aparece resumido (cortado por CSS line-clamp), e no
// modal aparece por completo (sem corte). Isso entrega a experiencia pedida sem precisar de
// coluna nova no banco.
//
// selo/preco/preco_anterior/compartilhar: MESMO padrao ja validado e aprovado no catalogo -
// tudo opcional, nunca reserva espaco vazio quando ausente, cor do selo/preco sempre segue o
// tema (nunca vermelho fixo).
export default function DestaqueItemCard({
  d, tema, iconeCor, textoVerMais, cardBorderFinal, cardShadowNeon, horizontal,
}: {
  d: {
    id: string; titulo: string; descricao?: string | null; url?: string | null; texto_botao?: string | null; imagem_url?: string | null
    preco?: number | null
    preco_anterior?: number | null
    preco_exibicao?: string | null
    preco_texto_personalizado?: string | null
    selo_tipo?: string | null
    selo_texto?: string | null
  }
  tema: { accent: string; secondary: string; text: string; textMuted: string; card: string; btnText: string }
  iconeCor: string
  textoVerMais: string
  cardBorderFinal: string
  cardShadowNeon?: string
  horizontal?: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const [compartilhando, setCompartilhando] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [playerCarregado, setPlayerCarregado] = useState(false)
  const embed = detectarEmbed(d.url)

  useEffect(() => {
    if (!aberto) return
    const overflowOriginal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflowOriginal }
  }, [aberto])

  const SELOS_PADRAO: Record<string, string> = {
    oferta: 'Oferta', novo: 'Novo', destaque: 'Destaque', promocao: 'Promoção',
    patrocinado: 'Patrocinado', lancamento: 'Lançamento',
  }
  function infoSelo(): string | null {
    if (!d.selo_tipo) return null
    if (d.selo_tipo === 'outros') return d.selo_texto?.trim() || null
    return SELOS_PADRAO[d.selo_tipo] || null
  }

  const fBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  function infoPreco(): string | null {
    if (d.preco_exibicao === 'nao_mostrar') return null
    if (d.preco_exibicao === 'texto_personalizado') return d.preco_texto_personalizado?.trim() || null
    if (d.preco != null && d.preco > 0) return fBRL(d.preco)
    return null
  }

  async function compartilharItem() {
    const url = `${window.location.origin}${window.location.pathname}?destaque=${d.id}`
    const dados = { title: d.titulo, text: d.titulo, url }
    if (navigator.share) {
      try {
        setCompartilhando(true)
        await navigator.share(dados)
      } catch {
        // Usuario cancelou - nao e erro real, so ignora.
      } finally {
        setCompartilhando(false)
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2200)
    } catch {
      // Clipboard indisponivel (raro) - nao quebra a pagina.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={horizontal ? 'destaque-item destaque-item-h' : 'destaque-item'}
        style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', padding: 0, background: 'transparent', border: 'none' }}
        data-track-tipo="destaque_click"
        data-track-item-id={d.id}
        data-track-item-titulo={d.titulo || ''}
        data-track-item-url={d.url || ''}
      >
        <div className={`crd destaque-card${horizontal ? ' destaque-card-horizontal' : ' destaque-card-vertical'}`} style={{ border: cardBorderFinal, boxShadow: cardShadowNeon }}>
          <div className="destaque-img-wrap" style={{ position: 'relative' }}>
            {infoSelo() && (
              <span style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 1, background: `linear-gradient(135deg,${tema.accent},${tema.secondary})`, color: tema.btnText, fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '999px', letterSpacing: '.02em', boxShadow: `0 2px 8px ${tema.accent}55` }}>{infoSelo()}</span>
            )}
            {d.imagem_url ? (
              <img src={d.imagem_url} alt={d.titulo} loading="lazy" decoding="async" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${tema.accent},${tema.secondary})` }} />
            )}
          </div>
          <div className="destaque-body">
            <p className="destaque-titulo" style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>{d.titulo}</p>
            {infoPreco() ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap', margin: '2px 0' }}>
                <p style={{ fontSize: '15px', fontWeight: 800, color: tema.accent, margin: 0 }}>{infoPreco()}</p>
                {d.preco_anterior != null && d.preco_anterior > 0 && (d.preco_exibicao || 'mostrar') === 'mostrar' && (
                  <p style={{ fontSize: '12px', color: tema.textMuted, textDecoration: 'line-through', margin: 0, opacity: .75 }}>{fBRL(d.preco_anterior)}</p>
                )}
              </div>
            ) : d.descricao?.trim() ? (
              <p className="destaque-desc" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{d.descricao}</p>
            ) : null}
            <span className="destaque-action" style={{ color: iconeCor }}>{d.texto_botao || textoVerMais} →</span>
          </div>
        </div>
      </button>

      {aberto && (
        <div onClick={() => setAberto(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: tema.card, border: `1px solid ${cardBorderFinal}`, borderRadius: '20px', maxWidth: '420px', width: '100%', maxHeight: '86vh', overflowY: 'auto', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar"
              style={{ position: 'absolute', top: '10px', right: '10px', width: '34px', height: '34px', borderRadius: '999px', background: 'rgba(0,0,0,.55)', border: '1.5px solid rgba(255,255,255,.4)', color: '#fff', fontSize: '16px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 }}
            >
              ✕
            </button>
            {embed ? (
              <div style={{ position: 'relative', width: '100%', aspectRatio: embed.aspectRatio, maxHeight: '70vh', margin: '0 auto', borderRadius: '20px 20px 0 0', overflow: 'hidden', background: '#000' }}>
                {infoSelo() && (
                  <span style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, background: `linear-gradient(135deg,${tema.accent},${tema.secondary})`, color: tema.btnText, fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', letterSpacing: '.02em' }}>{infoSelo()}</span>
                )}
                {playerCarregado ? (
                  <iframe
                    src={embed.embedUrl}
                    title={d.titulo}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  />
                ) : (
                  <button type="button" onClick={() => setPlayerCarregado(true)} style={{ width: '100%', height: '100%', border: 'none', padding: 0, cursor: 'pointer', position: 'relative', background: '#000' }}>
                    {d.imagem_url && <img src={d.imagem_url} alt={d.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: .75 }} />}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '60px', height: '60px', borderRadius: '999px', background: 'rgba(0,0,0,.6)', border: '2px solid rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PlayCircle size={28} color="#fff" />
                    </div>
                  </button>
                )}
              </div>
            ) : d.imagem_url && (
              <div style={{ position: 'relative' }}>
                {infoSelo() && (
                  <span style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, background: `linear-gradient(135deg,${tema.accent},${tema.secondary})`, color: tema.btnText, fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', letterSpacing: '.02em' }}>{infoSelo()}</span>
                )}
                <img src={d.imagem_url} alt={d.titulo} loading="lazy" decoding="async" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', objectPosition: 'center center', borderRadius: '20px 20px 0 0', display: 'block' }} />
              </div>
            )}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                <p style={{ fontSize: '17px', fontWeight: 800, color: tema.text, flex: 1, margin: 0 }}>{d.titulo}</p>
                <button
                  type="button"
                  onClick={compartilharItem}
                  disabled={compartilhando}
                  className="destaque-btn-compartilhar"
                  style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '999px', background: `${tema.accent}14`, border: `1px solid ${tema.accent}55`, color: tema.accent, fontSize: '12px', fontWeight: 700, cursor: compartilhando ? 'wait' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  {linkCopiado ? <Check size={14} /> : <Share2 size={14} />}
                  {linkCopiado ? 'Copiado!' : 'Compartilhar'}
                </button>
              </div>
              <style>{`.destaque-btn-compartilhar:hover{background:${tema.accent}22!important}
                .destaque-btn-compartilhar:active{transform:scale(.96)}`}</style>
              {infoPreco() && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: tema.accent, margin: 0 }}>{infoPreco()}</p>
                  {d.preco_anterior != null && d.preco_anterior > 0 && (d.preco_exibicao || 'mostrar') === 'mostrar' && (
                    <p style={{ fontSize: '13px', color: tema.textMuted, textDecoration: 'line-through', margin: 0 }}>{fBRL(d.preco_anterior)}</p>
                  )}
                </div>
              )}
              {embed?.plataforma === 'tiktok' && playerCarregado && (
                <p style={{ fontSize: '11px', color: tema.textMuted, marginBottom: '12px', opacity: .8 }}>Se o vídeo não aparecer, use o botão abaixo para abrir no TikTok.</p>
              )}
              {d.descricao && <p style={{ fontSize: '13px', color: tema.textMuted, lineHeight: 1.6, marginBottom: '16px', whiteSpace: 'pre-wrap' }}>{d.descricao}</p>}
              {d.url && (
                <a
                  href={d.url}
                  target={d.url.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  style={{ display: 'block', width: '100%', textAlign: 'center', background: `linear-gradient(135deg,${tema.accent},${tema.secondary})`, color: tema.btnText, border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', boxShadow: `0 8px 20px ${tema.accent}40` }}
                  data-track-tipo="destaque_click"
                  data-track-item-id={d.id}
                  data-track-item-titulo={d.titulo || ''}
                  data-track-item-url={d.url}
                >
                  {d.texto_botao || (embed ? `Abrir no ${embed.plataforma === 'youtube' ? 'YouTube' : embed.plataforma === 'spotify' ? 'Spotify' : 'TikTok'}` : textoVerMais)}
                </a>
              )}
              <button
                type="button"
                onClick={() => setAberto(false)}
                style={{ width: '100%', background: 'transparent', color: tema.text, border: `1px solid ${cardBorderFinal}`, borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: '8px' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
