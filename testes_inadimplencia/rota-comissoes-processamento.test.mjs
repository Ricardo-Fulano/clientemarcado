import test from 'node:test'
import assert from 'node:assert/strict'
import { processarComissoesRecuperacao } from '../app/lib/processar-comissoes-recuperacao.ts'
import { conferirPagamento } from '../app/lib/asaas-webhook.ts'

const USER = '00000000-0000-4000-8000-000000000001'
const PAGAMENTO = 'pay_teste_reprocessamento'
const ASSINATURA = 'sub_teste_reprocessamento'
const CLIENTE = 'cus_teste_reprocessamento'
const TOKEN = '00000000-0000-4000-8000-000000000002'
const SEGREDO = 'segredo-ficticio-apenas-em-memoria'

function simulacao({ comissaoExistente = false, falharRegistro = false,
  semIndicacao = false, plano = 'essencial', reservaInvalida = false,
  perderReserva = false, pagamentoInvalido = false } = {}) {
  const rastreio = { reservas: 0, chamadasAsaas: 0, registrarComissao: 0, finalizacoes: [] }
  const fila = {
    pagamento_id: PAGAMENTO, user_id: USER,
    plano_restaurado: reservaInvalida ? '' : plano,
    valor_contratado: 79.90, status: 'pendente',
    reivindicacao_id: null,
  }
  let comissao = comissaoExistente ? {
    id: 'comissao_ficticia', user_id: USER,
    plano_tipo: plano, valor_pago: 79.90, status: 'pendente',
  } : null
  const historico = {
    user_id: USER, plano_restaurado: plano,
    gateway_subscription_id: ASSINATURA, valor_contratado: 79.90,
  }
  const perfil = {
    user_id: USER, gateway: 'asaas', gateway_customer_id: CLIENTE,
    gateway_subscription_id: ASSINATURA, billing_cycle: 'mensal',
    valor_contratado: 79.90,
  }
  const pagamento = {
    id: PAGAMENTO, customer: CLIENTE, subscription: ASSINATURA,
    status: 'RECEIVED', value: pagamentoInvalido ? 59.90 : 79.90,
    paymentDate: '2026-11-10', dueDate: '2026-11-10', deleted: false,
  }

  function from(tabela) {
    let alteracao = null
    const filtros = []
    const consulta = {
      select() { return consulta },
      update(valores) { alteracao = valores; return consulta },
      eq(chave, valor) { filtros.push([chave, valor]); return consulta },
      limit() { return Promise.resolve(resolver()) },
      maybeSingle() { return Promise.resolve(resolver()) },
      then(resolve, reject) { return Promise.resolve(resolver()).then(resolve, reject) },
    }
    function resolver() {
      if (alteracao !== null) {
        assert.equal(tabela, 'conciliacoes_comissao_recuperacao')
        const corresponde = filtros.every(([campo, valor]) => fila[campo] === valor)
        rastreio.finalizacoes.push({ alteracao, corresponde })
        if (corresponde) {
          Object.assign(fila, alteracao)
          return { data: [{ pagamento_id: PAGAMENTO }], error: null }
        }
        return { data: [], error: null }
      }
      switch (tabela) {
        case 'historico_recuperacoes_inadimplencia':
          return { data: historico, error: null }
        case 'perfis':
          return { data: perfil, error: null }
        case 'comissoes_parceiros':
          return { data: comissao ? [comissao] : [], error: null }
        case 'indicacoes_parceiros':
          return { data: semIndicacao ? [] : [{ id: 'indicacao_teste', parceiro_id: 'parceiro_teste' }], error: null }
        default: throw new Error(`Tabela inesperada: ${tabela}`)
      }
    }
    return consulta
  }

  const supabase = {
    from,
    auth: { admin: { async getUserById() {
      return { data: { user: { email: 'cliente.ficticio@example.com' } }, error: null }
    } } },
    async rpc(nome, { p_limite }) {
      assert.equal(nome, 'reivindicar_comissoes_recuperacao')
      assert.equal(p_limite, 1)
      if (fila.status !== 'pendente') return { data: [], error: null }
      fila.status = 'processando'
      fila.reivindicacao_id = TOKEN
      rastreio.reservas++
      return { data: [{ ...fila }], error: null }
    },
  }
  const deps = {
    env: {
      CRON_SECRET: SEGREDO,
      ASAAS_ENV: 'sandbox',
      ASAAS_API_KEY: 'chave_ficticia_nao_funcional',
      NEXT_PUBLIC_SUPABASE_URL: 'https://fake.invalid',
      SUPABASE_SERVICE_ROLE_KEY: 'fake-secret',
      ASAAS_REPROCESSAMENTO_COMISSOES_ENABLED: 'true',
    },
    criarCliente: () => supabase,
    fetchFn: async () => {
      rastreio.chamadasAsaas++
      return { ok: true, status: 200, async json() { return pagamento } }
    },
    conferirPagamentoFn: conferirPagamento,
    registrarComissaoFn: async () => {
      rastreio.registrarComissao++
      if (perderReserva) fila.reivindicacao_id = 'outra-reserva'
      if (!falharRegistro) {
        comissao = {
          id: 'nova_comissao', user_id: USER,
          plano_tipo: plano, valor_pago: 79.90, status: 'pendente',
        }
      }
    },
  }
  function executar() {
    return processarComissoesRecuperacao(new Request(
      'http://localhost/api/cron/reprocessar-comissoes-recuperacao', {
        method: 'POST', headers: { authorization: `Bearer ${SEGREDO}` },
      }), deps)
  }
  return { fila, rastreio, executar }
}

test('comissao existente encerra sem registrar outra', async () => {
  const s = simulacao({ comissaoExistente: true })
  const r = await s.executar()
  assert.equal(r.status, 200)
  assert.equal((await r.json()).comissoesConfirmadas, 1)
  assert.equal(s.rastreio.registrarComissao, 0)
  assert.equal(s.fila.status, 'concluida')
})

test('nova comissao confirmada no banco conclui pendencia', async () => {
  const s = simulacao()
  const r = await s.executar()
  assert.equal(r.status, 200)
  assert.equal((await r.json()).comissoesConfirmadas, 1)
  assert.equal(s.rastreio.registrarComissao, 1)
  assert.equal(s.fila.status, 'concluida')
})

test('helper sem registro deixa a pendencia como erro', async () => {
  const s = simulacao({ falharRegistro: true })
  const r = await s.executar()
  assert.equal(r.status, 200)
  assert.equal((await r.json()).pendenciasComErro, 1)
  assert.equal(s.fila.status, 'erro')
  assert.match(s.fila.ultimo_erro, /Comissao nao confirmada/)
})

test('sem indicacao conclui como sem_comissao', async () => {
  const s = simulacao({ semIndicacao: true })
  const r = await s.executar()
  assert.equal(r.status, 200)
  assert.equal((await r.json()).semComissao, 1)
  assert.equal(s.rastreio.registrarComissao, 0)
  assert.equal(s.fila.status, 'sem_comissao')
})

test('reserva com dados invalidos nao gera comissao', async () => {
  const s = simulacao({ reservaInvalida: true })
  const r = await s.executar()
  assert.equal(r.status, 200)
  assert.equal((await r.json()).pendenciasComErro, 1)
  assert.equal(s.rastreio.chamadasAsaas, 0)
  assert.equal(s.fila.status, 'erro')
})

test('pagamento divergente no Asaas nao gera comissao', async () => {
  const s = simulacao({ pagamentoInvalido: true })
  const r = await s.executar()
  assert.equal(r.status, 200)
  assert.equal((await r.json()).pendenciasComErro, 1)
  assert.equal(s.rastreio.registrarComissao, 0)
  assert.equal(s.fila.status, 'erro')
})

test('perda do token de reserva impede conclusao e gera falha HTTP', async () => {
  const s = simulacao({ perderReserva: true })
  const r = await s.executar()
  assert.equal(r.status, 500)
  assert.equal(s.fila.status, 'processando')
  assert.equal(s.rastreio.finalizacoes.every(x => !x.corresponde), true)
})

test('duas chamadas concorrentes so reservam uma pendencia', async () => {
  const s = simulacao()
  const [r1, r2] = await Promise.all([s.executar(), s.executar()])
  const [a, b] = await Promise.all([r1.json(), r2.json()])
  assert.equal(r1.status, 200)
  assert.equal(r2.status, 200)
  assert.equal(s.rastreio.reservas, 1)
  assert.equal(a.pendenciasReservadas + b.pendenciasReservadas, 1)
  assert.equal(s.rastreio.registrarComissao, 1)
})
