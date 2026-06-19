'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;background:#050B16}
.pg{min-height:100vh;width:100%;max-width:100%;box-sizing:border-box;overflow-x:hidden;background:radial-gradient(circle at top left,rgba(124,58,237,.12),transparent 32%),#07111F}
.bdy{max-width:1200px;margin:0 auto;padding:28px 28px 80px;width:100%}
.kpi{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}
.card{background:linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:18px;padding:20px}
.inp{width:100%;background:rgba(15,23,42,.92);border:1.5px solid rgba(148,163,184,.18);border-radius:12px;padding:11px 14px;color:#F8FAFC;font-size:14px;outline:none;font-family:inherit;transition:border-color .2s}
.inp:focus{border-color:#3B82F6;box-shadow:0 0 0 3px rgba(59,130,246,.14)}
.inp::placeholder{color:#475569}
.lbl{display:block;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
.btn-p{background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;border:none;border-radius:12px;padding:11px 20px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.18);border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.btn-g{background:rgba(34,197,94,.15);color:#4ADE80;border:1px solid rgba(34,197,94,.28);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
.btn-y{background:rgba(245,158,11,.15);color:#FBBF24;border:1px solid rgba(245,158,11,.28);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
.tbl-row{padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.05);transition:background .15s}
.tbl-row:hover{background:rgba(255,255,255,.03)}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:#0F172A;border:1.5px solid rgba(148,163,184,.18);border-radius:22px;padding:32px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto}
.period-sel{background:rgba(15,23,42,.92);border:1.5px solid rgba(99,102,241,.35);border-radius:12px;padding:10px 16px;color:#F8FAFC;font-size:14px;font-weight:600;outline:none;font-family:inherit;cursor:pointer;transition:border-color .2s}
.period-sel:focus{border-color:#6366F1;box-shadow:0 0 0 3px rgba(99,102,241,.18)}
@media(max-width:1023px){
  .psb-main{overflow-x:hidden!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important}
  .pg{width:100%!important;max-width:100%!important;overflow-x:hidden!important}
  .bdy{padding:14px 14px 80px!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important}
  .kpi{grid-template-columns:1fr 1fr!important}
  .btn-p,.btn-s,.btn-g,.btn-y{white-space:normal!important;font-size:11px!important;padding:6px 8px!important}
}
@media(max-width:480px){.kpi{grid-template-columns:1fr}}
`

const TIPOS = ['Influencer', 'Página local', 'Cliente indicador', 'Parceiro comercial', 'Outro']

function getMesesDisponiveis() {
  const meses = []
  const agora = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    meses.push({
      label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      mes: d.getMonth() + 1,
      ano: d.getFullYear(),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    })
  }
  return meses
}

export default function Parceiros() {
  const [perfil, setPerfil] = useState<any>(null)
  const [parceiros, setParceiros] = useState<any[]>([])
  const [indicacoes, setIndicacoes] = useState<any[]>([])
  const [comissoesMensais, setComissoesMensais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [aba, setAba] = useState<'parceiros'|'indicacoes'>('parceiros')
  const [historicoAberto, setHistoricoAberto] = useState<string|null>(null)

  // Período selecionado
  const mesesOpcoes = getMesesDisponiveis()
  const [periodoKey, setPeriodoKey] = useState(mesesOpcoes[0].key)
  const periodoAtual = mesesOpcoes.find(m => m.key === periodoKey) || mesesOpcoes[0]

  // Form
  const [nome, setNome] = useState('')
  const [cupom, setCupom] = useState('')
  const [wpp, setWpp] = useState('')
  const [email, setEmail] = useState('')
  const [tipo, setTipo] = useState('Influencer')
  const [comissao, setComissao] = useState('0')
  const [ativo, setAtivo] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: p } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()
    setPerfil(p)
    await Promise.all([carregarParceiros(), carregarIndicacoes(), carregarComissoesMensais()])
    setLoading(false)
  }

  async function carregarParceiros() {
    const { data } = await supabase.from('parceiros').select('*').order('created_at', { ascending: false })
    setParceiros(data || [])
  }

  async function carregarIndicacoes() {
    const { data } = await supabase.from('indicacoes_parceiros').select('*').order('created_at', { ascending: false })
    setIndicacoes(data || [])
  }

  async function carregarComissoesMensais() {
    const { data } = await supabase.from('parceiros_comissoes_mensais').select('*').order('ano', { ascending: false }).order('mes', { ascending: false })
    setComissoesMensais(data || [])
  }

  // Filtra indicações por período
  function indicacoesDoPeriodo(parceiroId: string, mes: number, ano: number) {
    return indicacoes.filter(ind => {
      if (ind.parceiro_id !== parceiroId) return false
      const d = new Date(ind.created_at)
      return d.getMonth() + 1 === mes && d.getFullYear() === ano
    })
  }

  function pagantesDoPeriodo(parceiroId: string, mes: number, ano: number) {
    return indicacoes.filter(ind => {
      if (ind.parceiro_id !== parceiroId) return false
      if (!ind.is_pagante && ind.status !== 'pagante') return false
      const d = new Date(ind.data_pagamento || ind.updated_at || ind.created_at)
      return d.getMonth() + 1 === mes && d.getFullYear() === ano
    })
  }

  // Comissão mensal fechada do banco
  function comissaoMensalFechada(parceiroId: string, mes: number, ano: number) {
    return comissoesMensais.find(c => c.parceiro_id === parceiroId && c.mes === mes && c.ano === ano)
  }

  // Histórico de todos os meses de um parceiro
  function historicoMensalParceiro(parceiroId: string, comissaoFixa: number) {
    const mesesComDados = new Set<string>()
    indicacoes.filter(i => i.parceiro_id === parceiroId).forEach(i => {
      const d = new Date(i.created_at)
      mesesComDados.add(`${d.getFullYear()}-${d.getMonth() + 1}`)
    })
    comissoesMensais.filter(c => c.parceiro_id === parceiroId).forEach(c => {
      mesesComDados.add(`${c.ano}-${c.mes}`)
    })

    return Array.from(mesesComDados).map(key => {
      const [ano, mes] = key.split('-').map(Number)
      const cads = indicacoesDoPeriodo(parceiroId, mes, ano)
      const pags = pagantesDoPeriodo(parceiroId, mes, ano)
      const fechado = comissaoMensalFechada(parceiroId, mes, ano)
      const valorComissao = fechado ? fechado.valor_comissao : pags.length * comissaoFixa
      const label = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      return { key, ano, mes, label, cadastros: cads.length, pagantes: pags.length, valorComissao, fechado }
    }).sort((a, b) => b.ano !== a.ano ? b.ano - a.ano : b.mes - a.mes)
  }

  async function fecharComissaoMes(parceiro: any) {
    const { mes, ano, label } = periodoAtual
    const jaFechado = comissaoMensalFechada(parceiro.id, mes, ano)
    if (jaFechado?.status === 'pago') {
      alert(`Comissão de ${label} já foi marcada como paga.`)
      return
    }
    const pags = pagantesDoPeriodo(parceiro.id, mes, ano)
    const cads = indicacoesDoPeriodo(parceiro.id, mes, ano)
    const valor = pags.length * (parceiro.comissao_fixa || 0)
    if (!window.confirm(`Fechar comissão de ${label} para ${parceiro.nome}?\n\n${cads.length} cadastros · ${pags.length} pagantes · ${fBRL(valor)}\n\nIsso marcará como PAGO e não poderá ser duplicado.`)) return

    if (jaFechado) {
      await supabase.from('parceiros_comissoes_mensais').update({
        cadastros: cads.length,
        pagantes: pags.length,
        valor_comissao: valor,
        status: 'pago',
        pago_em: new Date().toISOString(),
      }).eq('id', jaFechado.id)
    } else {
      await supabase.from('parceiros_comissoes_mensais').insert({
        parceiro_id: parceiro.id,
        mes,
        ano,
        mes_referencia: label,
        cadastros: cads.length,
        pagantes: pags.length,
        valor_comissao: valor,
        status: 'pago',
        pago_em: new Date().toISOString(),
      })
    }
    await carregarComissoesMensais()
    setMsg(`Comissão de ${label} para ${parceiro.nome} marcada como paga!`)
    setTimeout(() => setMsg(''), 4000)
  }

  function resetForm() {
    setNome(''); setCupom(''); setWpp(''); setEmail('')
    setTipo('Influencer'); setComissao('0'); setAtivo(true); setEditando(null)
  }

  function abrirEditar(p: any) {
    setEditando(p); setNome(p.nome); setCupom(p.cupom); setWpp(p.whatsapp || '')
    setEmail(p.email || ''); setTipo(p.tipo || 'Influencer')
    setComissao(String(p.comissao_fixa || 0)); setAtivo(p.ativo)
    setShowModal(true)
  }

  async function salvar() {
    const cupomFmt = cupom.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!nome.trim() || !cupomFmt) { setMsg('Preencha nome e cupom.'); return }
    const payload = { nome: nome.trim(), cupom: cupomFmt, whatsapp: wpp || null, email: email || null, tipo, comissao_fixa: parseFloat(comissao) || 0, ativo }
    if (editando) {
      const { error } = await supabase.from('parceiros').update(payload).eq('id', editando.id)
      if (error) { setMsg('Erro: ' + error.message); return }
    } else {
      const { error } = await supabase.from('parceiros').insert(payload)
      if (error) { setMsg('Erro: ' + error.message); return }
    }
    setMsg(''); resetForm(); setShowModal(false); await carregarParceiros()
  }

  async function toggleAtivo(p: any) {
    await supabase.from('parceiros').update({ ativo: !p.ativo }).eq('id', p.id)
    await carregarParceiros()
  }

  async function marcarPago(ind: any) {
    if (!window.confirm('Deseja marcar esta comissão como paga?')) return
    await supabase.from('indicacoes_parceiros').update({ comissao_status: 'paga' }).eq('id', ind.id)
    await carregarIndicacoes()
  }

  async function marcarPagante(ind: any) {
    if (!window.confirm('Marcar como cliente pagante?')) return
    const par = parceiros.find((pc: any) => pc.cupom === ind.cupom_codigo)
    await supabase.from('indicacoes_parceiros').update({
      is_pagante: true,
      status: 'pagante',
      comissao_status: 'pendente',
      comissao_valor: par?.comissao_fixa || 0,
      data_pagamento: new Date().toISOString().split('T')[0],
    }).eq('id', ind.id)
    await carregarIndicacoes()
  }

  function copiarLink(c: string) {
    const url = `${window.location.origin}/cadastro?cupom=${c}`
    navigator.clipboard.writeText(url)
    setMsg('Link copiado!')
    setTimeout(() => setMsg(''), 3000)
  }

  const fBRL = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  // KPIs do período selecionado
  const { mes: mesSel, ano: anoSel } = periodoAtual
  const totalAtivos = parceiros.filter(p => p.ativo).length
  const totalCadsMes = parceiros.reduce((a, p) => a + indicacoesDoPeriodo(p.id, mesSel, anoSel).length, 0)
  const totalPagantesMes = parceiros.reduce((a, p) => a + pagantesDoPeriodo(p.id, mesSel, anoSel).length, 0)
  const totalPendenteMes = parceiros.reduce((a, p) => {
    const fechado = comissaoMensalFechada(p.id, mesSel, anoSel)
    if (fechado?.status === 'pago') return a
    const pags = pagantesDoPeriodo(p.id, mesSel, anoSel).length
    return a + pags * (p.comissao_fixa || 0)
  }, 0)
  const totalPagoMes = comissoesMensais
    .filter(c => c.mes === mesSel && c.ano === anoSel && c.status === 'pago')
    .reduce((a, c) => a + Number(c.valor_comissao || 0), 0)

  if (loading) return <div style={{ minHeight: '100vh', background: '#050B16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#64748B' }}>Carregando...</p></div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050B16', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar nome={perfil?.nome_negocio || ''} tituloMobile="Parceiros" />

      <div className="psb-main">
        <div className="pg">
          <div className="bdy">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '4px' }}>Parceiros e indicações</h1>
                <p style={{ fontSize: '13px', color: '#64748B' }}>Acompanhe cadastros, pagantes e comissões por período.</p>
              </div>
              <button className="btn-p" onClick={() => { resetForm(); setShowModal(true) }}>+ Novo parceiro</button>
            </div>

            {msg && <div style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.28)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#4ADE80', marginBottom: '16px' }}>{msg}</div>}

            {/* Filtro de período */}
            <div style={{ background: 'linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))', border: '1.5px solid rgba(99,102,241,.25)', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <label className="lbl" style={{ color: '#818CF8', marginBottom: '4px' }}>Período</label>
                <select className="period-sel" value={periodoKey} onChange={e => setPeriodoKey(e.target.value)}>
                  {mesesOpcoes.map(m => (
                    <option key={m.key} value={m.key}>{m.label.charAt(0).toUpperCase() + m.label.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', paddingTop: '18px' }}>
                Exibindo dados de <span style={{ color: '#A5B4FC', fontWeight: 700 }}>{periodoAtual.label}</span>
              </div>
            </div>

            {/* KPIs */}
            <div className="kpi">
              {[
                { l: 'Parceiros ativos', v: totalAtivos, c: '#60A5FA', bg: 'rgba(59,130,246,.12)', bd: 'rgba(59,130,246,.25)' },
                { l: 'Cadastros no mês', v: totalCadsMes, c: '#C4B5FD', bg: 'rgba(124,58,237,.12)', bd: 'rgba(124,58,237,.25)' },
                { l: 'Pagantes no mês', v: totalPagantesMes, c: '#4ADE80', bg: 'rgba(34,197,94,.12)', bd: 'rgba(34,197,94,.25)' },
                { l: 'Comissão pendente', v: fBRL(totalPendenteMes), c: '#FBBF24', bg: 'rgba(245,158,11,.12)', bd: 'rgba(245,158,11,.25)' },
                { l: 'Comissão paga', v: fBRL(totalPagoMes), c: '#4ADE80', bg: 'rgba(34,197,94,.10)', bd: 'rgba(34,197,94,.22)' },
              ].map(k => (
                <div key={k.l} style={{ background: k.bg, border: `1.5px solid ${k.bd}`, borderRadius: '18px', padding: '18px 16px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '6px' }}>{k.l}</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: k.c }}>{k.v}</p>
                </div>
              ))}
            </div>

            {/* Abas */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {(['parceiros', 'indicacoes'] as const).map(a => (
                <button key={a} onClick={() => setAba(a)}
                  style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, background: aba === a ? 'linear-gradient(135deg,#3B82F6,#7C3AED)' : 'rgba(255,255,255,.06)', color: aba === a ? '#fff' : '#94A3B8' }}>
                  {a === 'parceiros' ? 'Parceiros' : 'Indicações'}
                </button>
              ))}
            </div>

            {/* ABA PARCEIROS */}
            {aba === 'parceiros' && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>Lista de parceiros</p>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>{parceiros.length} parceiro{parceiros.length !== 1 ? 's' : ''}</span>
                </div>
                {parceiros.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>Nenhum parceiro cadastrado ainda.</p>
                    <button className="btn-p" onClick={() => { resetForm(); setShowModal(true) }}>+ Cadastrar primeiro parceiro</button>
                  </div>
                ) : parceiros.map(p => {
                  const cads = indicacoesDoPeriodo(p.id, mesSel, anoSel)
                  const pags = pagantesDoPeriodo(p.id, mesSel, anoSel)
                  const fechado = comissaoMensalFechada(p.id, mesSel, anoSel)
                  const valorPendente = fechado?.status === 'pago' ? 0 : pags.length * (p.comissao_fixa || 0)
                  const valorPago = fechado?.status === 'pago' ? Number(fechado.valor_comissao || 0) : 0
                  const histAberto = historicoAberto === p.id
                  const hist = histAberto ? historicoMensalParceiro(p.id, p.comissao_fixa || 0) : []

                  return (
                    <div key={p.id} className="tbl-row">
                      {/* Linha principal do parceiro */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,rgba(59,130,246,.2),rgba(124,58,237,.2))', border: '1px solid rgba(59,130,246,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#60A5FA', flexShrink: 0 }}>
                            {p.nome.charAt(0)}
                          </div>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '3px' }}>{p.nome}</p>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#7C3AED', background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.28)', padding: '2px 8px', borderRadius: '6px' }}>{p.cupom}</span>
                              <span style={{ fontSize: '11px', color: '#64748B' }}>{p.tipo}</span>
                              <span className="badge" style={{ background: p.ativo ? 'rgba(34,197,94,.14)' : 'rgba(239,68,68,.14)', border: `1px solid ${p.ativo ? 'rgba(34,197,94,.28)' : 'rgba(239,68,68,.28)'}`, color: p.ativo ? '#4ADE80' : '#F87171' }}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats do período */}
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {[
                            { l: 'Cadastros', v: String(cads.length), c: '#CBD5E1' },
                            { l: 'Pagantes', v: String(pags.length), c: '#4ADE80' },
                            { l: 'Pendente', v: fBRL(valorPendente), c: '#FBBF24' },
                            { l: 'Pago', v: fBRL(valorPago), c: '#4ADE80' },
                            { l: 'Comissão/cliente', v: fBRL(p.comissao_fixa || 0), c: '#A78BFA' },
                          ].map(s => (
                            <div key={s.l} style={{ textAlign: 'center' }}>
                              <p style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '2px' }}>{s.l}</p>
                              <p style={{ fontSize: '14px', fontWeight: 700, color: s.c }}>{s.v}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status do fechamento */}
                      {fechado?.status === 'pago' && (
                        <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.22)', borderRadius: '8px', padding: '7px 12px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#4ADE80', fontWeight: 600 }}>✓ Comissão de {periodoAtual.label} paga em {new Date(fechado.pago_em).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}

                      {/* Botões */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button className="btn-s" onClick={() => copiarLink(p.cupom)}>Copiar link</button>
                        <button className="btn-s" onClick={() => abrirEditar(p)}>Editar</button>
                        <button className="btn-s" onClick={() => toggleAtivo(p)} style={{ color: p.ativo ? '#F87171' : '#4ADE80' }}>{p.ativo ? 'Desativar' : 'Ativar'}</button>
                        <button className="btn-s" style={{ color: '#A5B4FC', borderColor: 'rgba(99,102,241,.28)' }}
                          onClick={() => setHistoricoAberto(histAberto ? null : p.id)}>
                          {histAberto ? '▲ Fechar histórico' : '▼ Histórico mensal'}
                        </button>
                        {pags.length > 0 && fechado?.status !== 'pago' && (
                          <button className="btn-y" onClick={() => fecharComissaoMes(p)}>
                            Fechar comissão de {periodoAtual.label.split(' ')[0]}
                          </button>
                        )}
                      </div>

                      {/* Histórico mensal expandido */}
                      {histAberto && (
                        <div style={{ marginTop: '14px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', overflow: 'hidden' }}>
                          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(99,102,241,.08)' }}>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: '#A5B4FC', textTransform: 'uppercase', letterSpacing: '.06em' }}>Histórico mensal — {p.nome}</p>
                          </div>
                          {hist.length === 0 ? (
                            <p style={{ padding: '16px', fontSize: '13px', color: '#64748B' }}>Nenhum dado histórico encontrado.</p>
                          ) : (
                            <div>
                              {/* Header da tabela */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 80px 110px 110px 90px', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                                {['Mês', 'Cadastros', 'Pagantes', 'Comissão', 'Status', ''].map(h => (
                                  <p key={h} style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</p>
                                ))}
                              </div>
                              {hist.map(h => (
                                <div key={h.key} style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 80px 110px 110px 90px', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.04)', alignItems: 'center' }}>
                                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#CBD5E1', textTransform: 'capitalize' }}>{h.label}</p>
                                  <p style={{ fontSize: '13px', color: '#94A3B8' }}>{h.cadastros}</p>
                                  <p style={{ fontSize: '13px', color: '#4ADE80', fontWeight: 600 }}>{h.pagantes}</p>
                                  <p style={{ fontSize: '13px', color: '#A78BFA', fontWeight: 600 }}>{fBRL(h.valorComissao)}</p>
                                  <div>
                                    {h.fechado?.status === 'pago' ? (
                                      <span className="badge" style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.28)', color: '#4ADE80' }}>Pago</span>
                                    ) : h.pagantes > 0 ? (
                                      <span className="badge" style={{ background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.28)', color: '#FBBF24' }}>Pendente</span>
                                    ) : (
                                      <span className="badge" style={{ background: 'rgba(148,163,184,.08)', border: '1px solid rgba(148,163,184,.14)', color: '#64748B' }}>Sem pagantes</span>
                                    )}
                                  </div>
                                  <div>
                                    {h.pagantes > 0 && h.fechado?.status !== 'pago' && (
                                      <button className="btn-y" style={{ fontSize: '11px', padding: '4px 8px' }}
                                        onClick={async () => {
                                          if (!window.confirm(`Fechar comissão de ${h.label} para ${p.nome}?\n\n${h.pagantes} pagantes · ${fBRL(h.valorComissao)}`)) return
                                          if (h.fechado) {
                                            await supabase.from('parceiros_comissoes_mensais').update({ status: 'pago', pago_em: new Date().toISOString(), valor_comissao: h.valorComissao, pagantes: h.pagantes, cadastros: h.cadastros }).eq('id', h.fechado.id)
                                          } else {
                                            await supabase.from('parceiros_comissoes_mensais').insert({ parceiro_id: p.id, mes: h.mes, ano: h.ano, mes_referencia: h.label, cadastros: h.cadastros, pagantes: h.pagantes, valor_comissao: h.valorComissao, status: 'pago', pago_em: new Date().toISOString() })
                                          }
                                          await carregarComissoesMensais()
                                          setMsg(`Comissão de ${h.label} marcada como paga!`)
                                          setTimeout(() => setMsg(''), 3000)
                                        }}>
                                        Pagar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ABA INDICAÇÕES */}
            {aba === 'indicacoes' && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>Clientes indicados — {periodoAtual.label}</p>
                </div>
                {(() => {
                  const indsMes = indicacoes.filter(ind => {
                    const d = new Date(ind.created_at)
                    return d.getMonth() + 1 === mesSel && d.getFullYear() === anoSel
                  })
                  if (indsMes.length === 0) return (
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', color: '#64748B' }}>Nenhuma indicação em {periodoAtual.label}.</p>
                    </div>
                  )
                  return indsMes.map(ind => (
                    <div key={ind.id} className="tbl-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', marginBottom: '2px' }}>{ind.nome_negocio || '—'}</p>
                          {ind.nome_responsavel && <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '1px' }}>{ind.nome_responsavel}</p>}
                          <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>{ind.email}</p>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#7C3AED', background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.28)', padding: '2px 8px', borderRadius: '6px' }}>{ind.cupom_codigo}</span>
                            {(() => { const par = parceiros.find((pc: any) => pc.id === ind.parceiro_id); return par ? <span style={{ fontSize: '11px', color: '#94A3B8' }}>→ {par.nome}</span> : null })()}
                            <span className="badge" style={{ background: ind.status === 'pagante' ? 'rgba(34,197,94,.12)' : 'rgba(59,130,246,.12)', border: `1px solid ${ind.status === 'pagante' ? 'rgba(34,197,94,.24)' : 'rgba(59,130,246,.24)'}`, color: ind.status === 'pagante' ? '#4ADE80' : '#60A5FA' }}>{ind.status || 'cadastrado'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {!ind.is_pagante && (
                            <button className="btn-s" onClick={() => marcarPagante(ind)}>Marcar pagante</button>
                          )}
                          {ind.is_pagante && ind.comissao_status !== 'paga' && (
                            <button className="btn-g" onClick={() => marcarPago(ind)}>Comissão paga</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-bg" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginBottom: '20px' }}>{editando ? 'Editar parceiro' : 'Novo parceiro'}</p>
            {msg && <p style={{ fontSize: '13px', color: '#F87171', marginBottom: '12px' }}>{msg}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label className="lbl">Nome do parceiro *</label><input className="inp" type="text" placeholder="Ex: João Barbearia" value={nome} onChange={e => setNome(e.target.value)} /></div>
              <div>
                <label className="lbl">Cupom *</label>
                <input className="inp" type="text" placeholder="Ex: JOAO" value={cupom} onChange={e => setCupom(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
                <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>Letras e números, sem espaços.</p>
              </div>
              <div><label className="lbl">WhatsApp</label><input className="inp" type="tel" placeholder="(11) 99999-9999" value={wpp} onChange={e => setWpp(e.target.value)} /></div>
              <div><label className="lbl">E-mail</label><input className="inp" type="email" placeholder="parceiro@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div>
                <label className="lbl">Tipo</label>
                <select className="inp" value={tipo} onChange={e => setTipo(e.target.value)} style={{ cursor: 'pointer' }}>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="lbl">Comissão por cliente pagante (R$)</label><input className="inp" type="number" min="0" step="0.01" placeholder="0,00" value={comissao} onChange={e => setComissao(e.target.value)} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setAtivo(!ativo)} style={{ width: '36px', height: '20px', borderRadius: '999px', border: 'none', cursor: 'pointer', position: 'relative', background: ativo ? '#3B82F6' : '#374151' }}>
                  <span style={{ position: 'absolute', top: '2px', left: ativo ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                </button>
                <span style={{ fontSize: '13px', color: '#CBD5E1' }}>Parceiro ativo</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-s" onClick={() => { setShowModal(false); resetForm() }} style={{ flex: 1 }}>Cancelar</button>
                <button className="btn-p" onClick={salvar} style={{ flex: 2 }}>Salvar parceiro</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
