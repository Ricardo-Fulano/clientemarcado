
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  listarCobrancasAssinatura,
} from '../app/lib/cobrancas-asaas.ts'

const ASSINATURA = 'sub_teste_123'
const CLIENTE = 'cus_teste_123'

function criarCobranca(numero, alteracoes = {}) {
  return {
    id: `pay_${numero}`,
    customer: CLIENTE,
    subscription: ASSINATURA,
    status: 'RECEIVED',
    dueDate: '2026-11-10',
    deleted: false,
    ...alteracoes,
  }
}

function criarConsulta(paginas) {
  return async (caminho) => {
    const url = new URL(caminho, 'https://exemplo.test')
    const offset = Number(url.searchParams.get('offset'))

    if (!paginas.has(offset)) {
      throw new Error(`Pagina inesperada: ${offset}`)
    }

    return paginas.get(offset)
  }
}

test('consulta uma pagina completa', async () => {
  const paginas = new Map([
    [0, {
      data: [criarCobranca(1)],
      hasMore: false,
      totalCount: 1,
    }],
  ])

  const resultado = await listarCobrancasAssinatura(
    criarConsulta(paginas),
    ASSINATURA,
    CLIENTE
  )

  assert.equal(resultado.ok, true)

  if (resultado.ok) {
    assert.equal(resultado.cobrancas.length, 1)
    assert.equal(resultado.paginasConsultadas, 1)
  }
})

test('consulta mais de 100 cobrancas', async () => {
  const primeiraPagina = Array.from(
    { length: 100 },
    (_, indice) => criarCobranca(indice + 1)
  )

  const paginas = new Map([
    [0, {
      data: primeiraPagina,
      hasMore: true,
      totalCount: 101,
    }],
    [100, {
      data: [criarCobranca(101)],
      hasMore: false,
      totalCount: 101,
    }],
  ])

  const resultado = await listarCobrancasAssinatura(
    criarConsulta(paginas),
    ASSINATURA,
    CLIENTE
  )

  assert.equal(resultado.ok, true)

  if (resultado.ok) {
    assert.equal(resultado.cobrancas.length, 101)
    assert.equal(resultado.paginasConsultadas, 2)
  }
})

test('rejeita historico incompleto', async () => {
  const paginas = new Map([
    [0, {
      data: [criarCobranca(1)],
      hasMore: true,
      totalCount: 2,
    }],
  ])

  const resultado = await listarCobrancasAssinatura(
    criarConsulta(paginas),
    ASSINATURA,
    CLIENTE
  )

  assert.equal(resultado.ok, false)
})

test('rejeita cobranca duplicada entre paginas', async () => {
  const paginas = new Map([
    [0, {
      data: [criarCobranca(1)],
      hasMore: true,
      totalCount: 2,
    }],
    [100, {
      data: [criarCobranca(1)],
      hasMore: false,
      totalCount: 2,
    }],
  ])

  const resultado = await listarCobrancasAssinatura(
    criarConsulta(paginas),
    ASSINATURA,
    CLIENTE
  )

  assert.equal(resultado.ok, false)
})

test('rejeita cobranca de outra assinatura', async () => {
  const paginas = new Map([
    [0, {
      data: [
        criarCobranca(1, {
          subscription: 'sub_outra',
        }),
      ],
      hasMore: false,
      totalCount: 1,
    }],
  ])

  const resultado = await listarCobrancasAssinatura(
    criarConsulta(paginas),
    ASSINATURA,
    CLIENTE
  )

  assert.equal(resultado.ok, false)
})

test('rejeita cobranca de outro cliente', async () => {
  const paginas = new Map([
    [0, {
      data: [
        criarCobranca(1, {
          customer: 'cus_outro',
        }),
      ],
      hasMore: false,
      totalCount: 1,
    }],
  ])

  const resultado = await listarCobrancasAssinatura(
    criarConsulta(paginas),
    ASSINATURA,
    CLIENTE
  )

  assert.equal(resultado.ok, false)
})

test('rejeita total de cobrancas inconsistente', async () => {
  const paginas = new Map([
    [0, {
      data: [criarCobranca(1)],
      hasMore: false,
      totalCount: 3,
    }],
  ])

  const resultado = await listarCobrancasAssinatura(
    criarConsulta(paginas),
    ASSINATURA,
    CLIENTE
  )

  assert.equal(resultado.ok, false)
})

test('rejeita resposta sem indicador de paginacao', async () => {
  const paginas = new Map([
    [0, {
      data: [criarCobranca(1)],
      totalCount: 1,
    }],
  ])

  const resultado = await listarCobrancasAssinatura(
    criarConsulta(paginas),
    ASSINATURA,
    CLIENTE
  )

  assert.equal(resultado.ok, false)
})

test('rejeita historico vazio', async () => {
  const paginas = new Map([
    [0, {
      data: [],
      hasMore: false,
      totalCount: 0,
    }],
  ])

  const resultado = await listarCobrancasAssinatura(
    criarConsulta(paginas),
    ASSINATURA,
    CLIENTE
  )

  assert.equal(resultado.ok, false)
})

test('rejeita identificadores financeiros ausentes', async () => {
  const resultado = await listarCobrancasAssinatura(
    async () => ({
      data: [],
      hasMore: false,
      totalCount: 0,
    }),
    '',
    CLIENTE
  )

  assert.equal(resultado.ok, false)
})
