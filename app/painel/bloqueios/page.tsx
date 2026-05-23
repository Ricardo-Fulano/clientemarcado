'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

// ── Ícones inline ──────────────────────────────────────────
const CalIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

// ── Gera slots dentro do expediente (abertura → fechamento) ──
// apos: quando definido, começa 15min depois desse horário
function gerarSlots(abertura: string, fechamento: string, apos?: string): string[] {
  function toMin(t: string) {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const fimMin = toMin(fechamento)
  let fromMin = toMin(abertura)
  if (apos) fromMin = toMin(apos) + 15
  const slots: string[] = []
  for (let min = fromMin; min <= fimMin; min += 15) {
    slots.push(String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'))
  }
  return slots
}

// ── TimePicker customizado ─────────────────────────────────
function TimePicker({ value, onChange, label, placeholder = '00:00', slots = [] }: {
  value: string
  onChange: (v: string) => void
  label: string
  placeholder?: string
  slots: string[]
}) {
  const [open, setOpen] = useState(false)

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    setTimeout(() => window.addEventListener('click', handler), 0)
    return () => window.removeEventListener('click', handler)
  }, [open])

  return (
    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <label className="field-label">{label}</label>
      <button
        type="button"
        className={`field-btn${open ? ' focused' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="field-icon" style={{ color: value ? '#3B82F6' : '#4B5563' }}><ClockIcon /></span>
        <span style={{ flex: 1, textAlign: 'left', color: value ? '#F1F5F9' : '#374151', fontSize: '15px', fontWeight: value ? 600 : 400 }}>
          {value || placeholder}
        </span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="picker-dropdown">
          {slots.map(slot => (
            <button
              key={slot}
              type="button"
              className={`picker-option${value === slot ? ' selected' : ''}`}
              onClick={() => { onChange(slot); setOpen(false) }}
            >
              {slot}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── DatePicker customizado simples ─────────────────────────
function DatePicker({ value, onChange, label, min }: {
  value: string
  onChange: (v: string) => void
  label: string
  min?: string
}) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value + 'T12:00:00') : new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    setTimeout(() => window.addEventListener('click', handler), 0)
    return () => window.removeEventListener('click', handler)
  }, [open])

  const hoje = min || new Date().toISOString().split('T')[0]

  function diasNoMes(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate()
  }

  function primeiroDia(y: number, m: number) {
    return new Date(y, m, 1).getDay()
  }

  function selecionar(dia: number) {
    const dateStr = viewDate.year + '-'
      + String(viewDate.month + 1).padStart(2, '0') + '-'
      + String(dia).padStart(2, '0')
    if (dateStr < hoje) return
    onChange(dateStr)
    setOpen(false)
  }

  function prevMes() {
    setViewDate(v => {
      const m = v.month === 0 ? 11 : v.month - 1
      const y = v.month === 0 ? v.year - 1 : v.year
      return { year: y, month: m }
    })
  }

  function nextMes() {
    setViewDate(v => {
      const m = v.month === 11 ? 0 : v.month + 1
      const y = v.month === 11 ? v.year + 1 : v.year
      return { year: y, month: m }
    })
  }

  const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const nomeDias = ['D','S','T','Q','Q','S','S']
  const total = diasNoMes(viewDate.year, viewDate.month)
  const inicio = primeiroDia(viewDate.year, viewDate.month)

  function formatarDisplay(v: string) {
    if (!v) return ''
    const [ano, mes, dia] = v.split('-')
    return `${dia}/${mes}/${ano}`
  }

  return (
    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <label className="field-label">{label}</label>
      <button
        type="button"
        className={`field-btn${open ? ' focused' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="field-icon" style={{ color: value ? '#3B82F6' : '#4B5563' }}><CalIcon /></span>
        <span style={{ flex: 1, textAlign: 'left', color: value ? '#F1F5F9' : '#374151', fontSize: '15px', fontWeight: value ? 600 : 400 }}>
          {value ? formatarDisplay(value) : 'Selecione a data'}
        </span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="picker-dropdown" style={{ padding: '14px', minWidth: '260px' }} onClick={e => e.stopPropagation()}>
          {/* Header mês */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button type="button" className="cal-nav" onClick={prevMes}>‹</button>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#F1F5F9', textTransform: 'capitalize' }}>
              {nomesMes[viewDate.month]} {viewDate.year}
            </span>
            <button type="button" className="cal-nav" onClick={nextMes}>›</button>
          </div>
          {/* Dias da semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {nomeDias.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '9px', fontWeight: '700', color: '#374151', padding: '3px 0', letterSpacing: '0.04em' }}>{d}</div>
            ))}
          </div>
          {/* Dias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {Array.from({ length: inicio }).map((_, i) => <div key={'e' + i} />)}
            {Array.from({ length: total }).map((_, i) => {
              const dia = i + 1
              const dateStr = viewDate.year + '-'
                + String(viewDate.month + 1).padStart(2, '0') + '-'
                + String(dia).padStart(2, '0')
              const passado   = dateStr < hoje
              const selecionado = dateStr === value
              const ehHoje    = dateStr === hoje
              return (
                <button
                  key={dia}
                  type="button"
                  disabled={passado}
                  onClick={() => selecionar(dia)}
                  style={{
                    padding: '7px 2px', borderRadius: '7px', fontSize: '12px', fontWeight: selecionado ? 700 : ehHoje ? 700 : 500,
                    cursor: passado ? 'default' : 'pointer',
                    border: ehHoje && !selecionado ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
                    background: selecionado ? '#3B82F6' : 'transparent',
                    color: passado ? '#1F2937' : selecionado ? '#fff' : ehHoje ? '#3B82F6' : '#D1D5DB',
                    transition: 'all 0.1s',
                  }}
                >
                  {dia}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ───────────────────────────────────────
export default function Bloqueios() {
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [bloqueios, setBloqueios]         = useState<any[]>([])
  const [profissionalId, setProfissionalId] = useState('')
  const [data, setData]           = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim]       = useState('')
  const [motivo, setMotivo]         = useState('')
  const [loading, setLoading]       = useState(false)
  const [mensagem, setMensagem]     = useState('')
  const [userId, setUserId]         = useState('')
  const [horaAbertura, setHoraAbertura] = useState('08:00')
  const [horaFechamento, setHoraFechamento] = useState('18:00')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const { data: perfil } = await supabase.from('perfis').select('hora_abertura, hora_fechamento').eq('user_id', user.id).single()
    const ab = perfil?.hora_abertura || '08:00'
    const fe = perfil?.hora_fechamento || '18:00'
    setHoraAbertura(ab)
    setHoraFechamento(fe)
    // Pre-select sensible defaults
    const primeiroSlot = gerarSlots(ab, fe)[0] || ab
    const segundoSlot  = gerarSlots(ab, fe, primeiroSlot)[0] || ''
    setHoraInicio(prev => prev || primeiroSlot)
    setHoraFim(prev => prev || segundoSlot)
    const { data: profs } = await supabase.from('profissionais').select('*').eq('user_id', user.id)
    setProfissionais(profs || [])
    const hoje = new Date().toISOString().split('T')[0]
    const { data: bl } = await supabase
      .from('bloqueios').select('*, profissionais(nome)')
      .eq('user_id', user.id).gte('data', hoje)
      .order('data', { ascending: true })
    setBloqueios(bl || [])
  }

  async function handleAdicionar() {
    setMensagem('')
    if (!data || !horaInicio || !horaFim) { setMensagem('Preencha data, hora início e hora fim.'); return }
    if (horaInicio >= horaFim) { setMensagem('Hora fim deve ser maior que hora início.'); return }
    const slotsValidos = gerarSlots(horaAbertura, horaFechamento)
    if (!slotsValidos.includes(horaInicio) || !slotsValidos.includes(horaFim)) {
      setMensagem('Escolha um horário dentro do funcionamento do negócio.'); return
    }
    setLoading(true)
    const { error } = await supabase.from('bloqueios').insert({
      user_id: userId,
      profissional_id: profissionalId || null,
      data, hora_inicio: horaInicio, hora_fim: horaFim,
      motivo: motivo || null,
    })
    setLoading(false)
    if (error) {
      setMensagem('Erro ao salvar bloqueio.')
    } else {
      setData(''); setHoraInicio(''); setHoraFim('')
      setMotivo(''); setProfissionalId('')
      setMensagem('Bloqueio adicionado!')
      carregar()
      setTimeout(() => setMensagem(''), 3000)
    }
  }

  async function handleExcluir(id: string) {
    await supabase.from('bloqueios').delete().eq('id', id)
    carregar()
  }

  function formatarData(dataStr: string) {
    const [ano, mes, dia] = dataStr.split('-')
    return dia + '/' + mes + '/' + ano
  }

  const hoje = new Date().toISOString().split('T')[0]

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .pg {
      min-height: 100vh; background: #08080A; color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; height: 54px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(9,9,11,0.96); backdrop-filter: blur(10px);
      position: sticky; top: 0; z-index: 50;
    }
    .nav-logo { font-size: 15px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; }
    .nav-back { font-size: 13px; color: #6B7280; text-decoration: none; transition: color 0.15s; }
    .nav-back:hover { color: #D1D5DB; }

    .body { max-width: 660px; margin: 0 auto; padding: 24px 16px 56px; }
    @media (min-width: 640px) { .body { padding: 32px 24px 64px; } }

    .heading { margin-bottom: 24px; }
    .heading h1 { font-size: 20px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 4px; }
    @media (min-width: 480px) { .heading h1 { font-size: 23px; } }
    .heading p { font-size: 14px; color: #6B7280; }

    /* FORM CARD */
    .form-card {
      background: linear-gradient(180deg, rgba(16,20,30,0.98) 0%, rgba(10,12,18,0.98) 100%);
      border: 1px solid rgba(255,255,255,0.09); border-radius: 18px;
      padding: 22px 18px; margin-bottom: 28px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    @media (min-width: 480px) { .form-card { padding: 26px 24px; } }
    .form-titulo { font-size: 15px; font-weight: 700; color: #F1F5F9; margin-bottom: 18px; }

    .fields { display: flex; flex-direction: column; gap: 14px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 360px) { .row-2 { grid-template-columns: 1fr; } }

    /* Labels */
    .field-label {
      display: block; font-size: 11px; font-weight: 600;
      color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px;
    }

    /* Base input/select/button field */
    .field-input, .field-select {
      width: 100%; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
      padding: 13px 16px; color: #F1F5F9; font-size: 15px; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: inherit; -webkit-appearance: none;
    }
    .field-input:focus, .field-select:focus {
      border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .field-input::placeholder { color: #374151; }
    .field-select { cursor: pointer; }
    .field-select option { background: #0F1117; color: #F1F5F9; }

    /* Custom picker button */
    .field-btn {
      width: 100%; display: flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
      padding: 12px 14px; cursor: pointer; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: inherit; -webkit-tap-highlight-color: transparent;
    }
    .field-btn:hover { border-color: rgba(255,255,255,0.15); }
    .field-btn.focused {
      border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .field-icon { display: flex; align-items: center; flex-shrink: 0; }

    /* Dropdown */
    .picker-dropdown {
      position: absolute; top: calc(100% + 6px); left: 0;
      background: linear-gradient(180deg, rgba(20,26,40,0.99) 0%, rgba(12,15,22,0.99) 100%);
      border: 1px solid rgba(255,255,255,0.12); border-radius: 14px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.6);
      z-index: 100; overflow: hidden; min-width: 120px;
    }

    /* TimePicker options */
    .picker-option {
      display: block; width: 100%;
      padding: 9px 16px; text-align: left;
      font-size: 13px; font-weight: 500; color: #D1D5DB;
      background: none; border: none; cursor: pointer;
      font-family: inherit; transition: background 0.1s, color 0.1s;
    }
    .picker-option:hover { background: rgba(59,130,246,0.1); color: #F1F5F9; }
    .picker-option.selected { background: #3B82F6; color: #fff; font-weight: 700; }

    /* Time dropdown scrollable */
    .picker-dropdown:not([style*="padding"]) {
      max-height: 220px; overflow-y: auto;
    }
    .picker-dropdown::-webkit-scrollbar { width: 4px; }
    .picker-dropdown::-webkit-scrollbar-track { background: transparent; }
    .picker-dropdown::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }

    /* Calendar nav */
    .cal-nav {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 7px; padding: 4px 10px; color: #9CA3AF;
      cursor: pointer; font-size: 15px; line-height: 1; font-family: inherit;
    }
    .cal-nav:hover { background: rgba(255,255,255,0.1); color: #F1F5F9; }

    /* Mensagens */
    .msg-ok  { font-size: 13px; color: #22C55E; padding: 10px 14px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 8px; }
    .msg-err { font-size: 13px; color: #EF4444; padding: 10px 14px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; }

    /* Botão */
    .btn-salvar {
      width: 100%; background: #3B82F6; color: #fff; border: none; border-radius: 12px;
      padding: 14px; font-size: 14px; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 16px rgba(59,130,246,0.3);
      transition: background 0.15s, opacity 0.15s; font-family: inherit;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-salvar:hover { background: #2563EB; }
    .btn-salvar:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Lista bloqueios */
    .sec-titulo { font-size: 13px; font-weight: 700; color: #9CA3AF; margin-bottom: 14px; }
    .bl-lista { display: flex; flex-direction: column; gap: 8px; }
    .bl-card {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
      padding: 14px 18px; display: flex; align-items: center;
      justify-content: space-between; gap: 12px;
      transition: border-color 0.15s;
    }
    .bl-card:hover { border-color: rgba(255,255,255,0.12); }
    .bl-data { font-size: 14px; font-weight: 700; color: #F1F5F9; margin-bottom: 3px; }
    .bl-hora { font-size: 12px; color: #3B82F6; font-weight: 600; }
    .bl-meta { font-size: 12px; color: #4B5563; margin-top: 3px; }
    .btn-excluir {
      font-size: 11px; font-weight: 600; color: #6B7280;
      background: none; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 7px; padding: 5px 10px; cursor: pointer; font-family: inherit;
      flex-shrink: 0; transition: color 0.15s, border-color 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-excluir:hover { color: #EF4444; border-color: rgba(239,68,68,0.3); }

    .vazio {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;
      padding: 32px 24px; text-align: center;
    }
    .vazio p:first-child { font-size: 14px; color: #6B7280; margin-bottom: 5px; }
    .vazio p:last-child  { font-size: 12px; color: #374151; }
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
          <h1>Bloqueio de horários</h1>
          <p>Bloqueie horários para almoço, folga, ausência ou manutenção.</p>
        </div>

        <div className="form-card">
          <p className="form-titulo">+ Adicionar bloqueio</p>
          <div className="fields">

            {/* Profissional */}
            <div>
              <label className="field-label">Profissional (vazio = todos)</label>
              <select
                value={profissionalId}
                onChange={e => setProfissionalId(e.target.value)}
                className="field-select">
                <option value="">Todos os profissionais</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            {/* Data */}
            <DatePicker
              label="Data *"
              value={data}
              onChange={setData}
              min={hoje}
            />

            {/* Hora início e fim */}
            <div className="row-2">
              <TimePicker label="Hora início *" value={horaInicio} onChange={v => { setHoraInicio(v); if (horaFim && v >= horaFim) setHoraFim('') }} placeholder={horaAbertura} slots={gerarSlots(horaAbertura, horaFechamento)} />
              <TimePicker label="Hora fim *"    value={horaFim}    onChange={setHoraFim}    placeholder={horaInicio ? "" : horaAbertura} slots={gerarSlots(horaAbertura, horaFechamento, horaInicio || undefined)} />
            </div>

            {/* Motivo */}
            <div>
              <label className="field-label">Motivo (opcional)</label>
              <input
                type="text"
                placeholder="Ex: Almoço, Folga, Manutenção..."
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                className="field-input"
              />
            </div>

            {mensagem && (
              <div className={mensagem.includes('Erro') || mensagem.includes('Preencha') || mensagem.includes('maior') ? 'msg-err' : 'msg-ok'}>
                {mensagem}
              </div>
            )}

            <button className="btn-salvar" onClick={handleAdicionar} disabled={loading}>
              {loading ? 'Salvando...' : 'Adicionar bloqueio'}
            </button>
          </div>
        </div>

        {/* Lista */}
        <p className="sec-titulo">Bloqueios ativos</p>
        {bloqueios.length === 0 ? (
          <div className="vazio">
            <p>Nenhum bloqueio cadastrado.</p>
            <p>Adicione bloqueios usando o formulário acima.</p>
          </div>
        ) : (
          <div className="bl-lista">
            {bloqueios.map(b => (
              <div key={b.id} className="bl-card">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <p className="bl-data">{formatarData(b.data)}</p>
                    <span className="bl-hora">{b.hora_inicio.slice(0,5)} — {b.hora_fim.slice(0,5)}</span>
                  </div>
                  <p className="bl-meta">
                    {b.profissionais?.nome || 'Todos os profissionais'}
                    {b.motivo ? ' · ' + b.motivo : ''}
                  </p>
                  {(() => {
                    const slots = gerarSlots(horaAbertura, horaFechamento)
                    const foraInicio = b.hora_inicio && !slots.includes(b.hora_inicio.slice(0,5))
                    const foraFim    = b.hora_fim    && !slots.includes(b.hora_fim.slice(0,5))
                    return (foraInicio || foraFim) ? (
                      <p style={{ fontSize: '11px', color: '#F59E0B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⚠ Horário fora do expediente atual
                      </p>
                    ) : null
                  })()}
                </div>
                <button className="btn-excluir" onClick={() => handleExcluir(b.id)}>Excluir</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
