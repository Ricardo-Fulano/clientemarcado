
import {
  listarCobrancasAssinatura,
  type ConsultarAsaas,
} from './cobrancas-asaas'

import {
  avaliarRegularizacaoAsaas,
} from './regularizacao-asaas'

/**
 * MiniPage Pro - Conciliacao financeira para
 * recuperacao de plano apos inadimplencia.
 *
 * SOMENTE LEITURA:
 * - Consulta a assinatura no Asaas.
 * - Confirma o pagamento diretamente no Asaas.
 * - Consulta todas as paginas de cobrancas.
 * - Avalia pendencias financeiras.
 *
 * NAO altera o Supabase.
 * NAO restaura planos.
 * NAO registra comissoes.
 */

type RegistroAsaas = Record<string, unknown>

export type ResultadoConciliacaoRecuperacao =
  | {
      apta: true
      motivo: string
      pagamento: RegistroAsaas
      assinatura: RegistroAsaas
      cobrancasVerificadas: number
    }
  | {
      apta: false
      motivo: string
    }

const STATUS_PAGOS = new Set([
  'CONFIRMED',
  'RECEIVED',
  'RECEIVED_IN_CASH',
])

function registro(
  valor: unknown
): RegistroAsaas | null {
  if (
    !valor ||
    typeof valor !== 'object' ||
    Array.isArray(valor)
  ) {
    return null
  }

  return valor as RegistroAsaas
}

function identificador(
  valor: unknown
): valor is string {
  return (
    typeof valor === 'string' &&
    valor.trim().length > 0
  )
}

export async function conciliarRecuperacaoAsaas(
  consultarAsaas: ConsultarAsaas,
  subscriptionId: string,
  customerId: string,
  pagamentoId: string,
  agora: number = Date.now()
): Promise<ResultadoConciliacaoRecuperacao> {
  const recusar = (
    motivo: string
  ): ResultadoConciliacaoRecuperacao => ({
    apta: false,
    motivo,
  })

  if (
    !identificador(subscriptionId) ||
    !identificador(customerId) ||
    !identificador(pagamentoId)
  ) {
    return recusar(
      'Identificadores financeiros incompletos'
    )
  }

  if (!Number.isFinite(agora)) {
    return recusar(
      'Instante de conciliacao invalido'
    )
  }

  try {
    // 1. Confirmar a assinatura atual no Asaas.
    const assinatura = registro(
      await consultarAsaas(
        `/subscriptions/${encodeURIComponent(
          subscriptionId
        )}`
      )
    )

    if (
      !assinatura ||
      assinatura.id !== subscriptionId ||
      assinatura.customer !== customerId ||
      assinatura.status !== 'ACTIVE' ||
      assinatura.deleted === true
    ) {
      return recusar(
        'Assinatura nao confirmada como ativa'
      )
    }

    // 2. Conferir o pagamento individual.
    const pagamento = registro(
      await consultarAsaas(
        `/payments/${encodeURIComponent(
          pagamentoId
        )}`
      )
    )

    if (
      !pagamento ||
      pagamento.id !== pagamentoId ||
      pagamento.subscription !== subscriptionId ||
      pagamento.customer !== customerId ||
      pagamento.deleted === true ||
      !STATUS_PAGOS.has(
        String(pagamento.status || '')
      )
    ) {
      return recusar(
        'Pagamento nao confirmado para esta assinatura'
      )
    }

    // 3. Buscar todas as paginas das cobrancas.
    const historico =
      await listarCobrancasAssinatura(
        consultarAsaas,
        subscriptionId,
        customerId
      )

    if (!historico.ok) {
      return recusar(
        `Historico inconclusivo: ${historico.motivo}`
      )
    }

    // 4. Verificar todas as obrigacoes exigiveis.
    const regularizacao =
      avaliarRegularizacaoAsaas({
        subscriptionId,
        customerId,
        pagamentoConfirmadoId: pagamentoId,
        cobrancas: historico.cobrancas,
        historicoCompleto: true,
        agora,
      })

    if (!regularizacao.regularizada) {
      return recusar(
        regularizacao.motivo
      )
    }

    return {
      apta: true,
      motivo:
        'Conciliacao financeira preliminar concluida',
      pagamento,
      assinatura,
      cobrancasVerificadas:
        regularizacao.cobrancasVerificadas,
    }
  } catch {
    return recusar(
      'Falha na consulta financeira ao Asaas'
    )
  }
}
