'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const GRAD='linear-gradient(135deg,#2563EB,#7C3AED)'
const AC=['linear-gradient(135deg,#2563EB,#7C3AED)','linear-gradient(135deg,#7C3AED,#EC4899)','linear-gradient(135deg,#06B6D4,#2563EB)','linear-gradient(135deg,#16A34A,#06B6D4)','linear-gradient(135deg,#DC2626,#7C3AED)','linear-gradient(135deg,#D97706,#EC4899)']
const ag=(n:string)=>AC[(n||'A').charCodeAt(0)%AC.length]

const SB=[
  {href:'/painel',l:'Início'},
  {href:'/painel/agendamentos',l:'Agenda',on:true},
  {href:'/painel/clientes',l:'Clientes'},
  {href:'/painel/orcamentos',l:'Orçamentos'},
  {href:'/painel/financeiro',l:'Cobranças'},
  {href:'/painel/financeiro',l:'Pagamentos'},
  {href:'/painel/servicos',l:'Serviços'},
  {href:'/painel/profissionais',l:'Profissionais'},
  {href:'/painel/relatorio',l:'Relatórios'},
  {href:'/painel/perfil',l:'Configurações'},
]

const SC:Record<string,{bg:string,bd:string,c:string,t:string}>={
  pendente:      {bg:'rgba(245,158,11,.12)',  bd:'rgba(245,158,11,.35)',  c:'#F59E0B',t:'Pendente'},
  confirmado:    {bg:'rgba(34,197,94,.12)',   bd:'rgba(34,197,94,.35)',   c:'#22C55E',t:'Confirmado'},
  em_atendimento:{bg:'rgba(59,130,246,.12)',  bd:'rgba(59,130,246,.35)',  c:'#3B82F6',t:'Em atendimento'},
  realizado:     {bg:'rgba(34,197,94,.12)',   bd:'rgba(34,197,94,.35)',   c:'#22C55E',t:'Realizado'},
  cancelado:     {bg:'rgba(239,68,68,.12)',   bd:'rgba(239,68,68,.35)',   c:'#F87171',t:'Cancelado'},
  retorno:       {bg:'rgba(6,182,212,.12)',   bd:'rgba(6,182,212,.35)',   c:'#22D3EE',t:'Retorno'},
}
const ST=['pendente','confirmado','em_atendimento','realizado','cancelado','retorno']

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#07111F}
input,select,textarea{color-scheme:dark}
select option{background:#0B1628;color:#F8FAFC}
.sb{width:250px;min-height:100vh;background:#070F1D;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.sb-logo{padding:20px 18px 16px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px}
.sb-ic{width:30px;height:30px;border-radius:8px;background:${GRAD};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 20px rgba(124,58,237,.5)}
.sb nav{flex:1;padding:10px 10px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;margin-bottom:3px;text-decoration:none;font-size:13px;font-weight:500;color:#94A3B8;transition:all .15s;border:1px solid transparent}
.nl:hover{background:rgba(59,130,246,.08);color:#fff}
.nl.on{background:${GRAD};color:#fff;font-weight:700;box-shadow:0 10px 28px rgba(37,99,235,.28);border-color:rgba(255,255,255,.12)}
.sb-foot{padding:12px;border-top:1px solid rgba(255,255,255,.06)}
.mhdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(7,17,31,.96);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.06);position:sticky;top:0;z-index:20;width:100%;max-width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:#070F1D;z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,.06)}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:250px;flex:1;min-height:100vh;width:calc(100% - 250px);max-width:calc(100% - 250px)}
.pg{background:radial-gradient(circle at 15% 10%,rgba(124,58,237,.14),transparent 35%),radial-gradient(circle at 85% 10%,rgba(37,99,235,.12),transparent 32%),linear-gradient(180deg,#07111F,#081421);min-height:100vh;width:100%;overflow-x:hidden}
.bdy{max-width:1260px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.card{background:#101B2D;border:1px solid rgba(255,255,255,.08);border-radius:20px;box-shadow:0 12px 30px rgba(0,0,0,.24);transition:all .18s}
.card:hover{border-color:rgba(59,130,246,.22);box-shadow:0 18px 45px rgba(0,0,0,.32)}
.btn-p{background:${GRAD};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:12px;height:44px;padding:0 18px;font-size:13px;font-weight:700;box-shadow:0 10px 26px rgba(37,99,235,.28);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 14px 34px rgba(37,99,235,.38)}
.btn-s{background:rgba(15,23,42,.75);color:#CBD5E1;border:1px solid rgba(148,163,184,.18);border-radius:12px;height:42px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-s:hover{border-color:rgba(59,130,246,.32);color:#fff;background:rgba(30,41,59,.8)}
.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px}
.ag-card{background:#101B2D;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:18px 20px;margin-bottom:10px;transition:all .18s;cursor:default}
.ag-card:hover{border-color:rgba(59,130,246,.25);transform:translateY(-1px);box-shadow:0 12px 28px rgba(0,0,0,.28)}
.sem-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;margin-bottom:14px}
.sem-day{background:rgba(15,23,42,.65);border:1px solid rgba(148,163,184,.12);border-radius:16px;padding:12px 10px;cursor:pointer;transition:all .18s;min-height:110px;display:flex;flex-direction:column;gap:5px}
.sem-day:hover{border-color:rgba(59,130,246,.35);background:rgba(37,99,235,.08)}
.sem-day.hoje{border:1.5px solid rgba(59,130,246,.65);box-shadow:0 0 0 1px rgba(59,130,246,.2)}
.sem-day.sel{border:1.5px solid rgba(124,58,237,.6);background:rgba(124,58,237,.1);box-shadow:0 0 0 1px rgba(124,58,237,.15)}
.pill{padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.16);transition:all .18s;white-space:nowrap;background:rgba(15,23,42,.55);color:#94A3B8;height:34px;display:inline-flex;align-items:center}
.pill:hover{border-color:rgba(255,255,255,.22);color:#fff}
.pill.on{background:rgba(37,99,235,.15);border:1px solid rgba(59,130,246,.45);color:#fff}
.seg{background:rgba(30,41,59,.55);border-radius:12px;padding:4px;display:flex;gap:3px}
.seg-b{padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:all .18s;font-family:inherit;border:none;background:transparent;color:#94A3B8;border-radius:9px}
.seg-b.on{background:${GRAD};color:#fff;box-shadow:0 8px 20px rgba(37,99,235,.25)}
.act-b{border-radius:8px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .15s;font-family:inherit;display:inline-flex;align-items:center;gap:3px}
@media(max-width:1023px){
  .sb{display:none!important}
  .main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mhdr{display:flex!important}
  .bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:repeat(3,1fr)!important;gap:8px!important}
  .hdr-btns{flex-direction:column!important;width:100%!important}
  .hdr-btns a,.hdr-btns button{width:100%!important;justify-content:center!important}
  .ctl-bar{flex-direction:column!important;align-items:stretch!important}
  .pills-wrap{overflow-x:auto;white-space:nowrap;display:flex;gap:5px;padding-bottom:2px}
  .sem-grid{gap:4px!important}
}
@media(max-width:600px){
  .kpi-grid{grid-template-columns:1fr 1fr!important}
  .ag-card{padding:14px!important}
}
`

export default function Agendamentos(){
  const [perfil,setPerfil]=useState<any>(null)
  const [profs,setProfs]=useState<any[]>([])
  const [ags,setAgs]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [view,setView]=useState<'lista'|'semana'>('lista')
  const [fSt,setFSt]=useState('todos')
  const [fPr,setFPr]=useState('todos')
  const [semOff,setSemOff]=useState(0)
  const [diaSel,setDiaSel]=useState<string|null>(null)
  const [msg,setMsg]=useState('')

  const hoje=new Date().toISOString().split('T')[0]

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const fim60=new Date();fim60.setDate(fim60.getDate()+60)
    const atas=new Date();atas.setDate(atas.getDate()-14)
    const [{data:p},{data:ps},{data:as}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('id,nome').eq('user_id',user.id).order('nome'),
      supabase.from('agendamentos')
        .select('*,servicos(nome),profissionais(nome)')
        .eq('user_id',user.id)
        .gte('data_hora',atas.toISOString())
        .lte('data_hora',fim60.toISOString())
        .order('data_hora',{ascending:true}),
    ])
    setPerfil(p);setProfs(ps||[]);setAgs(as||[]);setLoading(false)
  }

  async function updSt(id:string,status:string){
    await supabase.from('agendamentos').update({status}).eq('id',id)
    setAgs(prev=>prev.map(a=>a.id===id?{...a,status}:a))
    setMsg('✓ Status atualizado');setTimeout(()=>setMsg(''),2000)
  }

  const fH=(s:string)=>new Date(s).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  const fD=(s:string)=>new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})
  const fDC=(s:string)=>new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})

  const filtered=ags.filter(a=>{
    if(fSt!=='todos'&&a.status!==fSt) return false
    if(fPr!=='todos'&&a.profissional_id!==fPr) return false
    return true
  })

  const agHoje=ags.filter(a=>a.data_hora?.startsWith(hoje)&&a.status!=='cancelado')
  const kpis=[
    {l:'Hoje',v:agHoje.length,c:'#3B82F6',bg:'rgba(59,130,246,.1)',bd:'rgba(59,130,246,.25)',ico:'📅'},
    {l:'Confirmados',v:ags.filter(a=>a.data_hora?.startsWith(hoje)&&a.status==='confirmado').length,c:'#22C55E',bg:'rgba(34,197,94,.1)',bd:'rgba(34,197,94,.25)',ico:'✅'},
    {l:'Pendentes',v:ags.filter(a=>a.data_hora?.startsWith(hoje)&&a.status==='pendente').length,c:'#F59E0B',bg:'rgba(245,158,11,.1)',bd:'rgba(245,158,11,.25)',ico:'⏳'},
    {l:'Retornos',v:ags.filter(a=>a.status==='retorno').length,c:'#22D3EE',bg:'rgba(6,182,212,.1)',bd:'rgba(6,182,212,.25)',ico:'🔄'},
    {l:'Cancelados',v:ags.filter(a=>a.data_hora?.startsWith(hoje)&&a.status==='cancelado').length,c:'#F87171',bg:'rgba(239,68,68,.1)',bd:'rgba(239,68,68,.25)',ico:'✕'},
  ]

  function getSem(){
    const b=new Date();b.setDate(b.getDate()+semOff*7)
    const d=b.getDay()
    const s=new Date(b);s.setDate(b.getDate()-d)
    return Array.from({length:7},(_,i)=>{const x=new Date(s);x.setDate(s.getDate()+i);return x.toISOString().split('T')[0]})
  }
  const sem=getSem()
  const nDia=(s:string)=>new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','').toUpperCase()
  const numDia=(s:string)=>new Date(s+'T12:00:00').getDate()
  const agsD=(d:string)=>filtered.filter(a=>a.data_hora?.startsWith(d))
  const dias=Array.from(new Set(filtered.map(a=>a.data_hora?.split('T')[0]))).sort()

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'A').charAt(0).toUpperCase()

  const SidebarComp=()=>(
    <aside className="sb">
      <div className="sb-logo">
        <div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
      </div>
      <nav>{SB.map(it=><Link key={it.l} href={it.href} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot">
        <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.8)',border:'1px solid rgba(255,255,255,.06)',borderRadius:'10px',padding:'10px 12px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:ag(nome),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
          <div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div>
        </div>
      </div>
    </aside>
  )

  if(loading)return(<div style={{minHeight:'100vh',background:'#07111F',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando agenda...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#07111F',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drw${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span>
          <button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button>
        </div>
        <nav style={{flex:1,padding:'10px 10px',overflowY:'auto'}}>{SB.map(it=><Link key={it.l} href={it.href} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}>{it.l}</Link>)}</nav>
      </div>

      <SidebarComp/>
      <div className="main">
        <div className="mhdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            {[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:`${w}px`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Agenda</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:ag(nome),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>

        <div className="pg"><div className="bdy">

          {msg&&<div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'rgba(34,197,94,.18)',border:'1px solid rgba(34,197,94,.40)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#4ADE80',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>{msg}</div>}

          {/* Header */}
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'28px'}}>
            <div>
              <h1 style={{fontSize:'24px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Agenda</h1>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5}}>Gerencie horários, atendimentos, retornos e disponibilidade da equipe.</p>
            </div>
            <div className="hdr-btns" style={{display:'flex',gap:'8px',flexShrink:0,flexWrap:'wrap'}}>
              <Link href="/painel/bloqueios" className="btn-s">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/></svg>
                Bloquear horário
              </Link>
              <Link href="/painel/agendamentos/novo" className="btn-p">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Novo agendamento
              </Link>
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            {kpis.map(k=>(
              <div key={k.l} style={{background:'#101B2D',border:`1px solid ${k.bd}`,borderRadius:'18px',padding:'18px',boxSizing:'border-box' as const}}>
                <div style={{width:'40px',height:'40px',borderRadius:'12px',background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',marginBottom:'10px'}}>{k.ico}</div>
                <p style={{fontSize:'11px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>{k.l}</p>
                <p style={{fontSize:'28px',fontWeight:800,color:k.c,lineHeight:1,letterSpacing:'-0.03em'}}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* Barra controles */}
          <div className="ctl-bar card" style={{padding:'14px 16px',marginBottom:'18px',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap',borderRadius:'18px'}}>
            <div className="seg">
              {(['lista','semana'] as const).map(v=>(
                <button key={v} onClick={()=>setView(v)} className={`seg-b${view===v?' on':''}`}>{v==='lista'?'☰ Lista':'▦ Semana'}</button>
              ))}
            </div>
            <div className="pills-wrap" style={{display:'flex',gap:'5px',flex:1,flexWrap:'wrap'}}>
              <button className={`pill${fSt==='todos'?' on':''}`} onClick={()=>setFSt('todos')}>Todos</button>
              {ST.map(s=>{const c=SC[s];return(
                <button key={s} className={`pill${fSt===s?' on':''}`} onClick={()=>setFSt(fSt===s?'todos':s)}
                  style={fSt===s?{background:c.bg,borderColor:c.bd,color:c.c}:{}}>{c.t}</button>
              )})}
            </div>
            {profs.length>0&&(
              <select value={fPr} onChange={e=>setFPr(e.target.value)}
                style={{background:'#111827',border:'1px solid rgba(148,163,184,.18)',borderRadius:'12px',height:'40px',padding:'0 14px',fontSize:'13px',color:'#fff',outline:'none',minWidth:'180px',flexShrink:0}}>
                <option value="todos">Todos profissionais</option>
                {profs.map((p:any)=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            )}
            {view==='semana'&&(
              <div style={{display:'flex',alignItems:'center',gap:'6px',marginLeft:'auto',flexShrink:0,flexWrap:'wrap'}}>
                <button onClick={()=>setSemOff(o=>o-1)} className="btn-s" style={{height:'36px',padding:'0 12px',fontSize:'12px'}}>← Ant.</button>
                <button onClick={()=>{setSemOff(0);setDiaSel(hoje)}} className="btn-s" style={{height:'36px',padding:'0 12px',fontSize:'12px',color:semOff===0?'#60A5FA':'#94A3B8'}}>Hoje</button>
                <span style={{fontSize:'12px',color:'#64748B',whiteSpace:'nowrap'}}>{fDC(sem[0])} – {fDC(sem[6])}</span>
                <button onClick={()=>setSemOff(o=>o+1)} className="btn-s" style={{height:'36px',padding:'0 12px',fontSize:'12px'}}>Próx. →</button>
              </div>
            )}
          </div>

          {/* LISTA */}
          {view==='lista'&&(
            dias.length===0?(
              <div className="card" style={{padding:'56px 24px',textAlign:'center',borderRadius:'20px'}}>
                <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'rgba(37,99,235,.14)',border:'1px solid rgba(37,99,235,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',margin:'0 auto 16px'}}>📅</div>
                <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'6px'}}>Nenhum agendamento encontrado</p>
                <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5,maxWidth:'280px',margin:'0 auto 20px'}}>Tente ajustar os filtros ou crie um novo agendamento.</p>
                <Link href="/painel/agendamentos/novo" className="btn-p" style={{display:'inline-flex'}}>+ Novo agendamento</Link>
              </div>
            ):(
              dias.map(dia=>(
                <div key={dia} style={{marginBottom:'22px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                    <div style={{width:'8px',height:'8px',borderRadius:'50%',background:dia===hoje?'#3B82F6':'#334155',boxShadow:dia===hoje?'0 0 10px rgba(59,130,246,.7)':'none',flexShrink:0}}/>
                    <p style={{fontSize:'13px',fontWeight:700,color:dia===hoje?'#60A5FA':'#94A3B8',textTransform:'capitalize' as const}}>{fD(dia!)}{dia===hoje?' — Hoje':''}</p>
                    <div style={{flex:1,height:'1px',background:'rgba(255,255,255,.06)'}}/>
                    <span style={{fontSize:'11px',color:'#374151',flexShrink:0}}>{agsD(dia!).length} atend.</span>
                  </div>
                  {agsD(dia!).map((a:any)=>{
                    const sc=SC[a.status]||SC.pendente
                    const cg=ag(a.cliente_nome||'A')
                    return(
                      <div key={a.id} className="ag-card">
                        <div style={{display:'grid',gridTemplateColumns:'auto 1fr auto',gap:'14px',alignItems:'center'}}>
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',flexShrink:0}}>
                            <div style={{width:'42px',height:'42px',borderRadius:'50%',background:cg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:700,color:'#fff'}}>{(a.cliente_nome||'?').charAt(0).toUpperCase()}</div>
                            <div style={{background:GRAD,borderRadius:'7px',padding:'3px 7px',fontSize:'11px',fontWeight:800,color:'#fff',whiteSpace:'nowrap'}}>{fH(a.data_hora)}</div>
                          </div>
                          <div style={{minWidth:0}}>
                            <p style={{fontSize:'16px',fontWeight:800,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:'3px'}}>{a.cliente_nome||'—'}</p>
                            <p style={{fontSize:'13px',color:'#CBD5E1',marginBottom:'2px'}}>{a.servicos?.nome||'Serviço não informado'}</p>
                            {a.profissionais?.nome&&<p style={{fontSize:'11px',color:'#64748B'}}>Profissional: {a.profissionais.nome}</p>}
                            {a.observacoes&&<p style={{fontSize:'11px',color:'#374151',marginTop:'3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.observacoes}</p>}
                          </div>
                          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'8px',flexShrink:0}}>
                            <span style={{fontSize:'11px',fontWeight:700,padding:'5px 10px',borderRadius:'999px',background:sc.bg,color:sc.c,border:`1px solid ${sc.bd}`,whiteSpace:'nowrap'}}>{sc.t}</span>
                            <div style={{display:'flex',gap:'4px',flexWrap:'wrap',justifyContent:'flex-end'}}>
                              {a.status!=='confirmado'&&a.status!=='realizado'&&a.status!=='cancelado'&&(
                                <button onClick={()=>updSt(a.id,'confirmado')} className="act-b" style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.30)',color:'#22C55E'}}>✓ Confirmar</button>
                              )}
                              {a.status!=='realizado'&&a.status!=='cancelado'&&(
                                <button onClick={()=>updSt(a.id,'realizado')} className="act-b" style={{background:'rgba(6,182,212,.1)',border:'1px solid rgba(6,182,212,.25)',color:'#22D3EE'}}>Realizado</button>
                              )}
                              {a.status!=='retorno'&&a.status!=='cancelado'&&(
                                <button onClick={()=>updSt(a.id,'retorno')} className="act-b" style={{background:'rgba(124,58,237,.1)',border:'1px solid rgba(124,58,237,.25)',color:'#A78BFA'}}>Retorno</button>
                              )}
                              {a.cliente_whatsapp&&(
                                <button onClick={()=>window.open(`https://wa.me/55${a.cliente_whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá, ${a.cliente_nome}! Confirmando seu atendimento às ${fH(a.data_hora)}.`)}`,'_blank')} className="act-b" style={{background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.22)',color:'#4ADE80'}}>💬</button>
                              )}
                              {a.status!=='cancelado'&&(
                                <button onClick={()=>updSt(a.id,'cancelado')} className="act-b" style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.20)',color:'#F87171'}}>✕</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )
          )}

          {/* SEMANA */}
          {view==='semana'&&(
            <>
              <div className="sem-grid">
                {sem.map(dia=>{
                  const as=agsD(dia);const isH=dia===hoje;const isS=dia===diaSel
                  return(
                    <div key={dia} className={`sem-day${isH?' hoje':''}${isS?' sel':''}`} onClick={()=>setDiaSel(dia===diaSel?null:dia)}>
                      <p style={{fontSize:'9px',fontWeight:700,color:isH?'#60A5FA':'#64748B',textTransform:'uppercase' as const,letterSpacing:'.07em'}}>{nDia(dia)}</p>
                      <p style={{fontSize:'20px',fontWeight:800,color:isH?'#3B82F6':'#F8FAFC',lineHeight:1}}>{numDia(dia)}</p>
                      {as.length>0?(
                        <div style={{marginTop:'5px',display:'flex',flexDirection:'column',gap:'2px'}}>
                          {as.slice(0,3).map((a:any)=>{const s=SC[a.status]||SC.pendente;return(
                            <div key={a.id} style={{background:s.bg,borderRadius:'4px',padding:'2px 4px',fontSize:'9px',fontWeight:600,color:s.c,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',border:`1px solid ${s.bd}`}}>
                              {fH(a.data_hora)} {a.cliente_nome?.split(' ')[0]||'—'}
                            </div>
                          )})}
                          {as.length>3&&<p style={{fontSize:'9px',color:'#64748B'}}>+{as.length-3}</p>}
                        </div>
                      ):<p style={{fontSize:'9px',color:'#374151',marginTop:'5px'}}>Livre</p>}
                    </div>
                  )
                })}
              </div>

              {diaSel&&(
                <div className="card" style={{padding:'18px',borderRadius:'18px',border:'1px solid rgba(59,130,246,.25)'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
                    <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',textTransform:'capitalize' as const}}>{fD(diaSel)}{diaSel===hoje?' — Hoje':''}</p>
                    <span style={{fontSize:'12px',color:'#64748B'}}>{agsD(diaSel).length} atendimento{agsD(diaSel).length!==1?'s':''}</span>
                  </div>
                  {agsD(diaSel).length===0?(
                    <p style={{fontSize:'13px',color:'#374151',textAlign:'center',padding:'16px 0'}}>Nenhum horário neste dia</p>
                  ):agsD(diaSel).map((a:any)=>{
                    const sc=SC[a.status]||SC.pendente;const cg=ag(a.cliente_nome||'A')
                    return(
                      <div key={a.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(255,255,255,.06)',marginBottom:'6px',flexWrap:'wrap'}}>
                        <div style={{background:GRAD,borderRadius:'7px',padding:'4px 8px',fontSize:'11px',fontWeight:700,color:'#fff',flexShrink:0}}>{fH(a.data_hora)}</div>
                        <div style={{width:'28px',height:'28px',borderRadius:'50%',background:cg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#fff',flexShrink:0}}>{(a.cliente_nome||'?').charAt(0).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.cliente_nome||'—'}</p>
                          <p style={{fontSize:'11px',color:'#64748B'}}>{a.servicos?.nome||''}{a.profissionais?.nome?' · '+a.profissionais.nome:''}</p>
                        </div>
                        <span style={{fontSize:'11px',fontWeight:700,padding:'3px 9px',borderRadius:'999px',background:sc.bg,color:sc.c,border:`1px solid ${sc.bd}`,flexShrink:0}}>{sc.t}</span>
                        <div style={{display:'flex',gap:'4px'}}>
                          {a.status!=='confirmado'&&a.status!=='realizado'&&a.status!=='cancelado'&&<button onClick={()=>updSt(a.id,'confirmado')} className="act-b" style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.28)',color:'#22C55E'}}>✓</button>}
                          {a.cliente_whatsapp&&<button onClick={()=>window.open(`https://wa.me/55${a.cliente_whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá, ${a.cliente_nome}!`)}`,'_blank')} className="act-b" style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',color:'#4ADE80'}}>💬</button>}
                          {a.status!=='cancelado'&&<button onClick={()=>updSt(a.id,'cancelado')} className="act-b" style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.18)',color:'#F87171'}}>✕</button>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

        </div></div>
      </div>
    </div>
  )
}
