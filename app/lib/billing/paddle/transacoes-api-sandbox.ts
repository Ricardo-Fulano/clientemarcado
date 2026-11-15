import { prepararTransacaoSandbox, type PerfilCompraSandbox } from './transacao-rascunho'

/** Bloco 9D: cliente HTTP isolado. NENHUMA rota importa ou executa estas funcoes.
 * Nao concede planos, comissoes, nem atualiza o banco. Sem retry automatico de POST.
 */
export const PADDLE_SANDBOX_API = 'https://sandbox-api.paddle.com'
export type TransportarPaddle = typeof fetch
export type RespostaTransacao = { id: string; status: string; attemptId: string; userId: string }
const ID = /^txn_[a-z0-9]{26}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validarChave(chave: string): void {
  if (!/^pdl_sdbx_apikey_[A-Za-z0-9_\-]+$/.test(chave)) throw new Error('CHAVE_SANDBOX_INVALIDA')
}
function lerResultado(obj: unknown, esperado: { tentativaId: string; userId: string }): RespostaTransacao {
  if (!obj || typeof obj !== 'object' || !('data' in obj)) throw new Error('RESPOSTA_PADDLE_INVALIDA')
  const data = (obj as {data?: unknown}).data
  if (!data || typeof data !== 'object') throw new Error('RESPOSTA_PADDLE_INVALIDA')
  const item = data as Record<string, unknown>
  const custom = item.custom_data
  if (!custom || typeof custom !== 'object') throw new Error('CUSTOM_DATA_AUSENTE')
  const meta = custom as Record<string, unknown>
  if (typeof item.id !== 'string' || !ID.test(item.id) || typeof item.status !== 'string' ||
    meta.minipage_attempt_id !== esperado.tentativaId || meta.minipage_user_id !== esperado.userId) {
    throw new Error('TRANSACAO_NAO_CORRESPONDE_A_TENTATIVA')
  }
  return {id: item.id, status: item.status, attemptId: esperado.tentativaId, userId: esperado.userId}
}

/** Funcao disponivel so no codigo servidor: consultar nao modifica Paddle. */
export async function consultarTransacaoSandbox(
  args: { transacaoId: string; tentativaId: string; userId: string; chave: string },
  transporte: TransportarPaddle = fetch,
): Promise<RespostaTransacao> {
  validarChave(args.chave)
  if (!ID.test(args.transacaoId) || !UUID.test(args.tentativaId) || !UUID.test(args.userId)) {
    throw new Error('IDENTIFICADORES_INVALIDOS')
  }
  let resposta: Response
  try {
    resposta = await transporte(`${PADDLE_SANDBOX_API}/transactions/${args.transacaoId}`, {
      method: 'GET', headers: {Authorization: `Bearer ${args.chave}`, 'Paddle-Version': '1'},
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    })
  } catch { throw new Error('CONSULTA_PADDLE_INDETERMINADA') }
  if (!resposta.ok) throw new Error(`PADDLE_HTTP_${resposta.status}`)
  let json: unknown
  try { json = await resposta.json() } catch { throw new Error('RESPOSTA_PADDLE_INVALIDA') }
  return lerResultado(json, args)
}

/** Preparar + chamar endpoint oficial POST. NAO ha rota conectada a esta funcao.
 * Este cliente NAO garante idempotencia: a camada de orquestracao deve reservar
 * atomicamente e conciliar uma falha incerta antes de tentar novo POST.
 */
export async function criarTransacaoSandboxIsolada(
  perfil: PerfilCompraSandbox,
  chave: string,
  env: Record<string, string | undefined>,
  transporte: TransportarPaddle = fetch,
): Promise<RespostaTransacao> {
  if (env.NODE_ENV !== 'development' || env.VERCEL_ENV ||
      env.PADDLE_ENVIRONMENT !== 'sandbox' ||
      env.MINIPAGE_PADDLE_9D_WRITE_ENABLED !== 'true') {
    throw new Error('ESCRITA_PADDLE_9D_DESABILITADA')
  }
  validarChave(chave)
  const pedido = prepararTransacaoSandbox(perfil)
  let resposta: Response
  try {
    resposta = await transporte(`${PADDLE_SANDBOX_API}/transactions`, {
      method: 'POST', headers: {
        Authorization: `Bearer ${chave}`,
        'Content-Type': 'application/json', 'Paddle-Version': '1',
      },
      body: JSON.stringify(pedido.payload),
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    })
  } catch { throw new Error('CRIACAO_PADDLE_INDETERMINADA_NAO_REPETIR') }
  if (!resposta.ok) throw new Error(`PADDLE_HTTP_${resposta.status}_NAO_REPETIR_SEM_CONCILIAR`)
  let json: unknown
  try { json = await resposta.json() } catch { throw new Error('CRIACAO_PADDLE_INDETERMINADA_NAO_REPETIR') }
  return lerResultado(json, {tentativaId: String(perfil.tentativaId), userId: String(perfil.userId)})
}
