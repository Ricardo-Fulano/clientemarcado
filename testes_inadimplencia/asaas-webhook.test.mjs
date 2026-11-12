
import test from 'node:test'
import assert from 'node:assert/strict'
import { conferirPagamento } from '../app/lib/asaas-webhook.ts'

const perfil = {
  user_id: '00000000-0000-4000-8000-000000000001',
  plano_tipo: 'essencial',
  valor_contratado: 79.90, // contrato historico: nao alterar para o preco publico atual
  billing_cycle: 'mensal',
  gateway_customer_id: 'cus_teste',
  gateway_subscription_id: 'sub_teste',
}

const pagamento = {
  id: 'pay_teste',
  status: 'RECEIVED',
  value: 79.90,
  customer: 'cus_teste',
  subscription: 'sub_teste',
}

test('contrato historico de R$ 79,90, com pagamento correto, e aceito', () => {
  assert.equal(conferirPagamento(pagamento, perfil), null)
})

test('valor contratado prevalece sobre o preco publico', () => {
  assert.equal(conferirPagamento(
    { ...pagamento, value: 69.90 },
    { ...perfil, valor_contratado: 69.90 }
  ), null)
})

test('contrato diferente do pagamento impede ativacao', () => {
  assert.match(String(conferirPagamento(
    pagamento,
    { ...perfil, valor_contratado: 69.90 }
  )), /diferente do esperado/)
})

test('contrato invalido impede ativacao', () => {
  for (const valor of [0, -1, 'lixo']) {
    assert.match(String(conferirPagamento(
      pagamento,
      { ...perfil, valor_contratado: valor }
    )), /valor contratado invalido/)
  }
})

test('pagamento de outro cliente e rejeitado', () => {
  assert.match(String(conferirPagamento(
    { ...pagamento, customer: 'cus_outro' },
    perfil
  )), /outro cliente/)
})

test('pagamento de outra assinatura e rejeitado', () => {
  assert.match(String(conferirPagamento(
    { ...pagamento, subscription: 'sub_outra' },
    perfil
  )), /nao pertence a assinatura/)
})

test('perfil Free continua impedido de ativar sem reconciliacao', () => {
  assert.match(String(conferirPagamento(
    pagamento,
    {
      ...perfil,
      plano_tipo: 'free',
      plano_anterior_downgrade: 'essencial',
    }
  )), /perfil e Free/)
})

// Conta nova sem preco historico usa a tabela comercial vigente.
test('novo contrato Pro sem valor congelado exige R$ 59,90', () => {
  const novo = { ...perfil, valor_contratado: undefined }
  assert.equal(conferirPagamento({ ...pagamento, value: 59.90 }, novo), null)
  assert.match(String(conferirPagamento(pagamento, novo)), /diferente do esperado/)
})
