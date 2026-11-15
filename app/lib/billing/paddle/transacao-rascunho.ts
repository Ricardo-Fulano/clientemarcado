import { resolverPrecoSandbox } from './checkout-preview'

/** Bloco 9B: apenas compoe a solicitacao; NUNCA chama a Paddle. */
export type PerfilCompraSandbox = {
  userId: unknown
  plano: unknown
  ciclo: unknown
  statusAcesso: unknown
  tentativaId: unknown
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Deve receber dados comprovadamente recuperados no servidor, nao do body do cliente. */
export function prepararTransacaoSandbox(dados: PerfilCompraSandbox) {
  if (dados.statusAcesso !== 'aguardando_pagamento') throw new Error('ACESSO_FORA_DO_FLUXO')
  if (typeof dados.userId !== 'string' || !UUID.test(dados.userId)) throw new Error('USUARIO_INVALIDO')
  if (typeof dados.tentativaId !== 'string' || !UUID.test(dados.tentativaId)) throw new Error('TENTATIVA_INVALIDA')

  const preco = resolverPrecoSandbox(dados.plano, dados.ciclo)
  const payload = {
    collection_mode: 'automatic' as const,
    items: [{ price_id: preco.priceId, quantity: 1 as const }],
    custom_data: {
      minipage_user_id: dados.userId,
      minipage_attempt_id: dados.tentativaId,
      plan_code: preco.plano,
      billing_cycle: preco.ciclo,
    },
  }
  return { ambiente: 'sandbox' as const, metodo: 'POST' as const,
    rota: '/transactions' as const, plano: preco.plano, ciclo: preco.ciclo, payload }
}

/** Trava de seguranca: nenhuma gravacao antes de reserva persistente/idempotente. */
export function transacoesSandboxHabilitadas(): false { return false }
