
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  avaliarRegularizacaoAsaas,
} from '../app/lib/regularizacao-asaas.ts'

// =====================================================
// MINIPAGE PRO
// Testes de regularizacao financeira no Asaas
//
// Estes testes utilizam dados ficticios.
// Nao fazem consultas reais ao Asaas.
// Nao modificam clientes, planos ou pagamentos.
// =====================================================

const ASSINATURA = 'sub_1'
const CLIENTE = 'cus_1'
const PAGAMENTO = 'pay_1'

// 11/11/2026, ao meio-dia no horario de Brasilia.
const AGORA = Date.parse('2026-11-11T15:00:00Z')

function criarCobranca(
  id,
  status = 'RECEIVED',
  dueDate = '2026-10-10',
  alteracoes = {}
) {
  return {
    id,
    subscription: ASSINATURA,
    customer: CLIENTE,
    status,
    dueDate,
    deleted: false,
    ...alteracoes,
  }
}

function criarDados(alteracoes = {}) {
  return {
    subscriptionId: ASSINATURA,
    customerId: CLIENTE,
    pagamentoConfirmadoId: PAGAMENTO,
    historicoCompleto: true,
    agora: AGORA,
    cobrancas: [
      criarCobranca(PAGAMENTO),
    ],
    ...alteracoes,
  }
}

// =====================================================
// 1. REGULARIZACAO CORRETA
// =====================================================

test(
  'permite candidatura quando pagamento foi confirmado e nao ha atrasos',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados()
    )

    assert.equal(resultado.regularizada, true)
    assert.equal(resultado.cobrancasVencidas, 0)
    assert.equal(resultado.pagamentosConfirmados, 1)
  }
)

// =====================================================
// 2. MENSALIDADE ANTERIOR EM ATRASO
// =====================================================

test(
  'nao permite recuperacao se outra mensalidade continua vencida',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [
          criarCobranca(PAGAMENTO),
          criarCobranca(
            'pay_2',
            'OVERDUE',
            '2026-09-10'
          ),
        ],
      })
    )

    assert.equal(resultado.regularizada, false)
    assert.equal(resultado.cobrancasVencidas, 1)
  }
)

// =====================================================
// 3. HISTORICO INCOMPLETO
// =====================================================

test(
  'nao permite recuperacao com historico incompleto',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        historicoCompleto: false,
      })
    )

    assert.equal(resultado.regularizada, false)
    assert.match(resultado.motivo, /incompleto/)
  }
)

// =====================================================
// 4. COBRANCA DE OUTRA ASSINATURA
// =====================================================

test(
  'nao permite cobranca de outra assinatura',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [
          criarCobranca(PAGAMENTO),
          criarCobranca(
            'pay_2',
            'RECEIVED',
            '2026-10-10',
            {
              subscription: 'sub_outra',
            }
          ),
        ],
      })
    )

    assert.equal(resultado.regularizada, false)
  }
)

// =====================================================
// 5. COBRANCA DE OUTRO CLIENTE
// =====================================================

test(
  'nao permite cobranca de outro cliente',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [
          criarCobranca(PAGAMENTO),
          criarCobranca(
            'pay_2',
            'RECEIVED',
            '2026-10-10',
            {
              customer: 'cus_outro',
            }
          ),
        ],
      })
    )

    assert.equal(resultado.regularizada, false)
  }
)

// =====================================================
// 6. COBRANCAS DUPLICADAS
// =====================================================

test(
  'nao permite cobranca duplicada no historico',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [
          criarCobranca(PAGAMENTO),
          criarCobranca(PAGAMENTO),
        ],
      })
    )

    assert.equal(resultado.regularizada, false)
    assert.match(resultado.motivo, /duplicada/)
  }
)

// =====================================================
// 7. PAGAMENTO ALVO AINDA PENDENTE
// =====================================================

test(
  'nao permite pagamento alvo ainda pendente',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [
          criarCobranca(
            PAGAMENTO,
            'PENDING',
            '2026-12-10'
          ),
        ],
      })
    )

    assert.equal(resultado.regularizada, false)
  }
)

// =====================================================
// 8. PAGAMENTO NAO ENCONTRADO
// =====================================================

test(
  'nao permite recuperacao quando pagamento alvo nao aparece',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        pagamentoConfirmadoId: 'pay_inexistente',
      })
    )

    assert.equal(resultado.regularizada, false)
    assert.match(resultado.motivo, /nao localizado/)
  }
)

// =====================================================
// 9. COBRANCA EXCLUIDA
// =====================================================

test(
  'nao permite cobranca excluida sem conciliacao',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [
          criarCobranca(
            PAGAMENTO,
            'RECEIVED',
            '2026-10-10',
            {
              deleted: true,
            }
          ),
        ],
      })
    )

    assert.equal(resultado.regularizada, false)
  }
)

// =====================================================
// 10. STATUS DESCONHECIDO
// =====================================================

test(
  'nao permite status financeiro desconhecido',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [
          criarCobranca(
            PAGAMENTO,
            'STATUS_INESPERADO'
          ),
        ],
      })
    )

    assert.equal(resultado.regularizada, false)
    assert.match(resultado.motivo, /desconhecido/)
  }
)

// =====================================================
// 11. MENSALIDADE FUTURA PENDENTE
// =====================================================

test(
  'permite mensalidade futura pendente se o pagamento alvo foi quitado',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [
          criarCobranca(PAGAMENTO),
          criarCobranca(
            'pay_2',
            'PENDING',
            '2026-12-10'
          ),
        ],
      })
    )

    assert.equal(resultado.regularizada, true)
  }
)

// =====================================================
// 12. HISTORICO VAZIO
// =====================================================

test(
  'nao permite historico vazio',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [],
      })
    )

    assert.equal(resultado.regularizada, false)
  }
)

// =====================================================
// 13. PENDING COM VENCIMENTO ATINGIDO
// =====================================================

test(
  'nao restaura com cobranca PENDING vencida',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [
          criarCobranca(PAGAMENTO),
          criarCobranca(
            'pay_2',
            'PENDING',
            '2026-11-10'
          ),
        ],
      })
    )

    assert.equal(resultado.regularizada, false)
    assert.match(resultado.motivo, /pendente/)
  }
)

// =====================================================
// 14. COBRANCA ESTORNADA
// =====================================================

test(
  'nao restaura com cobranca estornada',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [
          criarCobranca(PAGAMENTO),
          criarCobranca(
            'pay_2',
            'REFUNDED',
            '2026-11-10'
          ),
        ],
      })
    )

    assert.equal(resultado.regularizada, false)
  }
)

// =====================================================
// 15. COBRANCA CONTESTADA
// =====================================================

test(
  'nao restaura com cobranca contestada',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [
          criarCobranca(PAGAMENTO),
          criarCobranca(
            'pay_2',
            'CHARGEBACK_REQUESTED',
            '2026-11-10'
          ),
        ],
      })
    )

    assert.equal(resultado.regularizada, false)
  }
)

// =====================================================
// 16. DATA DE VENCIMENTO IMPOSSIVEL
// =====================================================

test(
  'nao restaura com data de vencimento impossivel',
  () => {
    const resultado = avaliarRegularizacaoAsaas(
      criarDados({
        cobrancas: [
          criarCobranca(
            PAGAMENTO,
            'RECEIVED',
            '2026-02-30'
          ),
        ],
      })
    )

    assert.equal(resultado.regularizada, false)
  }
)
