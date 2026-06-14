'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Wallet, TrendingUp, TrendingDown, Clock, Search, Plus, Pencil, Trash2 } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'
const CATEGORIAS = ['Aluguel','Água','Luz','Internet','Produtos','Funcionários','Comissão','Manutenção','Marketing','Taxas','Outros']
const FORMAS = ['Pix','Dinheiro','Cartão','Boleto','Transferência','Outro']

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
select option{background:#07111F;color:#F8FAFC}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1200px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.28)}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
.tab-btn{padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.16);background:rgba(15,23,42,.86);color:#94A3B8;transition:all .18s;font-family:inherit;white-space:nowrap}
.tab-btn.on{background:${G};border-color:transparent;color:#fff;box-shadow:0 4px 16px rgba(59,130,246,.25)}
.inp{width:100%;background:rgba(15,23,42,.88);border:1.5px solid rgba(148,163,184,.18);border-radius:10px;padding:10px 14px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.45)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px}
.btn-p{background:${G};color:#fff;border:none;border-radius:10px;height:44px;padding:0 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 14px rgba(59,130,246,.25)}
.btn-s{background:rgba(255,255,255,.06);color:#94A3B8;border:1px solid rgba(148,163,184,.18);border-radius:10px;height:44px;padding:0 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px}
@media(max-width:1023px){
  .psb-main .bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .tabs-row{flex-wrap:wrap!important;gap:6px!important}
  .tabs-row .tab-btn{flex:1 1 calc(33% - 6px);justify-content:center;text-align:center}
  .form-2col{grid-template-columns:1fr!important}
}
@media(max-width:480px){
  .kpi-grid{grid-template-columns:1fr 1fr!important}
  .tabs-row .tab-btn{flex:1 1 calc(33% - 6px);font-size:12px;padding:8px 10px}
}
@media(max-width:1023px){
  .resumo-grid{grid-template-columns:1fr!important}
  .periodo-input{font-size:12px!important;padding:6px 10px!important;min-width:0!important;width:100%!important}
  .periodo-wrap{width:100%!important}
  .header-fin{flex-direction:column!important;align-items:stretch!important}
}
`

function fmtBRL(v: number) { return `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
function fmtData(d: string) { if (!d) return ''; const [a, m, di] = d.split('-'); return `${di}/${m}/${a}` }
function mesNome(ym: string) {
  const [a, m] = ym.split('-')
  const ns = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return `${ns[parseInt(m) - 1]} de ${a}`
}

export default function Financeiro() {
  const [userId, setUserId] = useState('')
  const [perfil, setPerfil] = useState<any>(null)
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [despesas, setDespesas] = useState<any[]>([])
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'resumo' | 'pagamentos' | 'despesas'>('resumo')
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))
  const [busca, setBusca] = useState('')
  const [msg, setMsg] = useState('')
  // Despesa form
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [fDesc, setFDesc] = useState('')
  const [fCat, setFCat] = useState('Aluguel')
  const [fCatOutro, setFCatOutro] = useState('')
  const [fValor, setFValor] = useState('')
  const [fData, setFData] = useState(new Date().toISOString().split('T')[0])
  const [fForma, setFForma] = useState('Pix')
  const [fTipo, setFTipo] = useState('Variável')
  const [fRepete, setFRepete] = useState(false)
  const [fObs, setFObs] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { init() }, [])
  useEffect(() => { if (userId) loadDados() }, [mes, userId])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const { data: p } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()
    setPerfil(p)
  }

  async function loadDados() {
    const [{ data: pags }, { data: desps }, { data: orcs }] = await Promise.all([
      supabase.from('pagamentos').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('despesas').select('*').eq('user_id', userId).order('data', { ascending: false }),
      supabase.from('orcamentos').select('id,saldo_restante,status').eq('user_id', userId),
    ])
    setPagamentos(pags || [])
    setDespesas(desps || [])
    setOrcamentos(orcs || [])
    setLoading(false)
  }

  const pagMes = pagamentos.filter(p => p.data?.startsWith(mes))
  const despMes = despesas.filter(d => d.data?.startsWith(mes))
  const recebidoMes = pagMes.reduce((a, p) => a + (p.valor || 0), 0)
  const despesasMes = despMes.reduce((a, d) => a + (d.valor || 0), 0)
  const resultado = recebidoMes - despesasMes
  const aReceber = orcamentos.filter(o => !['Pago', 'Finalizado', 'Cancelado'].includes(o.status)).reduce((a, o) => a + (o.saldo_restante || 0), 0)

  function resetForm() {
    setFDesc(''); setFCat('Aluguel'); setFCatOutro(''); setFValor('')
    setFData(new Date().toISOString().split('T')[0]); setFForma('Pix')
    setFTipo('Variável'); setFRepete(false); setFObs(''); setEditId(null)
  }

  function abrirEditar(d: any) {
    setEditId(d.id); setFDesc(d.descricao || ''); setFCat(d.categoria || 'Aluguel')
    setFCatOutro(d.categoria_outros || ''); setFValor(d.valor ? String(d.valor) : '')
    setFData(d.data || new Date().toISOString().split('T')[0]); setFForma(d.forma_pagamento || 'Pix')
    setFTipo(d.tipo_despesa || 'Variável'); setFRepete(d.repetir_mensalmente || false)
    setFObs(d.observacao || ''); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function salvarDespesa() {
    if (!fDesc.trim()) { setMsg('Informe a descrição.'); return }
    if (fCat === 'Outros' && !fCatOutro.trim()) { setMsg('Especifique a despesa.'); return }
    if (!fValor || parseFloat(fValor.replace(',', '.')) <= 0) { setMsg('Informe o valor.'); return }
    setSalvando(true)
    const payload = {
      user_id: userId,
      descricao: fDesc.trim(),
      categoria: fCat,
      categoria_outros: fCat === 'Outros' ? fCatOutro.trim() : null,
      valor: parseFloat(fValor.replace(',', '.')) || 0,
      data: fData,
      forma_pagamento: fForma,
      tipo_despesa: fTipo,
      repetir_mensalmente: fRepete,
      observacao: fObs.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (editId) {
      await supabase.from('despesas').update(payload).eq('id', editId)
    } else {
      await supabase.from('despesas').insert(payload)
    }
    await loadDados(); resetForm(); setShowForm(false); setSalvando(false)
    setMsg(editId ? 'Despesa atualizada!' : 'Despesa cadastrada!')
    setTimeout(() => setMsg(''), 3000)
  }

  async function excluirDespesa(id: string) {
    if (!confirm('Excluir esta despesa?')) return
    await supabase.from('despesas').delete().eq('id', id)
    await loadDados()
  }

  const nome = perfil?.nome_negocio || ''
  const pagFiltrados = pagamentos.filter(p => {
    const passMes = p.data?.startsWith(mes)
    const passBusca = !busca || [p.cliente_nome, p.forma, p.descricao].some((v: string) => v?.toLowerCase().includes(busca.toLowerCase()))
    return passMes && passBusca
  })
  const despFiltradas = despesas.filter(d => {
    const passMes = d.data?.startsWith(mes)
    const passBusca = !busca || [d.descricao, d.categoria].some((v: string) => v?.toLowerCase().includes(busca.toLowerCase()))
    return passMes && passBusca
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050B16', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <p style={{ color: '#64748B', fontSize: '14px' }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050B16', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar nome={nome} tituloMobile="Financeiro" />
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg && <div style={{ position: 'fixed', top: '72px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,.96)', border: '1px solid rgba(59,130,246,.35)', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, color: '#F8FAFC', zIndex: 99, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>{msg}</div>}

          {/* Header */}
          <div className="header-fin" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.04em', marginBottom: '5px' }}>Financeiro</h1>
              <p style={{ fontSize: '13px', color: '#64748B' }}>Acompanhe recebimentos, despesas e o resultado do seu negócio.</p>
            </div>
            <div className="periodo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Período</p>
                <input type="month" value={mes} onChange={e => setMes(e.target.value)} className="periodo-input"
                  style={{ background: 'rgba(15,23,42,.88)', border: '1.5px solid rgba(148,163,184,.18)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', color: '#F8FAFC', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as any }} />
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              { l: 'Recebido no mês', v: fmtBRL(recebidoMes), c: '#4ADE80', bg: 'rgba(34,197,94,.10)', bd: 'rgba(34,197,94,.26)', I: TrendingUp },
              { l: 'Despesas do mês', v: fmtBRL(despesasMes), c: '#F87171', bg: 'rgba(239,68,68,.10)', bd: 'rgba(239,68,68,.26)', I: TrendingDown },
              { l: 'Resultado estimado', v: fmtBRL(resultado), c: resultado >= 0 ? '#4ADE80' : '#F87171', bg: resultado >= 0 ? 'rgba(34,197,94,.10)' : 'rgba(239,68,68,.10)', bd: resultado >= 0 ? 'rgba(34,197,94,.26)' : 'rgba(239,68,68,.26)', I: Wallet },
              { l: 'A receber', v: fmtBRL(aReceber), c: '#FBBF24', bg: 'rgba(245,158,11,.10)', bd: 'rgba(245,158,11,.26)', I: Clock },
            ].map(k => (
              <div key={k.l} className="crd" style={{ padding: '18px 16px', background: `radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`, border: `1.5px solid ${k.bd}` }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}><k.I size={18} color={k.c} /></div>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: '3px' }}>{k.l}</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: k.c, lineHeight: 1 }}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* Abas */}
          <div className="tabs-row" style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {(['resumo', 'pagamentos', 'despesas'] as const).map(a => (
              <button key={a} onClick={() => { setAba(a); setBusca('') }} className={`tab-btn${aba === a ? ' on' : ''}`}>
                {a === 'resumo' ? 'Resumo' : a === 'pagamentos' ? 'Pagamentos' : 'Despesas'}
              </button>
            ))}
          </div>

          {/* ABA RESUMO */}
          {aba === 'resumo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="resumo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Pagamentos recentes */}
                <div className="crd" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '14px' }}>Pagamentos recentes</p>
                  {pagMes.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#64748B' }}>Nenhum pagamento em {mesNome(mes)}.</p>
                  ) : pagMes.slice(0, 5).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>{p.cliente_nome || p.descricao || '—'}</p>
                        <p style={{ fontSize: '11px', color: '#64748B' }}>{p.forma} · {fmtData(p.data)}</p>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#4ADE80' }}>{fmtBRL(p.valor)}</p>
                    </div>
                  ))}
                  {pagMes.length > 5 && <p style={{ fontSize: '12px', marginTop: '8px', cursor: 'pointer', color: '#60A5FA' }} onClick={() => setAba('pagamentos')}>Ver todos ({pagMes.length})</p>}
                </div>
                {/* Últimas despesas */}
                <div className="crd" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '14px' }}>Últimas despesas</p>
                  {despMes.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#64748B' }}>Nenhuma despesa em {mesNome(mes)}.</p>
                  ) : despMes.slice(0, 5).map(d => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>{d.descricao}</p>
                        <p style={{ fontSize: '11px', color: '#64748B' }}>{d.categoria} · {fmtData(d.data)}</p>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#F87171' }}>{fmtBRL(d.valor)}</p>
                    </div>
                  ))}
                  {despMes.length > 5 && <p style={{ fontSize: '12px', cursor: 'pointer', color: '#60A5FA', marginTop: '8px' }} onClick={() => setAba('despesas')}>Ver todas ({despMes.length})</p>}
                </div>
              </div>
            </div>
          )}

          {/* ABA PAGAMENTOS */}
          {aba === 'pagamentos' && (
            <div>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={15} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Buscar pagamento, cliente ou forma..." value={busca} onChange={e => setBusca(e.target.value)}
                  style={{ width: '100%', background: 'rgba(15,23,42,.88)', border: '1.5px solid rgba(148,163,184,.18)', borderRadius: '12px', padding: '11px 16px 11px 42px', fontSize: '13px', color: '#F8FAFC', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as any }} />
              </div>
              {pagFiltrados.length === 0 ? (
                <div className="crd" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(34,197,94,.10)', border: '1px solid rgba(34,197,94,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <TrendingUp size={24} color="#4ADE80" />
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px' }}>Nenhum pagamento em {mesNome(mes)}</p>
                  <p style={{ fontSize: '13px', color: '#64748B' }}>Pagamentos confirmados em orçamentos aparecerão aqui.</p>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.18)', borderRadius: '12px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#64748B' }}>{pagFiltrados.length} pagamento{pagFiltrados.length !== 1 ? 's' : ''}</p>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: '#4ADE80' }}>Total: {fmtBRL(pagFiltrados.reduce((a, p) => a + (p.valor || 0), 0))}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pagFiltrados.map(p => (
                      <div key={p.id} className="crd" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>{p.cliente_nome || p.descricao || 'Pagamento'}</p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', color: '#64748B' }}>{p.forma || p.forma_pagamento || '—'}</span>
                              {p.data && <span style={{ fontSize: '12px', color: '#64748B' }}>· {fmtData(p.data)}</span>}
                              {p.origem && <span style={{ fontSize: '11px', color: '#94A3B8', background: 'rgba(255,255,255,.05)', padding: '2px 8px', borderRadius: '999px' }}>{p.origem}</span>}
                            </div>
                          </div>
                          <p style={{ fontSize: '20px', fontWeight: 800, color: '#4ADE80', lineHeight: 1 }}>{fmtBRL(p.valor)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA DESPESAS */}
          {aba === 'despesas' && (
            <div>
              {showForm && (
                <div className="crd" style={{ padding: '24px', marginBottom: '20px', border: '1.5px solid rgba(124,58,237,.28)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#C4B5FD' }}>{editId ? 'Editar despesa' : 'Nova despesa'}</p>
                    <button onClick={() => { resetForm(); setShowForm(false) }} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>×</button>
                  </div>
                  <div className="form-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className="lbl">Descrição *</label>
                      <input className="inp" type="text" placeholder="Ex: Aluguel da sala" value={fDesc} onChange={e => setFDesc(e.target.value)} />
                    </div>
                    <div>
                      <label className="lbl">Categoria</label>
                      <select className="inp" value={fCat} onChange={e => setFCat(e.target.value)} style={{ cursor: 'pointer' }}>
                        {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    {fCat === 'Outros' && (
                      <div>
                        <label className="lbl">Especifique *</label>
                        <input className="inp" type="text" placeholder="Ex: manutenção da cadeira" value={fCatOutro} onChange={e => setFCatOutro(e.target.value)} />
                      </div>
                    )}
                    <div>
                      <label className="lbl">Valor (R$) *</label>
                      <input className="inp" type="number" min="0" step="0.01" placeholder="0,00" value={fValor} onChange={e => setFValor(e.target.value)} />
                    </div>
                    <div>
                      <label className="lbl">Data</label>
                      <input className="inp" type="date" value={fData} onChange={e => setFData(e.target.value)} />
                    </div>
                    <div>
                      <label className="lbl">Forma de pagamento</label>
                      <select className="inp" value={fForma} onChange={e => setFForma(e.target.value)} style={{ cursor: 'pointer' }}>
                        {FORMAS.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="lbl">Tipo</label>
                      <select className="inp" value={fTipo} onChange={e => setFTipo(e.target.value)} style={{ cursor: 'pointer' }}>
                        <option>Fixa</option>
                        <option>Variável</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button onClick={() => setFRepete(!fRepete)}
                        style={{ width: '36px', height: '20px', borderRadius: '999px', border: 'none', cursor: 'pointer', position: 'relative', background: fRepete ? '#3B82F6' : 'rgba(148,163,184,.25)', flexShrink: 0 }}>
                        <span style={{ position: 'absolute', top: '2px', left: fRepete ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                      </button>
                      <span style={{ fontSize: '13px', color: '#CBD5E1' }}>Repetir todo mês</span>
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className="lbl">Observação (opcional)</label>
                      <input className="inp" type="text" placeholder="Informações adicionais..." value={fObs} onChange={e => setFObs(e.target.value)} />
                    </div>
                  </div>
                  {msg && <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#F87171', marginBottom: '12px' }}>{msg}</div>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={salvarDespesa} disabled={salvando} className="btn-p" style={{ opacity: salvando ? 0.7 : 1 }}>
                      {salvando ? 'Salvando...' : editId ? 'Salvar alterações' : 'Cadastrar despesa'}
                    </button>
                    <button onClick={() => { resetForm(); setShowForm(false) }} className="btn-s">Cancelar</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <Search size={15} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="text" placeholder="Buscar despesa ou categoria..." value={busca} onChange={e => setBusca(e.target.value)}
                    style={{ width: '100%', background: 'rgba(15,23,42,.88)', border: '1.5px solid rgba(148,163,184,.18)', borderRadius: '12px', padding: '11px 16px 11px 42px', fontSize: '13px', color: '#F8FAFC', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as any }} />
                </div>
                {!showForm && (
                  <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-p">
                    <Plus size={15} /> Adicionar despesa
                  </button>
                )}
              </div>

              {despFiltradas.length === 0 ? (
                <div className="crd" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <TrendingDown size={24} color="#F87171" />
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px' }}>Nenhuma despesa em {mesNome(mes)}</p>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', lineHeight: 1.6 }}>Adicione despesas como aluguel, água, luz, internet, produtos ou manutenção.</p>
                  <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-p" style={{ display: 'inline-flex' }}>
                    <Plus size={15} /> Adicionar despesa
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)', borderRadius: '12px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#64748B' }}>{despFiltradas.length} despesa{despFiltradas.length !== 1 ? 's' : ''}</p>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: '#F87171' }}>Total: {fmtBRL(despFiltradas.reduce((a, d) => a + (d.valor || 0), 0))}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {despFiltradas.map(d => (
                      <div key={d.id} className="crd" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>{d.descricao}</p>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                              <span style={{ fontSize: '11px', color: '#94A3B8', background: 'rgba(255,255,255,.05)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(255,255,255,.08)' }}>{d.categoria === 'Outros' ? d.categoria_outros || 'Outros' : d.categoria}</span>
                              <span style={{ fontSize: '11px', color: '#94A3B8', background: 'rgba(255,255,255,.05)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(255,255,255,.08)' }}>{d.tipo_despesa || 'Variável'}</span>
                              {d.forma_pagamento && <span style={{ fontSize: '11px', color: '#94A3B8', background: 'rgba(255,255,255,.05)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(255,255,255,.08)' }}>{d.forma_pagamento}</span>}
                              {d.repetir_mensalmente && <span style={{ fontSize: '11px', color: '#FBBF24', background: 'rgba(245,158,11,.10)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(245,158,11,.22)' }}>Mensal</span>}
                              <span style={{ fontSize: '11px', color: '#64748B' }}>{fmtData(d.data)}</span>
                            </div>
                            {d.observacao && <p style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>{d.observacao}</p>}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                            <p style={{ fontSize: '20px', fontWeight: 800, color: '#F87171', lineHeight: 1 }}>{fmtBRL(d.valor)}</p>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => abrirEditar(d)}
                                style={{ background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.25)', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, color: '#60A5FA', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Pencil size={12} /> Editar
                              </button>
                              <button onClick={() => excluirDespesa(d.id)}
                                style={{ background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.22)', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, color: '#F87171', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Trash2 size={12} /> Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div></div>
      </div>
    </div>
  )
}
