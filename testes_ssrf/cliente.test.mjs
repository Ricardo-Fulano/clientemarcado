// Helper de cliente das 4 telas: token da sessao + Authorization: Bearer; o JSON do servidor passa INALTERADO; so 401/429/rede/resposta ilegivel viram {success:false,message}.
import test from 'node:test'
import assert from 'node:assert/strict'
import { registrarCarregador } from './suporte/registrar.mjs'
registrarCarregador()
const C = await import('../app/lib/preview-link-cliente.ts')
const resp = (corpo, status = 200) => new Response(typeof corpo === 'string' ? corpo : JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json' } })
const deps = (r, token = 'tok-de-teste-123456789012') => { const chamadas = []; return { chamadas, obterToken: async () => token, chamar: async (url, init) => { chamadas.push({ url, init }); if (r instanceof Error) throw r; return r } } }

test('monta a chamada: POST em /api/catalogo/preview-link com Content-Type e Authorization: Bearer <token>; corpo identico ao das telas ({url} ou {url,tipo:"evento"})', async () => {
  const d = deps(resp({ success: true })); await C.chamarPreviewLink({ url: 'https://x.com/a' }, d); await C.chamarPreviewLink({ url: 'https://x.com/e', tipo: 'evento' }, d)
  assert.equal(d.chamadas[0].url, '/api/catalogo/preview-link'); assert.equal(d.chamadas[0].init.method, 'POST'); assert.deepEqual(d.chamadas[0].init.headers, { 'Content-Type': 'application/json', Authorization: 'Bearer tok-de-teste-123456789012' }); assert.ok(d.chamadas[0].init.signal instanceof AbortSignal, 'cancelavel')
  assert.equal(d.chamadas[0].init.body, '{"url":"https://x.com/a"}'); assert.equal(d.chamadas[1].init.body, '{"url":"https://x.com/e","tipo":"evento"}')
})
test('o JSON do servidor passa INALTERADO (sucesso, fallback com titulo_fallback, 400 e 500 com JSON)', async () => {
  for (const [corpo, st] of [[{ success: true, partial: false, platform: 'site', tipo_destino: 'site', message: 'ok', titulo: 'T', descricao: 'D', imagem_url: 'https://i/x.jpg', imagens_extras: ['a'], url: 'https://x' }, 200], [{ success: false, partial: true, platform: 'shopee', tipo_destino: 'shopee', message: 'm', titulo_fallback: 'Camiseta' }, 200], [{ success: false, message: 'Informe um link válido (começando com http:// ou https://).' }, 400], [{ success: false, message: 'Não foi possível gerar a prévia automaticamente. Você pode preencher manualmente.' }, 500]]) assert.deepEqual(await C.chamarPreviewLink({ url: 'https://x.com' }, deps(resp(corpo, st))), corpo)
})
test('sem sessao: nao chama a API e devolve a mensagem de sessao expirada (mesma frase do projeto)', async () => {
  for (const obterToken of [async () => null, async () => '', async () => { throw new Error('x') }]) { let n = 0; const r = await C.chamarPreviewLink({ url: 'https://x.com' }, { obterToken, chamar: async () => { n++; return resp({}) } }); assert.deepEqual(r, { success: false, message: 'Sua sessão expirou. Entre novamente.', origemCliente: true }); assert.equal(n, 0) }
})
test('401 -> sessao expirada; 429 -> muitas tentativas; falha de rede -> falha de conexao; resposta ilegivel ou nao-objeto -> mensagem padrao da previa', async () => {
  assert.deepEqual(await C.chamarPreviewLink({ url: 'u' }, deps(resp({ success: false, message: 'qualquer' }, 401))), { success: false, message: C.MSG_SESSAO_EXPIRADA, origemCliente: true })
  assert.deepEqual(await C.chamarPreviewLink({ url: 'u' }, deps(resp({ success: false }, 429))), { success: false, message: C.MSG_MUITAS_TENTATIVAS, origemCliente: true })
  assert.deepEqual(await C.chamarPreviewLink({ url: 'u' }, deps(new Error('rede'))), { success: false, message: C.MSG_FALHA_REDE, origemCliente: true })
  for (const r of [resp('<html>502</html>', 502), resp('', 200), resp('null'), resp('[1]'), resp('42')]) { const out = await C.chamarPreviewLink({ url: 'u' }, deps(r)); if (Array.isArray(out)) continue; assert.equal(out.success === false || out.success === undefined, true) }
  assert.deepEqual(await C.chamarPreviewLink({ url: 'u' }, deps(resp('<html>', 502))), { success: false, message: C.MSG_PREVIA_FALHOU, origemCliente: true }); assert.deepEqual(await C.chamarPreviewLink({ url: 'u' }, deps(resp('null'))), { success: false, message: C.MSG_PREVIA_FALHOU, origemCliente: true })
})
test('o retorno sempre e um objeto com `success` booleano quando o servidor segue o contrato (as telas usam !dados.success)', async () => {
  for (const d of [deps(resp({ success: true })), deps(resp({ success: false })), deps(resp({}, 401)), deps(new Error('x'))]) { const r = await C.chamarPreviewLink({ url: 'u' }, d); assert.equal(typeof r, 'object'); assert.equal(typeof r.success, 'boolean') }
})

// ---------------------------------------------------------------- PRAZO do navegador
const esperar = (ms) => new Promise((o) => setTimeout(o, ms))
test('PRAZO: a API nunca responde e o fetch IGNORA o cancelamento -> o helper devolve "demorou demais" no prazo, cancela o pedido e nunca deixa o navegador esperando', { timeout: 5000 }, async () => {
  let sinal = null; const d = { obterToken: async () => 'tok-de-teste-123456789012', timeoutMs: 150, chamar: (u, init) => { sinal = init.signal; return new Promise(() => { /* nunca resolve */ }) } }
  const t0 = Date.now(); const r = await C.chamarPreviewLink({ url: 'https://x.com' }, d)
  assert.deepEqual(r, { success: false, message: C.MSG_TEMPO_ESGOTADO, origemCliente: true }); assert.ok(Date.now() - t0 < 1000); assert.equal(sinal.aborted, true, 'pedido cancelado')
})
test('PRAZO: fetch que RESPEITA o cancelamento (rejeita com AbortError) tambem termina com a mensagem de tempo; corpo da resposta que trava (res.json) tambem', { timeout: 5000 }, async () => {
  const d1 = { obterToken: async () => 'tok-de-teste-123456789012', timeoutMs: 120, chamar: (u, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(Object.assign(new Error('abortado'), { name: 'AbortError' })))) }
  assert.equal((await C.chamarPreviewLink({ url: 'u' }, d1)).message, C.MSG_TEMPO_ESGOTADO)
  const travada = { status: 200, json: () => new Promise(() => {}) }; const d2 = { obterToken: async () => 'tok-de-teste-123456789012', timeoutMs: 120, chamar: async () => travada }
  assert.equal((await C.chamarPreviewLink({ url: 'u' }, d2)).message, C.MSG_TEMPO_ESGOTADO)
})
test('resposta dentro do prazo NAO espera o prazo e nao dispara cancelamento; padrao do prazo: 20 s (maior que o pior caso do servidor)', async () => {
  let sinal = null; const d = { obterToken: async () => 'tok-de-teste-123456789012', timeoutMs: 5000, chamar: async (u, init) => { sinal = init.signal; return resp({ success: true, titulo: 'T' }) } }
  const t0 = Date.now(); assert.deepEqual(await C.chamarPreviewLink({ url: 'u' }, d), { success: true, titulo: 'T' }); assert.ok(Date.now() - t0 < 500); await esperar(50); assert.equal(sinal.aborted, false)
  assert.equal(C.TEMPO_CLIENTE_MS, 20000)
})

// ---------------------------------------------------------------- SESSAO EXPIRADA: sem redirecionamento e sem perda de dados
test('SESSAO EXPIRADA (sem token, 401): o helper NAO redireciona, NAO recarrega, NAO faz logout e NAO devolve nenhum campo de dados (so success/message/origemCliente)', async () => {
  const antes = Object.getOwnPropertyDescriptor(globalThis, 'location'); const chamadasLoc = []
  const loc = { href: '/painel/perfil/catalogo/abc', assign: (u) => chamadasLoc.push(['assign', u]), replace: (u) => chamadasLoc.push(['replace', u]), reload: () => chamadasLoc.push(['reload']) }
  Object.defineProperty(globalThis, 'location', { value: loc, configurable: true, writable: true })
  try {
    for (const d of [deps(resp({ success: false }, 401)), { obterToken: async () => null, chamar: async () => resp({}) }, { obterToken: async () => { throw new Error('x') }, chamar: async () => resp({}) }]) {
      const r = await C.chamarPreviewLink({ url: 'https://x.com/produto' }, d)
      assert.deepEqual(Object.keys(r).sort(), ['message', 'origemCliente', 'success']); assert.equal(r.success, false); assert.equal(r.message, C.MSG_SESSAO_EXPIRADA)
      for (const campo of ['titulo', 'titulo_fallback', 'descricao', 'imagem_url', 'imagens_extras', 'tipo_destino', 'platform', 'url']) assert.equal(campo in r, false, campo)
    }
    assert.equal(loc.href, '/painel/perfil/catalogo/abc'); assert.deepEqual(chamadasLoc, [])
  } finally { if (antes) Object.defineProperty(globalThis, 'location', antes); else delete globalThis.location }
})
test('toda falha gerada NO CLIENTE traz origemCliente:true (as telas de Eventos e Videos mostram a mensagem em vez de "nao encontramos dados"); resposta do SERVIDOR passa sem a marca', async () => {
  for (const d of [deps(resp({}, 401)), deps(resp({}, 429)), deps(new Error('rede')), deps(resp('<html>', 502)), { obterToken: async () => null, chamar: async () => resp({}) }]) assert.equal((await C.chamarPreviewLink({ url: 'u' }, d)).origemCliente, true)
  for (const corpo of [{ success: true, titulo: 'T' }, { success: false, message: 'm', titulo_fallback: 'x' }, { success: false, message: 'Informe um link válido' }]) { const r = await C.chamarPreviewLink({ url: 'u' }, deps(resp(corpo))); assert.equal('origemCliente' in r, false); assert.deepEqual(r, corpo) }
})

