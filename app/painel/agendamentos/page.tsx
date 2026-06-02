'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'
const SB_ITEMS=[
  {h:'/painel',l:'Início'},{h:'/painel/agendamentos',l:'Agenda',on:true},
  {h:'/painel/clientes',l:'Clientes'},{h:'/painel/orcamentos',l:'Orçamentos'},
  {h:'/painel/cobrancas',l:'Cobranças'},{h:'/painel/pagamentos',l:'Pagamentos'},
  {h:'/painel/servicos',l:'Serviços'},{h:'/painel/profissionais',l:'Profissionais'},
  {h:'/painel/relatorio',l:'Relatórios'},{h:'/painel/perfil',l:'Configurações'},
]
const SC:Record<string,{bg:string,bd:string,c:string,t:string}>={
  pendente:      {bg:'rgba(245,158,11,.15)',  bd:'rgba(245,158,11,.35)',  c:'#FBBF24',t:'Pendente'},
  confirmado:    {bg:'rgba(34,197,94,.15)',   bd:'rgba(34,197,94,.35)',   c:'#4ADE80',t:'Confirmado'},
  em_atendimento:{bg:'rgba(59,130,246,.15)',  bd:'rgba(59,130,246,.32)',  c:'#93C5FD',t:'Em atendimento'},
  realizado:     {bg:'rgba(59,130,246,.15)',  bd:'rgba(59,130,246,.32)',  c:'#93C5FD',t:'Realizado'},
  cancelado:     {bg:'rgba(239,68,68,.14)',   bd:'rgba(239,68,68,.30)',   c:'#F87171',t:'Cancelado'},
  retorno:       {bg:'rgba(139,92,246,.16)',  bd:'rgba(139,92,246,.35)',  c:'#C4B5FD',t:'Retorno'},
}
const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
select option{background:#07111F;color:#F8FAFC}
.sb{width:240px;min-height:100vh;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);border-right:1px solid rgba(148,163,184,.14);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.sb-logo{padding:22px 18px 16px;border-bottom:1px solid rgba(148,163,184,.10);display:flex;align-items:center;gap:10px}
.sb-ic{width:30px;height:30px;border-radius:8px;background:${G};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 20px rgba(124,58,237,.5)}
.sb nav{flex:1;padding:10px 8px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:500;color:#94A3B8;transition:all .15s;border:1px solid transparent}
.nl:hover{background:rgba(124,58,237,.10);border-color:rgba(124,58,237,.20);color:#fff}
.nl.on{background:${G};color:#fff;font-weight:700;border-color:rgba(255,255,255,.10);box-shadow:0 0 26px rgba(124,58,237,.34),inset 0 1px 0 rgba(255,255,255,.12)}
.sb-foot{padding:12px 10px;border-top:1px solid rgba(148,163,184,.10)}
.mhdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.96);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.12);position:sticky;top:0;z-index:20;width:100%;max-width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.14)}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:240px;flex:1;min-height:100vh;width:calc(100% - 240px);max-width:calc(100% - 240px)}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;width:100%;overflow-x:hidden}
.bdy{max-width:1280px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04);transition:border-color .18s,box-shadow .18s}
.crd:hover{box-shadow:0 24px 60px rgba(0,0,0,.44),0 0 28px rgba(124,58,237,.14)}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;height:46px;padding:0 20px;font-size:13px;font-weight:700;box-shadow:0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.26);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 16px 40px rgba(59,130,246,.38),0 0 36px rgba(124,58,237,.38)}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:44px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-s:hover{border-color:rgba(59,130,246,.38);color:#fff}
.inp{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:0 14px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.14)}
.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:22px}
.ag-card{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:18px;padding:16px 18px;margin-bottom:8px;transition:border-color .18s;overflow:hidden}
.ag-card:hover{border-color:rgba(59,130,246,.28)}
.pill{padding:0 13px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.16);transition:all .18s;white-space:nowrap;background:rgba(15,23,42,.7);color:#94A3B8;height:34px;display:inline-flex;align-items:center}
.pill:hover{border-color:rgba(255,255,255,.22);color:#CBD5E1}
.pill.on{background:rgba(59,130,246,.16);border:1px solid rgba(59,130,246,.42);color:#F8FAFC}
.seg{background:rgba(15,23,42,.8);border:1px solid rgba(148,163,184,.16);border-radius:12px;padding:3px;display:flex;gap:2px}
.seg-b{padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:all .18s;font-family:inherit;border:none;background:transparent;color:#64748B;border-radius:10px}
.seg-b.on{background:${G};color:#fff;box-shadow:0 6px 18px rgba(59,130,246,.28)}
.act-b{border-radius:10px;padding:0 10px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .2s;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap;height:34px;line-height:1}
.act-b:hover{filter:brightness(1.15)}
.sem-day{background:radial-gradient(circle at top left,rgba(124,58,237,.06),transparent),linear-gradient(145deg,rgba(15,23,42,.95),rgba(8,20,33,.97));border:1.5px solid rgba(148,163,184,.14);border-radius:14px;padding:10px 8px;cursor:pointer;transition:all .18s;min-height:100px;display:flex;flex-direction:column;gap:4px}
.sem-day:hover{border-color:rgba(59,130,246,.30)}
.sem-day.hoje{border-color:rgba(59,130,246,.60);box-shadow:0 0 0 1px rgba(59,130,246,.20)}
.sem-day.sel{border-color:rgba(124,58,237,.55);background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))}
@media(max-width:1023px){
  .sb{display:none!important}
  .main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mhdr{display:flex!important}
  .bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:repeat(3,1fr)!important;gap:8px!important}
  .hdr-top{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .hdr-btns{display:flex!important;gap:8px!important}
  .hdr-btns a,.hdr-btns button{flex:1!important;justify-content:center!important}
  .ctl-bar{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .pills-row{overflow-x:auto!important;display:flex!important;gap:5px!important;flex-wrap:nowrap!important;scrollbar-width:none!important;padding-bottom:2px!important}
  .pills-row::-webkit-scrollbar{display:none!important}
  .ag-card{padding:14px!important;border-radius:16px!important;margin-bottom:6px!important}
  .ag-card-inner{grid-template-columns:auto 1fr!important;gap:10px!important}
  .ag-card-left{flex-direction:column!important;align-items:center!important;gap:4px!important}
  .act-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin-top:8px!important;width:100%!important}
  .act-grid .act-b{width:100%!important;height:38px!important;font-size:12px!important;border-radius:12px!important}
  .sem-grid{gap:4px!important}
}
@media(max-width:600px){.kpi-grid{grid-template-columns:1fr 1fr!important}}
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
    const fim=new Date();fim.setDate(fim.getDate()+60)
    const atas=new Date();atas.setDate(atas.getDate()-14)
    const [{data:p},{data:ps},{data:as}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('id,nome').eq('user_id',user.id).order('nome'),
      supabase.from('agendamentos').select('*,servicos(nome),profissionais(nome)').eq('user_id',user.id).gte('data_hora',atas.toISOString()).lte('data_hora',fim.toISOString()).order('data_hora',{ascending:true}),
    ])
    setPerfil(p);setProfs(ps||[]);setAgs(as||[]);setLoading(false)
  }

  function fData(dataHora: string) {
    const d = new Date(dataHora)
    return d.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'})
  }
  function fHora(dataHora: string) {
    const d = new Date(dataHora)
    return d.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})
  }

  function wppConfirmacao(a: any) {
    const tel = (a.cliente_whatsapp||a.cliente_telefone||'').replace(/\D/g,'')
    if (!tel) return null
    const msg = encodeURIComponent(
      'Olá, ' + (a.cliente_nome||'') + '! Seu agendamento foi confirmado.\n\n' +
      'Serviço: ' + (a.servicos?.nome||'') + '\n' +
      'Profissional: ' + (a.profissionais?.nome||'') + '\n' +
      'Data: ' + fData(a.data_hora) + '\n' +
      'Horário: ' + fHora(a.data_hora) + '\n' +
      (a.valor ? 'Valor: R$ ' + a.valor + '\n' : '') +
      '\n' + (perfil?.nome_negocio||'') +
      (perfil?.endereco ? '\n' + perfil.endereco : '') +
      '\n\nSe precisar remarcar, fale conosco por aqui.'
    )
    return 'https://wa.me/55' + tel + '?text=' + msg
  }

  function wppLembrete(a: any) {
    const tel = (a.cliente_whatsapp||a.cliente_telefone||'').replace(/\D/g,'')
    if (!tel) return null
    const msg = encodeURIComponent(
      'Olá, ' + (a.cliente_nome||'') + '! Passando para lembrar do seu agendamento.\n\n' +
      'Serviço: ' + (a.servicos?.nome||'') + '\n' +
      'Profissional: ' + (a.profissionais?.nome||'') + '\n' +
      'Data: ' + fData(a.data_hora) + '\n' +
      'Horário: ' + fHora(a.data_hora) + '\n\n' +
      'Te esperamos no horário marcado.\n\n' + (perfil?.nome_negocio||'')
    )
    return 'https://wa.me/55' + tel + '?text=' + msg
  }

  async function atualizarStatus(id: string, status: string) {
    await supabase.from('agendamentos').update({status}).eq('id', id)
    setAgs(prev => prev.map(a => a.id === id ? {...a, status} : a))
    setMsg('Status atualizado!')
    setTimeout(() => setMsg(''), 2500)
  }

  async function updSt(id:string,status:string){
    await supabase.from('agendamentos').update({status}).eq('id',id)
    setAgs(prev=>prev.map(a=>a.id===id?{...a,status}:a))
    setMsg('✓ Atualizado');setTimeout(()=>setMsg(''),2000)
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
    {l:'Hoje',v:agHoje.length,c:'#60A5FA',bg:'rgba(59,130,246,.10)',bd:'rgba(59,130,246,.24)',ico:'📅'},
    {l:'Confirmados',v:ags.filter(a=>a.data_hora?.startsWith(hoje)&&a.status==='confirmado').length,c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.24)',ico:'✓'},
    {l:'Pendentes',v:ags.filter(a=>a.data_hora?.startsWith(hoje)&&a.status==='pendente').length,c:'#FBBF24',bg:'rgba(245,158,11,.10)',bd:'rgba(245,158,11,.24)',ico:'⏳'},
    {l:'Retornos',v:ags.filter(a=>a.status==='retorno').length,c:'#C4B5FD',bg:'rgba(139,92,246,.10)',bd:'rgba(139,92,246,.24)',ico:'↩'},
    {l:'Cancelados',v:ags.filter(a=>a.data_hora?.startsWith(hoje)&&a.status==='cancelado').length,c:'#F87171',bg:'rgba(239,68,68,.10)',bd:'rgba(239,68,68,.24)',ico:'✕'},
  ]
  function getSem(){
    const b=new Date();b.setDate(b.getDate()+semOff*7)
    const d=b.getDay();const s=new Date(b);s.setDate(b.getDate()-d)
    return Array.from({length:7},(_,i)=>{const x=new Date(s);x.setDate(s.getDate()+i);return x.toISOString().split('T')[0]})
  }
  const sem=getSem()
  const nD=(s:string)=>new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','').toUpperCase()
  const numD=(s:string)=>new Date(s+'T12:00:00').getDate()
  const agsD=(d:string)=>filtered.filter(a=>a.data_hora?.startsWith(d))
  const dias=Array.from(new Set(filtered.map(a=>a.data_hora?.split('T')[0]))).sort()
  const nome=perfil?.nome_negocio||''
  const ini=(nome||'A').charAt(0).toUpperCase()
  const Sb=()=>(
    <aside className="sb">
      <div className="sb-logo">
        <div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
      </div>
      <nav>{SB_ITEMS.map(it=><Link key={it.l} href={it.h} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot">
        <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
          <div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div>
        </div>
      </div>
    </aside>
  )
  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando agenda...</p></div>)
  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drw${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid rgba(148,163,184,.10)'}}>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span>
          <button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button>
        </div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{SB_ITEMS.map(it=><Link key={it.l} href={it.h} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}>{it.l}</Link>)}</nav>
      </div>
      <Sb/>
      <div className="main">
        <div className="mhdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            {[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:`${w}px`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Agenda</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">
          <AvisoAtraso/>
                    
          {msg&&<div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'rgba(34,197,94,.18)',border:'1px solid rgba(34,197,94,.38)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#4ADE80',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{msg}</div>}
          {/* Header */}
          <div className="hdr-top" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'28px'}}>
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
              <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:'18px',padding:'18px 16px',boxSizing:'border-box' as const}}>
                <div style={{width:'38px',height:'38px',borderRadius:'11px',background:k.bg,border:`1px solid ${k.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',marginBottom:'10px'}}>{k.ico}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>{k.l}</p>
                <p style={{fontSize:'26px',fontWeight:800,color:k.c,lineHeight:1,letterSpacing:'-0.03em'}}>{k.v}</p>
              </div>
            ))}
          </div>
          {/* Controles */}
          <div className="ctl-bar crd" style={{padding:'14px 16px',marginBottom:'18px',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap',borderRadius:'18px'}}>
            <div className="seg">
              {(['lista','semana'] as const).map(v=>(
                <button key={v} onClick={()=>setView(v)} className={`seg-b${view===v?' on':''}`}>{v==='lista'?'☰ Lista':'▦ Semana'}</button>
              ))}
            </div>
            <div className="pills-row" style={{display:'flex',gap:'5px',flex:1,flexWrap:'wrap'}}>
              <button className={`pill${fSt==='todos'?' on':''}`} onClick={()=>setFSt('todos')}>Todos</button>
              {Object.entries(SC).map(([k,v])=>(
                <button key={k} className={`pill${fSt===k?' on':''}`} onClick={()=>setFSt(fSt===k?'todos':k)} style={fSt===k?{background:v.bg,borderColor:v.bd,color:v.c}:{}}>{v.t}</button>
              ))}
            </div>
            {profs.length>0&&(
              <select value={fPr} onChange={e=>setFPr(e.target.value)}
                style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'12px',height:'38px',padding:'0 12px',fontSize:'12px',color:'#CBD5E1',outline:'none',flexShrink:0,minWidth:'180px'}}>
                <option value="todos">Todos profissionais</option>
                {profs.map((p:any)=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            )}
            {view==='semana'&&(
              <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0,flexWrap:'wrap'}}>
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
              <div className="crd" style={{padding:'56px 24px',textAlign:'center',borderRadius:'20px'}}>
                <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'rgba(59,130,246,.14)',border:'1.5px solid rgba(59,130,246,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',margin:'0 auto 16px'}}>📅</div>
                <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'6px'}}>Nenhum agendamento encontrado</p>
                <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5,maxWidth:'280px',margin:'0 auto 20px'}}>Ajuste os filtros ou crie um novo agendamento.</p>
                <Link href="/painel/agendamentos/novo" className="btn-p" style={{display:'inline-flex'}}>+ Novo agendamento</Link>
              </div>
            ):(
              dias.map(dia=>(
                <div key={dia} style={{marginBottom:'22px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                    <div style={{width:'7px',height:'7px',borderRadius:'50%',background:dia===hoje?'#3B82F6':'#334155',boxShadow:dia===hoje?'0 0 10px rgba(59,130,246,.8)':'none',flexShrink:0}}/>
                    <p style={{fontSize:'13px',fontWeight:700,color:dia===hoje?'#60A5FA':'#94A3B8',textTransform:'capitalize' as const}}>{fD(dia!)}{dia===hoje?' — Hoje':''}</p>
                    <div style={{flex:1,height:'1px',background:'rgba(148,163,184,.10)'}}/>
                    <span style={{fontSize:'11px',color:'#374151',flexShrink:0}}>{agsD(dia!).length} atend.</span>
                  </div>
                  {agsD(dia!).map((a:any)=>{
                    const sc=SC[a.status]||SC.pendente
                    return(
                      <div key={a.id} className="ag-card">
                        <div className="ag-card-inner" style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'12px',alignItems:'flex-start'}}>
                          <div className="ag-card-left" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',flexShrink:0}}>
                            <div style={{width:'40px',height:'40px',borderRadius:'50%',background:AV,border:'1px solid rgba(59,130,246,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',fontWeight:700,color:'#fff'}}>{(a.cliente_nome||'?').charAt(0).toUpperCase()}</div>
                            <div style={{background:G,borderRadius:'8px',padding:'3px 8px',fontSize:'11px',fontWeight:700,color:'#fff',whiteSpace:'nowrap',boxShadow:'0 3px 10px rgba(59,130,246,.24)'}}>{fH(a.data_hora)}</div>
                          </div>
                          <div style={{minWidth:0}}>
                            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'5px',marginBottom:'2px',flexWrap:'wrap'}}>
                              <p style={{fontSize:'15px',fontWeight:800,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,lineHeight:1.15}}>{a.cliente_nome||'—'}</p>
                              <span style={{fontSize:'10px',fontWeight:600,padding:'2px 8px',borderRadius:'999px',background:sc.bg,color:sc.c,border:`1px solid ${sc.bd}`,whiteSpace:'nowrap',flexShrink:0,lineHeight:'18px'}}>{sc.t}</span>
                            </div>
                            <p style={{fontSize:'13px',color:'#94A3B8',marginBottom:'1px',lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.servicos?.nome||'Serviço não informado'}</p>
                            {a.profissionais?.nome&&<p style={{fontSize:'11px',color:'#64748B',lineHeight:1.2}}>Prof.: {a.profissionais.nome}</p>}
                            <div className="act-grid" style={{display:'flex',gap:'6px',marginTop:'10px',flexWrap:'wrap',width:'100%',maxWidth:'100%'}}>
                              {/* Botões WhatsApp */}
                              {(()=>{const wpp=wppConfirmacao(a);return wpp?<a href={wpp} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:'4px',background:'rgba(37,211,102,.12)',border:'1px solid rgba(37,211,102,.25)',borderRadius:'10px',padding:'6px 10px',fontSize:'11px',fontWeight:700,color:'#22C55E',textDecoration:'none',whiteSpace:'nowrap'}}>✓ Confirmar</a>:<span style={{fontSize:'11px',color:'#334155'}}>Sem WhatsApp</span>})()}
                              {(()=>{const wpp=wppLembrete(a);return wpp?<a href={wpp} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:'4px',background:'rgba(59,130,246,.10)',border:'1px solid rgba(59,130,246,.22)',borderRadius:'10px',padding:'6px 10px',fontSize:'11px',fontWeight:700,color:'#60A5FA',textDecoration:'none',whiteSpace:'nowrap'}}>🔔 Lembrete</a>:null})()}
                              {a.status!=='compareceu'&&<button onClick={()=>atualizarStatus(a.id,'compareceu')} style={{background:'rgba(34,197,94,.10)',border:'1px solid rgba(34,197,94,.20)',borderRadius:'10px',padding:'6px 10px',fontSize:'11px',fontWeight:700,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>✓ Compareceu</button>}
                              {a.status!=='faltou'&&<button onClick={()=>atualizarStatus(a.id,'faltou')} style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.18)',borderRadius:'10px',padding:'6px 10px',fontSize:'11px',fontWeight:700,color:'#F87171',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>✗ Faltou</button>}
                              {a.status!=='confirmado'&&a.status!=='realizado'&&a.status!=='cancelado'&&<button onClick={()=>updSt(a.id,'confirmado')} className="act-b" style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.35)',color:'#4ADE80'}}>✓ Confirmar</button>}
                              {a.status!=='realizado'&&a.status!=='cancelado'&&<button onClick={()=>updSt(a.id,'realizado')} className="act-b" style={{background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.30)',color:'#93C5FD'}}>Realizado</button>}
                              {a.status!=='retorno'&&a.status!=='cancelado'&&<button onClick={()=>updSt(a.id,'retorno')} className="act-b" style={{background:'rgba(139,92,246,.12)',border:'1px solid rgba(139,92,246,.30)',color:'#C4B5FD'}}>Retorno</button>}
                              {a.cliente_whatsapp&&<button onClick={()=>window.open(`https://wa.me/55${a.cliente_whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá, ${a.cliente_nome}! Confirmando seu atendimento às ${fH(a.data_hora)}.`)}`,'_blank')} className="act-b" style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.20)',color:'#6EE7B7'}}>💬</button>}
                              {a.status!=='cancelado'&&<button onClick={()=>updSt(a.id,'cancelado')} className="act-b" style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.30)',color:'#F87171'}}>Cancelar</button>}
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
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'8px',marginBottom:'14px'}} className="sem-grid">
                {sem.map(dia=>{
                  const as=agsD(dia);const isH=dia===hoje;const isS=dia===diaSel
                  return(
                    <div key={dia} className={`sem-day${isH?' hoje':''}${isS?' sel':''}`} onClick={()=>setDiaSel(dia===diaSel?null:dia)}>
                      <p style={{fontSize:'9px',fontWeight:700,color:isH?'#60A5FA':'#64748B',textTransform:'uppercase' as const,letterSpacing:'.07em'}}>{nD(dia)}</p>
                      <p style={{fontSize:'19px',fontWeight:800,color:isH?'#3B82F6':'#F8FAFC',lineHeight:1}}>{numD(dia)}</p>
                      {as.length>0?(
                        <div style={{marginTop:'4px',display:'flex',flexDirection:'column',gap:'2px'}}>
                          {as.slice(0,3).map((a:any)=>{const s=SC[a.status]||SC.pendente;return(
                            <div key={a.id} style={{background:s.bg,borderRadius:'4px',padding:'2px 4px',fontSize:'9px',fontWeight:600,color:s.c,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',border:`1px solid ${s.bd}`}}>
                              {fH(a.data_hora)} {a.cliente_nome?.split(' ')[0]||'—'}
                            </div>
                          )})}
                          {as.length>3&&<p style={{fontSize:'9px',color:'#64748B'}}>+{as.length-3}</p>}
                        </div>
                      ):<p style={{fontSize:'9px',color:'#374151',marginTop:'4px'}}>Livre</p>}
                    </div>
                  )
                })}
              </div>
              {diaSel&&(
                <div className="crd" style={{padding:'18px',borderRadius:'18px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
                    <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',textTransform:'capitalize' as const}}>{fD(diaSel)}{diaSel===hoje?' — Hoje':''}</p>
                    <span style={{fontSize:'12px',color:'#64748B'}}>{agsD(diaSel).length} atendimento{agsD(diaSel).length!==1?'s':''}</span>
                  </div>
                  {agsD(diaSel).length===0?(
                    <p style={{fontSize:'13px',color:'#374151',textAlign:'center',padding:'16px 0'}}>Nenhum horário neste dia</p>
                  ):agsD(diaSel).map((a:any)=>{
                    const sc=SC[a.status]||SC.pendente
                    return(
                      <div key={a.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'12px',background:'rgba(15,23,42,.6)',border:'1.5px solid rgba(148,163,184,.12)',marginBottom:'6px',flexWrap:'wrap'}}>
                        <div style={{background:G,borderRadius:'8px',padding:'3px 8px',fontSize:'11px',fontWeight:700,color:'#fff',flexShrink:0}}>{fH(a.data_hora)}</div>
                        <div style={{width:'28px',height:'28px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#fff',flexShrink:0}}>{(a.cliente_nome||'?').charAt(0).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.cliente_nome||'—'}</p>
                          <p style={{fontSize:'11px',color:'#64748B'}}>{a.servicos?.nome||''}{a.profissionais?.nome?' · '+a.profissionais.nome:''}</p>
                        </div>
                        <span style={{fontSize:'10px',fontWeight:600,padding:'2px 8px',borderRadius:'999px',background:sc.bg,color:sc.c,border:`1px solid ${sc.bd}`,flexShrink:0}}>{sc.t}</span>
                        <div style={{display:'flex',gap:'4px'}}>
                          {a.status!=='confirmado'&&a.status!=='realizado'&&a.status!=='cancelado'&&<button onClick={()=>updSt(a.id,'confirmado')} className="act-b" style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.30)',color:'#4ADE80'}}>✓</button>}
                          {a.cliente_whatsapp&&<button onClick={()=>window.open(`https://wa.me/55${a.cliente_whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá, ${a.cliente_nome}!`)}`,'_blank')} className="act-b" style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.18)',color:'#6EE7B7'}}>💬</button>}
                          {a.status!=='cancelado'&&<button onClick={()=>updSt(a.id,'cancelado')} className="act-b" style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.24)',color:'#F87171'}}>✕</button>}
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
