
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  registrarComissaoParceiro,
} from '../app/lib/asaas-webhook.ts'

const USER = '00000000-0000-4000-8000-000000000001'
const PAYMENT = 'pay_teste_comissao'
const INDICACAO = 'indicacao_ficticia'
const PARCEIRO = 'parceiro_ficticio'

function criarSimulacao({
  indicacoes = [
    {
      id: INDICACAO,
      parceiro_id: PARCEIRO,
    },
  ],
  percentual = 0.30,
  erroIndicacoes = null,
  erroPercentual = null,
  erroRpc = null,
  email = 'cliente.teste@example.com',
} = {}) {
  const chamadas = []

  const supabase = {
    auth: {
      admin: {
        async getUserById(userId) {
          chamadas.push({
            tipo: 'usuario',
            userId,
          })

          return {
            data: {
              user: { email },
            },
            error: null,
          }
        },
      },
    },

    from(tabela) {
      const consulta = {
        select() {
          return consulta
        },

        eq() {
          return consulta
        },

        maybeSingle() {
          if (tabela !== 'parceiros') {
            throw new Error(
              `Tabela inesperada: ${tabela}`
            )
          }

          return Promise.resolve({
            data: erroPercentual
              ? null
              : {
                  percentual_comissao: percentual,
                },
            error: erroPercentual,
          })
        },

        then(resolve, reject) {
          if (tabela !== 'indicacoes_parceiros') {
            return Promise.reject(
              new Error(`Tabela inesperada: ${tabela}`)
            ).then(resolve, reject)
          }

          return Promise.resolve({
            data: indicacoes,
            error: erroIndicacoes,
          }).then(resolve, reject)
        },
      }

      chamadas.push({
        tipo: 'tabela',
        tabela,
      })

      return consulta
    },

    async rpc(nome, parametros) {
      chamadas.push({
        tipo: 'rpc',
        nome,
        parametros,
      })

      assert.equal(
        nome,
        'registrar_comissao_pagamento'
      )

      return {
        data: erroRpc ? null : 'comissao_simulada',
        error: erroRpc,
      }
    },
  }

  const pagamento = {
    id: PAYMENT,
    status: 'RECEIVED',
    value: 79.90,
    customer: 'cus_ficticio',
    subscription: 'sub_ficticia',
    paymentDate: '2026-11-10',
  }

  const executar = () =>
    registrarComissaoParceiro(supabase, {
      userId: USER,
      planoTipo: 'essencial',
      payment: pagamento,
      cicloCobranca: 'mensal',
    })

  const chamadasRpc = () =>
    chamadas.filter(
      (chamada) => chamada.tipo === 'rpc'
    )

  return {
    chamadas,
    pagamento,
    executar,
    chamadasRpc,
  }
}

test(
  'comissao elegivel utiliza a RPC financeira existente',
  async () => {
    const simulacao = criarSimulacao()

    await simulacao.executar()

    const chamadas = simulacao.chamadasRpc()

    assert.equal(chamadas.length, 1)

    const parametros = chamadas[0].parametros

    assert.equal(parametros.p_user_id, USER)
    assert.equal(
      parametros.p_asaas_payment_id,
      PAYMENT
    )
    assert.equal(
      parametros.p_indicacao_id,
      INDICACAO
    )
    assert.equal(
      parametros.p_parceiro_id,
      PARCEIRO
    )
    assert.equal(
      parametros.p_plano_tipo,
      'essencial'
    )
    assert.equal(
      parametros.p_valor_pago,
      79.90
    )
    assert.equal(
      parametros.p_percentual,
      0.30
    )
    assert.equal(
      parametros.p_ciclo_cobranca,
      'mensal'
    )
  }
)

test(
  'erro da RPC nao e propagado pelo helper',
  async () => {
    const simulacao = criarSimulacao({
      erroRpc: {
        message: 'Falha simulada na RPC',
      },
    })

    // O comportamento atual do helper e
    // registrar o erro e retornar normalmente.
    await assert.doesNotReject(
      simulacao.executar()
    )

    assert.equal(
      simulacao.chamadasRpc().length,
      1
    )

    // Este teste demonstra por que a rota
    // precisa consultar o banco depois da
    // tentativa para confirmar a comissao.
  }
)

test(
  'cliente sem indicacao nao gera chamada financeira',
  async () => {
    const simulacao = criarSimulacao({
      indicacoes: [],
    })

    await simulacao.executar()

    assert.equal(
      simulacao.chamadasRpc().length,
      0
    )
  }
)

test(
  'indicacoes ambiguas impedem registro',
  async () => {
    const simulacao = criarSimulacao({
      indicacoes: [
        {
          id: 'indicacao_a',
          parceiro_id: 'parceiro_a',
        },
        {
          id: 'indicacao_b',
          parceiro_id: 'parceiro_b',
        },
      ],
    })

    await simulacao.executar()

    assert.equal(
      simulacao.chamadasRpc().length,
      0
    )
  }
)

test(
  'percentual invalido impede registro financeiro',
  async () => {
    const simulacao = criarSimulacao({
      percentual: 0.75,
    })

    await simulacao.executar()

    assert.equal(
      simulacao.chamadasRpc().length,
      0
    )
  }
)

test(
  'falha na consulta de indicacoes impede registro',
  async () => {
    const simulacao = criarSimulacao({
      erroIndicacoes: {
        message: 'Falha simulada de conexao',
      },
    })

    await simulacao.executar()

    assert.equal(
      simulacao.chamadasRpc().length,
      0
    )
  }
)

test(
  'email indisponivel impede registro financeiro',
  async () => {
    const simulacao = criarSimulacao({
      email: null,
    })

    await simulacao.executar()

    assert.equal(
      simulacao.chamadasRpc().length,
      0
    )
  }
)
