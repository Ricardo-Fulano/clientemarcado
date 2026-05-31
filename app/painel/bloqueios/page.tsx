'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'
const MOTIVOS=['Almoço','Folga','Pausa','Reunião','Manutenção','AusÃªncia','Feriado','Outro']
const SB_ITEMS=[
  {h:'/painel',l:'Início'},{h:'/painel/agendamentos',l:'Agenda',on:true},
  {h:'/painel/clientes',l:'Clientes'},{h:'/painel/orcamentos',l:'Orçamentos'},
  {h:'/painel/cobrancas',l:'Cobranças'},{h:'/painel/pagamentos',l:'Pagamentos'},
  {h:'/painel/servicos',l:'Serviços'},{h:'/painel/profissionais',l:'Profissionais'},
  {h:'/painel/relatorio',l:'Relatórios'},{h:'/painel/perfil',l:'Configurações'},
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
.nl.on{background:${G};color:#fff;font-weight:700;border-color:rgba(255,255,255,.10);box-shadow:0 0 26px rgba(124,58,237,.34)}
.sb-foot{padding:12px 10px;border-top:1px solid rgba(148,163,184,.10)}
.mhdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.96);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.12);position:sticky;top:0;z-index:20;width:100%;max-width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.14)}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:240px;flex:1;min-height:100vh;width:calc(100% - 240px);max-width:calc(100% - 240px)}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1100px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34)}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;height:46px;padding:0 20px;font-size:13px;font-weight:700;box-shadow:0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.26);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-p:hover{transform:translateY(-1px)}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:44px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-s:hover{border-color:rgba(59,130,246,.38);color:#fff}
.inp{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:0 14px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.14)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:7px}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}
.blk-card{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.14);border-radius:16px;padding:14px 16px;margin-bottom:8px;transition:border-color .18s;overflow:hidden}
.blk-card:hover{border-color:rgba(239,68,68,.28)}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
@media(max-width:1023px){
  .sb{display:none!important}
  .main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mhdr{display:flex!important}
  .bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .hdr-row{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .hdr-btns a{flex:1!important;justify-content:center!important}
  .fg2{grid-template-columns:1fr!important}
}
`
export default function Bloqueios(){
  const [perfil,setPerfil]=useState<any>(null)
  const [profissionais,setProfissionais]=useState<any[]>([])
  const [bloqueios,setBloqueios]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [msg,setMsg]=useState('')
  const [salvando,setSalvando]=useState(false)
  const [profId,setProfId]=useState('todos')
  const [data,setData]=useState(new Date().toISOString().split('T')[0])
  const [horaI,setHoraI]=useState('12:00')
  const [horaF,setHoraF]=useState('13:00')
  const [motivo,setMotivo]=useState('Almoço')
  const [motivoCustom,setMotivoCustom]=useState('')
  useEffect(()=>{init()},[])
  async function init(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:profs},{data:blks}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('id,nome').eq('user_id',user.id).order('nome'),
      supabase.from('bloqueios').select('*,profissionais(nome)').eq('user_id',user.id).order('data',{ascending:true}).order('hora_inicio',{ascending:true}),
    ])
    setPerfil(p);setProfissionais(profs||[]);setBloqueios(blks||[]);setLoading(false)
  }
  async function salvar(){
    if(!data||!horaI||!horaF){setMsg('â  Preencha data e horários.');return}
    if(horaF<=horaI){setMsg('â  Hora fim deve ser maior que hora início.');return}
    setSalvando(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSalvando(false);return}
    const mot=motivo==='Outro'?(motivoCustom.trim()||'Indisponível'):motivo
    const {data:novo}=await supabase.from('bloqueios').insert({user_id:user.id,profissional_id:profId==='todos'?null:profId,data,hora_inicio:horaI,hora_fim:horaF,motivo:mot,geral:profId==='todos'}).select('*,profissionais(nome)').single()
    if(novo) setBloqueios(prev=>[...prev,novo].sort((a,b)=>a.data>b.data?1:a.hora_inicio>b.hora_inicio?1:-1))
    limpar();setMsg('Bloqueio adicionado! â');setTimeout(()=>setMsg(''),2500);setSalvando(false)
  }
  async function excluir(id:string){
    await supabase.from('bloqueios').delete().eq('id',id)
    setBloqueios(prev=>prev.filter(b=>b.id!==id))
    setMsg('Removido.');setTimeout(()=>setMsg(''),2000)
  }
  function limpar(){setProfId('todos');setData(new Date().toISOString().split('T')[0]);setHoraI('12:00');setHoraF('13:00');setMotivo('Almoço');setMotivoCustom('')}
  function fmtData(s:string){return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}
  const hoje=new Date().toISOString().split('T')[0]
  const fim7=new Date();fim7.setDate(fim7.getDate()+7)
  const blkHoje=bloqueios.filter(b=>b.data===hoje)
  const blkSem=bloqueios.filter(b=>b.data>=hoje&&b.data<=fim7.toISOString().split('T')[0])
  const profsAf=new Set(bloqueios.filter(b=>b.profissional_id&&b.data>=hoje).map(b=>b.profissional_id)).size
  const nome=perfil?.nome_negocio||''
  const ini=(nome||'B').charAt(0).toUpperCase()
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
  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)
  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drw${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid rgba(148,163,184,.10)'}}>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span>
          <button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>Ã</button>
        </div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{SB_ITEMS.map(it=><Link key={it.l} href={it.h} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}>{it.l}</Link>)}</nav>
      </div>
      <Sb/>
      <div className="main">
        <div className="mhdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            {[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:`${w}px`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Bloqueio de horários</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">
          {msg&&<div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'rgba(239,68,68,.16)',border:'1px solid rgba(239,68,68,.36)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#F87171',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{msg}</div>}
          <div className="hdr-row" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'24px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Bloqueio de horários</h1>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5}}>Bloqueie horários para pausas, folgas, ausÃªncias, manutenção ou indisponibilidades.</p>
            </div>
            <div className="hdr-btns"><Link href="/painel/agendamentos" className="btn-s">â Voltar Ã  agenda</Link></div>
          </div>
          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {l:'Bloqueios hoje',v:blkHoje.length,c:'#F87171',bg:'rgba(239,68,68,.10)',bd:'rgba(239,68,68,.22)',ico:'ð«'},
              {l:'Esta semana',v:blkSem.length,c:'#FBBF24',bg:'rgba(245,158,11,.10)',bd:'rgba(245,158,11,.22)',ico:'ð'},
              {l:'Profissionais afetados',v:profsAf,c:'#22D3EE',bg:'rgba(6,182,212,.10)',bd:'rgba(6,182,212,.22)',ico:'ð¤'},
              {l:'Total cadastrado',v:bloqueios.length,c:'#C4B5FD',bg:'rgba(139,92,246,.10)',bd:'rgba(139,92,246,.22)',ico:'ð'},
            ].map(k=>(
              <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:'16px',padding:'16px',boxSizing:'border-box' as const}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',marginBottom:'8px'}}>{k.ico}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'3px'}}>{k.l}</p>
                <p style={{fontSize:'24px',fontWeight:800,color:k.c,lineHeight:1,letterSpacing:'-0.03em'}}>{k.v}</p>
              </div>
            ))}
          </div>
          {/* Formulário */}
          <div className="crd" style={{padding:'24px',marginBottom:'24px'}}>
            <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Adicionar bloqueio</p>
            <p style={{fontSize:'12px',color:'#64748B',marginBottom:'18px'}}>Bloqueie um horário específico na agenda da equipe.</p>
            {/* Linha 1: Profissional | Data */}
            <div className="fg2">
              <div>
                <label className="lbl">Profissional</label>
                <select className="inp" value={profId} onChange={e=>setProfId(e.target.value)}>
                  <option value="todos">ð¢ Todos os profissionais</option>
                  {profissionais.map((p:any)=><option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="lbl">Data</label>
                <input className="inp" type="date" value={data} onChange={e=>setData(e.target.value)}/>
              </div>
            </div>
            {profId==='todos'&&(
              <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.20)',borderRadius:'10px',marginBottom:'14px'}}>
                <span style={{fontSize:'14px'}}>â </span>
                <p style={{fontSize:'12px',color:'#FBBF24'}}>Este bloqueio será aplicado para toda a equipe.</p>
              </div>
            )}
            {/* Linha 2: Horas */}
            <div className="fg2">
              <div>
                <label className="lbl">Hora início</label>
                <input className="inp" type="time" value={horaI} onChange={e=>setHoraI(e.target.value)}/>
              </div>
              <div>
                <label className="lbl">Hora fim</label>
                <input className="inp" type="time" value={horaF} onChange={e=>setHoraF(e.target.value)}/>
                {horaF&&horaI&&horaF<=horaI&&<p style={{fontSize:'11px',color:'#F87171',marginTop:'5px'}}>â  Hora fim deve ser maior que hora início.</p>}
              </div>
            </div>
            {/* Motivo */}
            <div style={{marginBottom:'20px'}}>
              <label className="lbl">Motivo</label>
              <select className="inp" value={motivo} onChange={e=>setMotivo(e.target.value)} style={{marginBottom:motivo==='Outro'?'8px':'0'}}>
                {MOTIVOS.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
              {motivo==='Outro'&&<input className="inp" type="text" placeholder="Descreva o motivo..." value={motivoCustom} onChange={e=>setMotivoCustom(e.target.value)}/>}
            </div>
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
              <button onClick={salvar} disabled={salvando} className="btn-p" style={{opacity:salvando?.7:1,flex:1,minWidth:'180px',justifyContent:'center'}}>
                {salvando?'Salvando...':'ð« Adicionar bloqueio'}
              </button>
              <button onClick={limpar} className="btn-s">Limpar</button>
            </div>
          </div>
          {/* Lista */}
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Bloqueios cadastrados</p>
              <span style={{fontSize:'12px',color:'#64748B'}}>{bloqueios.length} registro{bloqueios.length!==1?'s':''}</span>
            </div>
            {bloqueios.length===0?(
              <div className="crd" style={{padding:'48px 24px',textAlign:'center'}}>
                <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'rgba(239,68,68,.10)',border:'1.5px solid rgba(239,68,68,.22)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',margin:'0 auto 14px'}}>ð«</div>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'6px'}}>Nenhum bloqueio cadastrado</p>
                <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5,maxWidth:'280px',margin:'0 auto'}}>Adicione bloqueios para impedir agendamentos em horários indisponíveis.</p>
              </div>
            ):(
              bloqueios.map((b:any)=>(
                <div key={b.id} className="blk-card">
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <div style={{width:'40px',height:'40px',borderRadius:'11px',background:'rgba(239,68,68,.12)',border:'1.5px solid rgba(239,68,68,.24)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>
                      {b.geral?'ð¢':'ð¤'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'7px',flexWrap:'wrap',marginBottom:'2px'}}>
                        <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC'}}>{b.profissionais?.nome||'Equipe inteira'}</p>
                        <span style={{fontSize:'10px',fontWeight:600,padding:'2px 7px',borderRadius:'999px',background:b.geral?'rgba(245,158,11,.14)':'rgba(239,68,68,.12)',color:b.geral?'#FBBF24':'#F87171',border:`1px solid ${b.geral?'rgba(245,158,11,.28)':'rgba(239,68,68,.26)'}`}}>{b.geral?'Geral':'Individual'}</span>
                      </div>
                      <p style={{fontSize:'12px',color:'#64748B'}}>ð {fmtData(b.data)} Â· â° {b.hora_inicio} Ã s {b.hora_fim}{b.motivo?` Â· ${b.motivo}`:''}</p>
                    </div>
                    <button onClick={()=>excluir(b.id)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.24)',borderRadius:'8px',padding:'7px 12px',fontSize:'12px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit',transition:'all .15s',flexShrink:0}}
                      onMouseEnter={e=>(e.currentTarget.style.background='rgba(239,68,68,.20)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='rgba(239,68,68,.10)')}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div></div>
      </div>
    </div>
  )
}
