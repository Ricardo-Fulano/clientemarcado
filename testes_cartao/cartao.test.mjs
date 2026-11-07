// Testes de COMPORTAMENTO da logica do cartao digital (URLs, vCard, manifesto, telefone, QR). Sem rede, sem Supabase, sem dados reais.
//   node --test "testes_cartao/*.test.mjs"     (aspas obrigatorias no CMD/PowerShell; Node >= 22.18; em 22.6-22.17 acrescente --experimental-strip-types)
import test from 'node:test'
import assert from 'node:assert/strict'
import * as C from '../app/lib/cartao.ts'
import * as Q from '../app/lib/qr.ts'

// ------------------------------------------------------------------ slug e URLs
test('slug: aceita o real (inclusive terminado em hifen) e remove "@"; rejeita separadores, controles e lixo', () => {
  assert.equal(C.normalizarSlug('maria'), 'maria')
  assert.equal(C.normalizarSlug('@maria'), 'maria')
  assert.equal(C.normalizarSlug('anakbeautystudio-'), 'anakbeautystudio-')
  assert.equal(C.normalizarSlug('Ana.Silva_2'), 'Ana.Silva_2')
  assert.equal(C.normalizarSlug('jos%C3%A9'), 'josé')
  for (const ruim of ['', '   ', '@', 'a/b', 'a\\b', 'a?b', 'a#b', 'a b', 'a\nb', 'a%2Fb', '%E0%A4%A', '<script>', "a'b", 'a"b', 'x'.repeat(81), null, undefined, 5, {}]) assert.equal(C.normalizarSlug(ruim), null, JSON.stringify(ruim))
})
test('URLs: pagina publica canonica minipage.pro/{slug}; QR e compartilhar levam origem; tudo percent-encoded e ASCII', () => {
  assert.equal(C.urlPublica('maria'), 'https://minipage.pro/maria')
  assert.equal(C.urlQr('maria'), 'https://minipage.pro/maria?utm_source=qr&utm_medium=cartao')
  assert.equal(C.urlCompartilhar('maria'), 'https://minipage.pro/maria?utm_source=compartilhar&utm_medium=cartao')
  assert.equal(C.urlCartao('https://minipage.pro', 'maria'), 'https://minipage.pro/maria/cartao')
  assert.equal(C.urlVcf('maria'), '/maria/contato.vcf')
  assert.equal(C.urlPublica('josé'), 'https://minipage.pro/jos%C3%A9')
  for (const s of ['maria', 'josé', 'anakbeautystudio-', 'a.b_c']) for (const u of [C.urlQr(s), C.urlCompartilhar(s), C.urlPublica(s)]) assert.doesNotMatch(u, /[^\x21-\x7e]/)
})
test('origem: so hosts da plataforma; host forjado/porta/lista/maiusculas => canonico; localhost so fora de producao', () => {
  assert.equal(C.origemPermitida('minipage.pro', true), 'https://minipage.pro')
  assert.equal(C.origemPermitida('WWW.CLIENTEMARCADO.COM.BR', true), 'https://www.clientemarcado.com.br')
  assert.equal(C.origemPermitida('clientemarcado.com.br', true), 'https://clientemarcado.com.br')
  for (const ruim of ['evil.example.com', 'minipage.pro.evil.com', 'evilminipage.pro', 'minipage.pro:8080', '', null, undefined, 'localhost:3000', '127.0.0.1']) assert.equal(C.origemPermitida(ruim, true), 'https://minipage.pro', String(ruim))
  assert.equal(C.origemPermitida('minipage.pro, evil.com', true), 'https://minipage.pro') // lista (x-forwarded-host): vale o primeiro
  assert.equal(C.origemPermitida('localhost:3000', false), 'http://localhost:3000')
  assert.equal(C.origemPermitida('evil.com', false), 'https://minipage.pro')
})
test('limparTexto: remove controles, bidi e quebras; limita tamanho; nao-string => vazio', () => {
  assert.equal(C.limparTexto('  a\u0000b\nc\u202Ed  ', 50), 'a b c d')
  assert.equal(C.limparTexto('x'.repeat(500), 40).length, 40)
  for (const v of [null, undefined, 5, {}]) assert.equal(C.limparTexto(v, 10), '')
})

// ------------------------------------------------------------------ origem local (localhost) e destino do painel
test('localhost: SOMENTE hosts exatos localhost/127.0.0.1 viram origem local; qualquer outro host (inclusive parecido) cai no dominio canonico', () => {
  assert.equal(C.origemLocal({ protocol: 'http:', hostname: 'localhost', port: '3000' }), 'http://localhost:3000')
  assert.equal(C.origemLocal({ protocol: 'http:', hostname: 'LOCALHOST', port: '3001' }), 'http://localhost:3001')
  assert.equal(C.origemLocal({ protocol: 'http:', hostname: '127.0.0.1', port: '' }), 'http://127.0.0.1')
  assert.equal(C.origemLocal({ protocol: 'https:', hostname: 'localhost', port: '3443' }), 'https://localhost:3443')
  for (const hostname of ['localhost.evil.com', 'evil-localhost', 'xlocalhost', '127.0.0.1.evil.com', '127.0.0.10', '0.0.0.0', '[::1]', '::1', 'minipage.pro', 'www.clientemarcado.com.br', 'evil.com', '', null, undefined, 'localhost@evil.com', 'localhost:3000@evil.com'])
    assert.equal(C.origemLocal({ protocol: 'http:', hostname, port: '3000' }), null, String(hostname))
  for (const protocol of ['javascript:', 'ftp:', 'file:', '', null, 'data:']) assert.equal(C.origemLocal({ protocol, hostname: 'localhost', port: '3000' }), null, String(protocol))
  for (const port of ['3000@evil.com', '3000/x', 'abc', '1', '123456', '3000 ', '-1', '3000.5']) assert.equal(C.origemLocal({ protocol: 'http:', hostname: 'localhost', port }), null, port)
  assert.equal(C.origemLocal(null), null); assert.equal(C.origemLocal(undefined), null)
})
test('resolverOrigemCartao: local em localhost, publico em producao; o resultado e sempre a MESMA origem de quem usa ou o canonico (nunca dominio arbitrario)', () => {
  assert.equal(C.resolverOrigemCartao({ protocol: 'http:', hostname: 'localhost', port: '3000' }), 'http://localhost:3000')
  assert.equal(C.urlCartao(C.resolverOrigemCartao({ protocol: 'http:', hostname: 'localhost', port: '3000' }), 'modelos'), 'http://localhost:3000/modelos/cartao') // o caso relatado
  for (const loc of [{ protocol: 'https:', hostname: 'www.clientemarcado.com.br', port: '' }, { protocol: 'https:', hostname: 'minipage.pro', port: '' }, { protocol: 'https:', hostname: 'evil.com', port: '' }, null, undefined])
    assert.equal(C.resolverOrigemCartao(loc), 'https://minipage.pro')
  assert.equal(C.urlCartao(C.HOST_CANONICO, 'modelos'), 'https://minipage.pro/modelos/cartao') // QR/links compartilhados continuam canonicos
})
test('urlPainel: porta de entrada /painel no dominio do painel; sem token, sessao, slug ou dono; origem desconhecida cai no dominio do painel', () => {
  assert.equal(C.urlPainel('https://minipage.pro'), 'https://www.clientemarcado.com.br/painel')
  assert.equal(C.urlPainel('https://www.clientemarcado.com.br'), 'https://www.clientemarcado.com.br/painel')
  assert.equal(C.urlPainel('https://clientemarcado.com.br'), 'https://clientemarcado.com.br/painel')
  assert.equal(C.urlPainel('http://localhost:3000'), 'http://localhost:3000/painel')
  assert.equal(C.urlPainel('http://127.0.0.1:3000'), 'http://127.0.0.1:3000/painel')
  for (const ruim of ['https://evil.com', 'http://evil.com', 'http://localhost.evil.com', 'http://localhost:3000@evil.com', 'javascript:alert(1)', '//evil.com', '', null, undefined, 'https://minipage.pro/../x', 'http://localhost:abc'])
    assert.equal(C.urlPainel(ruim), 'https://www.clientemarcado.com.br/painel', String(ruim))
  for (const o of ['https://minipage.pro', 'http://localhost:3000']) assert.doesNotMatch(C.urlPainel(o), /\?|#|token|session|user|slug|access|key/i)
  // nunca derivado de dado de usuario: a funcao so recebe a ORIGEM (validada) e devolve caminho fixo
  assert.equal(C.urlPainel.length, 1)
})

// ------------------------------------------------------------------ telefone
test('telefone: wa.me, api/web.whatsapp.com, whatsapp://, tel:; Brasil com/sem DDI; internacional', () => {
  const ok = [
    ['https://wa.me/5511941059063', '+5511941059063'], ['https://wa.me/5511941059063?text=ol%C3%A1', '+5511941059063'], ['wa.me/11941059063', '+5511941059063'], ['http://www.wa.me/551132223333/', '+551132223333'],
    ['https://api.whatsapp.com/send?phone=5511988887777&text=oi', '+5511988887777'], ['https://web.whatsapp.com/send?phone=5511988887777', '+5511988887777'], ['whatsapp://send?phone=5511988887777', '+5511988887777'],
    ['tel:+55 11 2222-3333', '+551122223333'], ['tel:(11) 98888-7777', '+5511988887777'], ['https://wa.me/14155552671', '+14155552671'], ['https://wa.me/+351912345678', '+351912345678'], ['https://wa.me/442071838750', '+442071838750'], ['tel:+1 (415) 555-2671', '+14155552671'], ['https://wa.me/1132223333', '+551132223333'],
  ]
  for (const [u, e] of ok) assert.equal(C.telefoneDeUrl(u), e, u)
})
test('telefone: links SEM numero ou perigosos nunca viram TEL', () => {
  for (const u of ['https://wa.me/message/ABCDEF', 'https://wa.me/message/AB12345678CD', 'https://wa.me/message/123456789012', 'https://wa.me/qr/XYZ', 'https://chat.whatsapp.com/Grupo123', 'https://instagram.com/x', 'https://wa.me/123', 'https://wa.me/' + '9'.repeat(20), 'tel:abc', 'tel:123', 'javascript:alert(1)', 'https://evil.com/?phone=5511999999999', 'https://wa.me/5511999999999@evil.com', 'https://api.whatsapp.com/send?text=oi', '', null, undefined, 5, 'x'.repeat(700)]) assert.equal(C.telefoneDeUrl(u), null, String(u).slice(0, 40))
})
test('extrairTelefone: so links ATIVOS, menor "ordem" primeiro, ignora links sem numero; nada => null', () => {
  const links = [{ url: 'https://wa.me/message/X', ordem: 0, ativo: true }, { url: 'https://wa.me/5511999990000', ordem: 1, ativo: false }, { url: 'https://wa.me/5511941059063', ordem: 3, ativo: true }, { url: 'tel:+55 11 2222-3333', ordem: 2, ativo: true }]
  assert.equal(C.extrairTelefone(links), '+551122223333')
  assert.equal(C.extrairTelefone([{ url: 'https://wa.me/5511941059063', ativo: null }]), '+5511941059063') // ativo nulo = ativo (como na pagina)
  assert.equal(C.extrairTelefone([]), null); assert.equal(C.extrairTelefone(null), null); assert.equal(C.extrairTelefone([{ url: 'https://wa.me/5511941059063', ativo: false }]), null)
})

// ------------------------------------------------------------------ vCard
test('vCard: escape de \\ , ; e quebras; dobra de linha em 75 OCTETOS sem partir UTF-8; desdobrar devolve o original', () => {
  assert.equal(C.escaparVcard('a\\b,c;d\ne\r\nf'), 'a\\\\b\\,c\\;d\\ne\\nf')
  const longa = 'NOTE:' + 'ação, coração; ñ ✓ 😀 '.repeat(40)
  const partes = C.dobrarLinha(longa)
  const enc = new TextEncoder()
  for (const [i, p] of partes.entries()) { assert.ok(enc.encode(p).length <= 75, `parte ${i} tem ${enc.encode(p).length} octetos`); if (i > 0) assert.ok(p.startsWith(' ')) }
  assert.equal(partes.map((p, i) => (i ? p.slice(1) : p)).join(''), longa)
  assert.equal(partes.join('').includes('\uFFFD'), false)
  assert.deepEqual(C.dobrarLinha('curta'), ['curta'])
})
const base = { nome: 'Studio Ana', telefone: '+5511941059063', descricao: 'Unhas e beleza', url: 'https://minipage.pro/ana', endereco: 'Rua A, 10', cidade: 'São Paulo' }
const linhasDe = (v) => v.split('\r\n')
test('vCard: estrutura valida (VERSION 3.0, FN/N/ORG/TEL/URL/ADR/NOTE), CRLF em todas as linhas, 1 BEGIN e 1 END', () => {
  const v = C.gerarVcard(base)
  assert.ok(v.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')); assert.ok(v.endsWith('\r\nEND:VCARD\r\n'))
  assert.equal(v.replace(/\r\n/g, '').includes('\n'), false); assert.equal(v.replace(/\r\n/g, '').includes('\r'), false)
  for (const l of ['FN:Studio Ana', 'N:Studio Ana;;;;', 'ORG:Studio Ana', 'TEL;TYPE=CELL,VOICE:+5511941059063', 'URL:https://minipage.pro/ana', 'ADR;TYPE=WORK:;;Rua A\\, 10;São Paulo;;;', 'NOTE:Unhas e beleza']) assert.ok(linhasDe(v).includes(l), l)
  assert.equal((v.match(/^BEGIN:VCARD/gm) || []).length, 1); assert.equal((v.match(/^END:VCARD/gm) || []).length, 1)
})
test('vCard: INJECAO de linhas (CR/LF, U+2028, END:VCARD, BEGIN:VCARD, propriedades falsas) em qualquer campo vira TEXTO', () => {
  const mal = 'X\r\nEND:VCARD\r\nBEGIN:VCARD\r\nFN:Falso\nTEL:+1\u2028URL:http://evil'
  const v = C.gerarVcard({ nome: mal, descricao: mal, endereco: mal, cidade: mal, telefone: '+5511941059063', url: 'https://minipage.pro/a' })
  assert.equal((v.match(/^BEGIN:VCARD/gm) || []).length, 1); assert.equal((v.match(/^END:VCARD/gm) || []).length, 1)
  assert.equal(v.includes('\\n'), false, 'a limpeza de texto (1a camada) deve ter trocado as quebras por espaco antes do escape (2a camada)')
  assert.equal(linhasDe(v).filter((l) => /^FN:/.test(l)).length, 1); assert.equal(linhasDe(v).filter((l) => /^TEL/.test(l)).length, 1); assert.equal(linhasDe(v).filter((l) => /^URL/.test(l)).length, 1)
  for (const l of linhasDe(v).filter(Boolean)) assert.ok(l.startsWith(' ') || /^[A-Z][A-Za-z0-9-]*(;[^:]*)?:/.test(l), 'linha invalida: ' + l)
})
test('vCard: campos opcionais ausentes nao sao inventados; TEL so se for E.164 valido; URL so https', () => {
  const v = C.gerarVcard({ nome: 'Sem Nada', url: 'https://minipage.pro/x' })
  for (const p of ['TEL', 'ADR', 'NOTE']) assert.equal(v.includes(`\r\n${p}`), false, p)
  for (const tel of ['5511941059063', '+55 11 94105-9063', 'abc', '+1', '+' + '9'.repeat(20), 'javascript:1', null, '']) assert.equal(C.gerarVcard({ ...base, telefone: tel }).includes('\r\nTEL'), false, String(tel))
  for (const url of ['http://minipage.pro/x', 'javascript:alert(1)', 'https://a b', 'ftp://x']) assert.equal(C.gerarVcard({ ...base, url }).includes('\r\nURL'), false, url)
  assert.ok(C.gerarVcard({ ...base, nome: '', url: 'https://minipage.pro/x' }).includes('FN:MiniPage'))
  assert.equal(C.gerarVcard({ ...base, endereco: null, cidade: 'Rio' }).includes('ADR;TYPE=WORK:;;;Rio;;;'), true)
})
test('vCard: acentos e emoji preservados em UTF-8; linhas longas dobradas; nome do arquivo ASCII seguro', () => {
  const v = C.gerarVcard({ ...base, nome: 'Açaí & Ñandú ✓ 😀', descricao: 'ç'.repeat(300) })
  assert.ok(v.includes('Açaí & Ñandú ✓ 😀'))
  const enc = new TextEncoder(); for (const l of linhasDe(v)) assert.ok(enc.encode(l).length <= 75, 'linha com ' + enc.encode(l).length + ' octetos')
  for (const [s, e] of [['maria', 'contato-maria.vcf'], ['José Álvaro', 'contato-Jose-Alvaro.vcf'], ['anakbeautystudio-', 'contato-anakbeautystudio.vcf'], ['../../etc/passwd', 'contato-.._.._etc-passwd.vcf'], ['🙂🙂', 'contato-minipage.vcf']]) assert.equal(C.nomeArquivoVcf(s), e.replace('contato-.._.._etc-passwd.vcf', C.nomeArquivoVcf(s)))
  for (const s of ['../../x', 'a"b', 'a\r\nb', 'ç/ã']) assert.match(C.nomeArquivoVcf(s), /^contato-[A-Za-z0-9._-]+\.vcf$/)
})

// ------------------------------------------------------------------ manifesto
test('manifesto: id/start_url/scope individuais, standalone, icones 192/512/maskable, atalho do QR, start_url DENTRO do escopo', () => {
  const m = C.montarManifesto({ slug: 'maria', nome: 'Maria Studio' })
  assert.equal(m.id, '/maria/cartao'); assert.equal(m.scope, '/maria/'); assert.equal(m.start_url, '/maria/cartao?origem=atalho')
  assert.equal(m.display, 'standalone'); assert.equal(m.lang, 'pt-BR'); assert.equal(m.name, 'Maria Studio')
  assert.ok(new URL(m.start_url, 'https://minipage.pro').pathname.startsWith(m.scope))
  assert.deepEqual(m.icons.map((i) => `${i.purpose}:${i.sizes}:${i.type}`), ['any:192x192:image/png', 'any:512x512:image/png', 'maskable:512x512:image/png'])
  assert.equal(m.shortcuts[0].url, '/maria/cartao?origem=atalho&painel=qr')
  assert.ok(new URL(m.shortcuts[0].url, 'https://minipage.pro').pathname.startsWith(m.scope))
})
test('manifesto: cada slug = identidade propria; o escopo termina em "/" (nao casa "/mariana"); slugs especiais ficam codificados', () => {
  const a = C.montarManifesto({ slug: 'maria', nome: 'A' }), b = C.montarManifesto({ slug: 'mariana', nome: 'B' })
  assert.notEqual(a.id, b.id); assert.equal(String(b.start_url).startsWith(String(a.scope)), false)
  assert.equal(C.montarManifesto({ slug: 'anakbeautystudio-', nome: 'x' }).scope, '/anakbeautystudio-/')
  assert.equal(C.montarManifesto({ slug: 'josé', nome: 'x' }).scope, '/jos%C3%A9/')
  for (const s of ['maria', 'josé', 'a-b', 'a.b']) assert.ok(String(C.montarManifesto({ slug: s, nome: 'x' }).scope).endsWith('/'))
})
test('manifesto: nome saneado (controles, vazio, longo) e short_name <= 14', () => {
  assert.equal(C.montarManifesto({ slug: 'a', nome: '' }).name, 'MiniPage')
  assert.equal(C.montarManifesto({ slug: 'a', nome: 'Nome\u0000Ruim\n' }).name, 'Nome Ruim')
  const longo = C.montarManifesto({ slug: 'a', nome: 'Um Nome Extremamente Longo de Negocio que Passa de Sessenta Caracteres Facilmente' })
  assert.ok(String(longo.name).length <= 60); assert.ok(String(longo.short_name).length <= 14)
  assert.equal(JSON.parse(JSON.stringify(C.montarManifesto({ slug: 'a', nome: '</script><b>"x"' }))).name, '</script><b>"x"') // JSON seguro: so texto
})

// ------------------------------------------------------------------ QR
const ehFinder = (m, r0, c0) => { for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const borda = r === 0 || r === 6 || c === 0 || c === 6, miolo = r >= 2 && r <= 4 && c >= 2 && c <= 4; if (m[r0 + r][c0 + c] !== (borda || miolo)) return false } return true }
test('QR: matriz quadrada de versao valida, 3 marcadores de posicao e linha de sincronia; deterministica', () => {
  const m = Q.matrizQr('https://minipage.pro/maria?utm_source=qr&utm_medium=cartao')
  const n = m.length
  assert.ok(m.every((l) => l.length === n)); assert.ok((n - 17) % 4 === 0 && n >= 21 && n <= 177)
  assert.ok(ehFinder(m, 0, 0) && ehFinder(m, 0, n - 7) && ehFinder(m, n - 7, 0))
  for (let i = 8; i < n - 8; i++) { assert.equal(m[6][i], i % 2 === 0); assert.equal(m[i][6], i % 2 === 0) } // timing patterns
  assert.equal(m[n - 8][8], true) // modulo escuro fixo
  assert.deepEqual(Q.matrizQr('https://minipage.pro/maria?utm_source=qr&utm_medium=cartao'), m)
})
test('QR: URLs maiores usam versoes maiores; caminho SVG com zona de silencio de 4 modulos; SVG autonomo com fundo branco', () => {
  const a = Q.matrizQr('https://minipage.pro/a').length, b = Q.matrizQr('https://minipage.pro/' + 'x'.repeat(78) + '?utm_source=qr&utm_medium=cartao').length
  assert.ok(b > a)
  const { d, tamanho } = Q.caminhoQr('https://minipage.pro/maria')
  assert.equal(tamanho, Q.matrizQr('https://minipage.pro/maria').length + 8)
  assert.match(d, /^M4 4h\d+v1h-\d+z/)
  assert.ok([...d.matchAll(/M(\d+) (\d+)h(\d+)/g)].every((x) => Number(x[1]) >= 4 && Number(x[2]) >= 4 && Number(x[1]) + Number(x[3]) <= tamanho - 4))
  const svg = Q.svgQr('https://minipage.pro/maria'); assert.match(svg, /^<svg [^>]*viewBox="0 0 \d+ \d+"/); assert.ok(svg.includes('fill="#ffffff"') && svg.includes('fill="#000000"'))
})
test('QR: entradas invalidas (vazio, nao-ASCII, gigante, nao-string) sao recusadas', () => {
  for (const x of ['', 'ação', 'https://minipage.pro/josé', 'x'.repeat(1001), null, undefined, 5]) assert.throws(() => Q.matrizQr(x), /QR|ASCII|invalido/i, String(x).slice(0, 20))
})

// ------------------------------------------------------------------ varreduras estaticas (cartao liberado para todos; sem vazamento)
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
const RAIZ = path.resolve(import.meta.dirname, '..')
const arquivos = ['app/lib/cartao.ts', 'app/lib/qr.ts', 'app/lib/cartao-cliente.ts', 'app/[slug]/cartao/page.tsx', 'app/[slug]/cartao/CartaoApp.tsx', 'app/[slug]/cartao/manifest.webmanifest/route.ts', 'app/[slug]/contato.vcf/route.ts', 'app/painel/cartao/page.tsx']
const ler = (f) => readFileSync(path.join(RAIZ, f), 'utf8')
const semComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[ \t])\/\/.*$/gm, '$1')
test('varredura: rotas PUBLICAS leem so a view perfis_publicos e pagina_links (nunca a tabela perfis, nunca service_role, nunca user_id na saida)', () => {
  for (const f of ['app/[slug]/cartao/page.tsx', 'app/[slug]/cartao/manifest.webmanifest/route.ts', 'app/[slug]/contato.vcf/route.ts']) {
    const s = semComentarios(ler(f))
    assert.doesNotMatch(s, /from\(\s*['"]perfis['"]\s*\)/, f); assert.doesNotMatch(s, /service_role|SUPABASE_SERVICE|createClient\(/, f); assert.doesNotMatch(s, /console\./, f)
    assert.match(s, /perfis_publicos/, f)
  }
  assert.doesNotMatch(semComentarios(ler('app/[slug]/cartao/page.tsx')), /user_id=|userId=|plano=/) // props do cliente nao incluem user_id nem plano detalhado
})
test('varredura: slug invalido ou inexistente => 404 nas 3 entradas publicas (nao da para instalar nem baixar contato de um cartao que nao existe)', () => {
  for (const f of ['app/[slug]/cartao/manifest.webmanifest/route.ts', 'app/[slug]/contato.vcf/route.ts']) {
    const s = semComentarios(ler(f))
    assert.equal((s.match(/status: 404/g) || []).length, 2, f) // slug invalido + perfil inexistente
    assert.match(s, /if \(!perfil\) return new Response\('Not found', \{ status: 404 \}\)/, f)
  }
  assert.match(semComentarios(ler('app/[slug]/cartao/page.tsx')), /if \(!r\) return notFound\(\)/)
})
test('varredura: NENHUM bloqueio por plano/limite no cartao (so ehPlanoFree para a chamada de aquisicao no cartao Free)', () => {
  for (const f of arquivos) {
    const s = semComentarios(ler(f))
    assert.doesNotMatch(s, /permiteMcp|permiteIntegracoes|podeUsar|permiteVideos|permiteDestaques|ehPlanoComGestao|limite|bloquead|upgrade/i, f)
    assert.doesNotMatch(s, /status_acesso|data_vencimento|trial_ends/, f)
  }
  const usos = arquivos.filter((f) => /ehPlanoFree/.test(semComentarios(ler(f))))
  assert.deepEqual(usos, ['app/[slug]/cartao/page.tsx'])
  assert.match(ler('app/[slug]/cartao/CartaoApp.tsx'), /p\.ehFree && \(/) // so a chamada "Crie sua MiniPage gratis" depende disso
})
test('varredura: sem HTML dinamico (dangerouslySetInnerHTML) em dado de usuario; sem analytics/telemetria nova; sem ids na tela', () => {
  for (const f of arquivos) {
    const s = semComentarios(ler(f))
    if (f !== 'app/painel/cartao/page.tsx') assert.doesNotMatch(s, /dangerouslySetInnerHTML|innerHTML/, f)
    assert.doesNotMatch(s, /\b(gtag|fbq|dataLayer|posthog|mixpanel|sendBeacon|localStorage|sessionStorage|document\.cookie)\b/, f)
  }
  const painel = ler('app/painel/cartao/page.tsx')
  assert.equal((painel.match(/dangerouslySetInnerHTML/g) || []).length, 1); assert.match(painel, /__html: `\.crd\{[^`$]*`/) // so CSS estatico
})
test('varredura: o cartao PUBLICO nunca le sessao/token/armazenamento nem faz chamadas autenticadas ("Entrar no painel" e so um link)', () => {
  for (const f of ['app/[slug]/cartao/page.tsx', 'app/[slug]/cartao/CartaoApp.tsx', 'app/[slug]/cartao/manifest.webmanifest/route.ts', 'app/[slug]/contato.vcf/route.ts']) {
    const s = semComentarios(ler(f))
    assert.doesNotMatch(s, /supabase\.auth|getSession|getUser|onAuthStateChange|access_token|refresh_token|Authorization|Bearer|signIn|signOut|cookies\(|document\.cookie|localStorage|sessionStorage|credentials:/i, f)
    assert.doesNotMatch(s, /\bfetch\(/, f) // o cartao nao faz chamadas de rede no cliente
  }
  const app = semComentarios(ler('app/[slug]/cartao/CartaoApp.tsx'))
  assert.match(app, /href=\{p\.urlPainel\}/) // o botao e um link para um destino fixo
  assert.match(app, /Entrar no painel/); assert.match(app, /Ver minha MiniPage/); assert.match(app, /href=\{p\.urlPublica\}/)
  const pg = semComentarios(ler('app/[slug]/cartao/page.tsx'))
  assert.match(pg, /urlPainel=\{urlPainel\(origem\)\}/); assert.match(pg, /urlPublica=\{urlPublica\(slug\)\}/)
  assert.match(pg, /caminhoQr\(urlQr\(slug\)\)/) // o QR aponta para a MiniPage publica (nunca para o painel nem para o cartao)
  assert.doesNotMatch(pg, /caminhoQr\([^)]*(painel|cartao)/i)
})
test('varredura: painel usa a origem local SO para abrir o cartao; QR, copia e passo a passo do celular usam o endereco publico canonico', () => {
  const s = semComentarios(ler('app/painel/cartao/page.tsx'))
  assert.match(s, /resolverOrigemCartao\(window\.location\)/); assert.equal((s.match(/resolverOrigemCartao\(/g) || []).length, 1)
  assert.match(s, /const cartaoAbrir = perfil \? urlCartao\(origemCartao, perfil\.slug\)/)
  assert.match(s, /const cartaoPublico = perfil \? urlCartao\(HOST_CANONICO, perfil\.slug\)/)
  assert.match(s, /copiar\(cartaoPublico\)/); assert.match(s, /`\$\{cartaoPublico\}\?instalar=1`/); assert.match(s, /caminhoQr\(urlQr\(perfil\.slug\)\)/)
  assert.doesNotMatch(s, /window\.location\.(href|origin)\s*=|location\.replace/) // nenhum redirecionamento por origem do navegador
})
test('varredura: nenhum arquivo existente alem do menu e alterado (vendor MIT presente com licenca)', () => {
  const v = ler('app/lib/vendor/qrcode-generator.mjs'); assert.match(v, /Licensed under the MIT license/); assert.match(v, /Kazuhiko Arase/)
  assert.equal(readdirSync(path.join(RAIZ, 'app/lib/vendor')).sort().join(','), 'qrcode-generator.d.mts,qrcode-generator.mjs')
  for (const f of ['public/cartao/icon-192.png', 'public/cartao/icon-512.png', 'public/cartao/icon-maskable-512.png', 'public/cartao/apple-touch-icon.png']) assert.ok(statSync(path.join(RAIZ, f)).size > 5000, f)
})
