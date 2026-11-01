// Catalogo de provedores para a TELA (nome, passo a passo, eventos, campos de configuracao).
// So dados, sem imports de Node: o navegador pode importar. A logica (assinatura, normalizacao) fica nos adaptadores do servidor.
// Provedor novo = adaptador em provedores/ (+ 1 linha no registro) + 1 entrada aqui. Um teste confere que as duas listas nao divergem.
export interface CampoConfiguracao {
  chave: string
  rotulo: string
  tipo: 'texto' | 'booleano'
  placeholder?: string
  ajuda?: string
}
export interface ProvedorUI {
  id: string
  nome: string
  descricao: string
  usaSegredo: boolean // o provedor assina os webhooks com um token/segredo (o adaptador confirma em needsSecret)
  rotuloSegredo: string // como o provedor chama o segredo na tela dele
  rotuloUrl: string // como o provedor chama o campo da URL
  passos: string[] // passo a passo na plataforma
  eventos: string[] // eventos a ativar na plataforma
  avisoTeste?: string
  campos: CampoConfiguracao[]
}

export const CATALOGO_PROVEDORES: readonly ProvedorUI[] = [
  {
    id: 'kiwify',
    nome: 'Kiwify',
    descricao: 'Receba as vendas, reembolsos e chargebacks dos seus produtos na Kiwify.',
    usaSegredo: true,
    rotuloSegredo: 'Token',
    rotuloUrl: 'URL',
    passos: [
      'Na Kiwify, abra a tela de Webhooks (menu Apps) e crie um novo webhook.',
      'Cole a URL abaixo no campo da URL do webhook.',
      'Cole o token abaixo no campo Token do webhook.',
      'Escolha os produtos e marque os eventos indicados.',
      'Salve e use o botão "Testar Webhook" da Kiwify: o evento deve aparecer aqui como teste.',
      'Volte aqui e clique em "Ativar vendas reais".',
    ],
    eventos: ['Compra aprovada', 'Compra reembolsada', 'Chargeback', 'Assinatura renovada'],
    avisoTeste: 'A Kiwify não tem ambiente de testes: o "Testar Webhook" envia dados fictícios. Por isso a conexão nasce em modo teste e as vendas só entram nos totais depois que você ativar.',
    campos: [],
  },
]

export function obterProvedorUI(id: string, catalogo: readonly ProvedorUI[] = CATALOGO_PROVEDORES): ProvedorUI | null {
  return catalogo.find((p) => p.id === id) ?? null
}
// Nome para exibir; provedor desconhecido (ex.: conexao antiga de um provedor removido) cai no proprio id.
export function nomeDoProvedor(id: string, catalogo: readonly ProvedorUI[] = CATALOGO_PROVEDORES): string {
  return obterProvedorUI(id, catalogo)?.nome ?? id
}
