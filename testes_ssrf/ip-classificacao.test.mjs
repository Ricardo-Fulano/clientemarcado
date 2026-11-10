// Classificacao de enderecos IP (IPv4 e IPv6): so IP PUBLICO e roteavel passa. Tabelas baseadas nos registros de enderecos de uso especial da IANA.
import test from 'node:test'
import assert from 'node:assert/strict'
import { registrarCarregador } from './suporte/registrar.mjs'
registrarCarregador()
const { ipEhPublico, expandirIpv6 } = await import('../app/lib/seguranca/url-externa.ts')

const V4_BLOQUEADOS = ['0.0.0.0', '0.1.2.3', '0.255.255.255', '10.0.0.0', '10.1.2.3', '10.255.255.255', '100.64.0.0', '100.64.0.1', '100.100.100.200', '100.127.255.255', '127.0.0.1', '127.0.0.2', '127.255.255.254', '169.254.0.1', '169.254.169.254', '169.254.255.255',
  '172.16.0.0', '172.16.0.1', '172.20.1.1', '172.31.255.255', '192.0.0.0', '192.0.0.192', '192.0.2.1', '192.88.99.1', '192.168.0.1', '192.168.255.255', '198.18.0.1', '198.19.255.255', '198.51.100.7', '203.0.113.9', '224.0.0.1', '233.252.0.1', '239.255.255.255', '240.0.0.1', '250.1.1.1', '255.255.255.254', '255.255.255.255']
const V4_PUBLICOS = ['1.1.1.1', '8.8.8.8', '9.9.9.9', '11.0.0.1', '100.63.255.255', '100.128.0.1', '126.255.255.255', '128.0.0.1', '169.253.255.255', '169.255.0.1', '172.15.255.255', '172.32.0.1', '191.255.255.255', '192.0.1.1', '192.167.255.255', '192.169.0.1', '198.17.255.255', '198.20.0.1', '198.51.99.255', '198.51.101.1', '203.0.112.255', '203.0.114.1', '223.255.255.255']
const V6_BLOQUEADOS = ['::', '::1', '::2', '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:10.0.0.1', '::ffff:a00:1', '::ffff:192.168.1.1', '::ffff:a9fe:a9fe', '::ffff:169.254.169.254', '::ffff:0.0.0.0', '0:0:0:0:0:ffff:7f00:1', '::127.0.0.1', '64:ff9b::7f00:1', '64:ff9b::a00:1', '64:ff9b:1::1', '100::1', '2001::1', '2001:0:4136:e378:8000:63bf:3fff:fdd2', '2001:2::1', '2001:10::1', '2001:1ff:ffff:ffff:ffff:ffff:ffff:ffff',
  '2001:db8::1', '2001:db8:ffff::1', '2002::1', '2002:7f00:1::', '2002:a9fe:a9fe::1', '2002:c0a8:101::', '3fff::1', '3fff:fff::1', 'fc00::1', 'fd00::1', 'fd00:ec2::254', 'fdff:ffff::1', 'fe80::1', 'fe80::1ff:fe23:4567:890a', 'febf::1', 'fec0::1', 'ff00::1', 'ff02::1', 'ff05::2', '1::1', '4000::1', '8000::1', 'e000::1']
const V6_PUBLICOS = ['2001:4860:4860::8888', '2606:4700:4700::1111', '2a00:1450:4001:80b::200e', '2600::1', '2001:200::1', '2001:4860::1', '2400:cb00::1', '2803:f000::1', '2c0f:fb50::1', '3000::1', '3ffe::1', '3ffe:ffff::1', '::ffff:8.8.8.8', '::ffff:808:808', '::ffff:1.1.1.1']
const INVALIDOS = ['', ' ', 'abc', '1.2.3', '1.2.3.4.5', '256.1.1.1', '1.2.3.256', '01.1.1.1', '1.1.1.1/24', '1.1.1.1:80', '[::1]', '::1%eth0', 'fe80::1%lo', '2001:4860:4860::8888%1', '12345::1', 'g::1', ':::', '1:2:3:4:5:6:7:8:9', '::ffff:999.1.1.1', 'localhost', null, undefined, 123, {}]

test(`IPv4 nao publico: ${V4_BLOQUEADOS.length} enderecos de uso especial sao negados`, () => { for (const ip of V4_BLOQUEADOS) assert.equal(ipEhPublico(ip), false, ip) })
test(`IPv4 publico: ${V4_PUBLICOS.length} enderecos (inclusive as bordas logo ao lado das faixas bloqueadas) passam`, () => { for (const ip of V4_PUBLICOS) assert.equal(ipEhPublico(ip), true, ip) })
test(`IPv6 nao publico: ${V6_BLOQUEADOS.length} enderecos (loopback, mapeado privado, NAT64, 6to4, Teredo, documentacao, ULA, link-local, multicast, fora de 2000::/3) sao negados`, () => { for (const ip of V6_BLOQUEADOS) assert.equal(ipEhPublico(ip), false, ip) })
test(`IPv6 publico: ${V6_PUBLICOS.length} enderecos de unicast global (e IPv4 mapeado publico) passam`, () => { for (const ip of V6_PUBLICOS) assert.equal(ipEhPublico(ip), true, ip) })
test(`entradas que nao sao IP valido (${INVALIDOS.length}) sao negadas: nome de host, zona %, formatos malformados e tipos errados`, () => { for (const x of INVALIDOS) assert.equal(ipEhPublico(x), false, String(x)) })
test('o IPv4 embutido no IPv6 mapeado segue a regra do IPv4 (todas as faixas bloqueadas, em hexadecimal e decimal)', () => {
  for (const ip of ['127.0.0.1', '10.9.8.7', '172.16.5.4', '192.168.0.9', '169.254.169.254', '100.64.1.1', '0.0.0.0', '224.0.0.5'].flatMap((v4) => { const p = v4.split('.').map(Number); return ['::ffff:' + v4, '::ffff:' + ((p[0] << 8) | p[1]).toString(16) + ':' + ((p[2] << 8) | p[3]).toString(16)] })) assert.equal(ipEhPublico(ip), false, ip)
})
test('expandirIpv6: forma completa, comprimida, com IPv4 embutido; rejeita zona e lixo', () => {
  assert.deepEqual(expandirIpv6('::1'), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]); assert.equal(expandirIpv6('::').length, 16)
  assert.deepEqual(expandirIpv6('::ffff:1.2.3.4').slice(10), [255, 255, 1, 2, 3, 4]); assert.deepEqual(expandirIpv6('2001:db8::8:800:200c:417a').slice(0, 4), [0x20, 0x01, 0x0d, 0xb8])
  for (const ruim of ['', ':::', '1::2::3', 'fe80::1%eth0', '1:2:3:4:5:6:7', 'zzzz::1', '1:2:3:4:5:6:7:8:9', '::ffff:1.2.3.999']) assert.equal(expandirIpv6(ruim), null, ruim)
})
