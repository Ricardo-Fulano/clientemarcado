// Testes de COMPORTAMENTO do reconhecimento de marcas (app/lib/marcas.ts). Sem rede, sem Supabase, sem dados reais.
//   node --test "testes_marcas_pix/*.test.mjs"      (aspas obrigatorias no CMD/PowerShell; Node >= 22.18)
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as M from '../app/lib/marcas.ts'

const todos = M.MARCAS.flatMap((m) => m.dominios.map((d) => ({ id: m.id, d })))
const marca = (u) => M.detectarOrigemDoLink(u).marca

test('registro: ids e dominios unicos; ids ja usados pelo projeto continuam existindo (compatibilidade com links antigos)', () => {
  assert.equal(new Set(M.MARCAS.map((m) => m.id)).size, M.MARCAS.length)
  assert.equal(new Set(todos.map((x) => x.d)).size, todos.length, 'dominio repetido entre marcas')
  for (const d of todos) assert.match(d.d, /^[a-z0-9.-]+\.[a-z]{2,}$/) // dominio puro, sem esquema/caminho
  for (const id of ['whatsapp', 'instagram', 'threads', 'telegram', 'tiktok', 'youtube', 'youtube_music', 'x', 'facebook', 'spotify', 'linkedin', 'apple_music', 'deezer', 'amazon_music', 'tidal', 'tinder', 'shopee', 'mercadolivre', 'pinterest', 'twitch', 'discord', 'soundcloud']) assert.ok(M.ehMarcaConhecida(id), id)
  for (const d of M.DOMINIOS_A_CONFIRMAR) assert.ok(todos.some((x) => x.d === d), 'dominio a confirmar fora do registro: ' + d)
})
test('TODOS os dominios do registro: reconhece com/sem www, subdominio, http, maiusculas, sem esquema, caminho, parametros de afiliado e ponto final', () => {
  for (const { id, d } of todos) {
    for (const u of [`https://${d}/x`, `https://www.${d}/x`, `http://sub.${d}/a/b?utm_source=x&af_id=1#f`, `${d}/perfil`, `HTTPS://${d.toUpperCase()}/X`, `https://${d}./x`, `https://${d}:443/x`, `  https://${d}/x  `]) assert.equal(marca(u), id, u)
  }
})
test('TODOS os dominios: rejeita dominios falsos, prefixos colados, userinfo, host no caminho/parametro/fragmento e homografos', () => {
  for (const { id, d } of todos) {
    const falsos = [`https://${d}.site-malicioso.com/x`, `https://${d}.evil.com`, `https://not${d}/x`, `https://${d}x.com/x`, `https://${d}@evil.com/x`, `https://${d}:pass@evil.com/x`, `https://evil.com/${d}`, `https://evil.com/?u=https://${d}`, `https://evil.com/#${d}`, `https://evil.com\\@${d}`, `https://${d.replace(/\./g, '-')}.com`]
    // propriedade: nenhuma variante falsa pode ser reconhecida como a marca do dominio imitado ("notmusic.youtube.com" e legitimamente um subdominio do YouTube, nao do YouTube Music)
    const homografo = d.replace(/[aeiou]/, '\u0430')
    if (homografo !== d) falsos.push(`https://${homografo}/x`) // so se a troca (a latino -> a cirilico) realmente alterou o dominio
    for (const u of falsos) assert.notEqual(marca(u), id, u)
  }
  assert.equal(marca('https://instagram.com.site-malicioso.com/usuario'), null)
  assert.equal(marca('https://instagram.com@evil.com/x'), null)
  assert.equal(marca('https://xn--nstagram-4cg.com/x'), null)
})
test('regressao dos falsos positivos do detector antigo (busca por texto): dropbox/netflix/box/max nao sao "X"; google redirect nao e Instagram', () => {
  for (const u of ['https://dropbox.com/s/abc', 'https://netflix.com', 'https://box.com/x', 'https://www.max.com/x', 'https://sex.com', 'https://www.google.com/url?q=https://instagram.com/x', 'https://example.com/?next=wa.me/5511999999999', 'https://notwa.me/x']) assert.equal(marca(u), null, u)
  assert.equal(marca('https://x.com/usuario'), 'x'); assert.equal(marca('https://twitter.com/usuario'), 'x')
})
test('casos do pedido: instagram, wa.me, spotify, apple music, shopee, mercado livre, kiwify, hotmart', () => {
  const casos = { 'https://www.instagram.com/usuario': 'instagram', 'https://instagram.com/usuario': 'instagram', 'https://wa.me/5511999999999': 'whatsapp', 'https://api.whatsapp.com/send?phone=5511999999999': 'whatsapp', 'https://open.spotify.com/artist/abc': 'spotify', 'https://music.apple.com/br/album/x/1': 'apple_music', 'https://shopee.com.br/produto-i.1.2': 'shopee', 'https://mercadolivre.com.br/x': 'mercadolivre', 'https://produto.mercadolivre.com.br/MLB-1': 'mercadolivre', 'https://www.kiwify.com.br/x': 'kiwify', 'https://pay.kiwify.com.br/abc?afid=1': 'kiwify', 'https://hotmart.com/pt-br/marketplace/produtos/x/A1': 'hotmart', 'https://go.hotmart.com/A123': 'hotmart', 'https://www.amazon.com.br/dp/B0ABC?tag=loja-20': 'amazon', 'https://s.click.aliexpress.com/e/_abc': 'aliexpress', 'https://br.shein.com/x': 'shein', 'https://minhaloja.myshopify.com/products/x': 'shopify', 'https://music.youtube.com/watch?v=x': 'youtube_music', 'https://www.youtube.com/watch?v=x': 'youtube', 'https://youtu.be/x': 'youtube', 'https://linktr.ee/usuario': 'linktree', 'https://usuario.carrd.co': 'carrd', 'https://minipage.pro/maria': 'minipage' }
  for (const [u, e] of Object.entries(casos)) assert.equal(marca(u), e, u)
})
test('mais especifico vence: music.youtube.com > youtube.com; music.amazon.* e amazon.com/music => Amazon Music (so com "/music" por segmento)', () => {
  assert.equal(marca('https://music.youtube.com/x'), 'youtube_music'); assert.equal(marca('https://www.amazon.com.br/music/prime'), 'amazon_music'); assert.equal(marca('https://music.amazon.com.br/albums/x'), 'amazon_music')
  assert.equal(marca('https://www.amazon.com.br/musicas-instrumentos/x'), 'amazon'); assert.equal(marca('https://www.amazon.com.br/dp/B0'), 'amazon')
})
test('encurtadores de terceiros e redirecionadores NUNCA viram marca (destino desconhecido): motivo "encurtador"', () => {
  for (const u of M.ENCURTADORES_E_REDIRECIONADORES.map((d) => `https://${d}/abc`).concat(['https://l.instagram.com/?u=https%3A%2F%2Fevil.com', 'https://lnkd.in/abc', 'https://t.co/abc'])) { const r = M.detectarOrigemDoLink(u); assert.equal(r.marca, null, u); assert.equal(r.motivo, 'encurtador', u) }
  for (const u of ['https://youtu.be/abc', 'https://wa.me/5511999999999', 'https://t.me/usuario', 'https://pin.it/abc', 'https://fb.me/x']) assert.equal(M.detectarOrigemDoLink(u).motivo, 'reconhecida', u) // encurtadores PROPRIOS da marca
})
test('e-mail, telefone e entradas invalidas: nunca lancam; esquemas perigosos e texto livre => invalida; desconhecido => desconhecida', () => {
  assert.equal(marca('mailto:a@b.com'), 'email'); assert.equal(marca('contato@seudominio.com.br'), 'email'); assert.equal(marca('tel:+5511999999999'), 'telefone')
  assert.equal(marca('https://instagram.com@evil.com/x'), null) // "usuario@host" com barra NAO e e-mail
  for (const u of ['javascript:alert(1)', 'data:text/html,<script>', 'file:///etc/passwd', 'ftp://instagram.com', 'intent://x#Intent;end', 'vbscript:x', '@usuario', 'usuario', 'https://', 'http://localhost', 'https://127.0.0.1', 'https://a b.com', 'https://insta\ngram.com', '', '   ', null, undefined, 5, {}, [], 'x'.repeat(3000)]) { let r; assert.doesNotThrow(() => { r = M.detectarOrigemDoLink(u) }); assert.equal(r.marca, null, String(u).slice(0, 30)) }
  assert.equal(M.detectarOrigemDoLink('https://meusite.com.br/loja').motivo, 'desconhecida'); assert.equal(M.detectarOrigemDoLink('').motivo, 'vazio')
})
test('compatibilidade com o detector antigo: URLs que ele reconhecia continuam com o MESMO tipo', () => {
  const antigos = { 'https://t.me/user': 'telegram', 'https://telegram.me/user': 'telegram', 'https://pin.it/abc': 'pinterest', 'https://www.pinterest.com/u': 'pinterest', 'https://twitch.tv/u': 'twitch', 'https://discord.gg/abc': 'discord', 'https://discord.com/invite/abc': 'discord', 'https://soundcloud.com/u': 'soundcloud', 'https://deezer.page.link/abc': 'deezer', 'https://www.deezer.com/br/artist/1': 'deezer', 'https://threads.net/@u': 'threads', 'https://tidal.com/browse/x': 'tidal', 'https://tinder.com/@u': 'tinder', 'https://fb.com/u': 'facebook', 'https://facebook.com/u': 'facebook', 'https://web.whatsapp.com/send?phone=1': 'whatsapp', 'https://tiktok.com/@u': 'tiktok', 'https://vm.tiktok.com/abc': 'tiktok', 'https://linkedin.com/in/u': 'linkedin', 'https://www.linkedin.com/company/x': 'linkedin' }
  for (const [u, e] of Object.entries(antigos)) assert.equal(marca(u), e, u)
})
test('icones: 29 tracados validos (so comandos de path, sem tags/aspas), cor hex, fonte e licenca documentadas; sem icone => lista documentada', () => {
  const ids = Object.keys(M.ICONES_MARCAS)
  assert.equal(ids.length, 29); for (const id of ['instagram', 'whatsapp', 'spotify', 'tiktok', 'shopee', 'deezer', 'apple_music', 'youtube', 'shopify', 'pix', 'x', 'threads']) assert.ok(ids.includes(id), id)
  for (const [id, ic] of Object.entries(M.ICONES_MARCAS)) { assert.match(ic.d, /^[Mm][0-9A-Za-z.,\s+-]+$/, id); assert.ok(ic.d.length > 100, id); assert.match(ic.cor, /^#[0-9A-F]{6}$/, id); assert.doesNotMatch(ic.d, /[<>"'`]/, id) }
  assert.equal(M.ICONES_FONTE, 'simple-icons@16.35.0 (CC0-1.0)')
  assert.deepEqual([...M.MARCAS_SEM_ICONE].sort(), ['tiktok_shop', 'linkedin', 'amazon_music', 'mercadolivre', 'amazon', 'shein', 'kiwify', 'hotmart', 'eduzz', 'monetizze', 'braip', 'kirvano', 'perfectpay', 'linkme', 'beacons'].sort())
  const fonte = readFileSync(new URL('../app/lib/marcas.ts', import.meta.url), 'utf8')
  assert.match(fonte, /NAO e um arquivo fornecido pela empresa dona da marca/); assert.match(fonte, /CC0-1\.0/)
})
test('escolha manual: so ids conhecidos, "generico", "email" e "telefone"; qualquer outra coisa (injecao, vazio, tipos errados) e ignorada', () => {
  for (const ok of ['generico', 'instagram', 'kiwify', 'mercadolivre', 'email', 'telefone', ' tiktok ']) assert.ok(M.escolhaManualValida(ok), ok)
  for (const ruim of ['', ' ', 'Instagram', 'INSTAGRAM', '<script>', 'instagram"', "x' or 1=1", '../x', 'naoexiste', 'x'.repeat(50), null, undefined, 5, {}, []]) assert.equal(M.escolhaManualValida(ruim), null, String(ruim))
})
test('contraste: marcas pretas viram branco no escuro; claras viram quase preto no claro; TODAS as cores ficam >= 3:1 nos dois temas', () => {
  assert.equal(M.corDaMarcaParaTema('#000000', 'dark'), '#FFFFFF'); assert.equal(M.corDaMarcaParaTema('#FFFC00', 'light'), '#1A1A1A'); assert.equal(M.corDaMarcaParaTema('#FF0069', 'dark'), '#FF0069')
  for (const [id, ic] of Object.entries(M.ICONES_MARCAS)) for (const modo of ['dark', 'light']) { const c = M.corDaMarcaParaTema(ic.cor, modo); assert.match(c, /^#[0-9A-Fa-f]{6}$/, id); assert.ok(M.contraste(c, modo === 'dark' ? '#16121C' : '#ECECEC') >= 3, `${id} ${modo} ${c}`) }
  assert.equal(M.corDaMarcaParaTema('lixo', 'dark'), 'lixo')
})
test('varredura: o modulo de marcas nao faz rede, nao segue redirecionamento e nao executa codigo', () => {
  const f = readFileSync(new URL('../app/lib/marcas.ts', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '')
  assert.doesNotMatch(f, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|\beval\s*\(|new Function|require\(|import\s*\(|process\.env|document\.|window\./)
})
