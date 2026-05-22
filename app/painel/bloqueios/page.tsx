'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function Bloqueios() {
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [bloqueios, setBloqueios] = useState<any[]>([])
  const [profissionalId, setProfissionalId] = useState('')
  const [data, setData] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)

    const { data: profs } = await supabase.from('profissionais').select('*').eq('user_id', user.id)
    setProfissionais(profs || [])

    const hoje = new Date().toISOString().split('T')[0]
    const { data: bl } = await supabase
      .from('bloqueios')
      .select('*, profissionais(nome)')
      .eq('user_id', user.id)
      .gte('data', hoje)
      .order('data', { ascending: true })
    setBloqueios(bl || [])
  }

  async function handleAdicionar() {
    setMensagem('')
    if (!data || !horaInicio || !horaFim) { setMensagem('Preencha data, hora início e hora fim.'); return }
    if (horaInicio >= horaFim) { setMensagem('Hora fim deve ser maior que hora início.'); return }

    setLoading(true)
    const { error } = await supabase.from('bloqueios').insert({
      user_id: userId,
      profissional_id: profissionalId || null,
      data,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      motivo: motivo || null,
    })
    setLoading(false)

    if (error) {
      setMensagem('Erro ao salvar bloqueio.')
    } else {
      setData(''); setHoraInicio(''); setHoraFim(''); setMotivo(''); setProfissionalId('')
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

  const inputStyle = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '12px 16px', color: 'var(--text-primary)',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    fontSize: '12px', fontWeight: '500' as const, color: 'var(--text-secondary)',
    display: 'block', marginBottom: '6px',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>ClienteMarcado</span>
        <Link href="/painel" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>← Voltar ao painel</Link>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>Bloqueio de horários</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>Bloqueie horários para almoço, folga, ausência ou manutenção</p>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Adicionar bloqueio</h3>

          <div>
            <label style={labelStyle}>Profissional (opcional — vazio = todos)</label>
            <select value={profissionalId} onChange={(e) => setProfissionalId(e.target.value)} style={inputStyle}>
              <option value="">Todos os profissionais</option>
              {profissionais.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Data *</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)}
              min={new Date().toISOString().split('T')[0]} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Hora início *</label>
              <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Hora fim *</label>
              <input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Motivo (opcional)</label>
            <input type="text" placeholder="Ex: Almoço, Folga, Manutenção..." value={motivo}
              onChange={(e) => setMotivo(e.target.value)} style={inputStyle} />
          </div>

          {mensagem && (
            <p style={{ fontSize: '13px', color: mensagem.includes('Erro') ? 'var(--danger)' : 'var(--success)' }}>
              {mensagem}
            </p>
          )}

          <button onClick={handleAdicionar} disabled={loading}
            style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Salvando...' : 'Adicionar bloqueio'}
          </button>
        </div>

        {/* Lista */}
        <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Bloqueios ativos</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {bloqueios.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: '14px' }}>Nenhum bloqueio cadastrado.</p>
          )}
          {bloqueios.map((b) => (
            <div key={b.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <p style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                    {formatarData(b.data)}
                  </p>
                  <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>
                    {b.hora_inicio.slice(0,5)} — {b.hora_fim.slice(0,5)}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {b.profissionais?.nome || 'Todos os profissionais'}
                  {b.motivo ? ' · ' + b.motivo : ''}
                </p>
              </div>
              <button onClick={() => handleExcluir(b.id)}
                style={{ fontSize: '12px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                Excluir
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}