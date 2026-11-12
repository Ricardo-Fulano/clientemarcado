
import { NextResponse } from 'next/server'
import type { createClient } from '@supabase/supabase-js'
import { avaliarAmbienteAsaas } from './asaas-ambiente'
import {
  conferirPagamento,
  registrarComissaoParceiro,
} from './asaas-webhook'


/**
 * MiniPage Pro
 * Reprocessamento de comissoes apos recuperacao.
 *
 * DESATIVADO POR PADRAO.
 *
 * Protecoes:
 * - Exige CRON_SECRET.
 * - Exige flag explicita de ativacao.
 * - Reserva uma pendencia atomicamente no Supabase.
 * - Confirma historico, perfil e pagamento Asaas.
 * - Reutiliza conferirPagamento do webhook.
 * - Reutiliza registrarComissaoParceiro.
 * - Confirma a comissao no banco antes de concluir.
 * - Finaliza somente com a reivindicacao correta.
 *
 * Nao faz pagamentos PIX.
 * Nao altera planos ou assinaturas.
 */

const PLANOS_COMISSIONAVEIS = new Set([
  'minipage',
  'loja',
  'essencial',
  'equipe',
])

type PendenciaReservada = {
  pagamento_id: string
  user_id: string
  plano_restaurado: string
  valor_contratado: number
  reivindicacao_id: string
}

function centavos(valor: unknown): number | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return null
  }

  const numero = Number(valor)

  if (!Number.isFinite(numero) || numero <= 0) {
    return null
  }

  return Math.round(numero * 100)
}

function textoValido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0
}

export type DependenciasReprocessamento = {
  env: Record<string, string | undefined>
  criarCliente: typeof createClient
  fetchFn: typeof fetch
  conferirPagamentoFn: typeof conferirPagamento
  registrarComissaoFn: typeof registrarComissaoParceiro
}

/** Executa com dependencias explicitas para permitir testes sem rede. */
export async function processarComissoesRecuperacao(
  request: Request,
  dependencias: DependenciasReprocessamento
) {
  const { env, criarCliente, fetchFn, conferirPagamentoFn, registrarComissaoFn } = dependencias
  if (
    env.ASAAS_REPROCESSAMENTO_COMISSOES_ENABLED
      !== 'true'
  ) {
    return NextResponse.json(
      { error: 'Reprocessamento desativado.' },
      { status: 503 }
    )
  }

  const segredo = env.CRON_SECRET

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

  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const chave = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !chave) {
    return NextResponse.json(
      { error: 'Supabase nao configurado.' },
      { status: 503 }
    )
  }

  const ambiente = avaliarAmbienteAsaas(
    env
  )

  if (!ambiente.ok) {
    return NextResponse.json(
      { error: 'Ambiente Asaas invalido.' },
      { status: 503 }
    )
  }

  const supabase = criarCliente(url, chave, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  async function finalizar(
    pendencia: PendenciaReservada,
    status: 'concluida' | 'sem_comissao' | 'erro',
    motivo: string | null
  ): Promise<void> {
    const agora = new Date().toISOString()
    const resolvida =
      status === 'concluida' ||
      status === 'sem_comissao'

    const { data, error } = await supabase
      .from('conciliacoes_comissao_recuperacao')
      .update({
        status,
        ultimo_erro: motivo,
        atualizado_em: agora,
        resolvido_em: resolvida ? agora : null,
        reivindicacao_id: null,
        reivindicado_em: null,
      })
      .eq('pagamento_id', pendencia.pagamento_id)
      .eq('reivindicacao_id', pendencia.reivindicacao_id)
      .eq('status', 'processando')
      .select('pagamento_id')

    if (error) {
      throw new Error(
        'Falha ao finalizar conciliacao: ' + error.message
      )
    }

    if (!data || data.length !== 1) {
      throw new Error(
        'Reivindicacao nao corresponde ao registro atual'
      )
    }
  }

  async function comissaoRegistrada(
    pendencia: PendenciaReservada
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('comissoes_parceiros')
      .select('id, user_id, plano_tipo, valor_pago, status')
      .eq('asaas_payment_id', pendencia.pagamento_id)
      .limit(2)

    if (error) {
      throw new Error(
        'Falha ao consultar comissao: ' + error.message
      )
    }

    if ((data ?? []).length > 1) {
      throw new Error(
        'Mais de uma comissao para o mesmo pagamento'
      )
    }

    const comissao = data?.[0]

    if (!comissao) {
      return false
    }

    if (
      comissao.user_id !== pendencia.user_id ||
      comissao.plano_tipo !== pendencia.plano_restaurado ||
      centavos(comissao.valor_pago) !==
        centavos(pendencia.valor_contratado) ||
      comissao.status === 'estornada'
    ) {
      throw new Error(
        'Comissao existente apresenta divergencia'
      )
    }

    return true
  }

  try {
    const { data: reservadas, error: erroReserva } =
      await supabase.rpc(
        'reivindicar_comissoes_recuperacao',
        { p_limite: 1 }
      )

    if (erroReserva) {
      throw new Error(
        'Falha ao reservar pendencia: ' +
        erroReserva.message
      )
    }

    if (
      !Array.isArray(reservadas) ||
      reservadas.length > 1
    ) {
      throw new Error(
        'Resposta de reserva financeira invalida'
      )
    }

    const resultado = {
      ok: true,
      pendenciasReservadas: reservadas.length,
      comissoesConfirmadas: 0,
      semComissao: 0,
      pendenciasComErro: 0,
      pagamentosExecutados: 0,
      planosAlterados: 0,
    }

    for (const linha of reservadas) {
      const pendencia = linha as PendenciaReservada

      try {
        if (
          !textoValido(pendencia.pagamento_id) ||
          !textoValido(pendencia.user_id) ||
          !textoValido(pendencia.reivindicacao_id) ||
          !textoValido(pendencia.plano_restaurado) ||
          centavos(pendencia.valor_contratado) === null
        ) {
          throw new Error('Reserva retornou dados financeiros invalidos')
        }

        // 1. Comprovar a recuperacao registrada.
        const { data: historico, error: erroHistorico } =
          await supabase
            .from('historico_recuperacoes_inadimplencia')
            .select(
              'user_id, plano_restaurado, gateway_subscription_id, valor_contratado'
            )
            .eq(
              'pagamento_regularizacao',
              pendencia.pagamento_id
            )
            .maybeSingle()

        if (erroHistorico || !historico) {
          throw new Error(
            'Historico de recuperacao indisponivel'
          )
        }

        if (
          historico.user_id !== pendencia.user_id ||
          historico.plano_restaurado !==
            pendencia.plano_restaurado ||
          !textoValido(historico.gateway_subscription_id) ||
          centavos(historico.valor_contratado) !==
            centavos(pendencia.valor_contratado)
        ) {
          throw new Error(
            'Divergencia entre historico e fila'
          )
        }

        // 2. Comprovar identidade e contrato.
        const { data: perfil, error: erroPerfil } =
          await supabase
            .from('perfis')
            .select(
              'user_id, gateway, gateway_customer_id, gateway_subscription_id, billing_cycle, valor_contratado'
            )
            .eq('user_id', pendencia.user_id)
            .maybeSingle()

        if (
          erroPerfil ||
          !perfil ||
          perfil.user_id !== pendencia.user_id ||
          perfil.gateway !== 'asaas' ||
          !textoValido(perfil.gateway_customer_id) ||
          perfil.gateway_subscription_id !==
            historico.gateway_subscription_id
        ) {
          throw new Error(
            'Identidade financeira do perfil inconclusiva'
          )
        }

        // Recuperacao automatica atualmente
        // utiliza assinatura recorrente mensal.
        // Ciclo desconhecido nao recebe fallback.
        if (perfil.billing_cycle !== 'mensal') {
          throw new Error(
            'Ciclo de cobranca nao elegivel para reprocessamento'
          )
        }

        if (
          centavos(perfil.valor_contratado) !==
          centavos(pendencia.valor_contratado)
        ) {
          throw new Error(
            'Valor contratado diverge do historico'
          )
        }

        // 3. Consultar o pagamento no Asaas.
        const resposta = await fetchFn(
          `${ambiente.baseUrl}/payments/${encodeURIComponent(
            pendencia.pagamento_id
          )}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              access_token: env.ASAAS_API_KEY || '',
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(12000),
          }
        )

        if (!resposta.ok) {
          throw new Error(
            `Consulta Asaas HTTP ${resposta.status}`
          )
        }

        const pagamento: unknown = await resposta.json()

        if (
          !pagamento ||
          typeof pagamento !== 'object' ||
          Array.isArray(pagamento)
        ) {
          throw new Error(
            'Resposta de pagamento Asaas invalida'
          )
        }

        const pg = pagamento as Record<string, any>

        if (
          pg.id !== pendencia.pagamento_id ||
          pg.deleted === true
        ) {
          throw new Error(
            'Identificador ou estado do pagamento invalido'
          )
        }

        // Reutilizar a mesma validacao central
        // do webhook para titularidade,
        // assinatura, status e valor contratado.
        const motivoPagamento = conferirPagamentoFn(pg, {
          ...perfil,
          plano_tipo: pendencia.plano_restaurado,
        })

        if (motivoPagamento) {
          throw new Error(
            'Pagamento recusado: ' + motivoPagamento
          )
        }

        // 4. Se a comissao ja existe, nao repetir.
        if (await comissaoRegistrada(pendencia)) {
          await finalizar(pendencia, 'concluida', null)
          resultado.comissoesConfirmadas++
          continue
        }

        if (
          !PLANOS_COMISSIONAVEIS.has(
            pendencia.plano_restaurado
          )
        ) {
          throw new Error(
            'Plano exige revisao de elegibilidade'
          )
        }

        // 5. Consultar indicacao existente.
        const { data: usuario, error: erroUsuario } =
          await supabase.auth.admin.getUserById(
            pendencia.user_id
          )

        if (
          erroUsuario ||
          !textoValido(usuario?.user?.email)
        ) {
          throw new Error(
            'Email do cliente indisponivel'
          )
        }

        const email =
          usuario.user.email.trim().toLowerCase()

        const { data: indicacoes, error: erroIndicacoes } =
          await supabase
            .from('indicacoes_parceiros')
            .select('id, parceiro_id')
            .eq('email', email)
            .limit(2)

        if (erroIndicacoes) {
          throw new Error(
            'Falha ao consultar indicacoes'
          )
        }

        if (!indicacoes?.length) {
          await finalizar(pendencia, 'sem_comissao', null)
          resultado.semComissao++
          continue
        }

        if (indicacoes.length !== 1) {
          throw new Error(
            'Indicacoes ambiguas para o cliente'
          )
        }

        // 6. Preservar integralmente a regra
        // de comissao existente no webhook.
        await registrarComissaoFn(supabase, {
          userId: pendencia.user_id,
          planoTipo: pendencia.plano_restaurado,
          payment: pg,
          cicloCobranca: perfil.billing_cycle,
        })

        // 7. O helper pode apenas registrar
        // um erro no console. Portanto, confirmar
        // a comissao no banco e obrigatorio.
        if (!(await comissaoRegistrada(pendencia))) {
          throw new Error(
            'Comissao nao confirmada no banco'
          )
        }

        await finalizar(pendencia, 'concluida', null)
        resultado.comissoesConfirmadas++
      } catch (erro) {
        const motivo =
          erro instanceof Error
            ? erro.message.slice(0, 300)
            : 'Falha de conciliacao'

        resultado.pendenciasComErro++

        console.error(
          '[Reprocessamento comissoes] Falha:',
          motivo
        )

        try {
          await finalizar(pendencia, 'erro', motivo)
        } catch (erroRegistro) {
          console.error(
            '[Reprocessamento comissoes] Falha ao registrar estado:',
            erroRegistro instanceof Error
              ? erroRegistro.message
              : 'Erro desconhecido'
          )
          return NextResponse.json(
            { error: 'Falha ao registrar estado da pendencia. Reserva exige conciliacao.' },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json(resultado, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (erro) {
    console.error(
      '[Reprocessamento comissoes] Erro geral:',
      erro instanceof Error
        ? erro.message
        : 'Erro desconhecido'
    )

    return NextResponse.json(
      { error: 'Falha no reprocessamento.' },
      { status: 500 }
    )
  }
}
