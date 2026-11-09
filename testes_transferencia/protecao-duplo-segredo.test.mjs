import test from 'node:test'
import assert from 'node:assert/strict'
import { gerarCodigoTransferencia, codigoValido, hashConviteProtegido } from '../app/lib/convite-seguranca.ts'

test('codigo possui 128 bits, formato validavel e nao e constante', () => {
  const a = gerarCodigoTransferencia(); const b = gerarCodigoTransferencia()
  assert.match(a, /^[0-9a-f]{32}$/)
  assert.equal(codigoValido(a), true)
  assert.notEqual(a, b)
})
test('link sozinho e codigo errado nao produzem hash de convite', () => {
  const link = 'ab'.repeat(32), codigo = gerarCodigoTransferencia()
  const hash = hashConviteProtegido(link, codigo)
  assert.equal(hash.length, 64)
  assert.notEqual(hashConviteProtegido(link, ''), hash)
  assert.notEqual(hashConviteProtegido(link, '0'.repeat(32)), hash)
  assert.notEqual(hashConviteProtegido('cd'.repeat(32), codigo), hash)
})
test('codigo invalido ou incompleto e bloqueado', () => {
  for (const c of [null, undefined, '', '123456', 'zz'.repeat(16), 'a'.repeat(33)]) assert.equal(codigoValido(c), false)
})
