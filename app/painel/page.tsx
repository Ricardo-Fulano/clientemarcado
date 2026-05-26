'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

// ── Design System ClienteMarcado ──
// BG: #07111F | Sidebar: #0B172A | Card: rgba(255,255,255,.055) | Border: rgba(255,255,255,.09)
// Azul: #2563EB | Verde: #22C55E | Amber: #F59E0B | Roxo: #7C3AED | Ciano: #06B6D4

const SIDEBAR_ITEMS = [
  { href:'/painel',              icon:'⊞',  label:'Início',        active:true  },
  { href:'/painel/agendamentos', icon:'📅', label:'Agenda'                      },
  { href:'/painel/clientes',     icon:'👥', label:'Clientes'                    },
  { href:'/painel/orcamentos',   icon:'📋', label:'Orçamentos'                  },
  { href:'/painel/financeiro',   icon:'💰', label:'Cobranças'                   },
  { href:'/painel/financeiro',   icon:'💳', label:'Pagamentos'                  },
  { href:'/painel/servicos',     icon:'🛎️', label:'Serviços'                    },
  { href:'/painel/profissionais',icon:'👤', label:'Profissionais'               },
  { href:'/painel/relatorio',    icon:'📊', label:'Relatórios'                  },
  { href:'/painel/perfil',       icon:'⚙️', label:'Configurações'              },
]

const AVATAR_COLORS = ['#2563EB','#7C3AED','#0891B2','#16A34A','#DC2626','#D97706','#DB2777']
function avatarColor(name: string) {
  return AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length]
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { overflow-x: hidden; width: 100%; }

  /* inputs dark */
  input, select, textarea { color-scheme: dark; }
  select option { background: #0F1E35; color: #fff; }

  /* ── Sidebar ── */
  .cm-sidebar {
    width: 220px; min-height: 100vh; background: #0B172A;
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; z-index: 30;
    border-right: 1px solid rgba(255,255,255,.06);
  }
  .cm-sidebar-logo {
    padding: 20px 16px 16px;
    border-bottom: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; gap: 8px;
  }
  .cm-logo-icon {
    width: 28px; height: 28px; border-radius: 8px; background: #2563EB;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .cm-sidebar nav { flex: 1; padding: 10px 8px; }
  .cm-nav-link {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 8px; margin-bottom: 2px;
    text-decoration: none; font-size: 13px; font-weight: 400;
    color: rgba(255,255,255,.55); transition: all .15s;
    border-left: 2px solid transparent;
  }
  .cm-nav-link:hover { background: rgba(255,255,255,.05); color: rgba(255,255,255,.85); }
  .cm-nav-link.active {
    background: rgba(37,99,235,.22); color: #93C5FD;
    font-weight: 600; border-left-color: #2563EB;
  }
  .cm-sidebar-footer {
    padding: 12px 16px; border-top: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; gap: 10px;
  }

  /* ── Mobile Header ── */
  .cm-mob-header {
    display: none; align-items: center; justify-content: space-between;
    padding: 0 16px; height: 56px; background: #0B172A;
    border-bottom: 1px solid rgba(255,255,255,.07);
    position: sticky; top: 0; z-index: 20; flex-shrink: 0;
  }

  /* ── Mobile Drawer ── */
  .cm-drawer {
    position: fixed; top: 0; left: 0; bottom: 0; width: 300px; max-width: 85vw;
    background: #0B172A; z-index: 50; transform: translateX(-100%);
    transition: transform .3s ease; display: flex; flex-direction: column;
    border-right: 1px solid rgba(255,255,255,.08);
  }
  .cm-drawer.open { transform: translateX(0); }
  .cm-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 49;
    opacity: 0; pointer-events: none; transition: opacity .3s;
  }
  .cm-overlay.open { opacity: 1; pointer-events: auto; }

  /* ── Layout ── */
  .cm-main { margin-left: 220px; flex: 1; min-height: 100vh; display: flex; flex-direction: column; }
  .cm-page { background: #07111F; min-height: 100vh; }
  .cm-body { max-width: 1280px; margin: 0 auto; padding: 28px 32px 64px; }

  /* ── Cards de atalho ── */
  .cm-atalho-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px;
  }
  .cm-atalho-card {
    background: var(--bg); border: 1px solid var(--bd); border-radius: 18px;
    padding: 20px; cursor: pointer; text-align: left; font-family: inherit;
    position: relative; transition: border-color .2s, box-shadow .2s; width: 100%;
  }
  .cm-atalho-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,.35); }
  .cm-atalho-icon {
    width: 48px; height: 48px; border-radius: 50%;
    background: var(--bg); border: 1px solid var(--bd);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 14px;
  }

  /* ── KPI cards ── */
  .cm-kpi-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px;
  }
  .cm-kpi-card {
    background: var(--bg); border: 1px solid var(--bd);
    border-radius: 16px; padding: 18px;
  }
  .cm-kpi-icon {
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--bg); border: 1px solid var(--bd);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; margin-bottom: 12px;
  }

  /* ── Tabela agenda ── */
  .cm-agenda-card {
    background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.09);
    border-radius: 16px; overflow: hidden; margin-bottom: 20px;
  }
  .cm-agenda-header {
    padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; justify-content: space-between;
  }
  .cm-ag-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 24px; border-bottom: 1px solid rgba(255,255,255,.04);
    transition: background .15s;
  }
  .cm-ag-row:last-child { border-bottom: none; }
  .cm-ag-row:hover { background: rgba(255,255,255,.03); }
  .cm-ag-hora {
    font-size: 12px; font-weight: 700; color: #93C5FD;
    background: rgba(37,99,235,.15); border: 1px solid rgba(37,99,235,.3);
    border-radius: 8px; padding: 4px 10px; flex-shrink: 0; min-width: 52px; text-align: center;
  }

  /* ── Checklist ── */
  .cm-checklist {
    background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.09);
    border-radius: 16px; padding: 20px; margin-bottom: 20px;
  }

  /* ── Ações rápidas ── */
  .cm-acoes-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  }
  .cm-acao-btn {
    background: var(--bg); border: 1px solid var(--bd); border-radius: 14px;
    padding: 16px; text-align: left; cursor: pointer; font-family: inherit;
    width: 100%; transition: border-color .2s;
  }
  .cm-acao-btn:hover { opacity: .85; }

  /* ── Responsivo ── */
  @media (max-width: 1023px) {
    .cm-sidebar { display: none !important; }
    .cm-main { margin-left: 0 !important; }
    .cm-mob-header { display: flex !important; }
    .cm-body { padding: 16px 16px 80px; }
    .cm-atalho-grid { grid-template-columns: 1fr 1fr !important; gap: 10px; }
    .cm-kpi-grid { grid-template-columns: 1fr 1fr !important; gap: 10px; }
    .cm-acoes-grid { grid-template-columns: 1fr 1fr !important; gap: 10px; }
    .cm-ag-row { padding: 12px 16px; }
    .cm-agenda-header { padding: 14px 16px; }
  }
  @media (max-width: 380px) {
    .cm-atalho-grid { grid-template-columns: 1fr !important; }
    .cm-kpi-grid { grid-template-columns: 1fr !important; }
    .cm-acoes-grid { grid-template-columns: 1fr !important; }
  }
`

export default function Painel() {
  const [userId, setUserId] = useState('')
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)

  // KPIs
  const [agendamentosHoje, setAgendamentosHoje] = useState(0)
  const [proximosHoje, setProximosHoje] = useState<any[]>([])
  const [totalMes, setTotalMes] = useState(0)
  const [faturamentoMes, setFaturamentoMes] = useState(0)
  const [orcamentosAbertos, setOrcamentosAbertos] = useState(0)
  const [totalAReceber, setTotalAReceber] = useState(0)
  const [novosPendentes, setNovosPendentes] = useState(0)

  // Checklist
  const [checklist, setChecklist] = useState({
    temPerfil: false, temBanner: false, temServico: false,
    temProfissional: false, temWhatsapp: false, slug: '',
  })

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)

    const hoje = new Date().toISOString().split('T')[0]
    const mes  = new Date().toISOString().slice(0, 7)

    const [
      { data: p },
      { data: agsHoje },
      { data: agsMes },
      { data: orcs },
    ] = await Promise.all([
      supabase.from('perfis').select('*').eq('user_id', user.id).single(),
      supabase.from('agendamentos').select('*, servicos(nome,preco), profissionais(nome)')
        .eq('user_id', user.id)
        .gte('data_hora', hoje + 'T00:00:00')
        .lte('data_hora', hoje + 'T23:59:59')
        .neq('status', 'cancelado')
        .order('data_hora', { ascending: true }),
      supabase.from('agendamentos').select('servicos(preco)')
        .eq('user_id', user.id)
        .gte('data_hora', mes + '-01')
        .neq('status', 'cancelado'),
      supabase.from('orcamentos').select('status, saldo_restante')
        .eq('user_id', user.id),
    ])

    setPerfil(p)
    setAgendamentosHoje(agsHoje?.length || 0)
    setProximosHoje(agsHoje || [])

    const fat = (agsMes || []).reduce((acc: number, ag: any) => {
      return acc + (parseFloat(ag.servicos?.preco || '0') || 0)
    }, 0)
    setFaturamentoMes(fat)
    setTotalMes(agsMes?.length || 0)

    const abertos = (orcs || []).filter(o => !['Pago','Finalizado','Cancelado'].includes(o.status))
    setOrcamentosAbertos(abertos.length)
    setTotalAReceber(abertos.reduce((a, o) => a + (o.saldo_restante || 0), 0))

    const pendentes = (agsHoje || []).filter((a: any) => a.status === 'pendente')
    setNovosPendentes(pendentes.length)

    const [{ data: servs }, { data: profs }] = await Promise.all([
      supabase.from('servicos').select('id').eq('user_id', user.id),
      supabase.from('profissionais').select('id').eq('user_id', user.id),
    ])
    setChecklist({
      temPerfil: !!(p?.nome_negocio && p?.slug),
      temBanner: !!p?.banner_url,
      temServico: (servs?.length || 0) > 0,
      temProfissional: (profs?.length || 0) > 0,
      temWhatsapp: !!p?.whatsapp,
      slug: p?.slug || '',
    })

    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function copiarLink() {
    navigator.clipboard.writeText(window.location.origin + '/' + checklist.slug)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  function fmtHora(s: string) {
    return new Date(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  function fmtBRL(v: number) {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  }

  const itensCheck = [
    { feito: checklist.temPerfil,      texto: 'Cadastrar dados do negócio',    href: '/painel/perfil' },
    { feito: checklist.temBanner,      texto: 'Enviar imagem de capa',         href: '/painel/perfil' },
    { feito: checklist.temServico,     texto: 'Cadastrar primeiro serviço',    href: '/painel/servicos' },
    { feito: checklist.temProfissional,texto: 'Cadastrar profissional',        href: '/painel/profissionais' },
    { feito: checklist.temWhatsapp,    texto: 'Adicionar WhatsApp do negócio', href: '/painel/perfil' },
  ]
  const totalFeitos = itensCheck.filter(i => i.feito).length
  const checkOk = totalFeitos === itensCheck.length
  const progresso = Math.round((totalFeitos / itensCheck.length) * 100)

  const nomePrimeiro = perfil?.nome_negocio || ''
  const inicial = (nomePrimeiro || 'N').charAt(0).toUpperCase()
  const ac = avatarColor(nomePrimeiro)

  const Sidebar = () => (
    <aside className="cm-sidebar">
      <div className="cm-sidebar-logo">
        <div className="cm-logo-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>ClienteMarcado</span>
      </div>
      <nav>
        {SIDEBAR_ITEMS.map(item => (
          <Link key={item.label} href={item.href}
            className={'cm-nav-link' + (item.active ? ' active' : '')}>
            <span style={{ fontSize: '15px' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="cm-sidebar-footer">
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {inicial}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomePrimeiro || 'Meu negócio'}</p>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,.4)', marginTop: '1px' }}>Administrador</p>
        </div>
      </div>
    </aside>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#07111F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <p style={{ color: '#4B5563', fontSize: '14px' }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07111F', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Overlay mobile */}
      <div className={`cm-overlay${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* Drawer mobile */}
      <div className={`cm-drawer${mobileOpen ? ' open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>ClienteMarcado</span>
          <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>×</button>
        </div>
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {SIDEBAR_ITEMS.map(item => (
            <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)}
              className={'cm-nav-link' + (item.active ? ' active' : '')}
              style={{ fontSize: '14px', padding: '11px 14px' }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{inicial}</div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{nomePrimeiro || 'Meu negócio'}</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)' }}>Administrador</p>
          </div>
        </div>
      </div>

      <Sidebar />

      <div className="cm-main">
        {/* Mobile Header */}
        <div className="cm-mob-header">
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ display: 'block', width: '22px', height: '2px', background: 'rgba(255,255,255,.8)', borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: 'rgba(255,255,255,.8)', borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '16px', height: '2px', background: 'rgba(255,255,255,.8)', borderRadius: '2px' }} />
          </button>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>ClienteMarcado</span>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'rgba(255,255,255,.5)', fontFamily: 'inherit' }}>Sair</button>
        </div>

        {/* ══ PÁGINA ══ */}
        <div className="cm-page">
        <div className="cm-body">

          {/* Topo */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '4px' }}>
                {nomePrimeiro ? `Olá, ${nomePrimeiro} 👋` : 'Painel ClienteMarcado'}
              </h1>
              <p style={{ fontSize: '14px', color: '#64748B' }}>Acompanhe sua agenda, clientes, cobranças e retornos em um só lugar.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link href="/painel/agendamentos" style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(37,99,235,.4)', whiteSpace: 'nowrap' }}>
                📅 Novo agendamento
              </Link>
              <Link href="/painel/orcamentos" style={{ background: 'rgba(255,255,255,.07)', color: '#CBD5E1', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                📋 Novo orçamento
              </Link>
            </div>
          </div>

          {/* Status página pública */}
          {checkOk && checklist.slug && (
            <div style={{ background: 'rgba(22,163,74,.1)', border: '1px solid rgba(22,163,74,.25)', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', flexShrink: 0, boxShadow: '0 0 6px rgba(34,197,94,.6)' }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#4ADE80', marginBottom: '2px' }}>Sua página está ativa</p>
                  <p style={{ fontSize: '12px', color: '#4B5563' }}>{typeof window !== 'undefined' ? window.location.origin : ''}/{checklist.slug}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <a href={'/' + checklist.slug} target="_blank" rel="noopener noreferrer"
                  style={{ background: '#22C55E', color: '#fff', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  🔗 Ver página
                </a>
                <button onClick={copiarLink}
                  style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: linkCopiado ? '#4ADE80' : '#94A3B8', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {linkCopiado ? '✓ Copiado!' : '📋 Copiar link'}
                </button>
              </div>
            </div>
          )}

          {/* Notif agendamentos pendentes */}
          {novosPendentes > 0 && (
            <div style={{ background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.25)', borderRadius: '14px', padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#93C5FD' }}>
                  {novosPendentes} agendamento{novosPendentes > 1 ? 's' : ''} pendente{novosPendentes > 1 ? 's' : ''} hoje
                </p>
              </div>
              <Link href="/painel/agendamentos" style={{ fontSize: '12px', fontWeight: 700, color: '#3B82F6', textDecoration: 'none' }}>Ver todos →</Link>
            </div>
          )}

          {/* CARDS ATALHOS — 4 colunas desktop / 2x2 mobile */}
          <div className="cm-atalho-grid">
            {[
              { label: 'Agenda',       sub: 'Veja e gerencie seus horários.',        icon: '📅', href: '/painel/agendamentos', cor: '#3B82F6', bg: 'rgba(59,130,246,.1)',  bd: 'rgba(59,130,246,.2)'  },
              { label: 'Orçamentos',   sub: 'Crie e acompanhe orçamentos.',         icon: '📋', href: '/painel/orcamentos',   cor: '#7C3AED', bg: 'rgba(124,58,237,.1)', bd: 'rgba(124,58,237,.2)' },
              { label: 'Cobranças',    sub: 'Gerencie cobranças e pagamentos.',     icon: '💰', href: '/painel/financeiro',   cor: '#0891B2', bg: 'rgba(8,145,178,.1)',  bd: 'rgba(8,145,178,.2)'  },
              { label: 'Clientes',     sub: 'Seus clientes em um só lugar.',        icon: '👥', href: '/painel/clientes',    cor: '#16A34A', bg: 'rgba(22,163,74,.1)',  bd: 'rgba(22,163,74,.2)'  },
            ].map(a => (
              <Link key={a.label} href={a.href}
                className="cm-atalho-card"
                style={{ '--bg': a.bg, '--bd': a.bd, textDecoration: 'none' } as any}>
                <div className="cm-atalho-icon" style={{ '--bg': a.bg, '--bd': a.bd } as any}>
                  <span style={{ fontSize: '22px' }}>{a.icon}</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '5px' }}>{a.label}</p>
                <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.45' }}>{a.sub}</p>
                <span style={{ position: 'absolute', top: '18px', right: '18px', color: a.cor, fontSize: '18px', opacity: .6 }}>→</span>
              </Link>
            ))}
          </div>

          {/* KPIs — 4 colunas desktop / 2x2 mobile */}
          <div className="cm-kpi-grid">
            {[
              { label: 'Atendimentos hoje',   valor: agendamentosHoje,            fmt: 'n',   icon: '📅', cor: '#3B82F6', bg: 'rgba(59,130,246,.1)',  bd: 'rgba(59,130,246,.2)'  },
              { label: 'Orçamentos em aberto',valor: orcamentosAbertos,           fmt: 'n',   icon: '📋', cor: '#7C3AED', bg: 'rgba(124,58,237,.1)', bd: 'rgba(124,58,237,.2)' },
              { label: 'Total a receber',     valor: totalAReceber,               fmt: 'brl', icon: '⏳', cor: '#F59E0B', bg: 'rgba(245,158,11,.1)',  bd: 'rgba(245,158,11,.2)'  },
              { label: 'Recebido no mês',     valor: faturamentoMes,              fmt: 'brl', icon: '✅', cor: '#22C55E', bg: 'rgba(34,197,94,.1)',   bd: 'rgba(34,197,94,.2)'   },
            ].map(m => (
              <div key={m.label} className="cm-kpi-card" style={{ '--bg': m.bg, '--bd': m.bd } as any}>
                <div className="cm-kpi-icon" style={{ '--bg': m.bg, '--bd': m.bd } as any}>
                  <span>{m.icon}</span>
                </div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>{m.label}</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: m.cor, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {m.fmt === 'brl' ? 'R$ ' + fmtBRL(m.valor as number) : m.valor}
                </p>
              </div>
            ))}
          </div>

          {/* Checklist de configuração */}
          {!checkOk && (
            <div className="cm-checklist">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Configure seu negócio</p>
                  <p style={{ fontSize: '12px', color: '#64748B' }}>{totalFeitos} de {itensCheck.length} etapas concluídas</p>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB' }}>{progresso}%</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,.07)', borderRadius: '999px', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '999px', background: '#2563EB', width: progresso + '%', transition: 'width .4s ease' }} />
              </div>
              {itensCheck.map(item => (
                <Link key={item.texto} href={item.feito ? '#' : item.href}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', textDecoration: 'none' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: item.feito ? '#22C55E' : 'transparent', border: item.feito ? 'none' : '1px solid rgba(255,255,255,.15)', color: item.feito ? '#fff' : 'transparent' }}>
                    {item.feito ? '✓' : ''}
                  </div>
                  <span style={{ fontSize: '13px', flex: 1, color: item.feito ? '#4B5563' : '#CBD5E1', fontWeight: item.feito ? 400 : 500, textDecoration: item.feito ? 'line-through' : 'none' }}>
                    {item.texto}
                  </span>
                  {!item.feito && <span style={{ fontSize: '11px', color: '#2563EB' }}>Configurar →</span>}
                </Link>
              ))}
            </div>
          )}

          {/* Agenda do dia */}
          <div className="cm-agenda-card">
            <div className="cm-agenda-header">
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Agenda de hoje</p>
                <p style={{ fontSize: '12px', color: '#4B5563' }}>
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </p>
              </div>
              <Link href="/painel/agendamentos" style={{ fontSize: '12px', fontWeight: 700, color: '#3B82F6', textDecoration: 'none' }}>Ver agenda completa →</Link>
            </div>

            {proximosHoje.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(37,99,235,.12)', border: '1px solid rgba(37,99,235,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 12px' }}>📅</div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Nenhum atendimento hoje</p>
                <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.5, marginBottom: '16px' }}>Quando houver horários marcados, eles aparecerão aqui.</p>
                <Link href="/painel/agendamentos" style={{ background: '#2563EB', color: '#fff', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  + Novo agendamento
                </Link>
              </div>
            ) : (
              <>
                {proximosHoje.slice(0, 6).map((ag: any) => {
                  const stCfg = ag.status === 'confirmado'
                    ? { bg: 'rgba(34,197,94,.12)', c: '#4ADE80', bd: 'rgba(34,197,94,.25)', txt: 'Confirmado' }
                    : ag.status === 'pendente'
                    ? { bg: 'rgba(37,99,235,.12)', c: '#93C5FD', bd: 'rgba(37,99,235,.25)', txt: 'Pendente' }
                    : { bg: 'rgba(255,255,255,.06)', c: '#94A3B8', bd: 'rgba(255,255,255,.1)', txt: ag.status || 'Agendado' }
                  const ac2 = avatarColor(ag.cliente_nome || 'A')
                  return (
                    <div key={ag.id} className="cm-ag-row">
                      <div className="cm-ag-hora">{fmtHora(ag.data_hora)}</div>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ac2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {(ag.cliente_nome || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ag.cliente_nome || '—'}</p>
                        <p style={{ fontSize: '11px', color: '#4B5563' }}>{ag.servicos?.nome}{ag.profissionais?.nome ? ' · ' + ag.profissionais.nome : ''}</p>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', background: stCfg.bg, color: stCfg.c, border: `1px solid ${stCfg.bd}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {stCfg.txt}
                      </span>
                    </div>
                  )
                })}
                {proximosHoje.length > 6 && (
                  <div style={{ padding: '12px 24px', textAlign: 'center' }}>
                    <Link href="/painel/agendamentos" style={{ fontSize: '13px', color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}>
                      Ver todos os {proximosHoje.length} atendimentos →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Ações rápidas */}
          <div style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: '14px' }}>Ações rápidas</p>
            <div className="cm-acoes-grid">
              {[
                { label: 'Novo cliente',        icon: '👤', href: '/painel/clientes',    bg: 'rgba(8,145,178,.1)',  bd: 'rgba(8,145,178,.2)'  },
                { label: 'Novo serviço',         icon: '🛎️', href: '/painel/servicos',    bg: 'rgba(124,58,237,.1)',bd: 'rgba(124,58,237,.2)' },
                { label: 'Novo profissional',    icon: '👥', href: '/painel/profissionais',bg:'rgba(16,185,129,.1)', bd: 'rgba(16,185,129,.2)' },
                { label: 'Novo orçamento',       icon: '📋', href: '/painel/orcamentos',  bg: 'rgba(37,99,235,.1)', bd: 'rgba(37,99,235,.2)'  },
                { label: 'Registrar pagamento',  icon: '💳', href: '/painel/financeiro',  bg: 'rgba(34,197,94,.1)', bd: 'rgba(34,197,94,.2)'  },
                { label: 'Configurar horários',  icon: '⚙️', href: '/painel/perfil',      bg: 'rgba(245,158,11,.1)',bd: 'rgba(245,158,11,.2)' },
                { label: 'Bloqueios de agenda',  icon: '🚫', href: '/painel/bloqueios',   bg: 'rgba(239,68,68,.1)', bd: 'rgba(239,68,68,.2)'  },
                { label: 'Relatórios',           icon: '📊', href: '/painel/relatorio',   bg: 'rgba(6,182,212,.1)', bd: 'rgba(6,182,212,.2)'  },
              ].map(a => (
                <Link key={a.label} href={a.href}
                  className="cm-acao-btn"
                  style={{ '--bg': a.bg, '--bd': a.bd, textDecoration: 'none' } as any}>
                  <span style={{ fontSize: '20px', display: 'block', marginBottom: '10px' }}>{a.icon}</span>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff', lineHeight: '1.3' }}>{a.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Botão sair — desktop */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleLogout}
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#4B5563', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color .15s' }}>
              Sair da conta
            </button>
          </div>

        </div>
        </div>
      </div>
    </div>
  )
}
