// Validacao de URLs externas: esquema, credenciais, portas, hosts internos, IP literal em formas alternativas, caracteres de controle, tamanho.
import test from 'node:test'
import assert from 'node:assert/strict'
import { registrarCarregador } from './suporte/registrar.mjs'
registrarCarregador()
const { validarUrlExterna, hostnameProibido, TAMANHO_MAXIMO_URL } = await import('../app/lib/seguranca/url-externa.ts')
const motivo = (u) => { const r = validarUrlExterna(u); return r.ok ? 'OK' : r.motivo }

test('URLs publicas validas: http e https, subdominios, IDN (punycode), FQDN com ponto final, portas 80/443 explicitas, query e fragmento, IPv4 e IPv6 publicos', () => {
  for (const u of ['https://exemplo.com/', 'http://exemplo.com/a/b?c=d#e', 'https://www.exemplo.com.br/produto?id=1', 'https://sub.dominio.exemplo.co.uk/x', 'https://exemplo.com.:443/', 'http://exemplo.com:80/', 'https://exemplo.com:443/', 'http://exemplo.com:443/', 'https://exemplo.com:80/', 'https://bücher.example/', 'https://xn--bcher-kva.example/', 'https://EXEMPLO.COM/Path', 'https://8.8.8.8/', 'http://1.1.1.1:80/x', 'https://[2606:4700:4700::1111]/', 'https://a-b.exemplo.com/', 'https://exemplo.com/caminho com espaco']) assert.equal(motivo(u), 'OK', u)
})
test('esquemas diferentes de http/https sao negados', () => { for (const u of ['ftp://exemplo.com/', 'file:///etc/passwd', 'gopher://exemplo.com/', 'data:text/html,<h1>x</h1>', 'javascript:alert(1)', 'ws://exemplo.com/', 'wss://exemplo.com/', 'blob:https://exemplo.com/x', 'about:blank', 'ssh://exemplo.com/', 'dict://exemplo.com:11211/', 'ldap://exemplo.com/']) assert.notEqual(motivo(u), 'OK', u) })
test('usuario e senha na URL sao negados (inclusive o truque http://confiavel@interno)', () => { for (const u of ['http://a@exemplo.com/', 'http://a:b@exemplo.com/', 'https://exemplo.com@127.0.0.1/', 'https://exemplo.com:80@10.0.0.1/', 'http://%40@exemplo.com/']) assert.equal(motivo(u), 'credenciais', u) })
test('portas diferentes de 80 e 443 sao negadas', () => { for (const p of [21, 22, 25, 53, 110, 143, 3306, 5432, 6379, 8080, 8443, 9200, 11211, 27017, 65535, 1]) assert.equal(motivo(`http://exemplo.com:${p}/`), 'porta', String(p)) })
test('IP literal em formas alternativas e normalizado pelo parser e NEGADO quando nao publico', () => {
  for (const u of ['http://127.0.0.1/', 'http://0x7f.1/', 'http://0x7f000001/', 'http://2130706433/', 'http://017700000001/', 'http://127.1/', 'http://127.0.1/', 'http://0/', 'http://0.0.0.0/', 'http://10.0.0.1/', 'http://012.0.0.1/', 'http://0xa.0.0.1/', 'http://167772161/', 'http://169.254.169.254/latest/meta-data/', 'http://2852039166/', 'http://192.168.0.1/', 'http://3232235521/', 'http://172.16.0.1/', 'http://100.100.100.200/', 'http://１２７.０.０.１/', 'http://127。0。0。1/', 'http://[::1]/', 'http://[0:0:0:0:0:0:0:1]/', 'http://[::]/', 'http://[::ffff:127.0.0.1]/', 'http://[::ffff:7f00:1]/', 'http://[::ffff:a9fe:a9fe]/', 'http://[64:ff9b::7f00:1]/', 'http://[2002:7f00:1::]/', 'http://[fd00:ec2::254]/', 'http://[fe80::1]/', 'http://[fc00::1]/']) assert.equal(motivo(u), 'ip', u)
})
test('o validador avalia o destino NORMALIZADO (o que o socket usaria): 010.0.0.1 e octal = 8.0.0.1 (publico); userinfo vazio e inofensivo', () => {
  assert.equal(new URL('http://010.0.0.1/').hostname, '8.0.0.1'); assert.equal(motivo('http://010.0.0.1/'), 'OK'); assert.equal(motivo('http://012.0.0.1/'), 'ip'); assert.equal(motivo('http://:@exemplo.com/'), 'OK')
})
test('nomes de host internos ou invalidos sao negados', () => {
  for (const h of ['localhost', 'LOCALHOST', 'localhost.', 'foo.localhost', 'a.b.localhost', 'impressora.local', 'servidor.internal', 'metadata.google.internal', 'x.intranet', 'roteador.lan', 'host.home.arpa', 'x.localdomain', 'sistema.corp', 'srv.private', 'intranet', 'servidor', 'api', 'x', 'ex_emplo.com', 'exem plo.com', '-exemplo.com', 'exemplo-.com', '.exemplo.com', 'exemplo..com']) assert.notEqual(motivo(`http://${h}/`), 'OK', h)
  assert.equal(hostnameProibido('localhost.'), true); assert.equal(hostnameProibido('exemplo.com'), false); assert.equal(hostnameProibido('a'.repeat(64) + '.com'), true); assert.equal(hostnameProibido(Array(60).fill('abcde').join('.') + '.com'), true)
})
test('entradas malformadas: vazio, tipos errados, espacos, quebras de linha, tab, NUL, barras invertidas, tamanho', () => {
  for (const u of ['', ' ', 'exemplo.com', '//exemplo.com', 'http://', 'http:///', 'http://exemplo.com\n/', 'http://exemplo.com\r\n/x', 'http://exem\tplo.com/', 'http://exemplo.com/\u0000', 'http://exemplo.com/\u007f', 'http://exemplo .com/', null, undefined, 123, {}, [], true]) assert.notEqual(motivo(u), 'OK', JSON.stringify(u))
  assert.equal(motivo('http://' + 'a'.repeat(TAMANHO_MAXIMO_URL) + '.com/'), 'tamanho')
  assert.equal(motivo('https://exemplo.com/' + 'a'.repeat(TAMANHO_MAXIMO_URL - 20)), 'OK'); assert.equal(motivo('https://exemplo.com/' + 'a'.repeat(TAMANHO_MAXIMO_URL)), 'tamanho')
  assert.equal(motivo('http:\\\\127.0.0.1\\x'), 'ip', 'barra invertida: o parser a trata como "/" e o IP e validado depois da normalizacao')
})
test('o resultado traz hostname sem colchetes e a URL normalizada', () => {
  const r = validarUrlExterna('https://[2606:4700:4700::1111]/x'); assert.equal(r.ok, true); assert.equal(r.hostname, '2606:4700:4700::1111'); assert.equal(r.ehIp, true)
  const n = validarUrlExterna('https://EXEMPLO.com/A'); assert.equal(n.hostname, 'exemplo.com'); assert.equal(n.ehIp, false); assert.equal(n.url.href, 'https://exemplo.com/A')
})
