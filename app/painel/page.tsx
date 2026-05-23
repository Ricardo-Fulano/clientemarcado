'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const menuItems = [
  { href: '/painel/agendamentos', icon: '📅', titulo: 'Agenda', desc: 'Veja, confirme e cancele horários.', badge: true },
  { href: '/painel/atendimento', icon: '✅', titulo: 'Registrar atendimento', desc: 'Adicione atendimentos feitos presencialmente.', badge: false },
  { href: '/painel/relatorio', icon: '📊', titulo: 'Relatório', desc: 'Acompanhe receita, despesas e lucro.', badge: false },
  { href: '/painel/financeiro', icon: '💰', titulo: 'Financeiro', desc: 'Controle entradas, saídas e saldo.', badge: false },
  { href: '/painel/servicos', icon: '🛎️', titulo: 'Meus serviços', desc: 'Cadastre serviços, preços e duração.', badge: false },
  { href: '/painel/profissionais', icon: '👥', titulo: 'Minha equipe', desc: 'Gerencie profissionais e horários.', badge: false },
  { href: '/painel/bloqueios', icon: '🚫', titulo: 'Bloqueio de horários', desc: 'Bloqueie folgas, almoço ou ausência.', badge: false },
  { href: '/painel/perfil', icon: '⚙️', titulo: 'Meu perfil', desc: 'Edite página, banner, WhatsApp e link.', badge: false },
]

export default function Painel() {
  const [usuario, setUsuario] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [agendamentosHoje, setAgendamentosHoje] = useState(0)
  const [proximosHoje, setProximosHoje] = useState<any[]>([])
  const [totalMes, setTotalMes] = useState(0)
  const [faturamentoMes, setFaturamentoMes] = useState(0)
  const [novosPendentes, setNovosPendentes] = useState(0)
  const [novasNotificacoes, setNovasNotificacoes] = useState<any[]>([])
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [checklist, setChecklist] = useState({
    temPerfil: false, temBanner: false, temServico: false,
    temProfissional: false, temWhatsapp: false, slug: '',
  })

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUsuario(data.user)

      const hoje = new Date().toISOString().split('T')[0]
      const mesAtual = new Date().toISOString().slice(0, 7)

      // Agendamentos hoje
      const { data: agsHoje } = await supabase.from('agendamentos')
        .select('*, servicos(nome, preco), profissionais(nome)')
        .eq('user_id', data.user.id)
        .gte('data_hora', hoje + 'T00:00:00')
        .lte('data_hora', hoje + 'T23:59:59')
        .neq('status', 'cancelado')
        .order('data_hora', { ascending: true })
      setAgendamentosHoje(agsHoje?.length || 0)
      setProximosHoje(agsHoje || [])

      // Total mês
      const { data: agsMes } = await supabase.from('agendamentos').select('id')
        .eq('user_id', data.user.id).gte('data_hora', mesAtual + '-01')
      const { data: atsMes } = await supabase.from('atendimentos').select('id')
        .eq('user_id', data.user.id).gte('created_at', mesAtual + '-01')
      setTotalMes((agsMes?.length || 0) + (atsMes?.length || 0))

      // Faturamento mês (soma preços dos serviços agendados)
      const { data: agsPreco } = await supabase.from('agendamentos')
        .select('servicos(preco)')
        .eq('user_id', data.user.id)
        .gte('data_hora', mesAtual + '-01')
        .neq('status', 'cancelado')
      const fat = (agsPreco || []).reduce((acc: number, ag: any) => {
        const p = parseFloat(ag.servicos?.preco || '0')
        return acc + (isNaN(p) ? 0 : p)
      }, 0)
      setFaturamentoMes(fat)

      // Notificações
      const ontemISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: pendentes } = await supabase
        .from('agendamentos')
        .select('*, servicos(nome), profissionais(nome)')
        .eq('user_id', data.user.id).eq('status', 'pendente')
        .gte('created_at', ontemISO)
        .order('created_at', { ascending: false })
      setNovosPendentes(pendentes?.length || 0)
      setNovasNotificacoes(pendentes || [])

      // Perfil
      const { data: perfil } = await supabase.from('perfis').select('*').eq('user_id', data.user.id).single()
      const { data: servicos } = await supabase.from('servicos').select('id').eq('user_id', data.user.id)
      const { data: profissionais } = await supabase.from('profissionais').select('id').eq('user_id', data.user.id)
      setNomeNegocio(perfil?.nome_negocio || '')
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

    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return
      const ontemISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: pendentes } = await supabase
        .from('agendamentos').select('*, servicos(nome), profissionais(nome)')
        .eq('user_id', data.user.id).eq('status', 'pendente')
        .gte('created_at', ontemISO).order('created_at', { ascending: false })
      setNovosPendentes(pendentes?.length || 0)
      setNovasNotificacoes(pendentes || [])
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function copiarLink() {
    const url = window.location.origin + '/' + checklist.slug
    navigator.clipboard.writeText(url)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  function formatarHora(dataHora: string) {
    return new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const itensChecklist = [
    { feito: checklist.temPerfil, texto: 'Cadastrar dados do negócio', href: '/painel/perfil' },
    { feito: checklist.temBanner, texto: 'Enviar imagem de capa', href: '/painel/perfil' },
    { feito: checklist.temServico, texto: 'Cadastrar primeiro serviço', href: '/painel/servicos' },
    { feito: checklist.temProfissional, texto: 'Cadastrar profissional', href: '/painel/profissionais' },
    { feito: checklist.temWhatsapp, texto: 'Adicionar WhatsApp do negócio', href: '/painel/perfil' },
  ]
  const totalFeitos = itensChecklist.filter(i => i.feito).length
  const checklistCompleto = totalFeitos === itensChecklist.length
  const progresso = Math.round((totalFeitos / itensChecklist.length) * 100)
  const urlPublica = checklist.slug ? (typeof window !== 'undefined' ? window.location.origin : '') + '/' + checklist.slug : ''

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .pg {
      min-height: 100vh;
      background: #08080A;
      color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    /* ── NAV ── */
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px;
      height: 56px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(9,9,11,0.96);
      backdrop-filter: blur(10px);
      position: sticky; top: 0; z-index: 20;
      gap: 12px;
    }
    .nav-logo {
      display: flex; align-items: center; gap: 8px; text-decoration: none; flex-shrink: 0;
    }
    .nav-logo-icon {
      width: 28px; height: 28px; border-radius: 8px;
      background: #3B82F6;
      display: flex; align-items: center; justify-content: center;
    }
    .nav-logo-nome { font-size: 15px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; }
    .nav-negocio {
      font-size: 12px; color: #4B5563; font-weight: 500;
      display: none;
    }
    @media (min-width: 640px) { .nav-negocio { display: block; } }

    .nav-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .nav-badge {
      display: flex; align-items: center; gap: 6px;
      background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25);
      border-radius: 999px; padding: 5px 12px; text-decoration: none;
    }
    .nav-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #3B82F6; flex-shrink: 0; }
    .nav-badge-txt { font-size: 12px; font-weight: 700; color: #3B82F6; }
    .nav-email { font-size: 12px; color: #4B5563; display: none; }
    @media (min-width: 640px) { .nav-email { display: block; } }
    .btn-sair {
      font-size: 12px; font-weight: 600; color: #6B7280;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px; padding: 6px 12px; cursor: pointer;
      transition: color 0.15s, background 0.15s;
      font-family: inherit;
      display: flex; align-items: center; gap: 5px;
    }
    .btn-sair:hover { color: #F1F5F9; background: rgba(255,255,255,0.08); }

    /* ── BODY ── */
    .body { max-width: 1040px; margin: 0 auto; padding: 28px 16px 56px; }
    @media (min-width: 720px) { .body { max-width: 1140px; padding: 36px 32px 64px; } }
    @media (min-width: 1200px) { .body { max-width: 1320px; padding: 40px 56px 72px; } }

    /* ── BOAS-VINDAS ── */
    .boas-vindas { margin-bottom: 28px; }
    .boas-vindas h1 {
      font-size: 16px; font-weight: 800; color: #F1F5F9;
      letter-spacing: -0.01em; margin-bottom: 4px;
      line-height: 1.3;
    }
    @media (min-width: 480px) { .boas-vindas h1 { font-size: 20px; letter-spacing: -0.02em; } }
    @media (min-width: 640px) { .boas-vindas h1 { font-size: 26px; } }
    .boas-vindas p { font-size: 14px; color: #6B7280; line-height: 1.5; }

    /* ── STATUS PAGE ── */
    .status-pagina {
      background: rgba(16,35,22,0.8);
      border: 1px solid rgba(34,197,94,0.2);
      border-radius: 14px;
      padding: 12px 14px;
      margin-bottom: 20px;
      display: flex; flex-direction: column; gap: 10px;
    }
    @media (min-width: 640px) {
      .status-pagina {
        flex-direction: row; align-items: center; justify-content: space-between;
        padding: 16px 20px; border-radius: 16px;
      }
    }
    .status-info { display: flex; align-items: flex-start; gap: 10px; }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #22C55E;
      flex-shrink: 0; margin-top: 5px;
      box-shadow: 0 0 6px rgba(34,197,94,0.6);
    }
    .status-titulo { font-size: 13px; font-weight: 700; color: #22C55E; margin-bottom: 3px; }
    .status-url { font-size: 12px; color: #4B5563; word-break: break-all; }
    .status-btns { display: flex; gap: 8px; flex-shrink: 0; width: 100%; }
    @media (min-width: 640px) { .status-btns { width: auto; } }
    .status-btns a, .status-btns button { flex: 1; justify-content: center; }
    @media (min-width: 640px) { .status-btns a, .status-btns button { flex: none; } }
    .btn-ver-pagina {
      display: inline-flex; align-items: center; gap: 6px;
      background: #22C55E; color: #fff; font-weight: 700; font-size: 12px;
      padding: 8px 16px; border-radius: 8px; text-decoration: none;
      transition: background 0.15s;
    }
    .btn-ver-pagina:hover { background: #16A34A; }
    .btn-copiar-link {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.06); color: #9CA3AF; font-weight: 600; font-size: 12px;
      padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
      cursor: pointer; transition: all 0.15s; font-family: inherit;
    }
    .btn-copiar-link:hover { background: rgba(255,255,255,0.1); color: #F1F5F9; }
    .btn-copiar-link.copiado { color: #22C55E; border-color: rgba(34,197,94,0.3); }

    /* ── NOTIFICAÇÕES ── */
    .notif-bloco {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(59,130,246,0.2);
      border-radius: 16px; padding: 18px 20px; margin-bottom: 20px;
      position: relative; overflow: hidden;
    }
    .notif-topo-bar {
      position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, #3B82F6, transparent);
    }
    .notif-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
    }
    .notif-header-left { display: flex; align-items: center; gap: 8px; }
    .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #3B82F6; }
    .notif-titulo { font-size: 13px; font-weight: 700; color: #F1F5F9; }
    .notif-ver { font-size: 12px; color: #3B82F6; text-decoration: none; font-weight: 600; }
    .notif-item {
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px; padding: 10px 14px; text-decoration: none;
      margin-bottom: 6px; gap: 8px; flex-wrap: wrap;
      transition: border-color 0.15s;
    }
    .notif-item:hover { border-color: rgba(59,130,246,0.3); }
    .notif-item:last-child { margin-bottom: 0; }
    .notif-nome { font-size: 13px; font-weight: 600; color: #F1F5F9; margin-bottom: 2px; }
    .notif-detalhe { font-size: 12px; color: #6B7280; }
    .notif-hora { font-size: 12px; font-weight: 600; color: #3B82F6; margin-bottom: 3px; text-align: right; }
    .badge-pendente {
      font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
      background: rgba(59,130,246,0.12); color: #3B82F6;
    }

    /* ── CHECKLIST ── */
    .checklist-bloco {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(59,130,246,0.15);
      border-radius: 16px; padding: 20px; margin-bottom: 20px;
      position: relative; overflow: hidden;
    }
    .checklist-bar-topo {
      position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, #3B82F6, transparent);
    }
    .checklist-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 14px;
    }
    .checklist-titulo { font-size: 14px; font-weight: 700; color: #F1F5F9; margin-bottom: 2px; }
    .checklist-sub { font-size: 12px; color: #6B7280; }
    .checklist-pct { font-size: 13px; font-weight: 700; color: #3B82F6; }
    .progresso-track {
      height: 5px; background: rgba(255,255,255,0.06);
      border-radius: 999px; margin-bottom: 16px; overflow: hidden;
    }
    .progresso-fill { height: 100%; border-radius: 999px; background: #3B82F6; transition: width 0.4s ease; }
    .checklist-item {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; padding: 6px 0;
    }
    .check-circulo {
      width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;
    }
    .check-circulo.feito { background: #22C55E; color: #fff; }
    .check-circulo.pendente { background: transparent; border: 1px solid rgba(255,255,255,0.15); }
    .check-texto { font-size: 13px; flex: 1; }
    .check-acao { font-size: 11px; color: #3B82F6; }

    .metricas {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px; margin-bottom: 20px;
    }
    @media (min-width: 480px) { .metricas { grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; } }

    .metrica-card {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px; padding: 14px 16px;
      position: relative; overflow: hidden;
      display: flex; align-items: center; gap: 14px;
    }
    @media (min-width: 480px) {
      .metrica-card { flex-direction: column; align-items: flex-start; gap: 0; padding: 20px; border-radius: 16px; }
    }
    .metrica-accent-line {
      position: absolute; top: 0; left: 0; height: 100%; width: 3px;
    }
    @media (min-width: 480px) {
      .metrica-accent-line { height: 2px; width: auto; right: 0; bottom: auto; }
    }
    .metrica-label { font-size: 12px; color: #6B7280; font-weight: 500; flex: 1; }
    @media (min-width: 480px) { .metrica-label { margin-bottom: 10px; flex: none; } }
    .metrica-valor { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; flex-shrink: 0; }
    @media (min-width: 480px) { .metrica-valor { font-size: 34px; } }
    .metrica-sub { font-size: 11px; color: #374151; margin-top: 6px; display: none; }
    @media (min-width: 480px) { .metrica-sub { display: block; } }

    /* ── PRÓXIMOS ATENDIMENTOS ── */
    .proximos-bloco {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px; padding: 20px; margin-bottom: 28px;
    }
    .proximos-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
    }
    .proximos-titulo { font-size: 14px; font-weight: 700; color: #F1F5F9; }
    .proximos-ver { font-size: 12px; color: #3B82F6; text-decoration: none; font-weight: 600; }
    .proximos-ver:hover { text-decoration: underline; }
    .proximos-vazio {
      text-align: center; padding: 24px 0;
      font-size: 13px; color: #374151;
    }
    .ag-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .ag-item:last-child { border-bottom: none; padding-bottom: 0; }
    .ag-hora {
      font-size: 12px; font-weight: 700; color: #3B82F6;
      background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);
      border-radius: 7px; padding: 4px 8px; flex-shrink: 0; min-width: 48px; text-align: center;
    }
    .ag-nome { font-size: 13px; font-weight: 600; color: #F1F5F9; margin-bottom: 2px; }
    .ag-detalhe { font-size: 12px; color: #6B7280; }
    .ag-status {
      margin-left: auto; flex-shrink: 0;
      font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 999px;
    }
    .status-confirmado { background: rgba(34,197,94,0.1); color: #22C55E; border: 1px solid rgba(34,197,94,0.2); }
    .status-pendente   { background: rgba(59,130,246,0.1); color: #3B82F6; border: 1px solid rgba(59,130,246,0.2); }
    .status-outro      { background: rgba(255,255,255,0.06); color: #9CA3AF; border: 1px solid rgba(255,255,255,0.08); }

    /* ── MENU ── */
    .menu-label {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.09em; color: #374151; margin-bottom: 14px;
    }
    .menu-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    @media (min-width: 480px) { .menu-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 800px) { .menu-grid { grid-template-columns: repeat(4, 1fr); } }

    .menu-card {
      display: flex; align-items: center; gap: 14px;
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px; padding: 16px;
      text-decoration: none; position: relative;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .menu-card:hover {
      border-color: rgba(59,130,246,0.35);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .menu-icon-wrap {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
      background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; position: relative;
    }
    .menu-badge {
      position: absolute; top: -5px; right: -5px;
      background: #3B82F6; color: #fff; font-size: 9px; font-weight: 800;
      width: 16px; height: 16px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #08080A;
    }
    .menu-titulo { font-size: 13px; font-weight: 700; color: #F1F5F9; margin-bottom: 2px; }
    .menu-desc   { font-size: 11px; color: #6B7280; line-height: 1.4; }
    .menu-arrow  { margin-left: auto; font-size: 16px; color: #374151; flex-shrink: 0; }
  `

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#08080A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ color: '#4B5563', fontSize: '14px' }}>Carregando...</p>
    </div>
  )

  return (
    <div className="pg">
      <style>{css}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <a href="/" className="nav-logo">
            <div className="nav-logo-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span className="nav-logo-nome">ClienteMarcado</span>
          </a>
          {nomeNegocio && (
            <>
              <span style={{ color: '#1F2937', fontSize: '14px' }}>|</span>
              <span className="nav-negocio">{nomeNegocio}</span>
            </>
          )}
        </div>

        <div className="nav-right">
          {novosPendentes > 0 && (
            <a href="/painel/agendamentos" className="nav-badge">
              <span className="nav-badge-dot" />
              <span className="nav-badge-txt">{novosPendentes} novo{novosPendentes > 1 ? 's' : ''}</span>
            </a>
          )}
          <span className="nav-email">{usuario?.email}</span>
          <button onClick={handleLogout} className="btn-sair">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </div>
      </nav>

      <div className="body">

        {/* ── BOAS-VINDAS ── */}
        <div className="boas-vindas">
          <h1>{nomeNegocio ? `Bem-vindo, ${nomeNegocio} 👋` : 'Bem-vindo ao seu painel 👋'}</h1>
          <p>Acompanhe seus agendamentos, atendimentos e resultados em um só lugar.</p>
        </div>

        {/* ── STATUS PÁGINA PÚBLICA ── */}
        {checklistCompleto && checklist.slug && (
          <div className="status-pagina">
            <div className="status-info">
              <div className="status-dot" />
              <div>
                <p className="status-titulo">Sua página está pronta para receber agendamentos</p>
                <p className="status-url">{urlPublica}</p>
              </div>
            </div>
            <div className="status-btns">
              <a href={'/' + checklist.slug} target="_blank" className="btn-ver-pagina">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Ver página
              </a>
              <button onClick={copiarLink} className={`btn-copiar-link${linkCopiado ? ' copiado' : ''}`}>
                {linkCopiado
                  ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado!</>
                  : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar link</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── NOTIFICAÇÕES ── */}
        {novasNotificacoes.length > 0 && (
          <div className="notif-bloco">
            <div className="notif-topo-bar" />
            <div className="notif-header">
              <div className="notif-header-left">
                <div className="notif-dot" />
                <p className="notif-titulo">{novosPendentes} novo{novosPendentes > 1 ? 's' : ''} agendamento{novosPendentes > 1 ? 's' : ''} pendente{novosPendentes > 1 ? 's' : ''}</p>
              </div>
              <a href="/painel/agendamentos" className="notif-ver">Ver todos →</a>
            </div>
            {novasNotificacoes.slice(0, 3).map(ag => (
              <a key={ag.id} href="/painel/agendamentos" className="notif-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="notif-nome">{ag.cliente_nome}</p>
                  <p className="notif-detalhe">{ag.servicos?.nome} · {ag.profissionais?.nome}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p className="notif-hora">{new Date(ag.data_hora).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })} {formatarHora(ag.data_hora)}</p>
                  <span className="badge-pendente">Pendente</span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* ── CHECKLIST ── */}
        {!checklistCompleto && (
          <div className="checklist-bloco">
            <div className="checklist-bar-topo" />
            <div className="checklist-header">
              <div>
                <p className="checklist-titulo">Configure seu negócio</p>
                <p className="checklist-sub">{totalFeitos} de {itensChecklist.length} etapas concluídas</p>
              </div>
              <span className="checklist-pct">{progresso}%</span>
            </div>
            <div className="progresso-track">
              <div className="progresso-fill" style={{ width: progresso + '%' }} />
            </div>
            {itensChecklist.map(item => (
              <a key={item.texto} href={item.feito ? '#' : item.href} className="checklist-item">
                <div className={`check-circulo ${item.feito ? 'feito' : 'pendente'}`}>
                  {item.feito ? '✓' : ''}
                </div>
                <span className="check-texto" style={{ color: item.feito ? '#374151' : '#D1D5DB', textDecoration: item.feito ? 'line-through' : 'none', fontWeight: item.feito ? 400 : 500 }}>
                  {item.texto}
                </span>
                {!item.feito && <span className="check-acao">Configurar →</span>}
              </a>
            ))}
          </div>
        )}

        {/* ── MÉTRICAS ── */}
        <div className="metricas">
          {[
            { label: 'Agendamentos hoje', valor: agendamentosHoje, cor: '#3B82F6', sub: agendamentosHoje === 0 ? 'Nenhum agendamento para hoje' : agendamentosHoje === 1 ? '1 cliente esperando' : `${agendamentosHoje} clientes esperando` },
            { label: 'Próximos atendimentos', valor: totalMes, cor: '#22C55E', sub: 'Atendimentos programados para hoje' },
            { label: 'Faturamento do mês', valor: 'R$ ' + faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), cor: '#22C55E', sub: 'Receita registrada este mês' },
          ].map(m => (
            <div key={m.label} className="metrica-card">
              <div className="metrica-accent-line" style={{ background: `linear-gradient(90deg, ${m.cor}, transparent)` }} />
              <p className="metrica-label">{m.label}</p>
              <p className="metrica-valor" style={{ color: m.cor }}>{m.valor}</p>
              <p className="metrica-sub">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* ── PRÓXIMOS ATENDIMENTOS ── */}
        <div className="proximos-bloco">
          <div className="proximos-header">
            <p className="proximos-titulo">Próximos atendimentos</p>
            <a href="/painel/agendamentos" className="proximos-ver">Ver agenda completa →</a>
          </div>
          {proximosHoje.length === 0
            ? (
              <div className="proximos-vazio">
                <p style={{ marginBottom: '8px', color: '#6B7280' }}>Nenhum atendimento agendado para hoje.</p>
                <p style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>Quando houver horários marcados, eles aparecerão aqui.</p>
              </div>
            )
            : proximosHoje.slice(0, 5).map(ag => {
                const statusClass = ag.status === 'confirmado' ? 'status-confirmado' : ag.status === 'pendente' ? 'status-pendente' : 'status-outro'
                const statusTxt = ag.status === 'confirmado' ? 'Confirmado' : ag.status === 'pendente' ? 'Pendente' : ag.status || 'Agendado'
                return (
                  <div key={ag.id} className="ag-item">
                    <div className="ag-hora">{formatarHora(ag.data_hora)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="ag-nome">{ag.cliente_nome || '—'}</p>
                      <p className="ag-detalhe">{ag.servicos?.nome} · {ag.profissionais?.nome}</p>
                    </div>
                    <span className={`ag-status ${statusClass}`}>{statusTxt}</span>
                  </div>
                )
              })
          }
          {proximosHoje.length > 5 && (
            <a href="/painel/agendamentos" style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: '#3B82F6', marginTop: '14px', textDecoration: 'none', fontWeight: '600' }}>
              Ver todos os atendimentos do dia →
            </a>
          )}
        </div>

        {/* ── MENU ── */}
        <p className="menu-label">Menu</p>
        <div className="menu-grid">
          {menuItems.map(item => (
            <a key={item.href} href={item.href} className="menu-card">
              <div className="menu-icon-wrap">
                {item.icon}
                {item.badge && novosPendentes > 0 && (
                  <div className="menu-badge">{novosPendentes > 9 ? '9+' : novosPendentes}</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="menu-titulo">{item.titulo}</p>
                <p className="menu-desc">{item.desc}</p>
              </div>
              <span className="menu-arrow">›</span>
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}
