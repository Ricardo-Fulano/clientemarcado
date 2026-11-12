
/**
 * MiniPage Pro — Recuperacao de plano apos inadimplencia.
 *
 * Modulo de validacao pura:
 * - Nao consulta o Supabase.
 * - Nao consulta o Asaas.
 * - Nao altera pagamentos, planos ou comissoes.
 *
 * O pagamento precisa ser confirmado diretamente
 * no Asaas pelo processamento seguro do servidor.
 */

export const PLANOS_PAGOS_RECUPERAVEIS = [
  'minipage',
  'agenda',
  'loja',
  'essencial',
  'equipe',
] as const

export type PlanoPagoRecuperavel =
  typeof PLANOS_PAGOS_RECUPERAVEIS[number]

export type DadosRecuperacaoPlano = {
  modalidadeAcesso: string | null
  planoAtual: string | null
  planoAnterior: string | null
  motivoDowngrade: string | null
  pagamentoOrigemDowngrade: string | null

  valorContratado: number | null
  valorPagamento: number | null

  pagamentoId: string | null
  pagamentoStatus: string | null

  clientePagamentoCorresponde: boolean
  assinaturaPagamentoCorresponde: boolean
  pagamentoPosteriorAoUltimoAplicado: boolean
  pagamentoRegularizaPendencia: boolean
}

export type ResultadoRecuperacaoPlano =
  | {
      autorizado: true
      planoRestaurar: PlanoPagoRecuperavel
      valorValidado: number
      motivo: string
    }
  | {
      autorizado: false
      motivo: string
    }

const STATUS_PAGOS = [
  'CONFIRMED',
  'RECEIVED',
  'RECEIVED_IN_CASH',
]

function planoPagoValido(
  plano: string | null
): plano is PlanoPagoRecuperavel {
  return PLANOS_PAGOS_RECUPERAVEIS.some(
    (item) => item === plano
  )
}

/**
 * Avalia se um pagamento validado pode fundamentar
 * a restauracao de um plano anterior.
 *
 * ATENCAO:
 * Os campos booleanos representam verificacoes que
 * devem ser feitas por componentes confiaveis do
 * servidor. Este modulo nao comprova sozinho
 * que um pagamento regularizou a assinatura.
 *
 * O resultado nao substitui uma transacao atomica
 * no banco nem a idempotencia do webhook.
 */
export function avaliarRecuperacaoPlano(
  dados: DadosRecuperacaoPlano
): ResultadoRecuperacaoPlano {
  const recusar = (
    motivo: string
  ): ResultadoRecuperacaoPlano => ({
    autorizado: false,
    motivo,
  })

  if (dados.modalidadeAcesso !== 'comercial') {
    return recusar('Conta nao comercial')
  }

  if (dados.planoAtual !== 'free') {
    return recusar('Conta nao esta no plano Free')
  }

  if (!planoPagoValido(dados.planoAnterior)) {
    return recusar('Plano anterior invalido')
  }

  if (dados.motivoDowngrade !== 'inadimplencia') {
    return recusar('Downgrade nao foi por inadimplencia')
  }

  if (!dados.pagamentoOrigemDowngrade) {
    return recusar('Cobranca de origem nao identificada')
  }

  if (!dados.pagamentoId) {
    return recusar('Pagamento sem identificador')
  }

  if (!STATUS_PAGOS.includes(dados.pagamentoStatus || '')) {
    return recusar('Pagamento nao confirmado')
  }

  if (!dados.clientePagamentoCorresponde) {
    return recusar('Pagamento pertence a outro cliente')
  }

  if (!dados.assinaturaPagamentoCorresponde) {
    return recusar('Pagamento pertence a outra assinatura')
  }

  if (!dados.pagamentoPosteriorAoUltimoAplicado) {
    return recusar('Pagamento antigo ou ja aplicado')
  }

  if (!dados.pagamentoRegularizaPendencia) {
    return recusar('Pagamento nao regulariza a pendencia')
  }

  const contratado = dados.valorContratado
  const pago = dados.valorPagamento

  if (
    typeof contratado !== 'number' ||
    !Number.isFinite(contratado) ||
    contratado <= 0
  ) {
    return recusar('Valor contratado ausente ou invalido')
  }

  if (
    typeof pago !== 'number' ||
    !Number.isFinite(pago) ||
    pago <= 0
  ) {
    return recusar('Valor do pagamento invalido')
  }

  // Compara em centavos para evitar problemas
  // de ponto flutuante com valores monetarios.
  const contratadoCentavos = Math.round(contratado * 100)
  const pagoCentavos = Math.round(pago * 100)

  if (contratadoCentavos !== pagoCentavos) {
    return recusar('Valor pago diferente do contratado')
  }

  return {
    autorizado: true,
    planoRestaurar: dados.planoAnterior,
    valorValidado: contratadoCentavos / 100,
    motivo: 'Recuperacao candidata; exige aplicacao atomica',
  }
}
