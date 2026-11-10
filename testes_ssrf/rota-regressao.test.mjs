// REGRESSAO DIFERENCIAL: as respostas (status e JSON) da rota NOVA, com autenticacao valida e o fetcher simulado, sao IDENTICAS as do route.ts ORIGINAL (golden gerado do original
// com fetch simulado). Cobre YouTube (watch/shorts/youtu.be), TikTok, Spotify, paginas genericas (og/JSON-LD/title/vazia), Shopee, Mercado Livre, Kiwify, eventos, erros e entradas invalidas.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registrarCarregador, url } from './suporte/registrar.mjs'
registrarCarregador({ 'next/server': url('./next-server-stub.mjs'), 'seguranca/fetch-seguro': url('./fetcher-falso.mjs'), 'auth-bearer-servidor': url('./auth-falso.mjs') })
const { POST } = await import('../app/api/catalogo/preview-link/route.ts')
const { CASOS, CASOS_INVALIDOS } = await import('./suporte/fixtures.mjs')
const golden = JSON.parse(readFileSync(new URL('./rota-regressao.golden.json', import.meta.url), 'utf8'))
const BEARER = 'Bearer eyJhbGciOiJIUzI1NiJ9.token-de-teste-da-sessao.assinatura-de-teste'

test('o golden cobre todos os casos de fixtures (validos e invalidos) e inclui sucesso, parcial, fallback e 400', () => {
  assert.equal(golden.length, CASOS.length + CASOS_INVALIDOS.length); assert.ok(golden.length >= 27)
  for (const [rotulo, pred] of [['sucesso', (c) => c.corpo.success === true], ['parcial', (c) => c.corpo.partial === true], ['fallback', (c) => c.corpo.success === false && c.status === 200], ['400', (c) => c.status === 400]]) assert.ok(golden.some(pred), rotulo)
  for (const plataforma of ['tiktok', 'spotify', 'shopee', 'mercadolivre', 'kiwify', 'site']) assert.ok(golden.some((c) => c.corpo.platform === plataforma), plataforma)
})
for (const caso of golden) {
  test(`regressao: ${caso.id} -> mesmo status e mesmo JSON do route original`, async () => {
    const r = await POST(new Request('http://localhost/api/catalogo/preview-link', { method: 'POST', headers: { 'content-type': 'application/json', authorization: BEARER }, body: JSON.stringify(caso.entrada) }))
    assert.equal(r.status, caso.status); assert.deepEqual(await r.json(), caso.corpo)
  })
}
test('contrato JSON: toda resposta tem success booleano; sucesso traz as chaves que as 4 telas leem; fallback traz titulo_fallback quando ha nome na URL', async () => {
  const chavesSucesso = ['success', 'partial', 'platform', 'tipo_destino', 'message', 'titulo', 'descricao', 'imagem_url', 'imagens_extras', 'url']
  for (const c of golden) { assert.equal(typeof c.corpo.success, 'boolean', c.id); if (c.corpo.success && c.id.startsWith('generico')) for (const k of chavesSucesso) assert.ok(k in c.corpo, c.id + ':' + k) }
  assert.ok(golden.find((c) => c.id === 'shopee-403').corpo.titulo_fallback)
})
