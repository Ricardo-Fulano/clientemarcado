// Textos da secao "Vendas externas" do Desempenho, preparados para PT/EN/ES (so PT-BR esta preenchido por enquanto).
// Para traduzir no futuro: acrescentar o idioma em TEXTOS (qualquer chave ausente cai no PT-BR). Nada aqui cita provedor.
// Sem imports de Node: usado pelo navegador.
export type Idioma = 'pt-BR' | 'en' | 'es'
export const IDIOMA_PADRAO: Idioma = 'pt-BR'

const PT_BR = {
  titulo: 'Vendas externas',
  subtitulo: 'Vendas e conversões confirmadas pelas suas plataformas de venda, no período selecionado.',
  periodo: 'Período: {periodo}',
  carregando: 'Carregando vendas externas...',
  erro: 'Não foi possível carregar as vendas externas agora.',
  tentar_de_novo: 'Tentar de novo',
  bloqueado: 'Disponível em planos superiores.',
  ver_planos: 'Ver planos →',
  sem_conexao_titulo: 'Nenhuma plataforma de venda conectada',
  sem_conexao_texto: 'Conecte uma plataforma de venda para acompanhar aqui as vendas geradas pela sua MiniPage.',
  sem_conexao_cta: 'Conectar plataforma',
  gerenciar_cta: 'Gerenciar vendas externas',
  sem_vendas: 'Nenhuma venda externa registrada neste período.',
  so_teste: 'Suas conexões ainda estão em modo teste. As vendas reais só entram nos totais depois que você as ativar.',
  metrica_vendas: 'Vendas confirmadas',
  metrica_receita: 'Receita bruta',
  metrica_liquida: 'Líquida: {valor}',
  metrica_reembolsos: 'Reembolsos',
  metrica_chargebacks: 'Chargebacks',
  detalhe_vendas: '{pagas} sem reembolso · {reembolsadas} com reembolso · {chargebacks} com chargeback',
  rank_vendas_item: 'Vendas por item',
  rank_receita_item: 'Receita por item',
  rank_vendas_plataforma: 'Vendas por plataforma',
  rank_receita_plataforma: 'Receita por plataforma',
  sem_atribuicao: 'Sem atribuição',
  item_removido: 'Item removido',
  item_sem_titulo: 'Sem título',
  venda_singular: '{n} venda',
  venda_plural: '{n} vendas',
  evento_teste_singular: '{n} evento de teste não entra nos totais.',
  evento_teste_plural: '{n} eventos de teste não entram nos totais.',
  tipo_link: 'Link',
  tipo_destaque: 'Destaque',
  tipo_catalogo: 'Catálogo',
  tipo_video: 'Vídeo',
  tipo_card: 'Card',
  origem_minipage: 'Vendas com origem na MiniPage: {n} de {total}.',
  cliques_vendas_titulo: 'Cliques → vendas',
  cliques_vendas_linha: '{cliques} cliques → {vendas} vendas ({taxa})',
  cliques_vendas_ajuda: 'Compara os cliques de cada item com as vendas atribuídas a ele no mesmo período. Uma venda pode ter origem em um clique de um período anterior.',
  cliques_vendas_sem_dados: 'Não há dados comparáveis para calcular cliques → vendas neste período. Mostramos apenas vendas e receita.',
  nota_truncado: 'Mostrando as {limite} vendas mais recentes do período. Os totais podem estar incompletos.',
} as const

export type ChaveTexto = keyof typeof PT_BR
type Dicionario = Partial<Record<ChaveTexto, string>>
export const TEXTOS: Readonly<Record<Idioma, Dicionario>> = { 'pt-BR': PT_BR, en: {}, es: {} }

export function texto(chave: ChaveTexto, vars?: Record<string, string | number>, idioma: Idioma = IDIOMA_PADRAO): string {
  const base = TEXTOS[idioma]?.[chave] ?? PT_BR[chave]
  return vars ? base.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : base
}
export function tipoDeItemRotulo(tipo: string, idioma: Idioma = IDIOMA_PADRAO): string {
  const chave = `tipo_${tipo}` as ChaveTexto
  return chave in PT_BR ? texto(chave, undefined, idioma) : tipo
}
export function nVendas(n: number, idioma: Idioma = IDIOMA_PADRAO): string {
  return texto(n === 1 ? 'venda_singular' : 'venda_plural', { n }, idioma)
}
