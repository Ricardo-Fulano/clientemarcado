'use client'
import { useEffect, useRef, useState, type RefObject } from 'react'

export type ImageFit = 'auto' | 'cover' | 'contain'

// 18%: calculado comparando a imagem recomendada (1200x365, ~3.29:1) com a proporcao real
// do card em mobile (~3.28:1, diff ~0.2%) e em desktop (~5.52:1, diff ~40%) - separa bem
// "praticamente a mesma proporcao" (cover direto) de "proporcao bem diferente" (composicao).
const THRESHOLD_AUTO = 0.18

type ModoAuto = 'cover' | 'composto'

// Mede a imagem real (naturalWidth/naturalHeight) contra o tamanho REAL do container no
// momento (nunca um valor fixo, ja que a proporcao do card muda entre mobile e desktop) e
// decide se cover basta ou se e preciso a composicao de duas camadas. Recalcula a cada
// resize (ResizeObserver) porque o mesmo registro pode precisar de cover no mobile e
// composicao no desktop, ou vice-versa.
function useAutoImageFit(containerRef: RefObject<HTMLElement | null>, imagemUrl: string | null | undefined, imageFit: ImageFit) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [modoAuto, setModoAuto] = useState<ModoAuto>('cover')

  useEffect(() => {
    if (imageFit !== 'auto') return
    function recalcular() {
      const container = containerRef.current
      const img = imgRef.current
      if (!container || !img || !img.naturalWidth || !img.naturalHeight) return
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      const imageRatio = img.naturalWidth / img.naturalHeight
      const cardRatio = width / height
      const diff = Math.abs(imageRatio - cardRatio) / cardRatio
      setModoAuto(diff <= THRESHOLD_AUTO ? 'cover' : 'composto')
    }
    recalcular()
    const ro = new ResizeObserver(recalcular)
    if (containerRef.current) ro.observe(containerRef.current)
    const img = imgRef.current
    img?.addEventListener('load', recalcular)
    return () => {
      ro.disconnect()
      img?.removeEventListener('load', recalcular)
    }
  }, [imageFit, imagemUrl, containerRef])

  return { imgRef, modoAuto }
}

// containerRef deve apontar para o elemento que JA TEM o tamanho/proporcao final do card
// (ex: .card-visual-item na slug) - este componente nunca define largura/altura/proporcao,
// so preenche o espaco que o pai ja determinou.
export default function CardVisualMedia({
  imagemUrl,
  titulo,
  imageFit,
  containerRef,
}: {
  imagemUrl?: string | null
  titulo?: string | null
  imageFit: ImageFit
  containerRef: RefObject<HTMLElement | null>
}) {
  const { imgRef, modoAuto } = useAutoImageFit(containerRef, imagemUrl, imageFit)
  if (!imagemUrl) return null

  if (imageFit === 'contain') {
    return <img ref={imgRef} src={imagemUrl} alt={titulo || ''} loading="lazy" decoding="async" className="card-visual-img" style={{ objectFit: 'contain', background: '#080808' }} />
  }

  // 'cover' explicito, ou modo auto que mediu e decidiu que cover basta.
  if (imageFit === 'cover' || (imageFit === 'auto' && modoAuto === 'cover')) {
    return <img ref={imgRef} src={imagemUrl} alt={titulo || ''} loading="lazy" decoding="async" className="card-visual-img" style={{ objectFit: 'cover', background: 'transparent' }} />
  }

  // Auto + proporcao muito diferente: composicao em duas camadas - a mesma imagem ao
  // fundo (cover, desfocada, escurecida) preenchendo o card inteiro, com a arte original
  // completa (contain) centralizada por cima. Nada e cortado na imagem principal.
  return (
    <>
      <img src={imagemUrl} alt="" aria-hidden="true" className="card-visual-bg" />
      <div className="card-visual-bg-overlay" />
      <img ref={imgRef} src={imagemUrl} alt={titulo || ''} loading="lazy" decoding="async" className="card-visual-main" />
    </>
  )
}
