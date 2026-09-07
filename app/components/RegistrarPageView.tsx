'use client'
import { useEffect, useRef } from 'react'

// Componente minusculo, sem nenhuma renderizacao visual, cujo unico trabalho e registrar
// 1 evento "page_view" quando a pagina publica da MiniPage carrega. Nao transforma a pagina
// inteira em Client Component - so essa "ilha" pequena roda no navegador.
//
// Usa sendBeacon quando disponivel (dispara e garante entrega mesmo que a pessoa navegue pra
// outro lugar logo em seguida) e cai pra fetch com keepalive como fallback em navegadores
// mais antigos que nao tem sendBeacon.
export default function RegistrarPageView({ perfilId }: { perfilId: string }) {
  const jaRegistrou = useRef(false)

  useEffect(() => {
    // Guarda extra contra dupla execucao do useEffect em desenvolvimento (React Strict Mode
    // roda o efeito 2x de proposito em dev, nunca em producao) - sem isso, cada carregamento
    // no localhost geraria 2 linhas em vez de 1.
    if (jaRegistrou.current) return
    jaRegistrou.current = true

    if (!perfilId) return

    const payload = JSON.stringify({
      perfil_id: perfilId,
      tipo_evento: 'page_view',
      origem: 'pagina_publica',
    })

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/eventos/registrar', blob)
    } else {
      fetch('/api/eventos/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => { /* falha silenciosa - nunca deve incomodar o visitante */ })
    }
  }, [perfilId])

  return null
}
