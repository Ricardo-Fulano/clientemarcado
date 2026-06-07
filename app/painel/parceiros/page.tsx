'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;background:#050B16}
.pg{min-height:100vh;background:radial-gradient(circle at top left,rgba(124,58,237,.12),transparent 32%),#07111F}
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
.tbl-row{display:grid;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.05);align-items:center;transition:background .15s}
.tbl-row:hover{background:rgba(255,255,255,.03)}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:#0F172A;border:1.5px solid rgba(148,163,184,.18);border-radius:22px;padding:32px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto}
@media(max-width:1023px){.bdy{padding:14px 14px 80px!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important}.kpi{grid-template-columns:1fr 1fr!important}.btn-p,.btn-s,.btn-g{white-space:normal!important;font-size:11px!important;padding:6px 8px!important}}
@media(max-width:480px){.kpi{grid-template-columns:1fr}}
`

const TIPOS = ['Influencer', 'Página local', 'Cliente indicador', 'Parceiro comercial', 'Outro']

export default function Parceiros() {
  const [perfil, setPerfil] = useState<any>(null)
  const [parceiros, setParceiros] = useState<any[]>([])
  const [indicacoes, setIndicacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [aba, setAba] = useState<'parceiros'|'indicacoes'>('parceiros')

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
    await Promise.all([carregarParceiros(), carregarIndicacoes()])
    setLoading(false)
  }

  async function carregarParceiros() {
    const { data } = await supabase.from('parceiros').select('*').order('created_at', { ascending: false })
    setParceiros(data || [])
  }

  async function carregarIndicacoes() {
    const { data } = await supabase.from('perfis')
      .select('*, parceiros(nome,cupom)')
      .not('cupom_indicacao', 'is', null)
      .order('created_at', { ascending: false })
    setIndicacoes(data || [])
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
    await supabase.from('perfis').update({ comissao_status: 'paga' }).eq('id', ind.id)
    await carregarIndicacoes()
  }

  async function marcarPagante(ind: any) {
    if (!window.confirm('Marcar como cliente pagante?')) return
    await supabase.from('perfis').update({
      primeiro_pagamento_confirmado: true,
      data_primeiro_pagamento: new Date().toISOString(),
      indicacao_status: 'convertido',
      comissao_status: 'pendente',
    }).eq('id', ind.id)
    await carregarIndicacoes()
  }

  function copiarLink(c: string) {
    const url = `${window.location.origin}/cadastro?cupom=${c}`
    navigator.clipboard.writeText(url)
    setMsg('Link copiado: ' + url)
    setTimeout(() => setMsg(''), 4000)
  }

  const totalAtivos = parceiros.filter(p => p.ativo).length
  const totalCupons = indicacoes.length
  const totalConvertidos = indicacoes.filter(i => i.indicacao_status === 'convertido').length
  const totalPendente = indicacoes.filter(i => i.comissao_status === 'pendente').reduce((a, i) => {
    const par = parceiros.find(p => p.cupom === i.cupom_indicacao)
    return a + (par?.comissao_fixa || 0)
  }, 0)
  const totalPaga = indicacoes.filter(i => i.comissao_status === 'paga').reduce((a, i) => {
    const par = parceiros.find(p => p.cupom === i.cupom_indicacao)
    return a + (par?.comissao_fixa || 0)
  }, 0)

  const fBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  if (loading) return <div style={{ minHeight: '100vh', background: '#050B16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#64748B' }}>Carregando...</p></div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050B16', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar nome={perfil?.nome_negocio || ''} tituloMobile="Parceiros" />

      <div className="psb-main">
        <div className="pg">
          <div className="bdy">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '4px' }}>Parceiros e indicações</h1>
                <p style={{ fontSize: '13px', color: '#64748B' }}>Acompanhe quais parceiros trouxeram clientes pagantes.</p>
              </div>
              <button className="btn-p" onClick={() => { resetForm(); setShowModal(true) }}>+ Novo parceiro</button>
            </div>

            {msg && <div style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.28)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#4ADE80', marginBottom: '16px' }}>{msg}</div>}

            {/* KPIs */}
            <div className="kpi">
              {[
                { l: 'Parceiros ativos', v: totalAtivos, c: '#60A5FA', ico: '🤝' },
                { l: 'Cadastros com cupom', v: totalCupons, c: '#C4B5FD', ico: '🎟' },
                { l: 'Clientes pagantes', v: totalConvertidos, c: '#4ADE80', ico: '✅' },
                { l: 'Comissão pendente', v: fBRL(totalPendente), c: '#FBBF24', ico: '⏳' },
                { l: 'Comissão paga', v: fBRL(totalPaga), c: '#4ADE80', ico: '💰' },
              ].map(k => (
                <div key={k.l} className="card">
                  <p style={{ fontSize: '20px', marginBottom: '8px' }}>{k.ico}</p>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>{k.l}</p>
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
                ) : parceiros.map((p, i) => {
                  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/cadastro?cupom=${p.cupom}`
                  const clientes = indicacoes.filter(ind => ind.cupom_indicacao === p.cupom).length
                  const pagantes = indicacoes.filter(ind => ind.cupom_indicacao === p.cupom && ind.primeiro_pagamento_confirmado).length
                  const pendente = indicacoes.filter(ind => ind.cupom_indicacao === p.cupom && ind.comissao_status === 'pendente').length * (p.comissao_fixa || 0)
                  const paga = indicacoes.filter(ind => ind.cupom_indicacao === p.cupom && ind.comissao_status === 'paga').length * (p.comissao_fixa || 0)
                  return (
                    <div key={p.id} className="tbl-row" style={{ gridTemplateColumns: '1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,rgba(59,130,246,.2),rgba(124,58,237,.2))', border: '1px solid rgba(59,130,246,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#60A5FA', flexShrink: 0 }}>
                            {p.nome.charAt(0)}
                          </div>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '2px' }}>{p.nome}</p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#7C3AED', background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.28)', padding: '2px 8px', borderRadius: '6px' }}>{p.cupom}</span>
                              <span style={{ fontSize: '11px', color: '#64748B' }}>{p.tipo}</span>
                              <span className="badge" style={{ background: p.ativo ? 'rgba(34,197,94,.14)' : 'rgba(239,68,68,.14)', border: `1px solid ${p.ativo ? 'rgba(34,197,94,.28)' : 'rgba(239,68,68,.28)'}`, color: p.ativo ? '#4ADE80' : '#F87171' }}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                          {[
                            { l: 'Cadastros', v: clientes, c: '#CBD5E1' },
                            { l: 'Pagantes', v: pagantes, c: '#4ADE80' },
                            { l: 'Pendente', v: fBRL(pendente), c: '#FBBF24' },
                            { l: 'Pago', v: fBRL(paga), c: '#4ADE80' },
                            { l: 'Comissão', v: fBRL(p.comissao_fixa), c: '#A78BFA' },
                          ].map(s => (
                            <div key={s.l} style={{ textAlign: 'center' }}>
                              <p style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '2px' }}>{s.l}</p>
                              <p style={{ fontSize: '14px', fontWeight: 700, color: s.c }}>{s.v}</p>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button className="btn-s" onClick={() => copiarLink(p.cupom)}>📋 Copiar link</button>
                          <button className="btn-s" onClick={() => abrirEditar(p)}>✏️ Editar</button>
                          <button className="btn-s" onClick={() => toggleAtivo(p)} style={{ color: p.ativo ? '#F87171' : '#4ADE80' }}>{p.ativo ? 'Desativar' : 'Ativar'}</button>
                        </div>
                      </div>
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,.04)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#475569' }}>Link:</span>
                        <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', wordBreak: 'break-all', overflowWrap: 'break-word', maxWidth: '100%' }}>{link}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ABA INDICAÇÕES */}
            {aba === 'indicacoes' && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>Clientes indicados</p>
                </div>
                {indicacoes.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#64748B' }}>Nenhuma indicação registrada ainda.</p>
                  </div>
                ) : indicacoes.map(ind => {
                  const par = parceiros.find(p => p.cupom === ind.cupom_indicacao)
                  const statusCor: Record<string, string> = { convertido: '#4ADE80', pendente: '#FBBF24', sem_cupom: '#64748B' }
                  const comCor: Record<string, string> = { paga: '#4ADE80', pendente: '#FBBF24', nao_aplicavel: '#64748B' }
                  return (
                    <div key={ind.id} className="tbl-row" style={{ gridTemplateColumns: '1fr' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', marginBottom: '2px' }}>{ind.nome_negocio || '—'}</p>
                          <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>{ind.email}</p>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#7C3AED', background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.28)', padding: '2px 8px', borderRadius: '6px' }}>{ind.cupom_indicacao}</span>
                            {par && <span style={{ fontSize: '11px', color: '#94A3B8' }}>→ {par.nome}</span>}
                            <span className="badge" style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.24)', color: statusCor[ind.indicacao_status] || '#64748B' }}>{ind.indicacao_status}</span>
                            <span className="badge" style={{ background: 'rgba(245,158,11,.10)', border: '1px solid rgba(245,158,11,.22)', color: comCor[ind.comissao_status] || '#64748B' }}>Comissão: {ind.comissao_status}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {!ind.primeiro_pagamento_confirmado && (
                            <button className="btn-s" onClick={() => marcarPagante(ind)}>✅ Marcar pagante</button>
                          )}
                          {ind.comissao_status === 'pendente' && (
                            <button className="btn-g" onClick={() => marcarPago(ind)}>💰 Marcar pago</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
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
                <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>Letras e números, sem espaços. Será salvo em maiúsculas.</p>
              </div>
              <div><label className="lbl">WhatsApp</label><input className="inp" type="tel" placeholder="(11) 99999-9999" value={wpp} onChange={e => setWpp(e.target.value)} /></div>
              <div><label className="lbl">E-mail</label><input className="inp" type="email" placeholder="parceiro@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div>
                <label className="lbl">Tipo</label>
                <select className="inp" value={tipo} onChange={e => setTipo(e.target.value)} style={{ cursor: 'pointer' }}>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="lbl">Comissão fixa (R$)</label><input className="inp" type="number" min="0" step="0.01" placeholder="0,00" value={comissao} onChange={e => setComissao(e.target.value)} /></div>
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
