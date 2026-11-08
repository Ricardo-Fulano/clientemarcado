// Comportamento do modulo de servidor do Pix com um rpc INJETADO (sem rede, sem Supabase). O banco real e as funcoes SQL sao testados a parte (ver evidencias).
import test from 'node:test'
import assert from 'node:assert/strict'
import * as S from '../app/lib/pix-servidor.ts'

const LINHA_RESUMO = { titulo: 'Receber por Pix', descricao: 'Pague aqui', ordem: 2 }
const LINHA_CODIGO = { titulo: 'Receber por Pix', descricao: null, payload: '0002012658...' }
const espiao = (resposta) => { const chamadas = []; const rpc = async (nome, slug) => { chamadas.push([nome, slug]); if (resposta instanceof Error) throw resposta; return resposta }; return { rpc, chamadas } }

test('slug: mesmo criterio do banco (1-80, sem controle/espaco e sem / \\ ? # % @ < > " \' `)', () => {
  for (const ok of ['maria', 'a', 'anakbeautystudio-', 'Ana.Silva_2', 'x'.repeat(80), 'josé']) assert.equal(S.slugPixValido(ok), true, ok)
  for (const ruim of ['', ' ', 'a b', 'a/b', 'a\\b', 'a?b', 'a#b', 'a%b', '@maria', '<x>', 'a"b', "a'b", 'a`b', 'a\nb', 'a\u0000b', 'a\tb', 'x'.repeat(81), null, undefined, 5, {}, []]) assert.equal(S.slugPixValido(ruim), false, JSON.stringify(ruim))
})
test('chama SOMENTE a funcao certa, com o slug, uma vez; slug invalido NUNCA chega ao banco', async () => {
  let e = espiao({ data: [LINHA_RESUMO], error: null }); assert.deepEqual(await S.buscarResumoPix('maria', e.rpc), { titulo: 'Receber por Pix', descricao: 'Pague aqui', ordem: 2 }); assert.deepEqual(e.chamadas, [['pix_publico_resumo', 'maria']])
  e = espiao({ data: [LINHA_CODIGO], error: null }); assert.deepEqual(await S.buscarCodigoPix('maria', e.rpc), { titulo: 'Receber por Pix', descricao: null, payload: '0002012658...' }); assert.deepEqual(e.chamadas, [['pix_publico_codigo', 'maria']])
  for (const ruim of ["' or '1'='1", 'a/b', '', null, undefined, 'x'.repeat(81), '..%2f..', 'a;drop table x']) { const x = espiao({ data: [LINHA_RESUMO], error: null }); assert.equal(await S.buscarResumoPix(ruim, x.rpc), null); assert.equal(await S.buscarCodigoPix(ruim, x.rpc), null); assert.equal(x.chamadas.length, 0, String(ruim)) }
})
test('so UMA linha valida e aceita: vazio, erro, varias linhas (listagem), formato inesperado e excecao => null, sem lancar', async () => {
  for (const resp of [{ data: [], error: null }, { data: null, error: null }, { data: [LINHA_RESUMO], error: { message: 'x' } }, { data: [LINHA_RESUMO, LINHA_RESUMO], error: null }, { data: LINHA_RESUMO, error: null }, { data: 'texto', error: null }, { data: [null], error: null }, { data: [5], error: null }]) { const e = espiao(resp); assert.equal(await S.buscarResumoPix('maria', e.rpc), null); assert.equal(await S.buscarCodigoPix('maria', e.rpc), null) }
  const e = espiao(new Error('rede caiu')); await assert.doesNotReject(() => S.buscarCodigoPix('maria', e.rpc)); assert.equal(await S.buscarCodigoPix('maria', e.rpc), null)
})
test('campos obrigatorios e tipos: titulo/ordem (resumo) e titulo/payload (codigo); descricao ausente vira null', async () => {
  for (const linha of [{ descricao: 'x', ordem: 1 }, { titulo: 5, ordem: 1 }, { titulo: 'x', ordem: '1' }, { titulo: 'x' }]) assert.equal(await S.buscarResumoPix('maria', espiao({ data: [linha], error: null }).rpc), null)
  for (const linha of [{ titulo: 'x' }, { titulo: 'x', payload: 5 }, { payload: 'x' }]) assert.equal(await S.buscarCodigoPix('maria', espiao({ data: [linha], error: null }).rpc), null)
  assert.deepEqual(await S.buscarResumoPix('maria', espiao({ data: [{ titulo: 'x', ordem: 0 }], error: null }).rpc), { titulo: 'x', descricao: null, ordem: 0 })
})
test('PRIVACIDADE: mesmo que o banco devolvesse mais campos (user_id, id, ativo...), so os campos publicos saem', async () => {
  const extra = { ...LINHA_RESUMO, user_id: 'u-1', id: 'i-1', ativo: true, tipo_chave: 'cpf' }
  assert.deepEqual(Object.keys(await S.buscarResumoPix('maria', espiao({ data: [extra], error: null }).rpc)).sort(), ['descricao', 'ordem', 'titulo'])
  assert.deepEqual(Object.keys(await S.buscarCodigoPix('maria', espiao({ data: [{ ...LINHA_CODIGO, user_id: 'u-1', nome_recebedor: 'X' }], error: null }).rpc)).sort(), ['descricao', 'payload', 'titulo'])
})
test('sem a chave de servidor o Pix nao aparece e NAO ha fallback para a chave publica (anon)', async () => {
  const guardar = { u: process.env.NEXT_PUBLIC_SUPABASE_URL, s: process.env.SUPABASE_SERVICE_ROLE_KEY, a: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:9'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'; delete process.env.SUPABASE_SERVICE_ROLE_KEY
    assert.equal(await S.buscarResumoPix('maria'), null); assert.equal(await S.buscarCodigoPix('maria'), null) // rpc undefined => env: sem service key => null, sem rede
    assert.equal(await S.buscarResumoPix('maria', null), null)
    delete process.env.NEXT_PUBLIC_SUPABASE_URL; process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    assert.equal(await S.buscarCodigoPix('maria'), null) // sem URL tambem null
  } finally { for (const [k, v] of [['NEXT_PUBLIC_SUPABASE_URL', guardar.u], ['SUPABASE_SERVICE_ROLE_KEY', guardar.s], ['NEXT_PUBLIC_SUPABASE_ANON_KEY', guardar.a]]) { if (v === undefined) delete process.env[k]; else process.env[k] = v } }
})
