import crypto from 'node:crypto'

// Dois segredos independentes: link (canal A) + codigo (canal B).
// Nunca guardar codigo ou token em texto puro no banco.
export function hashConviteProtegido(token: string, codigo: string): string {
  return crypto.createHash('sha256').update(`minipage-transfer-v2:${token}:${codigo}`).digest('hex')
}
export function gerarCodigoTransferencia(): string {
  return crypto.randomBytes(16).toString('hex') // 128 bits, sem brute force viavel
}
export function codigoValido(codigo: unknown): codigo is string {
  return typeof codigo === 'string' && /^[0-9a-f]{32}$/i.test(codigo)
}
