// Regra comercial de comissao de parceiros - fonte unica (nao duplicar 0.20/0.30 em outros arquivos).
//   Parceiro padrao      = 20%
//   Parceiro estrategico = 30%
// O percentual e GRAVADO em parceiros.percentual_comissao (CHECK no banco: so 0.20 ou 0.30) e
// CONGELADO em comissoes_parceiros.percentual no momento de cada nova comissao (pela RPC
// registrar_comissao_pagamento, que nao muda). Mudar a modalidade so afeta comissoes futuras.
// parceiros.tipo (rotulo comercial livre) e parceiros.comissao_fixa NAO participam desta regra.

export type ModalidadeParceiro = 'padrao' | 'estrategico'

export const PERCENTUAL_PARCEIRO_PADRAO = 0.20
export const PERCENTUAL_PARCEIRO_ESTRATEGICO = 0.30

// Modalidade semantica (unica coisa que o navegador envia) -> percentual. Qualquer outro valor: null.
export function percentualDaModalidade(modalidade: unknown): number | null {
  if (modalidade === 'padrao') return PERCENTUAL_PARCEIRO_PADRAO
  if (modalidade === 'estrategico') return PERCENTUAL_PARCEIRO_ESTRATEGICO
  return null
}

// Valor lido do banco (numeric pode chegar como number ou string, ex.: "0.30") -> UMA das duas
// constantes, ou null. Nunca devolve o valor cru e nunca assume um padrao: se nao for
// exatamente 0.20 ou 0.30, o chamador decide o que fazer (webhook: nao gera comissao).
export function resolverPercentualComissao(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  const n = typeof valor === 'number' ? valor : typeof valor === 'string' ? Number(valor.trim()) : NaN
  if (!Number.isFinite(n)) return null
  const centesimos = Math.round(n * 100)
  if (Math.abs(n * 100 - centesimos) > 1e-6) return null
  if (centesimos === 20) return PERCENTUAL_PARCEIRO_PADRAO
  if (centesimos === 30) return PERCENTUAL_PARCEIRO_ESTRATEGICO
  return null
}

export function modalidadeDoPercentual(valor: unknown): ModalidadeParceiro | null {
  const p = resolverPercentualComissao(valor)
  if (p === PERCENTUAL_PARCEIRO_PADRAO) return 'padrao'
  if (p === PERCENTUAL_PARCEIRO_ESTRATEGICO) return 'estrategico'
  return null
}
