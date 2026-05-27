'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

const AVATAR_COLORS=['linear-gradient(135deg,#2563EB,#7C3AED)','linear-gradient(135deg,#7C3AED,#EC4899)','linear-gradient(135deg,#06B6D4,#2563EB)','linear-gradient(135deg,#16A34A,#06B6D4)','linear-gradient(135deg,#DC2626,#7C3AED)','linear-gradient(135deg,#D97706,#EC4899)']
function avatarGrad(n:string){return AVATAR_COLORS[(n||'A').charCodeAt(0)%AVATAR_COLORS.length]}

const SB_ITEMS=[
  {href:'/painel',label:'Início',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>},
  {href:'/painel/agendamentos',label:'Agenda',active:true,icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01"/></svg>},
  {href:'/painel/clientes',label:'Clientes',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
  {href:'/painel/orcamentos',label:'Orçamentos',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><rect x="3" y="6" width="18" height="16" rx="2"/><path d="M8 12h8M8 16h5"/></svg>},
  {href:'/painel/financeiro',label:'Cobranças',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><path d="M20 12a2 2 0 0 1 0 4h-2a2 2 0 0 1 0-4h2z"/></svg>},
  {href:'/painel/financeiro',label:'Pagamentos',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>},
  {href:'/painel/servicos',label:'Serviços',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/></svg>},
  {href:'/painel/profissionais',label:'Profissionais',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>},
  {href:'/painel/relatorio',label:'Relatórios',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>},
  {href:'/painel/perfil',label:'Configurações',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>},
]

const STATUS_CFG:Record<string,{bg:string,c:string,bd:string,t:string}>={
  pendente:   {bg:'rgba(245,158,11,.15)',  c:'#FBBF24',bd:'rgba(245,158,11,.32)',  t:'Pendente'},
  confirmado: {bg:'rgba(34,197,94,.15)',   c:'#4ADE80',bd:'rgba(34,197,94,.32)',   t:'Confirmado'},
  em_atendimento:{bg:'rgba(59,130,246,.15)',c:'#60A5FA',bd:'rgba(59,130,246,.32)', t:'Em atendimento'},
  realizado:  {bg:'rgba(34,197,94,.15)',   c:'#4ADE80',bd:'rgba(34,197,94,.32)',   t:'Realizado'},
  cancelado:  {bg:'rgba(239,68,68,.15)',   c:'#F87171',bd:'rgba(239,68,68,.32)',   t:'Cancelado'},
  retorno:    {bg:'rgba(124,58,237,.15)',  c:'#A78BFA',bd:'rgba(124,58,237,.32)',  t:'Retorno'},
}
const STATUS_TODOS=['pendente','confirmado','em_atendimento','realizado','cancelado','retorno']

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%}
input,select,textarea{color-scheme:dark}
select option{background:#070F1D;color:#F8FAFC}
.sb{width:220px;min-height:100vh;background:linear-gradient(180deg,#070F1D,#050B16);border-right:1px solid rgba(148,163,184,.12);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.sb-logo{padding:20px 16px 16px;border-bottom:1px solid rgba(148,163,184,.08);display:flex;align-items:center;gap:8px}
.sb-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#2563EB,#7C3AED);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 18px rgba(124,58,237,.45)}
.sb nav{flex:1;padding:10px 8px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:400;color:#94A3B8;transition:all .18s;border:1px solid transparent;white-space:nowrap}
.nl:hover{background:rgba(124,58,237,.12);color:#F8FAFC;border-color:rgba(124,58,237,.28)}
.nl.on{background:linear-gradient(135deg,#2563EB,#7C3AED);color:#fff;font-weight:600;box-shadow:0 0 24px rgba(124,58,237,.36);border-color:rgba(255,255,255,.1)}
.sb-foot{padding:10px;border-top:1px solid rgba(148,163,184,.08)}
.mob-hdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.94);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.1);position:sticky;top:0;z-index:20;flex-shrink:0;width:100%;max-width:100%}
.drawer{position:fixed;top:0;left:0;bottom:0;width:300px;max-width:85vw;background:linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .3s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.12)}
.drawer.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .3s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:220px;flex:1;min-height:100vh;display:flex;flex-direction:column;width:calc(100% - 220px);max-width:calc(100% - 220px)}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.18),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.16),transparent 30%),radial-gradient(circle at bottom right,rgba(6,182,212,.08),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;width:100%;overflow-x:hidden}
.body{max-width:1280px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.btn-pri{background:linear-gradient(135deg,#2563EB,#7C3AED);color:#fff;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:11px 20px;font-size:13px;font-weight:700;box-shadow:0 12px 30px rgba(37,99,235,.30),0 0 26px rgba(124,58,237,.28);text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;transition:box-shadow .2s,transform .2s;font-family:inherit;cursor:pointer}
.btn-pri:hover{box-shadow:0 16px 38px rgba(37,99,235,.38),0 0 34px rgba(124,58,237,.40);transform:translateY(-1px)}
.btn-sec{background:rgba(15,23,42,.86);color:#CBD5E1;border:1px solid rgba(148,163,184,.18);border-radius:10px;padding:11px 18px;font-size:13px;font-weight:600;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;transition:all .2s;font-family:inherit;cursor:pointer}
.btn-sec:hover{background:rgba(124,58,237,.12);border-color:rgba(124,58,237,.35);color:#fff}
.crd{background:linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98));border:1px solid rgba(148,163,184,.16);border-radius:18px;box-shadow:0 18px 45px rgba(0,0,0,.34)}
.kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px}
.ag-card{background:linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98));border:1px solid rgba(148,163,184,.14);border-radius:16px;padding:16px 18px;margin-bottom:10px;transition:border-color .2s,box-shadow .2s}
.ag-card:hover{border-color:rgba(124,58,237,.38);box-shadow:0 0 24px rgba(124,58,237,.14)}
.ag-card:last-child{margin-bottom:0}
.sem-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:16px}
.sem-day{background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.12);border-radius:12px;padding:10px 8px;cursor:pointer;transition:all .2s;min-height:80px;display:flex;flex-direction:column;gap:4px}
.sem-day:hover{border-color:rgba(59,130,246,.35);background:rgba(37,99,235,.1)}
.sem-day.hoje{border-color:rgba(37,99,235,.5);background:rgba(37,99,235,.12)}
.sem-day.sel{border-color:rgba(124,58,237,.55);background:rgba(124,58,237,.14);box-shadow:0 0 18px rgba(124,58,237,.18)}
.filtro-pill{padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .2s;white-space:nowrap;background:rgba(15,23,42,.7);color:#64748B;border-color:rgba(148,163,184,.14)}
.filtro-pill.on{border-color:rgba(37,99,235,.5);background:rgba(37,99,235,.18);color:#93C5FD}
.seg-btn{padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;border:none;background:transparent;color:#64748B}
.seg-btn.on{background:linear-gradient(135deg,rgba(37,99,235,.9),rgba(124,58,237,.9));color:#fff;border-radius:8px;box-shadow:0 4px 14px rgba(37,99,235,.3)}
@media(max-width:1023px){
  .sb{display:none!important}
  .main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mob-hdr{display:flex!important}
  .body{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr 1fr!important;gap:8px!important}
  .sem-grid{grid-template-columns:repeat(7,1fr)!important;gap:4px!important}
}
@media(max-width:600px){
  .kpi-grid{grid-template-columns:1fr 1fr!important}
  .sem-grid{grid-template-columns:repeat(7,1fr)!important}
}
@media(max-width:360px){
  .body{padding:12px 12px 80px!important}
}
`

export default function Agendamentos(){
  const [perfil,setPerfil]=useState<any>(null)
  const [profissionais,setProfissionais]=useState<any[]>([])
  const [agendamentos,setAgendamentos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [view,setView]=useState<'lista'|'semana'>('lista')
  const [filtroStatus,setFiltroStatus]=useState('todos')
  const [filtroProf,setFiltroProf]=useState('todos')
  const [semOffset,setSemOffset]=useState(0)
  const [diaSel,setDiaSel]=useState<string|null>(null)
  const [mensagem,setMensagem]=useState('')

  // KPIs
  const hoje=new Date().toISOString().split('T')[0]
  const agHoje=agendamentos.filter(a=>a.data_hora?.startsWith(hoje)&&a.status!=='cancelado')
  const confirmados=agHoje.filter(a=>a.status==='confirmado')
  const pendentes=agHoje.filter(a=>a.status==='pendente')
  const cancelados=agendamentos.filter(a=>a.data_hora?.startsWith(hoje)&&a.status==='cancelado')
  const retornos=agendamentos.filter(a=>a.status==='retorno')
  const proxAg=agHoje.sort((a:any,b:any)=>a.data_hora>b.data_hora?1:-1)[0]

  useEffect(()=>{init()},[])

  async function init(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const hoje30=new Date();hoje30.setDate(hoje30.getDate()-7)
    const fim60=new Date();fim60.setDate(fim60.getDate()+60)
    const [{data:p},{data:profs},{data:ags}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('id,nome').eq('user_id',user.id).order('nome'),
      supabase.from('agendamentos')
        .select('*,servicos(nome,preco),profissionais(nome)')
        .eq('user_id',user.id)
        .gte('data_hora',hoje30.toISOString())
        .lte('data_hora',fim60.toISOString())
        .order('data_hora',{ascending:true}),
    ])
    setPerfil(p);setProfissionais(profs||[]);setAgendamentos(ags||[])
    setLoading(false)
  }

  async function atualizarStatus(id:string,status:string){
    await supabase.from('agendamentos').update({status}).eq('id',id)
    setAgendamentos(prev=>prev.map(a=>a.id===id?{...a,status}:a))
    setMensagem('Status atualizado! ✓')
    setTimeout(()=>setMensagem(''),2000)
  }

  function fmtH(s:string){return new Date(s).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
  function fmtData(s:string){return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}
  function fmtDataCurta(s:string){return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
  function wpp(ag:any){
    const tel=(ag.cliente_whatsapp||'').replace(/\D/g,'');if(!tel)return
    const msg=`Olá, ${ag.cliente_nome}! Confirmando seu atendimento em ${fmtH(ag.data_hora)}. Qualquer dúvida estamos à disposição.`
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`,'_blank')
  }

  // Filtros
  const agsFiltrados=agendamentos.filter(a=>{
    if(filtroStatus!=='todos'&&a.status!==filtroStatus)return false
    if(filtroProf!=='todos'&&a.profissional_id!==filtroProf)return false
    return true
  })

  // Semana
  function getSemana(){
    const base=new Date();base.setDate(base.getDate()+semOffset*7)
    const dow=base.getDay()
    const seg=new Date(base);seg.setDate(base.getDate()-dow)
    return Array.from({length:7},(_,i)=>{
      const d=new Date(seg);d.setDate(seg.getDate()+i)
      return d.toISOString().split('T')[0]
    })
  }
  const semana=getSemana()
  function nomeDia(s:string){return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','').toUpperCase()}
  function numDia(s:string){return new Date(s+'T12:00:00').getDate()}
  function agsNoDia(d:string){return agsFiltrados.filter(a=>a.data_hora?.startsWith(d))}

  // Lista agrupada
  const diasComAgs=Array.from(new Set(agsFiltrados.map(a=>a.data_hora?.split('T')[0]))).sort()

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'A').charAt(0).toUpperCase()
  const grad=avatarGrad(nome)

  const Sidebar=()=>(
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
        {SB_ITEMS.map(it=>(
          <Link key={it.label} href={it.href} className={'nl'+(it.active?' on':'')}>
            {it.icon}<span>{it.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sb-foot">
        <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.78)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
          <div style={{minWidth:0}}>
            <p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p>
            <p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  )

  if(loading)return(
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#64748B',fontSize:'14px'}}>Carregando agenda...</p>
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
          {SB_ITEMS.map(it=>(
            <Link key={it.label} href={it.href} onClick={()=>setMob(false)} className={'nl'+(it.active?' on':'')} style={{fontSize:'14px',padding:'11px 14px'}}>
              {it.icon}<span>{it.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{padding:'10px',borderTop:'1px solid rgba(148,163,184,.1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.78)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
            <div><p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'11px',color:'#64748B'}}>Administrador</p></div>
          </div>
        </div>
      </div>

      <Sidebar/>
      <div className="main">
        {/* Mobile header */}
        <div className="mob-hdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
            <span style={{display:'block',width:'16px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Agenda</span>
          <div style={{width:'36px',height:'36px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>

        <div className="pg">
        <div className="body">

          {/* Toast */}
          {mensagem&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,rgba(34,197,94,.22),rgba(6,182,212,.18))',border:'1px solid rgba(34,197,94,.38)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#4ADE80',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)'}}>
              {mensagem}
            </div>
          )}

          {/* Cabeçalho */}
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.03em',marginBottom:'4px'}}>Agenda</h1>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5}}>Gerencie horários, atendimentos, retornos e disponibilidade da equipe.</p>
            </div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',flexShrink:0}}>
              <Link href="/painel/bloqueios" className="btn-sec" style={{fontSize:'12px',padding:'9px 14px'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/></svg>
                Bloquear horário
              </Link>
              <button className="btn-pri" style={{fontSize:'13px',padding:'10px 18px'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Novo agendamento
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {label:'Hoje',val:agHoje.length,ico:'📅',c:'#60A5FA',bg:'rgba(37,99,235,.1)',bd:'rgba(37,99,235,.3)'},
              {label:'Confirmados',val:confirmados.length,ico:'✅',c:'#4ADE80',bg:'rgba(34,197,94,.1)',bd:'rgba(34,197,94,.28)'},
              {label:'Pendentes',val:pendentes.length,ico:'⏳',c:'#FBBF24',bg:'rgba(245,158,11,.1)',bd:'rgba(245,158,11,.28)'},
              {label:'Retornos',val:retornos.length,ico:'🔄',c:'#22D3EE',bg:'rgba(6,182,212,.1)',bd:'rgba(6,182,212,.28)'},
              {label:'Cancelados',val:cancelados.length,ico:'❌',c:'#F87171',bg:'rgba(239,68,68,.1)',bd:'rgba(239,68,68,.28)'},
              {label:'Próximo',val:proxAg?fmtH(proxAg.data_hora):'—',ico:'🎯',c:'#A78BFA',bg:'rgba(124,58,237,.1)',bd:'rgba(124,58,237,.28)'},
            ].map(k=>(
              <div key={k.label} style={{background:`linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98))`,border:`1px solid ${k.bd}`,borderRadius:'14px',padding:'14px',boxSizing:'border-box' as const}}>
                <div style={{width:'34px',height:'34px',borderRadius:'10px',background:k.bg,border:`1px solid ${k.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',marginBottom:'8px'}}>{k.ico}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'3px'}}>{k.label}</p>
                <p style={{fontSize:'20px',fontWeight:800,color:k.c,letterSpacing:'-0.02em',lineHeight:1.1}}>{k.val}</p>
              </div>
            ))}
          </div>

          {/* Barra de controles */}
          <div style={{background:'linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98))',border:'1px solid rgba(148,163,184,.14)',borderRadius:'16px',padding:'14px 16px',marginBottom:'16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
              {/* Segmented control */}
              <div style={{background:'rgba(255,255,255,.05)',borderRadius:'10px',padding:'3px',display:'flex',gap:'2px',flexShrink:0}}>
                {(['lista','semana'] as const).map(v=>(
                  <button key={v} onClick={()=>setView(v)} className={`seg-btn${view===v?' on':''}`} style={{fontSize:'12px',padding:'6px 14px'}}>
                    {v==='lista'?'☰ Lista':'▦ Semana'}
                  </button>
                ))}
              </div>

              {/* Filtros status */}
              <div style={{display:'flex',gap:'5px',flexWrap:'wrap',flex:1,overflow:'hidden'}}>
                <button className={`filtro-pill${filtroStatus==='todos'?' on':''}`} onClick={()=>setFiltroStatus('todos')}>Todos</button>
                {STATUS_TODOS.map(s=>{
                  const c=STATUS_CFG[s]
                  return(
                    <button key={s} className={`filtro-pill${filtroStatus===s?' on':''}`} onClick={()=>setFiltroStatus(filtroStatus===s?'todos':s)}
                      style={filtroStatus===s?{background:c.bg,borderColor:c.bd,color:c.c}:{}}>
                      {c.t}
                    </button>
                  )
                })}
              </div>

              {/* Filtro profissional */}
              {profissionais.length>0&&(
                <select value={filtroProf} onChange={e=>setFiltroProf(e.target.value)}
                  style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'8px',padding:'6px 10px',fontSize:'12px',color:'#CBD5E1',outline:'none',flexShrink:0}}>
                  <option value="todos">Todos profissionais</option>
                  {profissionais.map((p:any)=><option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              )}
            </div>

            {/* Navegação semana */}
            {view==='semana'&&(
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'12px',flexWrap:'wrap'}}>
                <button onClick={()=>setSemOffset(s=>s-1)} className="btn-sec" style={{padding:'6px 12px',fontSize:'12px'}}>← Anterior</button>
                <button onClick={()=>{setSemOffset(0);setDiaSel(hoje)}} className="btn-sec" style={{padding:'6px 12px',fontSize:'12px',color:semOffset===0?'#60A5FA':'#94A3B8'}}>Hoje</button>
                <span style={{fontSize:'12px',color:'#94A3B8',flex:1,textAlign:'center'}}>{fmtDataCurta(semana[0])} – {fmtDataCurta(semana[6])}</span>
                <button onClick={()=>setSemOffset(s=>s+1)} className="btn-sec" style={{padding:'6px 12px',fontSize:'12px'}}>Próxima →</button>
              </div>
            )}
          </div>

          {/* VISUALIZAÇÃO LISTA */}
          {view==='lista'&&(
            <>
              {diasComAgs.length===0?(
                <div style={{background:'linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98))',border:'1px solid rgba(148,163,184,.14)',borderRadius:'18px',padding:'56px 24px',textAlign:'center'}}>
                  <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'rgba(37,99,235,.16)',border:'1px solid rgba(37,99,235,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',margin:'0 auto 16px'}}>📅</div>
                  <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'6px'}}>Nenhum agendamento encontrado</p>
                  <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5,maxWidth:'280px',margin:'0 auto 20px'}}>Tente ajustar os filtros ou crie um novo agendamento.</p>
                  <button className="btn-pri" style={{display:'inline-flex',padding:'10px 22px',fontSize:'13px'}}>+ Novo agendamento</button>
                </div>
              ):(
                diasComAgs.map(dia=>(
                  <div key={dia} style={{marginBottom:'20px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                      <div style={{width:'8px',height:'8px',borderRadius:'50%',background:dia===hoje?'#3B82F6':'#374151',boxShadow:dia===hoje?'0 0 10px rgba(59,130,246,.6)':'none',flexShrink:0}}/>
                      <p style={{fontSize:'13px',fontWeight:700,color:dia===hoje?'#60A5FA':'#94A3B8',textTransform:'capitalize' as const}}>{fmtData(dia!)}{dia===hoje?' — Hoje':''}</p>
                      <div style={{flex:1,height:'1px',background:'rgba(148,163,184,.1)'}}/>
                      <span style={{fontSize:'11px',color:'#374151'}}>{agsNoDia(dia!).length} atendimento{agsNoDia(dia!).length!==1?'s':''}</span>
                    </div>
                    {agsNoDia(dia!).map((ag:any)=>{
                      const sc=STATUS_CFG[ag.status]||STATUS_CFG.pendente
                      const agGrad=avatarGrad(ag.cliente_nome||'A')
                      return(
                        <div key={ag.id} className="ag-card">
                          <div style={{display:'flex',alignItems:'flex-start',gap:'12px'}}>
                            {/* Avatar + hora */}
                            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',flexShrink:0}}>
                              <div style={{width:'36px',height:'36px',borderRadius:'50%',background:agGrad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:700,color:'#fff',boxShadow:`0 0 14px ${agGrad.split(',')[1]?.split(')')[0]}33`}}>
                                {(ag.cliente_nome||'?').charAt(0).toUpperCase()}
                              </div>
                              <div style={{background:'linear-gradient(135deg,rgba(37,99,235,.85),rgba(124,58,237,.85))',borderRadius:'6px',padding:'3px 7px',fontSize:'11px',fontWeight:700,color:'#fff',whiteSpace:'nowrap'}}>
                                {fmtH(ag.data_hora)}
                              </div>
                            </div>

                            {/* Info */}
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap',marginBottom:'4px'}}>
                                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.cliente_nome||'—'}</p>
                                <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:sc.bg,color:sc.c,border:`1px solid ${sc.bd}`,flexShrink:0}}>{sc.t}</span>
                              </div>
                              <p style={{fontSize:'12px',color:'#64748B',marginBottom:'2px'}}>{ag.servicos?.nome||'Serviço não informado'}{ag.profissionais?.nome?` · ${ag.profissionais.nome}`:''}</p>
                              {ag.cliente_whatsapp&&<p style={{fontSize:'11px',color:'#374151'}}>📱 {ag.cliente_whatsapp}</p>}
                              {ag.observacoes&&<p style={{fontSize:'11px',color:'#374151',marginTop:'3px',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.observacoes}</p>}
                              {ag.valor&&<p style={{fontSize:'12px',color:'#FBBF24',marginTop:'3px',fontWeight:600}}>R$ {parseFloat(ag.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>}

                              {/* Ações */}
                              <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginTop:'10px'}}>
                                {ag.status!=='confirmado'&&ag.status!=='realizado'&&ag.status!=='cancelado'&&(
                                  <button onClick={()=>atualizarStatus(ag.id,'confirmado')}
                                    style={{background:'rgba(34,197,94,.14)',border:'1px solid rgba(34,197,94,.32)',borderRadius:'7px',padding:'5px 10px',fontSize:'11px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
                                    ✓ Confirmar
                                  </button>
                                )}
                                {ag.status!=='realizado'&&ag.status!=='cancelado'&&(
                                  <button onClick={()=>atualizarStatus(ag.id,'realizado')}
                                    style={{background:'rgba(6,182,212,.12)',border:'1px solid rgba(6,182,212,.28)',borderRadius:'7px',padding:'5px 10px',fontSize:'11px',fontWeight:600,color:'#22D3EE',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
                                    Realizado
                                  </button>
                                )}
                                {ag.status!=='retorno'&&ag.status!=='cancelado'&&(
                                  <button onClick={()=>atualizarStatus(ag.id,'retorno')}
                                    style={{background:'rgba(124,58,237,.12)',border:'1px solid rgba(124,58,237,.28)',borderRadius:'7px',padding:'5px 10px',fontSize:'11px',fontWeight:600,color:'#A78BFA',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
                                    Retorno
                                  </button>
                                )}
                                {ag.cliente_whatsapp&&(
                                  <button onClick={()=>wpp(ag)}
                                    style={{background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'7px',padding:'5px 10px',fontSize:'11px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
                                    💬 WhatsApp
                                  </button>
                                )}
                                {ag.status!=='cancelado'&&(
                                  <button onClick={()=>atualizarStatus(ag.id,'cancelado')}
                                    style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.20)',borderRadius:'7px',padding:'5px 10px',fontSize:'11px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </>
          )}

          {/* VISUALIZAÇÃO SEMANA */}
          {view==='semana'&&(
            <>
              <div className="sem-grid">
                {semana.map(dia=>{
                  const ags=agsNoDia(dia)
                  const isHoje=dia===hoje
                  const isSel=dia===diaSel
                  return(
                    <div key={dia} className={`sem-day${isHoje?' hoje':''}${isSel?' sel':''}`} onClick={()=>setDiaSel(dia===diaSel?null:dia)}>
                      <p style={{fontSize:'9px',fontWeight:700,color:isHoje?'#60A5FA':'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>{nomeDia(dia)}</p>
                      <p style={{fontSize:'18px',fontWeight:800,color:isHoje?'#3B82F6':'#F8FAFC',lineHeight:1}}>{numDia(dia)}</p>
                      {ags.length>0?(
                        <div style={{marginTop:'4px',display:'flex',flexDirection:'column',gap:'2px'}}>
                          {ags.slice(0,3).map((a:any)=>{
                            const sc=STATUS_CFG[a.status]||STATUS_CFG.pendente
                            return(
                              <div key={a.id} style={{background:sc.bg,borderRadius:'4px',padding:'2px 4px',fontSize:'9px',fontWeight:600,color:sc.c,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                {fmtH(a.data_hora)} {a.cliente_nome?.split(' ')[0]||'—'}
                              </div>
                            )
                          })}
                          {ags.length>3&&<p style={{fontSize:'9px',color:'#64748B',paddingLeft:'2px'}}>+{ags.length-3} mais</p>}
                        </div>
                      ):(
                        <p style={{fontSize:'9px',color:'#374151',marginTop:'4px'}}>Livre</p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Detalhe do dia selecionado */}
              {diaSel&&(
                <div style={{background:'linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98))',border:'1px solid rgba(59,130,246,.28)',borderRadius:'16px',padding:'16px',marginBottom:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px',flexWrap:'wrap',gap:'8px'}}>
                    <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',textTransform:'capitalize' as const}}>{fmtData(diaSel)}{diaSel===hoje?' — Hoje':''}</p>
                    <span style={{fontSize:'12px',color:'#64748B'}}>{agsNoDia(diaSel).length} atendimento{agsNoDia(diaSel).length!==1?'s':''}</span>
                  </div>
                  {agsNoDia(diaSel).length===0?(
                    <div style={{textAlign:'center',padding:'20px 0'}}>
                      <p style={{fontSize:'13px',color:'#374151'}}>Nenhum horário neste dia</p>
                    </div>
                  ):(
                    agsNoDia(diaSel).map((ag:any)=>{
                      const sc=STATUS_CFG[ag.status]||STATUS_CFG.pendente
                      const agGrad=avatarGrad(ag.cliente_nome||'A')
                      return(
                        <div key={ag.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px',borderRadius:'10px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',marginBottom:'6px',flexWrap:'wrap',gap:'8px'}}>
                          <div style={{background:'linear-gradient(135deg,rgba(37,99,235,.85),rgba(124,58,237,.85))',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:700,color:'#fff',flexShrink:0}}>{fmtH(ag.data_hora)}</div>
                          <div style={{width:'28px',height:'28px',borderRadius:'50%',background:agGrad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#fff',flexShrink:0}}>{(ag.cliente_nome||'?').charAt(0).toUpperCase()}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.cliente_nome||'—'}</p>
                            <p style={{fontSize:'11px',color:'#64748B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.servicos?.nome||''}</p>
                          </div>
                          <span style={{fontSize:'11px',fontWeight:700,padding:'3px 9px',borderRadius:'999px',background:sc.bg,color:sc.c,border:`1px solid ${sc.bd}`,flexShrink:0}}>{sc.t}</span>
                          <div style={{display:'flex',gap:'4px'}}>
                            {ag.status!=='confirmado'&&ag.status!=='realizado'&&ag.status!=='cancelado'&&(
                              <button onClick={()=>atualizarStatus(ag.id,'confirmado')} style={{background:'rgba(34,197,94,.14)',border:'1px solid rgba(34,197,94,.28)',borderRadius:'6px',padding:'4px 8px',fontSize:'10px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>✓</button>
                            )}
                            {ag.cliente_whatsapp&&<button onClick={()=>wpp(ag)} style={{background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.22)',borderRadius:'6px',padding:'4px 8px',fontSize:'10px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>💬</button>}
                            {ag.status!=='cancelado'&&<button onClick={()=>atualizarStatus(ag.id,'cancelado')} style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.18)',borderRadius:'6px',padding:'4px 8px',fontSize:'10px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>✕</button>}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </>
          )}

        </div>
        </div>
      </div>
    </div>
  )
}
