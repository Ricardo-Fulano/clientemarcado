/** Paddle: somente testes. Nenhuma leitura de banco, cobranca ou conceder acesso. */
export function paddleSandboxHabilitado(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.PADDLE_BILLING_SANDBOX_ENABLED === 'true' &&
    env.PADDLE_ENVIRONMENT === 'sandbox' &&
    env.VERCEL_ENV !== 'production' &&
    env.NODE_ENV !== 'test'
}

export function segredoPaddleSandbox(env: NodeJS.ProcessEnv = process.env): string | null {
  const segredo = env.PADDLE_SANDBOX_WEBHOOK_SECRET?.trim()
  return segredo && segredo.length >= 16 ? segredo : null
}
