
import test from 'node:test'
import assert from 'node:assert/strict'

import { POST } from '../app/api/cron/reprocessar-comissoes-recuperacao/route.ts'

test(
  'reprocessamento desativado retorna HTTP 503',
  async () => {
    const anterior =
      process.env.ASAAS_REPROCESSAMENTO_COMISSOES_ENABLED

    try {
      delete process.env.ASAAS_REPROCESSAMENTO_COMISSOES_ENABLED

      const resposta = await POST(
        new Request('http://localhost/api/cron/reprocessar-comissoes-recuperacao', {
          method: 'POST',
        })
      )

      assert.equal(resposta.status, 503)

      const corpo = await resposta.json()
      assert.equal(
        corpo.error,
        'Reprocessamento desativado.'
      )
    } finally {
      if (anterior === undefined) {
        delete process.env.ASAAS_REPROCESSAMENTO_COMISSOES_ENABLED
      } else {
        process.env.ASAAS_REPROCESSAMENTO_COMISSOES_ENABLED =
          anterior
      }
    }
  }
)

test(
  'reprocessamento habilitado exige CRON_SECRET',
  async () => {
    const flagAnterior =
      process.env.ASAAS_REPROCESSAMENTO_COMISSOES_ENABLED
    const segredoAnterior =
      process.env.CRON_SECRET

    try {
      process.env.ASAAS_REPROCESSAMENTO_COMISSOES_ENABLED =
        'true'
      process.env.CRON_SECRET =
        'segredo_ficticio_somente_teste'

      const resposta = await POST(
        new Request('http://localhost/api/cron/reprocessar-comissoes-recuperacao', {
          method: 'POST',
        })
      )

      assert.equal(resposta.status, 401)

      const corpo = await resposta.json()
      assert.equal(
        corpo.error,
        'Nao autorizado.'
      )
    } finally {
      if (flagAnterior === undefined) {
        delete process.env.ASAAS_REPROCESSAMENTO_COMISSOES_ENABLED
      } else {
        process.env.ASAAS_REPROCESSAMENTO_COMISSOES_ENABLED =
          flagAnterior
      }

      if (segredoAnterior === undefined) {
        delete process.env.CRON_SECRET
      } else {
        process.env.CRON_SECRET = segredoAnterior
      }
    }
  }
)
