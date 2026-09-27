'use client'
import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

type Foto = { id: string; imagem_url: string; titulo?: string | null; descricao?: string | null }

const ASPECT: Record<string, string> = { '1:1': '1/1', '4:5': '4/5', '3:4': '3/4', '16:9': '16/9' }

// Faixa horizontal de miniaturas + modal/lightbox de um album, na slug publica.
// Miniatura: sempre a mesma proporcao escolhida no painel, object-fit:cover, sem titulo/
// legenda visivel (so aparecem no modal ampliado). Faixa usa overflow-x:auto (scroll nativo
// do navegador ja suporta touch/swipe e mouse/trackpad sem nenhum JS extra).
export default function AlbumFaixa({ titulo, subtitulo, fotos, proporcao }: { titulo: string; subtitulo?: string | null; fotos: Foto[]; proporcao: string }) {
  const [indiceAberto, setIndiceAberto] = useState<number | null>(null)
  const aspect = ASPECT[proporcao] || '1/1'
  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const deltaXRef = useRef(0)

  useEffect(() => {
    if (indiceAberto === null) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIndiceAberto(null)
      if (e.key === 'ArrowRight') setIndiceAberto(i => i === null ? null : Math.min(i + 1, fotos.length - 1))
      if (e.key === 'ArrowLeft') setIndiceAberto(i => i === null ? null : Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKeyDown)
    // Trava o scroll de fundo enquanto o modal esta aberto.
    const overflowOriginal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKeyDown); document.body.style.overflow = overflowOriginal }
  }, [indiceAberto, fotos.length])

  function onTouchStart(e: React.TouchEvent) { startXRef.current = e.touches[0].clientX; deltaXRef.current = 0 }
  function onTouchMove(e: React.TouchEvent) { deltaXRef.current = e.touches[0].clientX - startXRef.current }
  function onTouchEnd() {
    if (Math.abs(deltaXRef.current) > 50) {
      if (deltaXRef.current < 0) setIndiceAberto(i => i === null ? null : Math.min(i + 1, fotos.length - 1))
      else setIndiceAberto(i => i === null ? null : Math.max(i - 1, 0))
    }
    deltaXRef.current = 0
  }

  if (fotos.length === 0) return null
  const fotoAtual = indiceAberto !== null ? fotos[indiceAberto] : null

  return (
    <div style={{ marginBottom: '28px' }}>
      <p style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', marginBottom: subtitulo ? '2px' : '10px' }}>{titulo}</p>
      {subtitulo && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>{subtitulo}</p>}
      <div ref={containerRef} className="album-faixa-scroll">
        {fotos.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setIndiceAberto(i)}
            className="album-faixa-item"
            style={{ aspectRatio: aspect }}
            aria-label={f.titulo || 'Ver foto ampliada'}
          >
            <img src={f.imagem_url} alt={f.titulo || ''} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>

      {fotoAtual && (
        <div
          role="dialog"
          aria-modal="true"
          className="album-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setIndiceAberto(null) }}
        >
          <button type="button" onClick={() => setIndiceAberto(null)} aria-label="Fechar" className="album-modal-fechar"><X size={22} /></button>

          <div className="album-modal-conteudo" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            {indiceAberto! > 0 && (
              <button type="button" onClick={() => setIndiceAberto(i => i === null ? null : i - 1)} aria-label="Foto anterior" className="album-modal-seta album-modal-seta-esq"><ChevronLeft size={26} /></button>
            )}
            <div className="album-modal-img-wrap">
              <img src={fotoAtual.imagem_url} alt={fotoAtual.titulo || ''} className="album-modal-img" />
            </div>
            {indiceAberto! < fotos.length - 1 && (
              <button type="button" onClick={() => setIndiceAberto(i => i === null ? null : i + 1)} aria-label="Próxima foto" className="album-modal-seta album-modal-seta-dir"><ChevronRight size={26} /></button>
            )}
          </div>

          <div className="album-modal-info">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: fotoAtual.titulo || fotoAtual.descricao ? '6px' : 0 }}>
              {fotoAtual.titulo && <p className="album-modal-titulo">{fotoAtual.titulo}</p>}
              <span className="album-modal-contador">{(indiceAberto! + 1)} / {fotos.length}</span>
            </div>
            {fotoAtual.descricao && <p className="album-modal-legenda">{fotoAtual.descricao}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
