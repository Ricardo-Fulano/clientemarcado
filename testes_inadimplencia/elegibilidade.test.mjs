
import test from 'node:test'
import assert from 'node:assert/strict'
import { avaliarElegibilidadeDowngrade } from '../app/lib/inadimplencia.ts'

const agora = Date.parse('2026-11-11T15:00:00Z')

function criarCenario(alteracoes = {}) {
  return {
    modalidadeAcesso: 'comercial',
    statusAcesso: 'em_atraso',
    primeiroPagamentoConfirmado: true,
    assinaturaVerificada: true,
    assinaturaAtiva: true,
    cobrancaVerificada: true,
    cobrancaPertenceAssinatura: true,
    statusCobranca: 'OVERDUE',
    vencimento: '2026-11-01',
    agora,
    ...alteracoes,
  }
}

test('renovacao comercial vencida pode ser candidata', () => {
  const resultado = avaliarElegibilidadeDowngrade(criarCenario())
  assert.equal(resultado.elegivel, true)
})

test('primeiro pagamento nao confirmado impede downgrade nesta regra', () => {
  const resultado = avaliarElegibilidadeDowngrade(
    criarCenario({ primeiroPagamentoConfirmado: false })
  )
  assert.equal(resultado.elegivel, false)
})

test('parceria nao participa do downgrade automatico', () => {
  const resultado = avaliarElegibilidadeDowngrade(
    criarCenario({ modalidadeAcesso: 'parceria' })
  )
  assert.equal(resultado.elegivel, false)
})

test('cortesia nao participa do downgrade automatico', () => {
  const resultado = avaliarElegibilidadeDowngrade(
    criarCenario({ modalidadeAcesso: 'cortesia' })
  )
  assert.equal(resultado.elegivel, false)
})

test('conta interna nao participa do downgrade automatico', () => {
  const resultado = avaliarElegibilidadeDowngrade(
    criarCenario({ modalidadeAcesso: 'interno' })
  )
  assert.equal(resultado.elegivel, false)
})

test('cobranca paga nao permite downgrade', () => {
  const resultado = avaliarElegibilidadeDowngrade(
    criarCenario({ statusCobranca: 'RECEIVED' })
  )
  assert.equal(resultado.elegivel, false)
})

test('assinatura nao verificada impede downgrade', () => {
  const resultado = avaliarElegibilidadeDowngrade(
    criarCenario({ assinaturaVerificada: false })
  )
  assert.equal(resultado.elegivel, false)
})

test('cobranca de outra assinatura impede downgrade', () => {
  const resultado = avaliarElegibilidadeDowngrade(
    criarCenario({ cobrancaPertenceAssinatura: false })
  )
  assert.equal(resultado.elegivel, false)
})

test('menos de cinco dias impede downgrade', () => {
  const resultado = avaliarElegibilidadeDowngrade(
    criarCenario({ vencimento: '2026-11-08' })
  )
  assert.equal(resultado.elegivel, false)
})

test('conta cancelada nao participa desta regra', () => {
  const resultado = avaliarElegibilidadeDowngrade(
    criarCenario({ statusAcesso: 'cancelado' })
  )
  assert.equal(resultado.elegivel, false)
})
