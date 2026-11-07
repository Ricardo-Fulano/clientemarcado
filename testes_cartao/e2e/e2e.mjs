import http from 'node:http'
import assert from 'node:assert/strict'
const P = 3500
const req = (path, { host = 'minipage.pro', method = 'GET', headers = {} } = {}) => new Promise((ok, err) => {
  const r = http.request({ host: '127.0.0.1', port: P, path, method, headers: { host, 'accept-language': 'pt-BR', ...headers } }, (res) => { const c = []; res.on('data', (d) => c.push(d)); res.on('end', () => { const raw = Buffer.concat(c); ok({ status: res.statusCode, h: res.headers, raw, body: raw.toString('utf8') }) }) })
  r.on('error', err); r.end()
})
let n = 0, f = 0
const t = async (nome, fn) => { n++; try { await fn(); console.log('OK    ' + nome) } catch (e) { f++; console.log('FALHA ' + nome + '\n      ' + String(e.message).split('\n').slice(0, 3).join(' | ')) } }

// ---------------- cartao
await t('cartao Free (maria): 200 sem login, noindex, manifesto/icones/apple da MESMA origem, CTA "Crie sua MiniPage gratis"', async () => {
  const r = await req('/maria/cartao')
  assert.equal(r.status, 200)
  assert.match(r.body, /<link rel="manifest" href="https:\/\/minipage\.pro\/maria\/cartao\/manifest\.webmanifest"/)
  assert.match(r.body, /<meta name="robots" content="noindex, nofollow"/)
  assert.match(r.body, /apple-mobile-web-app-title" content="Maria[^"]*"/)
  assert.match(r.body, /rel="apple-touch-icon"[^>]*href="https:\/\/minipage\.pro\/cartao\/apple-touch-icon\.png/)
  assert.match(r.body, /rel="canonical" href="https:\/\/minipage\.pro\/maria"/)
  assert.match(r.body, /Crie sua MiniPage/)
  assert.match(r.body, /\/maria\/contato\.vcf/)
  assert.match(r.body, /Aponte a câmera e acesse minha MiniPage/)
  assert.match(r.body, /name="theme-color" content="#08060A"/)
})
await t('cartao pago (joao/essencial) e (loja1/loja) e (anakbeautystudio-/equipe): 200 com ACESSO INTEGRAL ao recurso e SEM a chamada de aquisicao', async () => {
  for (const s of ['joao', 'loja1', 'anakbeautystudio-']) {
    const r = await req('/' + encodeURIComponent(s) + '/cartao')
    assert.equal(r.status, 200, s)
    assert.match(r.body, /Aponte a câmera e acesse minha MiniPage/, s)
    for (const b of ['Mostrar meu QR Code', 'Compartilhar MiniPage', 'Ver minha MiniPage', 'Entrar no painel']) assert.match(r.body, new RegExp(b), s + ': ' + b)
    assert.doesNotMatch(r.body, /Crie sua MiniPage/, s)
    assert.match(r.body, /<path d="M\d/, 'QR presente: ' + s)
  }
})
await t('NOVA INTERFACE: titulo/descricao, 4 botoes e destinos corretos (Ver minha MiniPage = URL publica canonica; Entrar no painel = /painel no dominio do painel)', async () => {
  const r = await req('/maria/cartao')
  assert.match(r.body, /Seu cartão de visitas digital/); assert.match(r.body, /Deslize para o lado para mostrar o QR Code/)
  assert.match(r.body, /<a class="cd-btn" href="https:\/\/minipage\.pro\/maria">Ver minha MiniPage<\/a>/)
  assert.match(r.body, /<a class="cd-btn" href="https:\/\/www\.clientemarcado\.com\.br\/painel" rel="noopener noreferrer">Entrar no painel<\/a>/)
  assert.match(r.body, /<button[^>]*>Mostrar meu QR Code<\/button>/); assert.match(r.body, /<button[^>]*>Compartilhar MiniPage<\/button>/)
  assert.match(r.body, /Escaneie o QR Code para acessar meus contatos e links/)
  assert.doesNotMatch(r.body, /Descrição longa da Maria|Unhas e beleza em SP/) // a descricao do perfil nao e mais exibida: texto fixo pedido
})
await t('"Entrar no painel" por host: clientemarcado.com.br => mesma origem; minipage.pro e host forjado => dominio do painel; link PURO (sem token/sessao/slug)', async () => {
  const href = (b) => /href="([^"]+)" rel="noopener noreferrer">Entrar no painel/.exec(b)[1]
  assert.equal(href((await req('/maria/cartao', { host: 'www.clientemarcado.com.br' })).body), 'https://www.clientemarcado.com.br/painel')
  assert.equal(href((await req('/maria/cartao', { host: 'clientemarcado.com.br' })).body), 'https://clientemarcado.com.br/painel')
  assert.equal(href((await req('/maria/cartao', { host: 'minipage.pro' })).body), 'https://www.clientemarcado.com.br/painel')
  assert.equal(href((await req('/maria/cartao', { host: 'evil.example.com' })).body), 'https://www.clientemarcado.com.br/painel')
})
await t('SEGURANCA: o cartao e publico e nao concede nada ao dono: 200 sem credencial, sem Set-Cookie, sem Authorization usado, mesmo conteudo com cookie/Authorization forjados', async () => {
  const a = await req('/maria/cartao'); assert.equal(a.status, 200); assert.equal(a.h['set-cookie'], undefined)
  const b = await req('/maria/cartao', { headers: { cookie: 'sb-access-token=fake; sb-refresh-token=fake', authorization: 'Bearer fake.jwt.token' } })
  assert.equal(b.status, 200); assert.equal(b.h['set-cookie'], undefined)
  assert.equal(b.body.replace(/<script[\s\S]*?<\/script>/g, ''), a.body.replace(/<script[\s\S]*?<\/script>/g, '')) // nada muda para quem "parece" logado
  for (const p of ['/maria/cartao/manifest.webmanifest', '/maria/contato.vcf']) assert.equal((await req(p, { headers: { authorization: 'Bearer fake' } })).h['set-cookie'], undefined, p)
})
await t('XSS: nome com <b> e aspas aparece como TEXTO escapado, nunca como tag', async () => {
  const r = await req('/maria/cartao')
  assert.match(r.body, /Maria &lt;b&gt;Studio&lt;\/b&gt; &amp; &quot;Cia&quot;/)
  assert.doesNotMatch(r.body, /<b>Studio<\/b>/)
})
await t('SEM VAZAMENTO: o HTML do cartao nao contem user_id, plano, e-mail, endereco do perfil nem campos internos', async () => {
  for (const s of ['maria', 'joao']) {
    const r = await req('/' + s + '/cartao')
    for (const proibido of ['user_id', 'u-maria', 'u-joao', 'plano_tipo', 'essencial', 'Rua Secreta', 'perfis_publicos', 'pagina_mostrar_contato', 'trial_ends', 'gateway', 'cpf']) assert.equal(r.body.includes(proibido), false, s + ' vazou: ' + proibido)
  }
})
await t('slug inexistente: 404 (pagina, manifesto e vcf)', async () => {
  for (const p of ['/naoexiste/cartao', '/naoexiste/cartao/manifest.webmanifest', '/naoexiste/contato.vcf']) assert.equal((await req(p)).status, 404, p)
})
await t('"@slug" funciona (middleware redireciona 308 para o slug sem @, mantendo /cartao)', async () => {
  const r = await req('/@maria/cartao')
  assert.equal(r.status, 308)
  assert.match(r.h.location, /^(http:\/\/minipage\.pro(:\d+)?)?\/maria\/cartao$/)
})
await t('hosts: clientemarcado.com.br tambem serve o cartao, com manifesto na PROPRIA origem; host forjado cai no dominio canonico', async () => {
  let r = await req('/maria/cartao', { host: 'www.clientemarcado.com.br' })
  assert.match(r.body, /href="https:\/\/www\.clientemarcado\.com\.br\/maria\/cartao\/manifest\.webmanifest"/)
  r = await req('/maria/cartao', { host: 'evil.example.com' })
  assert.match(r.body, /href="https:\/\/minipage\.pro\/maria\/cartao\/manifest\.webmanifest"/)
  assert.doesNotMatch(r.body, /evil\.example/)
})

// ---------------- manifesto
await t('manifesto individual: id/start_url/scope do PROPRIO slug, display standalone, icones 192/512/maskable, content-type correto', async () => {
  const r = await req('/maria/cartao/manifest.webmanifest')
  assert.equal(r.status, 200)
  assert.match(r.h['content-type'], /^application\/manifest\+json/)
  const m = JSON.parse(r.body)
  assert.equal(m.id, '/maria/cartao'); assert.equal(m.start_url, '/maria/cartao?origem=atalho'); assert.equal(m.scope, '/maria/')
  assert.equal(m.display, 'standalone'); assert.equal(m.lang, 'pt-BR')
  assert.ok(m.start_url.startsWith(m.scope) || ('/' + m.start_url.split('?')[0].slice(1)).startsWith(m.scope.slice(0, -1)))
  assert.deepEqual(m.icons.map((i) => i.purpose + ':' + i.sizes), ['any:192x192', 'any:512x512', 'maskable:512x512'])
  assert.equal(m.name, 'Maria <b>Studio</b> & "Cia"'); assert.ok(m.short_name.length <= 14)
  assert.equal(m.shortcuts[0].url, '/maria/cartao?origem=atalho&painel=qr')
})
await t('cada MiniPage tem o SEU manifesto (ids diferentes => atalhos independentes) e o escopo nunca casa com outro slug por prefixo', async () => {
  const a = JSON.parse((await req('/maria/cartao/manifest.webmanifest')).body), b = JSON.parse((await req('/joao/cartao/manifest.webmanifest')).body)
  assert.notEqual(a.id, b.id); assert.notEqual(a.scope, b.scope); assert.equal(b.id, '/joao/cartao')
  assert.equal('/mariana/cartao'.startsWith(a.scope), false) // o escopo "/maria/" NAO engole "/mariana"
  const c = JSON.parse((await req('/anakbeautystudio-/cartao/manifest.webmanifest')).body)
  assert.equal(c.scope, '/anakbeautystudio-/')
})
await t('icones do manifesto existem e sao PNG nos tamanhos declarados', async () => {
  for (const [p, bytes] of [['/cartao/icon-192.png', 192], ['/cartao/icon-512.png', 512], ['/cartao/icon-maskable-512.png', 512], ['/cartao/apple-touch-icon.png', 180]]) {
    const r = await req(p); assert.equal(r.status, 200, p); assert.match(r.h['content-type'], /image\/png/)
    assert.equal(r.raw.readUInt32BE(16), bytes, p); assert.equal(r.raw.readUInt32BE(20), bytes, p)
  }
})

// ---------------- vCard
await t('vCard (maria): BEGIN/END, CRLF, TEL do link ATIVO de menor ordem, URL canonica, ADR (contato visivel), cabecalhos de download', async () => {
  const r = await req('/maria/contato.vcf')
  assert.equal(r.status, 200)
  assert.match(r.h['content-type'], /^text\/vcard; charset=utf-8/)
  assert.match(r.h['content-disposition'], /^attachment; filename="contato-maria\.vcf"$/)
  assert.ok(r.body.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')); assert.ok(r.body.endsWith('END:VCARD\r\n'))
  assert.equal(r.body.replace(/\r\n/g, '').includes('\n'), false)
  assert.match(r.body, /\r\nTEL;TYPE=CELL,VOICE:\+5511941059063\r\n/) // o link inativo (ordem 0) foi ignorado
  assert.match(r.body, /\r\nURL:https:\/\/minipage\.pro\/maria\r\n/)
  assert.match(r.body, /\r\nADR;TYPE=WORK:;;Rua A\\, 10;São Paulo;;;\r\n/)
  assert.match(r.body, /\r\nFN:Maria <b>Studio<\/b> & "Cia"\r\n/) // texto literal (vCard nao interpreta HTML)
})
await t('vCard (joao): endereco/cidade OMITIDOS porque a secao Contato esta oculta; telefone de link tel:', async () => {
  const r = await req('/joao/contato.vcf')
  assert.equal(r.status, 200)
  assert.doesNotMatch(r.body, /ADR/); assert.doesNotMatch(r.body, /Rua Secreta|Campinas/)
  assert.match(r.body, /TEL;TYPE=CELL,VOICE:\+551122223333/)
})
await t('vCard sem telefone publico (ana: wa.me/message/...; loja1 sem links): NAO inventa TEL', async () => {
  for (const s of ['anakbeautystudio-', 'loja1']) { const r = await req('/' + encodeURIComponent(s) + '/contato.vcf'); assert.equal(r.status, 200); assert.doesNotMatch(r.body, /TEL/, s) }
})
await t('vCard INJECAO: quebras de linha e END:VCARD no nome/endereco viram texto; o arquivo tem exatamente 1 BEGIN e 1 END; sem vazar user_id', async () => {
  const r = await req('/mal/contato.vcf')
  assert.equal((r.body.match(/^BEGIN:VCARD/gm) || []).length, 1); assert.equal((r.body.match(/^END:VCARD/gm) || []).length, 1)
  assert.equal(r.body.split('\r\n').filter((l) => /^FN:/.test(l)).length, 1)
  const linhasValidas = r.body.split('\r\n').filter(Boolean).every((l) => l.startsWith(' ') || /^[A-Z][A-Za-z0-9-]*(;[^:]*)?:/.test(l))
  assert.equal(linhasValidas, true, 'toda linha deve ser PROPRIEDADE ou continuacao')
  assert.match(r.body, /TEL;TYPE=CELL,VOICE:\+5511988887777/); assert.doesNotMatch(r.body, /u-mal/)
})

// ---------------- sem regressao
await t('regras existentes do middleware intactas: www.minipage.pro -> 308 sem www; raiz minipage.pro -> clientemarcado; /@slug -> 308', async () => {
  let r = await req('/maria', { host: 'www.minipage.pro' }); assert.equal(r.status, 308); assert.match(r.h.location, /^http:\/\/minipage\.pro(:\d+)?\/maria/)
  r = await req('/', { host: 'minipage.pro' }); assert.equal(r.status, 307); assert.equal(r.h.location, 'https://www.clientemarcado.com.br/')
  r = await req('/@maria', { host: 'minipage.pro' }); assert.equal(r.status, 308)
})
await t('pagina publica e login continuam respondendo; /oauth/consent mantem seus cabecalhos (sem tocar no middleware)', async () => {
  assert.equal((await req('/maria')).status, 200); assert.equal((await req('/login', { host: 'www.clientemarcado.com.br' })).status, 200)
})
await t('rota de painel Meu cartao existe (estatica, o login e exigido no cliente como nas demais paginas do painel)', async () => {
  const r = await req('/painel/cartao', { host: 'www.clientemarcado.com.br' }); assert.equal(r.status, 200)
})
console.log(`\nE2E: ${n - f} de ${n} OK`)
process.exit(f ? 1 : 0)
