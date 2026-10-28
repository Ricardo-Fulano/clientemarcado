'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

// Banner em video para a pagina publica. Se o video falhar ao carregar (link quebrado,
// formato invalido, CORS, etc), cai automaticamente pro fallback (imagem de capa, se houver,
// ou o gradiente padrao) - nunca deixa a pagina com um espaco vazio/quebrado no topo.
//
// CARGA SOB DEMANDA: a pagina publica monta o banner de desktop E o de celular ao mesmo tempo e o CSS
// esconde um deles (display:none). Um <video> com src continua baixando mesmo escondido, entao o video
// escondido era baixado junto com o visivel. Aqui o <video> sai do servidor SEM src (so com a capa como
// poster) e o src so e atribuido quando o elemento esta realmente visivel (tem caixa na tela). Se o
// elemento for escondido depois (girar o aparelho, redimensionar), o video e pausado e o src e removido.
export default function BannerVideo({
  src, className, capaFallback, temaSoft, style, ariaHidden, fallbackErro = true,
}: {
  src: string
  className: string
  capaFallback?: string
  temaSoft?: string
  style?: CSSProperties
  ariaHidden?: boolean
  fallbackErro?: boolean   // false: em erro, mantem o <video> (com o poster) em vez de trocar por imagem/gradiente
}) {
  const [erro, setErro] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el || erro) return
    let anexado = false
    const anexar = () => {
      anexado = true
      el.src = src
      const p = el.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }
    const soltar = () => {
      anexado = false
      el.pause()
      el.removeAttribute('src')
      el.load()
    }
    const sincronizar = () => {
      const visivel = el.getClientRects().length > 0
      if (visivel && !anexado) anexar()
      else if (!visivel && anexado) soltar()
    }
    sincronizar()
    const observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sincronizar) : null
    observador?.observe(el)
    window.addEventListener('resize', sincronizar)
    return () => {
      observador?.disconnect()
      window.removeEventListener('resize', sincronizar)
      if (anexado) soltar()
    }
  }, [src, erro])

  if (erro) {
    return capaFallback
      ? <img src={capaFallback} alt="" className={className} decoding="async" fetchPriority="high" />
      : <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top left,${temaSoft},transparent 40%),var(--card)` }} />
  }

  return (
    <video
      ref={videoRef}
      className={className}
      style={style}
      poster={capaFallback}
      preload="metadata"
      autoPlay
      muted
      loop
      playsInline
      aria-hidden={ariaHidden ? 'true' : undefined}
      onError={() => { if (fallbackErro) setErro(true) }}
    />
  )
}
