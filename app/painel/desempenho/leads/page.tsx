'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

// Conjunto proprio de periodo pra esta pagina - valores diferentes dos ja usados em
// /painel/desempenho (que tem 7d/30d/mes/tudo), conforme pedido explicito (Hoje/Esta
// semana/Ultimos 30 dias/Todo periodo). So o ESTILO visual do seletor e reaproveitado.
type PeriodoLeads = 'hoje' | 'semana' | '30d' | 'tudo'
const OPCOES_PERIODO_LEADS: { valor: PeriodoLeads; label: string }[] = [
  { valor: 'hoje', label: 'Hoje' },
  { valor: 'semana', label: 'Esta semana' },
  { valor: '30d', label: 'Últimos 30 dias' },
  { valor: 'tudo', label: 'Todo período' },
]
function calcularDataInicioLeads(periodo: PeriodoLeads): Date | null {
  const agora = new Date()
  if (periodo === 'hoje') { const d = new Date(agora); d.setHours(0, 0, 0, 0); return d }
  if (periodo === 'semana') { const d = new Date(agora); d.setDate(d.getDate() - 7); return d }
  if (periodo === '30d') { const d = new Date(agora); d.setDate(d.getDate() - 30); return d }
  return null // 'tudo'
}

function origemLabel(l: any): string {
  return l.origem === 'catalogo' && l.item_titulo ? `Catálogo: ${l.item_titulo}` : (l.origem || 'Página')
}
function formatarData(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

// Pagina dedicada de leads - substitui o modal pequeno que existia antes em /painel/desempenho.
// Reutiliza a MESMA query (mesmos campos, mesmo filtro explicito por user_id) e as MESMAS
// funcoes de copiar que ja existiam no modal - nao inventa nada novo na captura/consulta,
// so move a visualizacao pra uma pagina com espaco de verdade (busca + rolagem), essencial
// pra contas com centenas/milhares de leads.
export default function LeadsCapturados() {
  const [carregando, setCarregando] = useState(true)
  const [leads, setLeads] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [periodo, setPeriodo] = useState<PeriodoLeads>('30d')
  const [copiado, setCopiado] = useState('')
  const [copiadoIndividual, setCopiadoIndividual] = useState<number | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    // Mesmo filtro explicito por user_id ja usado no modal antigo (defesa em profundidade,
    // alem do RLS que ja restringe "dono le so os proprios leads").
    const { data } = await supabase.from('minipage_leads').select('email, item_titulo, origem, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
    setLeads(data || [])
    setCarregando(false)
  }

  const leadsFiltrados = useMemo(() => {
    const dataInicio = calcularDataInicioLeads(periodo)
    const porPeriodo = dataInicio ? leads.filter(l => new Date(l.created_at) >= dataInicio) : leads

    const termo = busca.trim().toLowerCase()
    if (!termo) return porPeriodo
    return porPeriodo.filter(l =>
      l.email?.toLowerCase().includes(termo) ||
      l.item_titulo?.toLowerCase().includes(termo) ||
      l.origem?.toLowerCase().includes(termo)
    )
  }, [leads, busca, periodo])

  async function copiarSomenteEmails() {
    const texto = leadsFiltrados.map(l => l.email).join('\n')
    await navigator.clipboard.writeText(texto)
    setCopiado('emails')
    setTimeout(() => setCopiado(''), 2000)
  }
  async function copiarTodos() {
    const texto = leadsFiltrados.map(l => `${l.email} - ${origemLabel(l)} - ${formatarData(l.created_at)}`).join('\n')
    await navigator.clipboard.writeText(texto)
    setCopiado('todos')
    setTimeout(() => setCopiado(''), 2000)
  }
  async function copiarIndividual(l: any, idx: number) {
    await navigator.clipboard.writeText(l.email)
    setCopiadoIndividual(idx)
    setTimeout(() => setCopiadoIndividual(null), 1500)
  }
  function exportarCSV() {
    const cabecalho = 'email,origem,item,data\n'
    const linhas = leadsFiltrados.map(l => {
      const item = l.origem === 'catalogo' ? (l.item_titulo || '') : ''
      // Escapa aspas duplas e envolve em aspas campos que podem ter virgula
      const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`
      return [esc(l.email), esc(l.origem || ''), esc(item), esc(formatarData(l.created_at))].join(',')
    }).join('\n')
    const blob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-minipage-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0A0611', overflow: 'hidden' }}>
      <PainelSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        {/* Cabecalho fixo (nunca rola) - titulo, subtitulo, busca e periodo sempre visiveis */}
        <div style={{ padding: '32px 32px 0', flexShrink: 0 }}>
          <Link href="/painel/desempenho" style={{ fontSize: '13px', color: '#B8AAB8', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>← Voltar para Desempenho</Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', margin: 0 }}>Leads capturados</h1>
              <p style={{ fontSize: '13px', color: '#B8AAB8', marginTop: '4px' }}>Veja os contatos capturados pela sua MiniPage.</p>
            </div>
            {/* Mesmo estilo visual do seletor ja usado em /painel/desempenho - valores
                proprios desta pagina (Hoje/Esta semana/Ultimos 30 dias/Todo periodo). */}
            <select value={periodo} onChange={e => setPeriodo(e.target.value as PeriodoLeads)} style={{ background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', color: '#F8F4F7', cursor: 'pointer', flexShrink: 0 }}>
              {OPCOES_PERIODO_LEADS.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 32px 32px' }}>
        {carregando ? (
          <p style={{ fontSize: '13px', color: '#B8AAB8' }}>Carregando...</p>
        ) : leads.length === 0 ? (
          <div className="crd" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '6px' }}>Nenhum lead capturado ainda.</p>
            <p style={{ fontSize: '13px', color: '#B8AAB8' }}>Assim que alguém informar o e-mail na sua MiniPage, ele aparece aqui.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#B8AAB8', margin: 0 }}>{leadsFiltrados.length} de {leads.length} leads</p>
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por e-mail, item ou origem..."
                style={{ flex: '1 1 220px', minWidth: '200px', padding: '9px 14px', borderRadius: '10px', border: '1px solid #2A1A2F', background: 'rgba(24,16,27,.9)', color: '#F8F4F7', fontSize: '13px', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <button onClick={copiarSomenteEmails} style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#F8F4F7', borderRadius: '10px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {copiado === 'emails' ? 'Copiado!' : 'Copiar somente e-mails'}
              </button>
              <button onClick={copiarTodos} style={{ background: G, border: 'none', color: '#fff', borderRadius: '10px', padding: '9px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {copiado === 'todos' ? 'Copiado!' : 'Copiar todos'}
              </button>
              <button onClick={exportarCSV} style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#F8F4F7', borderRadius: '10px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Exportar CSV</button>
            </div>

            {/* Desktop: tabela. Mobile: cards empilhados (a mesma <table> vira cards via CSS,
                sem precisar duplicar a logica/dados - so a apresentacao muda por breakpoint). */}
            <style>{`
              .leads-tabela{width:100%;border-collapse:collapse}
              .leads-tabela th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#B8AAB8;padding:10px 12px;border-bottom:1px solid #2A1A2F;position:sticky;top:0;background:#18101B;z-index:1}
              .leads-tabela td{padding:12px;font-size:13px;color:#F8F4F7;border-bottom:1px solid #2A1A2F}
              .leads-copiar-btn{background:rgba(255,255,255,.08);border:1px solid #2A1A2F;color:#F8F4F7;border-radius:8px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit}
              .leads-card-mobile{display:none}
              @media(max-width:680px){
                .leads-tabela-wrap{display:none}
                .leads-card-mobile{display:block}
              }
            `}</style>

            <div className="leads-tabela-wrap crd" style={{ overflowX: 'auto', padding: 0 }}>
              <table className="leads-tabela">
                <thead>
                  <tr>
                    <th>E-mail</th>
                    <th>Origem / item</th>
                    <th>Data</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {leadsFiltrados.map((l, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{l.email}</td>
                      <td style={{ color: '#B8AAB8' }}>{origemLabel(l)}</td>
                      <td style={{ color: '#B8AAB8', whiteSpace: 'nowrap' }}>{formatarData(l.created_at)}</td>
                      <td><button className="leads-copiar-btn" onClick={() => copiarIndividual(l, i)}>{copiadoIndividual === i ? 'Copiado!' : 'Copiar'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="leads-card-mobile">
              {leadsFiltrados.map((l, i) => (
                <div key={i} className="crd" style={{ padding: '14px', marginBottom: '10px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7', margin: '0 0 4px' }}>{l.email}</p>
                  <p style={{ fontSize: '12px', color: '#B8AAB8', margin: '0 0 8px' }}>{origemLabel(l)} · {formatarData(l.created_at)}</p>
                  <button className="leads-copiar-btn" onClick={() => copiarIndividual(l, i)}>{copiadoIndividual === i ? 'Copiado!' : 'Copiar e-mail'}</button>
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  )
}
