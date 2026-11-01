import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// Segredos de webhook cifrados com AES-256-GCM. Formato (aceito pelo CHECK do banco):
//   v<versao>.<iv 12 bytes>.<tag 16 bytes>.<dados>      (tudo em base64url, sem preenchimento)
// A chave NUNCA vai ao banco: vive em INTEGRATIONS_KEY_V<n> (32 bytes em base64). A versao ATUAL vem de INTEGRATIONS_KEY_CURRENT (padrao 1).
// O contexto (conexao + provedor) entra como AAD: um texto cifrado copiado para outra linha NAO decifra.

export type CodigoErroCripto = 'chave_ausente' | 'chave_invalida' | 'formato_invalido' | 'falha_autenticacao' | 'texto_invalido'
export class ErroCripto extends Error {
  constructor(public readonly codigo: CodigoErroCripto) {
    super(codigo) // mensagem fixa: nunca inclui texto, chave nem texto cifrado
    this.name = 'ErroCripto'
  }
}

const FORMATO = /^v([0-9]{1,5})\.([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]+)$/
export interface ContextoCripto { conexaoId: string; provider: string }

function aad(ctx: ContextoCripto): Buffer {
  return Buffer.from(`mp-integracoes|${ctx.conexaoId}|${ctx.provider}`, 'utf8')
}
function carregarChave(versao: number): Buffer {
  const bruto = process.env[`INTEGRATIONS_KEY_V${versao}`]
  if (!bruto) throw new ErroCripto('chave_ausente')
  const texto = bruto.trim()
  const chave = Buffer.from(texto, 'base64')
  if (chave.length !== 32 || chave.toString('base64') !== texto) throw new ErroCripto('chave_invalida') // exige base64 padrao de exatamente 32 bytes
  return chave
}
export function versaoAtualDaChave(): number {
  const bruto = (process.env.INTEGRATIONS_KEY_CURRENT ?? '1').trim()
  const n = Number(bruto)
  if (!/^[0-9]{1,5}$/.test(bruto) || !Number.isInteger(n) || n < 1 || n > 32000) throw new ErroCripto('chave_invalida')
  return n
}

export function cifrarSegredo(texto: string, ctx: ContextoCripto): { ciphertext: string; keyVersion: number } {
  if (typeof texto !== 'string' || texto.length === 0 || Buffer.byteLength(texto, 'utf8') > 1024) throw new ErroCripto('texto_invalido')
  const versao = versaoAtualDaChave()
  const chave = carregarChave(versao)
  const iv = randomBytes(12)
  const cifra = createCipheriv('aes-256-gcm', chave, iv)
  cifra.setAAD(aad(ctx))
  const dados = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()])
  const tag = cifra.getAuthTag()
  return { ciphertext: `v${versao}.${iv.toString('base64url')}.${tag.toString('base64url')}.${dados.toString('base64url')}`, keyVersion: versao }
}

export function decifrarSegredo(ciphertext: string, ctx: ContextoCripto): string {
  const m = typeof ciphertext === 'string' ? FORMATO.exec(ciphertext) : null
  if (!m) throw new ErroCripto('formato_invalido')
  const chave = carregarChave(Number(m[1]))
  const iv = Buffer.from(m[2], 'base64url')
  const tag = Buffer.from(m[3], 'base64url')
  const dados = Buffer.from(m[4], 'base64url')
  if (iv.length !== 12 || tag.length !== 16) throw new ErroCripto('formato_invalido')
  try {
    const d = createDecipheriv('aes-256-gcm', chave, iv)
    d.setAAD(aad(ctx))
    d.setAuthTag(tag)
    return Buffer.concat([d.update(dados), d.final()]).toString('utf8')
  } catch {
    throw new ErroCripto('falha_autenticacao')
  }
}

// Geradores (aleatoriedade criptografica) compativeis com os CHECKs do banco.
export function gerarPublicId(): string { return randomBytes(16).toString('base64url') } // 22 chars
export function gerarSegredoDeWebhook(): string { return randomBytes(32).toString('base64url') } // 43 chars (o token que o usuario cola na plataforma)
