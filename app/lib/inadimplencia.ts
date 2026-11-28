const DIA_MS = 86400000
export const DIA_DOWNGRADE = 8
export function diasCalendarioAtraso(vencimento:string, agora:number=Date.now()):number|null {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(vencimento)||!Number.isFinite(agora))return null
 const venc=Date.parse(vencimento+'T00:00:00Z')
 if(!Number.isFinite(venc)||new Date(venc).toISOString().slice(0,10)!==vencimento)return null
 const hoje=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(agora))
 const d=(Date.parse(hoje+'T00:00:00Z')-venc)/DIA_MS
 return Number.isFinite(d)?Math.max(0,d):null
}
export function oitavoDiaAtraso(vencimento:string, agora:number=Date.now()):boolean {
 const dias=diasCalendarioAtraso(vencimento,agora)
 return dias!==null&&dias>=DIA_DOWNGRADE
}
// Compatibilidade com imports antigos; novos chamadores usam o nome correto.
export const cincoDiasCompletos=oitavoDiaAtraso
export function dataBrasilia(iso:string):string|null {
 const ms=Date.parse(iso);if(!Number.isFinite(ms))return null
 return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ms))
}
/**
 * Tipos de pendencia que podem levar
 * uma conta comercial ao plano Free.
 */
export type TipoPendencia =
  | 'primeiro_pagamento'
  | 'renovacao'

/**
 * Dados necessarios para avaliar a candidatura
 * de uma conta ao downgrade.
 *
 * As informacoes financeiras devem ser obtidas
 * diretamente do Asaas e verificadas pelo servidor.
 */
export type DadosElegibilidadeDowngrade = {
  modalidadeAcesso: string | null
  statusAcesso: string | null

  primeiroPagamentoConfirmado: boolean

  assinaturaVerificada: boolean
  assinaturaAtiva: boolean

  cobrancaVerificada: boolean
  cobrancaPertenceAssinatura: boolean

  statusCobranca: string | null
  vencimento: string | null

  /**
   * Necessario exclusivamente quando o banco
   * informa que o primeiro pagamento nao ocorreu.
   *
   * true significa que a conciliacao financeira
   * verificou o historico relevante e confirmou
   * que nenhum pagamento inicial foi quitado.
   *
   * Na ausencia dessa confirmacao, nao autorizar
   * candidatura de primeiro pagamento.
   */
  primeiroPagamentoConciliado?: boolean

  agora?: number
}

export type ResultadoElegibilidadeDowngrade = {
  elegivel: boolean
  motivo: string
  tipoPendencia: TipoPendencia | null
}

/**
 * Avalia a candidatura ao downgrade.
 *
 * IMPORTANTE:
 * - Nao consulta o Asaas.
 * - Nao modifica o Supabase.
 * - Nao cancela assinaturas.
 * - Nao executa downgrade.
 *
 * elegivel=true indica apenas uma candidatura.
 * A alteracao real exige verificacoes adicionais:
 * - Confirmacao financeira atual no Asaas.
 * - Conferencia de todas as cobrancas relevantes.
 * - Validacao da assinatura e do valor contratado.
 * - Protecao contra pagamentos simultaneos.
 * - Controle da assinatura recorrente.
 */
export function avaliarElegibilidadeDowngrade(
  dados: DadosElegibilidadeDowngrade
): ResultadoElegibilidadeDowngrade {
  const recusar = (
    motivo: string
  ): ResultadoElegibilidadeDowngrade => ({
    elegivel: false,
    motivo,
    tipoPendencia: null,
  })

  // 1. Somente contas comerciais classificadas.
  if (dados.modalidadeAcesso !== 'comercial') {
    return recusar(
      'Conta nao comercial ou nao classificada'
    )
  }

  // 2. Diferenciar primeiro pagamento de renovacao.
  const primeiroPagamentoPendente =
    dados.primeiroPagamentoConfirmado !== true

  const tipoPendencia: TipoPendencia =
    primeiroPagamentoPendente
      ? 'primeiro_pagamento'
      : 'renovacao'

  // 3. Validar os estados de acesso.
  if (primeiroPagamentoPendente) {
    if (
      dados.statusAcesso !== 'aguardando_pagamento' &&
      dados.statusAcesso !== 'em_atraso'
    ) {
      return recusar(
        'Status nao permite avaliar primeiro pagamento'
      )
    }

    // O banco pode estar desatualizado.
    // Exigir conciliacao com o Asaas.
    if (dados.primeiroPagamentoConciliado !== true) {
      return recusar(
        'Primeiro pagamento exige conciliacao financeira'
      )
    }
  } else {
    if (dados.statusAcesso !== 'em_atraso') {
      return recusar(
        'Status de renovacao nao elegivel'
      )
    }
  }

  // 4. A assinatura precisa ser verificada.
  if (!dados.assinaturaVerificada) {
    return recusar(
      'Assinatura nao verificada no Asaas'
    )
  }

  // 5. Assinaturas inativas exigem outro tratamento.
  if (!dados.assinaturaAtiva) {
    return recusar(
      'Assinatura nao esta ativa no Asaas'
    )
  }

  // 6. A cobranca deve pertencer a assinatura atual.
  if (
    !dados.cobrancaVerificada ||
    !dados.cobrancaPertenceAssinatura
  ) {
    return recusar(
      'Cobranca nao verificada ou nao vinculada'
    )
  }

  // 7. Somente cobrancas efetivamente vencidas.
  if (dados.statusCobranca !== 'OVERDUE') {
    return recusar(
      'Cobranca nao esta vencida no Asaas'
    )
  }

  // 8. Verificar sete dias completos de atraso.
  if (
    !dados.vencimento ||
    !oitavoDiaAtraso(
      dados.vencimento,
      dados.agora
    )
  ) {
    return recusar(
      'Oitavo dia de atraso nao atingido'
    )
  }

  // 9. Resultado preliminar.
  return {
    elegivel: true,
    tipoPendencia,
    motivo:
      tipoPendencia === 'primeiro_pagamento'
        ? 'Primeiro pagamento vencido; requer validacao final'
        : 'Renovacao vencida; requer validacao final',
  }
}
