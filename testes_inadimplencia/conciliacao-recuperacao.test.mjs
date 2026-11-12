
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  conciliarRecuperacaoAsaas,
} from '../app/lib/conciliacao-recuperacao.ts'

const ASSINATURA = 'sub_teste'
const CLIENTE = 'cus_teste'
const PAGAMENTO = 'pay_1'
const AGORA = Date.parse('2026-11-11T15:00:00Z')

function cobranca(id, status = 'RECEIVED', dueDate = '2026-10-10') {
  return {
    id,
    customer: CLIENTE,
    subscription: ASSINATURA,
    status,
    dueDate,
    deleted: false,
  }
}

function criarConsulta({
  assinatura = {},
  pagamento = {},
  cobrancas = [cobranca(PAGAMENTO)],
  hasMore = false,
  falhar = false,
} = {}) {
  return async (caminho) => {
    if (falhar) {
      throw new Error('Falha simulada no Asaas')
    }

    if (caminho.startsWith('/subscriptions/')) {
      return {
        id: ASSINATURA,
        customer: CLIENTE,
        status: 'ACTIVE',
        deleted: false,
        ...assinatura,
      }
    }

    if (caminho.startsWith('/payments/pay_1')) {
      return {
        id: PAGAMENTO,
        customer: CLIENTE,
        subscription: ASSINATURA,
        status: 'RECEIVED',
        value: 79.90,
        ...pagamento,
      }
    }

    if (caminho.startsWith('/payments?')) {
      return {
        data: cobrancas,
        hasMore,
        totalCount: cobrancas.length,
      }
    }

    throw new Error('Consulta inesperada')
  }
}

async function avaliar(opcoes = {}) {
  return conciliarRecuperacaoAsaas(
    criarConsulta(opcoes),
    ASSINATURA,
    CLIENTE,
    PAGAMENTO,
    AGORA
  )
}

test('permite conciliacao preliminar de pagamento regularizado', async () => {
  const resultado = await avaliar()

  assert.equal(resultado.apta, true)
  if (resultado.apta) {
    assert.equal(resultado.cobrancasVerificadas, 1)
  }
})

test('recusa assinatura inativa', async () => {
  const resultado = await avaliar({
    assinatura: { status: 'INACTIVE' },
  })

  assert.equal(resultado.apta, false)
})

test('recusa assinatura de outro cliente', async () => {
  const resultado = await avaliar({
    assinatura: { customer: 'cus_outro' },
  })

  assert.equal(resultado.apta, false)
})

test('recusa pagamento de outro cliente', async () => {
  const resultado = await avaliar({
    pagamento: { customer: 'cus_outro' },
  })

  assert.equal(resultado.apta, false)
})

test('recusa pagamento de outra assinatura', async () => {
  const resultado = await avaliar({
    pagamento: { subscription: 'sub_outra' },
  })

  assert.equal(resultado.apta, false)
})

test('recusa pagamento ainda pendente', async () => {
  const resultado = await avaliar({
    pagamento: { status: 'PENDING' },
  })

  assert.equal(resultado.apta, false)
})

test('recusa outra mensalidade vencida', async () => {
  const resultado = await avaliar({
    cobrancas: [
      cobranca(PAGAMENTO),
      cobranca('pay_2', 'OVERDUE', '2026-09-10'),
    ],
  })

  assert.equal(resultado.apta, false)
})

test('recusa mensalidade PENDING com vencimento atingido', async () => {
  const resultado = await avaliar({
    cobrancas: [
      cobranca(PAGAMENTO),
      cobranca('pay_2', 'PENDING', '2026-11-10'),
    ],
  })

  assert.equal(resultado.apta, false)
})

test('permite mensalidade futura ainda pendente', async () => {
  const resultado = await avaliar({
    cobrancas: [
      cobranca(PAGAMENTO),
      cobranca('pay_2', 'PENDING', '2026-12-10'),
    ],
  })

  assert.equal(resultado.apta, true)
})

test('recusa historico paginado incompleto', async () => {
  const resultado = await avaliar({
    hasMore: true,
  })

  assert.equal(resultado.apta, false)
})

test('recusa falha na consulta ao Asaas', async () => {
  const resultado = await avaliar({
    falhar: true,
  })

  assert.equal(resultado.apta, false)
})

test('recusa identificadores financeiros vazios', async () => {
  const resultado = await conciliarRecuperacaoAsaas(
    criarConsulta(),
    '',
    CLIENTE,
    PAGAMENTO,
    AGORA
  )

  assert.equal(resultado.apta, false)
})
