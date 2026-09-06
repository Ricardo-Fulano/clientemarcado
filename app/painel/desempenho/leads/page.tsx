'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

// Mesmo email usado como fonte de verdade na API /api/admin/clientes - aqui so controla
// se a ABA aparece na tela (UX). A protecao REAL fica 100% na API, validada de novo la
// dentro, mesmo que alguem tente forcar a aba a aparecer via DevTools.
const EMAIL_AUTORIZADO = 'misteriosoviaje@gmail.com'

const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo',
  trial: 'Trial',
  pagante: 'Pagante',
  inativo: 'Inativo',
  cancelado: 'Cancelado',
  bloqueado: 'Bloqueado',
  aguardando_pagamento: 'Aguardando pagamento',
  em_atraso: 'Em atraso',
}
function statusLabel(s?: string | null): string {
  if (!s) return 'Status não identificado'
  return STATUS_LABEL[s] || s
}

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

  // Controle da aba "Clientes cadastrados" - so aparece pro e-mail autorizado.
  const [emailLogado, setEmailLogado] = useState('')
  const [aba, setAba] = useState<'leads' | 'clientes'>('leads')
  const [clientes, setClientes] = useState<any[]>([])
  const [carregandoClientes, setCarregandoClientes] = useState(false)
  const [erroClientes, setErroClientes] = useState('')
  const [buscaClientes, setBuscaClientes] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos')
  const [filtroPlanoCliente, setFiltroPlanoCliente] = useState<string>('todos')
  const [filtroPeriodoCliente, setFiltroPeriodoCliente] = useState<PeriodoLeads | '7d' | 'mes'>('tudo')
  const [copiadoClientes, setCopiadoClientes] = useState('')
  const [copiadoClienteIndividual, setCopiadoClienteIndividual] = useState<number | null>(null)

  const podeVerClientes = emailLogado.toLowerCase() === EMAIL_AUTORIZADO.toLowerCase()

  useEffect(() => { carregar() }, [])
  useEffect(() => { if (aba === 'clientes' && podeVerClientes && clientes.length === 0 && !carregandoClientes && !erroClientes) carregarClientes() }, [aba, podeVerClientes])

  async function carregar() {
    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setEmailLogado(user.email || '')
    // Mesmo filtro explicito por user_id ja usado no modal antigo (defesa em profundidade,
    // alem do RLS que ja restringe "dono le so os proprios leads").
    const { data } = await supabase.from('minipage_leads').select('email, item_titulo, origem, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
    setLeads(data || [])
    setCarregando(false)
  }

  // So chamada quando o dono clica na aba "Clientes cadastrados" (nunca automaticamente),
  // evitando buscar dados sensiveis sem necessidade. A API valida de novo o e-mail antes
  // de devolver qualquer dado - esse fetch so funciona de verdade pro e-mail autorizado.
  async function carregarClientes() {
    setCarregandoClientes(true)
    setErroClientes('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setErroClientes('Sessão expirada. Recarregue a página.'); setCarregandoClientes(false); return }
    try {
      const res = await fetch('/api/admin/clientes', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const dados = await res.json()
      if (!res.ok) { setErroClientes(dados.error || 'Não foi possível carregar os clientes.'); setCarregandoClientes(false); return }
      setClientes(dados.clientes || [])
    } catch {
      setErroClientes('Não foi possível carregar os clientes.')
    }
    setCarregandoClientes(false)
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

  const clientesFiltrados = useMemo(() => {
    let lista = clientes

    if (filtroStatus === 'ativos') lista = lista.filter(c => c.status_acesso === 'ativo' || c.status_acesso === 'pagante' || c.status_acesso === 'trial')
    if (filtroStatus === 'inativos') lista = lista.filter(c => c.status_acesso === 'inativo' || c.status_acesso === 'cancelado' || c.status_acesso === 'bloqueado')

    if (filtroPlanoCliente !== 'todos') lista = lista.filter(c => c.plano_tipo === filtroPlanoCliente)

    if (filtroPeriodoCliente !== 'tudo') {
      const agora = new Date()
      let dataInicio: Date | null = null
      if (filtroPeriodoCliente === 'hoje') { dataInicio = new Date(agora); dataInicio.setHours(0, 0, 0, 0) }
      else if (filtroPeriodoCliente === '7d') { dataInicio = new Date(agora); dataInicio.setDate(dataInicio.getDate() - 7) }
      else if (filtroPeriodoCliente === '30d') { dataInicio = new Date(agora); dataInicio.setDate(dataInicio.getDate() - 30) }
      else if (filtroPeriodoCliente === 'mes') { dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1) }
      if (dataInicio) lista = lista.filter(c => c.created_at && new Date(c.created_at) >= dataInicio!)
    }

    const termo = buscaClientes.trim().toLowerCase()
    if (!termo) return lista
    return lista.filter(c =>
      c.nome_pagina?.toLowerCase().includes(termo) ||
      c.email?.toLowerCase().includes(termo) ||
      c.slug?.toLowerCase().includes(termo) ||
      c.plano_nome?.toLowerCase().includes(termo)
    )
  }, [clientes, buscaClientes, filtroStatus, filtroPlanoCliente, filtroPeriodoCliente])

  async function copiarEmailCliente(c: any, idx: number) {
    await navigator.clipboard.writeText(c.email || '')
    setCopiadoClienteIndividual(idx)
    setTimeout(() => setCopiadoClienteIndividual(null), 1500)
  }
  async function copiarTodosEmailsClientes() {
    const texto = clientesFiltrados.map(c => c.email).filter(Boolean).join('\n')
    await navigator.clipboard.writeText(texto)
    setCopiadoClientes('E-mails copiados')
    setTimeout(() => setCopiadoClientes(''), 2000)
  }

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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0611' }}>
      <PainelSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
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

        {/* Aba "Clientes cadastrados" so aparece pro email autorizado - protecao real fica
            na API (/api/admin/clientes), isso aqui e so conveniencia de UX. */}
        {podeVerClientes && (
          <div style={{ display: 'flex', gap: '8px', padding: '0 32px 14px', flexShrink: 0 }}>
            <button onClick={() => setAba('leads')} style={{ background: aba === 'leads' ? G : 'rgba(24,16,27,.9)', border: aba === 'leads' ? 'none' : '1px solid #2A1A2F', color: '#F8F4F7', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Leads capturados</button>
            <button onClick={() => setAba('clientes')} style={{ background: aba === 'clientes' ? G : 'rgba(24,16,27,.9)', border: aba === 'clientes' ? 'none' : '1px solid #2A1A2F', color: '#F8F4F7', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Clientes cadastrados</button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 32px 32px' }}>
        {aba === 'leads' && (<>
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
        </>)}

        {aba === 'clientes' && podeVerClientes && (
          <>
            {carregandoClientes ? (
              <p style={{ fontSize: '13px', color: '#B8AAB8' }}>Carregando clientes...</p>
            ) : erroClientes ? (
              <div className="crd" style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#EF4444' }}>{erroClientes}</p>
              </div>
            ) : clientes.length === 0 ? (
              <div className="crd" style={{ padding: '40px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7' }}>Nenhum cliente cadastrado ainda.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ fontSize: '13px', color: '#B8AAB8', margin: 0 }}>{clientesFiltrados.length} de {clientes.length} clientes</p>
                  <input
                    value={buscaClientes}
                    onChange={e => setBuscaClientes(e.target.value)}
                    placeholder="Buscar por nome, e-mail, slug ou plano..."
                    style={{ flex: '1 1 220px', minWidth: '200px', padding: '9px 14px', borderRadius: '10px', border: '1px solid #2A1A2F', background: 'rgba(24,16,27,.9)', color: '#F8F4F7', fontSize: '13px', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as any)} style={{ background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#F8F4F7', cursor: 'pointer' }}>
                    <option value="todos">Todos os status</option>
                    <option value="ativos">Ativos</option>
                    <option value="inativos">Inativos</option>
                  </select>
                  <select value={filtroPlanoCliente} onChange={e => setFiltroPlanoCliente(e.target.value)} style={{ background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#F8F4F7', cursor: 'pointer' }}>
                    <option value="todos">Todos os planos</option>
                    <option value="free">MiniPage Free</option>
                    <option value="minipage">MiniPage</option>
                    <option value="loja">MiniPage Loja</option>
                    <option value="essencial">MiniPage Pro</option>
                    <option value="equipe">MiniPage Equipe</option>
                  </select>
                  <select value={filtroPeriodoCliente} onChange={e => setFiltroPeriodoCliente(e.target.value as any)} style={{ background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#F8F4F7', cursor: 'pointer' }}>
                    <option value="hoje">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="mes">Este mês</option>
                    <option value="tudo">Todo período</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                  <button onClick={copiarTodosEmailsClientes} style={{ background: G, border: 'none', color: '#fff', borderRadius: '10px', padding: '9px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {copiadoClientes || 'Copiar todos os e-mails filtrados'}
                  </button>
                </div>

                <div className="leads-tabela-wrap crd" style={{ overflowX: 'auto', padding: 0 }}>
                  <table className="leads-tabela">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>Plano</th>
                        <th>Slug</th>
                        <th>Status</th>
                        <th>Cadastro</th>
                        <th>Origem</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesFiltrados.map((c, i) => (
                        <tr key={c.user_id || i}>
                          <td style={{ fontWeight: 700 }}>{c.nome_pagina || '—'}</td>
                          <td>{c.email || '—'}</td>
                          <td style={{ color: '#B8AAB8' }}>{c.plano_nome}</td>
                          <td style={{ color: '#B8AAB8' }}>{c.slug || '—'}</td>
                          <td><span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', background: 'rgba(139,92,246,.14)', color: '#C4B5FD' }}>{statusLabel(c.status_acesso)}</span></td>
                          <td style={{ color: '#B8AAB8', whiteSpace: 'nowrap' }}>{c.created_at ? formatarData(c.created_at) : '—'}</td>
                          <td style={{ color: '#B8AAB8' }}>{c.origem || '—'}</td>
                          <td style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <button className="leads-copiar-btn" onClick={() => copiarEmailCliente(c, i)}>{copiadoClienteIndividual === i ? 'Copiado!' : 'Copiar e-mail'}</button>
                            {c.slug && <a href={`https://minipage.pro/${c.slug}`} target="_blank" rel="noreferrer" className="leads-copiar-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>Abrir MiniPage</a>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="leads-card-mobile">
                  {clientesFiltrados.map((c, i) => (
                    <div key={c.user_id || i} className="crd" style={{ padding: '14px', marginBottom: '10px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7', margin: '0 0 4px' }}>{c.nome_pagina || c.email || '—'}</p>
                      <p style={{ fontSize: '12px', color: '#B8AAB8', margin: '0 0 4px' }}>{c.email}</p>
                      <p style={{ fontSize: '12px', color: '#B8AAB8', margin: '0 0 8px' }}>{c.plano_nome} · {statusLabel(c.status_acesso)}</p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button className="leads-copiar-btn" onClick={() => copiarEmailCliente(c, i)}>{copiadoClienteIndividual === i ? 'Copiado!' : 'Copiar e-mail'}</button>
                        {c.slug && <a href={`https://minipage.pro/${c.slug}`} target="_blank" rel="noreferrer" className="leads-copiar-btn" style={{ textDecoration: 'none' }}>Abrir MiniPage</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  )
}
