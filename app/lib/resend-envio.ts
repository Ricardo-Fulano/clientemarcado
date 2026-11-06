// Adaptador de envio pelo Resend (POST /emails) com classificacao do resultado e Idempotency-Key.
// Classificacao: 2xx com id = ACEITO (nao e "entregue"); 4xx definitivo = REJEITADO; rede/timeout/5xx/429/409/2xx sem id = INCERTO.
import type { EmailSender, EnvioResultado } from './convite-criar'

export const REMETENTE = 'ClienteMarcado <noreply@clientemarcado.com.br>'

export function criarEnvioResend(apiKey: string, opts: { fetchImpl?: typeof fetch; timeoutMs?: number } = {}): EmailSender {
  const f = opts.fetchImpl ?? fetch
  const timeoutMs = opts.timeoutMs ?? 15_000
  return {
    async enviar(msg, chaveIdempotencia): Promise<EnvioResultado> {
      let res: Response
      try {
        res = await f('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': chaveIdempotencia },
          body: JSON.stringify({ from: REMETENTE, to: [msg.para], subject: msg.assunto, html: msg.html }),
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (e) {
        return { tipo: 'incerto', motivo: e instanceof Error ? e.name : 'erro_de_rede' }
      }
      let corpo: unknown = null
      try {
        corpo = await res.json()
      } catch {
        corpo = null
      }
      const o = corpo && typeof corpo === 'object' ? (corpo as Record<string, unknown>) : {}
      if (res.ok) {
        return typeof o.id === 'string' && o.id.length > 0 ? { tipo: 'aceito', id: o.id } : { tipo: 'incerto', motivo: 'resposta_sem_id' }
      }
      // 409 (mesma chave em andamento), 429 (limite) e 5xx sao transitorios: o resultado e incerto e a nova tentativa e segura (mesma chave)
      if (res.status === 409 || res.status === 429 || res.status >= 500) return { tipo: 'incerto', motivo: `http_${res.status}` }
      const codigo = typeof o.name === 'string' ? o.name.replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 60) : 'sem_codigo'
      return { tipo: 'rejeitado', http: res.status, codigo }
    },
  }
}
