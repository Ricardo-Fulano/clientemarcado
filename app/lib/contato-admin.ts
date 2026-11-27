// Contato privado do titular, em digitos com DDI. Nao usa dados publicos nem de cobranca.
import { formatarWhatsappExibicao, mensagemRecuperacaoPagamento, normalizarWhatsappBR } from './whatsapp'

export function normalizarContatoSalvo(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const s = valor.trim()
  if (!s || s.length > 40) return null
  // Os dois fluxos de cadastro gravam o DDI, sem o sinal +. Nao prefixar 55 novamente.
  if (/^[1-9]\d{7,14}$/.test(s)) return s
  if (/^\+[\d\s().-]+$/.test(s)) {
    const d = s.replace(/\D/g, '')
    return /^[1-9]\d{7,14}$/.test(d) ? d : null
  }
  // Compatibilidade com numeros brasileiros antigos formatados.
  return normalizarWhatsappBR(s)
}

export function contatoPrivadoCadastro(meta: Record<string, unknown>): string | null {
  return normalizarContatoSalvo(meta.telefone_privado) ?? normalizarContatoSalvo(meta.whatsapp)
}

export function formatarContatoAdmin(valor: unknown): string {
  const n = normalizarContatoSalvo(valor)
  if (!n) return ''
  // Mantem a mascara brasileira somente para um numero com DDI 55 explicito.
  if (/^55[1-9][1-9]9\d{8}$/.test(n)) return formatarWhatsappExibicao(n)
  return '+' + n
}

export function linkContatoAdmin(c: { whatsapp?: unknown; status_acesso?: unknown; nome_contato?: unknown }): string | null {
  const n = normalizarContatoSalvo(c.whatsapp)
  if (!n) return null
  const texto = c.status_acesso === 'aguardando_pagamento' ? mensagemRecuperacaoPagamento(c.nome_contato) : undefined
  return `https://wa.me/${n}${texto ? '?text=' + encodeURIComponent(texto) : ''}`
}
