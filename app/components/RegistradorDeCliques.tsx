'use client'
import { useEffect } from 'react'

// Componente minusculo, sem nenhuma renderizacao visual, que escuta cliques na pagina INTEIRA
// (delegacao de evento no document) e registra o clique quando o elemento clicado - ou algum
// pai dele - tiver os atributos data-track-*. Isso evita precisar converter cada link
// individual (Links rapidos, Redes sociais, Agendar agora, e no futuro Destaques/Videos/
// Catalogo) numa Client Component separada: um unico listener cobre a pagina toda.
//
// IMPORTANTE: nunca chama preventDefault() - o clique sempre segue a navegacao normal do
// link, o registro do evento acontece "por baixo", sem atrasar nem interromper nada.
const TIPOS_EVENTO_PERMITIDOS = [
  'link_rapido_click', 'destaque_click', 'video_click',
  'catalogo_click', 'whatsapp_click', 'agendar_click', 'social_click',
]

export default function RegistradorDeCliques({ perfilId }: { perfilId: string }) {
  useEffect(() => {
    if (!perfilId) return

    function aoClicar(evento: MouseEvent) {
      const alvo = evento.target as HTMLElement | null
      if (!alvo) return

      // Procura o elemento clicado OU o pai mais proximo que tenha data-track-tipo - cobre o
      // caso de clicar num icone/texto DENTRO do link, nao so na borda exata do <a>.
      const elementoRastreado = alvo.closest('[data-track-tipo]') as HTMLElement | null
      if (!elementoRastreado) return // sem atributo -> nao faz nada, comportamento 9 do pedido

      const tipoEvento = elementoRastreado.getAttribute('data-track-tipo')
      if (!tipoEvento || !TIPOS_EVENTO_PERMITIDOS.includes(tipoEvento)) return // valida tipo

      const payload = JSON.stringify({
        perfil_id: perfilId,
        tipo_evento: tipoEvento,
        item_id: elementoRastreado.getAttribute('data-track-item-id') || undefined,
        item_titulo: elementoRastreado.getAttribute('data-track-item-titulo') || undefined,
        item_url: elementoRastreado.getAttribute('data-track-item-url') || undefined,
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
      // Sem preventDefault: o navegador segue a navegacao normalmente, em paralelo.
    }

    document.addEventListener('click', aoClicar)
    return () => document.removeEventListener('click', aoClicar)
  }, [perfilId])

  return null
}
