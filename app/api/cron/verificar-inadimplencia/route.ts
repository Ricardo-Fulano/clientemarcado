import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { avaliarAmbienteAsaas } from '../../../lib/asaas-ambiente'
import {
  avaliarElegibilidadeDowngrade,
  cincoDiasCompletos,
} from '../../../lib/inadimplencia'
import {
  listarCobrancasAssinatura,
} from '../../../lib/cobrancas-asaas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Assinatura = {
  id?: string
  customer?: string
  externalReference?: string
  status?: string
  deleted?: boolean
  value?: number
  cycle?: string
}

const STATUS_PAGOS = [
  'CONFIRMED',
  'RECEIVED',
  'RECEIVED_IN_CASH',
]

const STATUS_PENDENTES = [
  'PENDING',
  'OVERDUE',
]

function statusFinanceiroConhecido(
  status: string | undefined
): boolean {
  return (
    STATUS_PAGOS.includes(status || '') ||
    STATUS_PENDENTES.includes(status || '')
  )
}

/**
 * Rotina de verificacao de inadimplencia.
 *
 * IMPORTANTE:
 * - Simula por padrao.
 * - Execucao exige ASAAS_DOWNGRADE_AUTOMATICO_ENABLED=true.
 * - Reconsulta o Asaas imediatamente antes da RPC.
 * - Nao modifica assinaturas nem cobrancas Asaas.
 *
 * A elegibilidade retornada e preliminar.
 */
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET

  if (!segredo) {
    return NextResponse.json(
      { error: 'Rotina nao configurada.' },
      { status: 503 }
    )
  }

  if (
    request.headers.get('authorization') !==
    `Bearer ${segredo}`
  ) {
    return NextResponse.json(
      { error: 'Nao autorizado.' },
      { status: 401 }
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !chave) {
    return NextResponse.json(
      { error: 'Supabase nao configurado.' },
      { status: 503 }
    )
  }

  const ambiente = avaliarAmbienteAsaas(
    process.env as Record<string, string | undefined>
  )

  if (!ambiente.ok) {
    return NextResponse.json(
      { error: 'Ambiente do Asaas invalido.' },
      { status: 503 }
    )
  }

  const baseUrlAsaas = ambiente.baseUrl

  /**
   * Consulta autenticada ao Asaas.
   *
   * Esta funcao tambem sera usada pelo modulo
   * de paginacao, que percorre as paginas da
   * assinatura sem alterar dados financeiros.
   */
  async function consultarAsaas(
    caminho: string
  ): Promise<any> {
    const resposta = await fetch(
      `${baseUrlAsaas}${caminho}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          access_token:
            process.env.ASAAS_API_KEY || '',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      }
    )

    if (!resposta.ok) {
      throw new Error(
        `Asaas respondeu HTTP ${resposta.status}`
      )
    }

    return resposta.json()
  }

  try {
    const supabase = createClient(url, chave, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: perfis, error } = await supabase
      .from('perfis')
      .select(
        'user_id, slug, plano_tipo, modalidade_acesso, status_acesso, gateway_customer_id, gateway_subscription_id, primeiro_pagamento_confirmado'
      )
      .eq('modalidade_acesso', 'comercial')
      .eq('gateway', 'asaas')

    if (error) {
      throw new Error(
        'Falha ao consultar perfis: ' +
        error.message
      )
    }

    const resultado = {
      ok: true,
      rotina: 'verificar-inadimplencia',
      modo: process.env.ASAAS_DOWNGRADE_AUTOMATICO_ENABLED === 'true' ? 'execucao_controlada' : 'simulacao',

      contasComerciaisAsaas:
        perfis?.length ?? 0,

      assinaturasConsultadas: 0,
      assinaturasAtivas: 0,

      cobrancasVencidas: 0,
      contasComPossivelAtraso: 0,

      contasSemPrimeiroPagamento: 0,
      primeirosPagamentosConciliados: 0,

      contasComHistoricoInconclusivo: 0,
      divergenciasFinanceiras: 0,

      candidatasPrimeiroPagamento: 0,
      candidatasRenovacao: 0,
      candidatasDowngrade: 0,

      contasNaoVerificadas: 0,

      // Novos indicadores da paginacao.
      paginasFinanceirasConsultadas: 0,
      cobrancasFinanceirasConsultadas: 0,

      valoresAssinaturas: [] as Array<{
        slug: string
        plano: string
        valorAsaas: number | null
        cicloAsaas: string | null
        statusAssinatura: string | null
      }>,

      downgradeExecutado: false,
      downgradesExecutados: 0,
      downgradesRecusadosNaRevalidacao: 0,
      falhasExecucaoDowngrade: 0,
    }

    const agora = Date.now()

    for (const perfil of perfis ?? []) {
      const subscriptionId =
        perfil.gateway_subscription_id

      const customerId =
        perfil.gateway_customer_id

      if (!subscriptionId || !customerId) {
        resultado.contasNaoVerificadas++
        continue
      }

      try {
        // 1. Confirmar a assinatura no Asaas.
        const assinatura = (await consultarAsaas(
          `/subscriptions/${encodeURIComponent(
            subscriptionId
          )}`
        )) as Assinatura

        if (
          assinatura.id !== subscriptionId ||
          assinatura.customer !== customerId ||
          assinatura.deleted === true ||
          (
            assinatura.externalReference &&
            assinatura.externalReference !==
              perfil.user_id
          )
        ) {
          resultado.contasNaoVerificadas++
          continue
        }

        resultado.assinaturasConsultadas++

        const assinaturaAtiva =
          assinatura.status === 'ACTIVE'

        if (assinaturaAtiva) {
          resultado.assinaturasAtivas++
        }

        // 2. Diagnosticar o valor atual.
        // Nao modifica o valor contratado.
        const valorBruto = Number(
          assinatura.value
        )

        const valorValido =
          assinatura.value !== undefined &&
          assinatura.value !== null &&
          Number.isFinite(valorBruto) &&
          valorBruto > 0

        resultado.valoresAssinaturas.push({
          slug: String(perfil.slug || ''),
          plano: String(perfil.plano_tipo || ''),
          valorAsaas: valorValido
            ? Math.round(valorBruto * 100) / 100
            : null,
          cicloAsaas:
            assinatura.cycle ?? null,
          statusAssinatura:
            assinatura.status ?? null,
        })

        // 3. Consultar TODAS as paginas das
        // cobrancas da assinatura.
        const historico =
          await listarCobrancasAssinatura(
            consultarAsaas,
            subscriptionId,
            customerId
          )

        resultado.paginasFinanceirasConsultadas +=
          historico.paginasConsultadas

        if (!historico.ok) {
          resultado.contasComHistoricoInconclusivo++

          console.warn(
            '[Cron inadimplencia] Historico inconclusivo:',
            {
              slug: perfil.slug,
              motivo: historico.motivo,
            }
          )

          continue
        }

        const cobrancas = historico.cobrancas

        resultado.cobrancasFinanceirasConsultadas +=
          cobrancas.length

        // 4. Verificar os estados financeiros e
        // a presenca de datas de vencimento.
        //
        // Qualquer status desconhecido torna
        // a conciliacao inconclusiva.
        const historicoValido =
          cobrancas.every(
            (cobranca) =>
              statusFinanceiroConhecido(
                cobranca.status
              ) &&
              typeof cobranca.dueDate ===
                'string' &&
              /^\d{4}-\d{2}-\d{2}$/.test(
                cobranca.dueDate
              )
          )

        if (!historicoValido) {
          resultado.contasComHistoricoInconclusivo++
          continue
        }

        // 5. Identificar os pagamentos quitados.
        const pagamentos = cobrancas.filter(
          (cobranca) =>
            STATUS_PAGOS.includes(
              cobranca.status || ''
            )
        )

        const bancoConfirmaPrimeiroPagamento =
          perfil.primeiro_pagamento_confirmado ===
          true

        if (
          !bancoConfirmaPrimeiroPagamento &&
          pagamentos.length > 0
        ) {
          resultado.divergenciasFinanceiras++
          continue
        }

        if (
          bancoConfirmaPrimeiroPagamento &&
          pagamentos.length === 0
        ) {
          resultado.contasComHistoricoInconclusivo++
          continue
        }

        // 6. Identificar TODAS as cobrancas
        // OVERDUE que completaram cinco dias.
        //
        // Nao ignorar uma cobranca anterior
        // apenas porque existe uma mensalidade
        // posterior que ja foi paga.
        const vencidas = cobrancas.filter(
          (cobranca) => {
            if (
              cobranca.status !== 'OVERDUE' ||
              !cobranca.dueDate
            ) {
              return false
            }

            return cincoDiasCompletos(
              cobranca.dueDate,
              agora
            )
          }
        )

        resultado.cobrancasVencidas +=
          vencidas.length

        if (vencidas.length > 0) {
          resultado.contasComPossivelAtraso++
        }

        const primeiroPagamentoPendente =
          !bancoConfirmaPrimeiroPagamento

        if (primeiroPagamentoPendente) {
          resultado.contasSemPrimeiroPagamento++
        }

        // Conciliacao preliminar.
        // Nao substitui uma verificacao
        // financeira final.
        const primeiroPagamentoConciliado =
          primeiroPagamentoPendente &&
          pagamentos.length === 0 &&
          historicoValido

        if (primeiroPagamentoConciliado) {
          resultado.primeirosPagamentosConciliados++
        }

        // 7. Contas Free nunca participam
        // de um novo downgrade.
        if (perfil.plano_tipo === 'free') {
          continue
        }

        // 8. Avaliar candidaturas.
        // Nunca executar downgrade aqui.
        const candidatas = vencidas.filter(
          (cobranca) => avaliarElegibilidadeDowngrade({
            modalidadeAcesso: perfil.modalidade_acesso,
            statusAcesso: perfil.status_acesso,
            primeiroPagamentoConfirmado: bancoConfirmaPrimeiroPagamento,
            primeiroPagamentoConciliado,
            assinaturaVerificada: true,
            assinaturaAtiva,
            cobrancaVerificada: true,
            cobrancaPertenceAssinatura: true,
            statusCobranca: cobranca.status ?? null,
            vencimento: cobranca.dueDate ?? null,
            agora,
          }).elegivel
        )

        if (candidatas.length > 0) {
          resultado.candidatasDowngrade++
          if (primeiroPagamentoPendente) {
            resultado.candidatasPrimeiroPagamento++
          } else {
            resultado.candidatasRenovacao++
          }
        }

        // Nunca executar sem habilitacao explicita.
        if (
          process.env.ASAAS_DOWNGRADE_AUTOMATICO_ENABLED !== 'true' ||
          candidatas.length === 0
        ) {
          continue
        }

        // Escolher uma cobranca vencida deterministica.
        const alvo = [...candidatas].sort(
          (a, b) => (a.dueDate || '').localeCompare(b.dueDate || '') ||
            a.id.localeCompare(b.id)
        )[0]

        // A segunda consulta diminui a janela de corrida, mas nao
        // substitui a protecao no banco e a reconciliacao do webhook.
        const assinaturaFinal = (await consultarAsaas(
          `/subscriptions/${encodeURIComponent(subscriptionId)}`
        )) as Assinatura
        if (
          assinaturaFinal.id !== subscriptionId ||
          assinaturaFinal.customer !== customerId ||
          assinaturaFinal.deleted === true ||
          assinaturaFinal.status !== 'ACTIVE' ||
          (assinaturaFinal.externalReference &&
            assinaturaFinal.externalReference !== perfil.user_id)
        ) {
          resultado.downgradesRecusadosNaRevalidacao++
          continue
        }

        const revisao = await listarCobrancasAssinatura(
          consultarAsaas,
          subscriptionId,
          customerId
        )
        if (!revisao.ok || revisao.cobrancas.some(
          (c) => !statusFinanceiroConhecido(c.status) ||
            !c.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(c.dueDate)
        )) {
          resultado.downgradesRecusadosNaRevalidacao++
          continue
        }

        const pagamentoFinal = revisao.cobrancas.find(
          (c) => c.id === alvo.id
        )
        if (
          !pagamentoFinal ||
          pagamentoFinal.status !== 'OVERDUE' ||
          pagamentoFinal.dueDate !== alvo.dueDate ||
          !cincoDiasCompletos(alvo.dueDate!, Date.now()) ||
          // Conservador: recusar mensalidades posteriores pagas.
          revisao.cobrancas.some(
            (c) => STATUS_PAGOS.includes(c.status || '') &&
              (c.dueDate || '') >= alvo.dueDate!
          ) ||
          // PENDING com data ja vencida tambem exige conciliacao.
          revisao.cobrancas.some(
            (c) => c.status === 'PENDING' &&
              (c.dueDate || '') < new Date().toLocaleDateString('en-CA', {
                timeZone: 'America/Sao_Paulo', year: 'numeric',
                month: '2-digit', day: '2-digit',
              })
          )
        ) {
          resultado.downgradesRecusadosNaRevalidacao++
          continue
        }

        // Leitura final do perfil; a RPC confere novamente o estado
        // de modo atomico ao fazer UPDATE condicional.
        const { data: perfilFinal, error: erroPerfilFinal } = await supabase
          .from('perfis')
          .select('plano_tipo, status_acesso, gateway_subscription_id, primeiro_pagamento_confirmado')
          .eq('user_id', perfil.user_id)
          .maybeSingle()
        if (
          erroPerfilFinal || !perfilFinal ||
          perfilFinal.plano_tipo !== perfil.plano_tipo ||
          perfilFinal.status_acesso !== perfil.status_acesso ||
          perfilFinal.gateway_subscription_id !== subscriptionId ||
          perfilFinal.primeiro_pagamento_confirmado !== bancoConfirmaPrimeiroPagamento
        ) {
          resultado.downgradesRecusadosNaRevalidacao++
          continue
        }

        const { data: aplicado, error: erroDowngrade } = await supabase.rpc(
          'aplicar_downgrade_inadimplencia', {
            p_user_id: perfil.user_id,
            p_plano_esperado: perfil.plano_tipo,
            p_subscription_id: subscriptionId,
            p_payment_id: alvo.id,
            p_vencimento: alvo.dueDate,
          }
        )
        if (erroDowngrade || aplicado !== true) {
          resultado.falhasExecucaoDowngrade++
          console.error('[Cron inadimplencia] RPC nao confirmou downgrade:',
            erroDowngrade?.message || 'false')
          continue
        }
        resultado.downgradesExecutados++
        resultado.downgradeExecutado = true

      } catch (erro) {
        resultado.contasNaoVerificadas++

        console.error(
          '[Cron inadimplencia] Falha na consulta:',
          erro instanceof Error
            ? erro.message
            : 'Erro desconhecido'
        )
      }
    }

    return NextResponse.json(resultado, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (erro) {
    console.error(
      '[Cron inadimplencia] Erro geral:',
      erro instanceof Error
        ? erro.message
        : 'Erro desconhecido'
    )

    return NextResponse.json(
      { error: 'Falha na verificacao.' },
      { status: 500 }
    )
  }
}
