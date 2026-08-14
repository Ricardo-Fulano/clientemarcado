// Normalizacao de planos (Fase 2 - suporte tecnico ao plano MiniPage, sem mexer em cobranca/Mercado Pago).
//
// Hoje o banco guarda em `perfis.plano_tipo` valores como 'essencial' e 'equipe'.
// A partir de agora tambem aceitamos 'minipage' e 'profissional'.
//
// Regra de compatibilidade (NAO QUEBRAR CLIENTES ANTIGOS):
//   essencial      -> tratado como profissional (mesmo plano R$79,90, so mudou o nome comercial)
//   profissional   -> profissional
//   equipe         -> equipe
//   minipage       -> minipage
//   null/vazio/outro valor -> profissional (mesma regra que o sistema ja usava pra "essencial" como padrao)

export type PlanoNormalizado = 'minipage' | 'profissional' | 'equipe'

export function normalizarPlano(planoTipo?: string | null): PlanoNormalizado {
  const p = (planoTipo || '').toLowerCase().trim()
  if (p === 'minipage') return 'minipage'
  if (p === 'equipe') return 'equipe'
  // 'essencial', 'profissional', vazio ou qualquer valor desconhecido caem aqui
  return 'profissional'
}

export function ehPlanoMiniPage(planoTipo?: string | null): boolean {
  return normalizarPlano(planoTipo) === 'minipage'
}

export function ehPlanoEquipe(planoTipo?: string | null): boolean {
  return normalizarPlano(planoTipo) === 'equipe'
}
