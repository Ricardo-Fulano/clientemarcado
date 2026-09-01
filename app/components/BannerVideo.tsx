'use client'
import { useState } from 'react'

// Banner em video para a pagina publica. Se o video falhar ao carregar (link quebrado,
// formato invalido, CORS, etc), cai automaticamente pro fallback (imagem de capa, se houver,
// ou o gradiente padrao) - nunca deixa a pagina com um espaco vazio/quebrado no topo.
export default function BannerVideo({
  src, className, capaFallback, temaSoft,
}: {
  src: string
  className: string
  capaFallback?: string
  temaSoft?: string
}) {
  const [erro, setErro] = useState(false)

  if (erro) {
    return capaFallback
      ? <img src={capaFallback} alt="" className={className} decoding="async" fetchPriority="high" />
      : <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top left,${temaSoft},transparent 40%),var(--card)` }} />
  }

  return (
    <video
      src={src}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      onError={() => setErro(true)}
    />
  )
}
