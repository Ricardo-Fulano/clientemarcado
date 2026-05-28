'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

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
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [mes,setMes]=useState(new Date().toISOString().slice(0,7))

  useEffect(()=>{load()},[])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:ps},{data:pags},{data:desp},{data:ags}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('id,nome,cargo,foto_url').eq('user_id',user.id).order('nome'),
      supabase.from('pagamentos').select('valor,data,status').eq('user_id',user.id),
      supabase.from('despesas').select('valor,data,categoria').eq('user_id',user.id),
      supabase.from('agendamentos').select('profissional_id,data_hora,status,valor').eq('user_id',user.id),
    ])
    setPerfil(p);setProfs(ps||[]);setPagamentos(pags||[]);setDespesas(desp||[]);setAgendamentos(ags||[]);setLoading(false)
  }

  // Cálculos filtrados pelo mês
  const pagMes=pagamentos.filter(p=>p.data?.startsWith(mes))
  const despMes=despesas.filter(d=>d.data?.startsWith(mes))
  const agsMes=agendamentos.filter(a=>a.data_hora?.startsWith(mes))

  const receita=pagMes.reduce((a,p)=>a+(p.valor||0),0)
  const despTotal=despMes.reduce((a,d)=>a+(d.valor||0),0)
  const lucro=receita-despTotal
  const lucroPositivo=lucro>=0

  // Melhor profissional: aquele com mais atendimentos realizados no mês
  const profStats=profs.map(p=>{
    const ags=agsMes.filter(a=>a.profissional_id===p.id&&a.status==='realizado')
    const rec=ags.reduce((a,ag)=>a+(ag.valor||0),0)
    return{...p,ats:ags.length,rec}
  }).sort((a,b)=>b.rec-a.rec)
  const melhor=profStats[0]

  // Dados do gráfico
  const chartData=[
    {name:'Receita',valor:receita,fill:'#22C55E'},
    {name:'Despesas',valor:despTotal,fill:'#EF4444'},
    {name:lucroPositivo?'Lucro':'Prejuízo',valor:Math.abs(lucro),fill:lucroPositivo?'#22C55E':'#EF4444'},
  ]

  const nomeMes=new Date(mes+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
  const nome=perfil?.nome_negocio||''
  const ini=(nome||'R').charAt(0).toUpperCase()

  const Sb=()=>(
    <aside className="sb">
      <div className="sb-logo"><div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span></div>
      <nav>{SB.map(it=><Link key={it.l} href={it.h} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot"><div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div><div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div></div></div>
    </aside>
  )

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

          {/* Header */}
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

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {l:'Receita total',d:'Entradas confirmadas no período',v:fBRL(receita),c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.26)',ico:'↑'},
              {l:'Despesas',d:'Custos registrados no período',v:fBRL(despTotal),c:'#F87171',bg:'rgba(239,68,68,.10)',bd:'rgba(239,68,68,.26)',ico:'↓'},
              {l:'Lucro estimado',d:'Receita menos despesas',v:fBRL(lucro),c:lucroPositivo?'#4ADE80':'#F87171',bg:lucroPositivo?'rgba(34,197,94,.10)':'rgba(239,68,68,.10)',bd:lucroPositivo?'rgba(34,197,94,.26)':'rgba(239,68,68,.26)',ico:lucroPositivo?'✓':'⚠'},
              {l:'Melhor profissional',d:melhor?fBRL(melhor.rec)+' no período':'Sem dados',v:melhor?.nome||'—',c:'#C4B5FD',bg:'rgba(124,58,237,.10)',bd:'rgba(124,58,237,.26)',ico:'🏆'},
            ].map(k=>(
              <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:'18px',padding:'18px 16px',boxSizing:'border-box' as const,boxShadow:'0 20px 48px rgba(0,0,0,.28)'}}>
                <div style={{width:'38px',height:'38px',borderRadius:'11px',background:k.bg,border:`1px solid ${k.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',marginBottom:'10px'}}>{k.ico}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'3px'}}>{k.l}</p>
                <p style={{fontSize:'11px',color:'#64748B',marginBottom:'6px'}}>{k.d}</p>
                <p style={{fontSize:'20px',fontWeight:800,color:k.c,lineHeight:1,letterSpacing:'-0.02em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* Gráfico */}
          <div style={{background:'radial-gradient(circle at top left,rgba(34,211,238,.08),transparent 35%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'20px',padding:'24px',marginBottom:'22px',boxShadow:'0 20px 48px rgba(0,0,0,.28)'}}>
            <div style={{marginBottom:'18px'}}>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Desempenho financeiro</p>
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
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="valor" radius={[8,8,0,0]}>
                        {chartData.map((entry,i)=><Cell key={i} fill={entry.fill} fillOpacity={0.85}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Legenda */}
                <div style={{display:'flex',gap:'16px',justifyContent:'center',marginTop:'14px',flexWrap:'wrap'}}>
                  {chartData.map(d=>(
                    <div key={d.name} style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <div style={{width:'10px',height:'10px',borderRadius:'3px',background:d.fill,flexShrink:0}}/>
                      <span style={{fontSize:'12px',color:'#94A3B8'}}>{d.name}: <strong style={{color:'#CBD5E1'}}>{fBRL(d.name==='Prejuízo'?-lucro:d.valor)}</strong></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Desempenho por profissional */}
          <div>
            <div style={{marginBottom:'16px'}}>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Desempenho por profissional</p>
              <p style={{fontSize:'13px',color:'#64748B'}}>Veja quanto cada profissional gerou no período selecionado.</p>
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
                        <p style={{fontSize:'22px',fontWeight:800,color:'#4ADE80',lineHeight:1,marginBottom:'4px'}}>{fBRL(p.rec)}</p>
                        <Link href="/painel/agendamentos" style={{fontSize:'12px',color:'#64748B',textDecoration:'none',transition:'color .15s'}}
                          onMouseEnter={e=>(e.currentTarget.style.color='#F8FAFC')}
                          onMouseLeave={e=>(e.currentTarget.style.color='#64748B')}>Ver agenda →</Link>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

        </div></div>
      </div>
    </div>
  )
}
