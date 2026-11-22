import 'server-only'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

export type EstadoInstagram = {uid: string; state: string; created: number}
export type SessaoInstagram = {uid: string; token: string; created: number; instagramId?: string; username?: string}

function key() {
  const secret = process.env.SMART_IMPORT_COOKIE_SECRET || ''
  if (secret.length < 32) throw new Error('SMART_IMPORT_COOKIE_SECRET ausente ou fraca')
  return createHash('sha256').update(secret).digest()
}
export function selar(dados: object) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const body = Buffer.concat([cipher.update(JSON.stringify(dados), 'utf8'), cipher.final()])
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), body.toString('base64url')].join('.')
}
export function abrir<T>(valor: string | undefined): T | null {
  if (!valor) return null
  try {
    const p = valor.split('.')
    if (p.length !== 3) return null
    const iv = Buffer.from(p[0], 'base64url')
    const tag = Buffer.from(p[1], 'base64url')
    const body = Buffer.from(p[2], 'base64url')
    if (iv.length !== 12 || tag.length !== 16 || body.length > 8192) return null
    const decipher = createDecipheriv('aes-256-gcm', key(), iv)
    decipher.setAuthTag(tag)
    return JSON.parse(Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8')) as T
  } catch { return null }
}
export const cookieAttrs = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/api/smart-import/instagram', maxAge: 1800 }
export const COOKIE_STATE = 'mp_ig_state'
export const COOKIE_TOKEN = 'mp_ig_token'
