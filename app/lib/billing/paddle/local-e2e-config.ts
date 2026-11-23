/** Exclusivo do ambiente local de testes. NUNCA usar dados reais de clientes. */
export function validarAmbienteCheckoutLocal(env: Record<string,string|undefined>): void {
  if (env.NODE_ENV !== 'development' || Boolean(env.VERCEL_ENV) ||
      env.PADDLE_ENVIRONMENT !== 'sandbox' ||
      env.MINIPAGE_PADDLE_LOCAL_E2E_ENABLED !== 'true') {
    throw new Error('CHECKOUT_LOCAL_DESABILITADO')
  }
  const test = env.PADDLE_TEST_SUPABASE_URL
  const main = env.NEXT_PUBLIC_SUPABASE_URL
  if (!test || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(test) || !main || test === main) {
    throw new Error('SUPABASE_TESTE_NAO_ISOLADO')
  }
  if (env.NEXT_PUBLIC_PADDLE_TEST_SUPABASE_URL !== test) {
    throw new Error('SUPABASE_TESTE_PUBLICO_DIVERGENTE')
  }
  if (!env.PADDLE_TEST_SUPABASE_ANON_KEY || !env.PADDLE_TEST_SUPABASE_SERVICE_ROLE_KEY ||
      !env.PADDLE_SANDBOX_API_KEY?.startsWith('pdl_sdbx_apikey_')) {
    throw new Error('CREDENCIAIS_SANDBOX_INCOMPLETAS')
  }
}
