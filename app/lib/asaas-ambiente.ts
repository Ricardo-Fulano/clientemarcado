// Avalia se a configuracao do Asaas e SEGURA para gerar checkout para clientes reais.
//
// Regra: o site publico de producao (Vercel Production) NUNCA pode mandar um cliente real
// para o checkout de teste (sandbox.asaas.com): la ninguem e cobrado de verdade e o acesso
// nunca seria liberado pelo webhook real. Esta funcao e pura (so recebe as variaveis de
// ambiente) para poder ser testada sem rede.
//
// Variaveis lidas:
//   ASAAS_ENV              'production' = API real; qualquer outro valor = sandbox (padrao).
//   ASAAS_API_KEY          chave da API (sandbox e producao sao chaves diferentes).
//   VERCEL_ENV             preenchida pela Vercel: 'production' | 'preview' | 'development'.
//   ASAAS_PERMITIR_SANDBOX '1' = autoriza, DE PROPOSITO, usar sandbox no site de producao
//                          (so para testar o checkout; nunca deixe ligada com clientes reais).
export type AmbienteAsaas =
  | { ok: true; ambiente: 'production' | 'sandbox'; baseUrl: string; siteProducao: boolean }
  | { ok: false; ambiente: 'production' | 'sandbox'; motivo: string; siteProducao: boolean }

export const URL_ASAAS_PRODUCAO = 'https://api.asaas.com/v3'
export const URL_ASAAS_SANDBOX = 'https://api-sandbox.asaas.com/v3'

export function avaliarAmbienteAsaas(env: Record<string, string | undefined>): AmbienteAsaas {
  const ambiente: 'production' | 'sandbox' = env.ASAAS_ENV === 'production' ? 'production' : 'sandbox'
  const siteProducao = env.VERCEL_ENV === 'production'
  const chave = (env.ASAAS_API_KEY || '').trim()

  if (!chave) return { ok: false, ambiente, siteProducao, motivo: 'ASAAS_API_KEY ausente' }

  // Site de producao apontando para o sandbox: bloqueia, a menos que seja liberado de proposito.
  if (siteProducao && ambiente !== 'production' && env.ASAAS_PERMITIR_SANDBOX !== '1')
    return { ok: false, ambiente, siteProducao, motivo: 'site de PRODUCAO com ASAAS_ENV diferente de "production" (checkout de teste bloqueado)' }

  // Ambiente "production" com chave de sandbox (as chaves de teste do Asaas contem "hmlg"):
  // as chamadas iriam falhar ou criar cobrancas no lugar errado.
  if (ambiente === 'production' && /hmlg/i.test(chave))
    return { ok: false, ambiente, siteProducao, motivo: 'ASAAS_ENV=production mas a ASAAS_API_KEY parece ser de sandbox' }

  return { ok: true, ambiente, siteProducao, baseUrl: ambiente === 'production' ? URL_ASAAS_PRODUCAO : URL_ASAAS_SANDBOX }
}

// Defesa final: mesmo com tudo "certo", nunca devolve para um cliente real um link do
// checkout de teste. So vale para o site de producao sem a liberacao explicita.
export function urlEhSandbox(url: string): boolean {
  try { return /(^|\.)sandbox\.asaas\.com$/i.test(new URL(url).hostname) || /sandbox/i.test(new URL(url).hostname) } catch { return /sandbox/i.test(url) }
}
