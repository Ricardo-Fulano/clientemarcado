// Utilitario pequeno e reutilizavel pra registrar eventos de analytics a partir de
// Client Components. Centraliza a logica de sendBeacon/fetch keepalive - qualquer
// componente novo que precise disparar um evento programaticamente (nao via
// data-track-* + listener global) usa essa mesma funcao, em vez de duplicar a logica.
//
// Nao mexe nos componentes que ja funcionam (RegistrarPageView, RegistradorDeCliques) -
// eles continuam com a propria copia da logica, sem risco de regressao.

export type PayloadEvento = {
  perfil_id: string
  tipo_evento: string
  item_id?: string
  item_titulo?: string
  item_url?: string
  origem?: string
  metadata?: Record<string, any>
}

export function registrarEvento(payload: PayloadEvento) {
  if (!payload?.perfil_id || !payload?.tipo_evento) return

  const corpo = JSON.stringify(payload)

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([corpo], { type: 'application/json' })
    navigator.sendBeacon('/api/eventos/registrar', blob)
  } else {
    fetch('/api/eventos/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: corpo,
      keepalive: true,
    }).catch(() => { /* falha silenciosa - nunca deve incomodar o visitante */ })
  }
}
