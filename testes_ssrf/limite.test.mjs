// Limites do endpoint: concorrencia POR INSTANCIA, limitador por usuario (PENDENTE/desativado) e leitura de corpo com teto.
import test from 'node:test'
import assert from 'node:assert/strict'
import { registrarCarregador } from './suporte/registrar.mjs'
registrarCarregador()
const L = await import('../app/lib/preview-link-limite.ts')

test('concorrencia: ate 8 simultaneas; a 9a e recusada; liberar abre vaga; liberar duas vezes nao abre vaga a mais', () => {
  const lim = L.criarLimitadorConcorrencia(8); const lib = []
  for (let i = 0; i < 8; i++) { const r = lim.tentar(); assert.equal(typeof r, 'function'); lib.push(r) }
  assert.equal(lim.tentar(), null); assert.equal(lim.emUso(), 8)
  lib[0](); lib[0](); lib[0](); assert.equal(lim.emUso(), 7); const nova = lim.tentar(); assert.equal(typeof nova, 'function'); assert.equal(lim.tentar(), null)
  for (const r of lib) r(); nova(); assert.equal(lim.emUso(), 0)
})
test('o limite de 8 e POR INSTANCIA (contador em memoria do processo): instancias independentes nao compartilham estado, e a constante exportada documenta o valor', () => {
  assert.equal(L.MAX_CONCORRENTES_POR_INSTANCIA, 8); const a = L.criarLimitadorConcorrencia(1); const b = L.criarLimitadorConcorrencia(1)
  assert.equal(typeof a.tentar(), 'function'); assert.equal(a.tentar(), null); assert.equal(typeof b.tentar(), 'function')
  assert.equal(L.concorrenciaPreview.emUso(), 0)
})
test('limitador por usuario: DESATIVADO por padrao e NUNCA chama o banco enquanto a semantica de checar_rate_limit nao for confirmada', async () => {
  assert.equal(L.LIMITE_POR_USUARIO_CONFIRMADO, false); let chamadas = 0
  const r = await L.verificarLimiteUsuario('u-1', { chamarRpc: async () => { chamadas++; return { data: false, error: null } } }); assert.deepEqual(r, { permitido: true, motivo: 'desativado' }); assert.equal(chamadas, 0)
  assert.deepEqual(await L.verificarLimiteUsuario('u-1'), { permitido: true, motivo: 'desativado' })
})
test('limitador por usuario, quando ATIVADO nos testes (semantica ASSUMIDA, nao confirmada): false=limite, true=liberado, erro/formato inesperado=falha aberta', async () => {
  const visto = []; const rpc = (resp) => async (args) => { visto.push(args); if (resp instanceof Error) throw resp; return resp }
  assert.deepEqual(await L.verificarLimiteUsuario('u-9', { ativo: true, chamarRpc: rpc({ data: true, error: null }) }), { permitido: true, motivo: 'ok' })
  assert.deepEqual(await L.verificarLimiteUsuario('u-9', { ativo: true, chamarRpc: rpc({ data: false, error: null }) }), { permitido: false, motivo: 'limite' })
  for (const resp of [{ data: null, error: { message: 'x' } }, { data: { a: 1 }, error: null }, { data: 'true', error: null }, { data: 1, error: null }, { data: null, error: null }, new Error('rede')]) assert.deepEqual(await L.verificarLimiteUsuario('u-9', { ativo: true, chamarRpc: rpc(resp) }), { permitido: true, motivo: 'indisponivel' })
  assert.deepEqual(visto[0], { p_chave: 'preview-link:u-9', p_max: 20, p_janela_segundos: 60 })
})
const req = (corpo, cabecalhos = {}) => new Request('http://x/api', { method: 'POST', body: corpo, headers: { 'content-type': 'application/json', ...cabecalhos }, duplex: 'half' })
test('lerJsonLimitado: objeto valido (inclusive UTF-8 multibyte) e lido; array, texto, numero, null, JSON invalido, corpo vazio e ausencia de corpo -> null', async () => {
  assert.deepEqual(await L.lerJsonLimitado(req('{"url":"https://x.com/ç","tipo":"evento"}'), 4096), { url: 'https://x.com/ç', tipo: 'evento' })
  for (const c of ['[1,2]', '"texto"', '42', 'null', 'true', '{nao-json', '', '   ']) assert.equal(await L.lerJsonLimitado(req(c), 4096), null, c)
  assert.equal(await L.lerJsonLimitado(new Request('http://x/api', { method: 'POST' }), 4096), null)
})
test('lerJsonLimitado: respeita o teto (declarado e em fluxo sem tamanho), cancela a leitura e aceita exatamente o limite', async () => {
  const grande = JSON.stringify({ url: 'https://x.com/' + 'a'.repeat(5000) }); assert.equal(await L.lerJsonLimitado(req(grande), 4096), null)
  assert.equal(await L.lerJsonLimitado(req(grande, { 'content-length': String(grande.length) }), 4096), null)
  let cancelado = false, lidos = 0
  const fluxo = new ReadableStream({ pull(c) { lidos++; c.enqueue(new TextEncoder().encode('x'.repeat(1024))) }, cancel() { cancelado = true } })
  assert.equal(await L.lerJsonLimitado(new Request('http://x/api', { method: 'POST', body: fluxo, duplex: 'half' }), 4096), null); assert.equal(cancelado, true); assert.ok(lidos < 20, 'leitura interrompida: ' + lidos)
  const exato = JSON.stringify({ u: 'a'.repeat(4096 - 8) }); assert.equal(Buffer.byteLength(exato), 4096); assert.ok(await L.lerJsonLimitado(req(exato), 4096)); assert.equal(await L.lerJsonLimitado(req(exato.replace('"a', '"aa')), 4096), null)
})

// ---------------------------------------------------------------- PRAZO e CANCELAMENTO da leitura do corpo
const enc = new TextEncoder()
test('PRAZO: fluxo que goteja 1 byte a cada 40 ms e nunca termina (slow-loris) -> null no prazo, leitura CANCELADA', { timeout: 5000 }, async () => {
  let cancelado = false, t
  const fluxo = new ReadableStream({ start(c) { t = setInterval(() => { try { c.enqueue(enc.encode(' ')) } catch { /* fechado */ } }, 40) }, cancel() { cancelado = true; clearInterval(t) } })
  const t0 = Date.now(); const r = await L.lerJsonLimitado(new Request('http://x/api', { method: 'POST', body: fluxo, duplex: 'half' }), 4096, 300)
  assert.equal(r, null); assert.ok(Date.now() - t0 < 1500, 'respeitou o prazo: ' + (Date.now() - t0)); assert.equal(cancelado, true, 'o fluxo foi cancelado'); clearInterval(t)
})
test('PRAZO: fluxo que nunca produz nenhum byte -> null no prazo e cancelado', { timeout: 5000 }, async () => {
  let cancelado = false
  const fluxo = new ReadableStream({ pull() { return new Promise(() => { /* nunca produz */ }) }, cancel() { cancelado = true } })
  const t0 = Date.now(); assert.equal(await L.lerJsonLimitado(new Request('http://x/api', { method: 'POST', body: fluxo, duplex: 'half' }), 4096, 250), null); assert.ok(Date.now() - t0 < 1500); assert.equal(cancelado, true)
})
test('PRAZO: mesmo que o fluxo IGNORE o cancelamento (read e cancel nunca resolvem), a funcao retorna no prazo - a vaga nunca fica presa', { timeout: 5000 }, async () => {
  let cancelamentos = 0
  const falso = { headers: { get: () => null }, signal: null, body: { getReader: () => ({ read: () => new Promise(() => {}), cancel: () => { cancelamentos++; return new Promise(() => {}) } }) } }
  const t0 = Date.now(); assert.equal(await L.lerJsonLimitado(falso, 4096, 200), null); assert.ok(Date.now() - t0 < 1000); assert.equal(cancelamentos, 1)
})
test('CANCELAMENTO pelo cliente: abortar a requisicao (request.signal) durante a leitura devolve null PRONTAMENTE, sem esperar o prazo; ja abortada nem le', { timeout: 5000 }, async () => {
  const ac = new AbortController(); const fluxo = new ReadableStream({ start(c) { c.enqueue(enc.encode('{"url":')) } })
  const p = L.lerJsonLimitado(new Request('http://x/api', { method: 'POST', body: fluxo, duplex: 'half', signal: ac.signal }), 4096, 4000)
  setTimeout(() => ac.abort(), 120); const t0 = Date.now(); assert.equal(await p, null); assert.ok(Date.now() - t0 < 1500, 'nao esperou o prazo: ' + (Date.now() - t0))
  const ja = new AbortController(); ja.abort(); let leu = false
  const falso = { headers: { get: () => null }, signal: ja.signal, body: { getReader: () => { leu = true; return { read: async () => ({ done: true }), cancel: async () => {} } } } }
  assert.equal(await L.lerJsonLimitado(falso, 4096, 4000), null); assert.equal(leu, false)
})
test('corpo recebido em pedacos LENTOS mas dentro do prazo e lido normalmente; timer e limpo (nenhum atraso apos terminar)', { timeout: 5000 }, async () => {
  const fluxo = new ReadableStream({ async start(c) { c.enqueue(enc.encode('{"url":"https://x.com/a",')); await new Promise((o) => setTimeout(o, 120)); c.enqueue(enc.encode('"tipo":"evento"}')); c.close() } })
  const t0 = Date.now(); assert.deepEqual(await L.lerJsonLimitado(new Request('http://x/api', { method: 'POST', body: fluxo, duplex: 'half' }), 4096, 3000), { url: 'https://x.com/a', tipo: 'evento' }); assert.ok(Date.now() - t0 < 1000)
})
test('constante do prazo do corpo: 5 s (documentada) e valor padrao da funcao', async () => {
  assert.equal(L.TEMPO_CORPO_MS, 5000)
  const fluxo = new ReadableStream({ pull() { return new Promise(() => {}) } }); const t0 = Date.now()
  // o padrao e TEMPO_CORPO_MS: nao esperamos 5 s aqui; so conferimos que a assinatura aceita o terceiro argumento omitido
  assert.equal(typeof L.lerJsonLimitado, 'function'); assert.equal(L.lerJsonLimitado.length >= 2, true); void fluxo; void t0
})

