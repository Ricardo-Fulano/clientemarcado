// Testes do botao "Compartilhar Pix": texto com a CHAVE Pix e o TIPO, extraidos do proprio payload validado (app/lib/pix.ts + app/components/PixCardPublico.tsx).
// Sem rede, sem Supabase. Nenhuma chave real: so exemplos publicos de teste.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import * as P from '../app/lib/pix.ts'

const RAIZ = path.resolve(import.meta.dirname, '..')
const ler = (f) => readFileSync(path.join(RAIZ, f), 'utf8').replace(/\r\n/g, '\n') // o projeto no Windows usa CRLF
const semComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[ \t])\/\/.*$/gm, '$1')
const CASOS = [
  ['cpf', '529.982.247-25', '52998224725', 'CPF'], ['cnpj', '11.222.333/0001-81', '11222333000181', 'CNPJ'], ['telefone', '(11) 98765-4321', '+5511987654321', 'Telefone'],
  ['email', 'contato@exemplo.com.br', 'contato@exemplo.com.br', 'E-mail'], ['aleatoria', '123e4567-e12b-12d1-a456-426655440000', '123e4567-e12b-12d1-a456-426655440000', 'Chave aleatória'],
]
const gerar = (tipoChave, chave, nome = 'Maria da Silva') => { const g = P.montarPixEstatico({ tipoChave, chave, nome, cidade: 'Sao Paulo' }); assert.ok(g.ok, g.erro); return g }

test('compartilhar: os 5 tipos de chave geram a mensagem "Minha chave Pix / Chave Pix / Tipo / Recebedor" com a chave EXTRAIDA do payload', () => {
  for (const [tipo, entrada, chave, rotulo] of CASOS) {
    const g = gerar(tipo, entrada); const t = P.montarTextoCompartilhamento(g.payload)
    assert.equal(t.modo, 'chave', tipo); assert.equal(t.texto, `Minha chave Pix\nChave Pix: ${chave}\nTipo: ${rotulo}\nRecebedor: MARIA DA SILVA`, tipo); assert.equal(t.titulo, 'Chave Pix de MARIA DA SILVA')
    assert.equal(P.validarPayloadPix(g.payload).chave, chave) // a mesma extracao do validador existente (sem logica duplicada)
  }
})
test('compartilhar: NAO inclui o Copia e Cola nem dado do BR Code quando ha chave; a chave nunca vem de valor fixo no codigo', () => {
  for (const [tipo, entrada] of CASOS) {
    const g = gerar(tipo, entrada); const t = P.montarTextoCompartilhamento(g.payload)
    for (const proibido of [g.payload, 'BR.GOV.BCB.PIX', '000201', '6304', g.cidade]) assert.equal(t.texto.includes(proibido), false, `${tipo}: ${proibido}`)
  }
  // chaves diferentes => mensagens diferentes (nada fixo)
  assert.notEqual(P.montarTextoCompartilhamento(gerar('cpf', '529.982.247-25').payload).texto, P.montarTextoCompartilhamento(gerar('email', 'a@b.com').payload).texto)
})
test('compartilhar: funciona com um Copia e Cola colado de banco (modalidade A) e com codigo de valor fixo: a chave e o tipo continuam corretos', () => {
  const g = P.montarPixEstatico({ tipoChave: 'cnpj', chave: '11.222.333/0001-81', nome: 'Studio Bella', cidade: 'Belo Horizonte', valor: '25,90' })
  const t = P.montarTextoCompartilhamento(g.payload); assert.equal(t.modo, 'chave'); assert.match(t.texto, /Chave Pix: 11222333000181\nTipo: CNPJ/); assert.doesNotMatch(t.texto, /25[.,]90/)
  const ouro = '00020126330014BR.GOV.BCB.PIX0111529982247255204000053039865802BR5914CARLOS PEREIRA6008CURITIBA62070503***6304FF60'
  assert.match(P.montarTextoCompartilhamento(ouro).texto, /Chave Pix: 52998224725\nTipo: CPF\nRecebedor: CARLOS PEREIRA/)
})
const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v
const comChave = (chave) => { const c = tlv('00', '01') + tlv('26', tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', chave)) + tlv('52', '0000') + tlv('53', '986') + tlv('58', 'BR') + tlv('59', 'MARIA') + tlv('60', 'SAO PAULO') + tlv('62', tlv('05', '***')) + '6304'; return c + P.crc16(c) }
test('sem chave/tipo confiavel: NAO inventa nada; cai para o Copia e Cola claramente identificado', () => {
  const pay = comChave('chave-estranha-123')
  const t = P.montarTextoCompartilhamento(pay); assert.equal(t.modo, 'copia_cola'); assert.ok(t.texto.includes(pay)); assert.match(t.texto, /Não foi possível identificar o tipo da chave/); assert.match(t.texto, /Pix Copia e Cola \(código completo\):/)
  assert.doesNotMatch(t.texto, /Chave Pix:|Tipo:/) // nao afirma uma chave nem um tipo
})
test('payload invalido, adulterado, dinamico ou de tipo errado => null (o botao mostra aviso e nao compartilha nada)', () => {
  const g = gerar('email', 'a@b.com')
  for (const ruim of ['lixo', '', g.payload.replace('MARIA', 'MARIO'), g.payload.slice(0, -1), '0002012658...', null, undefined, 5, {}, [], tlv('01', '12')]) assert.equal(P.montarTextoCompartilhamento(ruim), null, String(ruim).slice(0, 30))
  assert.equal(P.montarTextoCompartilhamento(comChave('x'.repeat(1)).replace('0201', '0202')), null)
})
test('rotulos: todos os tipos de chave existentes tem rotulo legivel', () => {
  assert.deepEqual(Object.keys(P.ROTULO_TIPO_CHAVE).sort(), [...P.TIPOS_CHAVE].sort()); assert.deepEqual(P.ROTULO_TIPO_CHAVE, { aleatoria: 'Chave aleatória', cpf: 'CPF', cnpj: 'CNPJ', telefone: 'Telefone', email: 'E-mail' })
})
test('componente: Compartilhar usa a mensagem da chave (Web Share e fallback de copia); Copiar codigo, Baixar QR e a busca ao /api/pix ficam como estavam', () => {
  const s = semComentarios(ler('app/components/PixCardPublico.tsx'))
  const comp = /async function compartilhar\(\) \{([\s\S]*?)\n  \}\n/.exec(s)[1]
  assert.match(s, /import \{ montarTextoCompartilhamento \} from '\.\.\/lib\/pix'/); assert.match(comp, /montarTextoCompartilhamento\(dados\.payload\)/)
  assert.match(comp, /navigator\.share\(msg\)/); assert.match(comp, /copiar\(t\.texto\)/); assert.doesNotMatch(comp, /copiar\(dados\.payload\)|text: .*dados\.payload|\$\{dados\.payload\}/) // compartilhar nao usa mais o BR Code direto
  assert.match(comp, /if \(!t\) \{ setAviso\('Não foi possível preparar o compartilhamento\.'\); return \}/); assert.match(comp, /AbortError/)
  assert.match(s, /async function copiarCodigo\(\) \{ if \(dados\) setAviso\(\(await copiar\(dados\.payload\)\)/) // Copiar codigo: BR Code completo, sem alteracao
  assert.match(s, /baixarQrPng\(dados\.qrCaminho, dados\.qrTamanho, `pix-\$\{p\.slug/); assert.equal((s.match(/\bfetch\(/g) || []).length, 1); assert.doesNotMatch(s, /supabase|rpc\(|\.from\(/)
})
test('varredura: nenhuma chave/CPF/CNPJ/telefone fixo no codigo do compartilhamento', () => {
  for (const f of ['app/components/PixCardPublico.tsx', 'app/lib/pix.ts']) { const s = semComentarios(ler(f)); assert.doesNotMatch(s, /(?<![\d.])\d{11}(?![\d.])|(?<![\d.])\d{14}(?![\d.])|\+55\d{10,11}/, f); assert.doesNotMatch(s, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i, f) }
  const nova = /export function montarTextoCompartilhamento[\s\S]*$/.exec(semComentarios(ler('app/lib/pix.ts')))[0]; assert.doesNotMatch(nova, /fetch|supabase|process\.env|localStorage|document\.|window\./)
})
