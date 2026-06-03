se client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'
const SB = [
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

const stCfg: Record<string,{t:string,bg:string,c:string,bd:string}> = {
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
function fDF(dh:string){return new Date(dh).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})}
function fDC(d:Date){return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
function fTel(t:string){
  if(!t)return ''
  const n=t.replace(/\D/g,'')
  if(n.length===11)return '('+n.slice(0,2)+') '+n.slice(2,7)+'-'+n.slice(7)
  if(n.length===10)return '('+n.slice(0,2)+') '+n.slice(2,6)+'-'+n.slice(6)
  return t
}
function gTel(a:any){return(a.cliente_whatsapp||a.cliente_telefone||'').replace(/\D/g,'')}

export default function Agendamentos(){
  const [perfil,setPerfil]=useState<any>(null)
  const [profs,setProfs]=useState<any[]>([])
  const [ags,setAgs]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [mopen,setMopen]=useState(false)
  const [view,setView]=useState<'hoje'|'semana'>('hoje')
  const [fSt,setFSt]=useState('todos')
  const [fPr,setFPr]=useState('todos')
  const [semOff,setSemOff]=useState(0)
  const [msg,setMsg]=useState('')
  const [sel,setSel]=useState<any>(null)
  const [mnu,setMnu]=useState<string|null>(null)
  const mnuRef=useRef<HTMLDivElement>(null)
  const hoje=new Date().toISOString().split('T')[0]

  useEffect(()=>{
    load()
    const chk=()=>setMob(window.innerWidth<768)
    chk();window.addEventListener('resize',chk)
    return()=>window.removeEventListener('resize',chk)
  },[])

  useEffect(()=>{
    function fc(e:MouseEvent){if(mnuRef.current&&!mnuRef.current.contains(e.target as Node))setMnu(null)}
    document.addEventListener('mousedown',fc)
    return()=>document.removeEventListener('mousedown',fc)
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

  async function updSt(id:string,status:string){
    await supabase.from('agendamentos').update({status}).eq('id',id)
    setAgs(p=>p.map(a=>a.id===id?{...a,status}:a))
    if(sel?.id===id)setSel((s:any)=>({...s,status}))
    setMnu(null);toast('Status atualizado!')
  }

  function wpp(a:any,tipo:'c'|'l'|'w'){
    const tel=gTel(a);if(!tel)return null
    const d=new Date(a.data_hora)
    const dt=d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})
    const hr=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    let t=''
    if(tipo==='c')t='Ola, '+a.cliente_nome+'! Seu agendamento foi confirmado.\n\nServico: '+(a.servicos?.nome||'')+'\nProfissional: '+(a.profissionais?.nome||'')+'\nData: '+dt+'\nHorario: '+hr+'\n\n'+(perfil?.nome_negocio||'')
    else if(tipo==='l')t='Ola, '+a.cliente_nome+'! Passando para lembrar do seu agendamento.\n\nServico: '+(a.servicos?.nome||'')+'\nData: '+dt+'\nHorario: '+hr+'\n\nTe esperamos!\n'+(perfil?.nome_negocio||'')
    else t='Ola, '+a.cliente_nome+'!'
    return 'https://wa.me/55'+tel+'?text='+encodeURIComponent(t)
  }

  async function copiar(a:any){
    const tel=a.cliente_whatsapp||a.cliente_telefone||''
    if(!tel){toast('Telefone nao informado');return}
    try{await navigator.clipboard.writeText(tel);toast('Contato copiado!')}
    catch{toast('Nao foi possivel copiar')}
    setMnu(null)
  }

  const agsHj=ags.filter(a=>new Date(a.data_hora).toISOString().split('T')[0]===hoje)
  const conf=agsHj.filter(a=>a.status==='confirmado').length
  const pend=agsHj.filter(a=>!a.status||a.status==='pendente').length

  const agsF=ags.filter(a=>{
    const d=new Date(a.data_hora).toISOString().split('T')[0]
    if(view==='hoje'&&d!==hoje)return false
    if(fSt!=='todos'&&a.status!==fSt)return false
    if(fPr!=='todos'&&a.profissional_id!==fPr)return false
    return true
  })

  useEffect(()=>{
    if(agsF.length>0&&!sel)setSel(agsF[0])
    if(agsF.length===0)setSel(null)
  },[agsF.length,view,fSt,fPr])

  function gIS(off:number){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay()+off*7);return d}
  const iS=gIS(semOff)
  const dS=Array.from({length:7},(_,i)=>{const d=new Date(iS);d.setDate(iS.getDate()+i);return d})

  function Det(){
    if(!sel)return(
      <div className="det-ag">
        <div style={{textAlign:'center',padding:'48px 16px'}}>
          <div style={{fontSize:'36px',marginBottom:'14px',opacity:.25}}>📋</div>
          <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>Selecione um agendamento</p>
          <p style={{fontSize:'13px',color:'#475569',lineHeight:1.6}}>Clique em um atendimento para ver detalhes e acoes.</p>
        </div>
      </div>
    )
    const sc=stCfg[sel.status]||stCfg.pendente
    const tf=fTel(sel.cliente_whatsapp||sel.cliente_telefone||'')
    const wC=wpp(sel,'c'),wL=wpp(sel,'l'),wW=wpp(sel,'w')
    return(
      <div className="det-ag">
        <p className="det-st" style={{marginBottom:'16px'}}>Detalhes do agendamento</p>
        <div className="det-av">{(sel.cliente_nome||'C').charAt(0).toUpperCase()}</div>
        <p className="det-nm">{sel.cliente_nome||'Cliente sem nome'}</p>
        <div style={{textAlign:'center',marginBottom:'18px'}}>
          <span className="st-ag" style={{background:sc.bg,color:sc.c,border:'1px solid '+sc.bd}}>{sc.t}</span>
        </div>
        <div className="det-sc">
          <p className="det-st">Contato</p>
          <div className="det-rw"><span className="det-lb">WhatsApp</span><span className="det-vl" style={{color:'#CBD5E1'}}>{tf||'Nao informado'}</span></div>
          <div className="det-bs">
            {wW?<a href={wW} target="_blank" rel="noreferrer" className="det-b det-bf" style={{background:'rgba(37,211,102,.12)',borderColor:'rgba(37,211,102,.25)',color:'#25D366'}}>Abrir WhatsApp</a>
              :<button disabled className="det-b det-bf" style={{background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.10)',color:'#334155',cursor:'not-allowed'}}>Sem telefone</button>}
            <button onClick={()=>copiar(sel)} className="det-b det-bf" style={{background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.14)',color:'#94A3B8'}}>Copiar contato</button>
          </div>
        </div>
        <div className="det-sc">
          <p className="det-st">Atendimento</p>
          <div className="det-rw"><span className="det-lb">Servico</span><span className="det-vl">{sel.servicos?.nome||'Nao informado'}</span></div>
          <div className="det-rw"><span className="det-lb">Profissional</span><span className="det-vl">{sel.profissionais?.nome||'Nao informado'}</span></div>
          <div className="det-rw"><span className="det-lb">Data</span><span className="det-vl" style={{fontSize:'11px'}}>{fDF(sel.data_hora)}</span></div>
          <div className="det-rw"><span className="det-lb">Horario</span><span className="det-vl" style={{color:'#60A5FA'}}>{fH(sel.data_hora)}</span></div>
          {sel.servicos?.preco&&<div className="det-rw"><span className="det-lb">Valor</span><span className="det-vl" style={{color:'#22C55E'}}>R$ {sel.servicos.preco}</span></div>}
        </div>
        <div className="det-sc">
          <p className="det-st">Acoes rapidas</p>
          <div className="det-bs">
            {wC&&(sel.status==='pendente'||!sel.status||sel.status==='retorno')&&<a href={wC} target="_blank" rel="noreferrer" className="det-b" style={{background:'rgba(34,197,94,.12)',borderColor:'rgba(34,197,94,.25)',color:'#22C55E'}}>Confirmar</a>}
            {wL&&<a href={wL} target="_blank" rel="noreferrer" className="det-b" style={{background:'rgba(245,158,11,.10)',borderColor:'rgba(245,158,11,.22)',color:'#FCD34D'}}>Lembrete</a>}
            {sel.status!=='compareceu'&&<button onClick={()=>updSt(sel.id,'compareceu')} className="det-b" style={{background:'rgba(34,197,94,.10)',borderColor:'rgba(34,197,94,.20)',color:'#4ADE80'}}>Compareceu</button>}
            {sel.status!=='faltou'&&<button onClick={()=>updSt(sel.id,'faltou')} className="det-b" style={{background:'rgba(239,68,68,.08)',borderColor:'rgba(239,68,68,.18)',color:'#F87171'}}>Faltou</button>}
            {sel.status!=='realizado'&&<button onClick={()=>updSt(sel.id,'realizado')} className="det-b" style={{background:'rgba(34,197,94,.08)',borderColor:'rgba(34,197,94,.16)',color:'#22C55E'}}>Realizado</button>}
            {sel.status!=='retorno'&&<button onClick={()=>updSt(sel.id,'retorno')} className="det-b" style={{background:'rgba(124,58,237,.10)',borderColor:'rgba(124,58,237,.22)',color:'#C4B5FD'}}>Retorno</button>}
            {sel.status!=='cancelado'&&<button onClick={()=>updSt(sel.id,'cancelado')} className="det-b" style={{background:'rgba(239,68,68,.06)',borderColor:'rgba(239,68,68,.14)',color:'#F87171'}}>Cancelar</button>}
          </div>
        </div>
      </div>
    )
  }

  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#475569',fontSize:'14px'}}>Carregando...</p></div>)

  const ini=perfil?.nome_negocio?.charAt(0)?.toUpperCase()||'N'

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <style>{`'
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
.ag-main{display:grid;grid-template-columns:1fr;gap:18px}
.ag-detalhe{display:none}
@media(min-width:1200px){.ag-main{grid-template-columns:1fr 380px}.ag-detalhe{display:block;position:sticky;top:24px;height:fit-content}}
.hdr-ag{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.hdr-ag h1{font-size:24px;font-weight:800;color:#F8FAFC;letter-spacing:-0.03em;margin-bottom:4px}
.hdr-ag-sub{font-size:14px;color:#CBD5E1;line-height:1.5}
.hdr-ag-btns{display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap}
.btn-pag{background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;border:none;border-radius:12px;padding:0 18px;height:40px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;box-shadow:0 4px 16px rgba(59,130,246,.22);transition:opacity .15s}
.btn-pag:hover{opacity:.9}
.btn-sag{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;padding:0 16px;height:40px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;transition:all .15s}
.btn-sag:hover{border-color:rgba(148,163,184,.38);color:#F8FAFC}
.kpi-ag{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px}
.kpi-ag-c{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.14);border-radius:16px;padding:16px 18px}
.kpi-ag-l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.10em;color:#64748B;margin-bottom:6px}
.kpi-ag-n{font-size:32px;font-weight:900;letter-spacing:-0.04em;line-height:1}
.ctrl-ag{display:flex;align-items:center;gap:8px;margin-bottom:18px;flex-wrap:wrap}
.aba-ag{height:36px;padding:0 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.16);background:transparent;color:#64748B;font-family:inherit;transition:all .15s;white-space:nowrap}
.aba-ag.on{background:rgba(59,130,246,.14);border-color:rgba(59,130,246,.35);color:#60A5FA}
.aba-ag:hover:not(.on){color:#94A3B8}
.fil-ag{display:flex;gap:6px;flex:1;flex-wrap:wrap}
.filt-ag{height:32px;padding:0 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.14);background:transparent;color:#64748B;font-family:inherit;transition:all .15s;white-space:nowrap}
.filt-ag.on{background:rgba(59,130,246,.12);border-color:rgba(59,130,246,.28);color:#60A5FA}
.prof-ag{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:10px;padding:0 12px;height:34px;font-size:12px;color:#CBD5E1;font-family:inherit;cursor:pointer;outline:none;margin-left:auto}
.dia-ag{font-size:11px;font-weight:700;color:#475569;text-transform:capitalize;margin:16px 0 8px;letter-spacing:.06em;display:flex;align-items:center;gap:8px}
.dia-ag::after{content:'';flex:1;height:1px;background:rgba(148,163,184,.07)}
.ag-it{background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.13);border-radius:16px;padding:14px 16px;margin-bottom:8px;cursor:pointer;transition:all .15s}
.ag-it:hover{border-color:rgba(148,163,184,.26)}
.ag-it.sel{border-color:rgba(59,130,246,.55);background:radial-gradient(circle at top left,rgba(59,130,246,.08),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))}
.ag-r1{display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap}
.ag-hr{display:inline-flex;background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.22);border-radius:8px;padding:4px 10px;font-size:14px;font-weight:800;color:#60A5FA;flex-shrink:0}
.ag-nm{font-size:14px;font-weight:800;color:#F8FAFC;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.st-ag{font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;white-space:nowrap;flex-shrink:0;line-height:18px}
.ag-tl{font-size:12px;color:#CBD5E1;margin-bottom:4px}
.ag-sb{font-size:12px;color:#94A3B8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:8px}
.ag-ac{display:flex;gap:5px;flex-wrap:wrap}
.ac-b{border-radius:8px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid;font-family:inherit;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;gap:3px;transition:opacity .15s}
.ac-b:hover{opacity:.8}
.mnu-r{position:relative;display:inline-block}
.mnu-d{position:absolute;top:calc(100% + 6px);left:0;background:rgba(10,15,25,.98);border:1px solid rgba(148,163,184,.20);border-radius:14px;padding:8px;min-width:170px;z-index:50;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.mnu-i{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;color:#CBD5E1;border:none;background:none;font-family:inherit;width:100%;text-align:left;white-space:nowrap;transition:background .1s}
.mnu-i:hover{background:rgba(255,255,255,.06)}
.det-ag{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.14);border-radius:20px;padding:22px}
.det-av{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#7C3AED);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;margin:0 auto 14px;box-shadow:0 0 20px rgba(59,130,246,.22)}
.det-nm{font-size:18px;font-weight:800;color:#F8FAFC;text-align:center;margin-bottom:4px}
.det-sc{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(148,163,184,.07)}
.det-sc:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.det-st{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.10em;color:#475569;margin-bottom:10px}
.det-rw{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}
.det-lb{font-size:12px;color:#64748B}
.det-vl{font-size:12px;font-weight:700;color:#F8FAFC;text-align:right;max-width:60%}
.det-bs{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}
.det-b{border-radius:10px;padding:9px 10px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid;font-family:inherit;white-space:nowrap;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:4px;transition:opacity .15s}
.det-b:hover{opacity:.85}
.det-bf{grid-column:1/-1}
.vaz-ag{text-align:center;padding:50px 20px;background:linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.10);border-radius:18px}
.tst-ag{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,.97);border:1px solid rgba(59,130,246,.30);border-radius:12px;padding:12px 24px;font-size:13px;font-weight:600;color:#F8FAFC;z-index:200;box-shadow:0 8px 32px rgba(0,0,0,.5);pointer-events:none;white-space:nowrap}
.sem-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px}
.sem-gr{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.sem-cl{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.10);border-radius:12px;overflow:hidden;min-height:130px}
.sem-hd{padding:8px 6px;text-align:center;font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;border-bottom:1px solid rgba(148,163,184,.07);background:rgba(59,130,246,.04)}
.sem-hd.hj{color:#60A5FA;background:rgba(59,130,246,.14)}
.sem-dt{font-size:14px;font-weight:800;color:#F8FAFC;margin-top:2px}
.sem-it{background:rgba(59,130,246,.10);border-radius:6px;padding:4px 6px;margin:4px;font-size:10px;color:#93C5FD;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid rgba(59,130,246,.15);line-height:1.5}
.smb-da{margin-bottom:16px}
.smb-hd{font-size:12px;font-weight:700;margin-bottom:8px;text-transform:capitalize;padding-bottom:6px;border-bottom:1px solid rgba(59,130,246,.12)}
.smb-it{background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.12);border-radius:12px;padding:12px 14px;margin-bottom:6px;display:flex;gap:12px;align-items:center}
.smb-hr{font-size:13px;font-weight:800;color:#60A5FA;flex-shrink:0;min-width:42px}
.smb-in{min-width:0;flex:1}
.smb-nm{font-size:13px;font-weight:700;color:#F8FAFC;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.smb-sb{font-size:11px;color:#94A3B8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(max-width:768px){
  .bdy{padding:16px 14px}
  .hdr-ag h1{font-size:20px}
  .hdr-ag{gap:10px}
  .hdr-ag-btns{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .hdr-ag-btns a,.hdr-ag-btns button{width:100%;justify-content:center}
  .kpi-ag{gap:8px}
  .kpi-ag-c{padding:12px 10px}
  .kpi-ag-n{font-size:24px}
  .kpi-ag-l{font-size:9px}
  .fil-ag{overflow-x:auto;flex-wrap:nowrap;padding-bottom:2px}
  .fil-ag::-webkit-scrollbar{display:none}
  .prof-ag{margin-left:0;width:100%}
  .sem-gr{display:none}
}
@media(min-width:769px){.sem-mob{display:none}}
`}</style>
      {msg&&<div className="tst-ag">{msg}</div>}

      <aside className="sb">
      <div className="sb-logo"><div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span></div>
      <nav>{SB.map(it=><Link key={it.l} href={it.h} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot"><div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div><div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div></div></div>
    </aside>

      {mob&&mopen&&<div onClick={()=>setMopen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:40,backdropFilter:'blur(4px)'}}/>}

      <div className="pg" style={{flex:1,minWidth:0,overflowY:'auto'}}>
        <div className="bdy">
          <div className="hdr-ag">
            <div>
              <h1>Agenda</h1>
              <p className="hdr-ag-sub">Veja seus horarios, confirme clientes e acompanhe os atendimentos do dia.</p>
            </div>
            <div className="hdr-ag-btns">
              <Link href="/painel/agendamentos/novo" className="btn-pag">+ Novo agendamento</Link>
              <button className="btn-sag" onClick={()=>toast('Funcao de bloqueio em breve!')}>Bloquear horario</button>
            </div>
          </div>

          <div className="kpi-ag">
            <div className="kpi-ag-c" style={{borderColor:'rgba(59,130,246,.22)'}}>
              <p className="kpi-ag-l">Hoje</p>
              <p className="kpi-ag-n" style={{color:'#60A5FA'}}>{agsHj.length}</p>
            </div>
            <div className="kpi-ag-c" style={{borderColor:'rgba(34,197,94,.20)'}}>
              <p className="kpi-ag-l">Confirmados</p>
              <p className="kpi-ag-n" style={{color:'#4ADE80'}}>{conf}</p>
            </div>
            <div className="kpi-ag-c" style={{borderColor:'rgba(245,158,11,.20)'}}>
              <p className="kpi-ag-l">Pendentes</p>
              <p className="kpi-ag-n" style={{color:'#FCD34D'}}>{pend}</p>
            </div>
          </div>

          <div className="ctrl-ag">
            <button className={'aba-ag'+(view==='hoje'?' on':'')} onClick={()=>setView('hoje')}>Hoje</button>
            <button className={'aba-ag'+(view==='semana'?' on':'')} onClick={()=>setView('semana')}>Semana</button>
            {view==='hoje'&&(
              <div className="fil-ag">
                {['todos','pendente','confirmado','realizado','cancelado'].map(f=>(
                  <button key={f} className={'filt-ag'+(fSt===f?' on':'')} onClick={()=>setFSt(f)}>
                    {f==='todos'?'Todos':stCfg[f]?.t||f}
                  </button>
                ))}
              </div>
            )}
            <select className="prof-ag" value={fPr} onChange={e=>setFPr(e.target.value)}>
              <option value="todos">Todos profissionais</option>
              {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          {view==='hoje'&&(
            <div className="ag-main">
              <div>
                <p className="dia-ag">Proximos atendimentos de hoje</p>
                {agsF.length===0?(
                  <div className="vaz-ag">
                    <div style={{fontSize:'32px',marginBottom:'12px',opacity:.3}}>📅</div>
                    <h3 style={{fontSize:'16px',fontWeight:800,color:'#F8FAFC',marginBottom:'8px'}}>Nenhum atendimento para hoje</h3>
                    <p style={{fontSize:'13px',color:'#64748B',marginBottom:'20px',lineHeight:1.6}}>Quando seus clientes agendarem, os horarios aparecerao aqui.</p>
                    <Link href="/painel/agendamentos/novo" className="btn-pag" style={{display:'inline-flex'}}>+ Novo agendamento</Link>
                  </div>
                ):agsF.map(a=>{
                  const sc=stCfg[a.status]||stCfg.pendente
                  const tf=fTel(a.cliente_whatsapp||a.cliente_telefone||'')
                  const iS=sel?.id===a.id
                  const wC=wpp(a,'c'),wW=wpp(a,'w')
                  return(
                    <div key={a.id} className={'ag-it'+(iS?' sel':'')} onClick={()=>setSel(a)}>
                      <div className="ag-r1">
                        <span className="ag-hr">{fH(a.data_hora)}</span>
                        <span className="ag-nm">{a.cliente_nome||'—'}</span>
                        <span className="st-ag" style={{background:sc.bg,color:sc.c,border:'1px solid '+sc.bd}}>{sc.t}</span>
                      </div>
                      {tf&&<p className="ag-tl">📱 {tf}</p>}
                      <p className="ag-sb">
                        {a.servicos?.nome||'Servico nao informado'}
                        {a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}
                        {a.servicos?.preco?<span style={{color:'#22C55E'}}> · R$ {a.servicos.preco}</span>:null}
                      </p>
                      <div className="ag-ac" onClick={e=>e.stopPropagation()}>
                        {wW&&<a href={wW} target="_blank" rel="noreferrer" className="ac-b" style={{background:'rgba(37,211,102,.10)',borderColor:'rgba(37,211,102,.22)',color:'#25D366'}}>WhatsApp</a>}
                        {wC&&(a.status==='pendente'||!a.status)&&<a href={wC} target="_blank" rel="noreferrer" className="ac-b" style={{background:'rgba(34,197,94,.10)',borderColor:'rgba(34,197,94,.22)',color:'#22C55E'}}>Confirmar</a>}
                        <div className="mnu-r" ref={mnu===a.id?mnuRef:undefined}>
                          <button className="ac-b" style={{background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.16)',color:'#64748B'}} onClick={()=>setMnu(mnu===a.id?null:a.id)}>Mais</button>
                          {mnu===a.id&&(
                            <div className="mnu-d">
                              <button className="mnu-i" onClick={()=>copiar(a)}>Copiar contato</button>
                              {a.status!=='compareceu'&&<button className="mnu-i" onClick={()=>updSt(a.id,'compareceu')}>Compareceu</button>}
                              {a.status!=='faltou'&&<button className="mnu-i" onClick={()=>updSt(a.id,'faltou')}>Faltou</button>}
                              {a.status!=='realizado'&&<button className="mnu-i" onClick={()=>updSt(a.id,'realizado')}>Realizado</button>}
                              {a.status!=='retorno'&&<button className="mnu-i" onClick={()=>updSt(a.id,'retorno')}>Retorno</button>}
                              {a.status!=='confirmado'&&<button className="mnu-i" onClick={()=>updSt(a.id,'confirmado')}>Confirmado</button>}
                              {a.status!=='cancelado'&&<button className="mnu-i" onClick={()=>updSt(a.id,'cancelado')}>Cancelar</button>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="ag-detalhe"><Det/></div>
            </div>
          )}

          {view==='semana'&&(
            <div>
              <div className="sem-nav">
                <p style={{fontSize:'14px',fontWeight:700,color:'#CBD5E1'}}>{fDC(dS[0])} - {fDC(dS[6])} {dS[6].getFullYear()}</p>
                <div style={{display:'flex',gap:'8px'}}>
                  <button className="btn-sag" style={{height:'34px',padding:'0 14px',fontSize:'12px'}} onClick={()=>setSemOff(s=>s-1)}>Anterior</button>
                  <button className="btn-sag" style={{height:'34px',padding:'0 14px',fontSize:'12px'}} onClick={()=>setSemOff(0)}>Hoje</button>
                  <button className="btn-sag" style={{height:'34px',padding:'0 14px',fontSize:'12px'}} onClick={()=>setSemOff(s=>s+1)}>Proxima</button>
                </div>
              </div>
              <div className="sem-gr">
                {dS.map((d,i)=>{
                  const ds=d.toISOString().split('T')[0]
                  const eh=ds===hoje
                  const it=ags.filter(a=>{
                    const ad=new Date(a.data_hora).toISOString().split('T')[0]
                    return ad===ds&&(fPr==='todos'||a.profissional_id===fPr)
                  })
                  return(
                    <div key={i} className="sem-cl">
                      <div className={'sem-hd'+(eh?' hj':'')}>
                        <div>{['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][d.getDay()]}</div>
                        <div className="sem-dt">{d.getDate()}</div>
                      </div>
                      {it.map(a=>(
                        <div key={a.id} className="sem-it" onClick={()=>{setSel(a);setView('hoje')}} title={a.cliente_nome+' '+fH(a.data_hora)}>
                          {fH(a.data_hora)} {(a.cliente_nome||'').split(' ')[0]}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
              <div className="sem-mob">
                {dS.map((d,i)=>{
                  const ds=d.toISOString().split('T')[0]
                  const eh=ds===hoje
                  const it=ags.filter(a=>{
                    const ad=new Date(a.data_hora).toISOString().split('T')[0]
                    return ad===ds&&(fPr==='todos'||a.profissional_id===fPr)
                  })
                  return(
                    <div key={i} className="smb-da">
                      <p className="smb-hd" style={{color:eh?'#60A5FA':'#94A3B8'}}>
                        {d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})}
                        {eh?' · Hoje':''}
                      </p>
                      {it.length===0?<p style={{fontSize:'12px',color:'#334155',padding:'8px 0'}}>Nenhum atendimento</p>:it.map(a=>(
                        <div key={a.id} className="smb-it">
                          <span className="smb-hr">{fH(a.data_hora)}</span>
                          <div className="smb-in">
                            <p className="smb-nm">{a.cliente_nome||'—'}</p>
                            <p className="smb-sb">{a.servicos?.nome||''}{a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}</p>
                          </div>
                          <span className="st-ag" style={{fontSize:'9px',padding:'2px 7px',background:(stCfg[a.status]||stCfg.pendente).bg,color:(stCfg[a.status]||stCfg.pendente).c,border:'1px solid '+(stCfg[a.status]||stCfg.pendente).bd}}>
                            {(stCfg[a.status]||stCfg.pendente).t}
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
