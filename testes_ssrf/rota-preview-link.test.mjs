// A ROTA /api/catalogo/preview-link (route.ts novo) com duplos de teste para autenticacao e para o fetcher (nenhuma rede). Valida 401/400/429, ausencia de chamadas externas para entradas bloqueadas
// e o fallback seguro quando a resposta passa do limite (nunca processa HTML truncado).
import test from 'node:test'
import assert from 'node:assert/strict'
import { registrarCarregador, url } from './suporte/registrar.mjs'
registrarCarregador({ 'next/server': url('./next-server-stub.mjs'), 'seguranca/fetch-seguro': url('./fetcher-falso.mjs'), 'auth-bearer-servidor': url('./auth-falso.mjs') })
const { POST } = await import('../app/api/catalogo/preview-link/route.ts')
const fake = await import('./suporte/fetcher-falso.mjs'); const auth = await import('./suporte/auth-falso.mjs'); const limite = await import('../app/lib/preview-link-limite.ts')
const BEARER = 'Bearer eyJhbGciOiJIUzI1NiJ9.token-de-teste-da-sessao.assinatura-de-teste'
const MSG_400 = 'Informe um link válido (começando com http:// ou https://).'
const MSG_401 = 'Sua sessão expirou. Entre novamente.'
const post = async (corpo, cabecalho = BEARER, bruto = false) => { fake.chamadas.length = 0; const r = await POST(new Request('http://localhost/api/catalogo/preview-link', { method: 'POST', headers: { 'content-type': 'application/json', ...(cabecalho ? { authorization: cabecalho } : {}) }, body: bruto ? corpo : JSON.stringify(corpo) })); return { status: r.status, corpo: await r.json() } }

test('401: sem Authorization, esquema errado, token curto/malformado -> 401 {success:false,message}, e NENHUMA chamada externa', async () => {
  for (const h of [null, '', 'Basic abc', 'Bearer', 'Bearer curto', BEARER + ' extra', 'bearer']) { const r = await post({ url: 'https://exemplo.com/' }, h); assert.equal(r.status, 401, String(h)); assert.deepEqual(r.corpo, { success: false, message: MSG_401 }); assert.equal(fake.chamadas.length, 0) }
})
test('o cabecalho Authorization recebido e o que vai para a validacao do token; o corpo NUNCA define quem e o usuario (id/user_id/usuario no corpo sao ignorados)', async () => {
  auth.estado.cabecalhosRecebidos.length = 0; const r = await post({ url: 'https://blog.exemplo.com/post', user_id: 'outro', usuario: { id: 'x' }, id: 'y' }); assert.equal(r.status, 200); assert.deepEqual(auth.estado.cabecalhosRecebidos, [BEARER])
})
test('400 sem rede: URLs invalidas OU bloqueadas (localhost, loopback, privadas, metadados, IP em formas alternativas, IPv6, esquemas, credenciais, portas, hosts internos) -> 400 com a mesma mensagem de sempre e ZERO chamadas externas', async () => {
  const bloqueadas = ['http://localhost/', 'http://localhost:3000/admin', 'http://127.0.0.1/', 'http://0x7f.1/', 'http://2130706433/', 'http://[::1]/', 'http://[::ffff:127.0.0.1]/', 'http://10.0.0.1/', 'http://192.168.0.1/', 'http://172.16.0.1/', 'http://169.254.169.254/latest/meta-data/', 'http://100.100.100.200/', 'http://metadata.google.internal/', 'http://servidor.internal/', 'http://intranet/', 'http://exemplo.com:8080/', 'http://exemplo.com:6379/', 'http://user:pw@exemplo.com/', 'ftp://exemplo.com/', 'file:///etc/passwd', 'javascript:alert(1)', 'gopher://exemplo.com/', 'exemplo.com/sem-protocolo', 'http://', 'http://exem\nplo.com/', 'http://exemplo.com/\u0000x', 'x'.repeat(3000), 'https://exemplo.com/' + 'a'.repeat(2100)]
  for (const u of bloqueadas) { const r = await post({ url: u }); assert.equal(r.status, 400, u); assert.deepEqual(r.corpo, { success: false, message: MSG_400 }, u); assert.equal(fake.chamadas.length, 0, 'chamada externa para ' + u) }
  for (const u of ['', null, 123, {}, [], true, undefined]) { const r = await post({ url: u }); assert.equal(r.status, 400); assert.equal(fake.chamadas.length, 0) }
})
test('corpo invalido, grande demais, nao-objeto ou ausente -> 400 (antes era 500), sem chamadas externas', async () => {
  for (const bruto of ['{nao-json', '[1,2]', '"x"', 'null', '', JSON.stringify({ url: 'https://exemplo.com/' + 'a'.repeat(5000) })]) { const r = await post(bruto, BEARER, true); assert.equal(r.status, 400, bruto.slice(0, 20)); assert.equal(r.corpo.success, false); assert.equal(fake.chamadas.length, 0) }
})
test('tipo: somente "evento" muda o alvo; qualquer outro valor se comporta como produto', async () => { const a = await post({ url: 'https://eventos.exemplo.com/show-2026', tipo: 'evento' }); const b = await post({ url: 'https://eventos.exemplo.com/show-2026', tipo: 'qualquer' }); const c = await post({ url: 'https://eventos.exemplo.com/show-2026' }); assert.deepEqual(b.corpo, c.corpo); assert.equal(a.status, 200) })
test('chamada ao fetcher: cabecalhos so de navegador (sem Authorization/Cookie), prazo total 8 s, teto menor (256 KB) para oEmbed e padrao para a pagina', async () => {
  await post({ url: 'https://blog.exemplo.com/post' }); const g = fake.chamadas[0]; assert.equal(g.url, 'https://blog.exemplo.com/post'); assert.deepEqual(Object.keys(g.op.headers).sort(), ['Accept', 'Accept-Language', 'User-Agent']); assert.equal(g.op.timeoutMs, 8000); assert.equal(g.op.maxBytes, undefined)
  await post({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }); const y = fake.chamadas[0]; assert.match(y.url, /^https:\/\/www\.youtube\.com\/oembed\?url=/); assert.equal(y.op.maxBytes, 256 * 1024)
  for (const c of fake.chamadas) for (const h of Object.keys(c.op.headers || {})) assert.ok(!/authorization|cookie/i.test(h))
})
test('RESPOSTA ACIMA DO LIMITE -> fallback seguro: o corpo e IDENTICO ao de uma falha comum, sem titulo/descricao/imagem, ainda que a pagina (truncada) tivesse meta tags validas', async () => {
  const controle = await post({ url: 'https://loja.exemplo.com.br/produto' }); assert.equal(controle.corpo.success, true, 'controle: a mesma pagina DENTRO do limite gera previa')
  const grande = await post({ url: 'https://grande.exemplo.com/produto' }); const falha = await post({ url: 'https://erro.exemplo.com/produto' })
  assert.equal(grande.status, 200); assert.equal(grande.corpo.success, false); assert.deepEqual(grande.corpo, falha.corpo)
  for (const campo of ['titulo', 'descricao', 'imagem_url', 'imagens_extras']) assert.equal(campo in grande.corpo, false, campo)
  const oembed = await post({ url: 'https://www.youtube.com/watch?v=limite0000x' }); assert.equal(typeof oembed.corpo.success, 'boolean')
})
test('429 por concorrencia (POR INSTANCIA): com as 8 vagas ocupadas a rota responde 429 sem chamar o fetcher; ao liberar, volta a funcionar', async () => {
  const vagas = []; for (let i = 0; i < 8; i++) vagas.push(limite.concorrenciaPreview.tentar())
  try { const r = await post({ url: 'https://blog.exemplo.com/post' }); assert.equal(r.status, 429); assert.deepEqual(r.corpo, { success: false, message: 'Muitas tentativas. Aguarde um minuto e tente novamente.' }); assert.equal(fake.chamadas.length, 0) } finally { for (const v of vagas) v() }
  assert.equal(limite.concorrenciaPreview.emUso(), 0); assert.equal((await post({ url: 'https://blog.exemplo.com/post' })).status, 200)
})
test('a vaga de concorrencia e liberada mesmo quando a rota falha (400, fallback) - sem vazamento de vagas', async () => { for (let i = 0; i < 30; i++) { await post({ url: 'http://localhost/' }); await post({ url: 'https://erro.exemplo.com/x' }); await post('{x', BEARER, true) } assert.equal(limite.concorrenciaPreview.emUso(), 0) })
test('limitador por usuario PENDENTE/desativado: a rota funciona sem acessar o banco', async () => { assert.equal(limite.LIMITE_POR_USUARIO_CONFIRMADO, false); const r = await post({ url: 'https://blog.exemplo.com/post' }); assert.equal(r.status, 200); assert.equal(r.corpo.success, true) })

// ---------------------------------------------------------------- CORPO LENTO / DESCONEXAO: a vaga de concorrencia nunca fica presa
const lenta = (extra = {}) => new Request('http://localhost/api/catalogo/preview-link', { method: 'POST', headers: { 'content-type': 'application/json', authorization: BEARER }, body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{"url":"https://blog.exemplo.com/')) } }), duplex: 'half', ...extra })
test('CORPO LENTO NAO RETEM VAGA: 12 clientes que enviam o corpo em conta-gotas (mais que as 8 vagas) nao ocupam nenhuma vaga; uma requisicao normal passa (200, nao 429); ao esgotar o prazo (5 s) cada lenta recebe 400 e nada vaza', { timeout: 20000 }, async () => {
  const lentas = Array.from({ length: 12 }, () => POST(lenta())); await new Promise((o) => setTimeout(o, 300))
  assert.equal(limite.concorrenciaPreview.emUso(), 0, 'lendo o corpo, a rota ainda nao ocupa vaga')
  const normal = await post({ url: 'https://blog.exemplo.com/post' }); assert.equal(normal.status, 200); fake.chamadas.length = 0
  const t0 = Date.now(); const rs = await Promise.all(lentas)
  for (const x of rs) { assert.equal(x.status, 400); assert.deepEqual(await x.json(), { success: false, message: MSG_400 }) }
  assert.ok(Date.now() - t0 < 6500, 'todas terminaram pelo prazo de ~5 s'); assert.equal(limite.concorrenciaPreview.emUso(), 0); assert.equal(fake.chamadas.length, 0, 'nenhuma busca externa para corpo incompleto')
})
test('cliente que DESCONECTA durante o envio do corpo: a rota responde logo, sem esperar o prazo e sem reter vaga', { timeout: 10000 }, async () => {
  const ac = new AbortController(); const p = POST(lenta({ signal: ac.signal })); setTimeout(() => ac.abort(), 150); const t0 = Date.now(); const x = await p
  assert.equal(x.status, 400); assert.ok(Date.now() - t0 < 2500, 'nao esperou o prazo de 5 s: ' + (Date.now() - t0)); assert.equal(limite.concorrenciaPreview.emUso(), 0); assert.equal(fake.chamadas.length, 0)
})
test('com todas as vagas ocupadas, o corpo e lido ANTES do 429 (cliente lento nao ganha vaga) e a resposta continua sendo 429 para quem tem corpo valido', async () => {
  const vagas = []; for (let i = 0; i < 8; i++) vagas.push(limite.concorrenciaPreview.tentar())
  try { assert.equal((await post({ url: 'https://blog.exemplo.com/post' })).status, 429) } finally { for (const v of vagas) v() }
  assert.equal(limite.concorrenciaPreview.emUso(), 0)
})

