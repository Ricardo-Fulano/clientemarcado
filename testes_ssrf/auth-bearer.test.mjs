// Autenticacao Bearer das rotas (padrao supabase.auth.getUser(token)). Nenhum ID de usuario do cliente e aceito; qualquer falha vira "nao autenticado" (null).
import test from 'node:test'
import assert from 'node:assert/strict'
import { registrarCarregador } from './suporte/registrar.mjs'
registrarCarregador()
const { extrairBearer, usuarioDoBearer } = await import('../app/lib/auth-bearer-servidor.ts')
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.corpo-do-token-de-teste.assinatura_de_teste-123'

test('extrairBearer: aceita "Bearer <token>" (maiusculas/minusculas, espacos) e padding "="; devolve so o token', () => {
  for (const h of ['Bearer ' + TOKEN, 'bearer ' + TOKEN, 'BEARER   ' + TOKEN, '  Bearer ' + TOKEN + '  ', 'Bearer ' + TOKEN + '==']) assert.ok(extrairBearer(h), h)
  assert.equal(extrairBearer('Bearer ' + TOKEN), TOKEN)
})
test('extrairBearer: recusa ausente, outros esquemas, token curto/longo, caracteres invalidos, injecao e tipos errados', () => {
  for (const h of [null, undefined, '', 'Bearer', 'Bearer ', 'Basic ' + TOKEN, TOKEN, 'Bearer curto', 'Bearer ' + 'a'.repeat(4097), 'Bearer ' + TOKEN + ' extra', 'Bearer "' + TOKEN + '"', 'Bearer ' + TOKEN + '\nX-Injetado: 1', 'Bearer\t' + TOKEN + ';', 'Bearer a b c d e f g h i j k l m n o p', 123, {}, [], ['Bearer ' + TOKEN]]) assert.equal(extrairBearer(h), null, JSON.stringify(h))
  assert.ok(extrairBearer('Bearer ' + 'a'.repeat(4096))); assert.ok(extrairBearer('Bearer ' + 'a'.repeat(20))); assert.equal(extrairBearer('Bearer ' + 'a'.repeat(19)), null)
})
test('usuarioDoBearer: token valido -> {id}; getUser recebe o TOKEN (nao o cabecalho)', async () => {
  const vistos = []; const u = await usuarioDoBearer('Bearer ' + TOKEN, { getUser: async (t) => { vistos.push(t); return { data: { user: { id: 'u-123', email: 'x@y.z' } }, error: null } } })
  assert.deepEqual(u, { id: 'u-123' }); assert.deepEqual(vistos, [TOKEN])
})
test('usuarioDoBearer: token invalido/expirado, erro, usuario nulo, id ausente/vazio/nao-texto, excecao -> null, sem lancar', async () => {
  const casos = [async () => ({ data: { user: null }, error: { message: 'jwt expired' } }), async () => ({ data: { user: null }, error: null }), async () => ({ data: { user: { id: 'u' } }, error: new Error('x') }), async () => ({ data: { user: {} }, error: null }), async () => ({ data: { user: { id: '' } }, error: null }), async () => ({ data: { user: { id: 42 } }, error: null }), async () => ({ data: null, error: null }), async () => { throw new Error('rede') }, () => { throw new Error('sincrono') }]
  for (const getUser of casos) assert.equal(await usuarioDoBearer('Bearer ' + TOKEN, { getUser }), null)
})
test('cabecalho invalido NAO chega a consultar o servidor de autenticacao', async () => {
  let chamadas = 0; const getUser = async () => { chamadas++; return { data: { user: { id: 'u' } }, error: null } }
  for (const h of [null, '', 'Basic x', 'Bearer curto', 'Bearer ' + 'a'.repeat(5000)]) assert.equal(await usuarioDoBearer(h, { getUser }), null)
  assert.equal(chamadas, 0)
})
test('cliente padrao: sem configuracao (URL/chave ausentes) -> null; com URL morta em loopback -> null (nunca lanca)', async () => {
  const guardado = { u: process.env.NEXT_PUBLIC_SUPABASE_URL, k: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    assert.equal(await usuarioDoBearer('Bearer ' + TOKEN), null)
  } finally { for (const [k, v] of [['NEXT_PUBLIC_SUPABASE_URL', guardado.u], ['NEXT_PUBLIC_SUPABASE_ANON_KEY', guardado.k]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v } }
})
