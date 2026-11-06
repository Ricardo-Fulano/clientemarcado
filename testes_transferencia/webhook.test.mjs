// Testes de COMPORTAMENTO do webhook do Resend: assinatura Svix (com vetor gerado pela biblioteca OFICIAL `svix`) e acompanhamento do e-mail.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { criarWebhookStore, processarEventoResend, verificarAssinaturaSvix } from '../app/lib/resend-webhook.ts'
import { criarBancoFake, criarRelogio, semearProducao } from './helpers.mjs'

// vetor gerado com `new Webhook(segredo).sign(id, data, corpo)` da biblioteca oficial do Svix (usada pelo Resend)
const V = {"segredo": "whsec_c2VncmVkby1kZS10ZXN0ZS0wMTIzNDU2Nzg5YWJjZGVm", "id": "msg_2abcDEF123", "ts": "1793969165", "corpo": "{\"type\":\"email.delivered\",\"created_at\":\"2026-11-06T12:46:00.000Z\",\"data\":{\"email_id\":\"em_abc123\",\"to\":[\"x@exemplo.com\"]}}", "assinatura": "v1,A21EHfvDtdm/VH/DLCP3VdukOSw2XyDW1TbKjbKwlzE="}
const AGORA = Number(V.ts) * 1000
const cab = (over = {}) => ({ id: V.id, timestamp: V.ts, signature: V.assinatura, ...over })
const assinar = (corpo, id, ts, segredo) => 'v1,' + createHmac('sha256', Buffer.from(segredo.replace(/^whsec_/, ''), 'base64')).update(`${id}.${ts}.${corpo}`).digest('base64')

test('assinatura: aceita a assinatura gerada pela biblioteca OFICIAL do Svix', () => {
  assert.equal(verificarAssinaturaSvix(V.corpo, cab(), V.segredo, AGORA), true)
})
test('assinatura: rejeita corpo adulterado, id trocado, segredo errado, cabecalhos ausentes e segredo vazio', () => {
  assert.equal(verificarAssinaturaSvix(V.corpo + ' ', cab(), V.segredo, AGORA), false)
  assert.equal(verificarAssinaturaSvix(V.corpo, cab({ id: 'msg_outro' }), V.segredo, AGORA), false)
  assert.equal(verificarAssinaturaSvix(V.corpo, cab(), 'whsec_' + Buffer.from('outro-segredo-xxxxxxxxxxxxxxxxxxxxx').toString('base64'), AGORA), false)
  for (const falta of ['id', 'timestamp', 'signature']) assert.equal(verificarAssinaturaSvix(V.corpo, cab({ [falta]: null }), V.segredo, AGORA), false, falta)
  assert.equal(verificarAssinaturaSvix(V.corpo, cab(), '', AGORA), false)
})
test('assinatura: janela de 5 minutos (passado e futuro) e timestamp invalido', () => {
  assert.equal(verificarAssinaturaSvix(V.corpo, cab(), V.segredo, AGORA + 299_000), true)
  assert.equal(verificarAssinaturaSvix(V.corpo, cab(), V.segredo, AGORA + 301_000), false)
  assert.equal(verificarAssinaturaSvix(V.corpo, cab(), V.segredo, AGORA - 301_000), false)
  for (const ts of ['abc', '', '1.5', 'NaN']) assert.equal(verificarAssinaturaSvix(V.corpo, cab({ timestamp: ts }), V.segredo, AGORA), false, ts)
})
test('assinatura: varias assinaturas no cabecalho (rotacao de segredo): basta UMA valida; versao diferente de v1 e lixo sao ignorados', () => {
  const lixo = 'v1,AAAA'
  assert.equal(verificarAssinaturaSvix(V.corpo, cab({ signature: `${lixo} ${V.assinatura}` }), V.segredo, AGORA), true)
  assert.equal(verificarAssinaturaSvix(V.corpo, cab({ signature: `${V.assinatura} ${lixo}` }), V.segredo, AGORA), true)
  assert.equal(verificarAssinaturaSvix(V.corpo, cab({ signature: V.assinatura.replace('v1,', 'v2,') }), V.segredo, AGORA), false)
  assert.equal(verificarAssinaturaSvix(V.corpo, cab({ signature: 'v1' }), V.segredo, AGORA), false)
  assert.equal(verificarAssinaturaSvix(V.corpo, cab({ signature: '' }), V.segredo, AGORA), false)
  assert.equal(verificarAssinaturaSvix(V.corpo, cab({ signature: V.assinatura.slice(0, -4) }), V.segredo, AGORA), false)
})
test('assinatura: o segredo funciona com ou sem o prefixo whsec_ e a verificacao e simetrica (assina e valida o mesmo)', () => {
  const corpo = '{"type":"email.bounced","data":{"email_id":"em_1"}}'
  const ts = String(Math.floor(Date.now() / 1000))
  const s = assinar(corpo, 'msg_1', ts, V.segredo)
  assert.equal(verificarAssinaturaSvix(corpo, { id: 'msg_1', timestamp: ts, signature: s }, V.segredo), true)
  assert.equal(verificarAssinaturaSvix(corpo, { id: 'msg_1', timestamp: ts, signature: s }, V.segredo.slice(6)), true)
})

// ------------------------------------------------------------------ eventos
function ambiente(status = null, extra = {}) {
  const base = semearProducao()
  const relogio = criarRelogio()
  const db = criarBancoFake([...base, { id: 'conv-1', perfil_id: 'perfil-1', user_id_atual: 'user-dono', email_novo: 'n@exemplo.com', token_hash: 'h', status: 'pendente', criado_em: '2026-11-06T13:00:00.000Z', expira_em: '2026-11-13T13:00:00.000Z', aceito_em: null, resend_email_id: 'em_1', email_status: status, email_erro: null, ...extra }], relogio)
  const store = criarWebhookStore(db)
  const ev = (type, data = {}, created_at) => ({ type, created_at, data: { email_id: 'em_1', ...data } })
  return { db, store, ev, linha: () => db.linha('conv-1'), proc: (e) => processarEventoResend(e, store, () => new Date('2026-11-06T15:00:00.000Z')) }
}

test('delivered: marca entregue e grava o instante da entrega (do evento)', async () => {
  const a = ambiente('solicitado')
  assert.deepEqual(await a.proc(a.ev('email.delivered', {}, '2026-11-06T13:00:05.000Z')), { tipo: 'atualizado', status: 'entregue' })
  assert.equal(a.linha().email_status, 'entregue')
  assert.equal(a.linha().email_entregue_em, '2026-11-06T13:00:05.000Z')
  assert.equal(a.linha().status, 'pendente') // o webhook NUNCA muda o status do convite, so as colunas email_*
})
test('delivered sem created_at valido usa o relogio do servidor', async () => {
  const a = ambiente('solicitado')
  await a.proc(a.ev('email.delivered', {}, 'lixo'))
  assert.equal(a.linha().email_entregue_em, '2026-11-06T15:00:00.000Z')
})
test('delayed -> delivered avanca; delivered -> delayed (fora de ordem) NAO retrocede; duplicata e idempotente', async () => {
  const a = ambiente('solicitado')
  assert.equal((await a.proc(a.ev('email.delivery_delayed'))).status, 'atrasado')
  assert.equal((await a.proc(a.ev('email.delivered'))).status, 'entregue')
  assert.deepEqual(await a.proc(a.ev('email.delivery_delayed')), { tipo: 'sem_mudanca' })
  assert.deepEqual(await a.proc(a.ev('email.delivered')), { tipo: 'sem_mudanca' })
  assert.deepEqual(await a.proc(a.ev('email.sent')), { tipo: 'sem_mudanca' })
  assert.equal(a.linha().email_status, 'entregue')
})
test('bounced: devolvido com motivo curto e sanitizado; failed/suppressed: falhou', async () => {
  const a = ambiente('solicitado')
  await a.proc(a.ev('email.bounced', { bounce: { message: '<script>x</script> mailbox full\n' + 'z'.repeat(400) } }))
  assert.equal(a.linha().email_status, 'devolvido')
  assert.ok(a.linha().email_erro.length <= 160 && !/[<>\n]/.test(a.linha().email_erro))
  const b = ambiente('solicitado')
  await b.proc(b.ev('email.failed', { reason: 'erro de provedor' }))
  assert.equal(b.linha().email_status, 'falhou'); assert.equal(b.linha().email_erro, 'erro de provedor')
  const c = ambiente('solicitado')
  await c.proc(c.ev('email.suppressed'))
  assert.equal(c.linha().email_status, 'falhou'); assert.equal(c.linha().email_erro, 'email.suppressed')
})
test('complained depois de delivered vira spam; devolvido e falhou nao se sobrescrevem entre si', async () => {
  const a = ambiente('entregue')
  assert.equal((await a.proc(a.ev('email.complained'))).status, 'spam')
  const b = ambiente('devolvido')
  assert.deepEqual(await b.proc(b.ev('email.failed')), { tipo: 'sem_mudanca' })
})
test('um envio INDETERMINADO e resolvido pelo primeiro evento real (entregue)', async () => {
  const a = ambiente('indeterminado', { email_erro: 'Resultado do envio incerto: timeout' })
  assert.equal((await a.proc(a.ev('email.delivered'))).status, 'entregue')
  const b = ambiente(null)
  assert.equal((await b.proc(b.ev('email.sent'))).status, 'solicitado') // linha antiga sem status
})
test('ignora com seguranca: e-mail de OUTRO fluxo, eventos nao acompanhados, sem email_id, formatos invalidos', async () => {
  const a = ambiente('solicitado')
  assert.deepEqual(await a.proc({ type: 'email.delivered', data: { email_id: 'em_de_outro_fluxo' } }), { tipo: 'ignorado', motivo: 'email_de_outro_fluxo' })
  for (const t of ['email.opened', 'email.clicked', 'email.scheduled', 'email.received', 'contact.created', 'x']) assert.equal((await a.proc(a.ev(t))).tipo, 'ignorado', t)
  assert.equal((await a.proc({ type: 'email.delivered', data: {} })).motivo, 'sem_email_id')
  for (const lixo of [null, undefined, 5, 'x', [], { type: 5 }]) assert.equal((await a.proc(lixo)).tipo, 'ignorado')
  assert.equal(a.linha().email_status, 'solicitado')
  assert.deepEqual(JSON.stringify(a.db.estado.rows.filter((r) => r.id !== 'conv-1')), JSON.stringify(semearProducao())) // nenhum outro convite tocado
})
test('eventos SIMULTANEOS fora de ordem (delivered + delayed): termina entregue (atualizacao otimista)', async () => {
  for (let i = 0; i < 40; i++) {
    const a = ambiente('solicitado')
    await Promise.all([a.proc(a.ev('email.delivery_delayed')), a.proc(a.ev('email.delivered')), a.proc(a.ev('email.delivery_delayed'))])
    assert.equal(a.linha().email_status, 'entregue', `rodada ${i}`)
  }
})
test('erro do banco propaga (a rota responde 500 e o Resend/Svix tenta de novo)', async () => {
  const a = ambiente('solicitado')
  a.db.falharProxima('select', 1)
  await assert.rejects(() => a.proc(a.ev('email.delivered')), /buscarPorResendId/)
  a.db.falharProxima('update', 1)
  await assert.rejects(() => a.proc(a.ev('email.delivered')), /atualizar/)
  assert.equal(a.linha().email_status, 'solicitado')
  assert.equal((await a.proc(a.ev('email.delivered'))).status, 'entregue') // a nova entrega do evento resolve
})
