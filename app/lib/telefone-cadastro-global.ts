// Telefone de contato para cadastro internacional.
// Armazenamento legado: apenas digitos, sem '+', para compatibilidade com o esquema atual.
// Comprimento E.164: ate 15 digitos; verificacao de atribuicao/operadora nao feita aqui.
import { normalizarWhatsappBR } from './whatsapp'
export function normalizarTelefoneCadastro(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const raw = valor.trim()
  if (!raw || raw.length > 40) return null
  if (raw.startsWith('+')) {
    if (!/^\+[\d\s().-]+$/.test(raw)) return null
    const numero = raw.replace(/\D/g, '')
    if (!/^[1-9]\d{7,14}$/.test(numero)) return null
    return numero
  }
  // Mantem compatibilidade com cadastros brasileiros anteriores sem DDI.
  return normalizarWhatsappBR(raw)
}
