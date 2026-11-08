// MINIPAGE PIX: gerador e validador de "Pix Copia e Cola" (BR Code estatico do Banco Central, EMV QRCPS-MPM). LOGICA PURA: sem rede, sem Supabase, sem React.
// O que a validacao PROVA: estrutura TLV, tamanhos, campos obrigatorios, formato da chave e CRC. O que NAO prova: que a chave existe, esta ativa, pertence ao
// nome informado ou que o dinheiro sera recebido. Isso so o aplicativo do banco confirma. A MiniPage nao movimenta, retem nem confirma pagamentos.

export const PIX_GUI = 'BR.GOV.BCB.PIX'
export const TIPOS_CHAVE = ['aleatoria', 'cpf', 'cnpj', 'telefone', 'email'] as const
export type TipoChave = (typeof TIPOS_CHAVE)[number]

// ---------------------------------------------------------------- CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF)
export function crc16(texto: string): string {
  let crc = 0xffff
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const tlv = (id: string, valor: string): string => {
  if (valor.length < 1 || valor.length > 99) throw new Error(`campo ${id} com tamanho invalido (${valor.length})`)
  return id + String(valor.length).padStart(2, '0') + valor
}

// ---------------------------------------------------------------- texto e chaves
/** Nome/cidade do BR Code: ASCII maiusculo (A-Z, 0-9 e espaco), sem acentos, tamanho limitado. */
export function textoBrCode(entrada: unknown, max: number): string {
  if (typeof entrada !== 'string') return ''
  return entrada.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max).trim()
}

function cpfValido(d: string): boolean {
  if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false
  const dv = (n: number) => { let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r }
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10])
}
function cnpjValido(d: string): boolean {
  if (!/^\d{14}$/.test(d) || /^(\d)\1{13}$/.test(d)) return false
  const dv = (n: number) => { const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * pesos[i]!; const r = s % 11; return r < 2 ? 0 : 11 - r }
  return dv(12) === Number(d[12]) && dv(13) === Number(d[13])
}
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/
const EVP_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const TEL_RE = /^\+55[1-9][1-9]9\d{8}$/ // celular brasileiro: +55 + DDD + 9 + 8 digitos

export type ChaveResultado = { ok: true; tipo: TipoChave; chave: string } | { ok: false; erro: string }

/** Normaliza e valida a chave pelo TIPO escolhido pelo usuario (nao adivinha: CPF e telefone podem ter 11 digitos). */
export function normalizarChave(tipo: unknown, valor: unknown): ChaveResultado {
  if (typeof tipo !== 'string' || !(TIPOS_CHAVE as readonly string[]).includes(tipo)) return { ok: false, erro: 'Escolha o tipo da chave Pix.' }
  if (typeof valor !== 'string') return { ok: false, erro: 'Informe a chave Pix.' }
  const v = valor.trim()
  if (!v || v.length > 120) return { ok: false, erro: 'Informe a chave Pix.' }
  switch (tipo as TipoChave) {
    case 'cpf': { const d = v.replace(/[.\-\s]/g, ''); return cpfValido(d) ? { ok: true, tipo: 'cpf', chave: d } : { ok: false, erro: 'CPF invalido.' } }
    case 'cnpj': { const d = v.replace(/[.\-/\s]/g, ''); return cnpjValido(d) ? { ok: true, tipo: 'cnpj', chave: d } : { ok: false, erro: 'CNPJ invalido.' } }
    case 'telefone': {
      let d = v.replace(/[()\s\-]/g, '')
      if (!d.startsWith('+')) d = d.startsWith('55') && d.length >= 12 ? '+' + d : '+55' + d
      return TEL_RE.test(d) ? { ok: true, tipo: 'telefone', chave: d } : { ok: false, erro: 'Telefone invalido. Use DDD + numero de celular.' }
    }
    case 'email': return EMAIL_RE.test(v) && v.length <= 77 ? { ok: true, tipo: 'email', chave: v } : { ok: false, erro: 'E-mail invalido.' }
    case 'aleatoria': { const k = v.toLowerCase(); return EVP_RE.test(k) ? { ok: true, tipo: 'aleatoria', chave: k } : { ok: false, erro: 'Chave aleatoria invalida (formato 8-4-4-4-12).' } }
  }
}

/** Classifica uma chave ja extraida de um payload (sem presumir): usada ao COLAR um Copia e Cola. */
export function classificarChave(chave: string): TipoChave | 'desconhecida' {
  if (EVP_RE.test(chave.toLowerCase())) return 'aleatoria'
  if (TEL_RE.test(chave)) return 'telefone'
  if (cpfValido(chave)) return 'cpf'
  if (cnpjValido(chave)) return 'cnpj'
  if (EMAIL_RE.test(chave) && chave.length <= 77) return 'email'
  return 'desconhecida'
}

export function mascararChave(tipo: TipoChave | 'desconhecida', chave: string): string {
  switch (tipo) {
    case 'cpf': return `***.${chave.slice(3, 6)}.${chave.slice(6, 9)}-**`
    case 'cnpj': return `**.${chave.slice(2, 5)}.***/${chave.slice(8, 12)}-**`
    case 'telefone': return `${chave.slice(0, 5)} *****-${chave.slice(-4)}`
    case 'email': { const [u = '', d = ''] = chave.split('@'); return `${u.slice(0, 1)}***@${d}` }
    case 'aleatoria': return `${chave.slice(0, 8)}-****-****-****-${chave.slice(-4)}`
    default: return `${chave.slice(0, 4)}***`
  }
}

// ---------------------------------------------------------------- gerador (Pix estatico)
export interface PixEstaticoEntrada {
  tipoChave: unknown
  chave: unknown
  nome: unknown
  cidade: unknown
  txid?: unknown
  valor?: unknown
}
export interface PixGerado { payload: string; nome: string; cidade: string; chave: string; tipoChave: TipoChave; valor: string | null }
export type GerarResultado = ({ ok: true } & PixGerado) | { ok: false; erro: string }

/** Pix estatico reutilizavel, sem valor por padrao (o pagador informa o valor no banco). O campo 01 ("Point of Initiation") e OMITIDO: ausente = QR estatico
 *  reutilizavel, como nos exemplos do Banco Central e na biblioteca independente com que este gerador foi cruzado; "12" (pagamento unico) e recusado pelo validador. */
export function montarPixEstatico(e: PixEstaticoEntrada): GerarResultado {
  const k = normalizarChave(e.tipoChave, e.chave)
  if (!k.ok) return k
  const nome = textoBrCode(e.nome, 25)
  if (!nome) return { ok: false, erro: 'Informe o nome do recebedor.' }
  const cidade = textoBrCode(e.cidade, 15)
  if (!cidade) return { ok: false, erro: 'Informe a cidade do recebedor.' }
  let valor: string | null = null
  if (e.valor !== undefined && e.valor !== null && e.valor !== '') {
    const n = typeof e.valor === 'number' ? e.valor : Number(String(e.valor).replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0 || n > 99999999.99) return { ok: false, erro: 'Valor invalido.' }
    valor = n.toFixed(2)
  }
  const txid = typeof e.txid === 'string' && /^[A-Za-z0-9]{1,25}$/.test(e.txid) ? e.txid : '***'
  const conta = tlv('00', PIX_GUI) + tlv('01', k.chave)
  if (conta.length > 99) return { ok: false, erro: 'Chave Pix longa demais.' }
  const corpo =
    tlv('00', '01') + tlv('26', conta) + tlv('52', '0000') + tlv('53', '986') + (valor ? tlv('54', valor) : '') +
    tlv('58', 'BR') + tlv('59', nome) + tlv('60', cidade) + tlv('62', tlv('05', txid)) + '6304'
  return { ok: true, payload: corpo + crc16(corpo), nome, cidade, chave: k.chave, tipoChave: k.tipo, valor }
}

// ---------------------------------------------------------------- validador (Copia e Cola)
export interface PixInfo { payload: string; nome: string; cidade: string; chave: string; tipoChave: TipoChave | 'desconhecida'; valor: string | null; txid: string | null; avisos: string[] }
export type ValidarResultado = ({ ok: true } & PixInfo) | { ok: false; codigo: string; erro: string }

const falha = (codigo: string, erro: string): ValidarResultado => ({ ok: false, codigo, erro })

function lerTlv(s: string): Array<[string, string]> | null {
  const out: Array<[string, string]> = []
  let i = 0
  while (i < s.length) {
    if (i + 4 > s.length) return null
    const id = s.slice(i, i + 2), len = s.slice(i + 2, i + 4)
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(len)) return null
    const n = Number(len)
    if (i + 4 + n > s.length) return null
    out.push([id, s.slice(i + 4, i + 4 + n)])
    i += 4 + n
  }
  return out
}

export function validarPayloadPix(entrada: unknown): ValidarResultado {
  if (typeof entrada !== 'string') return falha('tipo', 'Cole o codigo Pix Copia e Cola.')
  const p = entrada.trim()
  if (p.length < 40) return falha('curto', 'O codigo e curto demais para ser um Pix Copia e Cola.')
  if (p.length > 512) return falha('longo', 'O codigo e longo demais.')
  if (/[^\x20-\x7e]/.test(p)) return falha('caracteres', 'O codigo contem caracteres invalidos (use o codigo copiado do app do banco).')
  // um codigo gerado por banco NUNCA contem estes caracteres: barrar aqui elimina carga de HTML/script/aspas em qualquer campo (nome, cidade, chave, txid)
  if (/[<>"`\\]/.test(p)) return falha('caracteres', 'O codigo contem caracteres nao permitidos.')
  if (!/6304[0-9A-Fa-f]{4}$/.test(p)) return falha('crc_formato', 'O codigo nao termina com o verificador (CRC) esperado.')
  const payload = p.slice(0, -4) + p.slice(-4).toUpperCase()
  if (crc16(payload.slice(0, -4)) !== payload.slice(-4)) return falha('crc', 'O codigo esta incompleto ou alterado (verificador CRC nao confere). Copie de novo no app do banco.')
  const campos = lerTlv(payload)
  if (!campos) return falha('estrutura', 'A estrutura do codigo Pix e invalida.')
  const mapa = new Map<string, string>()
  for (const [id, v] of campos) { if (mapa.has(id)) return falha('duplicado', `O codigo repete o campo ${id}.`); mapa.set(id, v) }
  if (campos[0]![0] !== '00' || mapa.get('00') !== '01') return falha('formato', 'Formato de payload nao suportado.')
  if (campos[campos.length - 1]![0] !== '63' || mapa.get('63')!.length !== 4) return falha('crc_posicao', 'O verificador CRC deve ser o ultimo campo.')
  const inicio = mapa.get('01')
  if (inicio === '12') return falha('dinamico', 'Este codigo e de uma cobranca (Pix dinamico): ele expira ou vale uma unica vez. Cadastre um Pix com chave (copie o codigo da sua chave, sem valor).')
  const conta = mapa.get('26')
  if (conta === undefined) return falha('sem_pix', 'O codigo nao e um Pix (campo 26 ausente).')
  const sub = lerTlv(conta)
  if (!sub) return falha('estrutura', 'Os dados da conta Pix estao malformados.')
  const subMapa = new Map<string, string>()
  for (const [id, v] of sub) { if (subMapa.has(id)) return falha('duplicado', 'Campo repetido nos dados da conta.'); subMapa.set(id, v) }
  if ((subMapa.get('00') || '').toUpperCase() !== PIX_GUI) return falha('sem_pix', 'O codigo nao e do arranjo Pix (BR.GOV.BCB.PIX).')
  if (subMapa.has('25') || !subMapa.has('01')) return falha('dinamico', 'Este codigo e de uma cobranca (Pix dinamico): ele expira ou vale uma unica vez. Cadastre um Pix com chave.')
  const chave = subMapa.get('01')!
  if (chave.length < 1 || chave.length > 77) return falha('chave', 'Chave Pix fora do tamanho permitido.')
  if (!/^[0-9]{4}$/.test(mapa.get('52') || '')) return falha('mcc', 'Categoria (MCC) invalida.')
  if (mapa.get('53') !== '986') return falha('moeda', 'Moeda invalida (esperado BRL).')
  if (mapa.get('58') !== 'BR') return falha('pais', 'Pais invalido (esperado BR).')
  const nome = mapa.get('59') || '', cidade = mapa.get('60') || ''
  if (!nome || nome.length > 25) return falha('nome', 'Nome do recebedor ausente ou maior que 25 caracteres.')
  if (!cidade || cidade.length > 15) return falha('cidade', 'Cidade ausente ou maior que 15 caracteres.')
  const avisos: string[] = []
  const valor = mapa.get('54') ?? null
  if (valor !== null) {
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(valor) || Number(valor) <= 0) return falha('valor', 'Valor do codigo invalido.')
    avisos.push(`Este codigo tem valor fixo de R$ ${Number(valor).toFixed(2).replace('.', ',')}: quem pagar nao podera mudar o valor. Para receber valores livres, copie um codigo sem valor.`)
  }
  let txid: string | null = null
  if (mapa.has('62')) {
    const adicional = lerTlv(mapa.get('62')!)
    if (!adicional) return falha('estrutura', 'Dados adicionais malformados.')
    txid = adicional.find(([id]) => id === '05')?.[1] ?? null
  }
  const tipoChave = classificarChave(chave)
  if (tipoChave === 'desconhecida') avisos.push('Nao reconheci o formato da chave. Confira no seu banco.')
  return { ok: true, payload, nome, cidade, chave, tipoChave, valor, txid, avisos }
}

// ---------------------------------------------------------------- texto do botao "Compartilhar Pix"
export const ROTULO_TIPO_CHAVE: Record<TipoChave, string> = { aleatoria: 'Chave aleatória', cpf: 'CPF', cnpj: 'CNPJ', telefone: 'Telefone', email: 'E-mail' }

export interface TextoCompartilhamento {
  /** 'chave' = compartilha a CHAVE Pix com o tipo; 'copia_cola' = alternativa identificada quando nao ha chave/tipo confiavel */
  modo: 'chave' | 'copia_cola'
  titulo: string
  texto: string
}

/**
 * Texto para compartilhar a chave Pix do dono, extraida do PROPRIO payload ja validado (nenhuma consulta extra, nenhum dado fixo).
 * Nunca inventa chave: se o payload for invalido => null; se a chave nao tiver tipo reconhecido => cai para o Copia e Cola, claramente identificado como tal.
 */
export function montarTextoCompartilhamento(payload: unknown): TextoCompartilhamento | null {
  const v = validarPayloadPix(payload)
  if (!v.ok) return null
  if (v.tipoChave !== 'desconhecida' && v.chave) {
    return { modo: 'chave', titulo: `Chave Pix de ${v.nome}`, texto: `Minha chave Pix\nChave Pix: ${v.chave}\nTipo: ${ROTULO_TIPO_CHAVE[v.tipoChave]}\nRecebedor: ${v.nome}` }
  }
  return { modo: 'copia_cola', titulo: `Pix de ${v.nome}`, texto: `Pix de ${v.nome}\nNão foi possível identificar o tipo da chave. Pix Copia e Cola (código completo):\n${v.payload}` }
}
