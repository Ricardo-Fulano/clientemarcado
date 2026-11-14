import type { GatewayBilling, ProvedorBilling } from './types'

/** Registro extensivel. Por seguranca, NENHUM gateway real esta ligado neste bloco. */
export class ProvedorNaoConfiguradoError extends Error {
  constructor(nome: ProvedorBilling) { super(`PROVEDOR_NAO_CONFIGURADO:${nome}`) }
}

export class RegistroProvedoresBilling {
  private readonly registros = new Map<ProvedorBilling, GatewayBilling>()
  registrar(provedor: GatewayBilling) {
    if (this.registros.has(provedor.nome)) throw new Error(`PROVEDOR_DUPLICADO:${provedor.nome}`)
    this.registros.set(provedor.nome, provedor)
  }
  obter(nome: ProvedorBilling): GatewayBilling {
    const resultado = this.registros.get(nome)
    if (!resultado) throw new ProvedorNaoConfiguradoError(nome)
    return resultado
  }
  disponiveis(): ProvedorBilling[] { return [...this.registros.keys()] }
}

/** Desativado por padrao. Nunca redireciona cliente para um checkout sem aprovacao expressa. */
export function checkoutGlobalHabilitado(env: Record<string, string | undefined>): boolean {
  return env.MINIPAGE_BILLING_GLOBAL_ENABLED === 'true'
}
