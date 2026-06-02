'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

const SB_ITEMS = [
  {h:'/painel',l:'Inicio'},
  {h:'/painel/agendamentos',l:'Agenda'},
  {h:'/painel/clientes',l:'Clientes'},
  {h:'/painel/orcamentos',l:'Orcamentos'},
  {h:'/painel/cobrancas',l:'Cobrancas'},
  {h:'/painel/pagamentos',l:'Pagamentos'},
  {h:'/painel/servicos',l:'Servicos'},
  {h:'/painel/profissionais',l:'Profissionais'},
  {h:'/painel/relatorio',l:'Relatorios'},
  {h:'/painel/perfil',l:'Configuracoes'},
]

const statusCfg: Record<string,{t:string,bg:string,c:string,bd:string}> = {
  pendente:      {t:'Pendente',       bg:'rgba(245,158,11,.14)',c:'#FCD34D',bd:'rgba(245,158,11,.30)'},
  confirmado:    {t:'Confirmado',     bg:'rgba(34,197,94,.14)', c:'#4ADE80',bd:'rgba(34,197,94,.30)'},
  realizado:     {t:'Realizado',      bg:'rgba(34,197,94,.12)', c:'#22C55E',bd:'rgba(34,197,94,.25)'},
  cancelado:     {t:'Cancelado',      bg:'rgba(239,68,68,.12)', c:'#F87171',bd:'rgba(239,68,68,.28)'},
  retorno:       {t:'Retorno',        bg:'rgba(124,58,237,.14)',c:'#C4B5FD',bd:'rgba(124,58,237,.30)'},
  compareceu:    {t:'Compareceu',     bg:'rgba(34,197,94,.14)', c:'#4ADE80',bd:'rgba(34,197,94,.30)'},
  faltou:        {t:'Faltou',         bg:'rgba(239,68,68,.12)', c:'#F87171',bd:'rgba(239,68,68,.28)'},
  em_atendimento:{t:'Em atendimento', bg:'rgba(59,130,246,.14)',c:'#60A5FA',bd:'rgba(59,130,246,.30)'},
}

function fH(dh:string){return new Date(dh).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function fDataFull(dh:string){return new Date(dh).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})}
function fDataCurta(d:Date){return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
function fTel(t:string){
  if(!t)return ''
  const n=t.replace(/\D/g,'')
  if(n.length===11)return '('+n.slice(0,2)+') '+n.slice(2,7)+'-'+n.slice(7)
  if(n.length===10)return '('+n.slice(0,2)+') '+n.slice(2,6)+'-'+n.slice(6)
  return t
}
function getTelLimpo(a:any){return(a.cliente_whatsapp||a.cliente_telefone||'').replace(/\D/g,'')}

const CSS = \`
'
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
const CSS=\`
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
\`

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
  const fBRL=(v:number)=>\`R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2})}\`
  const orcsAbertos=orcamentos.filter(o=>o.status==='aberto'||o.status==='em_andamento').length
  const saldo=orcamentos.filter(o=>o.status!=='pago'&&o.status!=='cancelado').reduce((a,o)=>(o.valor_total||0)-(o.valor_pago||0)+a,0)

  const nome=perfil?.nome_negocio||'seu negocio'
  const slug=perfil?.slug||''
  const ini=(nome||'C').charAt(0).toUpperCase()
  const pubUrl=slug?\`${window?.location?.origin}/${slug}\`:\`${typeof window!=='undefined'?window.location.origin:''}/\`

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
      <div className={\`ovl${mob?' open':''}\`} onClick={()=>setMob(false)}/>
      <div className={\`drw${mob?' open':''}\`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid rgba(148,163,184,.10)'}}><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span><button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>x</button></div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{SB.map(it=><Link key={it.l} href={it.h} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}>{it.l}</Link>)}</nav>
      </div>
      <Sb/>
      <div className="main">
        <div className="mhdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>{[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:\`${w}px\`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}</button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Inicio</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">
                              
          

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
              <div key={k.l} style={{background:\`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))\`,border:\`1.5px solid ${k.bd}\`,borderRadius:'18px',padding:'18px 16px',boxSizing:'border-box' as const}}>
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
.ag-main{display:grid;grid-template-columns:1fr;gap:18px}
.ag-detalhe{display:none}
@media(min-width:1200px){
  .ag-main{grid-template-columns:1fr 380px}
  .ag-detalhe{display:block;position:sticky;top:24px;height:fit-content}
}
.hdr-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.hdr-top h1{font-size:24px;font-weight:800;color:#F8FAFC;letter-spacing:-0.03em;margin-bottom:4px}
.hdr-sub{font-size:14px;color:#CBD5E1;line-height:1.5}
.hdr-btns{display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap}
.btn-prim{background:${G};color:#fff;border:none;border-radius:12px;padding:0 18px;height:40px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;box-shadow:0 4px 16px rgba(59,130,246,.22);transition:opacity .15s;-webkit-tap-highlight-color:transparent}
.btn-prim:hover{opacity:.9}
.btn-sec2{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;padding:0 16px;height:40px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:all .15s}
.btn-sec2:hover{border-color:rgba(148,163,184,.38);color:#F8FAFC}
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px}
.kpi-card{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.14);border-radius:16px;padding:16px 18px;transition:border-color .15s}
.kpi-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.10em;color:#64748B;margin-bottom:6px}
.kpi-num{font-size:32px;font-weight:900;letter-spacing:-0.04em;line-height:1}
.ctrl-row{display:flex;align-items:center;gap:8px;margin-bottom:18px;flex-wrap:wrap}
.aba-btn{height:36px;padding:0 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.16);background:transparent;color:#64748B;font-family:inherit;transition:all .15s;white-space:nowrap}
.aba-btn.on{background:rgba(59,130,246,.14);border-color:rgba(59,130,246,.35);color:#60A5FA}
.aba-btn:hover:not(.on){color:#94A3B8;border-color:rgba(148,163,184,.28)}
.filtros{display:flex;gap:6px;flex:1;flex-wrap:wrap}
.filt-btn{height:32px;padding:0 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.14);background:transparent;color:#64748B;font-family:inherit;transition:all .15s;white-space:nowrap}
.filt-btn.on{background:rgba(59,130,246,.12);border-color:rgba(59,130,246,.28);color:#60A5FA}
.prof-sel{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:10px;padding:0 12px;height:34px;font-size:12px;color:#CBD5E1;font-family:inherit;cursor:pointer;outline:none;margin-left:auto}
.dia-lbl{font-size:11px;font-weight:700;color:#475569;text-transform:capitalize;margin:16px 0 8px;letter-spacing:.06em;display:flex;align-items:center;gap:8px}
.dia-lbl::after{content:'';flex:1;height:1px;background:rgba(148,163,184,.07)}
.ag-item{background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.13);border-radius:16px;padding:14px 16px;margin-bottom:8px;cursor:pointer;transition:all .15s}
.ag-item:hover{border-color:rgba(148,163,184,.26)}
.ag-item.sel{border-color:rgba(59,130,246,.55);background:radial-gradient(circle at top left,rgba(59,130,246,.08),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))}
.ag-row1{display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap}
.ag-hora{display:inline-flex;background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.22);border-radius:8px;padding:4px 10px;font-size:14px;font-weight:800;color:#60A5FA;flex-shrink:0}
.ag-nome{font-size:14px;font-weight:800;color:#F8FAFC;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.st-badge{font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;white-space:nowrap;flex-shrink:0;line-height:18px}
.ag-tel{font-size:12px;color:#CBD5E1;margin-bottom:4px}
.ag-sub{font-size:12px;color:#94A3B8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:8px}
.ag-mini-btns{display:flex;gap:5px;flex-wrap:wrap}
.mini-btn{border-radius:8px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid;font-family:inherit;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;gap:3px;transition:opacity .15s}
.mini-btn:hover{opacity:.8}
.menu-rel{position:relative;display:inline-block}
.menu-drop{position:absolute;top:calc(100% + 6px);left:0;background:rgba(10,15,25,.98);border:1px solid rgba(148,163,184,.20);border-radius:14px;padding:8px;min-width:170px;z-index:50;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.menu-item{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;color:#CBD5E1;border:none;background:none;font-family:inherit;width:100%;text-align:left;white-space:nowrap;transition:background .1s}
.menu-item:hover{background:rgba(255,255,255,.06)}
.det-card{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.14);border-radius:20px;padding:22px}
.det-avatar{width:56px;height:56px;border-radius:50%;background:${G};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;margin:0 auto 14px;box-shadow:0 0 20px rgba(59,130,246,.22)}
.det-nome{font-size:18px;font-weight:800;color:#F8FAFC;text-align:center;margin-bottom:4px}
.det-sec{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(148,163,184,.07)}
.det-sec:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.det-sec-t{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.10em;color:#475569;margin-bottom:10px}
.det-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}
.det-lbl{font-size:12px;color:#64748B}
.det-val{font-size:12px;font-weight:700;color:#F8FAFC;text-align:right;max-width:60%}
.det-btns{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}
.det-btn{border-radius:10px;padding:9px 10px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid;font-family:inherit;white-space:nowrap;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:4px;transition:opacity .15s}
.det-btn:hover{opacity:.85}
.det-btn-full{grid-column:1/-1}
.vazio-card{text-align:center;padding:50px 20px;background:linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.10);border-radius:18px}
.toast-ag{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,.97);border:1px solid rgba(59,130,246,.30);border-radius:12px;padding:12px 24px;font-size:13px;font-weight:600;color:#F8FAFC;z-index:200;box-shadow:0 8px 32px rgba(0,0,0,.5);pointer-events:none;white-space:nowrap}
.sem-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px}
.sem-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.sem-col{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.10);border-radius:12px;overflow:hidden;min-height:130px}
.sem-hdr{padding:8px 6px;text-align:center;font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;border-bottom:1px solid rgba(148,163,184,.07);background:rgba(59,130,246,.04)}
.sem-hdr.hj{color:#60A5FA;background:rgba(59,130,246,.14)}
.sem-data{font-size:14px;font-weight:800;color:#F8FAFC;margin-top:2px}
.sem-item{background:rgba(59,130,246,.10);border-radius:6px;padding:4px 6px;margin:4px;font-size:10px;color:#93C5FD;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid rgba(59,130,246,.15);line-height:1.5}
.sem-mob-dia{margin-bottom:16px}
.sem-mob-hdr{font-size:12px;font-weight:700;margin-bottom:8px;text-transform:capitalize;padding-bottom:6px;border-bottom:1px solid rgba(59,130,246,.12)}
.sem-mob-item{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.12);border-radius:12px;padding:12px 14px;margin-bottom:6px;display:flex;gap:12px;align-items:center}
.sem-mob-hora{font-size:13px;font-weight:800;color:#60A5FA;flex-shrink:0;min-width:42px}
.sem-mob-info{min-width:0;flex:1}
.sem-mob-nome{font-size:13px;font-weight:700;color:#F8FAFC;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sem-mob-sub{font-size:11px;color:#94A3B8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(max-width:768px){
  .bdy{padding:16px 14px}
  .hdr-top h1{font-size:20px}
  .hdr-top{gap:10px}
  .hdr-btns{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .hdr-btns a,.hdr-btns button{width:100%;justify-content:center}
  .kpi-grid{gap:8px}
  .kpi-card{padding:12px 10px}
  .kpi-num{font-size:24px}
  .kpi-lbl{font-size:9px}
  .filtros{overflow-x:auto;flex-wrap:nowrap;padding-bottom:2px}
  .filtros::-webkit-scrollbar{display:none}
  .prof-sel{margin-left:0;width:100%}
  .sem-grid{display:none}
}
@media(min-width:769px){.sem-mob{display:none}}
@media(max-width:960px){.kpi-grid{grid-template-columns:repeat(3,1fr)}}
\`

export default function Agendamentos() {
  const pathname = usePathname()
  const [perfil, setPerfil] = useState<any>(null)
  const [profs, setProfs] = useState<any[]>([])
  const [ags, setAgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mob, setMob] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [view, setView] = useState<'hoje'|'semana'>('hoje')
  const [fSt, setFSt] = useState('todos')
  const [fPr, setFPr] = useState('todos')
  const [semOff, setSemOff] = useState(0)
  const [msg, setMsg] = useState('')
  const [sel, setSel] = useState<any>(null)
  const [menuId, setMenuId] = useState<string|null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const hoje = new Date().toISOString().split('T')[0]

  useEffect(()=>{
    load()
    const chk=()=>setMob(window.innerWidth<768)
    chk(); window.addEventListener('resize',chk)
    return()=>window.removeEventListener('resize',chk)
  },[])

  useEffect(()=>{
    function fechar(e:MouseEvent){
      if(menuRef.current&&!menuRef.current.contains(e.target as Node))setMenuId(null)
    }
    document.addEventListener('mousedown',fechar)
    return()=>document.removeEventListener('mousedown',fechar)
  },[])

  async function load(){
    const{data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const{data:p}=await supabase.from('perfis').select('*').eq('user_id',user.id).single()
    setPerfil(p)
    const{data:pr}=await supabase.from('profissionais').select('*').eq('user_id',user.id)
    setProfs(pr||[])
    const fim=new Date();fim.setDate(fim.getDate()+60)
    const atas=new Date();atas.setDate(atas.getDate()-30)
    const{data:a}=await supabase.from('agendamentos')
      .select('*,servicos(nome,preco),profissionais(nome)')
      .eq('user_id',user.id)
      .gte('data_hora',atas.toISOString())
      .lte('data_hora',fim.toISOString())
      .order('data_hora',{ascending:true})
    setAgs(a||[])
    setLoading(false)
  }

  function toast(m:string){setMsg(m);setTimeout(()=>setMsg(''),2500)}

  async function atualizarStatus(id:string,status:string){
    await supabase.from('agendamentos').update({status}).eq('id',id)
    setAgs(prev=>prev.map(a=>a.id===id?{...a,status}:a))
    if(sel?.id===id)setSel((s:any)=>({...s,status}))
    setMenuId(null)
    toast('Status atualizado!')
  }

  function wppLink(a:any,tipo:'confirmar'|'lembrete'|'contato'){
    const tel=getTelLimpo(a)
    if(!tel)return null
    const d=new Date(a.data_hora)
    const dt=d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})
    const hr=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    let txt=''
    if(tipo==='confirmar')txt='Ola, '+a.cliente_nome+'! Seu agendamento foi confirmado.\n\nServico: '+(a.servicos?.nome||'')+'\nProfissional: '+(a.profissionais?.nome||'')+'\nData: '+dt+'\nHorario: '+hr+'\n\n'+(perfil?.nome_negocio||'')
    else if(tipo==='lembrete')txt='Ola, '+a.cliente_nome+'! Passando para lembrar do seu agendamento.\n\nServico: '+(a.servicos?.nome||'')+'\nData: '+dt+'\nHorario: '+hr+'\n\nTe esperamos!\n'+(perfil?.nome_negocio||'')
    else txt='Ola, '+a.cliente_nome+'! Tudo bem?'
    return 'https://wa.me/55'+tel+'?text='+encodeURIComponent(txt)
  }

  async function copiarContato(a:any){
    const tel=a.cliente_whatsapp||a.cliente_telefone||''
    if(!tel){toast('Telefone nao informado');return}
    try{await navigator.clipboard.writeText(tel);toast('Contato copiado!')}
    catch{toast('Nao foi possivel copiar')}
    setMenuId(null)
  }

  const agsHoje=ags.filter(a=>new Date(a.data_hora).toISOString().split('T')[0]===hoje)
  const confirmados=agsHoje.filter(a=>a.status==='confirmado').length
  const pendentes=agsHoje.filter(a=>!a.status||a.status==='pendente').length

  const agsFiltrados=ags.filter(a=>{
    const d=new Date(a.data_hora).toISOString().split('T')[0]
    if(view==='hoje'&&d!==hoje)return false
    if(fSt!=='todos'&&a.status!==fSt)return false
    if(fPr!=='todos'&&a.profissional_id!==fPr)return false
    return true
  })

  useEffect(()=>{
    if(agsFiltrados.length>0&&!sel)setSel(agsFiltrados[0])
    if(agsFiltrados.length===0)setSel(null)
  },[agsFiltrados.length,view,fSt,fPr])

  function getInicioSemana(off:number){
    const d=new Date();d.setHours(0,0,0,0)
    d.setDate(d.getDate()-d.getDay()+off*7)
    return d
  }
  const inicioSem=getInicioSemana(semOff)
  const diasSem=Array.from({length:7},(_,i)=>{const d=new Date(inicioSem);d.setDate(inicioSem.getDate()+i);return d})

  function PainelDetalhe(){
    if(!sel)return(
      <div className="det-card">
        <div style={{textAlign:'center',padding:'48px 16px'}}>
          <div style={{fontSize:'36px',marginBottom:'14px',opacity:.25}}>📋</div>
          <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>Selecione um agendamento</p>
          <p style={{fontSize:'13px',color:'#475569',lineHeight:1.6}}>Clique em um atendimento da lista para visualizar detalhes e acoes rapidas.</p>
        </div>
      </div>
    )
    const sc=statusCfg[sel.status]||statusCfg.pendente
    const telFmt=fTel(sel.cliente_whatsapp||sel.cliente_telefone||'')
    const wppC=wppLink(sel,'confirmar')
    const wppL=wppLink(sel,'lembrete')
    const wppW=wppLink(sel,'contato')
    return(
      <div className="det-card">
        <p className="det-sec-t" style={{marginBottom:'16px'}}>Detalhes do agendamento</p>
        <div className="det-avatar">{(sel.cliente_nome||'C').charAt(0).toUpperCase()}</div>
        <p className="det-nome">{sel.cliente_nome||'Cliente sem nome'}</p>
        <div style={{textAlign:'center',marginBottom:'18px'}}>
          <span className="st-badge" style={{background:sc.bg,color:sc.c,border:\`1px solid ${sc.bd}\`}}>{sc.t}</span>
        </div>
        <div className="det-sec">
          <p className="det-sec-t">Contato</p>
          <div className="det-row"><span className="det-lbl">WhatsApp</span><span className="det-val" style={{color:'#CBD5E1'}}>{telFmt||'Nao informado'}</span></div>
          <div className="det-btns">
            {wppW
              ?<a href={wppW} target="_blank" rel="noreferrer" className="det-btn det-btn-full" style={{background:'rgba(37,211,102,.12)',borderColor:'rgba(37,211,102,.25)',color:'#25D366'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Abrir WhatsApp
              </a>
              :<button disabled className="det-btn det-btn-full" style={{background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.10)',color:'#334155',cursor:'not-allowed'}}>Sem telefone</button>
            }
            <button onClick={()=>copiarContato(sel)} className="det-btn det-btn-full" style={{background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.14)',color:'#94A3B8'}}>
              📋 Copiar contato
            </button>
          </div>
        </div>
        <div className="det-sec">
          <p className="det-sec-t">Atendimento</p>
          <div className="det-row"><span className="det-lbl">Servico</span><span className="det-val">{sel.servicos?.nome||'Nao informado'}</span></div>
          <div className="det-row"><span className="det-lbl">Profissional</span><span className="det-val">{sel.profissionais?.nome||'Nao informado'}</span></div>
          <div className="det-row"><span className="det-lbl">Data</span><span className="det-val" style={{fontSize:'11px'}}>{fDataFull(sel.data_hora)}</span></div>
          <div className="det-row"><span className="det-lbl">Horario</span><span className="det-val" style={{color:'#60A5FA'}}>{fH(sel.data_hora)}</span></div>
          {sel.servicos?.preco&&<div className="det-row"><span className="det-lbl">Valor</span><span className="det-val" style={{color:'#22C55E'}}>R$ {sel.servicos.preco}</span></div>}
        </div>
        <div className="det-sec">
          <p className="det-sec-t">Acoes rapidas</p>
          <div className="det-btns">
            {wppC&&(sel.status==='pendente'||!sel.status||sel.status==='retorno')&&<a href={wppC} target="_blank" rel="noreferrer" className="det-btn" style={{background:'rgba(34,197,94,.12)',borderColor:'rgba(34,197,94,.25)',color:'#22C55E'}}>✓ Confirmar</a>}
            {wppL&&<a href={wppL} target="_blank" rel="noreferrer" className="det-btn" style={{background:'rgba(245,158,11,.10)',borderColor:'rgba(245,158,11,.22)',color:'#FCD34D'}}>🔔 Lembrete</a>}
            {sel.status!=='compareceu'&&<button onClick={()=>atualizarStatus(sel.id,'compareceu')} className="det-btn" style={{background:'rgba(34,197,94,.10)',borderColor:'rgba(34,197,94,.20)',color:'#4ADE80'}}>✓ Compareceu</button>}
            {sel.status!=='faltou'&&<button onClick={()=>atualizarStatus(sel.id,'faltou')} className="det-btn" style={{background:'rgba(239,68,68,.08)',borderColor:'rgba(239,68,68,.18)',color:'#F87171'}}>✗ Faltou</button>}
            {sel.status!=='realizado'&&<button onClick={()=>atualizarStatus(sel.id,'realizado')} className="det-btn" style={{background:'rgba(34,197,94,.08)',borderColor:'rgba(34,197,94,.16)',color:'#22C55E'}}>★ Realizado</button>}
            {sel.status!=='retorno'&&<button onClick={()=>atualizarStatus(sel.id,'retorno')} className="det-btn" style={{background:'rgba(124,58,237,.10)',borderColor:'rgba(124,58,237,.22)',color:'#C4B5FD'}}>↩ Retorno</button>}
            {sel.status!=='cancelado'&&<button onClick={()=>atualizarStatus(sel.id,'cancelado')} className="det-btn" style={{background:'rgba(239,68,68,.06)',borderColor:'rgba(239,68,68,.14)',color:'#F87171'}}>✕ Cancelar</button>}
          </div>
        </div>
      </div>
    )
  }

  if(loading)return(
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#475569',fontSize:'14px'}}>Carregando...</p>
    </div>
  )

  const ini=perfil?.nome_negocio?.charAt(0)?.toUpperCase()||'N'

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflow:'hidden'}}>
      <style>{CSS}</style>
      {msg&&<div className="toast-ag">{msg}</div>}

      {/* SIDEBAR */}
      <aside className="sb">
      <div className="sb-logo"><div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span></div>
      <nav>{SB.map(it=><Link key={it.l} href={it.h} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot"><div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div><div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div></div></div>
    </aside>

      {/* MOBILE OVERLAY */}
      {mob&&menuOpen&&<div onClick={()=>setMenuOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:40,backdropFilter:'blur(4px)'}}/>}

      {/* CONTENT */}
      <div className="pg" style={{flex:1,minWidth:0,overflowY:'auto'}}>
        <div className="bdy">
          {/* Header */}
          <div className="hdr-top">
            <div>
              <h1>Agenda</h1>
              <p className="hdr-sub">Veja seus horarios, confirme clientes e acompanhe os atendimentos do dia.</p>
            </div>
            <div className="hdr-btns">
              <Link href="/painel/agendamentos/novo" className="btn-prim">+ Novo agendamento</Link>
              <button className="btn-sec2" onClick={()=>toast('Funcao de bloqueio em breve!')}>🚫 Bloquear horario</button>
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card" style={{borderColor:'rgba(59,130,246,.22)'}}>
              <p className="kpi-lbl">Hoje</p>
              <p className="kpi-num" style={{color:'#60A5FA'}}>{agsHoje.length}</p>
            </div>
            <div className="kpi-card" style={{borderColor:'rgba(34,197,94,.20)'}}>
              <p className="kpi-lbl">Confirmados</p>
              <p className="kpi-num" style={{color:'#4ADE80'}}>{confirmados}</p>
            </div>
            <div className="kpi-card" style={{borderColor:'rgba(245,158,11,.20)'}}>
              <p className="kpi-lbl">Pendentes</p>
              <p className="kpi-num" style={{color:'#FCD34D'}}>{pendentes}</p>
            </div>
          </div>

          {/* Controles */}
          <div className="ctrl-row">
            <button className={'aba-btn'+(view==='hoje'?' on':'')} onClick={()=>setView('hoje')}>Hoje</button>
            <button className={'aba-btn'+(view==='semana'?' on':'')} onClick={()=>setView('semana')}>Semana</button>
            {view==='hoje'&&(
              <div className="filtros">
                {['todos','pendente','confirmado','realizado','cancelado'].map(f=>(
                  <button key={f} className={'filt-btn'+(fSt===f?' on':'')} onClick={()=>setFSt(f)}>
                    {f==='todos'?'Todos':statusCfg[f]?.t||f}
                  </button>
                ))}
              </div>
            )}
            <select className="prof-sel" value={fPr} onChange={e=>setFPr(e.target.value)}>
              <option value="todos">Todos profissionais</option>
              {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          {/* ABA HOJE */}
          {view==='hoje'&&(
            <div className="ag-main">
              <div>
                <p className="dia-lbl">Proximos atendimentos de hoje</p>
                {agsFiltrados.length===0?(
                  <div className="vazio-card">
                    <div style={{fontSize:'32px',marginBottom:'12px',opacity:.3}}>📅</div>
                    <h3 style={{fontSize:'16px',fontWeight:800,color:'#F8FAFC',marginBottom:'8px'}}>Nenhum atendimento para hoje</h3>
                    <p style={{fontSize:'13px',color:'#64748B',marginBottom:'20px',lineHeight:1.6}}>Quando seus clientes agendarem, os horarios aparecerao aqui.</p>
                    <Link href="/painel/agendamentos/novo" className="btn-prim" style={{display:'inline-flex'}}>+ Novo agendamento</Link>
                  </div>
                ):agsFiltrados.map(a=>{
                  const sc=statusCfg[a.status]||statusCfg.pendente
                  const telFmt=fTel(a.cliente_whatsapp||a.cliente_telefone||'')
                  const isSel=sel?.id===a.id
                  const wppC=wppLink(a,'confirmar')
                  const wppW=wppLink(a,'contato')
                  return(
                    <div key={a.id} className={'ag-item'+(isSel?' sel':'')} onClick={()=>setSel(a)}>
                      <div className="ag-row1">
                        <span className="ag-hora">{fH(a.data_hora)}</span>
                        <span className="ag-nome">{a.cliente_nome||'—'}</span>
                        <span className="st-badge" style={{background:sc.bg,color:sc.c,border:\`1px solid ${sc.bd}\`}}>{sc.t}</span>
                      </div>
                      {telFmt&&<p className="ag-tel">📱 {telFmt}</p>}
                      <p className="ag-sub">
                        {a.servicos?.nome||'Servico nao informado'}
                        {a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}
                        {a.servicos?.preco?<span style={{color:'#22C55E'}}> · R$ {a.servicos.preco}</span>:null}
                      </p>
                      <div className="ag-mini-btns" onClick={e=>e.stopPropagation()}>
                        {wppW&&<a href={wppW} target="_blank" rel="noreferrer" className="mini-btn" style={{background:'rgba(37,211,102,.10)',borderColor:'rgba(37,211,102,.22)',color:'#25D366'}}>WhatsApp</a>}
                        {wppC&&(a.status==='pendente'||!a.status)&&<a href={wppC} target="_blank" rel="noreferrer" className="mini-btn" style={{background:'rgba(34,197,94,.10)',borderColor:'rgba(34,197,94,.22)',color:'#22C55E'}}>✓ Confirmar</a>}
                        <div className="menu-rel" ref={menuId===a.id?menuRef:undefined}>
                          <button className="mini-btn" style={{background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.16)',color:'#64748B'}} onClick={()=>setMenuId(menuId===a.id?null:a.id)}>··· Mais</button>
                          {menuId===a.id&&(
                            <div className="menu-drop">
                              <button className="menu-item" onClick={()=>copiarContato(a)}>📋 Copiar contato</button>
                              {a.status!=='compareceu'&&<button className="menu-item" onClick={()=>atualizarStatus(a.id,'compareceu')}><span style={{color:'#4ADE80'}}>✓</span> Compareceu</button>}
                              {a.status!=='faltou'&&<button className="menu-item" onClick={()=>atualizarStatus(a.id,'faltou')}><span style={{color:'#F87171'}}>✗</span> Faltou</button>}
                              {a.status!=='realizado'&&<button className="menu-item" onClick={()=>atualizarStatus(a.id,'realizado')}><span style={{color:'#22C55E'}}>★</span> Realizado</button>}
                              {a.status!=='retorno'&&<button className="menu-item" onClick={()=>atualizarStatus(a.id,'retorno')}><span style={{color:'#C4B5FD'}}>↩</span> Retorno</button>}
                              {a.status!=='confirmado'&&<button className="menu-item" onClick={()=>atualizarStatus(a.id,'confirmado')}><span style={{color:'#4ADE80'}}>✓</span> Confirmado</button>}
                              {a.status!=='cancelado'&&<button className="menu-item" onClick={()=>atualizarStatus(a.id,'cancelado')}><span style={{color:'#F87171'}}>✕</span> Cancelar</button>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="ag-detalhe">
                <PainelDetalhe/>
              </div>
            </div>
          )}

          {/* ABA SEMANA */}
          {view==='semana'&&(
            <div>
              <div className="sem-nav">
                <p style={{fontSize:'14px',fontWeight:700,color:'#CBD5E1'}}>{fDataCurta(diasSem[0])} - {fDataCurta(diasSem[6])} {diasSem[6].getFullYear()}</p>
                <div style={{display:'flex',gap:'8px'}}>
                  <button className="btn-sec2" style={{height:'34px',padding:'0 14px',fontSize:'12px'}} onClick={()=>setSemOff(s=>s-1)}>‹ Anterior</button>
                  <button className="btn-sec2" style={{height:'34px',padding:'0 14px',fontSize:'12px'}} onClick={()=>setSemOff(0)}>Hoje</button>
                  <button className="btn-sec2" style={{height:'34px',padding:'0 14px',fontSize:'12px'}} onClick={()=>setSemOff(s=>s+1)}>Proxima ›</button>
                </div>
              </div>
              <div className="sem-grid">
                {diasSem.map((d,i)=>{
                  const dStr=d.toISOString().split('T')[0]
                  const ehHoje=dStr===hoje
                  const itens=ags.filter(a=>{
                    const ad=new Date(a.data_hora).toISOString().split('T')[0]
                    return ad===dStr&&(fPr==='todos'||a.profissional_id===fPr)
                  })
                  return(
                    <div key={i} className="sem-col">
                      <div className={'sem-hdr'+(ehHoje?' hj':'')}>
                        <div>{['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][d.getDay()]}</div>
                        <div className="sem-data">{d.getDate()}</div>
                      </div>
                      {itens.map(a=>(
                        <div key={a.id} className="sem-item" onClick={()=>{setSel(a);setView('hoje')}} title={a.cliente_nome+' '+fH(a.data_hora)}>
                          {fH(a.data_hora)} {(a.cliente_nome||'').split(' ')[0]}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
              <div className="sem-mob">
                {diasSem.map((d,i)=>{
                  const dStr=d.toISOString().split('T')[0]
                  const ehHoje=dStr===hoje
                  const itens=ags.filter(a=>{
                    const ad=new Date(a.data_hora).toISOString().split('T')[0]
                    return ad===dStr&&(fPr==='todos'||a.profissional_id===fPr)
                  })
                  return(
                    <div key={i} className="sem-mob-dia">
                      <p className="sem-mob-hdr" style={{color:ehHoje?'#60A5FA':'#94A3B8'}}>
                        {d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})}
                        {ehHoje?' · Hoje':''}
                      </p>
                      {itens.length===0?<p style={{fontSize:'12px',color:'#334155',padding:'8px 0'}}>Nenhum atendimento</p>:itens.map(a=>(
                        <div key={a.id} className="sem-mob-item">
                          <span className="sem-mob-hora">{fH(a.data_hora)}</span>
                          <div className="sem-mob-info">
                            <p className="sem-mob-nome">{a.cliente_nome||'—'}</p>
                            <p className="sem-mob-sub">{a.servicos?.nome||''}{a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}</p>
                          </div>
                          <span className="st-badge" style={{fontSize:'9px',padding:'2px 7px',background:(statusCfg[a.status]||statusCfg.pendente).bg,color:(statusCfg[a.status]||statusCfg.pendente).c,border:\`1px solid ${(statusCfg[a.status]||statusCfg.pendente).bd}\`}}>
                            {(statusCfg[a.status]||statusCfg.pendente).t}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
