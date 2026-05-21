'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => { carregarAgendamentos() }, [])

  async function carregarAgendamentos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data: p } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()
    setPerfil(p)

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

  function formatarDataHoraSimples(dataHora: string) {
    const d = new Date(dataHora)
    const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return { data, hora }
  }

  function getStatus(ag: any) {
    if (ag.status === 'cancelado') return 'cancelado'
    if (ag.status === 'confirmado') return 'confirmado'
    const agora = new Date()
    const dataAg = new Date(ag.data_hora)
    if (dataAg < agora) return 'realizado'
    return 'pendente'
  }

  function abrirWhatsApp(ag: any, tipo: 'confirmar' | 'cancelar' | 'remarcar' | 'link') {
    const tel = ag.cliente_telefone?.replace(/\D/g, '')
    if (!tel) return
    const { data, hora } = formatarDataHoraSimples(ag.data_hora)
    const prof = ag.profissionais?.nome || ''
    const nome = ag.cliente_nome || ''
    const linkAgenda = perfil?.slug ? `https://clientemarcado-3p4t.vercel.app/${perfil.slug}/agendar` : ''

    const mensagens: Record<string, string> = {
      confirmar: `Olá, ${nome}! Passando para confirmar seu horário no dia ${data} às ${hora} com ${prof}.\n\nVocê confirma sua presença?\n\nResponda SIM para confirmar ou avise caso precise remarcar.`,
      cancelar: `Olá, ${nome}! Infelizmente precisamos cancelar seu horário do dia ${data} às ${hora}. Podemos remarcar para outro horário?`,
      remarcar: `Olá, ${nome}! Precisamos ajustar seu horário. Você pode escolher um novo horário pelo link abaixo:\n\n${linkAgenda}`,
      link: `Olá! Para agendar seu horário, acesse nosso link:\n\n${linkAgenda}`,
    }

    const msg = encodeURIComponent(mensagens[tipo])
    window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank')
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

  const wppStyle = {
    padding: '7px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    border: '1px solid rgba(37,211,102,0.3)',
    background: 'rgba(37,211,102,0.08)',
    color: '#25D366',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  }

  const WppIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )

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
            const temTelefone = !!ag.cliente_telefone

            return (
              <div key={ag.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>{ag.cliente_nome}</p>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    {status === 'pendente' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
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
                        style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--danger)' }}>
                        Cancelar
                      </button>
                    )}

                    {/* Mensagens prontas WhatsApp */}
                    {temTelefone && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {status === 'pendente' && (
                          <button onClick={() => abrirWhatsApp(ag, 'confirmar')} style={wppStyle}>
                            <WppIcon /> Confirmar presença
                          </button>
                        )}
                        {(status === 'pendente' || status === 'confirmado') && (
                          <button onClick={() => abrirWhatsApp(ag, 'remarcar')} style={wppStyle}>
                            <WppIcon /> Remarcar
                          </button>
                        )}
                        {status === 'cancelado' && (
                          <button onClick={() => abrirWhatsApp(ag, 'remarcar')} style={wppStyle}>
                            <WppIcon /> Novo horário
                          </button>
                        )}
                        {status === 'realizado' && (
                          <button onClick={() => abrirWhatsApp(ag, 'link')} style={wppStyle}>
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
    </main>
  )
}