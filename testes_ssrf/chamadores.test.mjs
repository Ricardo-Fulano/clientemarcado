// VERIFICACOES ESTATICAS (apos a instalacao): as 4 telas usam o helper autenticado e mantem o mesmo comportamento; a rota nao tem nenhum fetch direto; o codigo de seguranca nao tem atalhos perigosos.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
const RAIZ = path.resolve(import.meta.dirname, '..')
const ler = (rel) => readFileSync(path.join(RAIZ, ...rel.split('/')), 'utf8').replace(/\r\n/g, '\n')
const semComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

const TELAS = [
  { nome: 'Catalogo', rel: 'app/painel/perfil/catalogo/[catalogoId]/page.tsx', caminho: '../../../../lib/preview-link-cliente', chamada: "chamarPreviewLink({url:it.destino_url.trim()})", supabase: "import { supabase } from '../../../../lib/supabase'" },
  { nome: 'Destaques', rel: 'app/painel/perfil/destaques/[secaoId]/page.tsx', caminho: '../../../../lib/preview-link-cliente', chamada: "chamarPreviewLink({url:d.url.trim()})", supabase: "import { supabase } from '../../../../lib/supabase'" },
  { nome: 'Eventos', rel: 'app/painel/perfil/eventos/page.tsx', caminho: '../../../lib/preview-link-cliente', chamada: "chamarPreviewLink({url:e.url.trim(),tipo:'evento'})", supabase: "import { supabase } from '../../../lib/supabase'" },
  { nome: 'Videos', rel: 'app/painel/perfil/videos/page.tsx', caminho: '../../../lib/preview-link-cliente', chamada: "chamarPreviewLink({url:v.url_video.trim()})", supabase: "import { supabase } from '../../../lib/supabase'" },
]
for (const t of TELAS) {
  test(`${t.nome}: usa chamarPreviewLink (1 chamada, mesmos argumentos), importa o helper do caminho certo, mantem o import do supabase e nao faz fetch direto ao endpoint`, () => {
    const s = ler(t.rel)
    assert.equal(s.split(`import { chamarPreviewLink } from '${t.caminho}'`).length - 1, 1, 'import do helper'); assert.ok(s.includes(t.supabase), 'import do supabase preservado')
    assert.equal(s.split('chamarPreviewLink(').length - 1, 1, 'uma unica chamada'); assert.ok(s.includes(`const dados=await ${t.chamada}`), 'argumentos e atribuicao a "dados" (o resto da tela le dados.success etc.)')
    assert.equal(/fetch\(\s*['"`]\/api\/catalogo\/preview-link/.test(s), false, 'nao pode restar fetch direto sem Authorization')
    assert.equal(/const res=await fetch\([^)]*preview-link/.test(s), false)
  })
}
test('as 4 telas continuam lendo o contrato JSON como antes (dados.success; fallback e campos de previa); nada foi removido', () => {
  const c = ler(TELAS[0].rel), d = ler(TELAS[1].rel), e = ler(TELAS[2].rel), v = ler(TELAS[3].rel)
  for (const [s, campos] of [[c, ['dados.success', 'dados.message', 'dados.titulo_fallback', 'dados.tipo_destino']], [d, ['dados.success', 'dados.message', 'dados.titulo_fallback']], [e, ['dados.success', 'dados.titulo', 'dados.imagem_url']], [v, ['dados.success', 'dados.imagem_url']]]) for (const campo of campos) assert.ok(s.includes(campo), campo)
})
test('route.ts: runtime Node.js, nenhum fetch direto, nenhuma leitura direta de request.json(), toda busca externa por buscarComTimeout->fetchSeguro, autenticacao ANTES da logica original', () => {
  const s = ler('app/api/catalogo/preview-link/route.ts'); const c = semComentarios(s)
  assert.ok(s.includes("export const runtime = 'nodejs'")); assert.ok(s.includes("export const dynamic = 'force-dynamic'"))
  assert.equal(/\bfetch\(/.test(c), false); assert.equal(c.includes('request.json()'), false); assert.ok(c.includes("import { fetchSeguro } from '../../../lib/seguranca/fetch-seguro'"))
  assert.equal(c.split('buscarComTimeout(').length - 1, 5, 'definicao + 4 usos (3 oEmbed + pagina)'); assert.ok(c.includes('return fetchSeguro(url,'))
  const iAuth = c.indexOf('usuarioDoBearer(request.headers.get'), iProc = c.indexOf('return await processarPreview('); assert.ok(iAuth > 0 && iProc > iAuth, 'auth antes da logica')
  assert.ok(c.includes('status: 401') && c.includes('status: 429') && c.includes('lerJsonLimitado(request, 4096, TEMPO_CORPO_MS)') && c.includes('validarUrlExterna(url.trim()).ok'))
  assert.ok(c.indexOf('lerJsonLimitado(request, 4096, TEMPO_CORPO_MS)') > 0 && c.indexOf('lerJsonLimitado(request, 4096, TEMPO_CORPO_MS)') < c.indexOf('concorrenciaPreview.tentar()'), 'o corpo (com prazo) e lido ANTES de ocupar a vaga de concorrencia')
})
test('seguranca: fetch-seguro usa Agent PROPRIO e lookup proprio, valida TLS (rejectUnauthorized true), nunca o agente global, nunca fetch global, nunca desliga a validacao', () => {
  const s = ler('app/lib/seguranca/fetch-seguro.ts'); const c = semComentarios(s)
  assert.ok(c.includes('new mod.Agent({ keepAlive: false, maxSockets: 1 })') && c.includes('lookup: lookupSeguro')); assert.ok(c.includes('if (!v.ehIp) opcoes.servername = v.hostname'), 'SNI explicito pelo NOME do host'); assert.ok(c.includes("Connection: 'close'") && c.includes('if (v.ehIp && !ehPublico(v.hostname))'), 'conexao nova por requisicao e checagem de IP literal'); assert.equal(/globalAgent/.test(c), false); assert.equal(/\bfetch\(/.test(c), false); assert.equal(/undici|node-fetch|axios|got\(/.test(c), false)
  assert.ok(c.includes('opcoes.rejectUnauthorized = true')); assert.equal(/rejectUnauthorized\s*[:=]\s*false/.test(c), false); assert.equal(/NODE_TLS_REJECT_UNAUTHORIZED\s*=/.test(c.replace("env.NODE_TLS_REJECT_UNAUTHORIZED === '0'", '')), false)
  assert.ok(c.includes("minVersion = 'TLSv1.2'")); assert.ok(c.includes("HEADERS_PERMITIDOS = new Set(['user-agent', 'accept', 'accept-language'])"))
  assert.equal(/process\.env\.(?!NODE_TLS)/.test(c), false, 'nenhuma outra variavel de ambiente'); assert.equal(/localAddress|family:\s*[46]\b|setHost|ALPNProtocols/.test(c), false)
})
test('variaveis de ambiente: so os nomes ja usados pelo projeto; a chave de servico NAO existe no codigo de cliente nem na autenticacao', () => {
  const nomes = (t) => [...new Set([...semComentarios(t).matchAll(/process\.env\.([A-Z0-9_]+)/g)].map((m) => m[1]))].sort()
  assert.deepEqual(nomes(ler('app/lib/auth-bearer-servidor.ts')), ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_URL']); assert.deepEqual(nomes(ler('app/lib/preview-link-limite.ts')), ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])
  assert.deepEqual(nomes(ler('app/lib/preview-link-cliente.ts')), []); assert.equal(/SERVICE_ROLE|service_role/i.test(semComentarios(ler('app/lib/preview-link-cliente.ts'))), false)
  assert.deepEqual(nomes(ler('app/lib/seguranca/url-externa.ts')), [])
})
test('limitador por usuario permanece PENDENTE: constante desativada e a definicao de checar_rate_limit nao foi presumida em nenhum outro lugar', () => {
  const l = ler('app/lib/preview-link-limite.ts'); assert.ok(l.includes('export const LIMITE_POR_USUARIO_CONFIRMADO = false')); const r = semComentarios(ler('app/api/catalogo/preview-link/route.ts')); assert.equal(r.includes('checar_rate_limit'), false)
})
test('Eventos e Videos mostram a mensagem do cliente (sessao expirada, prazo, rede) em vez de "nao encontramos dados"; as mensagens originais continuam como fallback', () => {
  const e = ler(TELAS[2].rel), v = ler(TELAS[3].rel)
  assert.ok(e.includes("setMsg(dados.origemCliente?dados.message:'Não conseguimos encontrar dados nesse link. Preencha manualmente.')"))
  const orig = 'Não foi possível gerar a capa automaticamente. Você pode enviar uma manualmente.'
  assert.ok(v.includes(`setMsg(dados.origemCliente?dados.message:'${orig}')`)); assert.equal(v.split(orig).length - 1, 2, 'a mensagem original tambem segue no catch, intacta')
})
test('SESSAO EXPIRADA NAO REDIRECIONA: nem o helper nem o trecho de cada tela que chama a previa contem redirecionamento, logout, recarga ou reset de dados', () => {
  const h = semComentarios(ler('app/lib/preview-link-cliente.ts')); for (const proibido of ['location', 'router', 'redirect', 'signOut', 'window.', 'document.', 'history.', 'reload', 'localStorage', 'sessionStorage']) assert.equal(h.includes(proibido), false, 'helper: ' + proibido)
  for (const t of TELAS) {
    const s = ler(t.rel), i = s.indexOf('chamarPreviewLink({'); const ini = s.lastIndexOf('async function', i); const fim = s.indexOf('\n  async function', i); const corpo = s.slice(ini, fim === -1 ? s.length : fim)
    for (const proibido of ['window.location', 'router.push', 'router.replace', 'redirect(', 'signOut', "href='/login'", 'location.reload']) assert.equal(corpo.includes(proibido), false, t.nome + ': ' + proibido)
    assert.equal(/setItens\(\[\]\)|setDestaques\(\[\]\)|setEventos\(\[\]\)|setVideos\(\[\]\)/.test(corpo), false, t.nome + ': nao zera os dados')
  }
})
test('helper do cliente: prazo (race) e cancelamento presentes; leitura do corpo na rota com prazo, cancelamento e escuta do abort do cliente', () => {
  const h = semComentarios(ler('app/lib/preview-link-cliente.ts')); assert.ok(h.includes('Promise.race([tarefa, prazo])') && h.includes('deps.timeoutMs ?? TEMPO_CLIENTE_MS') && h.includes('controle.abort()') && h.includes('signal: controle.signal'))
  const l = semComentarios(ler('app/lib/preview-link-limite.ts')); assert.ok(l.includes('Promise.race([leitor.read(), prazo])') && l.includes("request.signal?.addEventListener('abort', aoAbortar") && l.includes('leitor.cancel()') && l.includes('clearTimeout(timer)') && l.includes('export const TEMPO_CORPO_MS = 5000'))
})

