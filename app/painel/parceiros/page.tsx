'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'

const ADMIN_ID = '618aedd1-f174-4419-b4b2-b81b8dd1c47e'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;background:#08060A}
.pg{min-height:100vh;width:100%;max-width:100%;box-sizing:border-box;overflow-x:hidden;background:radial-gradient(circle at top left,rgba(139,92,246,.12),transparent 32%),#120A14}
.bdy{max-width:1200px;margin:0 auto;padding:28px 28px 80px;width:100%}
.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.card{background:linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px;padding:20px}
.inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:12px;padding:11px 14px;color:#F8F4F7;font-size:14px;outline:none;font-family:inherit;transition:border-color .2s}
.inp:focus{border-color:#EC4899;box-shadow:0 0 0 3px rgba(236,72,153,.14)}
.inp::placeholder{color:#B8AAB8}
.lbl{display:block;font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
.btn-p{background:linear-gradient(135deg,#EC4899,#8B5CF6);color:#fff;border:none;border-radius:12px;padding:11px 20px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.btn-s{background:rgba(24,16,27,.88);color:#B8AAB8;border:1px solid #2A1A2F;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s}
.btn-s:hover{border-color:rgba(236,72,153,.32);color:#F8F4F7}
.btn-desativar:hover{border-color:rgba(239,68,68,.35)!important;background:rgba(239,68,68,.08)!important;color:#EF4444!important}
.btn-g{background:rgba(34,197,94,.15);color:#22C55E;border:1px solid rgba(34,197,94,.28);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
.tbl-row{padding:20px;margin-bottom:14px;border:2px solid rgba(236,72,153,.22);border-radius:16px;box-shadow:0 0 0 1px rgba(236,72,153,.08),0 16px 38px rgba(0,0,0,.20);background:rgba(24,16,27,.5)}
.tbl-row:last-child{margin-bottom:0}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:50;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:#18101B;border:1.5px solid #2A1A2F;border-radius:22px;padding:32px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto}
@media(max-width:1023px){
  .psb-main{overflow-x:hidden!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important}
  .pg{width:100%!important;max-width:100%!important;overflow-x:hidden!important}
  .bdy{padding:14px 14px 80px!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important}
  .kpi{grid-template-columns:1fr 1fr!important}
  .btn-p,.btn-s,.btn-g{white-space:normal!important;font-size:11px!important;padding:6px 8px!important}
}
@media(max-width:480px){.kpi{grid-template-columns:1fr}}
`

const TIPOS = ['Influencer', 'Página local', 'Cliente indicador', 'Parceiro comercial', 'Outro']

// Regra comercial: comissao unica de 50% sobre a 1a mensalidade paga (nao recorrente).
// 'essencial' e o nome interno no banco pro plano comercialmente chamado de "Profissional"
// (nao mexemos no banco, so tratamos a exibicao/calculo). Fallback: plano_tipo nulo/vazio/
// invalido sempre vira 'essencial' (Profissional), igual ao comportamento anterior.
const PLANOS_COMISSAO: Record<string, { mensalidade: number; comissao: number; nomeComercial: string }> = {
  minipage: { mensalidade: 29.90, comissao: 14.95, nomeComercial: 'MiniPage' },
  essencial: { mensalidade: 79.90, comissao: 39.95, nomeComercial: 'Profissional' },
  equipe: { mensalidade: 149.90, comissao: 74.95, nomeComercial: 'Equipe' },
}
function planoValido(pt: string | null | undefined) {
  if (pt === 'minipage') return 'minipage'
  if (pt === 'equipe') return 'equipe'
  return 'essencial' // essencial, profissional (se algum dia vier assim), nulo ou qualquer outro -> Profissional
}
function comissaoDoIndicado(ind: any) {
  return PLANOS_COMISSAO[planoValido(ind?.plano_tipo)].comissao
}

export default function Parceiros() {
  const [perfil, setPerfil] = useState<any>(null)
  const [parceiros, setParceiros] = useState<any[]>([])
  const [indicacoes, setIndicacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [aba, setAba] = useState<'parceiros' | 'indicacoes'>('parceiros')

  // Form
  const [nome, setNome] = useState('')
  const [cupom, setCupom] = useState('')
  const [wpp, setWpp] = useState('')
  const [email, setEmail] = useState('')
  const [tipo, setTipo] = useState('Influencer')
  const [ativo, setAtivo] = useState(true)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    if (user.id !== ADMIN_ID) { window.location.href = '/painel'; return }
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
    const { data } = await supabase.from('indicacoes_parceiros').select('*').order('created_at', { ascending: false })
    setIndicacoes(data || [])
  }

  function indicacoesDoParceiro(parceiroId: string) {
    return indicacoes.filter(ind => ind.parceiro_id === parceiroId)
  }

  function resetForm() {
    setNome(''); setCupom(''); setWpp(''); setEmail('')
    setTipo('Influencer'); setAtivo(true); setEditando(null)
  }

  function abrirEditar(p: any) {
    setEditando(p); setNome(p.nome); setCupom(p.cupom); setWpp(p.whatsapp || '')
    setEmail(p.email || ''); setTipo(p.tipo || 'Influencer'); setAtivo(p.ativo)
    setShowModal(true)
  }

  async function salvar() {
    const cupomFmt = cupom.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!nome.trim() || !cupomFmt) { setMsg('Preencha nome e cupom.'); return }
    const payload = { nome: nome.trim(), cupom: cupomFmt, whatsapp: wpp || null, email: email || null, tipo, ativo }
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
    const valor = comissaoDoIndicado(ind)
    await supabase.from('indicacoes_parceiros').update({
      is_pagante: true,
      status: 'pagante',
      comissao_status: 'pendente',
      comissao_valor: valor,
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

  const ehPagante = (ind: any) => ind.is_pagante || ind.status === 'pagante'

  // KPIs (todo o periodo - modelo agora e comissao unica, nao mensal)
  const totalAtivos = parceiros.filter(p => p.ativo).length
  const totalCadastros = indicacoes.length
  const totalPagantes = indicacoes.filter(ehPagante).length
  const totalPendente = indicacoes.filter(i => ehPagante(i) && i.comissao_status !== 'paga').reduce((a, i) => a + comissaoDoIndicado(i), 0)
  const totalPago = indicacoes.filter(i => i.comissao_status === 'paga').reduce((a, i) => a + comissaoDoIndicado(i), 0)

  if (loading) return <div style={{ minHeight: '100vh', background: '#08060A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#B8AAB8' }}>Carregando...</p></div>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar nome={perfil?.nome_negocio || ''} tituloMobile="Parceiros" />

      <div className="psb-main">
        <div className="pg">
          <div className="bdy">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.03em', marginBottom: '4px' }}>Parceiros e indicações</h1>
                <p style={{ fontSize: '13px', color: '#B8AAB8' }}>Acompanhe cadastros, pagantes e comissões dos seus parceiros.</p>
              </div>
              <button className="btn-p" onClick={() => { resetForm(); setShowModal(true) }}>+ Novo parceiro</button>
            </div>

            <p style={{ fontSize: '12px', color: '#C4B5FD', marginBottom: '20px' }}>Comissão: 50% da 1ª mensalidade paga pelo cliente indicado — MiniPage R$14,95 · Profissional R$39,95 · Equipe R$74,95</p>

            {msg && <div style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.28)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#22C55E', marginBottom: '16px' }}>{msg}</div>}

            {/* KPIs */}
            <div className="kpi">
              {[
                { l: 'Parceiros ativos', v: String(totalAtivos), c: '#EC4899', bd: 'rgba(236,72,153,.25)' },
                { l: 'Indicações pagantes', v: `${totalPagantes} de ${totalCadastros}`, c: '#22C55E', bd: 'rgba(34,197,94,.25)' },
                { l: 'Comissão pendente', v: fBRL(totalPendente), c: '#FACC15', bd: 'rgba(250,204,21,.25)' },
                { l: 'Comissão paga', v: fBRL(totalPago), c: '#22C55E', bd: 'rgba(34,197,94,.22)' },
              ].map(k => (
                <div key={k.l} style={{ background: '#18101B', border: `1.5px solid ${k.bd}`, borderRadius: '18px', padding: '18px 16px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '6px' }}>{k.l}</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: k.c }}>{k.v}</p>
                </div>
              ))}
            </div>

            {/* Abas */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {(['parceiros', 'indicacoes'] as const).map(a => (
                <button key={a} onClick={() => setAba(a)}
                  className={aba === a ? '' : 'btn-s'}
                  style={{ padding: '8px 18px', borderRadius: '10px', border: aba === a ? 'none' : undefined, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, background: aba === a ? 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)' : undefined, color: aba === a ? '#fff' : undefined }}>
                  {a === 'parceiros' ? 'Parceiros' : 'Indicações'}
                </button>
              ))}
            </div>

            {/* ABA PARCEIROS */}
            {aba === 'parceiros' && (
              <div>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7' }}>Lista de parceiros</p>
                  <span style={{ fontSize: '12px', color: '#B8AAB8' }}>{parceiros.length} parceiro{parceiros.length !== 1 ? 's' : ''}</span>
                </div>
                {parceiros.length === 0 ? (
                  <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#B8AAB8', marginBottom: '16px' }}>Nenhum parceiro cadastrado ainda.</p>
                    <button className="btn-p" onClick={() => { resetForm(); setShowModal(true) }}>+ Cadastrar primeiro parceiro</button>
                  </div>
                ) : parceiros.map(p => {
                  const inds = indicacoesDoParceiro(p.id)
                  const pags = inds.filter(ehPagante)
                  const pendente = pags.filter(i => i.comissao_status !== 'paga').reduce((a, i) => a + comissaoDoIndicado(i), 0)
                  const pago = inds.filter(i => i.comissao_status === 'paga').reduce((a, i) => a + comissaoDoIndicado(i), 0)

                  return (
                    <div key={p.id} className="tbl-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,rgba(236,72,153,.2),rgba(139,92,246,.2))', border: '1px solid rgba(236,72,153,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#EC4899', flexShrink: 0 }}>
                            {p.nome.charAt(0)}
                          </div>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7', marginBottom: '3px' }}>{p.nome}</p>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#EC4899', background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.28)', padding: '2px 8px', borderRadius: '6px' }}>{p.cupom}</span>
                              <span style={{ fontSize: '11px', color: '#B8AAB8' }}>{p.tipo}</span>
                              <span className="badge" style={{ background: p.ativo ? 'rgba(34,197,94,.14)' : 'rgba(239,68,68,.14)', border: `1px solid ${p.ativo ? 'rgba(34,197,94,.28)' : 'rgba(239,68,68,.28)'}`, color: p.ativo ? '#22C55E' : '#EF4444' }}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {[
                            { l: 'Cadastros', v: String(inds.length), c: '#B8AAB8' },
                            { l: 'Pagantes', v: String(pags.length), c: '#22C55E' },
                            { l: 'Pendente', v: fBRL(pendente), c: '#FACC15' },
                            { l: 'Pago', v: fBRL(pago), c: '#22C55E' },
                          ].map(s => (
                            <div key={s.l} style={{ textAlign: 'center' }}>
                              <p style={{ fontSize: '10px', color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '2px' }}>{s.l}</p>
                              <p style={{ fontSize: '14px', fontWeight: 700, color: s.c }}>{s.v}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button className="btn-s" onClick={() => copiarLink(p.cupom)}>Copiar link</button>
                        <button className="btn-s" onClick={() => abrirEditar(p)}>Editar</button>
                        <button className={p.ativo ? 'btn-s btn-desativar' : 'btn-s'} onClick={() => toggleAtivo(p)}>{p.ativo ? 'Desativar' : 'Ativar'}</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ABA INDICAÇÕES */}
            {aba === 'indicacoes' && (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7', marginBottom: '12px' }}>Clientes indicados</p>
                {indicacoes.length === 0 ? (
                  <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#B8AAB8' }}>Nenhuma indicação registrada ainda.</p>
                  </div>
                ) : indicacoes.map(ind => {
                  const planoTipo = planoValido(ind.plano_tipo)
                  const infoPlano = PLANOS_COMISSAO[planoTipo]
                  const comissao = comissaoDoIndicado(ind)
                  const par = parceiros.find((pc: any) => pc.id === ind.parceiro_id)
                  return (
                    <div key={ind.id} className="tbl-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#F8F4F7', marginBottom: '2px' }}>{ind.nome_negocio || '—'}</p>
                          {ind.nome_responsavel && <p style={{ fontSize: '12px', color: '#B8AAB8', marginBottom: '1px' }}>{ind.nome_responsavel}</p>}
                          <p style={{ fontSize: '12px', color: '#B8AAB8', marginBottom: '6px' }}>{ind.email}</p>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#EC4899', background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.28)', padding: '2px 8px', borderRadius: '6px' }}>{ind.cupom_codigo}</span>
                            {par && <span style={{ fontSize: '11px', color: '#B8AAB8' }}>→ {par.nome}</span>}
                            <span className="badge" style={{ background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.26)', color: '#C4B5FD' }}>Plano {infoPlano.nomeComercial}</span>
                            <span className="badge" style={{ background: ehPagante(ind) ? 'rgba(34,197,94,.12)' : 'rgba(236,72,153,.12)', border: `1px solid ${ehPagante(ind) ? 'rgba(34,197,94,.24)' : 'rgba(236,72,153,.24)'}`, color: ehPagante(ind) ? '#22C55E' : '#EC4899' }}>{ehPagante(ind) ? 'Pagante' : 'Cadastro'}</span>
                            {ehPagante(ind) && (
                              <span className="badge" style={{ background: ind.comissao_status === 'paga' ? 'rgba(34,197,94,.10)' : 'rgba(250,204,21,.12)', border: `1px solid ${ind.comissao_status === 'paga' ? 'rgba(34,197,94,.22)' : 'rgba(250,204,21,.28)'}`, color: ind.comissao_status === 'paga' ? '#22C55E' : '#FACC15' }}>{ind.comissao_status === 'paga' ? 'Comissão paga' : 'Comissão pendente'}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <div style={{ textAlign: 'right' as const }}>
                            <p style={{ fontSize: '11px', color: '#B8AAB8' }}>Mensalidade: <span style={{ color: '#F8F4F7', fontWeight: 600 }}>{fBRL(infoPlano.mensalidade)}</span></p>
                            <p style={{ fontSize: '13px', color: '#EC4899', fontWeight: 800 }}>Comissão: {fBRL(comissao)}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {!ind.is_pagante && (
                              <button className="btn-s" onClick={() => marcarPagante(ind)}>Marcar pagante</button>
                            )}
                            {ind.is_pagante && ind.comissao_status !== 'paga' && (
                              <button className="btn-g" onClick={() => marcarPago(ind)}>Marcar comissão paga</button>
                            )}
                          </div>
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
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#F8F4F7', marginBottom: '20px' }}>{editando ? 'Editar parceiro' : 'Novo parceiro'}</p>
            {msg && <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '12px' }}>{msg}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label className="lbl">Nome do parceiro *</label><input className="inp" type="text" placeholder="Ex: João Barbearia" value={nome} onChange={e => setNome(e.target.value)} /></div>
              <div>
                <label className="lbl">Cupom *</label>
                <input className="inp" type="text" placeholder="Ex: JOAO" value={cupom} onChange={e => setCupom(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
                <p style={{ fontSize: '11px', color: '#B8AAB8', marginTop: '4px' }}>Letras e números, sem espaços.</p>
              </div>
              <div><label className="lbl">WhatsApp</label><input className="inp" type="tel" placeholder="(11) 99999-9999" value={wpp} onChange={e => setWpp(e.target.value)} /></div>
              <div><label className="lbl">E-mail</label><input className="inp" type="email" placeholder="parceiro@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div>
                <label className="lbl">Tipo</label>
                <select className="inp" value={tipo} onChange={e => setTipo(e.target.value)} style={{ cursor: 'pointer' }}>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <p style={{ fontSize: '12px', color: '#B8AAB8', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.20)', borderRadius: '10px', padding: '10px 12px' }}>Comissão: 50% da 1ª mensalidade paga pelo cliente indicado (MiniPage R$14,95 · Profissional R$39,95 · Equipe R$74,95). Regra fixa, aplicada a todos os parceiros.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setAtivo(!ativo)} style={{ width: '36px', height: '20px', borderRadius: '999px', border: 'none', cursor: 'pointer', position: 'relative', background: ativo ? '#EC4899' : '#2A1A2F' }}>
                  <span style={{ position: 'absolute', top: '2px', left: ativo ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                </button>
                <span style={{ fontSize: '13px', color: '#B8AAB8' }}>Parceiro ativo</span>
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
