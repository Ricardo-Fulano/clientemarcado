'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const menuItems = [
  { href: '/painel/agendamentos', icon: '📅', titulo: 'Agenda', desc: 'Veja e gerencie seus agendamentos' },
  { href: '/painel/atendimento', icon: '✅', titulo: 'Registrar atendimento', desc: 'Registre atendimentos presenciais na hora' },
  { href: '/painel/relatorio', icon: '📊', titulo: 'Relatório', desc: 'Receita, despesas e lucro por profissional' },
  { href: '/painel/financeiro', icon: '💰', titulo: 'Financeiro', desc: 'Controle suas despesas e receitas' },
  { href: '/painel/servicos', icon: '🛎️', titulo: 'Meus serviços', desc: 'Cadastre e edite seus serviços e preços' },
  { href: '/painel/profissionais', icon: '👥', titulo: 'Minha equipe', desc: 'Gerencie seus profissionais' },
  { href: '/painel/perfil', icon: '⚙️', titulo: 'Meu perfil', desc: 'Edite as informações do seu negócio' },
]

export default function Painel() {
  const [usuario, setUsuario] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [agendamentosHoje, setAgendamentosHoje] = useState(0)
  const [totalMes, setTotalMes] = useState(0)
  const [clientesAtendidos, setClientesAtendidos] = useState(0)
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
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
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

        {/* CHECKLIST — só aparece se não completou tudo */}
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

            {/* Barra de progresso */}
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
            <a key={item.href} href={item.href} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '16px' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {item.icon}
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