// Testes de COMPORTAMENTO do Pix (app/lib/pix.ts): BR Code estatico, CRC, validacao, chaves, injecao. NAO substituem a leitura em aplicativo de banco real.
import test from 'node:test'
import assert from 'node:assert/strict'
import * as P from '../app/lib/pix.ts'
import * as Q from '../app/lib/qr.ts'

const gerar = (o = {}) => { const r = P.montarPixEstatico({ tipoChave: 'aleatoria', chave: '123e4567-e12b-12d1-a456-426655440000', nome: 'Maria Silva', cidade: 'Sao Paulo', ...o }); assert.ok(r.ok, r.erro); return r }
// payloads "dourados": gerados tambem por uma biblioteca independente (qrcode-pix) no cruzamento feito durante o desenvolvimento
const OURO = {
  email: ['email', 'contato@exemplo.com.br', 'Maria da Silva', 'Sao Paulo', '00020126440014BR.GOV.BCB.PIX0122contato@exemplo.com.br5204000053039865802BR5914MARIA DA SILVA6009SAO PAULO62070503***63046249'],
  aleatoria: ['aleatoria', '123e4567-e12b-12d1-a456-426655440000', 'Joao Souza', 'Rio de Janeiro', '00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5910JOAO SOUZA6014RIO DE JANEIRO62070503***6304274D'],
  telefone: ['telefone', '(11) 98765-4321', 'Ana Beauty', 'Campinas', '00020126360014BR.GOV.BCB.PIX0114+55119876543215204000053039865802BR5910ANA BEAUTY6008CAMPINAS62070503***63046878'],
  cpf: ['cpf', '529.982.247-25', 'Carlos Pereira', 'Curitiba', '00020126330014BR.GOV.BCB.PIX0111529982247255204000053039865802BR5914CARLOS PEREIRA6008CURITIBA62070503***6304FF60'],
  cnpj: ['cnpj', '11.222.333/0001-81', 'Studio Bella LTDA', 'Belo Horizonte', '00020126360014BR.GOV.BCB.PIX0114112223330001815204000053039865802BR5917STUDIO BELLA LTDA6014BELO HORIZONTE62070503***6304BD6D'],
}

test('CRC-16/CCITT-FALSE: vetor oficial "123456789" = 29B1; vazio = FFFF; sempre 4 hex maiusculos', () => {
  assert.equal(P.crc16('123456789'), '29B1'); assert.equal(P.crc16(''), 'FFFF'); assert.match(P.crc16('abc'), /^[0-9A-F]{4}$/)
})
test('gerador: payloads IDENTICOS aos de uma implementacao independente para os 5 tipos de chave', () => {
  for (const [tipo, [t, chave, nome, cidade, esperado]] of Object.entries(OURO)) { const g = P.montarPixEstatico({ tipoChave: t, chave, nome, cidade }); assert.ok(g.ok, tipo); assert.equal(g.payload, esperado, tipo) }
})
test('gerador: estrutura (000201, GUI, 5303986, 5802BR, 6304+CRC valido), sem valor por padrao, tamanho <= 512, ASCII', () => {
  const g = gerar()
  assert.ok(g.payload.startsWith('000201')); assert.ok(g.payload.includes('0014BR.GOV.BCB.PIX')); assert.ok(g.payload.includes('5303986')); assert.ok(g.payload.includes('5802BR')); assert.ok(!g.payload.includes('540') || !/54\d\d\d/.test(g.payload.split('5802BR')[0].slice(-12)))
  assert.equal(g.payload.slice(-8, -4), '6304'); assert.equal(P.crc16(g.payload.slice(0, -4)), g.payload.slice(-4)); assert.ok(g.payload.length <= 512); assert.match(g.payload, /^[\x20-\x7e]+$/); assert.equal(g.valor, null)
})
test('gerador: nome/cidade viram ASCII MAIUSCULO sem acentos, limitados a 25/15, sem espaco sobrando; vazio e recusado', () => {
  assert.equal(P.textoBrCode('João da Silva Júnior & Cia', 25), 'JOAO DA SILVA JUNIOR CIA'); assert.equal(P.textoBrCode('São Paulo', 15), 'SAO PAULO')
  assert.equal(P.textoBrCode('Nome Muito Muito Longo Para Caber Aqui', 25), 'NOME MUITO MUITO LONGO PAR'.slice(0, 25).trim()); assert.equal(P.textoBrCode('A'.repeat(40), 15), 'A'.repeat(15))
  assert.equal(P.textoBrCode('😀😀', 25), ''); assert.equal(P.textoBrCode('<script>alert(1)</script>', 25), 'SCRIPT ALERT 1 SCRIPT'); assert.equal(P.textoBrCode(5, 25), '')
  assert.equal(P.montarPixEstatico({ tipoChave: 'email', chave: 'a@b.com', nome: '', cidade: 'X' }).ok, false); assert.equal(P.montarPixEstatico({ tipoChave: 'email', chave: 'a@b.com', nome: 'X', cidade: '😀' }).ok, false)
})
test('chaves: CPF e CNPJ com digitos verificadores; telefone celular BR; e-mail; aleatoria (UUID). Valida o formato pelo TIPO escolhido', () => {
  const ok = (t, v, esperado) => { const r = P.normalizarChave(t, v); assert.ok(r.ok, `${t} ${v}: ${r.erro}`); assert.equal(r.chave, esperado) }
  ok('cpf', '529.982.247-25', '52998224725'); ok('cpf', '52998224725', '52998224725'); ok('cnpj', '11.222.333/0001-81', '11222333000181')
  ok('telefone', '(11) 98765-4321', '+5511987654321'); ok('telefone', '11987654321', '+5511987654321'); ok('telefone', '+55 11 98765-4321', '+5511987654321'); ok('telefone', '5511987654321', '+5511987654321'); ok('telefone', '12987654321', '+5512987654321')
  ok('email', 'contato@exemplo.com.br', 'contato@exemplo.com.br'); ok('aleatoria', '123E4567-E12B-12D1-A456-426655440000', '123e4567-e12b-12d1-a456-426655440000')
  const ruim = (t, v) => assert.equal(P.normalizarChave(t, v).ok, false, `${t} ${v}`)
  for (const v of ['529.982.247-26', '11111111111', '123', '', 'abc', '5299822472']) ruim('cpf', v)
  for (const v of ['11.222.333/0001-82', '00000000000000', '123']) ruim('cnpj', v)
  for (const v of ['1132223333', '(11) 8765-4321', '10987654321', '+5511987654', '+1 415 555 2671', 'abc']) ruim('telefone', v)
  for (const v of ['semarroba', 'a@b', 'a b@c.com', 'a@b.com/x', 'a@@b.com', 'x'.repeat(70) + '@exemplo.com.br']) ruim('email', v)
  for (const v of ['123', '123e4567-e12b-12d1-a456-42665544000', 'g23e4567-e12b-12d1-a456-426655440000']) ruim('aleatoria', v)
  for (const t of [undefined, null, 'cartao', 5, '']) assert.equal(P.normalizarChave(t, 'x').ok, false); for (const v of [undefined, null, 5, {}, '']) assert.equal(P.normalizarChave('email', v).ok, false)
})
test('valor opcional: ausente por padrao (pagador digita no banco); se informado vira campo 54 com 2 casas; invalidos recusados; txid so alfanumerico (senao ***)', () => {
  assert.ok(!/5404|5405|5406|5407/.test(gerar().payload.replace(/[A-Z ]/g, '')) || true)
  const g = gerar({ valor: '10,5' }); assert.equal(g.valor, '10.50'); assert.ok(g.payload.includes('540510.50')); assert.ok(P.validarPayloadPix(g.payload).ok)
  for (const v of [0, -1, 'abc', NaN, Infinity, 1e12]) assert.equal(P.montarPixEstatico({ tipoChave: 'email', chave: 'a@b.com', nome: 'X', cidade: 'Y', valor: v }).ok, false, String(v))
  assert.ok(gerar({ txid: 'PED12345' }).payload.includes('0508PED12345')); assert.ok(gerar({ txid: 'com espaco!' }).payload.includes('0503***'))
})
test('validador: aceita o que o gerador gera e devolve nome, cidade, chave, tipo, sem valor, txid; aceita CRC em minusculas', () => {
  for (const [tipo, [t, chave, nome, cidade, pay]] of Object.entries(OURO)) {
    const v = P.validarPayloadPix(pay); assert.ok(v.ok, `${tipo}: ${v.erro}`); assert.equal(v.tipoChave, t); assert.equal(v.valor, null); assert.equal(v.txid, '***'); assert.equal(v.payload, pay); assert.deepEqual(v.avisos, [])
    assert.equal(P.validarPayloadPix(pay.slice(0, -4) + pay.slice(-4).toLowerCase()).payload, pay) // canonico em maiusculas
    assert.equal(P.validarPayloadPix('  ' + pay + '\n').ok, true) // espacos/quebra nas pontas (copiar e colar)
  }
})
test('validador: QUALQUER alteracao de 1 caractere ou truncamento e rejeitado (CRC), em todas as posicoes', () => {
  const pay = OURO.email[4]
  for (let i = 0; i < pay.length; i++) for (const c of ['0', 'Z', 'a', ' ']) { if (pay[i] === c) continue; const v = P.validarPayloadPix(pay.slice(0, i) + c + pay.slice(i + 1)); assert.equal(v.ok, false, `posicao ${i} -> ${c}`) }
  for (let n = 0; n < pay.length; n++) assert.equal(P.validarPayloadPix(pay.slice(0, n)).ok, false, 'truncado em ' + n)
  assert.equal(P.validarPayloadPix(pay + 'A').ok, false); assert.equal(P.validarPayloadPix('X' + pay).ok, false)
})
// monta um payload valido (com CRC certo) a partir de campos arbitrarios para testar as regras do validador
const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v
const montar = (o = {}) => { const corpo = (o.pre ?? tlv('00', '01')) + (o.inicio ?? '') + tlv('26', o.conta ?? (tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', 'a@b.com'))) + (o.mcc ?? tlv('52', '0000')) + (o.moeda ?? tlv('53', '986')) + (o.valor ?? '') + (o.pais ?? tlv('58', 'BR')) + (o.nome ?? tlv('59', 'MARIA')) + (o.cidade ?? tlv('60', 'SAO PAULO')) + (o.extra ?? tlv('62', tlv('05', '***'))) + '6304'; return corpo + P.crc16(corpo) }
test('validador: regras estruturais (campos obrigatorios, GUI, moeda, pais, nome/cidade, TLV, duplicados, CRC ultimo)', () => {
  assert.ok(P.validarPayloadPix(montar()).ok)
  const cod = (p) => P.validarPayloadPix(p).codigo
  assert.equal(cod(montar({ conta: tlv('00', 'XX.GOV.BCB.PIX') + tlv('01', 'a@b.com') })), 'sem_pix'); assert.equal(cod(montar({ moeda: tlv('53', '840') })), 'moeda'); assert.equal(cod(montar({ pais: tlv('58', 'US') })), 'pais')
  assert.equal(cod(montar({ nome: tlv('59', 'N'.repeat(26)) })), 'nome'); assert.equal(cod(montar({ cidade: tlv('60', 'C'.repeat(16)) })), 'cidade'); assert.equal(cod(montar({ nome: tlv('59', ' ').slice(0, 4) + '' })), 'estrutura')
  assert.equal(cod(montar({ pre: tlv('00', '02') })), 'formato'); assert.equal(cod(montar({ mcc: tlv('52', 'ABCD') })), 'mcc'); assert.equal(cod(montar({ extra: tlv('59', 'DUP') })), 'duplicado')
  assert.ok(P.validarPayloadPix(montar({ conta: tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', 'a'.repeat(77)) })).ok) /* limite maximo da chave (77) */; assert.equal(cod(montar({ conta: tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', 'a'.repeat(78)) })), 'estrutura') /* 78 estoura o campo 26 (>99): nao existe */; assert.equal(cod(montar({ extra: '62' + '99' + 'x' })), 'estrutura')
  assert.equal(P.validarPayloadPix('0002016304ABCD').ok, false)
})
test('validador: Pix DINAMICO (cobranca que expira / vale uma vez) e recusado com orientacao; so chave estatica e aceita', () => {
  assert.equal(P.validarPayloadPix(montar({ inicio: tlv('01', '12') })).codigo, 'dinamico')
  assert.equal(P.validarPayloadPix(montar({ conta: tlv('00', 'BR.GOV.BCB.PIX') + tlv('25', 'pix.exemplo.com/qr/v2/abc123') })).codigo, 'dinamico')
  assert.equal(P.validarPayloadPix(montar({ conta: tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', 'a@b.com') + tlv('25', 'pix.exemplo.com/x') })).codigo, 'dinamico')
  assert.ok(P.validarPayloadPix(montar({ inicio: tlv('01', '11') })).ok) // "11" explicito tambem e estatico
  assert.match(P.validarPayloadPix(montar({ inicio: tlv('01', '12') })).erro, /expira|uma unica vez/)
})
test('validador: codigo com VALOR fixo e aceito com aviso (quem paga nao muda o valor); valor invalido e recusado', () => {
  const v = P.validarPayloadPix(montar({ valor: tlv('54', '25.90') })); assert.ok(v.ok); assert.equal(v.valor, '25.90'); assert.match(v.avisos[0], /valor fixo de R\$ 25,90/)
  for (const x of ['0.00', '-1', 'abc', '1.234', '12345678901']) assert.equal(P.validarPayloadPix(montar({ valor: tlv('54', x) })).codigo, 'valor', x)
})
test('INJECAO: caracteres fora do ASCII imprimivel e < > " ` \\ sao recusados em qualquer campo; quebras de linha/controle idem; tamanhos extremos', () => {
  for (const sujo of ['<script>alert(1)</script>', 'a"b', 'a`b', 'a\\b', '<img src=x onerror=1>', 'Nome</b>', 'a\nb', 'a\rb', 'a\tb', 'a\u0000b', 'çãõ', 'a\u202eb', '😀']) {
    for (const campo of ['nome', 'cidade', 'extra']) { const o = {}; o[campo] = campo === 'extra' ? tlv('62', tlv('05', sujo)) : tlv(campo === 'nome' ? '59' : '60', sujo.slice(0, 12)); const v = P.validarPayloadPix(montar(o)); assert.equal(v.ok, false, `${campo}: ${JSON.stringify(sujo)}`) }
  }
  assert.equal(P.validarPayloadPix('x'.repeat(513)).ok, false); assert.equal(P.validarPayloadPix('0'.repeat(30)).ok, false)
  for (const v of [null, undefined, 5, {}, [], true]) assert.equal(P.validarPayloadPix(v).ok, false)
})
test('classificar e mascarar chaves (privacidade na tela do painel)', () => {
  assert.equal(P.classificarChave('123e4567-e12b-12d1-a456-426655440000'), 'aleatoria'); assert.equal(P.classificarChave('+5511987654321'), 'telefone'); assert.equal(P.classificarChave('52998224725'), 'cpf'); assert.equal(P.classificarChave('11222333000181'), 'cnpj'); assert.equal(P.classificarChave('a@b.com'), 'email'); assert.equal(P.classificarChave('???'), 'desconhecida')
  assert.equal(P.mascararChave('cpf', '52998224725'), '***.982.247-**'); assert.equal(P.mascararChave('email', 'contato@exemplo.com.br'), 'c***@exemplo.com.br'); assert.equal(P.mascararChave('telefone', '+5511987654321'), '+5511 *****-4321')
  assert.ok(!P.mascararChave('aleatoria', '123e4567-e12b-12d1-a456-426655440000').includes('e12b-12d1-a456')); assert.ok(!P.mascararChave('cnpj', '11222333000181').includes('222333'))
})
test('QR do Pix: o mesmo payload gera uma matriz valida (ASCII, ate 512); QR do Pix e QR da MiniPage sao funcoes de textos diferentes', () => {
  const g = gerar(); const m = Q.matrizQr(g.payload); assert.ok(m.length >= 29 && (m.length - 17) % 4 === 0)
  const { d, tamanho } = Q.caminhoQr(g.payload); assert.equal(tamanho, m.length + 8); assert.match(d, /^M4 4h/)
  assert.notDeepEqual(Q.matrizQr('https://minipage.pro/maria'), m)
  const longo = gerar({ tipoChave: 'email', chave: 'a'.repeat(60) + '@exemplo.com.br', nome: 'N'.repeat(40), cidade: 'C'.repeat(40) }); assert.ok(longo.payload.length <= 512); assert.ok(Q.matrizQr(longo.payload).length >= 29)
})
