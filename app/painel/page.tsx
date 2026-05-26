'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

// ── Ícones SVG premium ──
const Icon = {
  Calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  ClipboardList: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1"/><rect x="3" y="6" width="18" height="16" rx="2"/>
      <path d="M8 12h8M8 16h5"/>
    </svg>
  ),
  Wallet: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/>
      <path d="M20 12a2 2 0 0 1 0 4h-2a2 2 0 0 1 0-4h2z"/>
    </svg>
  ),
  CreditCard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  Sparkles: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
      <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z"/>
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z"/>
    </svg>
  ),
  UserRound: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  BarChart3: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Ban: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/>
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  CalendarPlus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/><line x1="19" y1="16" x2="19" y2="22"/>
      <line x1="16" y1="19" x2="22" y2="19"/>
    </svg>
  ),
  FileText: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
}

const SIDEBAR_ITEMS = [
  { href:'/painel',               IconC:Icon.Calendar,    label:'Início',        active:true },
  { href:'/painel/agendamentos',  IconC:Icon.Calendar,    label:'Agenda'         },
  { href:'/painel/clientes',      IconC:Icon.Users,       label:'Clientes'       },
  { href:'/painel/orcamentos',    IconC:Icon.ClipboardList,label:'Orçamentos'    },
  { href:'/painel/financeiro',    IconC:Icon.Wallet,      label:'Cobranças'      },
  { href:'/painel/financeiro',    IconC:Icon.CreditCard,  label:'Pagamentos'     },
  { href:'/painel/servicos',      IconC:Icon.Sparkles,    label:'Serviços'       },
  { href:'/painel/profissionais', IconC:Icon.UserRound,   label:'Profissionais'  },
  { href:'/painel/relatorio',     IconC:Icon.BarChart3,   label:'Relatórios'     },
  { href:'/painel/perfil',        IconC:Icon.Settings,    label:'Configurações'  },
]

const AVATAR_COLORS = [
  'linear-gradient(135deg,#2563EB,#7C3AED)',
  'linear-gradient(135deg,#7C3AED,#EC4899)',
  'linear-gradient(135deg,#06B6D4,#2563EB)',
  'linear-gradient(135deg,#16A34A,#06B6D4)',
  'linear-gradient(135deg,#DC2626,#7C3AED)',
  'linear-gradient(135deg,#D97706,#EC4899)',
]
function avatarGrad(n:string){return AVATAR_COLORS[(n||'A').charCodeAt(0)%AVATAR_COLORS.length]}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%}
input,select,textarea{color-scheme:dark}
select option{background:#070F1D;color:#F8FAFC}

/* ── Sidebar ── */
.sb{
  width:220px;min-height:100vh;
  background:
    radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),
    linear-gradient(180deg,#070F1D 0%,#050B16 100%);
  border-right:1px solid rgba(148,163,184,.14);
  display:flex;flex-direction:column;
  position:fixed;top:0;left:0;z-index:30;
}
.sb-logo{padding:20px 16px 16px;border-bottom:1px solid rgba(148,163,184,.08);display:flex;align-items:center;gap:8px}
.sb-icon{
  width:28px;height:28px;border-radius:8px;
  background:linear-gradient(135deg,#3B82F6,#7C3AED);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  box-shadow:0 0 22px rgba(124,58,237,.48);
}
.sb nav{flex:1;padding:10px 8px}
.nl{
  display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:2px;
  text-decoration:none;font-size:13px;font-weight:400;color:#94A3B8;
  transition:all .18s;border:1px solid transparent;white-space:nowrap;
}
.nl svg{flex-shrink:0;opacity:.7;transition:opacity .18s}
.nl:hover{background:rgba(124,58,237,.10);color:#FFFFFF;border-color:rgba(124,58,237,.20)}
.nl:hover svg{opacity:1}
.nl.on{
  background:linear-gradient(135deg,#3B82F6,#7C3AED);
  color:#fff;font-weight:600;
  box-shadow:0 0 26px rgba(124,58,237,.34),inset 0 1px 0 rgba(255,255,255,.10);
  border-color:rgba(255,255,255,.10);
}
.nl.on svg{opacity:1}
.sb-foot{padding:10px;border-top:1px solid rgba(148,163,184,.08)}
.sb-foot-in{display:flex;align-items:center;gap:10px;background:rgba(15,23,42,.78);border:1px solid rgba(148,163,184,.12);border-radius:10px;padding:10px 12px;margin-bottom:6px}
.sb-sair{display:flex;align-items:center;gap:6px;width:100%;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.14);border-radius:8px;padding:8px 12px;font-size:12px;font-weight:500;color:#64748B;cursor:pointer;transition:all .18s;font-family:inherit}
.sb-sair:hover{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.32);color:#F87171}

/* ── Mobile Header ── */
.mob-hdr{
  display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;
  background:rgba(5,11,22,.94);backdrop-filter:blur(20px);
  border-bottom:1px solid rgba(148,163,184,.1);
  position:sticky;top:0;z-index:20;flex-shrink:0;width:100%;max-width:100%;
}

/* ── Drawer ── */
.drawer{position:fixed;top:0;left:0;bottom:0;width:300px;max-width:85vw;background:linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .3s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.12)}
.drawer.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .3s}
.ovl.open{opacity:1;pointer-events:auto}

/* ── Layout ── */
.main{margin-left:220px;flex:1;min-height:100vh;display:flex;flex-direction:column;width:calc(100% - 220px);max-width:calc(100% - 220px)}
.pg{
  background:
    radial-gradient(circle at top left,rgba(124,58,237,.24),transparent 30%),
    radial-gradient(circle at left center,rgba(37,99,235,.16),transparent 24%),
    radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),
    radial-gradient(circle at bottom right,rgba(6,182,212,.08),transparent 24%),
    linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);
  min-height:100vh;width:100%;overflow-x:hidden;
}
.body{max-width:1280px;margin:0 auto;padding:28px 32px 64px;width:100%;box-sizing:border-box}

/* ── Botão principal ── */
.btn-pri{
  background:linear-gradient(135deg,#3B82F6,#7C3AED);
  color:#fff;border:1px solid rgba(255,255,255,.10);border-radius:10px;
  padding:11px 20px;font-size:13px;font-weight:700;
  box-shadow:0 12px 30px rgba(59,130,246,.30),0 0 26px rgba(124,58,237,.26);
  text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;
  white-space:nowrap;transition:box-shadow .2s,transform .2s;font-family:inherit;cursor:pointer;
}
.btn-pri:hover{box-shadow:0 16px 38px rgba(59,130,246,.36),0 0 34px rgba(124,58,237,.34);transform:translateY(-1px)}
.btn-sec{
  background:rgba(15,23,42,.86);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);
  border-radius:10px;padding:11px 18px;font-size:13px;font-weight:600;
  text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;
  white-space:nowrap;transition:all .2s;font-family:inherit;cursor:pointer;
}
.btn-sec:hover{background:rgba(124,58,237,.12);border-color:rgba(124,58,237,.36);color:#fff}

/* ── Card base ── */
.crd{
  background:
    radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),
    linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));
  border:1.5px solid rgba(148,163,184,.18);
  border-radius:18px;
  box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04);
}
.crd-hov{transition:transform .2s,border-color .2s,box-shadow .2s}
.crd-hov:hover{
  transform:translateY(-2px);
  border-color:rgba(124,58,237,.42)!important;
  box-shadow:0 24px 60px rgba(0,0,0,.44),0 0 28px rgba(124,58,237,.18),inset 0 1px 0 rgba(255,255,255,.05)!important;
}

/* ── Icon badge ── */
.ico-badge{
  width:44px;height:44px;border-radius:14px;
  display:flex;align-items:center;justify-content:center;
  margin-bottom:14px;flex-shrink:0;
}

/* ── Grids ── */
.atl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;width:100%}
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;width:100%}
.ac-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;width:100%}

/* ── Agenda ── */
.agenda-wrap{
  background:linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98));
  border:1.5px solid rgba(148,163,184,.18);border-radius:18px;overflow:hidden;margin-bottom:20px;
  box-shadow:0 20px 48px rgba(0,0,0,.28);
}
.agenda-hdr{padding:16px 24px;border-bottom:1px solid rgba(148,163,184,.08);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.ag-row{display:flex;align-items:center;gap:10px;padding:12px 24px;border-bottom:1px solid rgba(148,163,184,.06);transition:background .15s}
.ag-row:last-child{border-bottom:none}
.ag-row:hover{background:rgba(124,58,237,.07)}
.ag-hora{font-size:12px;font-weight:700;color:#fff;background:linear-gradient(135deg,rgba(37,99,235,.9),rgba(124,58,237,.9));border-radius:8px;padding:4px 10px;flex-shrink:0;min-width:52px;text-align:center}

/* ── Checklist ── */
.chk-wrap{
  background:linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98));
  border:1.5px solid rgba(148,163,184,.18);border-radius:18px;padding:20px;margin-bottom:20px;
  box-shadow:0 20px 48px rgba(0,0,0,.28);
}

/* ── Responsivo ── */
@media(max-width:1023px){
  .sb{display:none!important}
  .main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mob-hdr{display:flex!important}
  .body{padding:14px 16px 80px!important}
  .topo{flex-direction:column!important;align-items:stretch!important;gap:12px!important}
  .topo-btns{flex-direction:column!important;width:100%!important;gap:8px!important}
  .topo-btns a,.topo-btns button{width:100%!important}
  .pagina-ativa{flex-direction:column!important;align-items:stretch!important;gap:12px!important}
  .pagina-ativa-btns{width:100%!important}
  .pagina-ativa-btns a,.pagina-ativa-btns button{flex:1!important;justify-content:center!important}
  .atl-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .ac-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .agenda-hdr{padding:14px 16px!important}
  .ag-row{padding:10px 16px!important}
  .crd-hov:hover{transform:none!important}
}
@media(max-width:360px){
  .atl-grid{grid-template-columns:1fr!important}
  .kpi-grid{grid-template-columns:1fr!important}
  .ac-grid{grid-template-columns:1fr!important}
  .body{padding:12px 12px 80px!important}
}
`

export default function Painel() {
  const [perfil,setPerfil]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [copiado,setCopiado]=useState(false)
  const [agHoje,setAgHoje]=useState(0)
  const [proxHoje,setProxHoje]=useState<any[]>([])
  const [orcAbertos,setOrcAbertos]=useState(0)
  const [totalReceber,setTotalReceber]=useState(0)
  const [recMes,setRecMes]=useState(0)
  const [proxCount,setProxCount]=useState(0)
  const [retornos,setRetornos]=useState(0)
  const [pendentes,setPendentes]=useState(0)
  const [checklist,setChecklist]=useState({temPerfil:false,temBanner:false,temServico:false,temProfissional:false,temWhatsapp:false,slug:''})

  useEffect(()=>{init()},[])

  async function init(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const hoje=new Date().toISOString().split('T')[0]
    const mes=new Date().toISOString().slice(0,7)
    const [{data:p},{data:agsH},{data:agsMes},{data:orcs},{data:servs},{data:profs}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('agendamentos').select('*,servicos(nome,preco),profissionais(nome)').eq('user_id',user.id).gte('data_hora',hoje+'T00:00:00').lte('data_hora',hoje+'T23:59:59').neq('status','cancelado').order('data_hora',{ascending:true}),
      supabase.from('agendamentos').select('servicos(preco)').eq('user_id',user.id).gte('data_hora',mes+'-01').neq('status','cancelado'),
      supabase.from('orcamentos').select('status,saldo_restante').eq('user_id',user.id),
      supabase.from('servicos').select('id').eq('user_id',user.id),
      supabase.from('profissionais').select('id').eq('user_id',user.id),
    ])
    setPerfil(p);setAgHoje(agsH?.length||0);setProxHoje(agsH||[])
    const amanha=new Date();amanha.setDate(amanha.getDate()+1)
    const {data:prox}=await supabase.from('agendamentos').select('id').eq('user_id',user.id).gte('data_hora',amanha.toISOString().split('T')[0]+'T00:00:00').neq('status','cancelado')
    setProxCount(prox?.length||0)
    setRecMes((agsMes||[]).reduce((a:number,ag:any)=>a+(parseFloat(ag.servicos?.preco||'0')||0),0))
    const ab=(orcs||[]).filter(o=>!['Pago','Finalizado','Cancelado'].includes(o.status))
    setOrcAbertos(ab.length);setTotalReceber(ab.reduce((a,o)=>a+(o.saldo_restante||0),0))
    const {data:rets}=await supabase.from('agendamentos').select('id').eq('user_id',user.id).eq('status','retorno')
    setRetornos(rets?.length||0)
    setPendentes((agsH||[]).filter((a:any)=>a.status==='pendente').length)
    setChecklist({temPerfil:!!(p?.nome_negocio&&p?.slug),temBanner:!!p?.banner_url,temServico:(servs?.length||0)>0,temProfissional:(profs?.length||0)>0,temWhatsapp:!!p?.whatsapp,slug:p?.slug||''})
    setLoading(false)
  }

  async function logout(){await supabase.auth.signOut();window.location.href='/login'}
  function copiarLink(){navigator.clipboard.writeText((typeof window!=='undefined'?window.location.origin:'')+'/'+checklist.slug);setCopiado(true);setTimeout(()=>setCopiado(false),2000)}
  function fmtH(s:string){return new Date(s).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
  function fmtBRL(v:number){return v.toLocaleString('pt-BR',{minimumFractionDigits:2})}
  function fmtDia(){return new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'N').charAt(0).toUpperCase()
  const grad=avatarGrad(nome)
  const itensChk=[
    {feito:checklist.temPerfil,texto:'Cadastrar dados do negócio',href:'/painel/perfil'},
    {feito:checklist.temBanner,texto:'Enviar imagem de capa',href:'/painel/perfil'},
    {feito:checklist.temServico,texto:'Cadastrar primeiro serviço',href:'/painel/servicos'},
    {feito:checklist.temProfissional,texto:'Cadastrar profissional',href:'/painel/profissionais'},
    {feito:checklist.temWhatsapp,texto:'Adicionar WhatsApp do negócio',href:'/painel/perfil'},
  ]
  const totalF=itensChk.filter(i=>i.feito).length
  const chkOk=totalF===itensChk.length
  const prog=Math.round((totalF/itensChk.length)*100)
  const urlPub=(typeof window!=='undefined'?window.location.origin:'')+'/'+checklist.slug

  const SB=()=>(
    <aside className="sb">
      <div className="sb-logo">
        <div className="sb-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
      </div>
      <nav>
        {SIDEBAR_ITEMS.map(it=>(
          <Link key={it.label} href={it.href} className={'nl'+(it.active?' on':'')}>
            <it.IconC/><span>{it.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sb-foot">
        <div className="sb-foot-in">
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0,boxShadow:'0 0 16px rgba(124,58,237,.4)'}}>{ini}</div>
          <div style={{minWidth:0}}>
            <p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p>
            <p style={{fontSize:'10px',color:'#64748B',marginTop:'1px'}}>Administrador</p>
          </div>
        </div>
        <button onClick={logout} className="sb-sair">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair da conta
        </button>
      </div>
    </aside>
  )

  if(loading) return(
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p>
    </div>
  )

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',maxWidth:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drawer${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid rgba(148,163,184,.1)'}}>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span>
          <button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'24px',lineHeight:1}}>×</button>
        </div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>
          {SIDEBAR_ITEMS.map(it=>(
            <Link key={it.label} href={it.href} onClick={()=>setMob(false)} className={'nl'+(it.active?' on':'')} style={{fontSize:'14px',padding:'11px 14px'}}>
              <it.IconC/><span>{it.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{padding:'10px',borderTop:'1px solid rgba(148,163,184,.1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.78)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px',marginBottom:'6px'}}>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
            <div><p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'11px',color:'#64748B'}}>Administrador</p></div>
          </div>
          <button onClick={logout} style={{display:'flex',alignItems:'center',gap:'6px',width:'100%',background:'rgba(15,23,42,.72)',border:'1px solid rgba(148,163,184,.14)',borderRadius:'8px',padding:'9px 12px',fontSize:'12px',fontWeight:500,color:'#64748B',cursor:'pointer',fontFamily:'inherit',transition:'all .18s'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair da conta
          </button>
        </div>
      </div>
      <SB/>
      <div className="main">
        <div className="mob-hdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
            <span style={{display:'block',width:'16px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span>
          <div style={{width:'36px',height:'36px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',boxShadow:'0 0 14px rgba(124,58,237,.4)'}}>{ini}</div>
        </div>

        <div className="pg">
        <div className="body">

          {/* TOPO */}
          <div className="topo" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px',width:'100%'}}>
            <div style={{minWidth:0}}>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.03em',marginBottom:'4px',lineHeight:1.2}}>
                {nome?`Olá, ${nome} 👋`:'Painel ClienteMarcado'}
              </h1>
              <p style={{fontSize:'14px',color:'#94A3B8',lineHeight:1.5}}>Acompanhe sua agenda, clientes, cobranças e retornos em um só lugar.</p>
            </div>
            <div className="topo-btns" style={{display:'flex',gap:'8px',flexShrink:0}}>
              <Link href="/painel/agendamentos" className="btn-pri">
                <Icon.CalendarPlus/> Novo agendamento
              </Link>
              <Link href="/painel/orcamentos" className="btn-sec">
                <Icon.FileText/> Novo orçamento
              </Link>
            </div>
          </div>

          {/* PÁGINA PÚBLICA ATIVA */}
          {chkOk&&checklist.slug&&(
            <div className="pagina-ativa" style={{
              background:'radial-gradient(circle at top left,rgba(34,197,94,.24),transparent 36%),linear-gradient(145deg,rgba(6,78,59,.32),rgba(15,23,42,.97))',
              border:'1.5px solid rgba(34,197,94,.38)',borderRadius:'16px',
              padding:'16px 20px',marginBottom:'20px',
              boxShadow:'0 16px 42px rgba(34,197,94,.08),inset 0 1px 0 rgba(255,255,255,.04)',
              display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',width:'100%',boxSizing:'border-box' as const,
            }}>
              <div style={{display:'flex',alignItems:'flex-start',gap:'12px',flex:1,minWidth:0}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#22C55E',flexShrink:0,marginTop:'5px',boxShadow:'0 0 12px rgba(34,197,94,.8)'}}/>
                <div style={{minWidth:0,flex:1}}>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#4ADE80',marginBottom:'3px'}}>Sua página pública está ativa</p>
                  <p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'4px',lineHeight:1.4}}>Compartilhe este link com seus clientes para receber agendamentos e contatos.</p>
                  <p style={{fontSize:'11px',color:'#64748B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'100%'}}>{urlPub}</p>
                </div>
              </div>
              <div className="pagina-ativa-btns" style={{display:'flex',gap:'8px',flexShrink:0,flexWrap:'wrap'}}>
                <a href={'/'+checklist.slug} target="_blank" rel="noopener noreferrer"
                  style={{background:'linear-gradient(135deg,#16A34A,#22C55E)',color:'#fff',borderRadius:'8px',padding:'9px 16px',fontSize:'12px',fontWeight:700,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',whiteSpace:'nowrap',boxShadow:'0 8px 22px rgba(34,197,94,.28)'}}>
                  🔗 Ver página
                </a>
                <button onClick={copiarLink}
                  style={{background:'rgba(15,23,42,.85)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'8px',padding:'9px 14px',fontSize:'12px',fontWeight:600,color:copiado?'#4ADE80':'#CBD5E1',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',transition:'color .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'}}>
                  {copiado?'✓ Copiado!':'📋 Copiar link'}
                </button>
              </div>
            </div>
          )}

          {/* NOTIF PENDENTES */}
          {pendentes>0&&(
            <div style={{background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.3)',borderRadius:'12px',padding:'12px 16px',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',width:'100%',boxSizing:'border-box' as const}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',minWidth:0}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#F59E0B',flexShrink:0,boxShadow:'0 0 10px rgba(245,158,11,.7)'}}/>
                <p style={{fontSize:'13px',fontWeight:600,color:'#FBBF24',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{pendentes} agendamento{pendentes>1?'s':''} pendente{pendentes>1?'s':''} hoje</p>
              </div>
              <Link href="/painel/agendamentos" style={{fontSize:'12px',fontWeight:700,color:'#F59E0B',textDecoration:'none',flexShrink:0}}>Ver →</Link>
            </div>
          )}

          {/* CARDS ATALHO */}
          <div className="atl-grid">
            {[
              {label:'Agenda',     sub:'Veja e gerencie seus horários.',   Icon:Icon.Calendar,    href:'/painel/agendamentos',
                bg:'radial-gradient(circle at top left,rgba(59,130,246,.32),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',
                bd:'rgba(59,130,246,.46)',ico_bg:'rgba(59,130,246,.20)',ico_c:'#60A5FA',glow:'rgba(59,130,246,.24)'},
              {label:'Clientes',   sub:'Seus clientes em um só lugar.',    Icon:Icon.Users,       href:'/painel/clientes',
                bg:'radial-gradient(circle at top left,rgba(34,211,238,.28),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',
                bd:'rgba(34,211,238,.42)',ico_bg:'rgba(34,211,238,.18)',ico_c:'#22D3EE',glow:'rgba(34,211,238,.22)'},
              {label:'Orçamentos', sub:'Crie e acompanhe orçamentos.',     Icon:Icon.ClipboardList,href:'/painel/orcamentos',
                bg:'radial-gradient(circle at top left,rgba(124,58,237,.34),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',
                bd:'rgba(124,58,237,.50)',ico_bg:'rgba(124,58,237,.22)',ico_c:'#A78BFA',glow:'rgba(124,58,237,.26)'},
              {label:'Cobranças',  sub:'Gerencie cobranças e pagamentos.', Icon:Icon.Wallet,      href:'/painel/financeiro',
                bg:'radial-gradient(circle at top left,rgba(139,92,246,.30),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',
                bd:'rgba(139,92,246,.46)',ico_bg:'rgba(139,92,246,.20)',ico_c:'#C4B5FD',glow:'rgba(139,92,246,.24)'},
            ].map(a=>(
              <Link key={a.label} href={a.href} className="crd-hov"
                style={{background:a.bg,border:`1px solid ${a.bd}`,borderRadius:'18px',padding:'20px',textDecoration:'none',display:'block',position:'relative',width:'100%',boxSizing:'border-box' as const,boxShadow:`0 18px 45px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.035)`}}>
                <div className="ico-badge" style={{background:a.ico_bg,border:`1px solid ${a.bd}`,boxShadow:`0 0 22px ${a.glow}`}}>
                  <span style={{color:a.ico_c}}><a.Icon/></span>
                </div>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'5px'}}>{a.label}</p>
                <p style={{fontSize:'11px',color:'#64748B',lineHeight:1.45}}>{a.sub}</p>
                <span style={{position:'absolute',top:'18px',right:'18px',color:a.ico_c,opacity:.7,display:'flex',alignItems:'center'}}><Icon.ArrowRight/></span>
              </Link>
            ))}
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {label:'Atendimentos hoje',     valor:agHoje,       fmt:'n',  Icon:Icon.Calendar,    cor:'#60A5FA',bd:'rgba(59,130,246,.34)', ico_bg:'rgba(59,130,246,.15)', glow:'rgba(59,130,246,.24)'},
              {label:'Próximos agendamentos', valor:proxCount,     fmt:'n',  Icon:Icon.Clock,       cor:'#22D3EE',bd:'rgba(34,211,238,.34)',  ico_bg:'rgba(34,211,238,.15)', glow:'rgba(34,211,238,.22)'},
              {label:'Orçamentos em aberto',  valor:orcAbertos,   fmt:'n',  Icon:Icon.ClipboardList,cor:'#A78BFA',bd:'rgba(124,58,237,.38)',ico_bg:'rgba(124,58,237,.17)',glow:'rgba(124,58,237,.26)'},
              {label:'Total a receber',       valor:totalReceber, fmt:'brl',Icon:Icon.Wallet,       cor:'#F59E0B',bd:'rgba(245,158,11,.38)', ico_bg:'rgba(245,158,11,.15)', glow:'rgba(245,158,11,.22)'},
              {label:'Recebido no mês',       valor:recMes,       fmt:'brl',Icon:Icon.CreditCard,  cor:'#22C55E',bd:'rgba(34,197,94,.38)',  ico_bg:'rgba(34,197,94,.15)',  glow:'rgba(34,197,94,.22)'},
              {label:'Retornos pendentes',    valor:retornos,     fmt:'n',  Icon:Icon.Clock,       cor:'#FBBF24',bd:'rgba(245,158,11,.34)', ico_bg:'rgba(245,158,11,.13)', glow:'rgba(245,158,11,.20)'},
            ].map(m=>(
              <div key={m.label} style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:`1.5px solid ${m.bd}`,borderRadius:'16px',padding:'18px',boxSizing:'border-box' as const,boxShadow:'0 20px 48px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'12px',background:m.ico_bg,border:`1px solid rgba(255,255,255,.10)`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px',boxShadow:`0 0 20px ${m.glow},inset 0 1px 0 rgba(255,255,255,.05)`}}>
                  <span style={{color:m.cor}}><m.Icon/></span>
                </div>
                <p style={{fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',marginBottom:'5px',lineHeight:1.3}}>{m.label}</p>
                <p style={{fontSize:'26px',fontWeight:800,color:m.cor,letterSpacing:'-0.02em',lineHeight:1.1}}>
                  {m.fmt==='brl'?'R$ '+fmtBRL(m.valor as number):m.valor}
                </p>
              </div>
            ))}
          </div>

          {/* CHECKLIST */}
          {!chkOk&&(
            <div className="chk-wrap">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                <div>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'2px'}}>Configure seu negócio</p>
                  <p style={{fontSize:'12px',color:'#64748B'}}>{totalF} de {itensChk.length} etapas concluídas</p>
                </div>
                <span style={{fontSize:'14px',fontWeight:700,color:'#A78BFA',flexShrink:0}}>{prog}%</span>
              </div>
              <div style={{height:'4px',background:'rgba(148,163,184,.1)',borderRadius:'999px',marginBottom:'14px',overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:'999px',background:'linear-gradient(90deg,#2563EB,#7C3AED)',width:prog+'%',transition:'width .4s ease'}}/>
              </div>
              {itensChk.map(it=>(
                <Link key={it.texto} href={it.feito?'#':it.href}
                  style={{display:'flex',alignItems:'center',gap:'10px',padding:'6px 0',textDecoration:'none'}}>
                  <div style={{width:'20px',height:'20px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,background:it.feito?'linear-gradient(135deg,#16A34A,#22C55E)':'transparent',border:it.feito?'none':'1px solid rgba(148,163,184,.2)',color:it.feito?'#fff':'transparent'}}>
                    {it.feito?'✓':''}
                  </div>
                  <span style={{fontSize:'13px',flex:1,color:it.feito?'#475569':'#CBD5E1',fontWeight:it.feito?400:500,textDecoration:it.feito?'line-through':'none',lineHeight:1.4}}>{it.texto}</span>
                  {!it.feito&&<span style={{fontSize:'11px',color:'#A78BFA',flexShrink:0}}>Configurar →</span>}
                </Link>
              ))}
            </div>
          )}

          {/* AGENDA DE HOJE */}
          <div className="agenda-wrap">
            <div className="agenda-hdr">
              <div style={{minWidth:0}}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'2px'}}>Agenda de hoje</p>
                <p style={{fontSize:'11px',color:'#64748B',textTransform:'capitalize' as const}}>{fmtDia()}</p>
              </div>
              <Link href="/painel/agendamentos" style={{fontSize:'12px',fontWeight:700,color:'#60A5FA',textDecoration:'none',whiteSpace:'nowrap',flexShrink:0,display:'flex',alignItems:'center',gap:'4px'}}>
                Ver agenda <Icon.ArrowRight/>
              </Link>
            </div>
            {proxHoje.length===0?(
              <div style={{padding:'28px 24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px'}}>
                <div style={{width:'48px',height:'48px',borderRadius:'16px',background:'rgba(59,130,246,.16)',border:'1px solid rgba(59,130,246,.30)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 24px rgba(59,130,246,.24)',color:'#60A5FA'}}>
                  <Icon.Calendar/>
                </div>
                <div>
                  <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'6px'}}>Nenhum atendimento hoje</p>
                  <p style={{fontSize:'13px',color:'#94A3B8',lineHeight:1.5,maxWidth:'280px',margin:'0 auto'}}>Quando houver horários marcados, eles aparecerão aqui.</p>
                </div>
                <Link href="/painel/agendamentos" className="btn-pri" style={{display:'inline-flex',fontSize:'13px',padding:'9px 20px',borderRadius:'8px',marginTop:'4px'}}>
                  + Novo agendamento
                </Link>
              </div>
            ):(
              <>
                {proxHoje.slice(0,6).map((ag:any)=>{
                  const sc=ag.status==='confirmado'
                    ?{bg:'rgba(34,197,94,.15)',c:'#4ADE80',bd:'rgba(34,197,94,.35)',t:'Confirmado'}
                    :ag.status==='pendente'
                    ?{bg:'rgba(245,158,11,.15)',c:'#FBBF24',bd:'rgba(245,158,11,.35)',t:'Pendente'}
                    :{bg:'rgba(148,163,184,.12)',c:'#CBD5E1',bd:'rgba(148,163,184,.22)',t:ag.status||'Agendado'}
                  const agGrad=avatarGrad(ag.cliente_nome||'A')
                  return(
                    <div key={ag.id} className="ag-row">
                      <div className="ag-hora">{fmtH(ag.data_hora)}</div>
                      <div style={{width:'30px',height:'30px',borderRadius:'50%',background:agGrad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#fff',flexShrink:0}}>
                        {(ag.cliente_nome||'?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',marginBottom:'1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.cliente_nome||'—'}</p>
                        <p style={{fontSize:'11px',color:'#64748B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.servicos?.nome}{ag.profissionais?.nome?' · '+ag.profissionais.nome:''}</p>
                      </div>
                      <span style={{fontSize:'10px',fontWeight:700,padding:'3px 9px',borderRadius:'999px',background:sc.bg,color:sc.c,border:`1px solid ${sc.bd}`,whiteSpace:'nowrap',flexShrink:0}}>{sc.t}</span>
                    </div>
                  )
                })}
                {proxHoje.length>6&&(
                  <div style={{padding:'12px 16px',textAlign:'center'}}>
                    <Link href="/painel/agendamentos" style={{fontSize:'13px',color:'#60A5FA',textDecoration:'none',fontWeight:600}}>Ver todos os {proxHoje.length} atendimentos →</Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* AÇÕES RÁPIDAS */}
          <div style={{marginBottom:'32px'}}>
            <p style={{fontSize:'11px',fontWeight:700,color:'#475569',textTransform:'uppercase' as const,letterSpacing:'.09em',marginBottom:'14px'}}>Ações rápidas</p>
            <div className="ac-grid">
              {[
                {label:'Novo agendamento',   sub:'Agende um atendimento',  I:Icon.Calendar,    href:'/painel/agendamentos',  bg:'rgba(59,130,246,.1)',  bd:'rgba(59,130,246,.32)',  ic_bg:'rgba(59,130,246,.18)', cor:'#60A5FA', glow:'rgba(59,130,246,.30)'},
                {label:'Novo cliente',       sub:'Cadastre um contato',    I:Icon.Users,       href:'/painel/clientes',      bg:'rgba(34,211,238,.1)', bd:'rgba(34,211,238,.30)', ic_bg:'rgba(34,211,238,.16)',cor:'#22D3EE', glow:'rgba(34,211,238,.28)'},
                {label:'Novo orçamento',     sub:'Crie em segundos',       I:Icon.ClipboardList,href:'/painel/orcamentos',   bg:'rgba(124,58,237,.1)', bd:'rgba(124,58,237,.36)', ic_bg:'rgba(124,58,237,.18)',cor:'#A78BFA',glow:'rgba(124,58,237,.32)'},
                {label:'Registrar pagamento',sub:'Marque como recebido',   I:Icon.CreditCard,  href:'/painel/financeiro',    bg:'rgba(34,197,94,.1)',  bd:'rgba(34,197,94,.34)',  ic_bg:'rgba(34,197,94,.16)', cor:'#4ADE80', glow:'rgba(34,197,94,.28)'},
                {label:'Novo serviço',       sub:'Cadastre um serviço',    I:Icon.Sparkles,    href:'/painel/servicos',      bg:'rgba(236,72,153,.1)', bd:'rgba(236,72,153,.30)', ic_bg:'rgba(236,72,153,.15)',cor:'#F472B6',glow:'rgba(236,72,153,.24)'},
                {label:'Novo profissional',  sub:'Adicione à equipe',      I:Icon.UserRound,   href:'/painel/profissionais', bg:'rgba(139,92,246,.1)', bd:'rgba(139,92,246,.32)', ic_bg:'rgba(139,92,246,.16)',cor:'#C4B5FD',glow:'rgba(139,92,246,.28)'},
                {label:'Configurar horários',sub:'Ajuste funcionamento',   I:Icon.Settings,    href:'/painel/perfil',        bg:'rgba(148,163,184,.06)',bd:'rgba(148,163,184,.24)',ic_bg:'rgba(148,163,184,.12)',cor:'#CBD5E1',glow:'rgba(148,163,184,.16)'},
                {label:'Bloqueios de agenda',sub:'Feche dias ou horários', I:Icon.Ban,         href:'/painel/bloqueios',     bg:'rgba(239,68,68,.1)',  bd:'rgba(239,68,68,.30)',  ic_bg:'rgba(239,68,68,.14)', cor:'#F87171', glow:'rgba(239,68,68,.24)'},
                {label:'Relatórios',         sub:'Veja indicadores',       I:Icon.BarChart3,   href:'/painel/relatorio',     bg:'rgba(56,189,248,.1)', bd:'rgba(56,189,248,.32)', ic_bg:'rgba(56,189,248,.15)',cor:'#38BDF8',glow:'rgba(56,189,248,.26)'},
              ].map(a=>(
                <Link key={a.label} href={a.href}
                  style={{background:`linear-gradient(145deg,rgba(15,23,42,.92),rgba(8,20,33,.96))`,border:`1.5px solid ${a.bd}`,borderRadius:'14px',padding:'16px',textDecoration:'none',display:'block',width:'100%',boxSizing:'border-box' as const,transition:'border-color .2s,box-shadow .2s',boxShadow:'0 12px 32px rgba(0,0,0,.26)'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'12px',background:a.ic_bg,border:`1px solid ${a.bd}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'10px',boxShadow:`0 0 18px ${a.glow}`}}>
                    <span style={{color:a.cor}}><a.I/></span>
                  </div>
                  <p style={{fontSize:'12px',fontWeight:700,color:'#F8FAFC',marginBottom:'3px',lineHeight:1.3}}>{a.label}</p>
                  <p style={{fontSize:'11px',color:'#64748B',lineHeight:1.3}}>{a.sub}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Sem rodapé de logout — o botão Sair está na sidebar */}

        </div>
        </div>
      </div>
    </div>
  )
}
