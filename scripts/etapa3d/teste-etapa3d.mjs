// Etapa 3D: harness proprio (node:test, SEM dependencias novas). Rode na raiz do Projeto A, DEPOIS de aplicar a etapa:
//   node --test scripts/etapa3d/teste-etapa3d.mjs          (Node >= 22.18; em 22.6-22.17 acrescente --experimental-strip-types)
// E um .mjs de proposito: nao entra no typecheck nem no build do Next. Nao faz rede, nao usa Supabase, nao le .env.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire, register } from 'node:module'
import * as L from '../../app/lib/oauthConsent.ts'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
// O Node ESM nao resolve 'next/server' (o pacote nao tem "exports") nem detecta seus named exports CJS. Este hook (so do harness) serve
// 'next/server' via createRequire a partir do node_modules do proprio projeto; o middleware.ts NAO e alterado.
// WINDOWS: NENHUM caminho e embutido em texto de codigo (barras invertidas de 'C:\Users\...' viravam escapes e sumiam, gerando
// "C:UsersproftDesktop...package.json"). O caminho chega ao hook como DADO ('initialize'), na forma de file URL (pathToFileURL),
// que usa '/', escapa caracteres especiais e funciona igual em Windows, Linux e macOS.
const PKG_HREF = pathToFileURL(path.join(RAIZ, 'package.json')).href
const FONTE_DO_HOOK = String.raw`
let pkgHref = ''
export function initialize(data) { pkgHref = data.pkgHref }
export async function resolve(spec, ctx, next) {
  if (spec === 'next/server') return { url: 'harness:next-server', shortCircuit: true }
  return next(spec, ctx)
}
export async function load(url, ctx, next) {
  if (url === 'harness:next-server') {
    const source = 'import { createRequire } from "node:module"; const m = createRequire(' + JSON.stringify(pkgHref) + ')("next/server"); export const NextRequest = m.NextRequest; export const NextResponse = m.NextResponse; export default m;'
    return { format: 'module', shortCircuit: true, source }
  }
  return next(url, ctx)
}
`
const nextServer = createRequire(PKG_HREF)('next/server')
register('data:text/javascript,' + encodeURIComponent(FONTE_DO_HOOK), { parentURL: import.meta.url, data: { pkgHref: PKG_HREF } })
const { NextRequest } = nextServer
const { middleware } = await import('../../middleware.ts')

const ler = (rel) => readFileSync(path.join(RAIZ, rel), 'utf8')
const semComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[ \t])\/\/.*$/gm, '$1')
const REQ = 'mcpreq_' + 'a1'.repeat(32)
const CODE = 'mcpac_' + 'b2'.repeat(32)
const GRANT = '3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b'
const consentOk = (over = {}) => ({ ok: true, client_name: 'Claude', client_kind: 'dcr', client_host: null, redirect_host: 'claude.ai', scopes: ['analytics:read', 'sales:read'], account: 'j***@g***.com', expires_in: 500, ...over })
const decideOk = (over = {}) => ({ ok: true, redirect_uri: 'https://claude.ai/api/mcp/auth_callback', code: CODE, state: 'st-1', iss: 'https://mcp.minipage.pro', ...over })
const DADOS = { clienteNome: 'Claude', clienteHost: null, redirectHost: 'claude.ai', escopos: ['analytics:read', 'sales:read'], conta: 'j***@g***.com' }

function deps(over = {}) {
  const calls = { sessao: 0, rpc: [] }
  return {
    calls,
    temSessao: async () => { calls.sessao++; return over.sessao ?? true },
    rpc: async (fn, args) => {
      calls.rpc.push({ fn, args })
      const r = over.rpc ? over.rpc(fn, args) : { data: consentOk(), error: null }
      if (r instanceof Error) throw r
      return r
    },
  }
}

// ------------------------------------------------------------------ Windows: caminho do projeto no hook (regressao)
test('Windows) o caminho chega ao hook como file URL sem perder separadores (regressao ERR_INVALID_ARG_VALUE "C:Users...")', async () => {
  const casos = [
    ['C:\\Users\\proft\\Desktop\\clientemarcado_novo\\package.json', 'file:///C:/Users/proft/Desktop/clientemarcado_novo/package.json'],
    ['D:\\Meus Projetos\\Área de Trabalho\\app #1 100%\\package.json', null],
    ['\\\\servidor\\compartilhada\\proj\\package.json', 'file://servidor/compartilhada/proj/package.json'],
  ]
  for (const [winPath, esperado] of casos) {
    const href = pathToFileURL(winPath, { windows: true }).href // formato Windows, independente do SO em que o teste roda
    if (esperado) assert.equal(href, esperado)
    assert.equal(href.includes('\\'), false, 'file URL nao pode ter barra invertida')
    const hook = await import('data:text/javascript,' + encodeURIComponent(FONTE_DO_HOOK) + '#' + encodeURIComponent(winPath))
    hook.initialize({ pkgHref: href })
    const r = await hook.load('harness:next-server', {}, async () => { throw new Error('nao deveria delegar') })
    const literal = /createRequire\(("(?:[^"\\]|\\.)*")\)/.exec(r.source)
    assert.ok(literal, 'createRequire nao encontrado no modulo gerado')
    assert.equal(JSON.parse(literal[1]), href, 'o valor recebido por createRequire deve ser exatamente a file URL')
    // o erro original era createRequire("C:Users...") => ERR_INVALID_ARG_VALUE; agora o valor e aceito (UNC exige host de arquivo valido so no Windows)
    if (!winPath.startsWith('\\\\')) assert.doesNotThrow(() => createRequire(JSON.parse(literal[1])))
  }
  // o caminho REAL deste projeto (qualquer SO) tambem e uma file URL valida e aponta para o package.json
  assert.equal(fileURLToPath(PKG_HREF), path.join(RAIZ, 'package.json'))
  assert.ok(existsSync(fileURLToPath(PKG_HREF)))
  assert.equal(typeof nextServer.NextRequest, 'function')
})

// ------------------------------------------------------------------ login: retorno OAuth estrito (itens 1-5)
test('1) login sem next -> /painel', () => {
  for (const s of ['', '?', '?foo=1', '?next=']) assert.equal(L.destinoAposLogin(s), '/painel', s)
})
test('2) login com next=/oauth/consent?req=mcpreq_<valido> -> volta ao consentimento (inclusive o formato gerado pelo proprio app)', () => {
  const esperado = '/oauth/consent?req=' + REQ
  assert.equal(L.destinoAposLogin('?next=' + encodeURIComponent('/oauth/consent?req=' + REQ)), esperado)
  assert.equal(L.destinoAposLogin(L.urlLoginParaConsentimento(REQ).split('?')[1] ? '?' + L.urlLoginParaConsentimento(REQ).split('?')[1] : ''), esperado)
  assert.equal(L.urlLoginParaConsentimento(REQ), '/login?next=' + encodeURIComponent('/oauth/consent?req=' + REQ))
})
test('3/4/5) next malicioso, arbitrario ou /painel -> sempre /painel (nunca o valor da query)', () => {
  const ruins = [
    'https://evil.example', 'http://evil.example/x', '//evil.example', '//evil.example/oauth/consent?req=' + REQ, '/\\evil.example', '\\\\evil.example',
    'javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'https:%2F%2Fevil.example', '/painel', '/painel/ia', '/login', '/',
    '/oauth/consent', '/oauth/consent?', '/oauth/consent?req=', '/oauth/consent?req=bad', '/oauth/consent?req=mcpreq_' + 'a'.repeat(63), '/oauth/consent?req=mcpreq_' + 'a'.repeat(65),
    '/oauth/consent?req=mcpreq_' + 'A'.repeat(64), '/oauth/consent?req=mcpreq_' + 'g'.repeat(64), '/oauth/consent?req=' + REQ + '&x=1', '/oauth/consent?x=1&req=' + REQ,
    '/oauth/consent?req=' + REQ + '#frag', '/oauth/consent/?req=' + REQ, '/oauth/consenti?req=' + REQ, '/Oauth/Consent?req=' + REQ, 'oauth/consent?req=' + REQ,
    ' /oauth/consent?req=' + REQ, '/oauth/consent?req=' + REQ + ' ', '/oauth/consent?req=' + REQ + '\n', '/oauth/consent?req=' + REQ + '\r\nX: y',
    '/oauth/consent?req=' + REQ + '/../../evil', 'https://evil.example/oauth/consent?req=' + REQ,
  ]
  for (const r of ruins) assert.equal(L.destinoAposLogin('?next=' + encodeURIComponent(r)), '/painel', JSON.stringify(r))
  // valor RECODIFICADO/reencadeado (duplo encode) e parametro repetido
  const bom = '/oauth/consent?req=' + REQ
  assert.equal(L.destinoAposLogin('?next=' + encodeURIComponent(encodeURIComponent(bom))), '/painel')
  assert.equal(L.destinoAposLogin('?next=' + encodeURIComponent(bom) + '&next=' + encodeURIComponent('https://evil.example')), '/painel')
  assert.equal(L.destinoAposLogin('?next=' + encodeURIComponent('https://evil.example') + '&next=' + encodeURIComponent(bom)), '/painel')
  // o retorno e RECONSTRUIDO (nunca devolve texto da query alem do req validado)
  assert.equal(L.destinoAposLogin('?next=' + encodeURIComponent(bom) + '&utm=x'), bom)
})
test('req da busca: exatamente um req valido', () => {
  assert.equal(L.reqDaBusca('?req=' + REQ), REQ)
  assert.equal(L.reqDaBusca('?req=' + REQ + '&utm=1'), REQ) // extras sao ignorados (nunca repassados)
  for (const s of ['', '?req=', '?req=x', '?req=' + REQ + '&req=' + REQ, '?REQ=' + REQ, '?req=' + REQ.toUpperCase(), '?req=' + REQ + '%0a']) assert.equal(L.reqDaBusca(s), null, s)
})

// ------------------------------------------------------------------ consentimento: inicio (itens 6-11)
test('6) req invalido -> nao consulta sessao nem RPC', async () => {
  for (const s of ['', '?req=lixo', '?req=' + REQ.slice(0, -1), '?req=' + REQ + '&req=' + REQ]) {
    const d = deps()
    assert.deepEqual(await L.iniciarConsentimento(s, d), { tipo: 'invalido' })
    assert.equal(d.calls.sessao, 0)
    assert.equal(d.calls.rpc.length, 0)
  }
})
test('7) req valido sem sessao -> login com retorno seguro (sem RPC), e o login devolve ao consentimento', async () => {
  const d = deps({ sessao: false })
  const r = await L.iniciarConsentimento('?req=' + REQ + '&utm=x', d)
  assert.equal(r.tipo, 'login')
  assert.equal(r.url, '/login?next=' + encodeURIComponent('/oauth/consent?req=' + REQ))
  assert.equal(d.calls.rpc.length, 0)
  assert.equal(L.destinoAposLogin('?' + r.url.split('?')[1]), '/oauth/consent?req=' + REQ)
  assert.equal(r.url.includes('utm'), false) // preserva SOMENTE o req
})
test('com sessao: chama mcp_consent_get SO com o req e mostra somente o que a RPC devolveu', async () => {
  const d = deps()
  const r = await L.iniciarConsentimento('?req=' + REQ, d)
  assert.equal(r.tipo, 'pronto')
  assert.deepEqual(d.calls.rpc, [{ fn: 'mcp_consent_get', args: { p_request_token: REQ } }])
  assert.deepEqual(r.dados, { clienteNome: 'Claude', clienteHost: null, redirectHost: 'claude.ai', escopos: ['analytics:read', 'sales:read'], conta: 'j***@g***.com' })
  assert.deepEqual(Object.keys(r.dados).sort(), ['clienteHost', 'clienteNome', 'conta', 'escopos', 'redirectHost'])
})
test('8) usuario diferente / sessao invalida / banco rejeita -> erro seguro ou login (sem expor nada)', async () => {
  let r = await L.iniciarConsentimento('?req=' + REQ, deps({ rpc: () => ({ data: { ok: false, error: 'request_invalid' }, error: null }) }))
  assert.deepEqual(r, { tipo: 'erro', codigo: 'request_invalid' })
  r = await L.iniciarConsentimento('?req=' + REQ, deps({ rpc: () => ({ data: { ok: false, error: 'unauthenticated' }, error: null }) }))
  assert.equal(r.tipo, 'login')
  r = await L.iniciarConsentimento('?req=' + REQ, deps({ rpc: () => ({ data: null, error: { code: 'PGRST301', message: 'JWT expired' } }) }))
  assert.equal(r.tipo, 'login')
})
test('9) request expirado -> mensagem segura (sem o req, sem jargao tecnico)', async () => {
  const r = await L.iniciarConsentimento('?req=' + REQ, deps({ rpc: () => ({ data: { ok: false, error: 'request_invalid' }, error: null }) }))
  assert.equal(r.codigo, 'request_invalid')
  const m = L.MENSAGENS.request_invalid
  assert.match(m.texto, /expirou|já foi usado/)
  for (const k of Object.keys(L.MENSAGENS)) assert.doesNotMatch(JSON.stringify(L.MENSAGENS[k]), /oauth|mcp|token|grant|user_id|req\b|PGRST|SQL/i, k)
})
test('10) beta bloqueada -> mensagem apropriada e segura', async () => {
  const r = await L.iniciarConsentimento('?req=' + REQ, deps({ rpc: () => ({ data: { ok: false, error: 'beta_required' }, error: null }) }))
  assert.deepEqual(r, { tipo: 'erro', codigo: 'beta_required' })
  assert.match(L.MENSAGENS.beta_required.texto, /fase de testes/)
})
test('11) plano nao elegivel (Free/MiniPage) -> mensagem segura; a regra de plano NAO e reimplementada no navegador', async () => {
  const r = await L.iniciarConsentimento('?req=' + REQ, deps({ rpc: () => ({ data: { ok: false, error: 'plan_required' }, error: null }) }))
  assert.deepEqual(r, { tipo: 'erro', codigo: 'plan_required' })
  assert.match(L.MENSAGENS.plan_required.texto, /Loja, Pro e Equipe/)
  assert.doesNotMatch(ler('app/oauth/consent/page.tsx') + ler('app/painel/ia/page.tsx') + ler('app/lib/oauthConsent.ts'), /plano_tipo|essencial|permiteMcp|permiteIntegracoes/)
})
test('falhas de rede/respostas estranhas -> erro seguro', async () => {
  assert.deepEqual(await L.iniciarConsentimento('?req=' + REQ, deps({ rpc: () => ({ data: null, error: { code: '500', message: 'x' } }) })), { tipo: 'erro', codigo: 'rede' })
  assert.deepEqual(await L.iniciarConsentimento('?req=' + REQ, deps({ rpc: () => new Error('boom ' + REQ) })), { tipo: 'erro', codigo: 'rede' })
  for (const data of [null, 'x', 7, [], {}, { ok: true }, { ok: 'true' }, { ok: false }, { ok: false, error: { x: 1 } }, consentOk({ scopes: ['admin:all'] }), consentOk({ scopes: [] }), consentOk({ redirect_host: '' })]) {
    const r = await L.iniciarConsentimento('?req=' + REQ, deps({ rpc: () => ({ data, error: null }) }))
    assert.equal(r.tipo, 'erro', JSON.stringify(data))
    assert.ok(['resposta_invalida', 'inesperado'].includes(r.codigo), JSON.stringify(data))
  }
})
test('escopos: so os reconhecidos aparecem (e sao os unicos enviados de volta); texto do banco e higienizado', async () => {
  const r = await L.iniciarConsentimento('?req=' + REQ, deps({ rpc: () => ({ data: consentOk({ scopes: ['analytics:read', 'admin:all', 'analytics:read', 7, 'constructor'], client_name: '  Meu\u202eApp\u0000<img src=x onerror=alert(1)>  ', account: 'a\nb' }), error: null }) }))
  assert.deepEqual(r.dados.escopos, ['analytics:read'])
  assert.equal(r.dados.clienteNome, 'MeuApp<img src=x onerror=alert(1)>') // sem controles/bidi; o React escapa o resto na renderizacao
  assert.equal(r.dados.conta, 'ab')
  assert.equal(L.limparTexto('x'.repeat(500), 100).length, 100)
  assert.equal(L.ESCOPOS['analytics:read'].texto, 'Ver métricas de desempenho da sua MiniPage, como visualizações, cliques e itens mais acessados.')
  assert.equal(L.ESCOPOS['sales:read'].texto, 'Ver resumos de vendas externas conectadas, sem dados pessoais de compradores.')
})

// ------------------------------------------------------------------ decisao (itens 12-13)
test('autorizar: envia SOMENTE req, approve e os escopos exibidos (nenhum user_id); cancelar envia approve=false', async () => {
  let d = deps({ rpc: () => ({ data: decideOk(), error: null }) })
  let r = await L.decidirConsentimento(REQ, { ...DADOS, escopos: ['analytics:read'] }, true, d)
  assert.deepEqual(d.calls.rpc, [{ fn: 'mcp_consent_decide', args: { p_request_token: REQ, p_approve: true, p_scopes: ['analytics:read'] } }])
  assert.equal(r.tipo, 'redirect')
  const u = new URL(r.url)
  assert.equal(`${u.origin}${u.pathname}`, 'https://claude.ai/api/mcp/auth_callback')
  assert.deepEqual(Object.fromEntries(u.searchParams), { code: CODE, state: 'st-1', iss: 'https://mcp.minipage.pro' })
  d = deps({ rpc: () => ({ data: decideOk({ code: undefined, error: 'access_denied' }), error: null }) })
  r = await L.decidirConsentimento(REQ, DADOS, false, d)
  assert.deepEqual(d.calls.rpc, [{ fn: 'mcp_consent_decide', args: { p_request_token: REQ, p_approve: false, p_scopes: null } }])
  assert.deepEqual(Object.fromEntries(new URL(r.url).searchParams), { error: 'access_denied', state: 'st-1', iss: 'https://mcp.minipage.pro' })
  for (const c of d.calls.rpc) assert.equal(Object.keys(c.args).some((k) => /user|perfil|grant/i.test(k)), false)
})
test('12) decisao duplicada: a trava garante UMA chamada (duplo clique, concorrencia e repeticao apos sucesso)', async () => {
  const d = deps({ rpc: () => ({ data: decideOk(), error: null }) })
  const trava = L.criarTrava()
  const run = () => trava(() => L.decidirConsentimento(REQ, DADOS, true, d))
  const [a, b, c] = await Promise.all([run(), run(), run()])
  assert.equal(d.calls.rpc.length, 1)
  assert.equal(a, b); assert.equal(b, c)
  await run()
  assert.equal(d.calls.rpc.length, 1)
  // erro de rede (retentavel) libera uma nova tentativa; erro do banco (request_invalid = ja decidido) NAO
  let n = 0
  const d2 = deps({ rpc: () => (++n === 1 ? { data: null, error: { code: 'x' } } : { data: decideOk(), error: null }) })
  const t2 = L.criarTrava()
  assert.deepEqual(await t2(() => L.decidirConsentimento(REQ, DADOS, true, d2)), { tipo: 'erro', codigo: 'rede', retentavel: true })
  assert.equal((await t2(() => L.decidirConsentimento(REQ, DADOS, true, d2))).tipo, 'redirect')
  const d3 = deps({ rpc: () => ({ data: { ok: false, error: 'request_invalid' }, error: null }) })
  const t3 = L.criarTrava()
  await t3(() => L.decidirConsentimento(REQ, DADOS, true, d3)); await t3(() => L.decidirConsentimento(REQ, DADOS, true, d3))
  assert.equal(d3.calls.rpc.length, 1)
})
test('12b) o banco recusa a segunda decisao (request_invalid) -> mensagem segura, nenhum redirect', async () => {
  const r = await L.decidirConsentimento(REQ, DADOS, true, deps({ rpc: () => ({ data: { ok: false, error: 'request_invalid' }, error: null }) }))
  assert.deepEqual(r, { tipo: 'erro', codigo: 'request_invalid', retentavel: false })
})
test('13) redirect devolvido invalido -> NAO navega (resposta_invalida)', async () => {
  const ruins = {
    'javascript:': { redirect_uri: 'javascript:alert(1)' }, 'data:': { redirect_uri: 'data:text/html,x' }, 'ftp': { redirect_uri: 'ftp://claude.ai/cb' },
    'http externo': { redirect_uri: 'http://claude.ai/api/mcp/auth_callback' }, 'host diferente do exibido': { redirect_uri: 'https://evil.example/cb' },
    'userinfo': { redirect_uri: 'https://claude.ai@evil.example/cb' }, 'userinfo2': { redirect_uri: 'https://user:pw@claude.ai/cb' }, 'fragmento': { redirect_uri: 'https://claude.ai/cb#x' },
    'barra invertida': { redirect_uri: 'https://claude.ai\\@evil.example/cb' }, 'espaco': { redirect_uri: 'https://claude.ai/c b' }, 'quebra de linha': { redirect_uri: 'https://claude.ai/cb\n' },
    'relativo': { redirect_uri: '/api/mcp/auth_callback' }, 'protocolo-relativo': { redirect_uri: '//evil.example/cb' }, 'vazio': { redirect_uri: '' }, 'nao string': { redirect_uri: 5 }, 'ausente': { redirect_uri: undefined },
    'longo': { redirect_uri: 'https://claude.ai/' + 'a'.repeat(600) },
    'loopback sem porta': { redirect_uri: 'http://127.0.0.1/cb' }, 'loopback com host diferente': { redirect_uri: 'http://127.0.0.1:9/cb' },
    'iss ausente': { iss: undefined }, 'iss errado': { iss: 'https://evil.example' }, 'iss com barra': { iss: 'https://mcp.minipage.pro/' },
    'code mal formado': { code: 'mcpac_curto' }, 'code ausente': { code: undefined }, 'code nao string': { code: 7 }, 'erro junto do code': { error: 'access_denied' },
    'state longo': { state: 'x'.repeat(513) }, 'state nao string': { state: { a: 1 } },
  }
  for (const [nome, over] of Object.entries(ruins)) {
    const r = await L.decidirConsentimento(REQ, DADOS, true, deps({ rpc: () => ({ data: decideOk(over), error: null }) }))
    assert.deepEqual(r, { tipo: 'erro', codigo: 'resposta_invalida', retentavel: false }, nome)
  }
  // cancelamento: precisa de error=access_denied e NAO pode trazer code
  for (const over of [{ code: CODE, error: 'access_denied' }, { code: undefined, error: 'server_error' }, { code: undefined, error: undefined }]) {
    const r = await L.decidirConsentimento(REQ, DADOS, false, deps({ rpc: () => ({ data: decideOk(over), error: null }) }))
    assert.equal(r.tipo, 'erro', JSON.stringify(over))
  }
  for (const data of [null, 'x', [], { ok: false, error: 'x' }, { ok: true }]) {
    assert.equal((await L.decidirConsentimento(REQ, DADOS, true, deps({ rpc: () => ({ data, error: null }) }))).tipo, 'erro')
  }
})
test('13b) redirects validos: https aprovado, loopback com porta (127.0.0.1, localhost, [::1]) e caminho preservado', async () => {
  const casos = [['https://claude.ai/api/mcp/auth_callback', 'claude.ai'], ['https://chatgpt.com/connector/oauth/abc123', 'chatgpt.com'], ['http://127.0.0.1:53682/callback', '127.0.0.1:53682'], ['http://localhost:8080/cb', 'localhost:8080'], ['http://[::1]:9000/cb', '[::1]:9000']]
  for (const [uri, host] of casos) {
    const r = await L.decidirConsentimento(REQ, { ...DADOS, redirectHost: host }, true, deps({ rpc: () => ({ data: decideOk({ redirect_uri: uri }), error: null }) }))
    assert.equal(r.tipo, 'redirect', uri)
    assert.equal(new URL(r.url).host, host)
    assert.equal(new URL(r.url).pathname, new URL(uri).pathname)
  }
  // comparacao de host sem diferenca de maiusculas; state ausente/nulo nao gera parametro
  const r = await L.decidirConsentimento(REQ, { ...DADOS, redirectHost: 'Claude.AI' }, true, deps({ rpc: () => ({ data: decideOk({ state: null }), error: null }) }))
  assert.equal(new URL(r.url).searchParams.has('state'), false)
  assert.equal(new URL(r.url).searchParams.get('iss'), 'https://mcp.minipage.pro')
})
test('decisao: sessao expirada -> login; req invalido nunca chega a RPC; erros do banco mapeados', async () => {
  assert.equal((await L.decidirConsentimento(REQ, DADOS, true, deps({ rpc: () => ({ data: { ok: false, error: 'unauthenticated' }, error: null }) }))).tipo, 'login')
  const d = deps()
  assert.equal((await L.decidirConsentimento('lixo', DADOS, true, d)).tipo, 'erro')
  assert.equal(d.calls.rpc.length, 0)
  for (const e of ['beta_required', 'plan_required', 'invalid_scope', 'grants_limit']) assert.equal((await L.decidirConsentimento(REQ, DADOS, true, deps({ rpc: () => ({ data: { ok: false, error: e }, error: null }) }))).codigo, e)
  assert.equal((await L.decidirConsentimento(REQ, DADOS, true, deps({ rpc: () => ({ data: { ok: false, error: 'qualquer' }, error: null }) }))).codigo, 'inesperado')
})

// ------------------------------------------------------------------ /painel/ia
test('conexoes: interpreta a lista, descarta ids invalidos e escopos desconhecidos, nunca usa ids como texto', async () => {
  const lista = { ok: true, grants: [
    { grant_id: GRANT, client_name: 'Claude', scopes: ['analytics:read', 'x:y'], created_at: '2026-11-03T10:00:00Z', last_used_at: null, calls_7d: 4, status: 'active' },
    { grant_id: 'nao-e-uuid', client_name: 'Ruim', scopes: [], status: 'active' }, { client_name: 'sem id' }, null, 5,
    { grant_id: GRANT.replace('3f2a', '4f2a'), client_name: 'B', scopes: ['sales:read'], created_at: 'lixo', calls_7d: -3, status: 'estranho' },
  ] }
  const r = await L.listarConexoes(deps({ rpc: () => ({ data: lista, error: null }) }))
  assert.equal(r.tipo, 'ok')
  assert.equal(r.conexoes.length, 2)
  assert.deepEqual(r.conexoes[0], { id: GRANT, cliente: 'Claude', escopos: ['analytics:read'], criadaEm: '2026-11-03T10:00:00Z', ultimoUso: null, consultas7d: 4, status: 'active' })
  assert.deepEqual([r.conexoes[1].criadaEm, r.conexoes[1].consultas7d, r.conexoes[1].status], [null, 0, 'desconhecido'])
  assert.equal((await L.listarConexoes(deps({ rpc: () => ({ data: { ok: false, error: 'unauthenticated' }, error: null }) }))).tipo, 'login')
  assert.equal((await L.listarConexoes(deps({ rpc: () => ({ data: { ok: true }, error: null }) }))).tipo, 'erro')
  assert.equal((await L.listarConexoes(deps({ rpc: () => new Error('x') }))).tipo, 'erro')
})
test('revogar: so aceita uuid, chama mcp_grant_revoke com p_grant_id, trata nao encontrada/sessao/erro', async () => {
  let d = deps({ rpc: () => ({ data: { ok: true }, error: null }) })
  assert.equal(await L.revogarConexao(GRANT, d), 'ok')
  assert.deepEqual(d.calls.rpc, [{ fn: 'mcp_grant_revoke', args: { p_grant_id: GRANT } }])
  d = deps()
  assert.equal(await L.revogarConexao("1' or '1'='1", d), 'erro')
  assert.equal(d.calls.rpc.length, 0)
  assert.equal(await L.revogarConexao(GRANT, deps({ rpc: () => ({ data: { ok: false, error: 'not_found' }, error: null }) })), 'ja_revogada')
  assert.equal(await L.revogarConexao(GRANT, deps({ rpc: () => ({ data: { ok: false, error: 'unauthenticated' }, error: null }) })), 'login')
  assert.equal(await L.revogarConexao(GRANT, deps({ rpc: () => ({ data: { ok: false, error: 'x' }, error: null }) })), 'erro')
  assert.equal(await L.revogarConexao(GRANT, deps({ rpc: () => ({ data: null, error: { code: 'PGRST301' } }) })), 'login')
  assert.equal(await L.revogarConexao(GRANT, deps({ rpc: () => new Error('x') })), 'erro')
})

// ------------------------------------------------------------------ logs (item 14)
test('14) o req e o code NUNCA aparecem em logs (console.*) em nenhum caminho', async () => {
  const saidas = []
  const orig = {}
  for (const m of ['log', 'error', 'warn', 'info', 'debug', 'trace']) { orig[m] = console[m]; console[m] = (...a) => saidas.push(a.map(String).join(' ')) }
  try {
    const caminhos = [
      () => L.iniciarConsentimento('?req=' + REQ, deps()), () => L.iniciarConsentimento('?req=' + REQ, deps({ sessao: false })),
      () => L.iniciarConsentimento('?req=' + REQ, deps({ rpc: () => new Error('falha ' + REQ) })), () => L.iniciarConsentimento('?req=' + REQ, deps({ rpc: () => ({ data: { ok: false, error: 'beta_required' }, error: null }) })),
      () => L.decidirConsentimento(REQ, DADOS, true, deps({ rpc: () => ({ data: decideOk(), error: null }) })), () => L.decidirConsentimento(REQ, DADOS, true, deps({ rpc: () => new Error(REQ + CODE) })),
      () => L.decidirConsentimento(REQ, DADOS, true, deps({ rpc: () => ({ data: decideOk({ redirect_uri: 'javascript:1' }), error: null }) })),
    ]
    for (const c of caminhos) await c()
  } finally { for (const m of Object.keys(orig)) console[m] = orig[m] }
  assert.equal(saidas.join('\n').includes(REQ), false)
  assert.equal(saidas.join('\n').includes(CODE), false)
  const novos = ['app/lib/oauthConsent.ts', 'app/oauth/consent/page.tsx', 'app/oauth/consent/ConsentView.tsx', 'app/painel/ia/page.tsx']
  for (const f of novos) assert.doesNotMatch(ler(f), /\bconsole\s*\./, f + ' nao deve usar console')
  for (const f of novos) assert.doesNotMatch(ler(f), /\b(gtag|fbq|dataLayer|analytics\.|posthog|mixpanel|sendBeacon)\b/i, f + ' nao deve enviar telemetria')
})

// ------------------------------------------------------------------ headers e middleware (itens 15-16)
const req = (url, host) => new NextRequest(url, { headers: { host: host ?? new URL(url).host } })
test('15) /oauth/consent em clientemarcado.com.br: Cache-Control no-store e Referrer-Policy no-referrer', () => {
  for (const host of ['www.clientemarcado.com.br', 'clientemarcado.com.br', 'localhost:3000']) {
    const r = middleware(req('https://' + host + '/oauth/consent?req=' + REQ, host))
    assert.equal(r.headers.get('cache-control'), 'no-store', host)
    assert.equal(r.headers.get('referrer-policy'), 'no-referrer', host)
    assert.equal(r.headers.get('x-middleware-next'), '1', host) // segue para a pagina, sem redirecionar
    assert.equal(r.status, 200)
  }
})
test('15b) os cabecalhos sao exclusivos do consentimento e de clientemarcado: outras rotas e minipage.pro nao mudam', () => {
  for (const [url, host] of [['https://www.clientemarcado.com.br/painel', 'www.clientemarcado.com.br'], ['https://www.clientemarcado.com.br/login', 'www.clientemarcado.com.br'], ['https://www.clientemarcado.com.br/oauth/consent/x', 'www.clientemarcado.com.br'],
    ['https://www.clientemarcado.com.br/oauth/consentx', 'www.clientemarcado.com.br'], ['https://minipage.pro/oauth/consent', 'minipage.pro'], ['https://minipage.pro/meuslug', 'minipage.pro']]) {
    const r = middleware(req(url, host))
    assert.equal(r.headers.get('cache-control'), null, url)
    assert.equal(r.headers.get('referrer-policy'), null, url)
  }
})
test('16) regras do middleware de minipage.pro continuam intactas', () => {
  const loc = (r) => r.headers.get('location')
  let r = middleware(req('https://www.minipage.pro/abc?x=1', 'www.minipage.pro')); assert.equal(r.status, 308); assert.equal(loc(r), 'https://minipage.pro/abc?x=1')
  r = middleware(req('https://www.minipage.pro/', 'www.minipage.pro')); assert.equal(r.status, 308); assert.equal(loc(r), 'https://minipage.pro/')
  r = middleware(req('https://minipage.pro/', 'minipage.pro')); assert.equal(loc(r), 'https://www.clientemarcado.com.br/')
  r = middleware(req('https://foo.minipage.pro/', 'foo.minipage.pro')); assert.equal(loc(r), 'https://www.clientemarcado.com.br/')
  r = middleware(req('https://minipage.pro/@maria', 'minipage.pro')); assert.equal(r.status, 308); assert.equal(loc(r), 'https://minipage.pro/maria')
  r = middleware(req('https://www.clientemarcado.com.br/@maria/agendar', 'www.clientemarcado.com.br')); assert.equal(r.status, 308); assert.equal(loc(r), 'https://www.clientemarcado.com.br/maria/agendar')
  r = middleware(req('https://minipage.pro/maria', 'minipage.pro')); assert.equal(loc(r), null); assert.equal(r.headers.get('x-middleware-next'), '1')
  r = middleware(req('https://www.clientemarcado.com.br/', 'www.clientemarcado.com.br')); assert.equal(loc(r), null); assert.equal(r.headers.get('x-middleware-next'), '1')
  const src = ler('middleware.ts')
  assert.ok(src.indexOf("hostLower === 'www.minipage.pro'") < src.indexOf("pathname === '/oauth/consent'")) // o bloco novo vem DEPOIS das regras de canonicalizacao
  assert.match(src, /matcher: \['\/\(\(\?!_next\/static\|_next\/image\|favicon\.ico\)\.\*\)'\]/)
})

// ------------------------------------------------------------------ varreduras estaticas
test('menu: "Integrações com IA" so no menu do dono (LINKS), nunca no do profissional; sem regra de plano no menu', () => {
  const s = ler('app/components/PainelSidebar.tsx').replace(/\r/g, '')
  const links = /const LINKS: ItemMenu\[\] = \[([\s\S]*?)\n\]/.exec(s)[1]
  const prof = /const LINKS_PROFISSIONAL: ItemMenu\[\] = \[([\s\S]*?)\n  \]/.exec(s)[1]
  const linha = links.split('\n').find((l) => l.includes("'/painel/ia'"))
  assert.ok(linha, 'item ausente em LINKS')
  assert.match(linha, /l: 'Integrações com IA'/)
  assert.doesNotMatch(linha, /requer|apenasAdmin/)
  assert.doesNotMatch(prof, /\/painel\/ia/)
  assert.equal((s.match(/\/painel\/ia/g) || []).length, 1)
})
test('login: usa o destino validado e nunca o valor cru de next', () => {
  const s = ler('app/login/page.tsx')
  assert.match(s, /import \{ destinoAposLogin \} from '\.\.\/lib\/oauthConsent'/)
  assert.match(s, /window\.location\.href = destinoAposLogin\(window\.location\.search\)/)
  assert.doesNotMatch(s, /searchParams\.get\(\s*['"]next['"]/)
  assert.doesNotMatch(s, /location\.href\s*=\s*(next|params|search)/)
  assert.equal((s.match(/window\.location\.href = '\/painel'/g) || []).length, 0)
})
test('restricoes da etapa: sem @supabase/ssr, sem Server Actions, sem tabelas/funcoes mcp, so as 4 RPCs, nada de service_role', () => {
  const novos = ['app/lib/oauthConsent.ts', 'app/oauth/consent/page.tsx', 'app/oauth/consent/ConsentView.tsx', 'app/painel/ia/page.tsx']
  const pkg = ler('package.json')
  assert.doesNotMatch(pkg, /@supabase\/ssr|auth-helpers/)
  const todo = novos.map((f) => semComentarios(ler(f))).join('\n') // comentarios explicam o que a etapa NAO faz; so o codigo conta
  assert.doesNotMatch(todo, /@supabase\/ssr|createServerClient|'use server'|"use server"|cookies\(\)|service_role|SUPABASE_SERVICE|mcp_api|mcp_runtime|\.from\(\s*['"]mcp|schema\(\s*['"]mcp/)
  // todo dangerouslySetInnerHTML e CSS estatico (template sem interpolacao); nada de dado externo em HTML
  const usos = (todo.match(/dangerouslySetInnerHTML/g) || []).length
  const estaticos = [...todo.matchAll(/dangerouslySetInnerHTML=\{\{ __html: `([^`]*)`/g)].filter((m) => !m[1].includes('${'))
  assert.equal(usos, estaticos.length)
  const fns = new Set([...todo.matchAll(/'(mcp_[a-z_]+)'/g)].map((m) => m[1]))
  assert.deepEqual([...fns].sort(), ['mcp_consent_decide', 'mcp_consent_get', 'mcp_grant_revoke', 'mcp_grants_list'])
  assert.match(ler('app/oauth/consent/page.tsx'), /^'use client'/)
  assert.match(ler('app/painel/ia/page.tsx'), /^'use client'/)
  // o redirect final vem SO da RPC: a pagina nao le redirect_uri da URL nem navega para nada que nao seja url validada
  const pg = ler('app/oauth/consent/page.tsx')
  assert.doesNotMatch(pg, /redirect_uri|searchParams|URLSearchParams|location\.search\s*\)\s*\.get/)
  assert.match(pg, /window\.location\.replace\(r\.url\)/)
  assert.match(pg, /name="referrer" content="no-referrer"/)
  assert.doesNotMatch(semComentarios(ler('app/oauth/consent/ConsentView.tsx')), /dangerouslySetInnerHTML|innerHTML|href=\{/) // a tela de consentimento nunca monta HTML/links com dado externo
})
test('conteudo humano: sem jargao de OAuth/MCP nas telas e sem ids/tokens exibidos', () => {
  const telas = ler('app/oauth/consent/ConsentView.tsx') + ler('app/painel/ia/page.tsx')
  // texto exibido = texto entre tags na MESMA linha (sem codigo); mais as mensagens e os textos de permissao da biblioteca
  const jsx = semComentarios(telas).split('\n').flatMap((l) => [...l.matchAll(/>([^<>{}=;()]{6,})</g)].map((m) => m[1]))
  assert.ok(jsx.length >= 8, 'extracao de texto exibido encontrou pouco: ' + jsx.length)
  const textos = jsx.join(' ') + ' ' + Object.values(L.MENSAGENS).map((m) => m.titulo + ' ' + m.texto).join(' ') + ' ' + Object.values(L.ESCOPOS).map((e) => e.titulo + ' ' + e.texto).join(' ')
  assert.doesNotMatch(textos, /\b(OAuth|MCP|token|grant|scope|PKCE|redirect_uri)\b/i)
  // nenhum id/token/req e EXIBIDO (key= e argumentos internos nao contam; so expressoes que sao APENAS o identificador entre tags)
  assert.doesNotMatch(semComentarios(ler('app/oauth/consent/ConsentView.tsx') + ler('app/painel/ia/page.tsx')), />\s*\{\s*([\w.]*\.id|[\w.]*grant_id|req|[\w.]*hash|[\w.]*token)\s*\}\s*</)
})
test('pacote: arquivos da etapa presentes', () => {
  for (const f of ['app/lib/oauthConsent.ts', 'app/oauth/consent/page.tsx', 'app/oauth/consent/ConsentView.tsx', 'app/painel/ia/page.tsx']) assert.ok(existsSync(path.join(RAIZ, f)), f)
})
