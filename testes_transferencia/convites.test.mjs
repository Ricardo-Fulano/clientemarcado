import { hashConviteProtegido } from '../app/lib/convite-seguranca.ts'
// Testes de COMPORTAMENTO da transferencia de MiniPages (nao procuram texto no codigo: executam a logica real com banco e Resend falsos).
//   node --test "testes_transferencia/*.test.mjs"   (aspas obrigatorias no CMD/PowerShell; Node >= 22.18; em 22.6-22.17 acrescente --experimental-strip-types)
// Nenhum teste usa rede, Supabase, Resend ou dados reais. O convite real da Ana e apenas reproduzido em memoria.
import test from 'node:test'
import assert from 'node:assert/strict'
import { criarConvite, COOLDOWN_MS } from '../app/lib/convite-criar.ts'
import { criarConviteStore, mascararEmail, ultimosConvites } from '../app/lib/convite-store.ts'
import { criarEnvioResend } from '../app/lib/resend-envio.ts'
import { criarBancoFake, criarEmailFake, criarDeps, criarRelogio, entrada, semearProducao, sha256 } from './helpers.mjs'

function cenario({ roteiro = [], semente = semearProducao(), relogio = criarRelogio(), depsOver = {}, storeOver = {} } = {}) {
  const db = criarBancoFake(semente, relogio)
  const email = criarEmailFake(roteiro)
  const store = { ...criarConviteStore(db), ...storeOver }
  const deps = criarDeps({ ...depsOver, relogio })
  return { db, email, store, deps, relogio, criar: (inp = entrada()) => criarConvite(inp, { store, email, ...deps }), logs: deps.logs }
}
const novoConvite = (db) => db.estado.rows.filter((r) => r.id.startsWith('conv-')).at(-1)
const intacto = (db, ids) => ids.every((id) => { const o = semearProducao().find((r) => r.id === id); return JSON.stringify(db.linha(id)) === JSON.stringify(o) })

// ------------------------------------------------------------------ requisito 1: falha no envio NAO invalida o convite anterior
test('1) Resend recusa (403/422): o convite ANTERIOR (Ana) continua pendente e intocado; o novo e cancelado; resposta 502', async () => {
  for (const http of [401, 403, 422]) {
    const c = cenario({ roteiro: [{ tipo: 'rejeitado', http, codigo: 'validation_error' }] })
    const r = await c.criar()
    assert.equal(r.status, 502)
    assert.equal(r.body.codigo, 'ENVIO_REJEITADO')
    assert.ok(intacto(c.db, ['ana-1', 'outro-1', 'hist-1']), 'convite da Ana / outros foram alterados')
    const novo = novoConvite(c.db)
    assert.equal(novo.status, 'cancelado') // ninguem recebeu o link: nao deixa convite valido solto
    assert.equal(novo.email_status, 'falhou')
    assert.match(novo.email_erro, new RegExp(`HTTP ${http}`))
    assert.equal(c.email.chamadas.length, 1, 'recusa definitiva nao deve ser retentada')
    assert.equal(r.body.ok, undefined)
  }
})

test('2) NUNCA cancela o anterior antes de o Resend aceitar (ordem das operacoes registradas no banco)', async () => {
  const c = cenario()
  const eventos = []
  const emailOriginal = c.email.enviar.bind(c.email)
  c.email.enviar = async (...a) => { eventos.push('envio'); return emailOriginal(...a) }
  const opOriginal = c.db.from.bind(c.db)
  c.db.from = (t) => { const q = opOriginal(t); const exec = q.executar.bind(q); q.executar = async () => { const out = await exec(); if (q.op === 'update' && q.payload.status === 'cancelado' && q.filtros.length >= 4) eventos.push('cancela_anteriores'); if (q.op === 'insert') eventos.push('insere'); return out }; return q }
  c.store = criarConviteStore(c.db)
  const r = await criarConvite(entrada(), { store: c.store, email: c.email, ...c.deps })
  assert.equal(r.status, 200)
  assert.deepEqual(eventos, ['insere', 'envio', 'cancela_anteriores'])
})

// ------------------------------------------------------------------ sucesso
test('3) sucesso: novo pendente com id do Resend registrado; SO os anteriores do MESMO perfil cancelados; historico e outros perfis intactos', async () => {
  const c = cenario()
  const r = await c.criar()
  assert.equal(r.status, 200)
  assert.equal(r.body.ok, true)
  assert.equal(r.body.estado, 'solicitado')
  assert.equal(r.body.anteriores_canceladas, 1)
  assert.equal(r.body.acompanhamento, true)
  assert.ok(r.body.link_convite)
  assert.match(r.body.codigo_autorizacao, /^[0-9a-f]{32}$/)
  const novo = novoConvite(c.db)
  assert.equal(novo.status, 'pendente')
  assert.equal(novo.email_status, 'solicitado') // aceito pelo provedor, NAO "entregue"
  assert.equal(novo.resend_email_id, 'em_1')
  assert.ok(novo.email_enviado_em)
  assert.equal(novo.email_entregue_em, undefined)
  assert.equal(c.db.linha('ana-1').status, 'cancelado') // substituido pelo mais novo
  assert.ok(intacto(c.db, ['outro-1', 'hist-1']))
  assert.equal(c.db.linha('hist-1').status, 'aceito') // nunca mexe em convite aceito
  assert.equal(c.db.pendentes('perfil-1').length, 1)
})

test('4) so o HASH do token vai ao banco; o link do e-mail leva o token cru e corresponde ao hash; HTML e escapado', async () => {
  const c = cenario()
  const r = await criarConvite(entrada({ perfil: { id: 'perfil-1', nome_negocio: 'Studio <img src=x onerror=1> & "Cia"' } }), { store: c.store, email: c.email, ...c.deps })
  assert.equal(r.status, 200)
  const novo = novoConvite(c.db)
  const msg = c.email.chamadas[0]
  const token = /\/convite\/([^"]+)"/.exec(msg.html)[1]
  assert.equal(hashConviteProtegido(token, r.body.codigo_autorizacao), novo.token_hash)
  assert.notEqual(sha256(token), novo.token_hash, 'link isolado nao pode autorizar a transferencia')
  assert.equal(msg.html.includes(r.body.codigo_autorizacao), false, 'o codigo nao pode ser enviado junto com o link')
  assert.equal(JSON.stringify(c.db.estado.rows).includes(token), false, 'token cru nao pode estar no banco')
  assert.ok(msg.html.includes('Studio &lt;img src=x onerror=1&gt; &amp; &quot;Cia&quot;'))
  assert.equal(msg.html.includes('<img src=x'), false)
  assert.equal(msg.para, 'ana@exemplo.com')
  assert.ok(msg.html.startsWith('\n      <div') || msg.html.includes('Aceitar convite e criar senha'))
})

// ------------------------------------------------------------------ envio incerto (o caso perigoso)
test('5) timeout na 1a tentativa mas o e-mail SAIU: a 2a tentativa usa a MESMA chave e o Resend nao duplica; sucesso com UM e-mail', async () => {
  const c = cenario({ roteiro: [{ tipo: 'incerto-mas-enviou' }, { tipo: 'aceito' }] })
  const r = await c.criar()
  assert.equal(r.status, 200)
  assert.equal(c.email.chamadas.length, 2)
  assert.equal(c.email.chamadas[0].chave, c.email.chamadas[1].chave)
  assert.equal(c.email.chamadas[0].html, c.email.chamadas[1].html) // mesmo conteudo (exigido pela idempotencia do Resend)
  assert.equal(c.email.emailsRealmenteEnviados(), 1)
  assert.equal(novoConvite(c.db).resend_email_id, 'em_1')
})

test('6) incerto nas duas tentativas: o novo PERMANECE pendente (o e-mail pode ter saido), o anterior NAO e cancelado, 503 ENVIO_INDETERMINADO', async () => {
  for (const passos of [[{ tipo: 'incerto', motivo: 'timeout' }, { tipo: 'incerto', motivo: 'http_503' }], [{ tipo: 'lanca' }, { tipo: 'lanca' }]]) {
    const c = cenario({ roteiro: passos })
    const r = await c.criar()
    assert.equal(r.status, 503)
    assert.equal(r.body.codigo, 'ENVIO_INDETERMINADO')
    const novo = novoConvite(c.db)
    assert.equal(novo.status, 'pendente')
    assert.equal(novo.email_status, 'indeterminado')
    assert.equal(c.db.linha('ana-1').status, 'pendente') // preservado
    assert.ok(intacto(c.db, ['ana-1', 'outro-1', 'hist-1']))
    assert.equal(c.email.chamadas.length, 2)
  }
})

test('7) Resend responde 2xx sem id: tratado como incerto (nao registra sucesso falso)', async () => {
  const c = cenario({ roteiro: [{ tipo: 'incerto', motivo: 'resposta_sem_id' }, { tipo: 'incerto', motivo: 'resposta_sem_id' }] })
  const r = await c.criar()
  assert.equal(r.status, 503)
  assert.equal(c.db.linha('ana-1').status, 'pendente')
})

// ------------------------------------------------------------------ falhas de banco em cada passo
test('8) falha ao gravar o convite novo: nada e enviado e nada e cancelado (500)', async () => {
  const c = cenario()
  c.db.falharProxima('insert', 2)
  const r = await c.criar()
  assert.equal(r.status, 500)
  assert.equal(c.email.chamadas.length, 0)
  assert.ok(intacto(c.db, ['ana-1', 'outro-1', 'hist-1']))
  assert.equal(c.db.estado.rows.length, 3)
})

test('9) falha ao REGISTRAR o id do Resend: o e-mail saiu e o convite e valido, entao conclui; a API sinaliza acompanhamento=false (nao finge acompanhamento)', async () => {
  const c = cenario()
  c.db.falharProxima('update', 2) // as duas tentativas de registrarSolicitado
  const r = await c.criar()
  assert.equal(r.status, 200)
  assert.equal(r.body.acompanhamento, false)
  assert.equal(c.db.linha('ana-1').status, 'cancelado') // a troca foi concluida mesmo assim
  assert.equal(novoConvite(c.db).status, 'pendente')
  assert.ok(c.logs.some((l) => l.e === 'registro_solicitado_falhou'))
})

test('10) falha ao CANCELAR os anteriores: NAO responde sucesso (503 CANCELAMENTO_PENDENTE, email_enviado=true); anterior segue pendente e e recuperavel por novo envio', async () => {
  const c = cenario({ storeOver: { cancelarAnteriores: async () => { throw new Error('banco fora') } } })
  const r = await c.criar()
  assert.equal(r.status, 503)
  assert.equal(r.body.codigo, 'CANCELAMENTO_PENDENTE')
  assert.equal(r.body.email_enviado, true)
  assert.equal(r.body.ok, undefined)
  assert.equal(c.db.linha('ana-1').status, 'pendente')
  assert.equal(novoConvite(c.db).status, 'pendente')
  assert.equal(novoConvite(c.db).email_status, 'solicitado')
  // recuperacao: um novo envio (apos o intervalo) cancela TODOS os mais antigos, incluindo o que ficou pendente
  c.relogio.avancar(120)
  const c2 = cenario({ semente: c.db.estado.rows.map((x) => ({ ...x })), relogio: c.relogio })
  const r2 = await c2.criar(entrada({ emailNovo: 'ana@exemplo.com' }))
  assert.equal(r2.status, 200)
  assert.equal(c2.db.pendentes('perfil-1').length, 1)
})

test('11) falha transitoria no cancelamento (1x) e absorvida pela nova tentativa interna', async () => {
  let n = 0
  const base = criarBancoFake(semearProducao())
  const c = cenario({ storeOver: {} })
  const original = criarConviteStore(c.db)
  const store = { ...original, cancelarAnteriores: async (...a) => { if (n++ === 0) throw new Error('transitorio'); return original.cancelarAnteriores(...a) } }
  const r = await criarConvite(entrada(), { store, email: c.email, ...c.deps })
  assert.equal(r.status, 200)
  assert.equal(c.db.linha('ana-1').status, 'cancelado')
  void base
})

// ------------------------------------------------------------------ concorrencia
test('12) dois convites SIMULTANEOS: termina com UM unico pendente (o mais novo); nunca cancela os dois; nenhum aceito indevido', async () => {
  for (let rodada = 0; rodada < 30; rodada++) {
    const c = cenario({ semente: semearProducao() })
    const mkDeps = () => criarDeps({ relogio: c.relogio })
    // desliga o cooldown para forcar a corrida real (as duas requisicoes passam pela checagem antes de qualquer insercao)
    const store = { ...c.store, existePendenteRecente: async () => false }
    const email2 = criarEmailFake()
    const [a, b] = await Promise.all([
      criarConvite(entrada({ emailNovo: 'a@exemplo.com' }), { store, email: c.email, ...mkDeps() }),
      criarConvite(entrada({ emailNovo: 'b@exemplo.com' }), { store, email: email2, ...mkDeps() }),
    ])
    assert.equal(a.status, 200); assert.equal(b.status, 200)
    const pend = c.db.pendentes('perfil-1')
    assert.equal(pend.length, 1, `rodada ${rodada}: pendentes=${pend.length}`)
    const novos = c.db.estado.rows.filter((r) => r.id.startsWith('conv-')).sort((x, y) => (x.criado_em < y.criado_em ? -1 : 1))
    assert.equal(pend[0].id, novos.at(-1).id, 'o vencedor deve ser o mais novo')
    assert.equal(c.db.linha('ana-1').status, 'cancelado')
    assert.ok(intacto(c.db, ['outro-1', 'hist-1']))
  }
})

test('13) protecao contra duplo clique: segundo pedido em ate 30 s recebe 429 e NAO envia e-mail; depois do intervalo e permitido', async () => {
  const c = cenario()
  const r1 = await c.criar()
  assert.equal(r1.status, 200)
  const r2 = await c.criar()
  assert.equal(r2.status, 429)
  assert.equal(r2.body.codigo, 'AGUARDE')
  assert.equal(c.email.chamadas.length, 1)
  c.relogio.avancar((COOLDOWN_MS / 1000) * 3)
  assert.equal((await c.criar()).status, 200)
  assert.equal(c.db.pendentes('perfil-1').length, 1)
})

test('14) apos uma recusa definitiva o dono pode tentar de novo imediatamente (convite cancelado nao conta no intervalo)', async () => {
  const c = cenario({ roteiro: [{ tipo: 'rejeitado', http: 422, codigo: 'validation_error' }] })
  assert.equal((await c.criar()).status, 502)
  assert.equal((await c.criar()).status, 200)
})

// ------------------------------------------------------------------ validacoes
test('15) validacoes: e-mail vazio/invalido, igual ao do dono (sem diferenciar maiusculas); nada e gravado nem enviado', async () => {
  for (const emailNovo of ['', '   ', 'sem-arroba', 'a@b', 5, null, undefined, 'DONO@exemplo.com', ' dono@exemplo.com ']) {
    const c = cenario()
    const r = await c.criar(entrada({ emailNovo }))
    assert.equal(r.status, 400, String(emailNovo))
    assert.equal(c.db.estado.rows.length, 3)
    assert.equal(c.email.chamadas.length, 0)
  }
})

test('16) o e-mail do destinatario e normalizado (minusculas, sem espacos)', async () => {
  const c = cenario()
  await c.criar(entrada({ emailNovo: '  Ana.Nova@Exemplo.COM ' }))
  assert.equal(novoConvite(c.db).email_novo, 'ana.nova@exemplo.com')
  assert.equal(c.email.chamadas[0].para, 'ana.nova@exemplo.com')
})

// ------------------------------------------------------------------ adaptador do Resend (classificacao)
test('17) adaptador do Resend: classifica 2xx/4xx/5xx/429/409/rede/timeout e envia Idempotency-Key e o corpo certo', async () => {
  const mk = (resp) => { const seen = []; const f = async (url, init) => { seen.push({ url, init }); if (resp instanceof Error) throw resp; return resp }; return { seen, env: criarEnvioResend('re_chave_teste', { fetchImpl: f }) } }
  const json = (status, corpo) => new Response(typeof corpo === 'string' ? corpo : JSON.stringify(corpo), { status })
  const msg = { para: 'a@b.com', assunto: 'Assunto', html: '<p>oi</p>' }
  let { seen, env } = mk(json(200, { id: 'em_ok' }))
  assert.deepEqual(await env.enviar(msg, 'chave-1'), { tipo: 'aceito', id: 'em_ok' })
  assert.equal(seen[0].url, 'https://api.resend.com/emails')
  assert.equal(seen[0].init.headers['Idempotency-Key'], 'chave-1')
  assert.equal(seen[0].init.headers.Authorization, 'Bearer re_chave_teste')
  assert.deepEqual(JSON.parse(seen[0].init.body), { from: 'ClienteMarcado <noreply@clientemarcado.com.br>', to: ['a@b.com'], subject: 'Assunto', html: '<p>oi</p>' })
  assert.equal((await mk(json(200, {})).env.enviar(msg, 'k')).tipo, 'incerto')
  assert.equal((await mk(json(200, 'nao-json')).env.enviar(msg, 'k')).tipo, 'incerto')
  for (const st of [429, 409, 500, 502, 503]) assert.equal((await mk(json(st, { name: 'x' })).env.enviar(msg, 'k')).tipo, 'incerto', String(st))
  assert.deepEqual(await mk(json(403, { name: 'invalid_from_address', message: 'segredo?' })).env.enviar(msg, 'k'), { tipo: 'rejeitado', http: 403, codigo: 'invalid_from_address' })
  assert.deepEqual(await mk(json(422, { name: 'validation_error' })).env.enviar(msg, 'k'), { tipo: 'rejeitado', http: 422, codigo: 'validation_error' })
  assert.equal((await mk(json(400, 'texto')).env.enviar(msg, 'k')).codigo, 'sem_codigo')
  assert.equal((await mk(new TypeError('fetch failed')).env.enviar(msg, 'k')).tipo, 'incerto')
  const timeout = Object.assign(new Error('t'), { name: 'TimeoutError' })
  assert.deepEqual(await mk(timeout).env.enviar(msg, 'k'), { tipo: 'incerto', motivo: 'TimeoutError' })
})

// ------------------------------------------------------------------ adaptador de banco + painel
test('18) o painel recebe os ultimos convites com e-mail MASCARADO e sem token, hash nem ids', async () => {
  const c = cenario()
  await c.criar()
  const lista = await ultimosConvites(c.db, 'perfil-1', 3)
  assert.equal(lista.length, 3)
  const texto = JSON.stringify(lista)
  for (const proibido of ['token_hash', 'anapirelli1988@gmail.com', 'ana@exemplo.com', 'conv-', 'ana-1', sha256('token-da-ana')]) assert.equal(texto.includes(proibido), false, proibido)
  assert.equal(lista[0].status, 'pendente')
  assert.equal(lista[0].email_status, 'solicitado')
  assert.equal(mascararEmail('anapirelli1988@gmail.com'), 'a***@g***.com')
  assert.equal(mascararEmail('sem-arroba'), 's***@***')
})

test('19) o convite pendente de OUTRO perfil nunca e tocado, mesmo com varios envios e falhas', async () => {
  const c = cenario({ roteiro: [{ tipo: 'aceito' }, { tipo: 'rejeitado', http: 422, codigo: 'x' }, { tipo: 'incerto', motivo: 'a' }, { tipo: 'incerto', motivo: 'a' }] })
  await c.criar(); c.relogio.avancar(120)
  await c.criar(); c.relogio.avancar(120)
  await c.criar()
  assert.ok(intacto(c.db, ['outro-1', 'hist-1']))
})
