'use client'
import { AvisoAtraso } from '../../components/AcessoGuard'
import { AvisoAtraso } from '../../components/AcessoGuard'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'
const SB=[
  {h:'/painel',l:'Inicio',on:true},{h:'/painel/agendamentos',l:'Agenda'},
  {h:'/painel/clientes',l:'Clientes'},{h:'/painel/orcamentos',l:'Orcamentos'},
  {h:'/painel/cobrancas',l:'Cobrancas'},{h:'/painel/pagamentos',l:'Pagamentos'},
  {h:'/painel/servicos',l:'Servicos'},{h:'/painel/profissionais',l:'Profissionais'},
  {h:'/painel/relatorio',l:'Relatorios'},{h:'/painel/perfil',l:'Configuracoes'},
]
const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
.sb{width:240px;min-height:100vh;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);border-right:1px solid rgba(148,163,184,.14);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.sb-logo{padding:22px 18px 16px;border-bottom:1px solid rgba(148,163,184,.10);display:flex;align-items:center;gap:10px}
.sb-ic{width:30px;height:30px;border-radius:8px;background:${G};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 20px rgba(124,58,237,.5)}
.sb nav{flex:1;padding:10px 8px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:500;color:#94A3B8;transition:all .15s;border:1px solid transparent}
.nl:hover{background:rgba(124,58,237,.10);border-color:rgba(124,58,237,.20);color:#fff}
.nl.on{background:${G};color:#fff;font-weight:700;border-color:rgba(255,255,255,.10);box-shadow:0 0 26px rgba(124,58,237,.34),inset 0 1px 0 rgba(255,255,255,.12)}
.sb-foot{padding:12px 10px;border-top:1px solid rgba(148,163,184,.10)}
.mhdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.96);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.12);position:sticky;top:0;z-index:20;width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.14)}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:240px;flex:1;min-height:100vh;width:calc(100% - 240px);max-width:calc(100% - 240px)}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1200px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;height:46px;padding:0 20px;font-size:13px;font-weight:700;box-shadow:0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.26);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-p:hover{transform:translateY(-1px)}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:44px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-s:hover{border-color:rgba(124,58,237,.38);color:#fff}
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
.atalho-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
.atalho{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:16px;padding:18px 14px;text-decoration:none;display:flex;flex-direction:column;gap:8px;transition:all .18s}
.atalho:hover{border-color:rgba(124,58,237,.32);transform:translateY(-2px)}
.ag-item{background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.14);border-radius:12px;padding:12px 14px;margin-bottom:6px}
@media(max-width:1023px){
  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mhdr{display:flex!important}.bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .atalho-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .hdr-r{flex-direction:column!important;align-items:stretch!important;gap:8px!important}
  .hdr-btns{display:flex!important;gap:8px!important}
  .hdr-btns a{flex:1!important;justify-content:center!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}.atalho-grid{grid-template-columns:1fr 1fr!important}}
`

export default function Home(){
  const [perfil,setPerfil]=useState<any>(null)
  const [agendamentos,setAgendamentos]=useState<any[]>([])
  const [orcamentos,setOrcamentos]=useState<any[]>([])
  const [pagamentos,setPagamentos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [copied,setCopied]=useState(false)

  useEffect(()=>{load()},[])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:ags},{data:orcs},{data:pags}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('agendamentos').select('*').eq('user_id',user.id).order('data_hora'),
      supabase.from('orcamentos').select('*').eq('user_id',user.id),
      supabase.from('pagamentos').select('valor,data').eq('user_id',user.id),
    ])
    setPerfil(p);setAgendamentos(ags||[]);setOrcamentos(orcs||[]);setPagamentos(pags||[]);setLoading(false)
  }

  const hoje=new Date().toISOString().split('T')[0]
  const agsHoje=agendamentos.filter(a=>a.data_hora?.startsWith(hoje))
  const proximos=agendamentos.filter(a=>a.data_hora>new Date().toISOString()&&a.status!=='cancelado').slice(0,5)
  const mesAtual=new Date().toISOString().slice(0,7)
  const recMes=pagamentos.filter(p=>p.data?.startsWith(mesAtual)).reduce((a,p)=>a+(p.valor||0),0)
  const fBRL=(v:number)=>`R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2})}`
  const orcsAbertos=orcamentos.filter(o=>o.status==='aberto'||o.status==='em_andamento').length
  const saldo=orcamentos.filter(o=>o.status!=='pago'&&o.status!=='cancelado').reduce((a,o)=>(o.valor_total||0)-(o.valor_pago||0)+a,0)

  const nome=perfil?.nome_negocio||'seu negocio'
  const slug=perfil?.slug||''
  const ini=(nome||'C').charAt(0).toUpperCase()
  const pubUrl=slug?`${window?.location?.origin}/${slug}`:`${typeof window!=='undefined'?window.location.origin:''}/`

  function copiarLink(){
    navigator.clipboard.writeText(pubUrl)
    setCopied(true);setTimeout(()=>setCopied(false),2000)
  }

  const fmtHora=(s:string)=>new Date(s).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  const fmtData=(s:string)=>new Date(s).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})

  const Sb=()=>(
    <aside className="sb">
      <div className="sb-logo"><div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span></div>
      <nav>{SB.map(it=><Link key={it.l} href={it.h} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot"><div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div><div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div></div></div>
    </aside>
  )

  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drw${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid rgba(148,163,184,.10)'}}><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span><button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>x</button></div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{SB.map(it=><Link key={it.l} href={it.h} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}>{it.l}</Link>)}</nav>
      </div>
      <Sb/>
      <div className="main">
        <div className="mhdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>{[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:`${w}px`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}</button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Inicio</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">
          <AvisoAtraso/>
          
          

          {/* Header */}
          <div className="hdr-r" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'24px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Ola, {nome}!</h1>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5}}>Acompanhe sua agenda, clientes, cobrancas e retornos em um so lugar.</p>
            </div>
            <div className="hdr-btns" style={{display:'flex',gap:'8px',flexShrink:0,flexWrap:'wrap'}}>
              <Link href="/painel/agendamentos/novo" className="btn-p">+ Novo agendamento</Link>
              <Link href="/painel/orcamentos/novo" className="btn-s">+ Novo orcamento</Link>
            </div>
          </div>

          {/* Link publico */}
          {slug&&(
            <div className="crd" style={{padding:'16px 20px',marginBottom:'20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'rgba(34,197,94,.14)',border:'1px solid rgba(34,197,94,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>🔗</div>
                <div><p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',marginBottom:'2px'}}>Sua pagina publica esta ativa</p><p style={{fontSize:'11px',color:'#64748B'}}>Compartilhe o link com seus clientes para receber agendamentos.</p></div>
              </div>
              <div style={{display:'flex',gap:'8px',flexShrink:0}}>
                <a href={pubUrl} target="_blank" rel="noreferrer" className="btn-s" style={{height:'36px',fontSize:'12px'}}>Ver pagina</a>
                <button onClick={copiarLink} className="btn-p" style={{height:'36px',fontSize:'12px'}}>{copied?'Copiado!':'Copiar link'}</button>
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {l:'Atendimentos hoje',v:agsHoje.length,c:'#60A5FA',bg:'rgba(59,130,246,.10)',bd:'rgba(59,130,246,.24)',ico:'📅'},
              {l:'Proximos agendamentos',v:proximos.length,c:'#C4B5FD',bg:'rgba(124,58,237,.10)',bd:'rgba(124,58,237,.24)',ico:'⏰'},
              {l:'Orcamentos em aberto',v:orcsAbertos,c:'#FBBF24',bg:'rgba(245,158,11,.10)',bd:'rgba(245,158,11,.24)',ico:'📋'},
              {l:'Total a receber',v:fBRL(saldo),c:'#F87171',bg:'rgba(239,68,68,.10)',bd:'rgba(239,68,68,.24)',ico:'💳'},
              {l:'Recebido no mes',v:fBRL(recMes),c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.24)',ico:'✓'},
              {l:'Clientes cadastrados',v:'—',c:'#22D3EE',bg:'rgba(6,182,212,.10)',bd:'rgba(6,182,212,.24)',ico:'👥'},
            ].map(k=>(
              <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:'18px',padding:'18px 16px',boxSizing:'border-box' as const}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',marginBottom:'8px'}}>{k.ico}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>{k.l}</p>
                <p style={{fontSize:'22px',fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* Atalhos */}
          <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>Acesso rapido</p>
          <div className="atalho-grid" style={{marginBottom:'24px'}}>
            {[
              {h:'/painel/agendamentos',l:'Agenda',ico:'📅',c:'#60A5FA',bg:'rgba(59,130,246,.10)'},
              {h:'/painel/clientes',l:'Clientes',ico:'👥',c:'#4ADE80',bg:'rgba(34,197,94,.10)'},
              {h:'/painel/orcamentos',l:'Orcamentos',ico:'📋',c:'#FBBF24',bg:'rgba(245,158,11,.10)'},
              {h:'/painel/cobrancas',l:'Cobrancas',ico:'💳',c:'#C4B5FD',bg:'rgba(124,58,237,.10)'},
              {h:'/painel/pagamentos',l:'Pagamentos',ico:'💰',c:'#4ADE80',bg:'rgba(34,197,94,.10)'},
              {h:'/painel/servicos',l:'Servicos',ico:'✂',c:'#22D3EE',bg:'rgba(6,182,212,.10)'},
              {h:'/painel/profissionais',l:'Profissionais',ico:'👤',c:'#C4B5FD',bg:'rgba(124,58,237,.10)'},
              {h:'/painel/relatorio',l:'Relatorios',ico:'📊',c:'#FBBF24',bg:'rgba(245,158,11,.10)'},
            ].map(a=>(
              <Link key={a.h} href={a.h} className="atalho">
                <div style={{width:'34px',height:'34px',borderRadius:'10px',background:a.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{a.ico}</div>
                <p style={{fontSize:'13px',fontWeight:600,color:'#CBD5E1'}}>{a.l}</p>
              </Link>
            ))}
          </div>

          {/* Agenda de hoje */}
          <div style={{marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Agenda de hoje</p>
            <Link href="/painel/agendamentos" style={{fontSize:'12px',color:'#64748B',textDecoration:'none'}}>Ver tudo</Link>
          </div>
          {agsHoje.length===0?(
            <div className="crd" style={{padding:'36px 24px',textAlign:'center',marginBottom:'24px'}}>
              <p style={{fontSize:'28px',marginBottom:'10px'}}>📅</p>
              <p style={{fontSize:'15px',fontWeight:600,color:'#F8FAFC',marginBottom:'5px'}}>Nenhum atendimento hoje</p>
              <p style={{fontSize:'13px',color:'#64748B',marginBottom:'16px'}}>Quando houver horarios marcados, eles aparecerao aqui.</p>
              <Link href="/painel/agendamentos/novo" className="btn-p" style={{display:'inline-flex'}}>+ Novo agendamento</Link>
            </div>
          ):(
            <div style={{marginBottom:'24px'}}>
              {agsHoje.map(a=>(
                <div key={a.id} className="ag-item">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                    <div><p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC'}}>{a.cliente_nome||'—'}</p><p style={{fontSize:'12px',color:'#94A3B8'}}>{fmtHora(a.data_hora)}</p></div>
                    <span style={{fontSize:'11px',fontWeight:600,padding:'3px 10px',borderRadius:'999px',background:'rgba(59,130,246,.14)',color:'#93C5FD',border:'1px solid rgba(59,130,246,.28)'}}>{a.status||'confirmado'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Proximos */}
          {proximos.length>0&&(
            <>
              <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>Proximos agendamentos</p>
              {proximos.map(a=>(
                <div key={a.id} className="ag-item">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                    <div><p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC'}}>{a.cliente_nome||'—'}</p><p style={{fontSize:'12px',color:'#94A3B8'}}>{fmtData(a.data_hora)} - {fmtHora(a.data_hora)}</p></div>
                    <span style={{fontSize:'11px',fontWeight:600,padding:'3px 10px',borderRadius:'999px',background:'rgba(124,58,237,.14)',color:'#C4B5FD',border:'1px solid rgba(124,58,237,.28)'}}>{a.status||'confirmado'}</span>
                  </div>
                </div>
              ))}
            </>
          )}

        </div></div>
      </div>
    </div>
  )
}
