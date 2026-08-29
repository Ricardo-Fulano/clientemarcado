'use client'
import { useState } from 'react'
import { PlayCircle } from 'lucide-react'

// Card de video + modal com player embutido "click-to-load": o iframe do YouTube (que e
// pesado, carrega bastante JS proprio) so e criado no DOM depois que a pessoa confirma que
// quer assistir ali mesmo (2 cliques: abre o modal, depois clica em "assistir aqui dentro").
// Enquanto isso nao acontece, zero peso extra na pagina. Outras plataformas (Instagram,
// TikTok, Vimeo, etc.) continuam abrindo externamente - embutir essas de forma confiavel
// exigiria muito mais complexidade pro ganho, entao nao vale o risco de performance agora.
export default function VideoItemCard({
  v, thumb, youtubeId, iconeBorder, cardBorderFinal, cardShadowNeon, tema, iconeCor, textoAssistir, textoSaibaMais, labelPlaceholder,
}: {
  v: { id: string; titulo: string; descricao?: string; url_video: string; link_destino?: string; texto_cta?: string; texto_botao_video?: string; abrir_nova_aba?: boolean }
  thumb: string
  youtubeId: string | null
  iconeBorder: string
  cardBorderFinal: string
  cardShadowNeon?: string
  tema: { accent: string; secondary: string; soft: string; btnText: string }
  iconeCor: string
  textoAssistir: string
  textoSaibaMais: string
  labelPlaceholder: string
}) {
  const [modalAberto, setModalAberto] = useState(false)
  const [playerCarregado, setPlayerCarregado] = useState(false)

  function abrirCard(e: React.MouseEvent) {
    if (youtubeId) {
      e.preventDefault()
      setModalAberto(true)
    }
    // Se nao for YouTube, deixa o <a> normal seguir o href externo (comportamento padrao)
  }

  return (
    <>
      <div className="crd video-card fmt-horizontal" style={{ border: cardBorderFinal, boxShadow: cardShadowNeon }}>
        <a href={v.url_video} target={v.abrir_nova_aba === false ? '_self' : '_blank'} rel="noopener noreferrer" className="video-thumb-wrap" style={{ aspectRatio: '16/9' }} onClick={abrirCard} data-track-tipo="video_click" data-track-item-id={v.id} data-track-item-titulo={v.titulo || ''} data-track-item-url={v.url_video}>
          {thumb ? (
            <img src={thumb} alt={v.titulo} loading="lazy" decoding="async" />
          ) : (
            <div className="video-placeholder" style={{ background: `radial-gradient(circle at 30% 20%,${tema.soft},transparent 60%),linear-gradient(135deg,${tema.accent},${tema.secondary})` }}>
              <div className="video-placeholder-play"><PlayCircle size={20} color="#fff" /></div>
              <span className="video-placeholder-label">{labelPlaceholder}</span>
              {v.titulo && <span className="video-placeholder-title">{v.titulo}</span>}
            </div>
          )}
        </a>
        <div className="video-body">
          <p className="video-title">{v.titulo}</p>
          {v.descricao && <p className="video-desc" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{v.descricao}</p>}
          <div className="video-btns">
            {v.link_destino && (
              <a href={v.link_destino} target="_blank" rel="noopener noreferrer" className="video-cta" style={{ background: tema.accent, color: tema.btnText }} data-track-tipo="video_click" data-track-item-id={v.id} data-track-item-titulo={v.titulo || ''} data-track-item-url={v.link_destino}>
                {v.texto_cta || textoSaibaMais}
              </a>
            )}
            <a href={v.url_video} target={v.abrir_nova_aba === false ? '_self' : '_blank'} rel="noopener noreferrer" className="video-assistir" style={{ border: `1px solid ${iconeBorder}`, color: iconeCor }} data-track-tipo="video_click" data-track-item-id={v.id} data-track-item-titulo={v.titulo || ''} data-track-item-url={v.url_video}>
              {v.texto_botao_video || textoAssistir}
            </a>
          </div>
        </div>
      </div>

      {modalAberto && (
        <div onClick={() => setModalAberto(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '640px' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', background: '#000' }}>
              {playerCarregado ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                  title={v.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                />
              ) : (
                <button type="button" onClick={() => setPlayerCarregado(true)} style={{ width: '100%', height: '100%', border: 'none', padding: 0, cursor: 'pointer', position: 'relative', background: '#000' }}>
                  {thumb && <img src={thumb} alt={v.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: .75 }} />}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '64px', height: '64px', borderRadius: '999px', background: 'rgba(0,0,0,.6)', border: '2px solid rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlayCircle size={30} color="#fff" />
                  </div>
                </button>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>{v.titulo}</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={v.url_video} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,.7)', fontSize: '12px', textDecoration: 'underline' }}>Abrir no YouTube</a>
                <button type="button" onClick={() => setModalAberto(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.7)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
