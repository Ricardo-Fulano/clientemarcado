'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

// ── Ícones SVG (mesmo padrão da home) ──
const Icon = {
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
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  MessageCircle: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Eye: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Edit: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  BarChart3: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </svg>
  ),
  Link2: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
  Ban: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/>
    </svg>
  ),
}

const SIDEBAR_ITEMS = [
  { href:'/painel',               IconC:Icon.Calendar,     label:'Início'         },
  { href:'/painel/agendamentos',  IconC:Icon.Calendar,     label:'Agenda'         },
  { href:'/painel/clientes',      IconC:Icon.Users,        label:'Clientes'       },
  { href:'/painel/orcamentos',    IconC:Icon.ClipboardList,label:'Orçamentos', active:true },
  { href:'/painel/financeiro',    IconC:Icon.Wallet,       label:'Cobranças'      },
  { href:'/painel/financeiro',    IconC:Icon.CreditCard,   label:'Pagamentos'     },
  { href:'/painel/servicos',      IconC:Icon.Sparkles,     label:'Serviços'       },
  { href:'/painel/profissionais', IconC:Icon.UserRound,    label:'Profissionais'  },
  { href:'/painel/relatorio',     IconC:Icon.BarChart3,    label:'Relatórios'     },
  { href:'/painel/perfil',        IconC:Icon.Settings,     label:'Configurações'  },
]

const STATUS_LIST = ['Todos','Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado']
const STATUS_CFG: Record<string,{bg:string;cor:string;bd:string}> = {
  'Aberto':               {bg:'rgba(59,130,246,.15)', cor:'#60A5FA', bd:'rgba(59,130,246,.35)'},
  'Aguardando aprovação': {bg:'rgba(245,158,11,.15)', cor:'#FBBF24', bd:'rgba(245,158,11,.35)'},
  'Em andamento':         {bg:'rgba(34,211,238,.15)', cor:'#22D3EE', bd:'rgba(34,211,238,.35)'},
  'Parcialmente pago':    {bg:'rgba(139,92,246,.15)', cor:'#C4B5FD', bd:'rgba(139,92,246,.35)'},
  'Pago':                 {bg:'rgba(34,197,94,.15)',  cor:'#4ADE80', bd:'rgba(34,197,94,.35)'},
  'Finalizado':           {bg:'rgba(34,197,94,.12)',  cor:'#86EFAC', bd:'rgba(34,197,94,.28)'},
  'Cancelado':            {bg:'rgba(239,68,68,.14)',  cor:'#F87171', bd:'rgba(239,68,68,.30)'},
}

const AVATAR_COLORS = ['linear-gradient(135deg,#2563EB,#7C3AED)','linear-gradient(135deg,#7C3AED,#EC4899)','linear-gradient(135deg,#06B6D4,#2563EB)','linear-gradient(135deg,#16A34A,#06B6D4)','linear-gradient(135deg,#DC2626,#7C3AED)','linear-gradient(135deg,#D97706,#EC4899)']
function avatarGrad(n:string){return AVATAR_COLORS[(n||'A').charCodeAt(0)%AVATAR_COLORS.length]}
function fmtBRL(v:number){return (v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
function fmtData(d:string){if(!d)return '';const[a,m,di]=d.split('-');return `${di}/${m}/${a}`}
function mascaraTel(v:string){
  const n=v.replace(/\D/g,'').slice(0,11)
  if(n.length>10)return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if(n.length>6) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  if(n.length>2) return `(${n.slice(0,2)}) ${n.slice(2)}`
  return n.length>0?`(${n}`:''
}

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
.sb-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#3B82F6,#7C3AED);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 22px rgba(124,58,237,.48)}
.sb nav{flex:1;padding:10px 8px}
.nl{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:400;color:#94A3B8;transition:all .18s;border:1px solid transparent;white-space:nowrap}
.nl svg{flex-shrink:0;opacity:.7;transition:opacity .18s}
.nl:hover{background:rgba(124,58,237,.10);color:#fff;border-color:rgba(124,58,237,.20)}
.nl:hover svg{opacity:1}
.nl.on{background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;font-weight:600;box-shadow:0 0 26px rgba(124,58,237,.34),inset 0 1px 0 rgba(255,255,255,.10);border-color:rgba(255,255,255,.10)}
.nl.on svg{opacity:1}
.sb-foot{padding:10px;border-top:1px solid rgba(148,163,184,.08)}
.sb-foot-in{display:flex;align-items:center;gap:10px;background:rgba(15,23,42,.78);border:1px solid rgba(148,163,184,.12);border-radius:10px;padding:10px 12px;margin-bottom:6px}
.sb-sair{display:flex;align-items:center;gap:6px;width:100%;background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.14);border-radius:8px;padding:8px 12px;font-size:12px;font-weight:500;color:#64748B;cursor:pointer;transition:all .18s;font-family:inherit}
.sb-sair:hover{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.32);color:#F87171}

/* ── Mobile Header ── */
.mob-hdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.94);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.1);position:sticky;top:0;z-index:20;flex-shrink:0;width:100%;max-width:100%}

/* ── Drawer ── */
.drawer{position:fixed;top:0;left:0;bottom:0;width:300px;max-width:85vw;background:linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .3s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.12)}
.drawer.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .3s}
.ovl.open{opacity:1;pointer-events:auto}

/* ── Layout ── */
.main{margin-left:220px;flex:1;min-height:100vh;display:flex;flex-direction:column;width:calc(100% - 220px);max-width:calc(100% - 220px)}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 30%),radial-gradient(circle at left center,rgba(37,99,235,.14),transparent 24%),radial-gradient(circle at top right,rgba(37,99,235,.12),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;width:100%;overflow-x:hidden}
.body{max-width:1280px;margin:0 auto;padding:28px 32px 64px;width:100%;box-sizing:border-box}

/* ── Botões ── */
.btn-pri{background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:11px 20px;font-size:13px;font-weight:700;box-shadow:0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.26);text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;transition:box-shadow .2s,transform .2s;font-family:inherit;cursor:pointer}
.btn-pri:hover{box-shadow:0 16px 40px rgba(59,130,246,.36),0 0 36px rgba(124,58,237,.34);transform:translateY(-1px)}
.btn-sec{background:rgba(15,23,42,.86);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;transition:all .2s;font-family:inherit;cursor:pointer}
.btn-sec:hover{background:rgba(124,58,237,.12);border-color:rgba(124,58,237,.36);color:#fff}
.btn-wpp{background:rgba(34,197,94,.15);color:#4ADE80;border:1px solid rgba(34,197,94,.30);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;transition:all .2s;font-family:inherit;cursor:pointer}
.btn-wpp:hover{background:rgba(34,197,94,.22);border-color:rgba(34,197,94,.44)}

/* ── Card base ── */
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.crd-hov{transition:transform .2s,border-color .2s,box-shadow .2s}
.crd-hov:hover{transform:translateY(-2px);border-color:rgba(124,58,237,.42)!important;box-shadow:0 24px 60px rgba(0,0,0,.44),0 0 28px rgba(124,58,237,.18),inset 0 1px 0 rgba(255,255,255,.05)!important}

/* ── Grids ── */
.atl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;width:100%}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;width:100%}
.ac-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;width:100%}

/* ── Input busca ── */
.busca-wrap{position:relative;width:100%}
.busca-ico{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#64748B;pointer-events:none}
.busca-inp{width:100%;background:rgba(15,23,42,.88);border:1.5px solid rgba(148,163,184,.18);border-radius:12px;padding:11px 16px 11px 42px;font-size:13px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s}
.busca-inp::placeholder{color:#64748B}
.busca-inp:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.14)}

/* ── Filtros ── */
.filtros-wrap{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:4px;margin-bottom:20px}
.filtros-wrap::-webkit-scrollbar{display:none}
.filtro-pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;flex-shrink:0;transition:all .18s;font-family:inherit}
.filtro-pill:hover{background:rgba(124,58,237,.10);border-color:rgba(124,58,237,.28);color:#fff}
.filtro-pill.on{background:linear-gradient(135deg,#3B82F6,#7C3AED);border-color:transparent;color:#fff;box-shadow:0 0 16px rgba(124,58,237,.28)}

/* ── Responsivo ── */
@media(max-width:1023px){
  .sb{display:none!important}
  .main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mob-hdr{display:flex!important}
  .body{padding:14px 16px 80px!important}
  .topo-row{flex-direction:column!important;align-items:stretch!important;gap:12px!important}
  .topo-btn-wrap{width:100%!important}
  .topo-btn-wrap a,.topo-btn-wrap button{width:100%!important}
  .atl-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .ac-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .crd-hov:hover{transform:none!important}
}
@media(max-width:360px){
  .atl-grid{grid-template-columns:1fr!important}
  .kpi-grid{grid-template-columns:1fr!important}
  .ac-grid{grid-template-columns:1fr!important}
  .body{padding:12px 12px 80px!important}
}
`

// ── Tipos form ──
const TIPOS_PADRAO = ['Orçamento','Atendimento','Tratamento','Ordem de serviço','Retorno']
const FORMAS_PAG   = ['Pix','Dinheiro','Cartão de débito','Cartão de crédito','Transferência','Link de pagamento','Outro']

export default function Orcamentos() {
  const [userId,setUserId]         = useState('')
  const [perfil,setPerfil]         = useState<any>(null)
  const [profissionais,setProfis]  = useState<any[]>([])
  const [orcamentos,setOrcs]       = useState<any[]>([])
  const [loading,setLoading]       = useState(true)
  const [mob,setMob]               = useState(false)
  const [view,setView]             = useState<'lista'|'form'|'detalhe'>('lista')
  const [editandoId,setEditandoId] = useState<string|null>(null)
  const [detalheId,setDetalheId]   = useState<string|null>(null)
  const [filtroStatus,setFiltro]   = useState('Todos')
  const [busca,setBusca]           = useState('')
  const [mensagem,setMensagem]     = useState('')

  // Form state
  const [cNome,setCNome]       = useState('')
  const [cWpp,setCWpp]         = useState('')
  const [cEmail,setCEmail]     = useState('')
  const [cObs,setCObs]         = useState('')
  const [tipo,setTipo]         = useState('Orçamento')
  const [tipoOutro,setTipoOutro]=useState('')
  const [tipoDesc,setTipoDesc] = useState('')
  const [profId,setProfId]     = useState('')
  const [profNome,setProfNome] = useState('')
  const [salvProf,setSalvProf] = useState(false)
  const [dataDoc,setDataDoc]   = useState(new Date().toISOString().split('T')[0])
  const [status,setStatus]     = useState('Aberto')
  const [itens,setItens]       = useState<any[]>([{nome:'',qtd:1,unitario:'',total:0,obs:''}])
  const [desconto,setDesconto] = useState('')
  const [exigeSinal,setExigeSinal]=useState(false)
  const [sinalTipo,setSinalTipo]  = useState('fixo')
  const [sinalValor,setSinalValor]= useState('')
  const [linkPag,setLinkPag]   = useState('')
  const [obsPag,setObsPag]     = useState('')
  const [observacoes,setObs]   = useState('')
  const [histPags,setHistPags] = useState<any[]>([])
  const [showHpForm,setShowHpForm]=useState(false)
  const [hpValor,setHpValor]   = useState('')
  const [hpForma,setHpForma]   = useState('Pix')
  const [hpFormaOut,setHpFormaOut]=useState('')
  const [hpData,setHpData]     = useState(new Date().toISOString().split('T')[0])
  const [hpObs,setHpObs]       = useState('')
  const [editHpIdx,setEditHpIdx]= useState<number|null>(null)

  // Accordions
  const [showDet,setShowDet]   = useState(false)
  const [showPag,setShowPag]   = useState(false)
  const [showObs2,setShowObs2] = useState(false)

  useEffect(()=>{init()},[])

  async function init(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const [
      {data:p},
      {data:profs},
      {data:orcs}
    ]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('id,nome').eq('user_id',user.id),
      supabase.from('orcamentos').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
    ])
    setPerfil(p);setProfis(profs||[]);setOrcs(orcs||[])
    setLoading(false)
  }

  async function recarregar(){
    const {data}=await supabase.from('orcamentos').select('*').eq('user_id',userId).order('created_at',{ascending:false})
    setOrcs(data||[])
  }

  function atualizarItem(idx:number,campo:string,val:any){
    setItens(prev=>{
      const n=[...prev];n[idx]={...n[idx],[campo]:val}
      if(campo==='unitario'||campo==='qtd')
        n[idx].total=parseFloat(n[idx].unitario||'0')*(parseInt(n[idx].qtd)||1)
      return n
    })
  }

  function resetForm(){
    setCNome('');setCWpp('');setCEmail('');setCObs('')
    setTipo('Orçamento');setTipoOutro('');setTipoDesc('')
    setProfId('');setProfNome('');setSalvProf(false)
    setDataDoc(new Date().toISOString().split('T')[0]);setStatus('Aberto')
    setItens([{nome:'',qtd:1,unitario:'',total:0,obs:''}])
    setDesconto('');setExigeSinal(false);setSinalTipo('fixo');setSinalValor('')
    setLinkPag('');setObsPag('');setObs('')
    setHistPags([]);setShowHpForm(false);setHpValor('');setHpForma('Pix');setHpFormaOut('');setHpObs('')
    setEditHpIdx(null);setShowDet(false);setShowPag(false);setShowObs2(false)
    setEditandoId(null)
  }

  function abrirEditar(orc:any){
    setEditandoId(orc.id);setCNome(orc.cliente_nome||'')
    setCWpp(mascaraTel(orc.cliente_whatsapp||''));setCEmail(orc.cliente_email||'');setCObs(orc.cliente_obs||'')
    if(TIPOS_PADRAO.includes(orc.tipo||'')){setTipo(orc.tipo);setTipoOutro('');setTipoDesc('')}
    else{setTipo('__outro__');setTipoOutro(orc.tipo||'');setTipoDesc(orc.tipo_descricao||'')}
    setProfId(orc.profissional_id||'');setProfNome(orc.profissional_nome||'');setSalvProf(false)
    setDataDoc(orc.data||new Date().toISOString().split('T')[0]);setStatus(orc.status||'Aberto')
    setItens(orc.servicos?.length?orc.servicos:[{nome:'',qtd:1,unitario:'',total:0,obs:''}])
    setDesconto(orc.desconto?String(orc.desconto):'');setExigeSinal(orc.exigir_sinal||false)
    setSinalTipo(orc.sinal_tipo||'fixo');setSinalValor(orc.sinal_valor?String(orc.sinal_valor):'')
    setLinkPag(orc.link_pagamento||'');setObsPag(orc.obs_pagamento||'');setObs(orc.observacoes||'')
    setHistPags(orc.hist_pagamentos||[]);setShowDet(true);setView('form')
  }

  const subtotal = itens.reduce((a,i)=>a+(parseFloat(i.unitario||'0')*(parseInt(i.qtd)||1)),0)
  const descontoN = parseFloat(desconto||'0')
  const total = Math.max(0,subtotal-descontoN)
  const valorPago = histPags.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)
  const saldo = Math.max(0,total-valorPago)

  async function salvar(){
    setMensagem('')
    const erros:string[]=[]
    if(!cNome.trim()) erros.push('Informe o nome do cliente.')
    if(!cWpp||cWpp.replace(/\D/g,'').length<10) erros.push('Informe o WhatsApp com DDD.')
    if(tipo==='__outro__'&&!tipoOutro.trim()) erros.push('Especifique o tipo do documento.')
    if(profId==='__outro__'&&!profNome.trim()) erros.push('Informe o profissional.')
    const itensV=itens.filter(i=>i.nome?.trim()&&parseFloat(i.unitario||'0')>0&&parseInt(i.qtd||'1')>0)
    if(itensV.length===0) erros.push('Adicione pelo menos um serviço com nome e valor.')
    if(erros.length){setMensagem(erros.join(' | '));return}

    const payload:any={
      user_id:userId,cliente_nome:cNome.trim(),
      cliente_whatsapp:cWpp.replace(/\D/g,''),
      cliente_email:cEmail||null,cliente_obs:cObs||null,
      tipo:tipo==='__outro__'?(tipoOutro.trim()||'Outro'):tipo,
      tipo_descricao:tipo==='__outro__'?(tipoDesc.trim()||null):null,
      profissional_id:(profId&&profId!=='__outro__')?profId:null,
      profissional_nome:profId==='__outro__'?(profNome.trim()||null):profId?(profissionais.find((p:any)=>p.id===profId)?.nome||null):null,
      data:dataDoc,status,servicos:itensV,subtotal,desconto:descontoN,total,
      valor_pago:valorPago,saldo_restante:saldo,
      exigir_sinal:exigeSinal,sinal_tipo:exigeSinal?sinalTipo:null,
      sinal_valor:exigeSinal?parseFloat(sinalValor||'0'):null,
      link_pagamento:linkPag||null,obs_pagamento:obsPag.trim()||null,
      hist_pagamentos:histPags,observacoes:observacoes||null,
      updated_at:new Date().toISOString(),
    }
    if(editandoId){
      const {error}=await supabase.from('orcamentos').update(payload).eq('id',editandoId)
      if(error){setMensagem('Erro ao salvar.');return}
    } else {
      const {error}=await supabase.from('orcamentos').insert(payload)
      if(error){setMensagem('Erro ao criar orçamento.');return}
    }
    if(profId==='__outro__'&&profNome.trim()&&salvProf){
      await supabase.from('profissionais').insert({user_id:userId,nome:profNome.trim(),especialidade:'Freelancer'})
      const {data:profs}=await supabase.from('profissionais').select('id,nome').eq('user_id',userId)
      setProfis(profs||[])
    }
    resetForm();setView('lista');await recarregar()
    setMensagem(editandoId?'Orçamento atualizado!':'Orçamento criado!')
    setTimeout(()=>setMensagem(''),3000)
  }

  async function excluir(id:string){
    if(!confirm('Excluir este orçamento?')) return
    await supabase.from('orcamentos').delete().eq('id',id)
    await recarregar()
  }

  function enviarWpp(orc:any){
    const tel=(orc.cliente_whatsapp||'').replace(/\D/g,'');if(!tel) return
    let msg=`Olá, ${orc.cliente_nome}!\n\nSeu ${orc.tipo} — Total: R$ ${fmtBRL(orc.total)}\nPago: R$ ${fmtBRL(orc.valor_pago)}\nSaldo: R$ ${fmtBRL(orc.saldo_restante)}`
    if(orc.link_pagamento) msg+=`\n\nLink:\n${orc.link_pagamento}`
    msg+=`\n\nApós pagar, envie o comprovante. Obrigado!`
    window.open('https://wa.me/55'+tel+'?text='+encodeURIComponent(msg),'_blank')
  }

  function fmtHpValor(raw:string){
    const nums=raw.replace(/\D/g,'');if(!nums) return ''
    return (parseInt(nums,10)/100).toLocaleString('pt-BR',{minimumFractionDigits:2})
  }
  function parseHpValor(v:string){return parseFloat(v.replace(/\./g,'').replace(',','.'))||0}

  function salvarHp(){
    const valor=parseHpValor(hpValor)
    if(!valor||valor<=0){setMensagem('Valor inválido.');return}
    if(hpForma==='Outro'&&!hpFormaOut.trim()){setMensagem('Especifique a forma.');return}
    const forma=hpForma==='Outro'?hpFormaOut.trim():hpForma
    const novo={valor,forma,data:hpData,obs:hpObs.trim()||''}
    if(editHpIdx!==null){setHistPags(prev=>prev.map((p,i)=>i===editHpIdx?novo:p));setEditHpIdx(null)}
    else setHistPags(prev=>[...prev,novo])
    setHpValor('');setHpForma('Pix');setHpFormaOut('');setHpData(new Date().toISOString().split('T')[0]);setHpObs('')
    setShowHpForm(false)
  }

  async function logout(){await supabase.auth.signOut();window.location.href='/login'}

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'N').charAt(0).toUpperCase()
  const grad=avatarGrad(nome)

  const orcsFilt=orcamentos.filter(o=>{
    const passaS=filtroStatus==='Todos'||o.status===filtroStatus
    const passaB=!busca||[o.cliente_nome,o.cliente_whatsapp,o.tipo,o.profissional_nome].some(v=>v?.toLowerCase().includes(busca.toLowerCase()))
    return passaS&&passaB
  })

  const emAberto=orcamentos.filter(o=>['Aberto','Em andamento','Parcialmente pago'].includes(o.status)).length
  const aReceber=orcamentos.filter(o=>!['Pago','Finalizado','Cancelado'].includes(o.status)).reduce((a,o)=>a+(o.saldo_restante||0),0)
  const mes=new Date().toISOString().slice(0,7)
  const recMes=orcamentos.filter(o=>o.updated_at?.slice(0,7)===mes&&o.valor_pago>0).reduce((a,o)=>a+(o.valor_pago||0),0)
  const parciais=orcamentos.filter(o=>o.status==='Parcialmente pago').length

  const orcDetalhe=orcamentos.find(o=>o.id===detalheId)

  // inp / sel / lbl styles
  const inp:React.CSSProperties={width:'100%',background:'rgba(15,23,42,.88)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'10px',padding:'10px 14px',fontSize:'14px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',boxSizing:'border-box',transition:'border-color .2s,box-shadow .2s'}
  const sel:React.CSSProperties={...inp,cursor:'pointer',appearance:'none' as any}
  const lbl:React.CSSProperties={fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:'7px'}
  const crd:React.CSSProperties={background:'radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'16px',padding:'20px 24px',marginBottom:'12px',boxShadow:'0 20px 48px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)'}

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
          <button onClick={logout} style={{display:'flex',alignItems:'center',gap:'6px',width:'100%',background:'rgba(15,23,42,.72)',border:'1px solid rgba(148,163,184,.14)',borderRadius:'8px',padding:'9px 12px',fontSize:'12px',color:'#64748B',cursor:'pointer',fontFamily:'inherit'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sair da conta
          </button>
        </div>
      </div>

      <SB/>
      <div className="main">
        {/* Mobile header */}
        <div className="mob-hdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
            <span style={{display:'block',width:'16px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span>
          <div style={{width:'36px',height:'36px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>

        <div className="pg">
        <div className="body">

        {/* ══ LISTA ══ */}
        {view==='lista'&&(<>

          {/* Topo */}
          <div className="topo-row" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px',width:'100%'}}>
            <div style={{minWidth:0}}>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.03em',marginBottom:'4px'}}>Orçamentos e Cobranças</h1>
              <p style={{fontSize:'14px',color:'#94A3B8'}}>Gerencie orçamentos, cobranças e pagamentos com praticidade.</p>
            </div>
            <div className="topo-btn-wrap" style={{flexShrink:0}}>
              <button onClick={()=>{resetForm();setView('form')}} className="btn-pri">
                <Icon.Plus/> Novo orçamento
              </button>
            </div>
          </div>

          {mensagem&&(
            <div style={{padding:'10px 14px',borderRadius:'10px',marginBottom:'16px',background:mensagem.includes('rro')?'rgba(239,68,68,.15)':'rgba(34,197,94,.15)',border:`1px solid ${mensagem.includes('rro')?'rgba(239,68,68,.3)':'rgba(34,197,94,.3)'}`,color:mensagem.includes('rro')?'#F87171':'#4ADE80',fontSize:'13px'}}>
              {mensagem}
            </div>
          )}

          {/* Cards atalho */}
          <div className="atl-grid">
            {[
              {label:'Novo orçamento', sub:'Crie um orçamento personalizado em segundos.',Icon:Icon.ClipboardList,fn:()=>{resetForm();setView('form')},
                bg:'radial-gradient(circle at top left,rgba(59,130,246,.28),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',
                bd:'rgba(59,130,246,.46)',ico_bg:'rgba(59,130,246,.20)',ico_c:'#60A5FA',glow:'rgba(59,130,246,.24)'},
              {label:'Cobranças',      sub:'Acompanhe e gerencie cobranças emitidas.',  Icon:Icon.Wallet,      fn:()=>setFiltro('Em andamento'),
                bg:'radial-gradient(circle at top left,rgba(124,58,237,.28),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',
                bd:'rgba(124,58,237,.46)',ico_bg:'rgba(124,58,237,.20)',ico_c:'#A78BFA',glow:'rgba(124,58,237,.24)'},
              {label:'Pagamentos',     sub:'Visualize pagamentos confirmados e pendentes.',Icon:Icon.CreditCard,fn:()=>setFiltro('Pago'),
                bg:'radial-gradient(circle at top left,rgba(34,197,94,.22),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',
                bd:'rgba(34,197,94,.40)',ico_bg:'rgba(34,197,94,.18)',ico_c:'#4ADE80',glow:'rgba(34,197,94,.22)'},
              {label:'Clientes',       sub:'Gerencie clientes e informações de contato.', Icon:Icon.Users,   href:'/painel/clientes',
                bg:'radial-gradient(circle at top left,rgba(34,211,238,.22),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',
                bd:'rgba(34,211,238,.38)',ico_bg:'rgba(34,211,238,.16)',ico_c:'#22D3EE',glow:'rgba(34,211,238,.20)'},
            ].map(a=>(
              a.href
                ? <Link key={a.label} href={a.href} className="crd-hov"
                    style={{background:a.bg,border:`1px solid ${a.bd}`,borderRadius:'18px',padding:'20px',textDecoration:'none',display:'block',position:'relative',boxSizing:'border-box' as const,boxShadow:`0 20px 48px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)`}}>
                    <div style={{width:'44px',height:'44px',borderRadius:'14px',background:a.ico_bg,border:`1px solid rgba(255,255,255,.10)`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px',boxShadow:`0 0 20px ${a.glow},inset 0 1px 0 rgba(255,255,255,.05)`}}>
                      <span style={{color:a.ico_c}}><a.Icon/></span>
                    </div>
                    <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'5px'}}>{a.label}</p>
                    <p style={{fontSize:'11px',color:'#64748B',lineHeight:1.4}}>{a.sub}</p>
                    <span style={{position:'absolute',top:'18px',right:'18px',color:a.ico_c,opacity:.7,display:'flex'}}><Icon.ArrowRight/></span>
                  </Link>
                : <button key={a.label} onClick={a.fn} className="crd-hov"
                    style={{background:a.bg,border:`1px solid ${a.bd}`,borderRadius:'18px',padding:'20px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',display:'block',position:'relative',width:'100%',boxSizing:'border-box' as const,boxShadow:`0 20px 48px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)`}}>
                    <div style={{width:'44px',height:'44px',borderRadius:'14px',background:a.ico_bg,border:`1px solid rgba(255,255,255,.10)`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px',boxShadow:`0 0 20px ${a.glow},inset 0 1px 0 rgba(255,255,255,.05)`}}>
                      <span style={{color:a.ico_c}}><a.Icon/></span>
                    </div>
                    <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'5px'}}>{a.label}</p>
                    <p style={{fontSize:'11px',color:'#64748B',lineHeight:1.4}}>{a.sub}</p>
                    <span style={{position:'absolute',top:'18px',right:'18px',color:a.ico_c,opacity:.7,display:'flex'}}><Icon.ArrowRight/></span>
                  </button>
            ))}
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {label:'Em aberto',       valor:emAberto,  fmt:'n',  Icon:Icon.ClipboardList,cor:'#60A5FA',bd:'rgba(59,130,246,.34)', ico_bg:'rgba(59,130,246,.15)', glow:'rgba(59,130,246,.24)'},
              {label:'A receber',       valor:aReceber,  fmt:'brl',Icon:Icon.Wallet,       cor:'#F59E0B',bd:'rgba(245,158,11,.38)', ico_bg:'rgba(245,158,11,.15)', glow:'rgba(245,158,11,.22)'},
              {label:'Recebido no mês', valor:recMes,    fmt:'brl',Icon:Icon.CreditCard,   cor:'#22C55E',bd:'rgba(34,197,94,.38)',  ico_bg:'rgba(34,197,94,.15)',  glow:'rgba(34,197,94,.22)'},
              {label:'Parciais',        valor:parciais,  fmt:'n',  Icon:Icon.BarChart3,    cor:'#A78BFA',bd:'rgba(124,58,237,.38)',ico_bg:'rgba(124,58,237,.17)',glow:'rgba(124,58,237,.26)'},
            ].map(m=>(
              <div key={m.label} style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:`1.5px solid ${m.bd}`,borderRadius:'16px',padding:'18px',boxSizing:'border-box' as const,boxShadow:'0 20px 48px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'12px',background:m.ico_bg,border:'1px solid rgba(255,255,255,.10)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px',boxShadow:`0 0 20px ${m.glow},inset 0 1px 0 rgba(255,255,255,.05)`}}>
                  <span style={{color:m.cor}}><m.Icon/></span>
                </div>
                <p style={{fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',marginBottom:'5px'}}>{m.label}</p>
                <p style={{fontSize:'26px',fontWeight:800,color:m.cor,letterSpacing:'-0.02em',lineHeight:1.1}}>
                  {m.fmt==='brl'?'R$ '+fmtBRL(m.valor as number):m.valor}
                </p>
              </div>
            ))}
          </div>

          {/* Busca + Filtros */}
          <div style={{marginBottom:'12px',width:'100%'}}>
            <div className="busca-wrap" style={{marginBottom:'12px'}}>
              <span className="busca-ico"><Icon.Search/></span>
              <input type="text" className="busca-inp" placeholder="Buscar cliente, contato ou serviço..."
                value={busca} onChange={e=>setBusca(e.target.value)}/>
            </div>
          </div>
          <div className="filtros-wrap">
            {STATUS_LIST.map(s=>(
              <button key={s} onClick={()=>setFiltro(s)} className={`filtro-pill${filtroStatus===s?' on':''}`}>{s}</button>
            ))}
          </div>

          {/* Estado vazio */}
          {orcsFilt.length===0?(
            <div style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.12),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'20px',padding:'56px 24px',textAlign:'center',boxShadow:'0 20px 48px rgba(0,0,0,.28)',marginBottom:'24px'}}>
              <div style={{width:'64px',height:'64px',borderRadius:'20px',background:'rgba(59,130,246,.18)',border:'1px solid rgba(59,130,246,.32)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',boxShadow:'0 0 32px rgba(59,130,246,.22)',color:'#60A5FA'}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><rect x="3" y="6" width="18" height="16" rx="2"/><path d="M8 12h8M8 16h5"/></svg>
              </div>
              <p style={{fontSize:'18px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>
                {busca||filtroStatus!=='Todos'?'Nenhum orçamento encontrado':'Nenhum orçamento ainda'}
              </p>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.6,marginBottom:'24px',maxWidth:'360px',margin:'0 auto 24px'}}>
                {busca||filtroStatus!=='Todos'?'Tente ajustar os filtros ou a busca.':'Crie seu primeiro orçamento, registre pagamentos e envie pelo WhatsApp.'}
              </p>
              {!busca&&filtroStatus==='Todos'&&(
                <button onClick={()=>{resetForm();setView('form')}} className="btn-pri" style={{display:'inline-flex',fontSize:'14px',padding:'12px 28px',borderRadius:'10px'}}>
                  <Icon.Plus/> Criar primeiro orçamento
                </button>
              )}
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'24px'}}>
              {orcsFilt.map(orc=>{
                const cfg=STATUS_CFG[orc.status]||STATUS_CFG['Aberto']
                const ag2=avatarGrad(orc.cliente_nome||'A')
                return(
                  <div key={orc.id} style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98))',border:`1.5px solid ${cfg.bd}`,borderRadius:'16px',padding:'18px 20px',boxShadow:'0 12px 32px rgba(0,0,0,.24)',width:'100%',boxSizing:'border-box' as const}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',marginBottom:'14px',flexWrap:'wrap'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'12px',minWidth:0}}>
                        <div style={{width:'40px',height:'40px',borderRadius:'50%',background:ag2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',fontWeight:700,color:'#fff',flexShrink:0}}>
                          {(orc.cliente_nome||'?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{minWidth:0}}>
                          <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{orc.cliente_nome}</p>
                          <p style={{fontSize:'12px',color:'#64748B'}}>{orc.tipo} · {fmtData(orc.data)}{orc.profissional_nome?` · ${orc.profissional_nome}`:''}</p>
                        </div>
                      </div>
                      <span style={{fontSize:'11px',fontWeight:700,padding:'4px 12px',borderRadius:'999px',background:cfg.bg,color:cfg.cor,border:`1px solid ${cfg.bd}`,flexShrink:0,whiteSpace:'nowrap'}}>
                        {orc.status}
                      </span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'14px'}}>
                      {[{l:'Total',v:orc.total,c:'#F8FAFC'},{l:'Pago',v:orc.valor_pago,c:'#4ADE80'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#FBBF24':'#4ADE80'}].map(f=>(
                        <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:'10px',padding:'10px 12px',border:'1px solid rgba(255,255,255,.07)'}}>
                          <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.05em',marginBottom:'3px'}}>{f.l}</p>
                          <p style={{fontSize:'14px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                      <button onClick={()=>{setDetalheId(orc.id);setView('detalhe')}} className="btn-sec" style={{flex:1,minWidth:'80px'}}>
                        <Icon.Eye/> Ver
                      </button>
                      <button onClick={()=>enviarWpp(orc)} className="btn-wpp" style={{flex:1,minWidth:'80px'}}>
                        <Icon.MessageCircle/> WApp
                      </button>
                      <button onClick={()=>abrirEditar(orc)} className="btn-sec" style={{flex:1,minWidth:'80px'}}>
                        <Icon.Edit/> Editar
                      </button>
                      <button onClick={()=>excluir(orc.id)}
                        style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.26)',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px',whiteSpace:'nowrap',transition:'all .2s'}}>
                        <Icon.Trash/>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Ações rápidas */}
          <div style={{marginBottom:'8px'}}>
            <p style={{fontSize:'11px',fontWeight:700,color:'#475569',textTransform:'uppercase' as const,letterSpacing:'.09em',marginBottom:'12px'}}>Ações rápidas</p>
            <div className="ac-grid">
              {[
                {label:'Criar orçamento',    sub:'Novo personalizado',         I:Icon.ClipboardList,fn:()=>{resetForm();setView('form')}, bg:'rgba(59,130,246,.1)', bd:'rgba(59,130,246,.32)', ic_bg:'rgba(59,130,246,.18)', cor:'#60A5FA', glow:'rgba(59,130,246,.24)'},
                {label:'Registrar pagamento',sub:'Marcar recebido',             I:Icon.CreditCard,   fn:()=>setFiltro('Parcialmente pago'),bg:'rgba(34,197,94,.1)', bd:'rgba(34,197,94,.32)', ic_bg:'rgba(34,197,94,.16)', cor:'#4ADE80', glow:'rgba(34,197,94,.22)'},
                {label:'Enviar link',        sub:'Compartilhar com cliente',    I:Icon.Link2,        fn:()=>{},                            bg:'rgba(124,58,237,.1)',bd:'rgba(124,58,237,.32)',ic_bg:'rgba(124,58,237,.18)',cor:'#A78BFA',glow:'rgba(124,58,237,.24)'},
                {label:'Relatórios',         sub:'Ver indicadores',             I:Icon.BarChart3,    href:'/painel/relatorio',             bg:'rgba(34,211,238,.1)',bd:'rgba(34,211,238,.30)',ic_bg:'rgba(34,211,238,.16)',cor:'#22D3EE',glow:'rgba(34,211,238,.20)'},
              ].map(a=>(
                a.href
                  ? <Link key={a.label} href={a.href} style={{background:`linear-gradient(145deg,rgba(15,23,42,.92),rgba(8,20,33,.96))`,border:`1.5px solid ${a.bd}`,borderRadius:'14px',padding:'16px',textDecoration:'none',display:'block',boxShadow:'0 12px 32px rgba(0,0,0,.24)'}}>
                      <div style={{width:'40px',height:'40px',borderRadius:'12px',background:a.ic_bg,border:'1px solid rgba(255,255,255,.10)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'10px',boxShadow:`0 0 18px ${a.glow}`}}>
                        <span style={{color:a.cor}}><a.I/></span>
                      </div>
                      <p style={{fontSize:'12px',fontWeight:700,color:'#F8FAFC',marginBottom:'2px'}}>{a.label}</p>
                      <p style={{fontSize:'11px',color:'#64748B',lineHeight:1.3}}>{a.sub}</p>
                    </Link>
                  : <button key={a.label} onClick={a.fn} style={{background:`linear-gradient(145deg,rgba(15,23,42,.92),rgba(8,20,33,.96))`,border:`1.5px solid ${a.bd}`,borderRadius:'14px',padding:'16px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',width:'100%',boxSizing:'border-box' as const,boxShadow:'0 12px 32px rgba(0,0,0,.24)'}}>
                      <div style={{width:'40px',height:'40px',borderRadius:'12px',background:a.ic_bg,border:'1px solid rgba(255,255,255,.10)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'10px',boxShadow:`0 0 18px ${a.glow}`}}>
                        <span style={{color:a.cor}}><a.I/></span>
                      </div>
                      <p style={{fontSize:'12px',fontWeight:700,color:'#F8FAFC',marginBottom:'2px'}}>{a.label}</p>
                      <p style={{fontSize:'11px',color:'#64748B',lineHeight:1.3}}>{a.sub}</p>
                    </button>
              ))}
            </div>
          </div>

        </>)}

        {/* ══ FORMULÁRIO ══ */}
        {view==='form'&&(
          <div style={{maxWidth:'900px',margin:'0 auto',width:'100%'}}>

            {/* Topo form */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
              <div>
                <button onClick={()=>{resetForm();setView('lista')}}
                  style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'8px'}}>
                  ← Voltar à lista
                </button>
                <h1 style={{fontSize:'20px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em',marginBottom:'2px'}}>{editandoId?'Editar orçamento':'Novo orçamento'}</h1>
                <p style={{fontSize:'13px',color:'#64748B'}}>Preencha os dados e envie para o cliente.</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'6px',background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'8px',padding:'6px 12px'}}>
                <span style={{fontSize:'12px',color:'#4ADE80'}}>✓</span>
                <span style={{fontSize:'12px',fontWeight:600,color:'#4ADE80'}}>Salvo automaticamente</span>
              </div>
            </div>

            {mensagem&&(
              <div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',color:mensagem.includes('rro')?'#F87171':'#4ADE80',background:mensagem.includes('rro')?'rgba(239,68,68,.15)':'rgba(34,197,94,.15)',border:`1px solid ${mensagem.includes('rro')?'rgba(239,68,68,.3)':'rgba(34,197,94,.3)'}`}}>
                {mensagem}
              </div>
            )}

            {/* Grid form 2 cols desktop */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:'20px',alignItems:'start'}} className="form-grid-inner">
              <style>{`.form-grid-inner{grid-template-columns:1fr 280px!important} @media(max-width:1023px){.form-grid-inner{grid-template-columns:1fr!important}}`}</style>

              {/* Coluna principal */}
              <div>

                {/* CARD: Cliente */}
                <div style={crd}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'10px',background:'rgba(34,211,238,.18)',border:'1px solid rgba(255,255,255,.10)',display:'flex',alignItems:'center',justifyContent:'center',color:'#22D3EE'}}>
                      <Icon.Users/>
                    </div>
                    <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>Cliente</p>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div>
                      <label style={lbl}>Nome *</label>
                      <input style={inp} type="text" placeholder="Nome do cliente" value={cNome} onChange={e=>setCNome(e.target.value)}/>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                      <div>
                        <label style={lbl}>WhatsApp *</label>
                        <input style={inp} type="tel" placeholder="(11) 99999-9999" value={cWpp} onChange={e=>setCWpp(mascaraTel(e.target.value))}/>
                      </div>
                      <div>
                        <label style={lbl}>E-mail (opcional)</label>
                        <input style={inp} type="email" placeholder="email@exemplo.com" value={cEmail} onChange={e=>setCEmail(e.target.value)}/>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACCORDION: Detalhes */}
                <div style={{...crd,padding:0,overflow:'hidden'}}>
                  <div onClick={()=>setShowDet(!showDet)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',cursor:'pointer',userSelect:'none'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'32px',height:'32px',borderRadius:'10px',background:'rgba(59,130,246,.18)',border:'1px solid rgba(255,255,255,.10)',display:'flex',alignItems:'center',justifyContent:'center',color:'#60A5FA'}}>
                        <Icon.ClipboardList/>
                      </div>
                      <div>
                        <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Detalhes do documento</p>
                        <p style={{fontSize:'12px',color:'#64748B',marginTop:'1px'}}>Tipo, status, profissional e data.</p>
                      </div>
                    </div>
                    <span style={{color:'#64748B',fontSize:'18px',transform:showDet?'rotate(180deg)':'none',transition:'transform .2s'}}><Icon.ChevronDown/></span>
                  </div>
                  {showDet&&(
                    <div style={{padding:'0 20px 18px',borderTop:'1px solid rgba(148,163,184,.08)',display:'flex',flexDirection:'column',gap:'12px',marginTop:'16px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                        <div>
                          <label style={lbl}>Tipo</label>
                          <select style={sel} value={tipo} onChange={e=>{setTipo(e.target.value);if(e.target.value!=='__outro__')setTipoOutro('')}}>
                            {TIPOS_PADRAO.map(t=><option key={t}>{t}</option>)}
                            <option value="__outro__">Outro</option>
                          </select>
                          {tipo==='__outro__'&&(
                            <div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'6px'}}>
                              <input style={inp} type="text" placeholder="Ex: Avaliação, Laudo..." value={tipoOutro} onChange={e=>setTipoOutro(e.target.value)}/>
                              <input style={inp} type="text" placeholder="Descrição (opcional)" value={tipoDesc} onChange={e=>setTipoDesc(e.target.value)}/>
                            </div>
                          )}
                        </div>
                        <div>
                          <label style={lbl}>Status</label>
                          <select style={sel} value={status} onChange={e=>setStatus(e.target.value)}>
                            {['Aberto','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado'].map(s=><option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                        <div>
                          <label style={lbl}>Profissional</label>
                          <select style={sel} value={profId} onChange={e=>{setProfId(e.target.value);if(e.target.value!=='__outro__'){setProfNome('');setSalvProf(false)}}}>
                            <option value="">Nenhum</option>
                            {profissionais.map((p:any)=><option key={p.id} value={p.id}>{p.nome}</option>)}
                            <option value="__outro__">✏️ Outro / Não cadastrado</option>
                          </select>
                          {profId==='__outro__'&&(
                            <div style={{marginTop:'8px',padding:'12px',background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.25)',borderRadius:'10px',display:'flex',flexDirection:'column',gap:'8px'}}>
                              <input style={inp} type="text" placeholder="Nome do profissional" value={profNome} onChange={e=>setProfNome(e.target.value)}/>
                              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                <button onClick={()=>setSalvProf(!salvProf)}
                                  style={{width:'32px',height:'18px',borderRadius:'999px',border:'none',cursor:'pointer',position:'relative',background:salvProf?'#3B82F6':'rgba(255,255,255,.15)',flexShrink:0}}>
                                  <span style={{position:'absolute',top:'2px',left:salvProf?'14px':'2px',width:'14px',height:'14px',borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                                </button>
                                <span style={{fontSize:'12px',color:'#94A3B8'}}>Salvar na equipe?</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <label style={lbl}>Data</label>
                          <input style={inp} type="date" value={dataDoc} onChange={e=>setDataDoc(e.target.value)}/>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD: Serviços */}
                <div style={crd}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'10px',background:'rgba(236,72,153,.16)',border:'1px solid rgba(255,255,255,.10)',display:'flex',alignItems:'center',justifyContent:'center',color:'#F472B6'}}>
                      <Icon.ClipboardList/>
                    </div>
                    <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>Serviços / Procedimentos</p>
                  </div>
                  {itens.map((item,idx)=>(
                    <div key={idx} style={{marginBottom:'12px',padding:'14px',background:'rgba(255,255,255,.04)',borderRadius:'12px',border:'1px solid rgba(255,255,255,.08)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                        <span style={{fontSize:'11px',fontWeight:700,color:'#4B5563',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>Item {idx+1}</span>
                        {itens.length>1&&(
                          <button onClick={()=>setItens(prev=>prev.filter((_,i)=>i!==idx))}
                            style={{background:'rgba(239,68,68,.14)',border:'1px solid rgba(239,68,68,.28)',borderRadius:'6px',color:'#F87171',cursor:'pointer',fontSize:'12px',padding:'3px 8px',fontFamily:'inherit'}}>
                            Remover
                          </button>
                        )}
                      </div>
                      <div style={{marginBottom:'8px'}}>
                        <label style={lbl}>Nome do serviço *</label>
                        <input style={inp} type="text" placeholder="Ex: Corte, Limpeza de pele..." value={item.nome} onChange={e=>atualizarItem(idx,'nome',e.target.value)}/>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                        <div>
                          <label style={lbl}>Qtd.</label>
                          <input style={{...inp,textAlign:'center'}} type="number" min="1" value={item.qtd} onChange={e=>atualizarItem(idx,'qtd',e.target.value)}/>
                        </div>
                        <div>
                          <label style={lbl}>Valor unitário</label>
                          <div style={{position:'relative'}}>
                            <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'#4B5563',fontWeight:600}}>R$</span>
                            <input style={{...inp,paddingLeft:'30px'}} type="number" min="0" step="0.01" placeholder="0,00" value={item.unitario} onChange={e=>atualizarItem(idx,'unitario',e.target.value)}/>
                          </div>
                        </div>
                      </div>
                      <div style={{background:item.total>0?'rgba(34,197,94,.1)':'rgba(255,255,255,.03)',border:`1px solid ${item.total>0?'rgba(34,197,94,.25)':'rgba(255,255,255,.07)'}`,borderRadius:'8px',padding:'9px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                        <span style={{fontSize:'12px',color:'#64748B',fontWeight:600}}>Total</span>
                        <span style={{fontSize:'15px',fontWeight:800,color:item.total>0?'#4ADE80':'#374151'}}>R$ {fmtBRL(item.total||0)}</span>
                      </div>
                      <input style={{...inp,fontSize:'13px'}} type="text" placeholder="Observação opcional" value={item.obs} onChange={e=>atualizarItem(idx,'obs',e.target.value)}/>
                    </div>
                  ))}
                  <button onClick={()=>setItens(prev=>[...prev,{nome:'',qtd:1,unitario:'',total:0,obs:''}])}
                    style={{background:'none',border:'none',color:'#3B82F6',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',padding:'4px 0',display:'flex',alignItems:'center',gap:'4px'}}>
                    + Adicionar serviço
                  </button>
                  {/* Subtotal */}
                  <div style={{marginTop:'14px',background:'rgba(255,255,255,.03)',borderRadius:'10px',padding:'14px 16px',border:'1px solid rgba(255,255,255,.07)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'8px'}}>
                      <span style={{color:'#94A3B8'}}>Subtotal</span>
                      <span style={{fontWeight:600,color:'#F8FAFC'}}>R$ {fmtBRL(subtotal)}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',marginBottom:'10px',paddingBottom:'10px',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
                      <span style={{color:'#94A3B8'}}>Desconto</span>
                      <input type="number" min="0" step="0.01" placeholder="0,00" value={desconto} onChange={e=>setDesconto(e.target.value)}
                        style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',outline:'none',color:'#F87171',fontSize:'13px',fontWeight:600,textAlign:'right' as const,width:'90px',fontFamily:'inherit',borderRadius:'6px',padding:'4px 8px'}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Total final</span>
                      <span style={{fontSize:'20px',fontWeight:800,color:'#3B82F6'}}>R$ {fmtBRL(total)}</span>
                    </div>
                  </div>
                </div>

                {/* ACCORDION: Pagamento */}
                <div style={{...crd,padding:0,overflow:'hidden'}}>
                  <div onClick={()=>setShowPag(!showPag)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',cursor:'pointer',userSelect:'none'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'32px',height:'32px',borderRadius:'10px',background:'rgba(34,197,94,.18)',border:'1px solid rgba(255,255,255,.10)',display:'flex',alignItems:'center',justifyContent:'center',color:'#4ADE80'}}>
                        <Icon.CreditCard/>
                      </div>
                      <div>
                        <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Pagamento</p>
                        <p style={{fontSize:'12px',color:'#64748B',marginTop:'1px'}}>{valorPago>0?`Pago: R$ ${fmtBRL(valorPago)} · Saldo: R$ ${fmtBRL(saldo)}`:'Entrada, parciais e link de cobrança.'}</p>
                      </div>
                    </div>
                    <span style={{color:'#64748B',fontSize:'18px',transform:showPag?'rotate(180deg)':'none',transition:'transform .2s'}}><Icon.ChevronDown/></span>
                  </div>
                  {showPag&&(
                    <div style={{padding:'0 20px 18px',borderTop:'1px solid rgba(148,163,184,.08)'}}>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',margin:'16px 0'}}>
                        {[{l:'Total',v:total,c:'#F8FAFC'},{l:'Pago',v:valorPago,c:'#4ADE80'},{l:'Saldo',v:saldo,c:saldo>0?'#FBBF24':'#4ADE80'}].map(f=>(
                          <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:'10px',padding:'10px 12px',border:'1px solid rgba(255,255,255,.07)'}}>
                            <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.05em',marginBottom:'3px'}}>{f.l}</p>
                            <p style={{fontSize:'15px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Toggle sinal */}
                      <div style={{marginBottom:'14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:exigeSinal?'12px':'0'}}>
                          <button onClick={()=>setExigeSinal(!exigeSinal)}
                            style={{width:'36px',height:'20px',borderRadius:'999px',border:'none',cursor:'pointer',position:'relative',background:exigeSinal?'#3B82F6':'rgba(255,255,255,.15)'}}>
                            <span style={{position:'absolute',top:'2px',left:exigeSinal?'18px':'2px',width:'16px',height:'16px',borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                          </button>
                          <span style={{fontSize:'13px',color:'#CBD5E1',cursor:'pointer'}} onClick={()=>setExigeSinal(!exigeSinal)}>Exigir entrada / sinal?</span>
                        </div>
                        {exigeSinal&&(
                          <div style={{background:'rgba(255,255,255,.03)',borderRadius:'10px',padding:'14px',border:'1px solid rgba(255,255,255,.07)',display:'flex',flexDirection:'column',gap:'10px'}}>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                              <div><label style={lbl}>Tipo</label>
                                <select style={sel} value={sinalTipo} onChange={e=>setSinalTipo(e.target.value)}>
                                  <option value="fixo">Valor fixo (R$)</option>
                                  <option value="percentual">Porcentagem (%)</option>
                                </select></div>
                              <div><label style={lbl}>{sinalTipo==='fixo'?'Valor (R$)':'Percentual (%)'}</label>
                                <input style={inp} type="number" min="0" placeholder={sinalTipo==='fixo'?'0,00':'50'} value={sinalValor} onChange={e=>setSinalValor(e.target.value)}/></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Link */}
                      <div style={{marginBottom:'14px'}}>
                        <label style={lbl}>Link de pagamento</label>
                        <input style={inp} type="url" placeholder="Cole o link do Mercado Pago, Asaas, PagSeguro..." value={linkPag} onChange={e=>setLinkPag(e.target.value)}/>
                      </div>

                      {/* Hist pagamentos */}
                      <div style={{borderTop:'1px solid rgba(255,255,255,.07)',paddingTop:'14px'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                          <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC'}}>Pagamentos registrados</p>
                          <button onClick={()=>setShowHpForm(!showHpForm)}
                            style={{background:'rgba(59,130,246,.2)',border:'1px solid rgba(59,130,246,.3)',borderRadius:'6px',padding:'5px 12px',fontSize:'12px',fontWeight:600,color:'#93C5FD',cursor:'pointer',fontFamily:'inherit'}}>
                            + Registrar
                          </button>
                        </div>
                        {showHpForm&&(
                          <div style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.22)',borderRadius:'12px',padding:'16px',marginBottom:'12px'}}>
                            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                                <div><label style={lbl}>Valor *</label>
                                  <input style={inp} type="text" inputMode="numeric" placeholder="0,00" value={hpValor}
                                    onChange={e=>{const v=e.target.value.replace(/[^0-9]/g,'');setHpValor(fmtHpValor(v||'0'))}}/></div>
                                <div><label style={lbl}>Data *</label>
                                  <input style={inp} type="date" value={hpData} onChange={e=>setHpData(e.target.value)}/></div>
                              </div>
                              <div><label style={lbl}>Forma *</label>
                                <select style={sel} value={hpForma} onChange={e=>{setHpForma(e.target.value);if(e.target.value!=='Outro')setHpFormaOut('')}}>
                                  {FORMAS_PAG.map(f=><option key={f}>{f}</option>)}
                                </select>
                                {hpForma==='Outro'&&<input style={{...inp,marginTop:'6px'}} type="text" placeholder="Especifique..." value={hpFormaOut} onChange={e=>setHpFormaOut(e.target.value)}/>}
                              </div>
                              <div><label style={lbl}>Observação</label>
                                <input style={inp} type="text" placeholder="Ex: entrada, parcela 2..." value={hpObs} onChange={e=>setHpObs(e.target.value)}/></div>
                              <div style={{display:'flex',gap:'8px'}}>
                                <button onClick={()=>{setShowHpForm(false);setEditHpIdx(null)}}
                                  style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#64748B',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                                <button onClick={salvarHp}
                                  style={{flex:2,background:'#3B82F6',border:'none',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'inherit'}}>
                                  {editHpIdx!==null?'Atualizar':'Salvar pagamento'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        {histPags.length===0&&!showHpForm&&<p style={{fontSize:'12px',color:'#4B5563'}}>Nenhum pagamento registrado ainda.</p>}
                        {histPags.map((p,i)=>(
                          <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'8px',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px',marginBottom:'6px'}}>
                            <div>
                              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                                <span style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(p.valor)}</span>
                                <span style={{fontSize:'11px',color:'#64748B'}}>{p.forma}</span>
                                <span style={{fontSize:'11px',color:'#4B5563'}}>· {fmtData(p.data)}</span>
                              </div>
                              {p.obs&&<p style={{fontSize:'12px',color:'#64748B'}}>{p.obs}</p>}
                            </div>
                            <div style={{display:'flex',gap:'5px'}}>
                              <button onClick={()=>{setEditHpIdx(i);setHpValor(fmtHpValor(String(Math.round(p.valor*100))));setHpForma(FORMAS_PAG.includes(p.forma)?p.forma:'Outro');setHpFormaOut(FORMAS_PAG.includes(p.forma)?'':p.forma);setHpData(p.data);setHpObs(p.obs||'');setShowHpForm(true)}}
                                style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>✏️</button>
                              <button onClick={()=>setHistPags(prev=>prev.filter((_,j)=>j!==i))}
                                style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>🗑</button>
                            </div>
                          </div>
                        ))}
                        {histPags.length>0&&(
                          <div style={{background:'rgba(34,197,94,.10)',border:'1px solid rgba(34,197,94,.22)',borderRadius:'8px',padding:'8px 14px',display:'flex',justifyContent:'space-between',marginTop:'4px'}}>
                            <span style={{fontSize:'13px',color:'#64748B',fontWeight:600}}>Total pago</span>
                            <span style={{fontSize:'14px',fontWeight:800,color:'#4ADE80'}}>R$ {fmtBRL(valorPago)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCORDION: Observações */}
                <div style={{...crd,padding:0,overflow:'hidden'}}>
                  <div onClick={()=>setShowObs2(!showObs2)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',cursor:'pointer',userSelect:'none'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:'32px',height:'32px',borderRadius:'10px',background:'rgba(148,163,184,.12)',border:'1px solid rgba(255,255,255,.10)',display:'flex',alignItems:'center',justifyContent:'center',color:'#CBD5E1'}}>
                        <Icon.Edit/>
                      </div>
                      <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Observações</p>
                    </div>
                    <span style={{color:'#64748B',fontSize:'18px',transform:showObs2?'rotate(180deg)':'none',transition:'transform .2s'}}><Icon.ChevronDown/></span>
                  </div>
                  {showObs2&&(
                    <div style={{padding:'0 20px 18px',borderTop:'1px solid rgba(148,163,184,.08)',display:'flex',flexDirection:'column',gap:'10px',marginTop:'16px'}}>
                      <div><label style={lbl}>Observação do cliente</label>
                        <textarea rows={2} style={{...inp,resize:'none' as const}} placeholder="Alergias, preferências, histórico..." value={cObs} onChange={e=>setCObs(e.target.value)}/></div>
                      <div><label style={lbl}>Observações do orçamento</label>
                        <textarea rows={3} style={{...inp,resize:'none' as const}} placeholder="Informações adicionais..." value={observacoes} onChange={e=>setObs(e.target.value)}/></div>
                    </div>
                  )}
                </div>

              </div>

              {/* Coluna direita: Resumo sticky */}
              <div style={{position:'sticky',top:'24px'}}>
                <div style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.12),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',borderRadius:'18px',padding:'20px',border:'1.5px solid rgba(148,163,184,.18)',boxShadow:'0 20px 48px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)'}}>
                  <p style={{fontSize:'11px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.07em',marginBottom:'16px'}}>Resumo</p>
                  <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'16px'}}>
                    <div><p style={{fontSize:'10px',fontWeight:700,color:'#374151',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'2px'}}>Cliente</p>
                      <p style={{fontSize:'14px',fontWeight:600,color:cNome?'#F8FAFC':'#374151'}}>{cNome||'Não informado'}</p></div>
                    <div><p style={{fontSize:'10px',fontWeight:700,color:'#374151',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'2px'}}>Tipo</p>
                      <p style={{fontSize:'13px',color:'#94A3B8'}}>{tipo==='__outro__'?(tipoOutro||'Outro'):tipo}</p></div>
                    <div style={{height:'1px',background:'rgba(255,255,255,.07)'}}/>
                    <div><p style={{fontSize:'10px',fontWeight:700,color:'#374151',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'4px'}}>Total final</p>
                      <p style={{fontSize:'26px',fontWeight:800,color:'#3B82F6',letterSpacing:'-0.03em'}}>R$ {fmtBRL(total)}</p></div>
                    {valorPago>0&&<div><p style={{fontSize:'10px',fontWeight:700,color:'#374151',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'2px'}}>Valor pago</p>
                      <p style={{fontSize:'16px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(valorPago)}</p></div>}
                    {saldo>0&&<div><p style={{fontSize:'10px',fontWeight:700,color:'#374151',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'2px'}}>Saldo restante</p>
                      <p style={{fontSize:'16px',fontWeight:700,color:'#FBBF24'}}>R$ {fmtBRL(saldo)}</p></div>}
                    <div>
                      {(()=>{const cfg=STATUS_CFG[status]||STATUS_CFG['Aberto'];return<span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:cfg.bg,color:cfg.cor,border:`1px solid ${cfg.bd}`}}>{status}</span>})()}
                    </div>
                  </div>
                  <button onClick={salvar}
                    style={{width:'100%',background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'1px solid rgba(255,255,255,.10)',borderRadius:'8px',padding:'13px',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 12px 32px rgba(59,130,246,.30)',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                    📄 {editandoId?'Salvar alterações':'Criar orçamento'}
                  </button>
                  <button onClick={()=>{resetForm();setView('lista')}}
                    style={{width:'100%',background:'rgba(255,255,255,.05)',color:'#64748B',border:'1px solid rgba(255,255,255,.08)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                    Salvar como rascunho
                  </button>
                </div>
              </div>

            </div>

            {/* Mobile footer */}
            <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#07111F',borderTop:'1px solid rgba(148,163,184,.1)',padding:'10px 16px calc(10px + env(safe-area-inset-bottom,0px))',zIndex:25,display:'flex',flexDirection:'column',gap:'8px'}} className="mob-form-foot">
              <style>{`@media(min-width:1024px){.mob-form-foot{display:none!important}}`}</style>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'12px',color:'#64748B',fontWeight:600}}>Total final</span>
                <span style={{fontSize:'18px',fontWeight:800,color:'#3B82F6'}}>R$ {fmtBRL(total)}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'8px'}}>
                <button onClick={()=>{resetForm();setView('lista')}}
                  style={{background:'rgba(255,255,255,.07)',color:'#64748B',border:'1px solid rgba(255,255,255,.1)',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                  Rascunho
                </button>
                <button onClick={salvar}
                  style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 0',fontSize:'14px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 12px rgba(59,130,246,.35)'}}>
                  {editandoId?'Salvar':'Criar orçamento'}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ══ DETALHE ══ */}
        {view==='detalhe'&&orcDetalhe&&(()=>{
          const orc=orcDetalhe
          const cfg=STATUS_CFG[orc.status]||STATUS_CFG['Aberto']
          const ag3=avatarGrad(orc.cliente_nome||'A')
          return(
            <div style={{maxWidth:'800px',margin:'0 auto',width:'100%'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}}>
                <button onClick={()=>setView('lista')} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit'}}>← Voltar</button>
                <div style={{width:'36px',height:'36px',borderRadius:'50%',background:ag3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:700,color:'#fff',flexShrink:0}}>
                  {(orc.cliente_nome||'?').charAt(0).toUpperCase()}
                </div>
                <h2 style={{fontSize:'18px',fontWeight:800,color:'#F8FAFC',flex:1,minWidth:0}}>{orc.tipo} — {orc.cliente_nome}</h2>
                <span style={{fontSize:'11px',fontWeight:700,padding:'4px 12px',borderRadius:'999px',background:cfg.bg,color:cfg.cor,border:`1px solid ${cfg.bd}`,flexShrink:0}}>{orc.status}</span>
              </div>

              {/* Resumo financeiro */}
              <div style={crd}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'14px'}}>📊 Resumo financeiro</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'16px'}}>
                  {[{l:'Total',v:orc.total,c:'#F8FAFC'},{l:'Pago',v:orc.valor_pago,c:'#4ADE80'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#FBBF24':'#4ADE80'}].map(f=>(
                    <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:'10px',padding:'12px',border:'1px solid rgba(255,255,255,.07)'}}>
                      <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.05em',marginBottom:'4px'}}>{f.l}</p>
                      <p style={{fontSize:'20px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  <button onClick={()=>enviarWpp(orc)} className="btn-wpp"><Icon.MessageCircle/> WhatsApp</button>
                  <button onClick={()=>abrirEditar(orc)} className="btn-sec"><Icon.Edit/> Editar</button>
                  {orc.link_pagamento&&<button onClick={()=>navigator.clipboard.writeText(orc.link_pagamento)} className="btn-sec"><Icon.Link2/> Copiar link</button>}
                </div>
              </div>

              {/* Serviços */}
              {(orc.servicos?.length>0)&&(
                <div style={crd}>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>🛎 Serviços</p>
                  {(orc.servicos||[]).map((s:any,i:number)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(148,163,184,.07)'}}>
                      <div><p style={{fontSize:'13px',color:'#F8FAFC',fontWeight:600}}>{s.nome}</p><p style={{fontSize:'11px',color:'#64748B'}}>{s.qtd||1}x · R$ {fmtBRL(parseFloat(s.unitario||'0'))}</p></div>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(s.total||0)}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'16px',fontWeight:800,paddingTop:'12px',marginTop:'4px'}}>
                    <span style={{color:'#F8FAFC'}}>Total</span>
                    <span style={{color:'#3B82F6'}}>R$ {fmtBRL(orc.total)}</span>
                  </div>
                </div>
              )}

              {/* Hist pagamentos */}
              <div style={crd}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>📜 Histórico de pagamentos</p>
                {(!orc.hist_pagamentos||orc.hist_pagamentos.length===0)
                  ?<p style={{fontSize:'13px',color:'#64748B'}}>Nenhum pagamento registrado.</p>
                  :(orc.hist_pagamentos||[]).map((p:any,i:number)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(148,163,184,.07)'}}>
                      <div><p style={{fontSize:'13px',color:'#F8FAFC',fontWeight:600}}>{p.forma} · {fmtData(p.data)}</p>{p.obs&&<p style={{fontSize:'11px',color:'#64748B'}}>{p.obs}</p>}</div>
                      <span style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(p.valor)}</span>
                    </div>
                  ))
                }
              </div>

              {/* Cliente */}
              <div style={crd}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>👤 Cliente</p>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'10px'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'50%',background:ag3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:700,color:'#fff',flexShrink:0}}>
                    {(orc.cliente_nome||'?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'2px'}}>{orc.cliente_nome}</p>
                    {orc.cliente_whatsapp&&<p style={{fontSize:'13px',color:'#64748B'}}>📱 {mascaraTel(orc.cliente_whatsapp)}</p>}
                  </div>
                </div>
                {orc.cliente_email&&<p style={{fontSize:'13px',color:'#64748B',marginBottom:'2px'}}>✉️ {orc.cliente_email}</p>}
                {orc.observacoes&&<p style={{fontSize:'13px',color:'#4B5563',marginTop:'8px',lineHeight:'1.5'}}>{orc.observacoes}</p>}
              </div>
            </div>
          )
        })()}

        </div>
        </div>
      </div>
    </div>
  )
}
