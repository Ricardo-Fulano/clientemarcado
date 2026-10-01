'use client'
import { useRef } from 'react'
import CardVisualMedia, { type ImageFit } from './CardVisualMedia'

// Preview do painel - usa a MESMA logica de enquadramento (CardVisualMedia) que a slug
// publica usa de verdade, para o cliente ver antes de salvar exatamente como a arte vai
// se comportar. A caixa aqui usa a proporcao real do card em DESKTOP (padding-top:18.13%,
// a mesma % usada em app/[slug]/page.tsx para min-width:768px) por ser o caso mais critico
// de enquadramento - no mobile a proporcao do card e mais compacta (~3.28:1) e pode exibir
// a imagem de forma ligeiramente diferente deste preview, já que a decisao do modo
// Automatico é sempre recalculada em tempo real contra o tamanho real do card de cada
// tela, nunca fixa.
export default function CardVisualPreviewBox({ imagemUrl, titulo, imageFit }: { imagemUrl?: string | null; titulo?: string | null; imageFit: ImageFit }) {
  const containerRef = useRef<HTMLDivElement>(null)
  if (!imagemUrl) return null
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #2A1A2F' }}>
      <div style={{ paddingTop: '18.13%' }} />
      <div style={{ position: 'absolute', inset: 0 }}>
        <CardVisualMedia imagemUrl={imagemUrl} titulo={titulo} imageFit={imageFit} containerRef={containerRef} />
      </div>
    </div>
  )
}
