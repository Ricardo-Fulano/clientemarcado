// B1: chamada autenticada a /api/catalogo/preview-link para as 4 telas do painel (Catalogo, Destaques, Eventos, Videos).
// Mesmo padrao de garantir-perfil-cliente.ts (token da sessao + Authorization: Bearer). Devolve SEMPRE um objeto com `success`, entao o `if(!dados.success)` das telas continua valendo.
// Qualquer resposta do servidor (sucesso ou fallback) passa INALTERADA; so 401, 429, prazo esgotado, falha de rede e resposta ilegivel viram {success:false, message, origemCliente:true}.
//
// SESSAO EXPIRADA: este helper NAO redireciona, NAO faz logout, NAO recarrega a pagina e NAO toca em nenhum dado da tela. Ele apenas devolve a mensagem; o que o usuario ja preencheu fica
// intacto (as telas so preenchem campos vazios a partir de uma previa bem-sucedida e, na falha, so usam `titulo_fallback`, que o helper nunca devolve).
//
// PRAZO: se a API nao responder em TEMPO_CLIENTE_MS (20 s; o servidor responde em ate ~14 s no pior caso), a chamada e cancelada e o usuario recebe uma mensagem; o navegador nunca fica esperando
// indefinidamente, mesmo que o fetch ignore o cancelamento.
export interface CorpoPreview { url: string; tipo?: 'evento' }
export interface DepsPreviewCliente { obterToken?: () => Promise<string | null>; chamar?: typeof fetch; timeoutMs?: number }
export const TEMPO_CLIENTE_MS = 20000
export const MSG_SESSAO_EXPIRADA = 'Sua sessão expirou. Entre novamente.'
export const MSG_MUITAS_TENTATIVAS = 'Muitas tentativas. Aguarde um minuto e tente novamente.'
export const MSG_FALHA_REDE = 'Falha de conexão. Tente novamente.'
export const MSG_TEMPO_ESGOTADO = 'A consulta demorou demais. Tente novamente ou preencha manualmente.'
export const MSG_PREVIA_FALHOU = 'Não foi possível gerar a prévia automaticamente. Você pode preencher manualmente.'

const falhaLocal = (message: string) => ({ success: false, message, origemCliente: true })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function chamarPreviewLink(corpo: CorpoPreview, deps: DepsPreviewCliente = {}): Promise<any> {
  const obterToken = deps.obterToken ?? (async () => { const { supabase } = await import('./supabase'); const { data } = await supabase.auth.getSession(); return data.session?.access_token ?? null })
  const chamar: typeof fetch = deps.chamar ?? ((...a) => fetch(...a))
  let token: string | null = null
  try { token = await obterToken() } catch { token = null }
  if (!token) return falhaLocal(MSG_SESSAO_EXPIRADA)

  const controle = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const prazo = new Promise<'tempo'>((resolve) => { timer = setTimeout(() => { controle.abort(); resolve('tempo') }, deps.timeoutMs ?? TEMPO_CLIENTE_MS) })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tarefa = (async (): Promise<any> => {
    let res: Response
    try {
      res = await chamar('/api/catalogo/preview-link', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(corpo), signal: controle.signal })
    } catch {
      return falhaLocal(MSG_FALHA_REDE)
    }
    if (res.status === 401) return falhaLocal(MSG_SESSAO_EXPIRADA)
    if (res.status === 429) return falhaLocal(MSG_MUITAS_TENTATIVAS)
    try {
      const dados = await res.json()
      if (dados !== null && typeof dados === 'object') return dados
    } catch { /* cai no retorno abaixo */ }
    return falhaLocal(MSG_PREVIA_FALHOU)
  })()
  try {
    const r = await Promise.race([tarefa, prazo])
    return r === 'tempo' ? falhaLocal(MSG_TEMPO_ESGOTADO) : r
  } finally {
    clearTimeout(timer)
  }
}
