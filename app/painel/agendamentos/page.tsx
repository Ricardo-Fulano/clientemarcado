'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => { carregarAgendamentos() }, [])

  async function carregarAgendamentos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data } = await supabase
      .from('agendamentos')
      .select('*, servicos(nome, preco), profissionais(nome)')
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

  function getStatus(ag: any) {
    if (ag.status === 'cancelado') return 'cancelado'
    if (ag.status === 'confirmado') return 'confirmado'
    const agora = new Date()
    const dataAg = new Date(ag.data_hora)
    if (dataAg < agora) return 'realizado'
    return 'pendente'
  }

  const agendamentosFiltrados = agendamentos.filter(ag => {
    if (filtro === 'todos') return true
    return getStatus(ag) === filtro
  })

  const statusConfig: Record<string, { label: string, bg: string, color: string }> = {
    pendente:   { label: 'Pendente',   bg: 'rgba(59,130,246,0.12)',  color: 'var(--accent)' },
    confirmado: { label: 'Confirmado', bg: 'rgba(34,197,94,0.12)',   color: 'var(--success)' },
    cancelado:  { label: 'Cancelado',  bg: 'rgba(239,68,68,0.12)',   color: 'var(--danger)' },
    realizado:  { label: 'Realizado',  bg: 'rgba(161,161,170,0.12)', color: 'var(--text-muted)' },
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>ClienteMarcado</span>
        <Link href="/painel" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>← Voltar ao painel</Link>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>Agenda</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Gerencie seus agendamentos online</p>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'pendente', label: 'Pendentes' },
            { key: 'confirmado', label: 'Confirmados' },
            { key: 'realizado', label: 'Realizados' },
            { key: 'cancelado', label: 'Cancelados' },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              style={{ padding: '7px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: '1px solid', background: filtro === f.key ? 'var(--accent)' : 'var(--card)', color: filtro === f.key ? '#fff' : 'var(--text-secondary)', borderColor: filtro === f.key ? 'var(--accent)' : 'var(--border)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>Carregando...</p>}

        {!loading && agendamentosFiltrados.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>Nenhum agendamento encontrado.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {agendamentosFiltrados.map((ag) => {
            const status = getStatus(ag)
            const cfg = statusConfig[status]
            return (
              <div key={ag.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{ag.cliente_nome}</p>
                      {/* ✅ VERDE para confirmado, azul para pendente */}
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      {ag.servicos?.nome} · <span style={{ color: 'var(--success)', fontWeight: '600' }}>R$ {ag.servicos?.preco}</span>
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                      👤 {ag.profissionais?.nome}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}>
                      🗓 {formatarDataHora(ag.data_hora)}
                    </p>
                    {ag.cliente_telefone && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>📱 {ag.cliente_telefone}</p>
                    )}
                  </div>

                  {/* Ações */}
                  {status === 'pendente' && (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => handleStatus(ag.id, 'confirmado')}
                        style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'var(--success)', color: '#fff' }}>
                        Confirmar
                      </button>
                      <button onClick={() => handleStatus(ag.id, 'cancelado')}
                        style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--danger)' }}>
                        Cancelar
                      </button>
                    </div>
                  )}
                  {status === 'confirmado' && (
                    <button onClick={() => handleStatus(ag.id, 'cancelado')}
                      style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--danger)', flexShrink: 0 }}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}