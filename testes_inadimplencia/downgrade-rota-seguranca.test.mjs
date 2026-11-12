// MiniPage Pro — testes isolados da rota de downgrade.
// Sem rede, sem banco real, sem alteracoes em perfis ou assinaturas.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const CAMINHO = new URL('../app/api/cron/verificar-inadimplencia/route.ts', import.meta.url)
const CODIGO = fs.readFileSync(CAMINHO, 'utf8')
const JS = ts.transpileModule(CODIGO, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

const ID = '00000000-0000-4000-8000-000000000001'
const SUB = 'sub_teste'
const CUS = 'cus_teste'
const PAY = 'pay_vencido'
const VENC = '2026-01-01'

async function executar({
  flag = false, autorizado = true, primeiroStatus = 'OVERDUE', segundoStatus = 'OVERDUE',
  perfilMudou = false, rpcResultado = true, historicoInconclusivo = false,
  pagamentoPosterior = false, primeiroPagamentoConfirmado = false,
} = {}) {
  const chamadas = { rpc: [], asaas: [], perfis: 0, paginas: 0 }
  const perfil = {
    user_id: ID, slug: 'cliente-teste', plano_tipo: 'essencial',
    modalidade_acesso: 'comercial', status_acesso: 'em_atraso',
    gateway_customer_id: CUS, gateway_subscription_id: SUB,
    primeiro_pagamento_confirmado: primeiroPagamentoConfirmado,
  }
  const assinatura = {
    id: SUB, customer: CUS, externalReference: ID,
    status: 'ACTIVE', deleted: false, value: 79.9, cycle: 'MONTHLY',
  }
  let leituraHistorico = 0
  const cobrancasDe = (status) => [{
    id: PAY, customer: CUS, subscription: SUB, status,
    dueDate: VENC, deleted: false,
  }, ...(pagamentoPosterior ? [{
    id: 'pay_posterior', customer: CUS, subscription: SUB,
    status: 'RECEIVED', dueDate: '2026-02-01', deleted: false,
  }] : [])]

  const db = {
    from(nome) {
      assert.equal(nome, 'perfis')
      chamadas.perfis++
      return {
        select() {
          return {
            eq() {
              return {
                eq: async () => ({ data: [perfil], error: null }),
                maybeSingle: async () => ({
                  data: {
                    plano_tipo: perfilMudou ? 'free' : perfil.plano_tipo,
                    status_acesso: perfil.status_acesso,
                    gateway_subscription_id: SUB,
                    primeiro_pagamento_confirmado: primeiroPagamentoConfirmado,
                  }, error: null,
                }),
              }
            },
          }
        },
      }
    },
    rpc(nome, parametros) {
      chamadas.rpc.push({ nome, parametros })
      return Promise.resolve({ data: rpcResultado, error: null })
    },
  }
  const ambiente = { ok: true, baseUrl: 'https://asaas.teste.local' }
  const requireFake = (modulo) => {
    if (modulo === 'next/server') return {
      NextResponse: { json: (body, config = {}) => ({ status: config.status || 200, body }) },
    }
    if (modulo === '@supabase/supabase-js') return { createClient: () => db }
    if (modulo.endsWith('/asaas-ambiente')) return { avaliarAmbienteAsaas: () => ambiente }
    if (modulo.endsWith('/inadimplencia')) return {
      cincoDiasCompletos: () => true,
      avaliarElegibilidadeDowngrade: (dados) => ({
        elegivel: dados.statusCobranca === 'OVERDUE' &&
          dados.assinaturaAtiva === true &&
          (dados.primeiroPagamentoConfirmado || dados.primeiroPagamentoConciliado === true) &&
          dados.statusAcesso === 'em_atraso',
      }),
    }
    if (modulo.endsWith('/cobrancas-asaas')) return {
      listarCobrancasAssinatura: async (consultar, assinaturaId, clienteId) => {
        assert.equal(assinaturaId, SUB)
        assert.equal(clienteId, CUS)
        await consultar(`/payments?subscription=${SUB}&limit=100&offset=0`)
        leituraHistorico++
        chamadas.paginas++
        if (historicoInconclusivo) return { ok: false, motivo: 'simulado', paginasConsultadas: 1 }
        return { ok: true, cobrancas: cobrancasDe(leituraHistorico === 1 ? primeiroStatus : segundoStatus), paginasConsultadas: 1 }
      },
    }
    throw new Error(`Modulo inesperado: ${modulo}`)
  }
  const ambienteTeste = {
    exports: {},
    require: requireFake,
    process: { env: {
      CRON_SECRET: 'segredo-ficticio', NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.teste.local',
      SUPABASE_SERVICE_ROLE_KEY: 'chave-ficticia', ASAAS_API_KEY: 'chave-asaas-ficticia',
      ASAAS_DOWNGRADE_AUTOMATICO_ENABLED: flag ? 'true' : 'false',
    } },
    fetch: async (url, config) => {
      chamadas.asaas.push(url)
      assert.equal(config.method, 'GET')
      if (url.includes('/subscriptions/')) return { ok: true, json: async () => assinatura }
      if (url.includes('/payments?')) return { ok: true, json: async () => ({ data: [], hasMore: false }) }
      throw new Error('URL inesperada: ' + url)
    },
    AbortSignal,
    Date,
    console: { warn() {}, error() {}, log() {} },
  }
  const contexto = vm.createContext(ambienteTeste)
  vm.runInContext(JS, contexto, { filename: 'route.compiled.cjs' })
  const request = { headers: { get: () => autorizado ? 'Bearer segredo-ficticio' : 'Bearer errado' } }
  const resposta = await ambienteTeste.exports.GET(request)
  return { resposta, chamadas }
}

test('flag desligada: somente simula e nunca chama RPC', async () => {
  const { resposta, chamadas } = await executar()
  assert.equal(resposta.status, 200)
  assert.equal(resposta.body.modo, 'simulacao')
  assert.equal(resposta.body.downgradeExecutado, false)
  assert.equal(chamadas.rpc.length, 0)
})

test('sem autorizacao: responde 401 e nao consulta Asaas nem Supabase', async () => {
  const { resposta, chamadas } = await executar({ flag: true, autorizado: false })
  assert.equal(resposta.status, 401)
  assert.equal(chamadas.asaas.length, 0)
  assert.equal(chamadas.rpc.length, 0)
})

test('cobranca paga na primeira consulta: nao faz downgrade', async () => {
  const { resposta, chamadas } = await executar({ flag: true, primeiroStatus: 'RECEIVED' })
  assert.equal(resposta.body.downgradesExecutados, 0)
  assert.equal(chamadas.rpc.length, 0)
})

test('pagamento confirmado entre as duas consultas: recusa downgrade', async () => {
  const { resposta, chamadas } = await executar({ flag: true, segundoStatus: 'RECEIVED' })
  assert.equal(resposta.body.downgradesRecusadosNaRevalidacao, 1)
  assert.equal(chamadas.rpc.length, 0)
})

test('pagamento posterior quitado: recusa downgrade de cobranca antiga', async () => {
  const { resposta, chamadas } = await executar({ flag: true, pagamentoPosterior: true, primeiroPagamentoConfirmado: true })
  assert.equal(resposta.body.downgradesRecusadosNaRevalidacao, 1)
  assert.equal(chamadas.rpc.length, 0)
})

test('perfil alterado antes da RPC: recusa downgrade', async () => {
  const { resposta, chamadas } = await executar({ flag: true, perfilMudou: true })
  assert.equal(resposta.body.downgradesRecusadosNaRevalidacao, 1)
  assert.equal(chamadas.rpc.length, 0)
})

test('historico inconclusivo: nao executa downgrade', async () => {
  const { resposta, chamadas } = await executar({ flag: true, historicoInconclusivo: true })
  assert.equal(resposta.body.downgradesExecutados, 0)
  assert.equal(chamadas.rpc.length, 0)
})

test('inadimplencia confirmada duas vezes: chama RPC uma unica vez', async () => {
  const { resposta, chamadas } = await executar({ flag: true })
  assert.equal(chamadas.rpc.length, 1)
  assert.equal(chamadas.rpc[0].nome, 'aplicar_downgrade_inadimplencia')
  assert.equal(chamadas.rpc[0].parametros.p_payment_id, PAY)
  assert.equal(resposta.body.downgradesExecutados, 1)
})

test('RPC recusa: nao informa downgrade executado', async () => {
  const { resposta, chamadas } = await executar({ flag: true, rpcResultado: false })
  assert.equal(chamadas.rpc.length, 1)
  assert.equal(resposta.body.downgradesExecutados, 0)
  assert.equal(resposta.body.falhasExecucaoDowngrade, 1)
})
