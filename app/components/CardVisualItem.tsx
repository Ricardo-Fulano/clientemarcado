'use client'
import { useRef } from 'react'
import CardVisualMedia from './CardVisualMedia'
import type { ImageFit } from './CardVisualMedia'

// Card visual (modulo "Links visuais") - card horizontal encorpado, nunca banner 16:9.
// Tamanho/proporcao EXTERNA (.card-visual-item, ::before, .link-grid) nunca mudam aqui -
// a decisao de COMO a imagem se encaixa dentro desse espaco fica em CardVisualMedia,
// compartilhado com o preview do formulario no painel.
export default function CardVisualItem({
  imagemUrl,
  titulo,
  exibirTitulo,
  url,
  imageFit = 'cover',
}: {
  imagemUrl?: string | null
  titulo?: string | null
  exibirTitulo?: boolean
  url?: string | null
  imageFit?: ImageFit
}) {
  const itemRef = useRef<HTMLAnchorElement>(null)
  if (!imagemUrl || !url) return null
  const externo = url.startsWith('http://') || url.startsWith('https://')

  return (
    <a
      ref={itemRef}
      href={url}
      target={externo ? '_blank' : '_self'}
      rel="noopener noreferrer"
      className="card-visual-item"
      aria-label={titulo || 'Abrir link'}
      data-track-tipo="card_visual_click"
      data-track-item-titulo={titulo || ''}
      data-track-item-url={url}
    >
      <CardVisualMedia imagemUrl={imagemUrl} titulo={titulo} imageFit={imageFit} containerRef={itemRef} />
      {exibirTitulo && titulo && (
        <div className="card-visual-overlay">
          <p className="card-visual-titulo">{titulo}</p>
        </div>
      )}
    </a>
  )
}
