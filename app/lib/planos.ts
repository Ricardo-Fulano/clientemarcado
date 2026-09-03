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

// ===================================================================
// SUPORTE A PLANO ANUAL
// ===================================================================
// obterPrecoPlano() (acima) continua EXATAMENTE como antes - nenhuma chamada existente
// quebra, ja que nada muda na assinatura nem no comportamento dela. As funcoes abaixo sao
// aditivas, criadas so pra dar suporte ao ciclo anual sem duplicar valores espalhados.

/** Alias explicito do preco mensal - mesmo valor de obterPrecoPlano(), so com nome mais claro
 *  pra usar lado a lado com obterPrecoAnualPlano() sem ambiguidade. */
export function obterPrecoMensalPlano(planoTipo?: string | null): number {
  return obterPrecoPlano(planoTipo)
}

export function obterPrecoAnualPlano(planoTipo?: string | null): number {
  const p = normalizarPlano(planoTipo)
  if (p === 'free') return 0
  if (p === 'minipage') return 397.00
  if (p === 'loja') return 597.00
  if (p === 'equipe') return 1497.00
  return 797.00 // essencial/Pro
}

export type BillingCycle = 'mensal' | 'anual'

/** Normaliza qualquer valor recebido (URL, formulario, banco) pra 'mensal' ou 'anual',
 *  sempre caindo em 'mensal' como fallback seguro se vier vazio/invalido. */
export function normalizarBillingCycle(valor?: string | null): BillingCycle {
  return valor === 'anual' ? 'anual' : 'mensal'
}

/** Retorna o preco certo conforme o ciclo - centraliza a decisao mensal/anual num so lugar. */
export function obterPrecoPlanoPorCiclo(planoTipo?: string | null, billingCycle?: string | null): number {
  return normalizarBillingCycle(billingCycle) === 'anual' ? obterPrecoAnualPlano(planoTipo) : obterPrecoMensalPlano(planoTipo)
}

export function obterNomeCiclo(billingCycle?: string | null): string {
  return normalizarBillingCycle(billingCycle) === 'anual' ? 'Anual' : 'Mensal'
}

/** Percentual de economia do anual em relacao a pagar 12x o mensal - usado na landing. */
export function obterPercentualEconomiaAnual(planoTipo?: string | null): number {
  const mensal = obterPrecoMensalPlano(planoTipo)
  const anual = obterPrecoAnualPlano(planoTipo)
  if (mensal <= 0 || anual <= 0) return 0
  const precoMensalX12 = mensal * 12
  return Math.round((1 - anual / precoMensalX12) * 100)
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
  if (p === 'loja') return 'MiniPage Pro - Plano MiniPage Loja'
  if (p === 'equipe') return 'MiniPage Pro - Plano MiniPage Equipe'
  return 'MiniPage Pro - Plano MiniPage Pro'
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

// ===================================================================
// Limites de recursos da propria pagina (Destaques, Links, Videos,
// Agenda/Eventos) - o Free e uma AMOSTRA limitada, nao um plano funcional
// completo. A partir do MiniPage, esses recursos ficam liberados (uso
// pratico ilimitado - Infinity).
// ===================================================================

/** Quantos links rapidos o plano permite. Free precisa ser uma pagina basica USAVEL (nao so
 *  uma demonstracao travada) pra competir com ferramentas tipo Linktree - por isso 5, nao 2. */
export function obterLimiteLinksRapidos(planoTipo?: string | null): number {
  return normalizarPlano(planoTipo) === 'free' ? 5 : Infinity
}
export function permiteLinksRapidos(planoTipo?: string | null): boolean {
  return obterLimiteLinksRapidos(planoTipo) > 0
}

/** Quantos destaques o plano permite. Free bloqueado (0) - opcao mais segura, evita a
 *  ambiguidade de um limite de "1" (o que fazer se ja existir mais de 1 numa conta antiga?). */
export function obterLimiteDestaques(planoTipo?: string | null): number {
  return normalizarPlano(planoTipo) === 'free' ? 0 : Infinity
}
export function permiteDestaques(planoTipo?: string | null): boolean {
  return obterLimiteDestaques(planoTipo) > 0
}

/** Quantos videos em destaque o plano permite. Free bloqueado (0). */
export function obterLimiteVideos(planoTipo?: string | null): number {
  return normalizarPlano(planoTipo) === 'free' ? 0 : Infinity
}
export function permiteVideos(planoTipo?: string | null): boolean {
  return obterLimiteVideos(planoTipo) > 0
}

/** Quantos eventos de Agenda/Eventos (secao da propria pagina, nao a agenda de atendimento
 *  completa) o plano permite. Free bloqueado (0). */
export function obterLimiteAgendaEventos(planoTipo?: string | null): number {
  return normalizarPlano(planoTipo) === 'free' ? 0 : Infinity
}
export function permiteAgendaEventos(planoTipo?: string | null): boolean {
  return obterLimiteAgendaEventos(planoTipo) > 0
}

/** Quantos modelos de cor (tema visual da pagina publica) o plano permite escolher.
 *  Free ve so os 6 primeiros (amostra); demais planos tem os 18 completos. */
export function obterLimiteModelosCor(planoTipo?: string | null): number {
  return normalizarPlano(planoTipo) === 'free' ? 6 : Infinity
}
export function permiteTodosModelosDeCor(planoTipo?: string | null): boolean {
  return obterLimiteModelosCor(planoTipo) >= 18
}

// ===================================================================
// ETAPA 2 - preparacao do novo status_acesso 'aguardando_pagamento'
// ===================================================================
// So ADICIONA reconhecimento do novo valor - nao muda nenhum comportamento de bloqueio
// ainda (isso fica pra uma proxima etapa). Contas antigas com status nulo/desconhecido
// continuam caindo no mesmo fallback seguro de sempre ('ativo'), sem bloquear ninguem.
//
// Valores conhecidos hoje: 'ativo' (default/fallback), 'em_atraso' (setado pelo webhook e
// pelo PainelLayoutClient quando o trial vence sem plano ativo). 'bloqueado' e 'cancelado'
// existem no STATUS_LABEL da tela Meu Plano por precaucao, mas nenhum codigo atual chega a
// gravar esses 2 valores no banco ainda. 'aguardando_pagamento' e o valor NOVO desta etapa -
// ainda nao e gravado por nenhum codigo, so reconhecido pelas funcoes abaixo.
export type StatusAcesso = 'ativo' | 'em_atraso' | 'bloqueado' | 'cancelado' | 'aguardando_pagamento'

/** true apenas quando o status for exatamente 'aguardando_pagamento'. */
export function ehAguardandoPagamento(status?: string | null): boolean {
  return status === 'aguardando_pagamento'
}

/**
 * true quando o status permite acesso completo ao painel. Mantem o MESMO comportamento
 * de hoje: qualquer coisa que NAO seja 'em_atraso', 'bloqueado' ou 'aguardando_pagamento'
 * libera acesso completo - inclusive nulo/desconhecido (fallback seguro, igual ja acontece
 * hoje com `status_acesso || 'ativo'` no PainelLayoutClient). Esta funcao ainda NAO e usada
 * pra bloquear ninguem nesta etapa - so fica pronta pra proxima etapa a utilizar.
 */
export function statusPermiteAcessoCompleto(status?: string | null): boolean {
  return status !== 'em_atraso' && status !== 'bloqueado' && status !== 'aguardando_pagamento'
}

/** true quando o status indica que falta finalizar o checkout no Mercado Pago. */
export function statusPrecisaFinalizarCheckout(status?: string | null): boolean {
  return ehAguardandoPagamento(status)
}

