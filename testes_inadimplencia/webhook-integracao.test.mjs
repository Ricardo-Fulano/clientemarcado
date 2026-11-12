
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  processarEventoAsaas,
} from '../app/lib/asaas-webhook.ts'

const USER_ID = '00000000-0000-4000-8000-000000000001'
const SUB = 'sub_integracao_teste'
const CUS = 'cus_integracao_teste'

function criarPerfil() {
  return {
    user_id: USER_ID,
    plano_tipo: 'free',
    modalidade_acesso: 'comercial',
    status_acesso: 'ativo',
    billing_cycle: 'mensal',
    gateway_subscription_id: SUB,
    gateway_customer_id: CUS,
    motivo_downgrade: 'inadimplencia',
    plano_anterior_downgrade: 'essencial',
    pagamento_origem_downgrade: 'pay_antigo',
    downgrade_em: '2026-11-01T12:00:00Z',
    valor_contratado: 79.90,
    primeiro_pagamento_confirmado: true,
  }
}

function bancoSimulado(acaoReivindicacao = 'processar') {
  const operacoes = []
  const perfil = criarPerfil()

  function consulta(tabela) {
    const estado = {
      tabela,
      tipo: 'select',
      valores: null,
    }

    const construtor = {
      select() {
        estado.tipo = 'select'
        return construtor
      },

      update(valores) {
        estado.tipo = 'update'
        estado.valores = valores
        return construtor
      },

      eq() {
        return construtor
      },

      neq() {
        return construtor
      },

      in() {
        return construtor
      },

      is() {
        return construtor
      },

      order() {
        return construtor
      },

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
      if (estado.tipo === 'update') {
        operacoes.push({
          tabela,
          tipo: 'update',
          valores: estado.valores,
        })

        return { data: null, error: null }
      }

      if (tabela === 'perfis') {
        return {
          data: [perfil],
          error: null,
        }
      }

      return { data: [], error: null }
    }

    return construtor
  }

  const supabase = {
    rpc: async (nome) => {
      operacoes.push({
        tabela: nome,
        tipo: 'rpc',
      })

      if (nome === 'asaas_evento_reivindicar') {
        return {
          data: {
            acao: acaoReivindicacao,
            status: acaoReivindicacao === 'duplicado'
              ? 'processado'
              : 'processando',
          },
          error: null,
        }
      }

      throw new Error(
        `RPC inesperada: ${nome}`
      )
    },

    from: consulta,
  }

  return { supabase, operacoes }
}

function criarEvento(tipo) {
  return {
    id: `evt_${tipo}`,
    event: tipo,
    dateCreated: '2026-11-11T12:00:00Z',
    payment: {
      id: 'pay_teste',
      subscription: SUB,
      customer: CUS,
      dueDate: '2026-11-01',
      value: 79.90,
    },
    subscription: {
      id: SUB,
      customer: CUS,
    },
  }
}

async function executar(tipo, acaoReivindicacao = 'processar') {
  const banco = bancoSimulado(acaoReivindicacao)
  const evento = criarEvento(tipo)

  const resposta = await processarEventoAsaas(
    {
      supabase: banco.supabase,
      env: {},
    },
    evento,
    JSON.stringify(evento)
  )

  return {
    resposta,
    operacoes: banco.operacoes,
  }
}

function alteracoesNoPerfil(operacoes) {
  return operacoes.filter(
    (op) =>
      op.tabela === 'perfis' &&
      op.tipo === 'update'
  )
}

test(
  'evento OVERDUE antigo nao bloqueia perfil Free',
  async () => {
    const resultado = await executar('PAYMENT_OVERDUE')

    assert.equal(resultado.resposta.status, 200)
    assert.equal(
      resultado.resposta.body.resultado,
      'ignorado'
    )
    assert.equal(
      alteracoesNoPerfil(resultado.operacoes).length,
      0
    )
  }
)

test(
  'assinatura inativada nao bloqueia perfil Free',
  async () => {
    const resultado = await executar(
      'SUBSCRIPTION_INACTIVATED'
    )

    assert.equal(resultado.resposta.status, 200)
    assert.equal(
      resultado.resposta.body.resultado,
      'ignorado'
    )
    assert.equal(
      alteracoesNoPerfil(resultado.operacoes).length,
      0
    )
  }
)

test(
  'assinatura cancelada nao cancela perfil Free',
  async () => {
    const resultado = await executar(
      'SUBSCRIPTION_DELETED'
    )

    assert.equal(resultado.resposta.status, 200)
    assert.equal(
      resultado.resposta.body.resultado,
      'ignorado'
    )
    assert.equal(
      alteracoesNoPerfil(resultado.operacoes).length,
      0
    )
  }
)

test(
  'evento duplicado nao altera o perfil',
  async () => {
    const resultado = await executar(
      'PAYMENT_OVERDUE',
      'duplicado'
    )

    assert.equal(resultado.resposta.status, 200)
    assert.equal(
      resultado.resposta.body.duplicado,
      true
    )
    assert.equal(
      alteracoesNoPerfil(resultado.operacoes).length,
      0
    )
  }
)
