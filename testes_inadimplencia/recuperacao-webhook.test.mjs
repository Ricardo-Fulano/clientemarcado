
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  processarEventoAsaas,
} from '../app/lib/asaas-webhook.ts'

const USUARIO = '00000000-0000-4000-8000-000000000001'
const ASSINATURA = 'sub_recuperacao_teste'
const CLIENTE = 'cus_recuperacao_teste'
const PAGAMENTO = 'pay_recuperacao_teste'

function criarAmbiente() {
  const operacoes = []
  const consultasAsaas = []

  const perfil = {
    user_id: USUARIO,
    plano_tipo: 'free',
    modalidade_acesso: 'comercial',
    status_acesso: 'ativo',
    billing_cycle: 'mensal',
    gateway_subscription_id: ASSINATURA,
    gateway_customer_id: CLIENTE,
    motivo_downgrade: 'inadimplencia',
    plano_anterior_downgrade: 'essencial',
    pagamento_origem_downgrade: 'pay_antigo',
    downgrade_em: '2026-11-01T12:00:00Z',
    valor_contratado: 79.90,
    primeiro_pagamento_confirmado: true,
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

    async rpc(nome) {
      operacoes.push({
        tipo: 'rpc',
        nome,
      })

      if (nome === 'asaas_evento_reivindicar') {
        return {
          data: {
            acao: 'processar',
          },
          error: null,
        }
      }

      throw new Error(
        `RPC inesperada: ${nome}`
      )
    },
  }

  const evento = {
    id: 'evt_recuperacao_teste',
    event: 'PAYMENT_RECEIVED',
    dateCreated: '2026-11-11T12:00:00Z',

    payment: {
      id: PAGAMENTO,
      subscription: ASSINATURA,
      customer: CLIENTE,
      status: 'RECEIVED',
      value: 79.90,
      dueDate: '2026-11-01',
    },
  }

  // Simula a API do Asaas, sem usar a internet.
  const fetchFn = async (url) => {
    consultasAsaas.push(url)

    const caminho = new URL(url).pathname

    if (
      caminho !==
      `/v3/payments/${PAGAMENTO}`
    ) {
      throw new Error(
        `Consulta inesperada ao Asaas: ${caminho}`
      )
    }

    return {
      ok: true,
      status: 200,

      async text() {
        return JSON.stringify(evento.payment)
      },
    }
  }

  return {
    operacoes,
    consultasAsaas,
    supabase,
    evento,
    fetchFn,
  }
}

async function executarRecuperacao(
  flag
) {
  const ambiente = criarAmbiente()

  const env = {
    ASAAS_ENV: 'sandbox',
    ASAAS_API_KEY: 'chave_ficticia_apenas_para_testes',
  }

  if (flag !== undefined) {
    env.ASAAS_RECUPERACAO_AUTOMATICA_ENABLED = flag
  }

  const resposta = await processarEventoAsaas(
    {
      supabase: ambiente.supabase,
      env,
      fetchFn: ambiente.fetchFn,
    },
    ambiente.evento,
    JSON.stringify(ambiente.evento)
  )

  return {
    resposta,
    ...ambiente,
  }
}

function verificarRecuperacaoBloqueada(
  resultado
) {
  // Houve consulta ao pagamento simulado.
  assert.equal(
    resultado.consultasAsaas.length,
    1
  )

  assert.match(
    resultado.consultasAsaas[0],
    /api-sandbox\.asaas\.com\/v3\/payments\//
  )

  // O erro deve ser especificamente causado
  // pela recuperacao automatica desativada.
  assert.equal(
    resultado.resposta.status,
    500
  )

  const encerramento = resultado.operacoes.find(
    (op) =>
      op.tipo === 'update' &&
      op.tabela === 'asaas_eventos'
  )

  assert.ok(encerramento)
  assert.equal(
    encerramento.valores.status,
    'erro'
  )

  assert.match(
    String(encerramento.valores.motivo),
    /recuperacao automatica ainda desativada/
  )

  // Nenhuma restauracao pode ser executada.
  const restauracoes = resultado.operacoes.filter(
    (op) =>
      op.tipo === 'rpc' &&
      op.nome === 'restaurar_plano_apos_pagamento'
  )

  assert.equal(restauracoes.length, 0)

  // O perfil deve permanecer intacto.
  const alteracoesPerfil = resultado.operacoes.filter(
    (op) =>
      op.tipo === 'update' &&
      op.tabela === 'perfis'
  )

  assert.equal(alteracoesPerfil.length, 0)
}

test(
  'recuperacao desligada nao restaura conta Free',
  async () => {
    const resultado =
      await executarRecuperacao('false')

    verificarRecuperacaoBloqueada(resultado)
  }
)

test(
  'sem flag configurada tambem nao restaura',
  async () => {
    const resultado =
      await executarRecuperacao(undefined)

    verificarRecuperacaoBloqueada(resultado)
  }
)
