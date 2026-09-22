'use client'
import { useEffect, useRef, useState, Children, cloneElement, isValidElement } from 'react'

// Faixa horizontal continua ("esteira") pros icones sociais do topo da MiniPage publica.
// Recebe os elementos <a> ja prontos (icone, cor, href, target, etc) vindos do server -
// aqui so cuida do COMPORTAMENTO de scroll/drag/auto-scroll, nunca da logica de qual
// icone/link renderizar (isso continua 100% centralizado na page).
export default function SocialTicker({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [precisaEsteira, setPrecisaEsteira] = useState(false)
  const [arrastando, setArrastando] = useState(false)

  // Estado de interacao/animacao vive em refs (nao state) - precisamos ler/escrever isso a
  // cada frame de animacao sem causar re-render do React a cada frame (custaria caro).
  const pausadoRef = useRef(false)
  const retomarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const arrastandoRef = useRef(false)
  const startXRef = useRef(0)
  const scrollInicialRef = useRef(0)
  const moveuRef = useRef(false)
  const metadeLarguraRef = useRef(0)
  const reducedMotionRef = useRef(false)

  const itens = Children.toArray(children)

  // Decide, apos o primeiro render real no navegador, se os itens cabem confortavelmente
  // na largura disponivel. So ativa a esteira (duplicando o conteudo e animando) quando o
  // conteudo real excede o espaco - poucos icones continuam estaticos e centralizados.
  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    function medir() {
      if (!containerRef.current || !trackRef.current) return
      const largura = containerRef.current.clientWidth
      const larguraConteudoReal = trackRef.current.scrollWidth
      setPrecisaEsteira(larguraConteudoReal > largura + 4)
    }
    medir()
    const ro = new ResizeObserver(medir)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [itens.length])

  // Loop de auto-scroll via requestAnimationFrame - so roda quando precisaEsteira e true e
  // o usuario nao esta interagindo nem tem prefers-reduced-motion ativado. Velocidade lenta
  // e constante (~20px/s), sem aceleracao/desaceleracao brusca.
  useEffect(() => {
    if (!precisaEsteira || reducedMotionRef.current) return
    const container = containerRef.current
    const track = trackRef.current
    if (!container || !track) return

    // trackRef aponta pro PRIMEIRO filho (uma unica copia dos itens, sem a duplicada) -
    // scrollWidth dele JA e a largura de uma copia completa. NAO dividir por 2 aqui: o
    // reset do loop deve acontecer ao completar exatamente uma copia, nao a metade dela.
    metadeLarguraRef.current = track.scrollWidth
    let raf = 0
    let ultimoTs = 0
    const VELOCIDADE_PX_POR_MS = 0.02 // ~20px/s - lento e elegante, conforme pedido

    function passo(ts: number) {
      if (!ultimoTs) ultimoTs = ts
      const delta = ts - ultimoTs
      ultimoTs = ts
      if (!pausadoRef.current && container) {
        container.scrollLeft += VELOCIDADE_PX_POR_MS * delta
        // Loop sem salto: quando passa da metade (fim da 1a copia), volta exatamente a
        // posicao equivalente na 2a copia - como o conteudo e identico, e imperceptivel.
        if (container.scrollLeft >= metadeLarguraRef.current) {
          container.scrollLeft -= metadeLarguraRef.current
        }
      }
      raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [precisaEsteira])

  function pausar() {
    pausadoRef.current = true
    if (retomarTimeoutRef.current) clearTimeout(retomarTimeoutRef.current)
  }
  function agendarRetomada() {
    if (retomarTimeoutRef.current) clearTimeout(retomarTimeoutRef.current)
    // Aguarda um intervalo antes de retomar - evita sensacao de "puxao" logo apos soltar.
    retomarTimeoutRef.current = setTimeout(() => { pausadoRef.current = false }, 3000)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!precisaEsteira) return
    arrastandoRef.current = true
    moveuRef.current = false
    startXRef.current = e.clientX
    scrollInicialRef.current = containerRef.current?.scrollLeft || 0
    pausar()
    setArrastando(true)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!arrastandoRef.current || !containerRef.current) return
    const deltaX = e.clientX - startXRef.current
    if (Math.abs(deltaX) > 6) moveuRef.current = true
    containerRef.current.scrollLeft = scrollInicialRef.current - deltaX
  }
  function onPointerUp() {
    if (!arrastandoRef.current) return
    arrastandoRef.current = false
    setArrastando(false)
    agendarRetomada()
  }
  // Toque/swipe nativo (mobile) e cobertos pelos proprios Pointer Events abaixo -
  // Pointer Events unificam mouse/touch/caneta num unico conjunto de handlers, evitando
  // os estados inconsistentes que handlers de touch e pointer separados causavam.

  // Distingue clique de arraste: se o ponteiro se moveu mais que a tolerancia durante o
  // gesto, o clique no link e cancelado (capturado antes de chegar no <a>).
  function onClickCapture(e: React.MouseEvent) {
    if (moveuRef.current) { e.preventDefault(); e.stopPropagation() }
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      style={{
        display: 'flex',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        cursor: precisaEsteira ? (arrastando ? 'grabbing' : 'grab') : 'default',
        justifyContent: precisaEsteira ? 'flex-start' : 'center',
        userSelect: arrastando ? 'none' : undefined,
      }}
      className="social-ticker-viewport"
    >
      <div ref={trackRef} style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', flexShrink: 0 }}>
        {itens}
      </div>
      {/* Copia visual, so pra criar o loop continuo quando a esteira esta ativa - nunca
          semanticamente duplicada: aria-hidden e tabIndex=-1 tiram do fluxo de acessibilidade
          e de navegacao por teclado, e as keys sao prefixadas pra nunca colidir com o original. */}
      {precisaEsteira && (
        <div aria-hidden="true" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', flexShrink: 0, marginLeft: '8px' }}>
          {itens.map((item, i) =>
            isValidElement(item) ? cloneElement(item as React.ReactElement<any>, { key: `dup-${i}`, tabIndex: -1 }) : item
          )}
        </div>
      )}
    </div>
  )
}
