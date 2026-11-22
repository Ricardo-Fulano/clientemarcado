import type { ProvedorGlobal, MetodoGlobal, PlanoGlobalPago } from './esquema'
/** Porta padrao para integracoes futuras. NENHUM adaptador real esta habilitado. */
export interface PedidoAssinaturaGlobal {
  tentativaInterna: string
  assinaturaInternaId: string
  entidadeId: string
  contaInternaId: string
  provedor: ProvedorGlobal
  plano: PlanoGlobalPago
  ciclo: 'mensal'|'anual'
  paisComprador: string
  metodo: MetodoGlobal
  moeda: string
  valorCentavos: number
}
export interface ResultadoInicioGlobal { urlExterna: string; idSessaoExterna: string }
export interface AdaptadorAssinaturaGlobal {
  readonly provedor: ProvedorGlobal
  /** So realizar quando homologado, contrato validado e elegibilidade confirmada no banco. */
  iniciarAssinatura(pedido: PedidoAssinaturaGlobal): Promise<ResultadoInicioGlobal>
  /** Webhook nao confiavel antes de verificacao criptografica e anti-replay. */
  verificarWebhook(corpoBruto: string, cabecalhos: Readonly<Record<string,string>>): Promise<boolean>
}
export class IntegracaoGlobalNaoHabilitada extends Error {
  constructor(provedor: ProvedorGlobal) { super(`INTEGRACAO_${provedor.toUpperCase()}_AGUARDA_CREDENCIAMENTO_E_HOMOLOGACAO`) }
}
/** Fail-closed: nunca simular que pagamento foi processado. */
export function adaptadorGlobalNaoHabilitado(provedor: ProvedorGlobal): AdaptadorAssinaturaGlobal {
  return {
    provedor,
    async iniciarAssinatura(_pedido) { throw new IntegracaoGlobalNaoHabilitada(provedor) },
    async verificarWebhook(_corpo, _cabecalhos) { throw new IntegracaoGlobalNaoHabilitada(provedor) },
  }
}
