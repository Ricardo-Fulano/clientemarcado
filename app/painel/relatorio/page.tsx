'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import PlanoBloqueado from '@/components/PlanoBloqueado'
const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'
const fBRL=(v:number)=>`R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2})}`
const SB=[
  {h:'/painel',l:'Início'},{h:'/painel/agendamentos',l:'Agenda'},
  {h:'/painel/clientes',l:'Clientes'},{h:'/painel/orcamentos',l:'Orçamentos'},
  {h:'/painel/cobrancas',l:'Cobranças'},{h:'/painel/pagamentos',l:'Pagamentos'},
  {h:'/painel/servicos',l:'Serviços'},{h:'/painel/profissionais',l:'Profissionais'},
  {h:'/painel/relatorio',l:'Relatórios',on:true},{h:'/painel/perfil',l:'Configurações'},
]
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
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1200px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
.prof-card{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 36%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:18px;padding:18px;margin-bottom:8px;transition:border-color .18s}
.prof-card:hover{border-color:rgba(139,92,246,.28)}
@media(max-width:1023px){
  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mhdr{display:flex!important}.bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .hdr-r{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .hdr-r input{width:100%!important}
  .prof-inner{flex-direction:column!important;gap:10px!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
`
const CustomTooltip=({active,payload,label}:any)=>{
  if(active&&payload&&payload.length){
    return(
      <div style={{background:'rgba(15,23,42,.98)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'12px',padding:'10px 14px'}}>
        <p style={{fontSize:'12px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>{label}</p>
        <p style={{fontSize:'14px',fontWeight:800,color:payload[0].fill}}>{fBRL(payload[0].value)}</p>
      </div>
    )
  }
  return null
}
export default function Relatorios(){
  const [perfil,setPerfil]=useState<any>(null)
  const [profs,setProfs]=useState<any[]>([])
  const [pagamentos,setPagamentos]=useState<any[]>([])
  const [despesas,setDespesas]=useState<any[]>([])
  const [agendamentos,setAgendamentos]=useState<any[]>([])
  const [orcProcsData,setOrcProcsData]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [mes,setMes]=useState(new Date().toISOString().slice(0,7))
  const [profSel,setProfSel]=useState<any>(null)
  const [dataSel,setDataSel]=useState('')
  const [modalCal,setModalCal]=useState(false)
  const [calMes,setCalMes]=useState(new Date().toISOString().slice(0,7))
  const [expandida,setExpandida]=useState<string|null>(null)
  useEffect(()=>{load()},[mes])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:ps},{data:pags},{data:desp},{data:ags},{data:orcPags},{data:orcs}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('id,nome,cargo,foto_url').eq('user_id',user.id).order('nome'),
      supabase.from('pagamentos').select('valor,data,status,orcamento_id').eq('user_id',user.id),
      supabase.from('despesas').select('valor,data,categoria').eq('user_id',user.id).then(r=>{if(r.error)console.error('Despesas:',r.error);return{data:r.data||[]}}),
      supabase.from('agendamentos').select('id,profissional_id,cliente_nome,servicos(id,nome,preco),data_hora,status,valor').eq('user_id',user.id).order('data_hora',{ascending:false}),
      supabase.from('orcamento_pagamentos').select('valor,data,orcamento_id').eq('user_id',user.id),
      supabase.from('orcamentos').select('id,profissional_id,procedimentos_odonto,data').eq('user_id',user.id).not('procedimentos_odonto','is',null),
    ])
    // Fonte única: orcamento_pagamentos para pagamentos de orçamentos
    // tabela 'pagamentos' apenas para pagamentos manuais (sem orcamento_id)
    const pagsDeOrc=(orcPags||[]).map((op:any)=>({valor:op.valor||0,data:op.data,status:'confirmado',orcamento_id:op.orcamento_id}))
    const pagsManuais=(pags||[]).filter((p:any)=>!p.orcamento_id)
    const todoPags=[...pagsManuais,...pagsDeOrc]
    // Procedimentos odontológicos para resumo
    const orcProcsFlat:any[]=[]
    ;(orcs||[]).forEach((o:any)=>{if(o.procedimentos_odonto?.length)o.procedimentos_odonto.forEach((pr:any)=>orcProcsFlat.push(pr))})
    setPerfil(p);setProfs(ps||[]);setPagamentos(todoPags);setDespesas(desp||[]);setAgendamentos(ags||[])
    setOrcProcsData(orcProcsFlat)
    setLoading(false)
  }
  const pagMes=pagamentos.filter(p=>p.data?.startsWith(mes))
  const despMes=despesas.filter(d=>d.data?.startsWith(mes))
  const agsMes=agendamentos.filter(a=>a.data_hora?.startsWith(mes))
  const receita=pagMes.reduce((a,p)=>a+(p.valor||0),0)
  const despTotal=despMes.reduce((a,d)=>a+(d.valor||0),0)
  const lucro=receita-despTotal
  const lucroPositivo=lucro>=0
  const profStats=profs.map(p=>{
    const ags=agsMes.filter(a=>a.profissional_id===p.id&&a.status==='realizado')
    const rec=ags.reduce((a,ag)=>a+(ag.valor||0),0)
    return{...p,ats:ags.length,rec}
  }).sort((a,b)=>b.rec-a.rec)
  const melhor=profStats[0]
  const chartData=[
    {name:'Receita',valor:receita,fill:'#22C55E'},
    {name:'Despesas',valor:despTotal,fill:'#EF4444'},
    {name:'Resultado',valor:Math.abs(lucro),fill:lucroPositivo?'#22C55E':'#EF4444'},
  ]
  const melhorComRec=profStats.find(p=>p.rec>0)||null
  const STATUS_OK=['realizado','Realizado','compareceu','concluido','concluído','finalizado','confirmado']
  const agsRealizados=agsMes.filter(a=>STATUS_OK.includes(a.status||''))
  const servicosMap:Record<string,{nome:string,qtd:number,receita:number,profs:Record<string,number>}>={}
  agsRealizados.forEach(a=>{
    const nomeSv=a.servicos?.nome||a.servico_nome||a.servico||'Serviço não informado'
    if(!servicosMap[nomeSv])servicosMap[nomeSv]={nome:nomeSv,qtd:0,receita:0,profs:{}}
    servicosMap[nomeSv].qtd+=1
    servicosMap[nomeSv].receita+=(a.valor||a.valor_total||a.servicos?.preco||0)
    if(a.profissional_id){
      const pid=a.profissional_id
      servicosMap[nomeSv].profs[pid]=(servicosMap[nomeSv].profs[pid]||0)+1
    }
  })
  const resumoServicos=Object.values(servicosMap)
    .map(sv=>{
      const topProfId=Object.entries(sv.profs).sort((a,b)=>b[1]-a[1])[0]?.[0]||null
      const topProf=topProfId?profs.find(p=>p.id===topProfId)?.nome||'Não informado':'Não informado'
      return{...sv,ticket:sv.qtd>0?sv.receita/sv.qtd:0,topProf}
    })
    .sort((a,b)=>b.qtd-a.qtd)
  const svMaisRealizado=resumoServicos[0]||null
  // Cálculos diários
  const hoje=new Date().toISOString().split('T')[0]
  const receitaHoje=pagamentos.filter(p=>p.data===hoje).reduce((a,p)=>a+(p.valor||0),0)
  // Agrupar pagamentos do mês por dia
  const porDia:Record<string,number>={}
  pagMes.forEach(p=>{if(p.data)porDia[p.data]=(porDia[p.data]||0)+(p.valor||0)})
  const diasComMovimento=Object.entries(porDia).filter(([,v])=>v>0)
  const melhorDia=diasComMovimento.length>0?diasComMovimento.reduce((a,b)=>b[1]>a[1]?b:a):null
  const diaFraco=diasComMovimento.length>0?diasComMovimento.reduce((a,b)=>b[1]<a[1]?b:a):null
  const diasDoMes=new Date(parseInt(mes.split('-')[0]),parseInt(mes.split('-')[1]),0).getDate()
  const diasAteHoje=mes===new Date().toISOString().slice(0,7)?new Date().getDate():diasDoMes
  const mediaDiaria=diasAteHoje>0?receita/diasAteHoje:0
  // Dados gráfico por dia
  const chartDiario=Array.from({length:diasDoMes},(_,i)=>{
    const d=`${mes}-${String(i+1).padStart(2,'0')}`
    return{name:String(i+1).padStart(2,'0'),valor:porDia[d]||0,fill:'#22C55E'}
  })
  // Agrupamento por dia da semana
  const diasSemana=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const porSemana:number[]=[0,0,0,0,0,0,0]
  pagMes.forEach(p=>{
    if(!p.data)return
    const dow=new Date(p.data+'T12:00:00').getDay()
    porSemana[dow]+=(p.valor||0)
  })
  const chartSemana=diasSemana.map((n,i)=>({name:n,valor:porSemana[i],fill:'#3B82F6'}))
  const melhorSemana=chartSemana.reduce((a,b)=>b.valor>a.valor?b:a)
  const fracoSemana=chartSemana.filter(d=>d.valor>0).reduce((a,b)=>b.valor<a.valor?b:a,chartSemana.find(d=>d.valor>0)||chartSemana[0])
  const fmtDia=(d:string)=>{if(!d)return '';const[a,m,di]=d.split('-');return `${di}/${m}`}
  const nomeMes=(()=>{const d=new Date(mes+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return d.charAt(0).toUpperCase()+d.slice(1).replace(' De ',' de ').replace(' de ',' de ')})()
  const nome=perfil?.nome_negocio||''
  const ini=(nome||'R').charAt(0).toUpperCase()
  const Sb=()=>(
    <aside className="sb">
      <div className="sb-logo"><div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span></div>
      <nav>{SB.map(it=><Link key={it.l} href={it.h} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot"><div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div><div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div></div></div>
      <button onClick={sair} style={{width:'100%',marginTop:'8px',background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'10px',padding:'9px 14px',color:'#FCA5A5',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'8px'}}>Sair</button>
    </aside>
  )
  async function sair(){await supabase.auth.signOut();window.location.href='/login'}
  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando relatórios...</p></div>)
  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drw${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid rgba(148,163,184,.10)'}}><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span><button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button></div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{SB.map(it=><Link key={it.l} href={it.h} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}>{it.l}</Link>)}</nav>
      </div>
      <Sb/>
      <div className="main">
        <div className="mhdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>{[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:`${w}px`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}</button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Relatórios</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">
          <div className="hdr-r" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'28px'}}>
            <div>
              <h1 style={{fontSize:'24px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Relatórios</h1>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5}}>Acompanhe receita, despesas, lucro e desempenho da equipe em um só lugar.</p>
            </div>
            <div>
              <p style={{fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'6px'}}>Período</p>
              <input type="month" value={mes} onChange={e=>setMes(e.target.value)} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'14px',padding:'0 14px',height:'46px',fontSize:'14px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',minWidth:'200px'}}/>
              <p style={{fontSize:'12px',color:'#64748B',marginTop:'5px',textTransform:'capitalize'}}>{nomeMes}</p>
            </div>
          </div>
          <div className="kpi-grid">
            {[
              {l:'Receita total',d:'Entradas confirmadas no período',v:fBRL(receita),c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.26)',ico:'↑'},
              {l:'Despesas',d:'Custos registrados no período',v:fBRL(despTotal),c:'#F87171',bg:'rgba(239,68,68,.10)',bd:'rgba(239,68,68,.26)',ico:'↓'},
              {l:'Lucro estimado',d:'Receita menos despesas',v:fBRL(lucro),c:lucroPositivo?'#4ADE80':'#F87171',bg:lucroPositivo?'rgba(34,197,94,.10)':'rgba(239,68,68,.10)',bd:lucroPositivo?'rgba(34,197,94,.26)':'rgba(239,68,68,.26)',ico:lucroPositivo?'✓':'⚠'},
              {l:'Melhor profissional',d:melhorComRec?fBRL(melhorComRec.rec)+' no período':'Nenhuma receita no período',v:melhorComRec?.nome||'Sem destaque ainda',c:'#C4B5FD',bg:'rgba(124,58,237,.10)',bd:'rgba(124,58,237,.26)',ico:'🏆'},
            ].map(k=>(
              <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:'18px',padding:'18px 16px',boxSizing:'border-box' as const,boxShadow:'0 20px 48px rgba(0,0,0,.28)'}}>
                <div style={{width:'38px',height:'38px',borderRadius:'11px',background:k.bg,border:`1px solid ${k.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',marginBottom:'10px'}}>{k.ico}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'3px'}}>{k.l}</p>
                <p style={{fontSize:'11px',color:'#64748B',marginBottom:'6px'}}>{k.d}</p>
                <p style={{fontSize:'20px',fontWeight:800,color:k.c,lineHeight:1,letterSpacing:'-0.02em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* Seção Desempenho Diário */}
          <div style={{marginBottom:'22px'}}>
            <div style={{marginBottom:'16px'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(34,197,94,.10)',border:'1px solid rgba(34,197,94,.22)',borderRadius:'999px',padding:'4px 12px',marginBottom:'10px'}}>
                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#22C55E',display:'inline-block'}}/>
                <span style={{fontSize:'11px',fontWeight:700,color:'#4ADE80',letterSpacing:'.06em'}}>ANÁLISE DIÁRIA</span>
              </div>
              <p style={{fontSize:'20px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em',marginBottom:'5px'}}>Desempenho diário</p>
              <p style={{fontSize:'13px',color:'#64748B'}}>Veja quais dias do mês geraram mais receita no período selecionado.</p>
            </div>
            {/* Cards diários */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}} className="kpi-grid">
              {[
                {l:'Hoje',d:new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}),v:fBRL(receitaHoje),c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.26)',ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>},
                {l:'Melhor dia do mês',d:melhorDia?fmtDia(melhorDia[0]):'Sem dados',v:melhorDia?fBRL(melhorDia[1]):'—',c:'#FBBF24',bg:'rgba(245,158,11,.10)',bd:'rgba(245,158,11,.26)',ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>},
                {l:'Dia mais fraco',d:diaFraco?fmtDia(diaFraco[0]):'Sem dados',v:diaFraco?fBRL(diaFraco[1]):'—',c:'#F87171',bg:'rgba(239,68,68,.10)',bd:'rgba(239,68,68,.26)',ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>},
                {l:'Média diária',d:`Base: ${diasAteHoje} dias`,v:fBRL(mediaDiaria),c:'#60A5FA',bg:'rgba(59,130,246,.10)',bd:'rgba(59,130,246,.26)',ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
              ].map(k=>(
                <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:'16px',padding:'16px',boxSizing:'border-box' as const}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'10px',background:k.bg,border:`1px solid ${k.bd}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'10px',color:k.c}}>{k.ico}</div>
                  <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'2px'}}>{k.l}</p>
                  <p style={{fontSize:'11px',color:'#64748B',marginBottom:'5px'}}>{k.d}</p>
                  <p style={{fontSize:'18px',fontWeight:800,color:k.c,lineHeight:1,letterSpacing:'-0.02em'}}>{k.v}</p>
                </div>
              ))}
            </div>
            {/* Gráfico Receita por Dia */}
            <div style={{background:'radial-gradient(circle at top left,rgba(34,197,94,.06),transparent 35%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.16)',borderRadius:'18px',padding:'20px',marginBottom:'16px'}}>
              <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'3px'}}>Receita por dia</p>
              <p style={{fontSize:'12px',color:'#64748B',marginBottom:'16px'}}>Veja quanto entrou em cada dia do período selecionado.</p>
              {receita===0?(
                <div style={{height:'140px',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'6px'}}>
                  <p style={{fontSize:'13px',color:'#64748B'}}>Nenhuma receita confirmada neste período.</p>
                </div>
              ):(
                <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch' as any}}>
                  <div style={{minWidth:`${diasDoMes*28}px`,height:'180px'}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDiario} margin={{top:5,right:4,left:0,bottom:0}} barSize={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.08)" vertical={false}/>
                        <XAxis dataKey="name" tick={{fill:'#64748B',fontSize:9}} axisLine={false} tickLine={false} interval={1}/>
                        <YAxis tickFormatter={v=>v>0?`${(v/1000).toFixed(0)}k`:'0'} tick={{fill:'#64748B',fontSize:9}} axisLine={false} tickLine={false} width={28}/>
                        <Tooltip content={<CustomTooltip/>} cursor={{fill:'rgba(148,163,184,.06)'}}/>
                        <Bar dataKey="valor" fill="#22C55E" radius={[3,3,0,0]} fillOpacity={0.85}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
            {/* Melhores dias da semana */}
            <div style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.06),transparent 35%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.16)',borderRadius:'18px',padding:'20px'}}>
              <div style={{marginBottom:'14px'}}>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'3px'}}>Melhores dias da semana</p>
                <p style={{fontSize:'12px',color:'#64748B'}}>Entenda quais dias costumam movimentar mais o seu negócio no período.</p>
              </div>
              {receita===0?(
                <p style={{fontSize:'13px',color:'#64748B'}}>Nenhuma receita confirmada neste período.</p>
              ):(
                <>
                  <div style={{display:'flex',gap:'8px',marginBottom:'14px',flexWrap:'wrap'}}>
                    {melhorSemana.valor>0&&<div style={{display:'flex',alignItems:'center',gap:'6px',background:'rgba(34,197,94,.10)',border:'1px solid rgba(34,197,94,.22)',borderRadius:'8px',padding:'5px 10px'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>
                      <span style={{fontSize:'11px',fontWeight:700,color:'#4ADE80'}}>Mais forte: {melhorSemana.name}</span>
                    </div>}
                    {fracoSemana&&fracoSemana.valor>0&&melhorSemana.name!==fracoSemana.name&&<div style={{display:'flex',alignItems:'center',gap:'6px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.20)',borderRadius:'8px',padding:'5px 10px'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/></svg>
                      <span style={{fontSize:'11px',fontWeight:700,color:'#F87171'}}>Mais fraco: {fracoSemana.name}</span>
                    </div>}
                  </div>
                  <div style={{height:'160px'}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartSemana} margin={{top:5,right:5,left:0,bottom:0}} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.08)" vertical={false}/>
                        <XAxis dataKey="name" tick={{fill:'#94A3B8',fontSize:11,fontWeight:600}} axisLine={false} tickLine={false}/>
                        <YAxis tickFormatter={v=>v>0?`${(v/1000).toFixed(0)}k`:'0'} tick={{fill:'#64748B',fontSize:10}} axisLine={false} tickLine={false} width={32}/>
                        <Tooltip content={<CustomTooltip/>} cursor={{fill:'rgba(148,163,184,.06)'}}/>
                        <Bar dataKey="valor" radius={[5,5,0,0]} fillOpacity={0.88}>
                          {chartSemana.map((d,i)=><Cell key={i} fill={d.name===melhorSemana.name&&d.valor>0?'#22C55E':'#3B82F6'}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ─── CONSULTAR POR DATA ─── */}
          {(()=>{
            const fmtDataCompleta=(d:string)=>{
              if(!d)return ''
              const dt=new Date(d+'T12:00:00')
              return dt.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
            }
            const fmtDataCurta=(d:string)=>{
              if(!d)return ''
              const [a,m,di]=d.split('-')
              return `${di}/${m}/${a}`
            }
            // Dados do dia selecionado
            const recDia=pagamentos.filter(p=>p.data===dataSel).reduce((a,p)=>a+(p.valor||0),0)
            const despDia=despesas.filter(d=>d.data===dataSel).reduce((a,d)=>a+(d.valor||0),0)
            const lucroDia=recDia-despDia
            const agsDia=agendamentos.filter(a=>a.data_hora?.startsWith(dataSel))
            const ticketDia=agsDia.length>0?recDia/agsDia.length:0
            // Calendário premium
            const [calAno,calMesN]=calMes.split('-').map(Number)
            const diasNoCalMes=new Date(calAno,calMesN,0).getDate()
            const primeiroDiaCalMes=new Date(calAno,calMesN-1,1).getDay()
            const nomeMesCal=new Date(calAno,calMesN-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
            const todayStr2=new Date().toISOString().split('T')[0]
            const ontemStr=(()=>{const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().split('T')[0]})()
            // Dias com receita no mês do calendário
            const recCalMes:Record<string,number>={}
            pagamentos.filter(p=>p.data?.startsWith(calMes)).forEach(p=>{
              if(p.data)recCalMes[p.data]=(recCalMes[p.data]||0)+(p.valor||0)
            })
            const melhorDiaCal=Object.entries(recCalMes).length>0?Object.entries(recCalMes).reduce((a,b)=>b[1]>a[1]?b:a):null
            return(
              <div style={{marginBottom:'22px'}}>
                <div style={{marginBottom:'14px'}}>
                  <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(6,182,212,.10)',border:'1px solid rgba(6,182,212,.22)',borderRadius:'999px',padding:'4px 12px',marginBottom:'10px'}}>
                    <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#22D3EE',display:'inline-block'}}/>
                    <span style={{fontSize:'11px',fontWeight:700,color:'#22D3EE',letterSpacing:'.06em'}}>CONSULTA DIÁRIA</span>
                  </div>
                  <p style={{fontSize:'20px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em',marginBottom:'5px'}}>Consultar por data</p>
                  <p style={{fontSize:'13px',color:'#64748B'}}>Escolha um dia específico para visualizar receita, despesas e atendimentos.</p>
                </div>
                {/* Campo seletor premium */}
                <button onClick={()=>setModalCal(true)}
                  style={{width:'100%',display:'flex',alignItems:'center',gap:'12px',background:'linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(6,182,212,.28)',borderRadius:'16px',padding:'14px 18px',cursor:'pointer',fontFamily:'inherit',transition:'all .18s',boxShadow:dataSel?'0 0 0 1px rgba(6,182,212,.15),0 4px 20px rgba(6,182,212,.08)':'none'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(6,182,212,.55)';(e.currentTarget as HTMLButtonElement).style.boxShadow='0 0 0 2px rgba(6,182,212,.12),0 6px 24px rgba(6,182,212,.12)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(6,182,212,.28)';(e.currentTarget as HTMLButtonElement).style.boxShadow=dataSel?'0 0 0 1px rgba(6,182,212,.15),0 4px 20px rgba(6,182,212,.08)':'none'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'rgba(6,182,212,.12)',border:'1px solid rgba(6,182,212,.22)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div style={{flex:1,textAlign:'left'}}>
                    {dataSel
                      ?<><p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',textTransform:'capitalize'}}>{fmtDataCompleta(dataSel)}</p><p style={{fontSize:'12px',color:'#22D3EE',marginTop:'1px'}}>Receita: {fBRL(recDia)}</p></>
                      :<><p style={{fontSize:'14px',fontWeight:600,color:'#94A3B8'}}>Selecionar data</p><p style={{fontSize:'12px',color:'#475569',marginTop:'1px'}}>Toque para abrir o calendário</p></>
                    }
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {/* Resumo do dia */}
                {dataSel&&(
                  <div style={{marginTop:'14px',background:'radial-gradient(circle at top left,rgba(6,182,212,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(6,182,212,.20)',borderRadius:'18px',padding:'20px'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'8px'}}>
                      <div>
                        <p style={{fontSize:'13px',fontWeight:700,color:'#22D3EE',textTransform:'capitalize',marginBottom:'2px'}}>{fmtDataCompleta(dataSel)}</p>
                        <p style={{fontSize:'11px',color:'#475569'}}>Resumo do dia</p>
                      </div>
                      <button onClick={()=>setDataSel('')} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:'18px',lineHeight:1,padding:'4px'}}>×</button>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'14px'}}>
                      {[
                        {l:'Receita',v:fBRL(recDia),c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.22)'},
                        {l:'Despesas',v:fBRL(despDia),c:'#F87171',bg:'rgba(239,68,68,.10)',bd:'rgba(239,68,68,.22)'},
                        {l:'Lucro',v:fBRL(lucroDia),c:lucroDia>=0?'#4ADE80':'#F87171',bg:lucroDia>=0?'rgba(34,197,94,.10)':'rgba(239,68,68,.10)',bd:lucroDia>=0?'rgba(34,197,94,.22)':'rgba(239,68,68,.22)'},
                      ].map(k=>(
                        <div key={k.l} style={{background:k.bg,border:`1px solid ${k.bd}`,borderRadius:'12px',padding:'12px 10px'}}>
                          <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.07em',marginBottom:'4px'}}>{k.l}</p>
                          <p style={{fontSize:'16px',fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:agsDia.length>0?'14px':'0'}}>
                      {[
                        {l:'Atendimentos',v:agsDia.length,c:'#60A5FA'},
                        {l:'Ticket médio',v:fBRL(ticketDia),c:'#C4B5FD'},
                      ].map(k=>(
                        <div key={k.l} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(148,163,184,.10)',borderRadius:'10px',padding:'10px 12px'}}>
                          <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.07em',marginBottom:'3px'}}>{k.l}</p>
                          <p style={{fontSize:'16px',fontWeight:800,color:k.c}}>{k.v}</p>
                        </div>
                      ))}
                    </div>
                    {agsDia.length>0&&(
                      <div>
                        <p style={{fontSize:'12px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:'8px'}}>Atendimentos do dia</p>
                        {agsDia.map((a:any)=>{
                          const stC:Record<string,string>={realizado:'#4ADE80',confirmado:'#93C5FD',pendente:'#FBBF24',cancelado:'#F87171',retorno:'#C4B5FD'}
                          const cor=stC[a.status]||'#94A3B8'
                          const hora=new Date(a.data_hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
                          return(
                            <div key={a.id} style={{background:'rgba(15,23,42,.72)',border:'1px solid rgba(148,163,184,.10)',borderRadius:'10px',padding:'10px 14px',marginBottom:'6px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                              <div style={{minWidth:0}}>
                                <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',marginBottom:'1px'}}>{a.cliente_nome||'—'}</p>
                                <p style={{fontSize:'11px',color:'#64748B'}}>{a.servicos?.nome||'Serviço'} · {hora}</p>
                              </div>
                              <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
                                <span style={{fontSize:'10px',fontWeight:600,padding:'2px 7px',borderRadius:'999px',background:`rgba(${cor==='#4ADE80'?'34,197,94':'59,130,246'},.12)`,color:cor,border:`1px solid ${cor}40`}}>{a.status}</span>
                                {a.valor>0&&<span style={{fontSize:'13px',fontWeight:700,color:'#4ADE80'}}>{fBRL(a.valor)}</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {agsDia.length===0&&recDia===0&&despDia===0&&(
                      <p style={{fontSize:'13px',color:'#475569',textAlign:'center',padding:'12px 0'}}>Nenhuma movimentação registrada neste dia.</p>
                    )}
                  </div>
                )}
                {/* Modal calendário premium */}
                {modalCal&&(
                  <>
                    <div onClick={()=>setModalCal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',backdropFilter:'blur(6px)',zIndex:80}}/>
                    <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:90,background:'linear-gradient(180deg,#0B1628,#090F1E)',borderRadius:'24px 24px 0 0',border:'1.5px solid rgba(6,182,212,.22)',boxShadow:'0 -24px 60px rgba(0,0,0,.6)',maxHeight:'92vh',overflowY:'auto',fontFamily:'inherit'}}>
                      {/* Handle */}
                      <div style={{display:'flex',justifyContent:'center',padding:'10px 0 0'}}>
                        <div style={{width:'40px',height:'4px',borderRadius:'2px',background:'rgba(148,163,184,.25)'}}/>
                      </div>
                      {/* Header modal */}
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px 10px'}}>
                        <div>
                          <p style={{fontSize:'16px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>Selecionar data</p>
                          <p style={{fontSize:'12px',color:'#475569',marginTop:'2px'}}>Consulte a receita de um dia específico</p>
                        </div>
                        <button onClick={()=>setModalCal(false)} style={{background:'rgba(15,23,42,.8)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'10px',width:'34px',height:'34px',display:'flex',alignItems:'center',justifyContent:'center',color:'#94A3B8',cursor:'pointer',fontSize:'18px',lineHeight:1}}>×</button>
                      </div>
                      {/* Chips rápidos */}
                      <div style={{padding:'0 16px 12px',display:'flex',gap:'8px',overflowX:'auto',WebkitOverflowScrolling:'touch' as any}}>
                        {[
                          {l:'Hoje',d:todayStr2},
                          {l:'Ontem',d:ontemStr},
                          ...(melhorDiaCal?[{l:'Melhor dia',d:melhorDiaCal[0]}]:[]),
                        ].map(chip=>(
                          <button key={chip.l} onClick={()=>{setDataSel(chip.d);setModalCal(false)}}
                            style={{flexShrink:0,padding:'7px 14px',borderRadius:'999px',fontSize:'12px',fontWeight:700,cursor:'pointer',border:`1.5px solid ${dataSel===chip.d?'rgba(6,182,212,.6)':'rgba(148,163,184,.18)'}`,background:dataSel===chip.d?'rgba(6,182,212,.15)':'rgba(15,23,42,.88)',color:dataSel===chip.d?'#22D3EE':'#94A3B8',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                            {chip.l}
                          </button>
                        ))}
                      </div>
                      {/* Navegação mês */}
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 16px 12px'}}>
                        <button onClick={()=>{const[a,m]=calMes.split('-').map(Number);const p=new Date(a,m-2,1);setCalMes(p.toISOString().slice(0,7))}}
                          style={{width:'36px',height:'36px',borderRadius:'10px',background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.16)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#94A3B8',fontSize:'18px',lineHeight:1}}>‹</button>
                        <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',textTransform:'capitalize'}}>{nomeMesCal}</p>
                        <button onClick={()=>{const[a,m]=calMes.split('-').map(Number);const p=new Date(a,m,1);setCalMes(p.toISOString().slice(0,7))}}
                          style={{width:'36px',height:'36px',borderRadius:'10px',background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.16)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#94A3B8',fontSize:'18px',lineHeight:1}}>›</button>
                      </div>
                      {/* Grade calendário */}
                      <div style={{padding:'0 12px 28px'}}>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'3px',marginBottom:'6px'}}>
                          {['D','S','T','Q','Q','S','S'].map((d,i)=>(
                            <div key={i} style={{textAlign:'center',fontSize:'11px',fontWeight:700,color:'#334155',padding:'4px 0'}}>{d}</div>
                          ))}
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'3px'}}>
                          {Array.from({length:primeiroDiaCalMes}).map((_,i)=><div key={'e'+i}/>)}
                          {Array.from({length:diasNoCalMes}).map((_,i)=>{
                            const dia=i+1
                            const dStr=`${calAno}-${String(calMesN).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                            const isSel=dataSel===dStr
                            const isHoje=dStr===todayStr2
                            const temRec=(recCalMes[dStr]||0)>0
                            return(
                              <button key={dia} onClick={()=>{setDataSel(dStr);setModalCal(false)}}
                                style={{padding:'10px 2px',borderRadius:'10px',fontSize:'13px',fontWeight:isSel||isHoje?700:500,cursor:'pointer',border:'1.5px solid',textAlign:'center',fontFamily:'inherit',position:'relative',transition:'all .13s',
                                  background:isSel?'linear-gradient(135deg,#06B6D4,#3B82F6)':isHoje?'rgba(6,182,212,.10)':'rgba(255,255,255,.03)',
                                  color:isSel?'#fff':isHoje?'#22D3EE':'#CBD5E1',
                                  borderColor:isSel?'transparent':isHoje?'rgba(6,182,212,.45)':'rgba(148,163,184,.08)',
                                  boxShadow:isSel?'0 4px 14px rgba(6,182,212,.35)':'none',
                                }}>
                                {dia}
                                {temRec&&!isSel&&<span style={{position:'absolute',bottom:'3px',left:'50%',transform:'translateX(-50%)',width:'4px',height:'4px',borderRadius:'50%',background:'#22C55E',display:'block'}}/>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })()}
          <div style={{background:'radial-gradient(circle at top left,rgba(34,211,238,.08),transparent 35%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'20px',padding:'24px',marginBottom:'22px',boxShadow:'0 20px 48px rgba(0,0,0,.28)'}}>
            <div style={{marginBottom:'18px'}}>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Desempenho financeiro do período</p>
              <p style={{fontSize:'13px',color:'#64748B'}}>Compare receita, despesas e lucro estimado no período selecionado.</p>
            </div>
            {receita===0&&despTotal===0?(
              <div style={{height:'200px',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'8px'}}>
                <p style={{fontSize:'14px',color:'#64748B'}}>📊</p>
                <p style={{fontSize:'13px',color:'#64748B'}}>Sem dados financeiros neste período.</p>
                <p style={{fontSize:'12px',color:'#374151'}}>Registre pagamentos e despesas para visualizar o gráfico.</p>
              </div>
            ):(
              <>
                <div style={{width:'100%',height:'280px'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top:10,right:10,left:10,bottom:0}} barSize={56}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.10)" vertical={false}/>
                      <XAxis dataKey="name" tick={{fill:'#94A3B8',fontSize:13,fontWeight:600}} axisLine={false} tickLine={false}/>
                      <YAxis tickFormatter={(v)=>`R$ ${(v/1000).toFixed(0)}k`} tick={{fill:'#64748B',fontSize:11}} axisLine={false} tickLine={false} width={60}/>
                      <Tooltip content={<CustomTooltip/>} cursor={{fill:'rgba(148,163,184,.06)'}}/>
                      <Bar dataKey="valor" radius={[8,8,0,0]}>
                        {chartData.map((entry,i)=><Cell key={i} fill={entry.fill} fillOpacity={0.85}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{display:'flex',gap:'16px',justifyContent:'center',marginTop:'14px',flexWrap:'wrap'}}>
                  {chartData.map(d=>(
                    <div key={d.name} style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <div style={{width:'10px',height:'10px',borderRadius:'3px',background:d.fill,flexShrink:0}}/>
                      <span style={{fontSize:'12px',color:'#94A3B8'}}>{d.name}: <strong style={{color:'#CBD5E1'}}>{d.name==='Resultado'?fBRL(lucro):fBRL(d.valor)}</strong></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div style={{marginBottom:'22px'}}>
            <div style={{marginBottom:'16px'}}>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Resumo por serviço</p>
              <p style={{fontSize:'13px',color:'#64748B'}}>Veja quais serviços e procedimentos geraram receita no período selecionado.</p>
            </div>
            {resumoServicos.length===0?(
              <div className="crd" style={{padding:'40px 24px',textAlign:'center'}}>
                <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>Nenhum serviço realizado neste período</p>
                <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.6}}>Quando atendimentos forem marcados como realizados, o resumo por serviço aparecerá aqui.</p>
              </div>
            ):(
              <>
                {svMaisRealizado&&(
                  <div style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.10),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(59,130,246,.22)',borderRadius:'14px',padding:'14px 18px',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'}}>
                    <div>
                      <p style={{fontSize:'10px',fontWeight:700,color:'#60A5FA',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>Serviço/procedimento mais realizado</p>
                      <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>{svMaisRealizado.nome}</p>
                    </div>
                    <span style={{fontSize:'13px',fontWeight:700,color:'#60A5FA',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.22)',borderRadius:'999px',padding:'4px 12px'}}>{svMaisRealizado.qtd} atendimento{svMaisRealizado.qtd!==1?'s':''} no período</span>
                  </div>
                )}
                <div style={{background:'radial-gradient(circle at top left,rgba(6,182,212,.04),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.14)',borderRadius:'16px',overflow:'hidden'}}>
                  {resumoServicos.map((sv,i)=>(
                    <div key={sv.nome} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',padding:'13px 18px',borderBottom:i<resumoServicos.length-1?'1px solid rgba(255,255,255,.05)':'none'}}>
                      <div style={{minWidth:0,flex:1}}>
                        <p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC',marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{sv.nome}</p>
                        <p style={{fontSize:'12px',color:'#64748B'}}>{sv.qtd} realizado{sv.qtd!==1?'s':''}</p>
                      </div>
                      <p style={{fontSize:'15px',fontWeight:800,color:'#4ADE80',flexShrink:0}}>{fBRL(sv.receita)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {orcProcsData.length>0&&(()=>{
            const procsMap:Record<string,{nome:string,qtd:number,total:number,dentes:number}>={};
            orcProcsData.forEach((p:any)=>{
              const nome=p.proc||p.nome||p.procedimento||'Procedimento';
              if(!procsMap[nome])procsMap[nome]={nome,qtd:0,total:0,dentes:0};
              procsMap[nome].qtd+=(p.qtd||1);
              procsMap[nome].total+=(p.total||0);
              procsMap[nome].dentes+=(p.dentes?.length||0);
            });
            const procs=Object.values(procsMap).sort((a,b)=>b.total-a.total);
            if(!procs.length)return null;
            return(
              <div style={{marginBottom:'22px'}}>
                <div style={{marginBottom:'16px'}}>
                  <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Procedimentos odontológicos</p>
                  <p style={{fontSize:'13px',color:'#64748B'}}>Veja os procedimentos odontológicos registrados nos orçamentos do período.</p>
                </div>
                <div style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.14)',borderRadius:'16px',overflow:'hidden'}}>
                  {procs.map((sv,i)=>(
                    <div key={sv.nome} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',padding:'13px 18px',borderBottom:i<procs.length-1?'1px solid rgba(255,255,255,.05)':'none'}}>
                      <div style={{minWidth:0,flex:1}}>
                        <p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC',marginBottom:'2px'}}>{sv.nome}</p>
                        <p style={{fontSize:'12px',color:'#64748B'}}>{sv.qtd} procedimento{sv.qtd!==1?'s':''}{sv.dentes>0?` · ${sv.dentes} dente${sv.dentes!==1?'s':''}`:''}</p>
                      </div>
                      <p style={{fontSize:'15px',fontWeight:800,color:'#C4B5FD',flexShrink:0}}>{fBRL(sv.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* ─── RESUMO DE DESPESAS ─── */}
          {(()=>{
            if(despMes.length===0)return(
              <div style={{marginBottom:'22px'}}>
                <div style={{marginBottom:'16px'}}>
                  <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Resumo de despesas</p>
                  <p style={{fontSize:'13px',color:'#64748B'}}>Veja de onde vêm as despesas registradas no período selecionado.</p>
                </div>
                <div style={{background:'linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.12)',borderRadius:'16px',padding:'40px 24px',textAlign:'center'}}>
                  <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.20)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  </div>
                  <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>Nenhuma despesa registrada</p>
                  <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.6,maxWidth:'360px',margin:'0 auto'}}>Quando você registrar despesas, elas aparecerão aqui separadas por categoria.</p>
                </div>
              </div>
            )
            // Agrupar por categoria
            const catMap:Record<string,{nome:string,total:number,qtd:number,itens:{desc?:string,valor:number,data:string}[]}>= {}
            despMes.forEach((d:any)=>{
              const cat=d.categoria||'Outros'
              if(!catMap[cat])catMap[cat]={nome:cat,total:0,qtd:0,itens:[]}
              catMap[cat].total+=(d.valor||0)
              catMap[cat].qtd+=1
              catMap[cat].itens.push({desc:d.descricao||d.nome||undefined,valor:d.valor||0,data:d.data||''})
            })
            const cats=Object.values(catMap).sort((a,b)=>b.total-a.total)
            const maiorCat=cats[0]
            return(
              <div style={{marginBottom:'22px'}}>
                <div style={{marginBottom:'16px'}}>
                  <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Resumo de despesas</p>
                  <p style={{fontSize:'13px',color:'#64748B'}}>Veja de onde vêm as despesas registradas no período selecionado.</p>
                </div>
                {/* Maior despesa */}
                {maiorCat&&(
                  <div style={{background:'radial-gradient(circle at top left,rgba(239,68,68,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(239,68,68,.22)',borderRadius:'14px',padding:'14px 18px',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                      <div style={{width:'42px',height:'42px',borderRadius:'12px',background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.22)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      </div>
                      <div>
                        <p style={{fontSize:'10px',fontWeight:700,color:'#F87171',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'3px'}}>Maior despesa do período</p>
                        <p style={{fontSize:'15px',fontWeight:800,color:'#F8FAFC'}}>{maiorCat.nome}</p>
                        <p style={{fontSize:'12px',color:'#64748B',marginTop:'2px'}}>{maiorCat.qtd} lançamento{maiorCat.qtd!==1?'s':''} no período</p>
                      </div>
                    </div>
                    <p style={{fontSize:'22px',fontWeight:800,color:'#F87171',flexShrink:0}}>{fBRL(maiorCat.total)}</p>
                  </div>
                )}
                {/* Lista por categoria */}
                <div style={{background:'radial-gradient(circle at top left,rgba(239,68,68,.04),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.14)',borderRadius:'16px',overflow:'hidden'}}>
                  {cats.map((cat,i)=>{
                    const pct=despTotal>0?Math.round((cat.total/despTotal)*100):0
                    const isExp=expandida===cat.nome
                    return(
                      <div key={cat.nome} style={{borderBottom:i<cats.length-1?'1px solid rgba(255,255,255,.05)':'none'}}>
                        <button onClick={()=>setExpandida(isExp?null:cat.nome)}
                          style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',padding:'13px 18px',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                          <div style={{minWidth:0,flex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                              <p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{cat.nome}</p>
                              <span style={{fontSize:'10px',fontWeight:700,padding:'2px 6px',borderRadius:'999px',background:'rgba(239,68,68,.12)',color:'#F87171',border:'1px solid rgba(239,68,68,.22)',flexShrink:0}}>{pct}%</span>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                              <div style={{flex:1,height:'3px',borderRadius:'2px',background:'rgba(255,255,255,.06)',overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#EF4444,#F87171)',borderRadius:'2px',transition:'width .3s'}}/>
                              </div>
                              <p style={{fontSize:'12px',color:'#64748B',flexShrink:0}}>{cat.qtd} lançamento{cat.qtd!==1?'s':''}</p>
                            </div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'10px',flexShrink:0}}>
                            <p style={{fontSize:'15px',fontWeight:800,color:'#F87171'}}>{fBRL(cat.total)}</p>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform:isExp?'rotate(180deg)':'none',transition:'transform .2s'}}><polyline points="6 9 12 15 18 9"/></svg>
                          </div>
                        </button>
                        {isExp&&cat.itens.length>0&&(
                          <div style={{padding:'0 18px 12px',borderTop:'1px solid rgba(255,255,255,.04)'}}>
                            {cat.itens.map((item,j)=>(
                              <div key={j} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:j<cat.itens.length-1?'1px solid rgba(255,255,255,.04)':'none'}}>
                                <div>
                                  <p style={{fontSize:'13px',color:'#CBD5E1'}}>{item.desc||cat.nome}</p>
                                  {item.data&&<p style={{fontSize:'11px',color:'#475569',marginTop:'1px'}}>{(()=>{const[a,m,d]=item.data.split('-');return `${d}/${m}`})()}</p>}
                                </div>
                                <p style={{fontSize:'13px',fontWeight:700,color:'#F87171'}}>{fBRL(item.valor)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
          <div>
            <div style={{marginBottom:'16px'}}>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Desempenho por profissional</p>
              <p style={{fontSize:'13px',color:'#64748B'}}>Veja quanto cada profissional movimentou no período selecionado.</p>
            </div>
            {profStats.length===0?(
              <div className="crd" style={{padding:'40px 24px',textAlign:'center'}}>
                <p style={{fontSize:'14px',color:'#64748B'}}>Nenhum profissional cadastrado. <Link href="/painel/profissionais" style={{color:'#60A5FA',textDecoration:'none'}}>Cadastrar profissional</Link></p>
              </div>
            ):(
              profStats.map(p=>{
                const ini2=(p.nome||'?').charAt(0).toUpperCase()
                const atsMes=agsMes.filter(a=>a.profissional_id===p.id).length
                const retMes=agsMes.filter(a=>a.profissional_id===p.id&&a.status==='retorno').length
                return(
                  <div key={p.id} className="prof-card">
                    <div className="prof-inner" style={{display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
                      {p.foto_url?(
                        <img src={p.foto_url} alt={p.nome} style={{width:'48px',height:'48px',borderRadius:'50%',objectFit:'cover',border:'1px solid rgba(255,255,255,.12)',flexShrink:0}}/>
                      ):(
                        <div style={{width:'48px',height:'48px',borderRadius:'50%',background:AV,border:'1px solid rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:800,color:'#fff',flexShrink:0}}>{ini2}</div>
                      )}
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'3px'}}>{p.nome}</p>
                        {p.cargo&&<p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'6px'}}>{p.cargo}</p>}
                        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                          <span style={{fontSize:'11px',fontWeight:600,padding:'2px 8px',borderRadius:'999px',background:'rgba(59,130,246,.14)',color:'#93C5FD',border:'1px solid rgba(59,130,246,.28)'}}>{atsMes} atendimento{atsMes!==1?'s':''}</span>
                          {retMes>0&&<span style={{fontSize:'11px',fontWeight:600,padding:'2px 8px',borderRadius:'999px',background:'rgba(124,58,237,.14)',color:'#C4B5FD',border:'1px solid rgba(124,58,237,.28)'}}>{retMes} retorno{retMes!==1?'s':''}</span>}
                        </div>
                      </div>
                      <div style={{textAlign:'right' as const,flexShrink:0}}>
                        <p style={{fontSize:'22px',fontWeight:800,color:'#4ADE80',lineHeight:1,marginBottom:'8px'}}>{fBRL(p.rec)}</p>
                        <button onClick={()=>setProfSel(p)} style={{background:'rgba(59,130,246,.10)',border:'1px solid rgba(59,130,246,.24)',color:'#93C5FD',borderRadius:'12px',padding:'8px 12px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all .18s'}}
                          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(59,130,246,.18)';(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(59,130,246,.40)';(e.currentTarget as HTMLButtonElement).style.color='#fff'}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='rgba(59,130,246,.10)';(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(59,130,246,.24)';(e.currentTarget as HTMLButtonElement).style.color='#93C5FD'}}>
                          Ver relatório →
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div></div>
      </div>
      {profSel&&(()=>{
        const pAgs=agendamentos.filter(a=>a.profissional_id===profSel.id&&a.data_hora?.startsWith(mes))
        const pRec=pAgs.filter(a=>a.status==='realizado'||a.status==='confirmado').reduce((a,ag)=>a+(ag.valor||0),0)
        const pAts=pAgs.length
        const pRets=pAgs.filter(a=>a.status==='retorno').length
        const pTicket=pAts>0?pRec/pAts:0
        const ini2=(profSel.nome||'?').charAt(0).toUpperCase()
        const nomeMesSel=(()=>{const d=new Date(mes+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return d.charAt(0).toUpperCase()+d.slice(1).replace(' De ',' de ')})()
        const semsData=[1,2,3,4].map(s=>{
          const start=new Date(mes+'-01');start.setDate((s-1)*7+1)
          const end=new Date(mes+'-01');end.setDate(s*7)
          const v=pAgs.filter(a=>{
            const d=new Date(a.data_hora)
            return d>=start&&d<=end&&(a.status==='realizado'||a.status==='confirmado')
          }).reduce((a,ag)=>a+(ag.valor||0),0)
          return{name:`Sem ${s}`,valor:v,fill:'#3B82F6'}
        })
        const temDados=semsData.some(s=>s.valor>0)
        const SC:Record<string,{c:string,t:string}>={
          realizado:{c:'#4ADE80',t:'Realizado'},confirmado:{c:'#93C5FD',t:'Confirmado'},
          pendente:{c:'#FBBF24',t:'Pendente'},cancelado:{c:'#F87171',t:'Cancelado'},
          retorno:{c:'#C4B5FD',t:'Retorno'},em_atendimento:{c:'#22D3EE',t:'Em atendimento'},
        }
        return(
          <>
            <div onClick={()=>setProfSel(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:98,backdropFilter:'blur(4px)'}}/>
            <div style={{position:'fixed',top:0,right:0,bottom:0,width:'min(580px,100vw)',background:'linear-gradient(180deg,#07111F,#050B16)',borderLeft:'1.5px solid rgba(148,163,184,.18)',boxShadow:'-24px 0 60px rgba(0,0,0,.45)',zIndex:99,overflowY:'auto',overflowX:'hidden'}}>
              <div style={{padding:'22px 24px 18px',borderBottom:'1px solid rgba(148,163,184,.12)',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',position:'sticky',top:0,background:'rgba(7,17,31,.96)',backdropFilter:'blur(20px)',zIndex:10}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  {profSel.foto_url?(
                    <img src={profSel.foto_url} alt={profSel.nome} style={{width:'52px',height:'52px',borderRadius:'50%',objectFit:'cover',border:'1px solid rgba(255,255,255,.12)',flexShrink:0}}/>
                  ):(
                    <div style={{width:'52px',height:'52px',borderRadius:'50%',background:AV,border:'1px solid rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',fontWeight:800,color:'#fff',flexShrink:0}}>{ini2}</div>
                  )}
                  <div>
                    <p style={{fontSize:'16px',fontWeight:800,color:'#F8FAFC',marginBottom:'2px'}}>{profSel.nome}</p>
                    {profSel.cargo&&<p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'2px'}}>{profSel.cargo}</p>}
                    <p style={{fontSize:'11px',color:'#64748B',textTransform:'capitalize' as const}}>Período: {nomeMesSel}</p>
                  </div>
                </div>
                <button onClick={()=>setProfSel(null)} style={{background:'rgba(15,23,42,.8)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'8px',width:'34px',height:'34px',display:'flex',alignItems:'center',justifyContent:'center',color:'#94A3B8',cursor:'pointer',fontSize:'18px',lineHeight:1,flexShrink:0,transition:'color .15s'}}
                  onMouseEnter={e=>(e.currentTarget.style.color='#fff')}
                  onMouseLeave={e=>(e.currentTarget.style.color='#94A3B8')}>×</button>
              </div>
              <div style={{padding:'22px 24px 40px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'22px'}}>
                  {[
                    {l:'Receita gerada',d:'Total confirmado',v:fBRL(pRec),c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.24)',ico:'↑'},
                    {l:'Atendimentos',d:'No período',v:pAts,c:'#60A5FA',bg:'rgba(59,130,246,.10)',bd:'rgba(59,130,246,.24)',ico:'📅'},
                    {l:'Retornos',d:'Retornos registrados',v:pRets,c:'#C4B5FD',bg:'rgba(124,58,237,.10)',bd:'rgba(124,58,237,.24)',ico:'↩'},
                    {l:'Ticket médio',d:'Média por atendimento',v:fBRL(pTicket),c:'#22D3EE',bg:'rgba(6,182,212,.10)',bd:'rgba(6,182,212,.24)',ico:'↗'},
                  ].map(k=>(
                    <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:'16px',padding:'16px',boxSizing:'border-box' as const}}>
                      <div style={{width:'34px',height:'34px',borderRadius:'10px',background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',marginBottom:'8px'}}>{k.ico}</div>
                      <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.07em',marginBottom:'2px'}}>{k.l}</p>
                      <p style={{fontSize:'10px',color:'#64748B',marginBottom:'5px'}}>{k.d}</p>
                      <p style={{fontSize:'20px',fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</p>
                    </div>
                  ))}
                </div>
                <div style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.06),transparent 35%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.16)',borderRadius:'16px',padding:'18px',marginBottom:'20px'}}>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'3px'}}>Evolução no período</p>
                  <p style={{fontSize:'12px',color:'#64748B',marginBottom:'14px'}}>Receita gerada por semana.</p>
                  {temDados?(
                    <div style={{width:'100%',height:'200px'}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={semsData} margin={{top:5,right:5,left:0,bottom:0}} barSize={36}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.10)" vertical={false}/>
                          <XAxis dataKey="name" tick={{fill:'#94A3B8',fontSize:12}} axisLine={false} tickLine={false}/>
                          <YAxis tickFormatter={v=>`R$${(v/1000).toFixed(1)}k`} tick={{fill:'#64748B',fontSize:10}} axisLine={false} tickLine={false} width={50}/>
                          <Tooltip content={<CustomTooltip/>} cursor={{fill:'rgba(148,163,184,.06)'}}/>
                          <Bar dataKey="valor" fill="#3B82F6" radius={[6,6,0,0]} fillOpacity={0.85}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ):(
                    <div style={{height:'120px',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'6px'}}>
                      <p style={{fontSize:'13px',color:'#64748B'}}>Sem dados suficientes ainda</p>
                      <p style={{fontSize:'11px',color:'#374151'}}>Quando este profissional tiver atendimentos pagos, o gráfico aparecerá aqui.</p>
                    </div>
                  )}
                </div>
                <div>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>Últimos atendimentos</p>
                  {pAgs.length===0?(
                    <div style={{background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'14px',padding:'24px',textAlign:'center'}}>
                      <p style={{fontSize:'13px',color:'#64748B',marginBottom:'4px'}}>Nenhum atendimento encontrado</p>
                      <p style={{fontSize:'12px',color:'#374151'}}>Os atendimentos deste profissional aparecerão aqui.</p>
                    </div>
                  ):(
                    pAgs.slice(0,10).map((a:any)=>{
                      const st=SC[a.status]||{c:'#94A3B8',t:a.status}
                      const fmtD=(s:string)=>new Date(s).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})
                      return(
                        <div key={a.id} style={{background:'rgba(15,23,42,.72)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'14px',padding:'14px',marginBottom:'6px'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                            <div style={{minWidth:0}}>
                              <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',marginBottom:'2px'}}>{a.cliente_nome||'—'}</p>
                              <p style={{fontSize:'11px',color:'#94A3B8'}}>{a.servicos?.nome||'Serviço'} · {fmtD(a.data_hora)}</p>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
                              <span style={{fontSize:'10px',fontWeight:600,padding:'2px 8px',borderRadius:'999px',background:`rgba(${st.c==='#4ADE80'?'34,197,94':'59,130,246'},.12)`,color:st.c,border:`1px solid ${st.c}40`}}>{st.t}</span>
                              {a.valor&&<p style={{fontSize:'13px',fontWeight:700,color:'#4ADE80'}}>{fBRL(a.valor)}</p>}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
