// Duplo do modulo seguranca/fetch-seguro para os testes da ROTA: responde a partir das fixtures e registra as chamadas (nenhuma rede).
import { responder } from './fixtures.mjs'
export const chamadas = []
export async function fetchSeguro(url, op = {}) {
  chamadas.push({ url, op })
  let r
  try { r = responder(url) } catch { return { ok: false, status: 0, urlFinal: url, motivo: 'rede', text: async () => '', json: async () => { throw new Error('x') } } }
  const texto = typeof r.corpo === 'string' ? r.corpo : JSON.stringify(r.corpo)
  const ok = r.status >= 200 && r.status < 300 && !r.limite
  return { ok, status: r.status, urlFinal: url, motivo: r.limite ? 'limite' : ok ? undefined : 'http', text: async () => (ok ? texto : ''), json: async () => { if (!ok) throw new Error('sem corpo'); return JSON.parse(texto) } }
}
