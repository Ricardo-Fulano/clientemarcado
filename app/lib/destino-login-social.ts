import { destinoAposLogin } from './oauthConsent'
export async function resolverDestinoLogin(search:string, accessToken?:string):Promise<string>{
 const destino=destinoAposLogin(search)
 if(destino!=='/painel')return destino
  let proximo = '/painel'
        try {
          const token = accessToken
          if (token) {
            const resposta = await fetch('/api/billing/stripe/pending-resume', {
              headers: { Authorization: 'Bearer ' + token }, cache: 'no-store',
            })
            if (resposta.ok) {
              const pendente = await resposta.json() as {
                pending?: boolean; plan?: string; cycle?: string; country?: string
              }
              if (pendente.pending === true &&
                  ['minipage','agenda','loja','essencial'].includes(pendente.plan || '') &&
                  ['mensal','anual'].includes(pendente.cycle || '') &&
                  /^[A-Z]{2}$/.test(pendente.country || '') && pendente.country !== 'BR') {
                const q = new URLSearchParams({
                  plan: pendente.plan!, cycle: pendente.cycle!, market: 'INTL', confirm: '1',
                })
                proximo = '/painel/contratar?' + q.toString()
              }
            }
          }
        } catch { /* Consulta de retomada indisponivel: login convencional continua seguro. */ }
  return proximo
}
