// Fonte UNICA de verdade pros planos da MiniPage Pro (Fase de consolidacao).
//
// plano_tipo no banco (perfis.plano_tipo) aceita hoje: 'minipage' | 'essencial' | 'equipe'.
// O nome comercial exibido pro plano 'essencial' e "Profissional" - o valor interno no
// banco NUNCA muda, so o texto mostrado pro cliente.
//
// ATENCAO - CORRECAO NESSA CONSOLIDACAO: a versao anterior deste arquivo normalizava pra
// 'profissional' (nome comercial) em vez de 'essencial' (valor real do banco). Isso fazia
// qualquer comparacao com 'essencial' falhar silenciosamente, e por isso esse arquivo quase
// nao era usado no resto do projeto. Corrigido agora pra sempre normalizar pro valor REAL
// do banco - o nome comercial "Profissional" so aparece via obterNomePlano().

export type PlanoTipo = 'minipage' | 'essencial' | 'equipe'
// Mantido por compatibilidade com qualquer import antigo que possa existir.
export type PlanoNormalizado = PlanoTipo

/**
 * Normaliza qualquer valor de plano_tipo (nulo, vazio, desconhecido, ou um dos 3 validos)
 * pro valor REAL usado no banco. 'essencial' e sempre o fallback seguro - mesmo
 * comportamento que todo o resto do codigo ja usava antes desta consolidacao.
 */
export function normalizarPlano(planoTipo?: string | null): PlanoTipo {
  const p = (planoTipo || '').toLowerCase().trim()
  if (p === 'minipage') return 'minipage'
  if (p === 'equipe') return 'equipe'
  return 'essencial'
}

/** Nome comercial exibido pro cliente (nunca o valor interno do banco). */
export function obterNomePlano(planoTipo?: string | null): string {
  const p = normalizarPlano(planoTipo)
  if (p === 'minipage') return 'MiniPage'
  if (p === 'equipe') return 'Equipe'
  return 'Profissional'
}

/** Preco mensal em reais (numero, sem formatacao) do plano. */
export function obterPrecoPlano(planoTipo?: string | null): number {
  const p = normalizarPlano(planoTipo)
  if (p === 'minipage') return 39.90
  if (p === 'equipe') return 149.90
  return 79.90
}

/** Texto "reason" enviado ao Mercado Pago na criacao da assinatura. */
export function obterReasonMercadoPago(planoTipo?: string | null): string {
  const p = normalizarPlano(planoTipo)
  if (p === 'minipage') return 'MiniPage Pro - Plano MiniPage'
  if (p === 'equipe') return 'MiniPage Pro - Plano Equipe'
  return 'MiniPage Pro - Plano Profissional'
}

export function ehPlanoMiniPage(planoTipo?: string | null): boolean {
  return normalizarPlano(planoTipo) === 'minipage'
}

export function ehPlanoEquipe(planoTipo?: string | null): boolean {
  return normalizarPlano(planoTipo) === 'equipe'
}

/** Planos com recursos de gestao (agenda, clientes, financeiro, relatorios). MiniPage nao tem. */
export function ehPlanoComGestao(planoTipo?: string | null): boolean {
  return normalizarPlano(planoTipo) !== 'minipage'
}

/**
 * Quantos profissionais (login individual/equipe) o plano permite cadastrar.
 * MiniPage nao tem a area de profissionais/equipe (fica bloqueada por
 * BloqueioPlanoMiniPage), entao o limite pratico e 0.
 */
export function obterLimiteProfissionais(planoTipo?: string | null): number {
  const p = normalizarPlano(planoTipo)
  if (p === 'equipe') return 15
  if (p === 'essencial') return 3
  return 0
}

/** Quantos catalogos (a funcao Catalogo) o plano permite criar. */
export function obterLimiteCatalogos(planoTipo?: string | null): number {
  const p = normalizarPlano(planoTipo)
  if (p === 'minipage') return 3
  if (p === 'equipe') return 10
  return 6
}
