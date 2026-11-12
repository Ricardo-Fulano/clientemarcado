
/**
 * MiniPage Pro - Verificacao de regularizacao no Asaas.
 *
 * Modulo puro de analise financeira.
 *
 * NAO realiza requisicoes ao Asaas.
 * NAO altera o Supabase.
 * NAO restaura planos.
 * NAO registra comissoes.
 *
 * A restauracao depende de verificacoes adicionais
 * no servidor e de uma operacao protegida no banco.
 */

export type CobrancaRegularizacao = {
  id?: string | null
  customer?: string | null
  subscription?: string | null
  status?: string | null
  dueDate?: string | null
  deleted?: boolean | null
}

export type DadosRegularizacaoAsaas = {
  subscriptionId: string
  customerId: string
  pagamentoConfirmadoId: string
  cobrancas: CobrancaRegularizacao[]
  historicoCompleto: boolean

  /**
   * Instante de referencia em milissegundos.
   * Opcional para permitir testes deterministas.
   */
  agora?: number
}

export type ResultadoRegularizacaoAsaas = {
  regularizada: boolean
  motivo: string
  cobrancasVerificadas: number
  cobrancasVencidas: number
  pagamentosConfirmados: number
}

const STATUS_PAGOS = new Set([
  'CONFIRMED',
  'RECEIVED',
  'RECEIVED_IN_CASH',
])

const STATUS_PENDENTES = new Set([
  'PENDING',
  'OVERDUE',
  'AWAITING_RISK_ANALYSIS',
  'DUNNING_REQUESTED',
  'REFUND_REQUESTED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'CHARGEBACK_REQUESTED',
  'CHARGEBACK_DISPUTE',
  'AWAITING_CHARGEBACK_REVERSAL',
  'DUNNING_RECEIVED',
  'CANCELED',
])

function textoValido(
  valor: unknown
): valor is string {
  return (
    typeof valor === 'string' &&
    valor.trim().length > 0
  )
}

function dataCivilValida(
  valor: unknown
): valor is string {
  if (
    typeof valor !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
    return false
  }

  const [ano, mes, dia] =
    valor.split('-').map(Number)

  const data = new Date(0)
  data.setUTCFullYear(ano, mes - 1, dia)
  data.setUTCHours(0, 0, 0, 0)

  return (
    ano >= 1000 &&
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  )
}

function dataAtualBrasilia(
  agora: number
): string | null {
  if (!Number.isFinite(agora)) {
    return null
  }

  const data = new Date(agora)

  if (Number.isNaN(data.getTime())) {
    return null
  }

  const partes = new Intl.DateTimeFormat(
    'en-US',
    {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }
  ).formatToParts(data)

  const obter = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)
      ?.value

  const ano = obter('year')
  const mes = obter('month')
  const dia = obter('day')

  if (!ano || !mes || !dia) {
    return null
  }

  return `${ano}-${mes}-${dia}`
}

/**
 * Verifica se o historico informado permite
 * considerar uma assinatura regularizada.
 *
 * A funcao adota uma regra conservadora:
 * qualquer obrigacao vencida sem quitacao
 * comprovada impede a recuperacao.
 *
 * Uma mensalidade futura PENDING e permitida.
 * Outros estados nao pagos exigem conciliacao
 * financeira antes da recuperacao.
 *
 * IMPORTANTE: resultado positivo nao executa
 * restauracao nem substitui verificacao atual
 * no Asaas, valor contratado, assinatura ACTIVE
 * e controle de concorrencia no banco.
 */
export function avaliarRegularizacaoAsaas(
  dados: DadosRegularizacaoAsaas
): ResultadoRegularizacaoAsaas {
  let verificadas = 0
  let vencidas = 0
  let pagas = 0

  const recusar = (
    motivo: string
  ): ResultadoRegularizacaoAsaas => ({
    regularizada: false,
    motivo,
    cobrancasVerificadas: verificadas,
    cobrancasVencidas: vencidas,
    pagamentosConfirmados: pagas,
  })

  if (
    !textoValido(dados.subscriptionId) ||
    !textoValido(dados.customerId) ||
    !textoValido(dados.pagamentoConfirmadoId)
  ) {
    return recusar(
      'Identificadores financeiros incompletos'
    )
  }

  if (dados.historicoCompleto !== true) {
    return recusar(
      'Historico financeiro incompleto ou inconclusivo'
    )
  }

  if (
    !Array.isArray(dados.cobrancas) ||
    dados.cobrancas.length === 0
  ) {
    return recusar(
      'Nenhuma cobranca disponivel para conciliacao'
    )
  }

  const hoje = dataAtualBrasilia(
    dados.agora ?? Date.now()
  )

  if (!hoje) {
    return recusar(
      'Instante de conciliacao invalido'
    )
  }

  const idsEncontrados = new Set<string>()
  let pagamentoAlvoConfirmado = false

  for (const cobranca of dados.cobrancas) {
    if (
      !cobranca ||
      typeof cobranca !== 'object'
    ) {
      return recusar(
        'Cobranca com formato invalido'
      )
    }

    if (
      !textoValido(cobranca.id) ||
      !textoValido(cobranca.customer) ||
      !textoValido(cobranca.subscription) ||
      !textoValido(cobranca.status) ||
      !dataCivilValida(cobranca.dueDate)
    ) {
      return recusar(
        'Cobranca com dados obrigatorios ou vencimento invalidos'
      )
    }

    if (idsEncontrados.has(cobranca.id)) {
      return recusar(
        'Cobranca duplicada no historico consultado'
      )
    }

    idsEncontrados.add(cobranca.id)

    if (
      cobranca.customer !== dados.customerId ||
      cobranca.subscription !== dados.subscriptionId
    ) {
      return recusar(
        'Historico contem cobranca de outro cliente ou assinatura'
      )
    }

    if (cobranca.deleted === true) {
      return recusar(
        'Historico contem cobranca excluida; conciliacao necessaria'
      )
    }

    const status = cobranca.status

    if (
      !STATUS_PAGOS.has(status) &&
      !STATUS_PENDENTES.has(status)
    ) {
      return recusar(
        `Status financeiro desconhecido: ${status}`
      )
    }

    verificadas++

    if (STATUS_PAGOS.has(status)) {
      pagas++
    }

    if (
      cobranca.id ===
      dados.pagamentoConfirmadoId
    ) {
      if (!STATUS_PAGOS.has(status)) {
        return recusar(
          'Pagamento informado ainda nao esta quitado'
        )
      }

      pagamentoAlvoConfirmado = true
    }

    if (status === 'OVERDUE') {
      vencidas++
    }

    if (
      status === 'PENDING' &&
      cobranca.dueDate <= hoje
    ) {
      vencidas++

      return recusar(
        'Existe cobranca pendente com vencimento atingido'
      )
    }

    if (
      !STATUS_PAGOS.has(status) &&
      status !== 'PENDING' &&
      status !== 'OVERDUE'
    ) {
      return recusar(
        `Cobranca sem quitacao comprovada: ${status}`
      )
    }
  }

  if (!pagamentoAlvoConfirmado) {
    return recusar(
      'Pagamento confirmado nao localizado no historico'
    )
  }

  if (vencidas > 0) {
    return recusar(
      'Ainda existem cobrancas vencidas na assinatura'
    )
  }

  return {
    regularizada: true,
    motivo:
      'Historico fornecido sem pendencias exigiveis; exige validacao final no servidor',
    cobrancasVerificadas: verificadas,
    cobrancasVencidas: vencidas,
    pagamentosConfirmados: pagas,
  }
}
