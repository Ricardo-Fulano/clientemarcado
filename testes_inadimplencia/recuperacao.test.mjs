
import test from 'node:test'
import assert from 'node:assert/strict'
import { avaliarRecuperacaoPlano } from '../app/lib/recuperacao-plano.ts'

function criarCenario(alteracoes = {}) {
  return {
    modalidadeAcesso: 'comercial',
    planoAtual: 'free',
    planoAnterior: 'essencial',
    motivoDowngrade: 'inadimplencia',
    pagamentoOrigemDowngrade: 'pay_atrasado',
    valorContratado: 79.90,
    valorPagamento: 79.90,
    pagamentoId: 'pay_regularizacao',
    pagamentoStatus: 'CONFIRMED',
    clientePagamentoCorresponde: true,
    assinaturaPagamentoCorresponde: true,
    pagamentoPosteriorAoUltimoAplicado: true,
    pagamentoRegularizaPendencia: true,
    ...alteracoes,
  }
}

test('pagamento valido permite candidatura a restauracao', () => {
  const resultado = avaliarRecuperacaoPlano(criarCenario())
  assert.equal(resultado.autorizado, true)

  if (resultado.autorizado) {
    assert.equal(resultado.planoRestaurar, 'essencial')
    assert.equal(resultado.valorValidado, 79.90)
  }
})

test('nao restaura conta de parceria', () => {
  const resultado = avaliarRecuperacaoPlano(
    criarCenario({ modalidadeAcesso: 'parceria' })
  )
  assert.equal(resultado.autorizado, false)
})

test('nao restaura plano anterior desconhecido', () => {
  const resultado = avaliarRecuperacaoPlano(
    criarCenario({ planoAnterior: 'desconhecido' })
  )
  assert.equal(resultado.autorizado, false)
})

test('nao restaura por pagamento pendente', () => {
  const resultado = avaliarRecuperacaoPlano(
    criarCenario({ pagamentoStatus: 'PENDING' })
  )
  assert.equal(resultado.autorizado, false)
})

test('nao restaura pagamento de outra assinatura', () => {
  const resultado = avaliarRecuperacaoPlano(
    criarCenario({ assinaturaPagamentoCorresponde: false })
  )
  assert.equal(resultado.autorizado, false)
})

test('nao restaura com valor diferente do contratado', () => {
  const resultado = avaliarRecuperacaoPlano(
    criarCenario({ valorPagamento: 59.90 })
  )
  assert.equal(resultado.autorizado, false)
})

test('nao restaura pagamento antigo ou duplicado', () => {
  const resultado = avaliarRecuperacaoPlano(
    criarCenario({ pagamentoPosteriorAoUltimoAplicado: false })
  )
  assert.equal(resultado.autorizado, false)
})

test('nao restaura pagamento que nao regulariza a pendencia', () => {
  const resultado = avaliarRecuperacaoPlano(
    criarCenario({ pagamentoRegularizaPendencia: false })
  )
  assert.equal(resultado.autorizado, false)
})

test('nao restaura downgrade por outro motivo', () => {
  const resultado = avaliarRecuperacaoPlano(
    criarCenario({ motivoDowngrade: 'cancelamento' })
  )
  assert.equal(resultado.autorizado, false)
})

test('nao restaura quando falta valor contratado', () => {
  const resultado = avaliarRecuperacaoPlano(
    criarCenario({ valorContratado: null })
  )
  assert.equal(resultado.autorizado, false)
})

test('nao restaura se o perfil nao esta no Free', () => {
  const resultado = avaliarRecuperacaoPlano(
    criarCenario({ planoAtual: 'essencial' })
  )
  assert.equal(resultado.autorizado, false)
})
