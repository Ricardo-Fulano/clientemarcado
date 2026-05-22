'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const menuItems = [
  { href: '/painel/agendamentos', icon: '📅', titulo: 'Agenda', desc: 'Veja e gerencie seus agendamentos', badge: true },
  { href: '/painel/atendimento', icon: '✅', titulo: 'Registrar atendimento', desc: 'Registre atendimentos presenciais na hora', badge: false },
  { href: '/painel/relatorio', icon: '📊', titulo: 'Relatório', desc: 'Receita, despesas e lucro por profissional', badge: false },
  { href: '/painel/financeiro', icon: '💰', titulo: 'Financeiro', desc: 'Controle suas despesas e receitas', badge: false },
  { href: '/painel/servicos', icon: '🛎️', titulo: 'Meus serviços', desc: 'Cadastre e edite seus serviços e preços', badge: false },
  { href: '/painel/profissionais', icon: '👥', titulo: 'Minha equipe', desc: 'Gerencie seus profissionais', badge: false },
  { href: '/painel/perfil', icon: '⚙️', titulo: 'Meu perfil', desc: 'Edite as informações do seu negócio', badge: false },
]

export default function Painel() {
  const [usuario, setUsuario] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [agendamentosHoje, setAgendamentosHoje] = useState(0)
  const [totalMes, setTotalMes] = useState(0)
  const [clientesAtendidos, setClientesAtendidos] = useState(0)
  const [novosPendentes, setNovosPendentes] = useState(0)
  const [novasNotificacoes, setNovasNotificacoes] = useState<any[]>([])
  const [checklist, setChecklist] = useState({
    temPerfil: false,
    temBanner: false,
    temServico: false,
    temProfissional: false,
    temWhatsapp: false,
    slug: '',
  })

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUsuario(data.user)

      const hoje = new Date().toISOString().split('T')[0]
      const mesAtual = new Date().toISOString().slice(0, 7)

      const { data: agsHoje } = await supabase.from('agendamentos').select('id')
        .eq('user_id', data.user.id).gte('data_hora', hoje + 'T00:00:00').lte('data_hora', hoje + 'T23:59:59')
      setAgendamentosHoje(agsHoje?.length || 0)

      const { data: agsMes } = await supabase.from('agendamentos').select('id')
        .eq('user_id', data.user.id).gte('data_hora', mesAtual + '-01')
      const { data: atsMes } = await supabase.from('atendimentos').select('id')
        .eq('user_id', data.user.id).gte('created_at', mesAtual + '-01')
      setTotalMes((agsMes?.length || 0) + (atsMes?.length || 0))

      const { data: clientesAgs } = await supabase.from('agendamentos').select('cliente_nome')
        .eq('user_id', data.user.id).gte('data_hora', mesAtual + '-01')
      const { data: clientesAts } = await supabase.from('atendimentos').select('cliente_nome')
        .eq('user_id', data.user.id).gte('created_at', mesAtual + '-01')
      const unicos = new Set([
        ...(clientesAgs || []).map(c => c.cliente_nome),
        ...(clientesAts || []).map(c => c.cliente_nome),
      ])
      setClientesAtendidos(unicos.size)

      // Notificações — agendamentos pendentes das últimas 24h
      const ontemISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: pendentes } = await supabase
        .from('agendamentos')
        .select('*, servicos(nome), profissionais(nome)')
        .eq('user_id', data.user.id)
        .eq('status', 'pendente')
        .gte('created_at', ontemISO)
        .order('created_at', { ascending: false })

      setNovosPendentes(pendentes?.length || 0)
      setNovasNotificacoes(pendentes || [])

      // Checklist
      const { data: perfil } = await supabase.from('perfis').select('*').eq('user_id', data.user.id).single()
      const { data: servicos } = await supabase.from('servicos').select('id').eq('user_id', data.user.id)
      const { data: profissionais } = await supabase.from('profissionais').select('id').eq('user_id', data.user.id)

      setChecklist({
        temPerfil: !!(perfil?.nome_negocio && perfil?.slug),
        temBanner: !!perfil?.banner_url,
        temServico: (servicos?.length || 0) > 0,
        temProfissional: (profissionais?.length || 0) > 0,
        temWhatsapp: !!perfil?.whatsapp,
        slug: perfil?.slug || '',
      })

      setLoading(false)
    }
    carregar()

    // Polling a cada 60 segundos
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return
      const ontemISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: pendentes } = await supabase
        .from('agendamentos')
        .select('*, servicos(nome), profissionais(nome)')
        .eq('user_id', data.user.id)
        .eq('status', 'pendente')
        .gte('created_at', ontemISO)
        .order('created_at', { ascending: false })
      setNovosPendentes(pendentes?.length || 0)
      setNovasNotificacoes(pendentes || [])
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function formatarHora(dataHora: string) {
    const d = new Date(dataHora)
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const itensChecklist = [
    { feito: checklist.temPerfil, texto: 'Cadastrar dados do negócio', href: '/painel/perfil' },
    { feito: checklist.temBanner, texto: 'Enviar imagem de capa', href: '/painel/perfil' },
    { feito: checklist.temServico, texto: 'Cadastrar primeiro serviço', href: '/painel/servicos' },
    { feito: checklist.temProfissional, texto: 'Cadastrar profissional', href: '/painel/profissionais' },
    { feito: checklist.temWhatsapp, texto: 'Adicionar WhatsApp do negócio', href: '/painel/perfil' },
  ]

  const totalFeitos = itensChecklist.filter(i => i.feito).length
  const totalItens = itensChecklist.length
  const checklistCompleto = totalFeitos === totalItens
  const progresso = Math.round((totalFeitos / totalItens) * 100)

  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)' }}>

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>ClienteMarcado</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {novosPendentes > 0 && (
            <a href="/painel/agendamentos" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: '999px', padding: '6px 14px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)' }}>
                {novosPendentes} novo{novosPendentes > 1 ? 's' : ''} agendamento{novosPendentes > 1 ? 's' : ''}
              </span>
            </a>
          )}
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{usuario?.email}</span>
          <button onClick={handleLogout} style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>Bem-vindo ao seu painel 👋</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Aqui está um resumo do seu negócio hoje</p>
        </div>

        {/* NOTIFICAÇÕES DE NOVOS AGENDAMENTOS */}
        {novasNotificacoes.length > 0 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {novosPendentes} novo{novosPendentes > 1 ? 's' : ''} agendamento{novosPendentes > 1 ? 's' : ''} pendente{novosPendentes > 1 ? 's' : ''}
              </p>
              <a href="/painel/agendamentos" style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Ver todos →</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {novasNotificacoes.slice(0, 3).map((ag) => (
                <a key={ag.id} href="/painel/agendamentos"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', borderRadius: '10px', padding: '10px 14px', textDecoration: 'none', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{ag.cliente_nome}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ag.servicos?.nome} · {ag.profissionais?.nome}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>{formatarHora(ag.data_hora)}</p>
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>Pendente</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* CHECKLIST */}
        {!checklistCompleto && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '24px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>Configure seu negócio</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{totalFeitos} de {totalItens} etapas concluídas</p>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)' }}>{progresso}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--surface)', borderRadius: '999px', marginBottom: '20px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: progresso + '%', background: 'var(--accent)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {itensChecklist.map((item) => (
                <a key={item.texto} href={item.feito ? '#' : item.href}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', cursor: item.feito ? 'default' : 'pointer' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', background: item.feito ? 'var(--success)' : 'var(--surface)', border: item.feito ? 'none' : '1px solid var(--border)', color: '#fff' }}>
                    {item.feito ? '✓' : ''}
                  </div>
                  <span style={{ fontSize: '13px', color: item.feito ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.feito ? 'line-through' : 'none', fontWeight: item.feito ? '400' : '500' }}>
                    {item.texto}
                  </span>
                  {!item.feito && (
                    <span style={{ fontSize: '11px', color: 'var(--accent)', marginLeft: 'auto' }}>Configurar →</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Checklist completo */}
        {checklistCompleto && checklist.slug && (
          <div style={{ background: 'var(--success-soft)', border: '1px solid var(--success-border)', borderRadius: '16px', padding: '20px 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--success)', marginBottom: '2px' }}>✅ Sua página está pronta para receber agendamentos!</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{'clientemarcado-3p4t.vercel.app/' + checklist.slug}</p>
            </div>
            <a href={'/' + checklist.slug} target="_blank"
              style={{ background: 'var(--success)', color: '#fff', fontWeight: '700', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px' }}>
              Ver página
            </a>
          </div>
        )}

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'Agendamentos hoje', valor: agendamentosHoje, cor: 'var(--accent)' },
            { label: 'Atendimentos este mês', valor: totalMes, cor: 'var(--success)' },
            { label: 'Clientes este mês', valor: clientesAtendidos, cor: '#A78BFA' },
          ].map((m) => (
            <div key={m.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, ' + m.cor + ', transparent)' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '500' }}>{m.label}</p>
              <p style={{ fontSize: '36px', fontWeight: 'bold', color: m.cor }}>{m.valor}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Menu</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {menuItems.map((item) => (
            <a key={item.href} href={item.href} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, position: 'relative' }}>
                {item.icon}
                {item.badge && novosPendentes > 0 && (
                  <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--accent)', color: '#fff', fontSize: '10px', fontWeight: '800', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--card)' }}>
                    {novosPendentes > 9 ? '9+' : novosPendentes}
                  </div>
                )}
              </div>
              <div>
                <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>{item.titulo}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}