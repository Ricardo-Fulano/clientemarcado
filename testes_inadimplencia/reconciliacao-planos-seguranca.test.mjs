import test from 'node:test'
import assert from 'node:assert/strict'
import { executarReconciliacaoPlanos } from '../app/lib/reconciliar-planos-pagos.ts'

const ID = '00000000-0000-4000-8000-000000000001'
const base = {
  user_id: ID, plano_tipo: 'free', status_acesso: 'ativo', modalidade_acesso: 'comercial',
  gateway: 'asaas', gateway_subscription_id: 'sub1', gateway_customer_id: 'cus1',
  billing_cycle: 'mensal', valor_contratado: 79.9, plano_anterior_downgrade: 'essencial',
  motivo_downgrade: 'inadimplencia', pagamento_origem_downgrade: 'origem',
  downgrade_em: '2026-11-01T00:00:00Z', plano_ativo_ate: null,
}
const date = '2026-11-01'
const pago = { id: 'pago', subscription: 'sub1', customer: 'cus1', status: 'RECEIVED', value: 79.9, dueDate: date, paymentDate: '2026-11-10' }
const origem = { id: 'origem', subscription: 'sub1', customer: 'cus1', status: 'RECEIVED', value: 79.9, dueDate: date }
function construir({ flag = 'true', autorizado = true, perfil = base, cobrancas = [pago], rpc = true, conciliacao = true, pagamentoFinal = pago } = {}) {
  let chamadasRpc = 0, consultas = 0, criacoes = 0
  const env = { ASAAS_RECONCILIACAO_PLANOS_ENABLED: flag, CRON_SECRET: 'segredo',
    NEXT_PUBLIC_SUPABASE_URL: 'https://teste.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'ficticia',
    ASAAS_API_KEY: 'ficticia', ASAAS_ENV: 'sandbox' }
  // Asaas URL precisa ser fornecida conforme a configuracao de ambiente real do projeto.
  const db = {
    from(tabela) {
      assert.equal(tabela, 'perfis')
      const q = { select() { return q }, eq() { return q }, order() { return q },
        limit() { return Promise.resolve({ data: [perfil], error: null }) } }
      return q
    },
    async rpc(nome, args) {
      chamadasRpc++
      assert.equal(nome, 'restaurar_plano_por_conciliacao')
      assert.equal(args.p_payment_id, 'pago')
      return { data: rpc, error: null }
    },
  }
  const deps = {
    env,
    avaliarAmbienteFn() { return { ok: true, baseUrl: 'https://sandbox.asaas.com/api/v3' } },
    criarCliente() { criacoes++; return db },
    async fetchFn(url) {
      consultas++
      const caminho = new URL(url).pathname + new URL(url).search
      const resultado = caminho.includes('/payments/origem') ? origem
        : caminho.includes('/payments/pago') ? pagamentoFinal
        : caminho.includes('/payments?') ? { data: cobrancas, totalCount: cobrancas.length, hasMore: false }
        : { id: 'sub1', customer: 'cus1', status: 'ACTIVE' }
      return { ok: true, async json() { return resultado } }
    },
    async conciliarFn() { return conciliacao ? { apta: true, pagamento: pago, assinatura: {}, cobrancasVerificadas: 1 } : { apta: false, motivo: 'inconclusivo' } },
    conferirFn(pg) { return pg.value === 79.9 ? null : 'valor divergente' },
    fimFn() { return new Date('2099-12-01T00:00:00Z') },
  }
  const req = new Request('http://localhost', { method: 'POST', headers: { authorization: autorizado ? 'Bearer segredo' : 'Bearer errado' } })
  return { deps, req, get contadores() { return { chamadasRpc, consultas, criacoes } } }
}
const executar = async c => ({ status: (await executarReconciliacaoPlanos(c.req, c.deps)).status, c: c.contadores })

test('flag desligada impede acesso ao banco e Asaas', async () => {
  const c = construir({ flag: 'false' })
  const r = await executar(c)
  assert.equal(r.status, 503)
  assert.equal(r.c.chamadasRpc, 0)
  assert.equal(r.c.consultas, 0)
})
test('sem autorizacao impede acesso financeiro', async () => {
  const c = construir({ autorizado: false })
  const r = await executar(c)
  assert.equal(r.status, 401)
  assert.equal(r.c.criacoes, 0)
})
test('perfil inconsistente nao realiza RPC', async () => {
  const c = construir({ perfil: { ...base, billing_cycle: 'anual' } })
  await executar(c)
  assert.equal(c.contadores.chamadasRpc, 0)
})
test('historico pago anterior a cobranca de origem nao restaura', async () => {
  const c = construir({ cobrancas: [{ ...pago, dueDate: '2026-10-01' }] })
  await executar(c)
  assert.equal(c.contadores.chamadasRpc, 0)
})
test('conciliacao inconclusiva nao restaura', async () => {
  const c = construir({ conciliacao: false })
  await executar(c)
  assert.equal(c.contadores.chamadasRpc, 0)
})
test('pagamento mudou antes da RPC: nao restaura', async () => {
  const c = construir({ pagamentoFinal: { ...pago, status: 'REFUNDED' } })
  await executar(c)
  assert.equal(c.contadores.chamadasRpc, 0)
})
test('reconciliacao valida solicita exatamente uma restauracao', async () => {
  const c = construir()
  await executar(c)
  assert.equal(c.contadores.chamadasRpc, 1)
})
test('RPC recusada nao confirma restauracao', async () => {
  const c = construir({ rpc: false })
  const res = await executarReconciliacaoPlanos(c.req, c.deps)
  const body = await res.json()
  assert.equal(body.restaurados, 0)
  assert.equal(body.recusados, 1)
})
