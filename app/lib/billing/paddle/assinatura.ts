import { createHmac, timingSafeEqual } from 'node:crypto'

/** Verificacao do Paddle-Signature sobre ts:rawBody, sem transformar o corpo. */
export function verificarAssinaturaPaddle(
  rawBody: string,
  header: string | null,
  segredo: string,
  agoraSegundos = Math.floor(Date.now() / 1000),
  toleranciaSegundos = 300,
): boolean {
  if (!header || !segredo || typeof rawBody !== 'string' || rawBody.length > 131072) return false
  const partes = header.split(';').map((item) => item.trim())
  const timestamp = partes.find((item) => item.startsWith('ts='))?.slice(3)
  const assinaturas = partes.filter((item) => item.startsWith('h1=')).map((item) => item.slice(3))
  if (!timestamp || !/^\d{9,12}$/.test(timestamp) || assinaturas.length < 1) return false
  const ts = Number(timestamp)
  if (!Number.isSafeInteger(ts) || !Number.isFinite(agoraSegundos) || Math.abs(agoraSegundos - ts) > toleranciaSegundos) return false
  const esperado = createHmac('sha256', segredo).update(`${timestamp}:${rawBody}`, 'utf8').digest()
  for (const candidato of assinaturas) {
    if (!/^[a-fA-F0-9]{64}$/.test(candidato)) continue
    const recebido = Buffer.from(candidato, 'hex')
    if (recebido.length === esperado.length && timingSafeEqual(recebido, esperado)) return true
  }
  return false
}
