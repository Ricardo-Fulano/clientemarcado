// DNS REBINDING e FIXACAO DO DESTINO. Tudo isolado: resolver falso (nenhuma consulta DNS real) e servidores em 127.0.0.1. Cada teste conta conexoes REAIS recebidas pelos servidores.
import test from 'node:test'
import assert from 'node:assert/strict'
import { registrarCarregador } from './suporte/registrar.mjs'
import { iniciar, ipv6Disponivel } from './suporte/servidores.mjs'
registrarCarregador()
const { criarFabrica } = await import('./suporte/fabrica.mjs')
const { fetchSeguro: producao } = await import('../app/lib/seguranca/fetch-seguro.ts')
const ok = (req, res) => { res.setHeader('content-type', 'text/html'); res.end('host=' + req.headers.host) }

test('o nome e resolvido pelo lookup do app (nao pelo DNS do sistema): host inexistente conecta ao IP validado; Host e preservado; o resolver e chamado UMA vez', async () => {
  const srv = await iniciar(ok); const f = await criarFabrica(); f.tabela.set('publico.teste', ['127.0.0.1'])
  try {
    const r = await f.fetchSeguro(`http://publico.teste:${srv.porta}/x`)
    assert.equal(r.ok, true); assert.equal(await r.text(), `host=publico.teste:${srv.porta}`)
    assert.deepEqual(f.chamadasResolver, ['publico.teste']); assert.equal(srv.conexoes, 1)
  } finally { await srv.fechar() }
})
test('resposta MISTA (um endereco publico + um privado) recusa a requisicao INTEIRA: nenhuma conexao e aberta', async () => {
  const srv = await iniciar(ok); const f = await criarFabrica(); f.tabela.set('misto.teste', ['127.0.0.1', '10.0.0.5'])
  try { const r = await f.fetchSeguro(`http://misto.teste:${srv.porta}/`); assert.equal(r.ok, false); assert.equal(r.motivo, 'bloqueado'); assert.equal(srv.conexoes, 0); assert.equal(srv.requisicoes, 0) } finally { await srv.fechar() }
})
test('hosts que resolvem para qualquer endereco nao publico sao bloqueados (IPv4, IPv6, mapeado, metadados, CGNAT), sem conexao', async () => {
  const srv = await iniciar(ok); const f = await criarFabrica()
  try {
    for (const ip of ['10.0.0.1', '172.16.9.9', '192.168.1.1', '169.254.169.254', '100.100.100.200', '100.64.0.1', '0.0.0.0', '127.0.0.2', '::ffff:10.0.0.1', '::ffff:7f00:2', 'fd00:ec2::254', 'fe80::1', '64:ff9b::a00:1', '2002:a00:1::', '224.0.0.1']) {
      f.tabela.set('x.teste', [ip]); const r = await f.fetchSeguro(`http://x.teste:${srv.porta}/`); assert.equal(r.ok, false, ip); assert.equal(r.motivo, 'bloqueado', ip)
    }
    assert.equal(srv.conexoes, 0)
  } finally { await srv.fechar() }
})
test('DNS REBINDING: o resolver devolve IP valido na 1a consulta e IP interno nas seguintes; a conexao usa SOMENTE o IP validado e o servidor "isca" nunca e tocado', async () => {
  const real = await iniciar(ok); const isca = await iniciar(ok); const f = await criarFabrica()
  f.tabela.set('rebind.teste', (n) => (n === 1 ? ['127.0.0.1'] : ['10.0.0.9']))
  try {
    const r = await f.fetchSeguro(`http://rebind.teste:${real.porta}/`)
    assert.equal(r.ok, true); assert.equal(f.chamadasResolver.filter((h) => h === 'rebind.teste').length, 1, 'uma unica resolucao por conexao: nao ha segunda consulta entre validar e conectar')
    assert.equal(real.conexoes, 1); assert.equal(isca.conexoes, 0)
  } finally { await real.fechar(); await isca.fechar() }
})
test('REBINDING entre saltos: o redirecionamento aponta para um nome que agora resolve para IP interno -> bloqueado no 2o salto, sem conexao a ele', async () => {
  const a = await iniciar((req, res) => { res.statusCode = 302; res.setHeader('location', `http://troca.teste:${a.porta}/dentro`); res.end() }); const f = await criarFabrica()
  f.tabela.set('inicio.teste', ['127.0.0.1']); f.tabela.set('troca.teste', ['10.0.0.7'])
  try { const r = await f.fetchSeguro(`http://inicio.teste:${a.porta}/`); assert.equal(r.ok, false); assert.equal(r.motivo, 'bloqueado'); assert.equal(a.requisicoes, 1, 'so a 1a requisicao chegou ao servidor'); assert.deepEqual(f.chamadasResolver, ['inicio.teste', 'troca.teste']) } finally { await a.fechar() }
})
test('cada salto resolve e valida o seu proprio host (A -> B -> C, tres resolucoes) e a cadeia publica funciona ate o fim', async () => {
  let s; s = await iniciar((req, res) => { if (req.url === '/') { res.statusCode = 301; res.setHeader('location', `http://b.teste:${s.porta}/b`); return res.end() } if (req.url === '/b') { res.statusCode = 307; res.setHeader('location', `http://c.teste:${s.porta}/c`); return res.end() } res.setHeader('content-type', 'text/plain'); res.end('fim:' + req.headers.host) }); const f = await criarFabrica()
  for (const h of ['a.teste', 'b.teste', 'c.teste']) f.tabela.set(h, ['127.0.0.1'])
  try { const r = await f.fetchSeguro(`http://a.teste:${s.porta}/`); assert.equal(r.ok, true); assert.equal(await r.text(), `fim:c.teste:${s.porta}`); assert.deepEqual(f.chamadasResolver, ['a.teste', 'b.teste', 'c.teste']); assert.equal(s.conexoes, 3, 'conexao nova por salto (sem keep-alive)') } finally { await s.fechar() }
})
test('IP literal no redirecionamento (loopback, privado, metadados, mapeado) e recusado pela validacao, sem resolver DNS e sem conexao', async () => {
  const alvo = await iniciar(ok); const f = await criarFabrica(); f.tabela.set('ponte.teste', ['127.0.0.1'])
  try {
    for (const destino of ['http://127.0.0.1:__P__/', 'http://[::1]:__P__/', 'http://2130706433:__P__/', 'http://0x7f.1:__P__/', 'http://169.254.169.254/latest/meta-data/', 'http://10.0.0.1/', 'http://[::ffff:127.0.0.1]:__P__/', 'http://localhost:__P__/']) {
      const ponte = await iniciar((req, res) => { res.statusCode = 302; res.setHeader('location', destino.replace('__P__', String(alvo.porta))); res.end() })
      try { const r = await f.fetchSeguro(`http://ponte.teste:${ponte.porta}/`); assert.equal(r.ok, false, destino); assert.ok(['url', 'bloqueado'].includes(r.motivo), destino) } finally { await ponte.fechar() }
    }
    assert.equal(alvo.conexoes, 0)
  } finally { await alvo.fechar() }
})
test('falhas de DNS: sem enderecos, NXDOMAIN, erro temporario -> motivo "dns"; porta fechada -> "rede"', async () => {
  const f = await criarFabrica(); f.tabela.set('vazio.teste', [])
  assert.equal((await f.fetchSeguro('http://vazio.teste:1/')).motivo, 'dns'); assert.equal((await f.fetchSeguro('http://naoexiste.teste:1/')).motivo, 'dns')
  const f2 = await criarFabrica({ resolver: async () => { const e = new Error('tentar de novo'); e.code = 'EAI_AGAIN'; throw e } }); assert.equal((await f2.fetchSeguro('http://qualquer.teste:1/')).motivo, 'dns')
  const f3 = await criarFabrica(); f3.tabela.set('fechada.teste', ['127.0.0.1']); const r = await f3.fetchSeguro('http://fechada.teste:1/'); assert.equal(r.ok, false); assert.equal(r.motivo, 'rede')
})
test('resposta com varios enderecos: o socket usa apenas os validados e cai para o proximo se o primeiro recusar (IPv6 ::1 fechado, IPv4 aberto)', async () => {
  const srv = await iniciar(ok); const f = await criarFabrica(); f.tabela.set('dupla.teste', ['::1', '127.0.0.1'])
  try { const r = await f.fetchSeguro(`http://dupla.teste:${srv.porta}/`); assert.equal(r.ok, true); assert.equal(srv.conexoes, 1); assert.equal(f.chamadasResolver.length, 1) } finally { await srv.fechar() }
})
test('IPv6 real: conexao via ::1 quando o resolver o devolve (ignorado se a maquina nao tiver IPv6)', async (t) => {
  if (!(await ipv6Disponivel())) return t.skip('IPv6 indisponivel neste ambiente')
  const http = await import('node:http'); const srv = http.createServer(ok); await new Promise((o) => srv.listen(0, '::1', o)); const porta = srv.address().port; const f = await criarFabrica(); f.tabela.set('seis.teste', ['::1'])
  try { const r = await f.fetchSeguro(`http://seis.teste:${porta}/`); assert.equal(r.ok, true); assert.equal(await r.text(), `host=seis.teste:${porta}`) } finally { srv.closeAllConnections?.(); await new Promise((o) => srv.close(o)) }
})
test('CONFIGURACAO DE PRODUCAO: servidores em loopback sao inalcancaveis por qualquer forma de endereco (nome, IP literal, formas alternativas, IPv6), sem nenhuma conexao', async () => {
  const srv = await iniciar(ok)
  try {
    for (const u of [`http://127.0.0.1:${srv.porta}/`, `http://localhost:${srv.porta}/`, `http://[::1]:${srv.porta}/`, `http://2130706433:${srv.porta}/`, `http://0x7f.1:${srv.porta}/`, `http://127.1:${srv.porta}/`, `http://0.0.0.0:${srv.porta}/`, `http://[::ffff:127.0.0.1]:${srv.porta}/`, 'http://127.0.0.1/', 'http://localhost/', 'http://169.254.169.254/latest/meta-data/', 'http://10.0.0.1/', 'http://192.168.0.1/', 'http://metadata.google.internal/', 'file:///etc/passwd', 'ftp://exemplo.com/']) {
      const r = await producao(u); assert.equal(r.ok, false, u); assert.equal(r.motivo, 'url', u)
    }
    assert.equal(srv.conexoes, 0)
  } finally { await srv.fechar() }
})
test('DEFESA EM PROFUNDIDADE: mesmo que a validacao de URL deixasse passar um IP literal privado, o fetchSeguro o recusa ("bloqueado") antes de qualquer conexao', async () => {
  const f = await criarFabrica({ validarUrl: (e) => { const u = new URL(e); return { ok: true, url: u, hostname: u.hostname.replace(/[\[\]]/g, ''), ehIp: true } } })
  for (const ip of ['10.0.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '[fd00::1]', '[::ffff:10.0.0.1]']) { const t0 = Date.now(); const r = await f.fetchSeguro(`http://${ip}/`, { timeoutMs: 800 }); assert.equal(r.ok, false, ip); assert.equal(r.motivo, 'bloqueado', ip); assert.ok(Date.now() - t0 < 400, 'recusado na hora, sem tentar conectar: ' + ip) }
})

