
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  processarEventoAsaas,
} from '../app/lib/asaas-webhook.ts'

const USER = '00000000-0000-4000-8000-000000000001'
const SUB = 'sub_homologacao'
const CUS = 'cus_homologacao'
const PAY = 'pay_regularizacao'

function criarSimulacao({
  mensalidadeVencida = false,
} = {}) {
  const operacoes = []
  const consultas = []

  const perfil = {
    user_id: USER,
    plano_tipo: 'free',
    modalidade_acesso: 'comercial',
    status_acesso: 'ativo',
    billing_cycle: 'mensal',
    gateway_customer_id: CUS,
    gateway_subscription_id: SUB,
    motivo_downgrade: 'inadimplencia',
    plano_anterior_downgrade: 'essencial',
    pagamento_origem_downgrade: 'pay_origem',
    downgrade_em: '2026-10-01T12:00:00Z',
    valor_contratado: 79.90,
    primeiro_pagamento_confirmado: true,
    plano_ativo_ate: null,
  }

  const pagamento = {
    id: PAY,
    customer: CUS,
    subscription: SUB,
    status: 'RECEIVED',
    value: 79.90,
    dueDate: '2026-10-10',
    paymentDate: '2026-11-10',
    deleted: false,
  }

  const cobrancas = [pagamento]

  if (mensalidadeVencida) {
    cobrancas.push({
      ...pagamento,
      id: 'pay_pendente_antigo',
      status: 'OVERDUE',
      dueDate: '2026-09-10',
      paymentDate: null,
    })
  }

  function consulta(tabela) {
    let operacao = 'select'
    let valores = null

    const objeto = {
      select() {
        operacao = 'select'
        return objeto
      },
      update(dados) {
        operacao = 'update'
        valores = dados
        return objeto
      },
      eq() { return objeto },
      neq() { return objeto },
      in() { return objeto },
      is() { return objeto },
      order() { return objeto },
      limit() {
        return Promise.resolve(resultado())
      },
      then(resolve, reject) {
        return Promise.resolve(resultado()).then(
          resolve,
          reject
        )
      },
    }

    function resultado() {
      if (operacao === 'update') {
        operacoes.push({
          tipo: 'update',
          tabela,
          valores,
        })

        return {
          data: null,
          error: null,
        }
      }

      return {
        data: tabela === 'perfis'
          ? [perfil]
          : [],
        error: null,
      }
    }

    return objeto
  }

  const supabase = {
    from: consulta,

    async rpc(nome, parametros) {
      operacoes.push({
        tipo: 'rpc',
        nome,
        parametros,
      })

      if (nome === 'asaas_evento_reivindicar') {
        return {
          data: { acao: 'processar' },
          error: null,
        }
      }

      if (nome === 'restaurar_plano_apos_pagamento') {
        return {
          data: true,
          error: null,
        }
      }

      throw new Error(
        `RPC inesperada: ${nome}`
      )
    },

    auth: {
      admin: {
        async getUserById() {
          return {
            data: { user: { email: null } },
            error: null,
          }
        },
      },
    },
  }

  const fetchFn = async (url) => {
    const endereco = new URL(url)
    const caminho = endereco.pathname
    consultas.push(caminho)

    let dados

    if (caminho === `/v3/payments/${PAY}`) {
      dados = pagamento
    } else if (
      caminho === `/v3/subscriptions/${SUB}`
    ) {
      dados = {
        id: SUB,
        customer: CUS,
        status: 'ACTIVE',
        deleted: false,
      }
    } else if (
      caminho === '/v3/payments' &&
      endereco.searchParams.get('subscription') === SUB
    ) {
      dados = {
        data: cobrancas,
        hasMore: false,
        totalCount: cobrancas.length,
      }
    } else {
      throw new Error(
        `Consulta Asaas inesperada: ${caminho}`
      )
    }

    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify(dados)
      },
    }
  }

  const evento = {
    id: 'evt_homologacao',
    event: 'PAYMENT_RECEIVED',
    dateCreated: '2026-11-10T14:00:00Z',
    payment: pagamento,
  }

  return {
    operacoes,
    consultas,
    supabase,
    fetchFn,
    evento,
  }
}

async function executar(opcoes) {
  const simulacao = criarSimulacao(opcoes)

  const resposta = await processarEventoAsaas(
    {
      supabase: simulacao.supabase,
      env: {
        ASAAS_ENV: 'sandbox',
        ASAAS_API_KEY: 'chave_ficticia_para_teste',
        ASAAS_RECUPERACAO_AUTOMATICA_ENABLED: 'true',
      },
      fetchFn: simulacao.fetchFn,
    },
    simulacao.evento,
    JSON.stringify(simulacao.evento)
  )

  return {
    resposta,
    ...simulacao,
  }
}

function chamadasRestauracao(operacoes) {
  return operacoes.filter(
    (operacao) =>
      operacao.tipo === 'rpc' &&
      operacao.nome ===
        'restaurar_plano_apos_pagamento'
  )
}

test(
  'regularizacao completa solicita restauracao protegida',
  async () => {
    const resultado = await executar()

    assert.equal(resultado.resposta.status, 200)
    assert.equal(
      resultado.resposta.body.resultado,
      'plano_restaurado'
    )

    const chamadas = chamadasRestauracao(
      resultado.operacoes
    )

    assert.equal(chamadas.length, 1)

    assert.equal(
      chamadas[0].parametros.p_user_id,
      USER
    )
    assert.equal(
      chamadas[0].parametros.p_subscription_id,
      SUB
    )
    assert.equal(
      chamadas[0].parametros.p_payment_id,
      PAY
    )
    assert.equal(
      chamadas[0].parametros.p_valor_pagamento,
      79.90
    )
    assert.equal(
      chamadas[0].parametros.p_regularizacao_completa,
      true
    )

    assert.ok(
      resultado.consultas.includes(
        `/v3/subscriptions/${SUB}`
      )
    )
    assert.ok(
      resultado.consultas.includes('/v3/payments')
    )
  }
)

test(
  'outra mensalidade vencida impede solicitar restauracao',
  async () => {
    const resultado = await executar({
      mensalidadeVencida: true,
    })

    assert.equal(resultado.resposta.status, 500)

    assert.equal(
      chamadasRestauracao(resultado.operacoes).length,
      0
    )

    const encerramento = resultado.operacoes.find(
      (operacao) =>
        operacao.tipo === 'update' &&
        operacao.tabela === 'asaas_eventos'
    )

    assert.ok(encerramento)

    assert.equal(
      encerramento.valores.status,
      'erro'
    )

    assert.match(
      String(encerramento.valores.motivo),
      /recuperacao ainda nao conciliada/
    )
  }
)
