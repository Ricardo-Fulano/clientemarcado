// Fonte UNICA de verdade pros planos da MiniPage Pro / ClienteMarcado (Etapa 2 - nova
// estrutura comercial de 5 planos).
//
// plano_tipo no banco (perfis.plano_tipo) aceita: 'free' | 'minipage' | 'loja' | 'essencial' | 'equipe'
//
// IMPORTANTE - mapeamento comercial x interno (nao mexer sem avisar antes):
//   free      -> "MiniPage Free"  (R$ 0)
//   minipage  -> "MiniPage"       (R$ 39,90)
//   loja      -> "MiniPage Loja"  (R$ 59,90)
//   essencial -> "MiniPage Pro"   (R$ 79,90) - NAO renomeado no banco de proposito,
//                                              pra nao exigir migration em contas ja existentes
//   equipe    -> "MiniPage Equipe" (R$ 149,90)
//
// O valor interno do banco NUNCA muda so por causa do nome comercial - o nome exibido
// pro cliente sempre passa por obterNomePlano(), nunca aparece plano_tipo cru na tela.

export type PlanoTipo = 'free' | 'minipage' | 'loja' | 'essencial' | 'equipe'
// Mantido por compatibilidade com qualquer import antigo que possa existir.
export type PlanoNormalizado = PlanoTipo

/**
 * Normaliza qualquer valor de plano_tipo (nulo, vazio, desconhecido, ou um dos 5 validos)
 * pro valor REAL usado no banco. 'essencial' continua o fallback seguro (mesmo
 * comportamento de sempre, pra nao mudar nada de quem ja tem um valor invalido/antigo salvo).
 */
export function normalizarPlano(planoTipo?: string | null): PlanoTipo {
  const p = (planoTipo || '').toLowerCase().trim()
  if (p === 'free') return 'free'
  if (p === 'minipage') return 'minipage'
  if (p === 'loja') return 'loja'
  if (p === 'equipe') return 'equipe'
  return 'essencial'
}

/** Nome comercial exibido pro cliente (nunca o valor interno do banco). */
export function obterNomePlano(planoTipo?: string | null): string {
  const p = normalizarPlano(planoTipo)
  if (p === 'free') return 'MiniPage Free'
  if (p === 'minipage') return 'MiniPage'
  if (p === 'loja') return 'MiniPage Loja'
  if (p === 'equipe') return 'MiniPage Equipe'
  return 'MiniPage Pro'
}

/** Preco mensal em reais (numero, sem formatacao) do plano. */
export function obterPrecoPlano(planoTipo?: string | null): number {
  const p = normalizarPlano(planoTipo)
  if (p === 'free') return 0
  if (p === 'minipage') return 39.90
  if (p === 'loja') return 59.90
  if (p === 'equipe') return 149.90
  return 79.90
}

/**
 * Texto "reason" enviado ao Mercado Pago na criacao da assinatura.
 * Free tecnicamente tem um retorno aqui so por consistencia - a API do Mercado Pago
 * precisa BLOQUEAR cobranca do Free numa proxima etapa (nao faz isso ainda).
 */
export function obterReasonMercadoPago(planoTipo?: string | null): string {
  const p = normalizarPlano(planoTipo)
  if (p === 'free') return 'MiniPage Pro - Plano Free'
  if (p === 'minipage') return 'MiniPage Pro - Plano MiniPage'
  if (p === 'loja') return 'MiniPage Pro - Plano Loja'
  if (p === 'equipe') return 'MiniPage Pro - Plano Equipe'
  return 'MiniPage Pro - Plano Pro'
}

export function ehPlanoFree(planoTipo?: string | null): boolean {
  return normalizarPlano(planoTipo) === 'free'
}

export function ehPlanoMiniPage(planoTipo?: string | null): boolean {
  return normalizarPlano(planoTipo) === 'minipage'
}

export function ehPlanoLoja(planoTipo?: string | null): boolean {
  return normalizarPlano(planoTipo) === 'loja'
}

export function ehPlanoEquipe(planoTipo?: string | null): boolean {
  return normalizarPlano(planoTipo) === 'equipe'
}

/** Planos com recursos de gestao (agenda, clientes, financeiro, relatorios): so Pro e Equipe. */
export function ehPlanoComGestao(planoTipo?: string | null): boolean {
  const p = normalizarPlano(planoTipo)
  return p === 'essencial' || p === 'equipe'
}

/** Mesmo comportamento de ehPlanoComGestao() - nome semantico especifico pra agenda. */
export function permiteAgenda(planoTipo?: string | null): boolean {
  return ehPlanoComGestao(planoTipo)
}

/** Mesmo comportamento de ehPlanoComGestao() - nome semantico especifico pro financeiro. */
export function permiteFinanceiro(planoTipo?: string | null): boolean {
  return ehPlanoComGestao(planoTipo)
}

/** So o plano Equipe tem area de equipe/profissionais com login individual. */
export function permiteEquipe(planoTipo?: string | null): boolean {
  return ehPlanoEquipe(planoTipo)
}

/** WhatsApp contextual no catalogo (com mensagem automatica). Free e MiniPage nao tem. */
export function permiteCatalogoWhatsapp(planoTipo?: string | null): boolean {
  const p = normalizarPlano(planoTipo)
  return p === 'loja' || p === 'essencial' || p === 'equipe'
}

/**
 * Quantos catalogos o plano permite criar. Infinity representa "ilimitado" - usar esse
 * valor direto nas comparacoes (ex: quantidadeAtual >= limite) funciona corretamente sem
 * precisar de nenhum caso especial pra "ilimitado".
 */
export function obterLimiteCatalogos(planoTipo?: string | null): number {
  const p = normalizarPlano(planoTipo)
  if (p === 'free') return 0
  if (p === 'minipage') return 1
  return Infinity // loja, essencial (Pro), equipe
}

/**
 * Quantos profissionais (login individual/equipe) o plano permite cadastrar.
 * Free, MiniPage e Loja nao tem area de profissionais/equipe.
 */
export function obterLimiteProfissionais(planoTipo?: string | null): number {
  const p = normalizarPlano(planoTipo)
  if (p === 'equipe') return 15
  if (p === 'essencial') return 3
  return 0 // free, minipage, loja
}
