// Exportacao do painel Desempenho (CSV e XLSX).
// Roda 100% no navegador e usa SOMENTE os dados que a tela ja carregou (nenhuma consulta nova, nenhuma rota, nenhum parametro).
// CSV e XLSX saem da MESMA tabela intermediaria (montarTabelas), entao os dois formatos nunca divergem.
// A biblioteca de XLSX (write-excel-file) so e carregada quando a pessoa clica em "Exportar Excel" (import dinamico).

export type ItemRanking = { titulo: string; qtd: number }
export type LeadExport = { email?: string | null; item_titulo?: string | null; origem?: string | null; created_at?: string | null }
export type ChaveRanking = 'links' | 'social' | 'destaques' | 'videos' | 'catalogo' | 'whatsapp'
export type DadosRanking = { permitido: boolean; itens: ItemRanking[] }
// As 6 categorias de ranking (e suas abas) sao fixas AQUI: o arquivo sempre sai com as mesmas 8 abas, independente de quem chama.
const CATEGORIAS: { chave: ChaveRanking; aba: string; titulo: string }[] = [
  { chave: 'links', aba: 'Links', titulo: 'Links mais clicados' },
  { chave: 'social', aba: 'Redes sociais', titulo: 'Redes sociais mais clicadas' },
  { chave: 'destaques', aba: 'Destaques', titulo: 'Destaques mais clicados' },
  { chave: 'videos', aba: 'Vídeos', titulo: 'Vídeos mais clicados' },
  { chave: 'catalogo', aba: 'Catálogo', titulo: 'Catálogo mais clicado' },
  { chave: 'whatsapp', aba: 'WhatsApp', titulo: 'Cliques no WhatsApp (detalhado)' },
]

export type DadosExportacao = {
  periodo: string // valor do seletor: '7d' | '30d' | 'mes' | 'tudo'
  periodoLabel: string // ex.: "Últimos 30 dias"
  inicio: Date | null // null = todo o periodo
  geradoEm: Date
  pubUrl: string
  visualizacoes: number
  cliquesTotais: number
  cliquesWhatsapp: number
  taxaClique: number // em %, igual ao painel (ex.: 12.5)
  leadsPermitido: boolean
  leads: LeadExport[] // JA filtrados pelo periodo selecionado
  leadsTotalHistorico: number // o que o card "Leads capturados" do painel mostra
  rankings: Partial<Record<ChaveRanking, DadosRanking>> // categoria ausente = "Sem dados no período"
  limiteEventos: number
  eventosCarregados: number
}

type ColunaCsv = 'Item' | 'Valor' | 'Origem' | 'Item de origem' | 'Data'
type Celula = string | number | { pct: number } // pct = percentual "em %" (12.5 => 12,5%)
type Coluna = { csv: ColunaCsv; rotulo: string; largura: number }
type Tabela = { aba: string; secao: string; colunas: Coluna[]; linhas: Celula[][] }

const CABECALHO_CSV: string[] = ['Seção', 'Item', 'Valor', 'Origem', 'Item de origem', 'Data']
const SEM_DADOS = 'Sem dados no período'
const BLOQUEADO = 'Disponível em planos superiores'
const SLUG_PERIODO: Record<string, string> = { '7d': '7-dias', '30d': '30-dias', mes: 'este-mes', tudo: 'todo-periodo' }

const dois = (n: number) => String(n).padStart(2, '0')
export function formatarData(d: Date) { return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}` }
export function formatarDataHora(d: Date) { return `${formatarData(d)} ${dois(d.getHours())}:${dois(d.getMinutes())}` }
const milhar = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

// Remove caracteres que sao invalidos em XML/XLSX (um titulo com caractere de controle corromperia a planilha).
// Os titulos dos cliques vem do navegador de qualquer visitante e a rota publica so limita o tamanho.
export function limparTexto(valor: unknown): string {
  const s = valor == null ? '' : String(valor)
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c <= 0x08 || c === 0x0b || c === 0x0c || (c >= 0x0e && c <= 0x1f) || c === 0x7f || c === 0xfffe || c === 0xffff) continue
    if (c >= 0xd800 && c <= 0xdbff) {
      const n = s.charCodeAt(i + 1)
      if (n >= 0xdc00 && n <= 0xdfff) { out += s[i] + s[i + 1]; i++ }
      continue
    }
    if (c >= 0xdc00 && c <= 0xdfff) continue
    out += s[i]
  }
  return out
}

// Protecao contra "CSV/Excel formula injection": texto que comeca com = + - @ (ou tab/CR) viraria formula ao abrir no Excel.
const COMECO_PERIGOSO = /^(?:[\s\u00a0]*[=+\-@]|[\t\r])/
export function neutralizarFormula(texto: string): string {
  return COMECO_PERIGOSO.test(texto) ? "'" + texto : texto
}

function textoCsv(celula: Celula): string {
  if (typeof celula === 'number') return String(celula)
  if (typeof celula === 'object') return `${celula.pct.toFixed(1).replace('.', ',')}%`
  return neutralizarFormula(limparTexto(celula))
}

function escaparCsv(campo: string): string {
  return /[;"\r\n]/.test(campo) ? `"${campo.replace(/"/g, '""')}"` : campo
}

function linhaSemDados(tabela: Tabela, mensagem: string): Celula[][] {
  return [[mensagem, ...tabela.colunas.slice(1).map(() => '')]]
}

export function montarNomeArquivo(periodo: string, data: Date, extensao: 'csv' | 'xlsx'): string {
  const slug = SLUG_PERIODO[periodo] || periodo
  return `minipage-desempenho-${slug}-${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}.${extensao}`
}

export function montarTabelas(d: DadosExportacao): Tabela[] {
  const colsResumo: Coluna[] = [{ csv: 'Item', rotulo: 'Métrica', largura: 34 }, { csv: 'Valor', rotulo: 'Valor', largura: 70 }]
  const colsRanking: Coluna[] = [{ csv: 'Item', rotulo: 'Item', largura: 52 }, { csv: 'Valor', rotulo: 'Cliques', largura: 12 }]
  const colsLeads: Coluna[] = [{ csv: 'Item', rotulo: 'E-mail', largura: 36 }, { csv: 'Origem', rotulo: 'Origem', largura: 18 }, { csv: 'Item de origem', rotulo: 'Item de origem', largura: 40 }, { csv: 'Data', rotulo: 'Data', largura: 18 }]

  const intervalo = d.inicio ? `de ${formatarData(d.inicio)} a ${formatarData(d.geradoEm)}` : 'Todo o período disponível'
  const resumo: Celula[][] = [
    ['Período', d.periodoLabel],
    ['Intervalo', intervalo],
    ['Gerado em', formatarDataHora(d.geradoEm)],
  ]
  if (d.pubUrl) resumo.push(['Página', d.pubUrl])
  resumo.push(['Visualizações', d.visualizacoes], ['Cliques totais', d.cliquesTotais], ['Cliques no WhatsApp', d.cliquesWhatsapp], ['Taxa de clique', { pct: d.taxaClique }])
  resumo.push(['Leads capturados no período', d.leadsPermitido ? d.leads.length : BLOQUEADO])
  if (d.eventosCarregados >= d.limiteEventos) {
    resumo.push(['Observação', `O painel carrega no máximo ${milhar(d.limiteEventos)} eventos por consulta (os mais recentes). Neste período o limite foi atingido, então este relatório pode estar limitado ao volume carregado pelo painel e os números de visualizações e cliques podem estar abaixo do real.`])
  }
  if (d.leadsPermitido && d.leadsTotalHistorico !== d.leads.length) {
    resumo.push(['Observação', `O card "Leads capturados" do painel mostra o total histórico (${d.leadsTotalHistorico}). Nesta exportação contam apenas os leads do período selecionado (${d.leads.length}).`])
  }

  const tabelas: Tabela[] = [{ aba: 'Resumo', secao: 'Resumo', colunas: colsResumo, linhas: resumo }]
  for (const cat of CATEGORIAS) {
    const r = d.rankings[cat.chave] || { permitido: true, itens: [] }
    const t: Tabela = { aba: cat.aba, secao: cat.titulo, colunas: colsRanking, linhas: [] }
    if (!r.permitido) t.linhas = linhaSemDados(t, BLOQUEADO)
    else if (r.itens.length === 0) t.linhas = linhaSemDados(t, SEM_DADOS)
    else t.linhas = r.itens.map((it): Celula[] => [it.titulo, it.qtd])
    tabelas.push(t)
  }
  const leads: Tabela = { aba: 'Leads', secao: 'Leads', colunas: colsLeads, linhas: [] }
  if (!d.leadsPermitido) leads.linhas = linhaSemDados(leads, BLOQUEADO)
  else if (d.leads.length === 0) leads.linhas = linhaSemDados(leads, SEM_DADOS)
  else leads.linhas = d.leads.map((l): Celula[] => [l.email || '', l.origem || '', l.item_titulo || '', l.created_at && !isNaN(new Date(l.created_at).getTime()) ? formatarDataHora(new Date(l.created_at)) : ''])
  tabelas.push(leads)
  return tabelas
}

export function gerarCsv(d: DadosExportacao): string {
  const linhas: string[] = [CABECALHO_CSV.join(';')]
  for (const t of montarTabelas(d)) {
    for (const linha of t.linhas) {
      const campos: string[] = [t.secao, '', '', '', '', '']
      t.colunas.forEach((c, i) => { campos[CABECALHO_CSV.indexOf(c.csv)] = textoCsv(linha[i] ?? '') })
      linhas.push(campos.map((c, i) => escaparCsv(i === 0 ? neutralizarFormula(c) : c)).join(';'))
    }
  }
  return linhas.join('\r\n') + '\r\n'
}

// BOM UTF-8 + separador ";" = abre direto, com acentos e colunas corretas, no Excel em portugues (e no Google Sheets).
export function gerarCsvBlob(d: DadosExportacao): Blob {
  return new Blob(['\uFEFF' + gerarCsv(d)], { type: 'text/csv;charset=utf-8' })
}

export async function gerarXlsxBlob(d: DadosExportacao): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const sheets = montarTabelas(d).map((t) => ({
    sheet: t.aba,
    stickyRowsCount: 1,
    columns: t.colunas.map((c) => ({ width: c.largura })),
    data: [
      t.colunas.map((c) => ({ value: c.rotulo, fontWeight: 'bold' as const })),
      ...t.linhas.map((linha) =>
        t.colunas.map((_, i) => {
          const v = linha[i] ?? ''
          if (typeof v === 'number') return { value: v, type: Number }
          if (typeof v === 'object') return { value: Math.round(Number(v.pct.toFixed(1)) * 10) / 1000, type: Number, format: '0.0%' }
          // Texto SEMPRE como texto (nunca formula, nunca numero/data "interpretado"): nada vindo de visitante vira formula no Excel.
          return { value: limparTexto(v), type: String, format: '@', wrap: true }
        })
      ),
    ],
  }))
  return await writeXlsxFile(sheets).toBlob()
}

export function baixarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
