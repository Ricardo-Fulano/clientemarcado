
import test from 'node:test'
import assert from 'node:assert/strict'
import { cincoDiasCompletos } from '../app/lib/inadimplencia.ts'

test('nao permite elegibilidade antes de cinco dias completos', () => {
  // 15/11/2026, 23:59:59 em Brasilia.
  const agora = Date.parse('2026-11-16T02:59:59Z')

  assert.equal(
    cincoDiasCompletos('2026-11-10', agora),
    false
  )
})

test('permite elegibilidade ao completar cinco dias de atraso', () => {
  // 16/11/2026, 00:00:00 em Brasilia.
  const agora = Date.parse('2026-11-16T03:00:00Z')

  assert.equal(
    cincoDiasCompletos('2026-11-10', agora),
    true
  )
})

test('nao permite downgrade no proprio vencimento', () => {
  const agora = Date.parse('2026-11-10T15:00:00Z')

  assert.equal(
    cincoDiasCompletos('2026-11-10', agora),
    false
  )
})

test('nao permite downgrade no quinto dia antes da meia-noite', () => {
  // 15/11/2026, 20:00 em Brasilia.
  const agora = Date.parse('2026-11-15T23:00:00Z')

  assert.equal(
    cincoDiasCompletos('2026-11-10', agora),
    false
  )
})

test('permite elegibilidade depois do prazo completo', () => {
  // 17/11/2026, 12:00 em Brasilia.
  const agora = Date.parse('2026-11-17T15:00:00Z')

  assert.equal(
    cincoDiasCompletos('2026-11-10', agora),
    true
  )
})

test('rejeita data de vencimento invalida', () => {
  assert.equal(
    cincoDiasCompletos('data-invalida', Date.now()),
    false
  )
})

test('rejeita uma data impossivel', () => {
  assert.equal(
    cincoDiasCompletos('2026-02-30', Date.now()),
    false
  )
})

test('rejeita instante atual invalido', () => {
  assert.equal(
    cincoDiasCompletos('2026-11-10', Number.NaN),
    false
  )
})
