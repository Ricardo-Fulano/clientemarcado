'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const WppIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroProf, setFiltroProf] = useState('todos')
  const [visao, setVisao] = useState<'lista' | 'semana'>('lista')
  const [semanaBase, setSemanaBase] = useState(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const domingo = new Date(hoje)
    domingo.setDate(hoje.getDate() - hoje.getDay())
    return domingo
  })

  useEffect(() => { carregarAgendamentos() }, [])

  async function carregarAgendamentos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data: p } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()
    setPerfil(p)

    const { data: profs } = await supabase.from('profissionais').select('id, nome').eq('user_id', user.id).order('nome')
    setProfissionais(profs || [])

    const { data } = await supabase
      .from('agendamentos')
      .select('*, servicos(nome, preco, duracao_minutos), profissionais(id, nome)')
      .eq('user_id', user.id)
      .order('data_hora', { ascending: true })

    setAgendamentos(data || [])
    setLoading(false)
  }

  async function handleStatus(id: string, status: string) {
    await supabase.from('agendamentos').update({ status }).eq('id', id)
    carregarAgendamentos()
  }

  function formatarDataHora(dataHora: string) {
    const d = new Date(dataHora)
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function formatarDataHoraSimples(dataHora: string) {
    const d = new Date(dataHora)
    return {
      data: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  function getStatus(ag: any) {
    if (ag.status === 'cancelado') return 'cancelado'
    if (ag.status === 'confirmado') return 'confirmado'
    if (new Date(ag.data_hora) < new Date()) return 'realizado'
    return 'pendente'
  }

  function abrirWhatsApp(ag: any, tipo: 'confirmar' | 'cancelar' | 'remarcar' | 'link') {
    const tel = ag.cliente_telefone?.replace(/\D/g, '')
    if (!tel) return
    const { data, hora } = formatarDataHoraSimples(ag.data_hora)
    const prof = ag.profissionais?.nome || ''
    const nome = ag.cliente_nome || ''
    const linkAgenda = perfil?.slug ? 'https://clientemarcado-3p4t.vercel.app/' + perfil.slug + '/agendar' : ''
    const msgs: Record<string, string> = {
      confirmar: `Olá, ${nome}! Passando para confirmar seu horário no dia ${data} às ${hora} com ${prof}.\n\nVocê confirma sua presença?\n\nResponda SIM para confirmar ou avise caso precise remarcar.`,
      cancelar:  `Olá, ${nome}! Infelizmente precisamos cancelar seu horário do dia ${data} às ${hora}. Podemos remarcar para outro horário?`,
      remarcar:  `Olá, ${nome}! Precisamos ajustar seu horário. Você pode escolher um novo horário pelo link abaixo:\n\n${linkAgenda}`,
      link:      `Olá! Para agendar seu horário, acesse nosso link:\n\n${linkAgenda}`,
    }
    window.open('https://wa.me/55' + tel + '?text=' + encodeURIComponent(msgs[tipo]), '_blank')
  }

  function getDiasSemana(base: Date) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      return d
    })
  }

  function semanaAnterior() { const n = new Date(semanaBase); n.setDate(n.getDate() - 7); setSemanaBase(n) }
  function proximaSemana()  { const n = new Date(semanaBase); n.setDate(n.getDate() + 7); setSemanaBase(n) }
  function irParaHoje() {
    const h = new Date(); h.setHours(0,0,0,0)
    const d = new Date(h); d.setDate(h.getDate() - h.getDay())
    setSemanaBase(d)
  }

  function agendamentosDoDia(data: Date) {
    const dataStr = data.toISOString().split('T')[0]
    return agsFiltradas.filter(ag => {
      const agData = new Date(ag.data_hora).toISOString().split('T')[0]
      return agData === dataStr && ag.status !== 'cancelado'
    })
  }

  const diasSemana = getDiasSemana(semanaBase)
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const nomeDias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

  // Filtros combinados: status + profissional
  const agsFiltradas = agendamentos.filter(ag => {
    const passaStatus = filtroStatus === 'todos' || getStatus(ag) === filtroStatus
    const passaProf   = filtroProf === 'todos' || ag.profissionais?.id === filtroProf
    return passaStatus && passaProf
  })

  const statusConfig: Record<string, { label: string; bg: string; color: string; border: string }> = {
    pendente:   { label: 'Pendente',   bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6', border: 'rgba(59,130,246,0.3)' },
    confirmado: { label: 'Confirmado', bg: 'rgba(34,197,94,0.12)',   color: '#22C55E', border: 'rgba(34,197,94,0.3)'  },
    cancelado:  { label: 'Cancelado',  bg: 'rgba(239,68,68,0.12)',   color: '#EF4444', border: 'rgba(239,68,68,0.3)'  },
    realizado:  { label: 'Realizado',  bg: 'rgba(161,161,170,0.12)', color: '#9CA3AF', border: 'rgba(161,161,170,0.3)'},
  }

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .pg {
      min-height: 100vh;
      background: #08080A;
      color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    /* NAV */
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; height: 54px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(9,9,11,0.96); backdrop-filter: blur(10px);
      position: sticky; top: 0; z-index: 20; gap: 12px;
    }
    .nav-logo { font-size: 15px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; }
    .nav-back { font-size: 13px; color: #6B7280; text-decoration: none; transition: color 0.15s; }
    .nav-back:hover { color: #D1D5DB; }

    /* BODY */
    .body { max-width: 960px; margin: 0 auto; padding: 24px 16px 56px; }
    @media (min-width: 720px) { .body { padding: 32px 24px 64px; } }
    @media (min-width: 1100px) { .body { max-width: 1100px; } }

    /* HEADING */
    .heading { margin-bottom: 22px; }
    .heading h1 { font-size: 20px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 4px; }
    @media (min-width: 640px) { .heading h1 { font-size: 24px; } }
    .heading p { font-size: 14px; color: #6B7280; }

    /* FILTROS BAR */
    .filtros-wrap {
      display: flex; flex-direction: column; gap: 12px;
      margin-bottom: 20px;
    }
    @media (min-width: 640px) { .filtros-wrap { flex-direction: row; align-items: center; justify-content: space-between; } }

    .filtros-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .filtros-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; margin-right: 2px; }

    /* Toggle visão */
    .visao-toggle { display: flex; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 3px; gap: 2px; }
    .visao-btn {
      padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
      cursor: pointer; border: none; background: transparent; color: #6B7280;
      transition: all 0.15s; font-family: inherit;
      -webkit-tap-highlight-color: transparent;
    }
    .visao-btn.ativo { background: #3B82F6; color: #fff; }

    /* Chip de filtro */
    .chip {
      padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600;
      cursor: pointer; border: 1px solid; transition: all 0.15s;
      background: rgba(255,255,255,0.04); color: #6B7280;
      border-color: rgba(255,255,255,0.08);
      font-family: inherit; white-space: nowrap;
      -webkit-tap-highlight-color: transparent;
    }
    .chip.ativo { background: #3B82F6; color: #fff; border-color: #3B82F6; }
    .chip:hover:not(.ativo) { background: rgba(255,255,255,0.08); color: #D1D5DB; }

    /* Select profissional */
    .select-prof {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 8px 14px;
      color: #F1F5F9; font-size: 13px; font-weight: 600;
      outline: none; cursor: pointer;
      font-family: inherit;
      -webkit-appearance: none;
      transition: border-color 0.15s;
    }
    .select-prof:focus { border-color: rgba(59,130,246,0.5); }
    .select-prof option { background: #0F1117; color: #F1F5F9; }

    /* CARD agendamento */
    .ag-card {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px; padding: 18px 18px;
      transition: border-color 0.15s;
    }
    .ag-card:hover { border-color: rgba(59,130,246,0.2); }
    @media (min-width: 480px) { .ag-card { padding: 18px 22px; } }

    .ag-card-inner {
      display: flex; flex-direction: column; gap: 14px;
    }
    @media (min-width: 600px) {
      .ag-card-inner { flex-direction: row; justify-content: space-between; align-items: flex-start; }
    }

    .ag-info { flex: 1; min-width: 0; }
    .ag-topo { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
    .ag-cliente { font-size: 16px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.01em; }
    .status-badge {
      font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 999px;
      border: 1px solid;
    }
    .ag-servico { font-size: 13px; color: #D1D5DB; margin-bottom: 5px; }
    .ag-preco { color: #22C55E; font-weight: 700; }

    /* Profissional — destaque claro */
    .ag-prof-row {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(59,130,246,0.08);
      border: 1px solid rgba(59,130,246,0.15);
      border-radius: 8px; padding: 4px 10px;
      margin-bottom: 6px;
    }
    .ag-prof-label { font-size: 10px; font-weight: 700; color: #4B5563; text-transform: uppercase; letter-spacing: 0.06em; }
    .ag-prof-nome  { font-size: 12px; font-weight: 700; color: #93C5FD; }

    .ag-data { font-size: 13px; color: #3B82F6; font-weight: 600; margin-bottom: 4px; }
    .ag-tel  { font-size: 12px; color: #4B5563; }

    /* Ações */
    .ag-acoes { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
    .ag-acoes-btns { display: flex; gap: 8px; flex-wrap: wrap; }
    .ag-acoes-btns button { min-height: 40px; }
    .btn-confirmar {
      padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700;
      cursor: pointer; border: none; background: #22C55E; color: #fff;
      font-family: inherit; transition: opacity 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-confirmar:hover { opacity: 0.85; }
    .btn-cancelar {
      padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;
      cursor: pointer; border: 1px solid rgba(239,68,68,0.3);
      background: rgba(239,68,68,0.08); color: #EF4444;
      font-family: inherit; transition: opacity 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-cancelar:hover { opacity: 0.8; }
    .btn-wpp {
      padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
      cursor: pointer; border: 1px solid rgba(37,211,102,0.3);
      background: rgba(37,211,102,0.08); color: #25D366;
      display: inline-flex; align-items: center; gap: 5px;
      font-family: inherit; transition: opacity 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-wpp:hover { opacity: 0.8; }

    /* Lista vazia */
    .vazio {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px; padding: 40px 24px; text-align: center;
    }
    .vazio p:first-child { font-size: 14px; color: #6B7280; margin-bottom: 6px; font-weight: 500; }
    .vazio p:last-child  { font-size: 13px; color: #374151; }

    /* SEMANA */
    .semana-nav {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px; flex-wrap: wrap; gap: 10px;
    }
    .semana-nav-left { display: flex; align-items: center; gap: 8px; }
    .btn-nav {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; padding: 7px 13px; color: #9CA3AF;
      cursor: pointer; font-size: 15px; line-height: 1;
      font-family: inherit;
    }
    .semana-range { font-size: 14px; font-weight: 700; color: #F1F5F9; }
    .btn-hoje {
      background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25);
      border-radius: 8px; padding: 7px 16px; color: #3B82F6;
      cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit;
    }
    .semana-grid {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;
    }
    @media (max-width: 540px) { .semana-grid { grid-template-columns: repeat(7, minmax(40px, 1fr)); overflow-x: auto; } }
    .dia-col {
      border-radius: 12px; padding: 8px 6px; min-height: 110px;
    }
    .dia-col-normal { background: rgba(18,22,30,0.97); border: 1px solid rgba(255,255,255,0.06); }
    .dia-col-hoje   { background: rgba(59,130,246,0.07); border: 1px solid rgba(59,130,246,0.25); }
    .dia-header { text-align: center; margin-bottom: 6px; }
    .dia-nome { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
    .dia-nome-normal { color: #374151; }
    .dia-nome-hoje   { color: #3B82F6; }
    .dia-num-normal { font-size: 16px; font-weight: 800; color: #F1F5F9; line-height: 1.2; }
    .dia-num-hoje   { font-size: 16px; font-weight: 800; color: #3B82F6; line-height: 1.2; }
    .dia-ag-item { border-radius: 6px; padding: 4px 5px; margin-bottom: 3px; }
    .dia-ag-hora  { font-size: 9px; font-weight: 700; margin-bottom: 1px; }
    .dia-ag-nome  { font-size: 9px; font-weight: 600; color: #F1F5F9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dia-ag-svc   { font-size: 8px; color: #6B7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dia-vazio    { font-size: 9px; color: #1F2937; text-align: center; margin-top: 8px; }
    .dia-count    { font-size: 9px; color: #4B5563; text-align: center; margin-top: 4px; }

    /* Detalhes semana */
    .semana-detalhe { margin-top: 24px; }
    .semana-detalhe-titulo { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: #374151; margin-bottom: 14px; }
    .semana-dia-titulo { font-size: 12px; font-weight: 700; color: #9CA3AF; margin-bottom: 8px; text-transform: capitalize; }
    .semana-ag-mini {
      background: rgba(18,22,30,0.97); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px; padding: 12px 14px; margin-bottom: 6px;
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;
    }
    .semana-ag-mini:hover { border-color: rgba(59,130,246,0.2); }
    .semana-ag-nome { font-size: 13px; font-weight: 700; color: #F1F5F9; margin-bottom: 2px; }
    .semana-ag-sub  { font-size: 12px; color: #6B7280; }
    .semana-ag-hora { font-size: 13px; font-weight: 700; color: #3B82F6; }
  `

  return (
    <div className="pg">
      <style>{css}</style>

      <nav className="nav">
        <span className="nav-logo">ClienteMarcado</span>
        <Link href="/painel" className="nav-back">← Voltar ao painel</Link>
      </nav>

      <div className="body">
        <div className="heading">
          <h1>Agenda</h1>
          <p>Gerencie seus agendamentos e horários por profissional.</p>
        </div>

        {/* ── BARRA DE FILTROS ── */}
        <div className="filtros-wrap">

          {/* Esquerda: visão + status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Toggle lista/semana */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="visao-toggle">
                <button className={`visao-btn${visao === 'lista' ? ' ativo' : ''}`} onClick={() => setVisao('lista')}>📋 Lista</button>
                <button className={`visao-btn${visao === 'semana' ? ' ativo' : ''}`} onClick={() => setVisao('semana')}>📅 Semana</button>
              </div>
            </div>

            {/* Filtro status (só na lista) */}
            {visao === 'lista' && (
              <div className="filtros-row">
                <span className="filtros-label">Status</span>
                {[
                  { key: 'todos',     label: 'Todos' },
                  { key: 'pendente',  label: 'Pendentes' },
                  { key: 'confirmado',label: 'Confirmados' },
                  { key: 'realizado', label: 'Realizados' },
                  { key: 'cancelado', label: 'Cancelados' },
                ].map(f => (
                  <button key={f.key}
                    className={`chip${filtroStatus === f.key ? ' ativo' : ''}`}
                    onClick={() => setFiltroStatus(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Direita: filtro profissional */}
          {profissionais.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span className="filtros-label">Profissional</span>
              <select className="select-prof"
                value={filtroProf}
                onChange={e => setFiltroProf(e.target.value)}>
                <option value="todos">Todos</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ══ VISÃO SEMANAL ══ */}
        {visao === 'semana' && (
          <div>
            <div className="semana-nav">
              <div className="semana-nav-left">
                <button className="btn-nav" onClick={semanaAnterior}>‹</button>
                <p className="semana-range">
                  {diasSemana[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — {diasSemana[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <button className="btn-nav" onClick={proximaSemana}>›</button>
              </div>
              <button className="btn-hoje" onClick={irParaHoje}>Hoje</button>
            </div>

            {filtroProf !== 'todos' && (() => { const p = profissionais.find(p => p.id === filtroProf); return p ? (<div style={{ marginBottom: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '7px 14px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span style={{ fontSize: '13px', fontWeight: '700', color: '#93C5FD' }}>Mostrando agenda de {p.nome}</span></div>) : null })()}

            <div className="semana-grid">
              {diasSemana.map((dia, idx) => {
                const ags = agendamentosDoDia(dia)
                const diaStr = dia.toISOString().split('T')[0]
                const ehHoje = diaStr === hoje.toISOString().split('T')[0]
                return (
                  <div key={idx} className={`dia-col ${ehHoje ? 'dia-col-hoje' : 'dia-col-normal'}`}>
                    <div className="dia-header">
                      <p className={`dia-nome ${ehHoje ? 'dia-nome-hoje' : 'dia-nome-normal'}`}>{nomeDias[dia.getDay()]}</p>
                      <p className={ehHoje ? 'dia-num-hoje' : 'dia-num-normal'}>{dia.getDate()}</p>
                    </div>
                    {ags.length === 0
                      ? <p className="dia-vazio">—</p>
                      : ags.map(ag => {
                          const status = getStatus(ag)
                          const cfg = statusConfig[status]
                          const hora = new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          return (
                            <div key={ag.id} className="dia-ag-item" style={{ background: cfg.bg, border: '1px solid ' + cfg.border }}>
                              <p className="dia-ag-hora" style={{ color: cfg.color }}>{hora}</p>
                              <p className="dia-ag-nome">{ag.cliente_nome}</p>
                              <p className="dia-ag-svc">{ag.servicos?.nome}</p>
                            </div>
                          )
                        })
                    }
                    {ags.length > 0 && <p className="dia-count">{ags.length} ag.</p>}
                  </div>
                )
              })}
            </div>

            {/* Detalhes da semana */}
            {diasSemana.some(d => agendamentosDoDia(d).length > 0) && (
              <div className="semana-detalhe">
                <p className="semana-detalhe-titulo">Detalhes da semana</p>
                {diasSemana.map((dia, idx) => {
                  const ags = agendamentosDoDia(dia)
                  if (ags.length === 0) return null
                  return (
                    <div key={idx} style={{ marginBottom: '16px' }}>
                      <p className="semana-dia-titulo">
                        {dia.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                      </p>
                      {ags.map(ag => {
                        const status = getStatus(ag)
                        const cfg = statusConfig[status]
                        const hora = new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        return (
                          <div key={ag.id} className="semana-ag-mini">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p className="semana-ag-nome">{ag.cliente_nome}</p>
                              <p className="semana-ag-sub">
                                {ag.servicos?.nome}
                                {ag.profissionais?.nome ? ` · ${ag.profissionais.nome}` : ''}
                              </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                              <span className="status-badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                                {cfg.label}
                              </span>
                              <span className="semana-ag-hora">{hora}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ VISÃO LISTA ══ */}
        {visao === 'lista' && (
          <div>
            {filtroProf !== 'todos' && (() => { const p = profissionais.find(p => p.id === filtroProf); return p ? (<div style={{ marginBottom: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '7px 14px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span style={{ fontSize: '13px', fontWeight: '700', color: '#93C5FD' }}>Mostrando agenda de {p.nome}</span></div>) : null })()}

            {loading && (
              <div className="vazio"><p>Carregando...</p></div>
            )}
            {!loading && agsFiltradas.length === 0 && (
              <div className="vazio">
                <p>Nenhum agendamento encontrado.</p>
                <p>Tente ajustar os filtros de status ou profissional.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {agsFiltradas.map(ag => {
                const status = getStatus(ag)
                const cfg = statusConfig[status]
                const temTel = !!ag.cliente_telefone

                return (
                  <div key={ag.id} className="ag-card">
                    <div className="ag-card-inner">
                      {/* Info principal */}
                      <div className="ag-info">
                        {/* Nome + badge */}
                        <div className="ag-topo">
                          <span className="ag-cliente">{ag.cliente_nome || 'Cliente'}</span>
                          <span className="status-badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                            {cfg.label}
                          </span>
                        </div>

                        {/* Serviço + valor */}
                        <p className="ag-servico">
                          {ag.servicos?.nome
                            ? ag.servicos.nome
                            : <span style={{ color: '#4B5563', fontStyle: 'italic' }}>Outro serviço</span>
                          }
                          {ag.servicos?.preco && parseFloat(ag.servicos.preco) > 0
                            ? <> · <span className="ag-preco">R$ {parseFloat(ag.servicos.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></>
                            : null
                          }
                        </p>

                        {/* Profissional — destaque claro */}
                        {ag.profissionais?.nome && (
                          <div className="ag-prof-row">
                            <span className="ag-prof-label">Profissional</span>
                            <span className="ag-prof-nome">{ag.profissionais.nome}</span>
                          </div>
                        )}

                        {/* Data/hora */}
                        <p className="ag-data">🗓 {formatarDataHora(ag.data_hora)}</p>

                        {/* Telefone */}
                        {ag.cliente_telefone && (
                          <p className="ag-tel">📱 {ag.cliente_telefone}</p>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="ag-acoes">
                        {/* Status actions */}
                        {status === 'pendente' && (
                          <div className="ag-acoes-btns">
                            <button className="btn-confirmar" onClick={() => handleStatus(ag.id, 'confirmado')}>Confirmar</button>
                            <button className="btn-cancelar"  onClick={() => handleStatus(ag.id, 'cancelado')}>Cancelar</button>
                          </div>
                        )}
                        {status === 'confirmado' && (
                          <div className="ag-acoes-btns">
                            <button className="btn-cancelar" onClick={() => handleStatus(ag.id, 'cancelado')}>Cancelar</button>
                          </div>
                        )}

                        {/* WhatsApp */}
                        {temTel && (
                          <div className="ag-acoes-btns">
                            {status === 'pendente' && (
                              <button className="btn-wpp" onClick={() => abrirWhatsApp(ag, 'confirmar')}>
                                <WppIcon /> Confirmar presença
                              </button>
                            )}
                            {(status === 'pendente' || status === 'confirmado') && (
                              <button className="btn-wpp" onClick={() => abrirWhatsApp(ag, 'remarcar')}>
                                <WppIcon /> Remarcar
                              </button>
                            )}
                            {status === 'cancelado' && (
                              <button className="btn-wpp" onClick={() => abrirWhatsApp(ag, 'remarcar')}>
                                <WppIcon /> Novo horário
                              </button>
                            )}
                            {status === 'realizado' && (
                              <button className="btn-wpp" onClick={() => abrirWhatsApp(ag, 'link')}>
                                <WppIcon /> Agendar novamente
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
