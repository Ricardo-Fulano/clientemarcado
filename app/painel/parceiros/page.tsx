'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'
import { normalizarPlano, obterNomePlano, obterPrecoPlano } from '../../lib/planos'

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
  .resumo-plano-grid{grid-template-columns:1fr!important}
  .modal{padding:20px!important}
}
@media(max-width:480px){.kpi{grid-template-columns:1fr}}
`

const TIPOS = ['Influencer', 'Página local', 'Cliente indicador', 'Parceiro comercial', 'Outro']

// Regra comercial: comissao unica de 50% sobre a 1a mensalidade paga (nao recorrente).
// 'essencial' e o nome interno no banco pro plano comercialmente chamado de "Profissional"
// (nao mexemos no banco, so tratamos a exibicao/calculo). Fallback: plano_tipo nulo/vazio/
// invalido sempre vira 'essencial' (Profissional), igual ao comportamento anterior.
// Comissao = 50% da 1a mensalidade paga pelo cliente indicado. Calculada dinamicamente a
// partir do preco REAL e atual de cada plano (app/lib/planos.ts) - antes esses valores
// estavam duplicados aqui com o preco antigo do MiniPage (R$29,90), o que deixava a
// comissao do MiniPage desatualizada mesmo depois do preco real ja ter mudado pra R$39,90.
function infoDoPlano(chave: 'minipage' | 'essencial' | 'equipe') {
  const mensalidade = obterPrecoPlano(chave)
  return { mensalidade, comissao: mensalidade * 0.5, nomeComercial: obterNomePlano(chave) }
}
function comissaoDoIndicado(ind: any) {
  return infoDoPlano(normalizarPlano(ind?.plano_tipo)).comissao
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
  const [verDetalhes, setVerDetalhes] = useState<any>(null)
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje'|'semana'|'mes'|'mes_passado'|'tudo'|'personalizado'>('tudo')
  const [dataIni, setDataIni] = useState('')
  const [dataFim, setDataFim] = useState('')
  // Filtros da aba geral "Indicações" (separados dos filtros do modal de detalhes por parceiro)
  const [filtroParceiroId, setFiltroParceiroId] = useState('')
  const [filtroPlano, setFiltroPlano] = useState('')
  const [filtroPeriodoGeral, setFiltroPeriodoGeral] = useState<'hoje'|'semana'|'mes'|'mes_passado'|'tudo'|'personalizado'>('tudo')
  const [dataIniGeral, setDataIniGeral] = useState('')
  const [dataFimGeral, setDataFimGeral] = useState('')

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

  // Calcula o intervalo [inicio, fim] de datas pro filtro escolhido. 'tudo' devolve null
  // (sem filtro nenhum, todas as indicacoes entram). Parametrizada pra servir tanto o modal
  // de detalhes do parceiro quanto os filtros da aba geral "Indicações", sem duplicar logica.
  function calcularIntervalo(periodo: string, ini: string, fim: string): { inicio: Date; fim: Date } | null {
    const agora = new Date()
    const hojeInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0)
    const hojeFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59)
    if (periodo === 'hoje') return { inicio: hojeInicio, fim: hojeFim }
    if (periodo === 'semana') {
      const diaSemana = agora.getDay()
      const inicioSemana = new Date(hojeInicio)
      inicioSemana.setDate(hojeInicio.getDate() - diaSemana)
      return { inicio: inicioSemana, fim: hojeFim }
    }
    if (periodo === 'mes') {
      return { inicio: new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0), fim: hojeFim }
    }
    if (periodo === 'mes_passado') {
      return {
        inicio: new Date(agora.getFullYear(), agora.getMonth() - 1, 1, 0, 0, 0),
        fim: new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59),
      }
    }
    if (periodo === 'personalizado' && ini && fim) {
      const [ai, am, ad] = ini.split('-').map(Number)
      const [bi, bm, bd] = fim.split('-').map(Number)
      return { inicio: new Date(ai, am - 1, ad, 0, 0, 0), fim: new Date(bi, bm - 1, bd, 23, 59, 59) }
    }
    return null // 'tudo' ou personalizado incompleto
  }
  function intervaloDoFiltro(): { inicio: Date; fim: Date } | null {
    return calcularIntervalo(filtroPeriodo, dataIni, dataFim)
  }

  function indicacoesNoPeriodo(lista: any[]) {
    const intervalo = intervaloDoFiltro()
    if (!intervalo) return lista
    return lista.filter(ind => {
      if (!ind.created_at) return false
      const d = new Date(ind.created_at)
      return d >= intervalo.inicio && d <= intervalo.fim
    })
  }

  // Resumo por plano (cadastros/pagantes/comissao), usado dentro do modal de detalhes.
  // Indicacoes SEM plano_tipo definido ficam de fora dos 3 grupos comerciais (senao o
  // fallback de planoValido as contaria erradamente como "Profissional").
  function resumoPorPlano(inds: any[]) {
    const comPlanoDefinido = inds.filter(i => i.plano_tipo !== null && i.plano_tipo !== undefined && i.plano_tipo !== '')
    const chaves = ['minipage', 'essencial', 'equipe'] as const
    return chaves.map(chave => {
      const doPlano = comPlanoDefinido.filter(i => normalizarPlano(i.plano_tipo) === chave)
      const pagantesDoPlano = doPlano.filter(ehPagante)
      const comissao = pagantesDoPlano.reduce((a, i) => a + comissaoDoIndicado(i), 0)
      return { chave, nome: infoDoPlano(chave).nomeComercial, cadastros: doPlano.length, pagantes: pagantesDoPlano.length, comissao }
    })
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

  function copiarPainelParceiro(c: string) {
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const url = `${base}/parceiro/${c}`
    navigator.clipboard.writeText(url)
    setMsg('Link do painel do parceiro copiado!')
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

            <p style={{ fontSize: '12px', color: '#C4B5FD', marginBottom: '20px' }}>Comissão: 50% da 1ª mensalidade paga pelo cliente indicado — MiniPage {fBRL(infoDoPlano('minipage').comissao)} · Profissional {fBRL(infoDoPlano('essencial').comissao)} · Equipe {fBRL(infoDoPlano('equipe').comissao)}</p>

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
                        <button className="btn-s" onClick={() => { setVerDetalhes(p); setFiltroPeriodo('tudo') }}>Ver detalhes</button>
                        <button className="btn-s" onClick={() => copiarLink(p.cupom)}>Copiar link</button>
                        <button className="btn-s" onClick={() => copiarPainelParceiro(p.cupom)}>Copiar painel do parceiro</button>
                        <button className="btn-s" onClick={() => abrirEditar(p)}>Editar</button>
                        <button className={p.ativo ? 'btn-s btn-desativar' : 'btn-s'} onClick={() => toggleAtivo(p)}>{p.ativo ? 'Desativar' : 'Ativar'}</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ABA INDICAÇÕES */}
            {aba === 'indicacoes' && (() => {
              const intervaloGeral = calcularIntervalo(filtroPeriodoGeral, dataIniGeral, dataFimGeral)
              const indicacoesFiltradas = indicacoes.filter(ind => {
                if (filtroParceiroId && ind.parceiro_id !== filtroParceiroId) return false
                if (filtroPlano && normalizarPlano(ind.plano_tipo) !== filtroPlano) return false
                if (intervaloGeral) {
                  if (!ind.created_at) return false
                  const d = new Date(ind.created_at)
                  if (d < intervaloGeral.inicio || d > intervaloGeral.fim) return false
                }
                return true
              })
              return (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7', marginBottom: '12px' }}>Clientes indicados</p>

                {/* Filtros da aba geral */}
                <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                  <div className="fg2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label className="lbl">Parceiro</label>
                      <select className="inp" style={{ cursor: 'pointer' }} value={filtroParceiroId} onChange={e => setFiltroParceiroId(e.target.value)}>
                        <option value="">Todos os parceiros</option>
                        {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.cupom})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="lbl">Plano</label>
                      <select className="inp" style={{ cursor: 'pointer' }} value={filtroPlano} onChange={e => setFiltroPlano(e.target.value)}>
                        <option value="">Todos os planos</option>
                        <option value="minipage">MiniPage</option>
                        <option value="essencial">Profissional</option>
                        <option value="equipe">Equipe</option>
                      </select>
                    </div>
                  </div>
                  <label className="lbl">Período</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: filtroPeriodoGeral === 'personalizado' ? '10px' : 0 }}>
                    {([['hoje', 'Hoje'], ['semana', 'Esta semana'], ['mes', 'Este mês'], ['mes_passado', 'Mês passado'], ['tudo', 'Todo período'], ['personalizado', 'Personalizado']] as const).map(([v, l]) => (
                      <button key={v} onClick={() => setFiltroPeriodoGeral(v)} style={{ padding: '6px 12px', borderRadius: '8px', border: filtroPeriodoGeral === v ? 'none' : '1px solid #2A1A2F', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, background: filtroPeriodoGeral === v ? 'linear-gradient(135deg,#EC4899,#8B5CF6)' : 'rgba(24,16,27,.88)', color: filtroPeriodoGeral === v ? '#fff' : '#B8AAB8' }}>{l}</button>
                    ))}
                  </div>
                  {filtroPeriodoGeral === 'personalizado' && (
                    <div className="fg2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div><label className="lbl">De</label><input type="date" className="inp" value={dataIniGeral} onChange={e => setDataIniGeral(e.target.value)} /></div>
                      <div><label className="lbl">Até</label><input type="date" className="inp" value={dataFimGeral} onChange={e => setDataFimGeral(e.target.value)} /></div>
                    </div>
                  )}
                </div>

                {indicacoesFiltradas.length === 0 ? (
                  <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#B8AAB8' }}>{indicacoes.length === 0 ? 'Nenhuma indicação registrada ainda.' : 'Nenhuma indicação encontrada com esses filtros.'}</p>
                  </div>
                ) : indicacoesFiltradas.map(ind => {
                  const planoTipo = normalizarPlano(ind.plano_tipo)
                  const infoPlano = infoDoPlano(planoTipo)
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
              )
            })()}

          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES DO PARCEIRO */}
      {verDetalhes && (() => {
        const todasDoParceiro = indicacoesDoParceiro(verDetalhes.id)
        const indsFiltradas = indicacoesNoPeriodo(todasDoParceiro)
        const pagsFiltradas = indsFiltradas.filter(ehPagante)
        const pendenteFiltrado = pagsFiltradas.filter(i => i.comissao_status !== 'paga').reduce((a, i) => a + comissaoDoIndicado(i), 0)
        const pagoFiltrado = indsFiltradas.filter(i => i.comissao_status === 'paga').reduce((a, i) => a + comissaoDoIndicado(i), 0)
        const resumo = resumoPorPlano(indsFiltradas)

        return (
          <div className="modal-bg" onClick={() => setVerDetalhes(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '760px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px' }}>
                <div>
                  <p style={{ fontSize: '19px', fontWeight: 800, color: '#F8F4F7', marginBottom: '4px' }}>{verDetalhes.nome}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#EC4899', background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.28)', padding: '2px 8px', borderRadius: '6px' }}>{verDetalhes.cupom}</span>
                    <span style={{ fontSize: '11px', color: '#B8AAB8' }}>{verDetalhes.tipo}</span>
                    <span className="badge" style={{ background: verDetalhes.ativo ? 'rgba(34,197,94,.14)' : 'rgba(239,68,68,.14)', border: `1px solid ${verDetalhes.ativo ? 'rgba(34,197,94,.28)' : 'rgba(239,68,68,.28)'}`, color: verDetalhes.ativo ? '#22C55E' : '#EF4444' }}>{verDetalhes.ativo ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>
                <button className="btn-s" onClick={() => setVerDetalhes(null)} style={{ flexShrink: 0 }}>Fechar</button>
              </div>

              {/* Filtro de periodo */}
              <div style={{ marginTop: '18px', marginBottom: '16px' }}>
                <label className="lbl">Período</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: dataIni || filtroPeriodo === 'personalizado' ? '10px' : 0 }}>
                  {([['hoje', 'Hoje'], ['semana', 'Esta semana'], ['mes', 'Este mês'], ['mes_passado', 'Mês passado'], ['tudo', 'Todo período'], ['personalizado', 'Personalizado']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setFiltroPeriodo(v)} style={{ padding: '6px 12px', borderRadius: '8px', border: filtroPeriodo === v ? 'none' : '1px solid #2A1A2F', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, background: filtroPeriodo === v ? 'linear-gradient(135deg,#EC4899,#8B5CF6)' : 'rgba(24,16,27,.88)', color: filtroPeriodo === v ? '#fff' : '#B8AAB8' }}>{l}</button>
                  ))}
                </div>
                {filtroPeriodo === 'personalizado' && (
                  <div className="fg2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><label className="lbl">De</label><input type="date" className="inp" value={dataIni} onChange={e => setDataIni(e.target.value)} /></div>
                    <div><label className="lbl">Até</label><input type="date" className="inp" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
                  </div>
                )}
              </div>

              {/* KPIs filtrados */}
              <div className="kpi" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '18px' }}>
                {[
                  { l: 'Cadastros', v: String(indsFiltradas.length), c: '#B8AAB8' },
                  { l: 'Pagantes', v: String(pagsFiltradas.length), c: '#22C55E' },
                  { l: 'Comissão pendente', v: fBRL(pendenteFiltrado), c: '#FACC15' },
                  { l: 'Comissão paga', v: fBRL(pagoFiltrado), c: '#22C55E' },
                ].map(k => (
                  <div key={k.l} style={{ background: '#18101B', border: '1.5px solid #2A1A2F', borderRadius: '14px', padding: '12px 10px' }}>
                    <p style={{ fontSize: '9px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>{k.l}</p>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: k.c }}>{k.v}</p>
                  </div>
                ))}
              </div>

              {/* Resumo por plano */}
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '10px' }}>Resumo por plano</p>
              <div className="resumo-plano-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '22px' }}>
                {resumo.map(r => (
                  <div key={r.chave} style={{ background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.20)', borderRadius: '12px', padding: '12px 10px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#C4B5FD', marginBottom: '8px' }}>{r.nome}</p>
                    <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '2px' }}>Cadastros: <span style={{ color: '#F8F4F7', fontWeight: 700 }}>{r.cadastros}</span></p>
                    <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '2px' }}>Pagantes: <span style={{ color: '#22C55E', fontWeight: 700 }}>{r.pagantes}</span></p>
                    <p style={{ fontSize: '11px', color: '#B8AAB8' }}>Comissão: <span style={{ color: '#EC4899', fontWeight: 700 }}>{fBRL(r.comissao)}</span></p>
                  </div>
                ))}
              </div>

              {/* Lista de indicacoes (mesmo padrao visual de card empilhado da aba Indicacoes - ja responsivo por natureza) */}
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '10px' }}>Indicações no período ({indsFiltradas.length})</p>
              {indsFiltradas.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#B8AAB8', padding: '16px 0', textAlign: 'center' }}>Nenhuma indicação neste período.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {indsFiltradas.map(ind => {
                    const infoPlano = infoDoPlano(normalizarPlano(ind.plano_tipo))
                    const temPlanoDefinido = ind.plano_tipo !== null && ind.plano_tipo !== undefined && ind.plano_tipo !== ''
                    const comissao = temPlanoDefinido ? comissaoDoIndicado(ind) : 0
                    return (
                      <div key={ind.id} style={{ padding: '14px', border: '1px solid #2A1A2F', borderRadius: '12px', background: 'rgba(24,16,27,.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '2px' }}>{ind.nome_negocio || ind.nome_responsavel || '—'}</p>
                            {ind.slug && <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '1px' }}>minipage.pro/{ind.slug}</p>}
                            {ind.email && <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '6px' }}>{ind.email}</p>}
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              <span className="badge" style={{ background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.26)', color: '#C4B5FD' }}>{temPlanoDefinido ? infoPlano.nomeComercial : 'Não definido'}</span>
                              <span className="badge" style={{ background: ehPagante(ind) ? 'rgba(34,197,94,.12)' : 'rgba(236,72,153,.12)', border: `1px solid ${ehPagante(ind) ? 'rgba(34,197,94,.24)' : 'rgba(236,72,153,.24)'}`, color: ehPagante(ind) ? '#22C55E' : '#EC4899' }}>{ehPagante(ind) ? 'Pagante' : 'Cadastro'}</span>
                              {ind.status_acesso && <span className="badge" style={{ background: 'rgba(148,163,184,.12)', border: '1px solid rgba(148,163,184,.24)', color: '#94A3B8' }}>{ind.status_acesso}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                            <p style={{ fontSize: '10px', color: '#B8AAB8', marginBottom: '2px' }}>{ind.created_at ? new Date(ind.created_at).toLocaleDateString('pt-BR') : '—'}</p>
                            {ind.data_pagamento && <p style={{ fontSize: '10px', color: '#B8AAB8', marginBottom: '4px' }}>1º pgto: {new Date(ind.data_pagamento).toLocaleDateString('pt-BR')}</p>}
                            <p style={{ fontSize: '13px', color: '#EC4899', fontWeight: 800 }}>{fBRL(comissao)}</p>
                            {ehPagante(ind) && <p style={{ fontSize: '10px', color: ind.comissao_status === 'paga' ? '#22C55E' : '#FACC15' }}>{ind.comissao_status === 'paga' ? 'Paga' : 'Pendente'}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })()}

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
              <p style={{ fontSize: '12px', color: '#B8AAB8', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.20)', borderRadius: '10px', padding: '10px 12px' }}>Comissão: 50% da 1ª mensalidade paga pelo cliente indicado (MiniPage {fBRL(infoDoPlano('minipage').comissao)} · Profissional {fBRL(infoDoPlano('essencial').comissao)} · Equipe {fBRL(infoDoPlano('equipe').comissao)}). Regra fixa, aplicada a todos os parceiros.</p>
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
