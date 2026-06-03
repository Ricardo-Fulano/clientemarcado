const fs = require('fs')

const painelPage = fs.readFileSync('app/painel/page.tsx', 'utf8')
const cssStart = painelPage.indexOf('const CSS=`\n') + 12
const cssEnd = painelPage.indexOf('\n`\nexport default', cssStart)
const cssOriginal = painelPage.slice(cssStart, cssEnd)
const sidebarStart = painelPage.indexOf('<aside className="sb">')
const sidebarEnd = painelPage.indexOf('</aside>') + '</aside>'.length
const sidebarJSX = painelPage.slice(sidebarStart, sidebarEnd)

// Sidebar com Agenda ativo
const sidebarAgenda = sidebarJSX
  .replace("h==='/painel'", "h==='/painel/agendamentos'")
  .replace(/on:\s*\w+===h/g, "on:'/painel/agendamentos'===h")

// CSS extra para agenda
const cssExtra = `
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
`

const fullCSS = cssOriginal + cssExtra

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

const nova = `'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const G = '${G}'
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
  const n=t.replace(/\\D/g,'')
  if(n.length===11)return '('+n.slice(0,2)+') '+n.slice(2,7)+'-'+n.slice(7)
  if(n.length===10)return '('+n.slice(0,2)+') '+n.slice(2,6)+'-'+n.slice(6)
  return t
}
function gTel(a:any){return(a.cliente_whatsapp||a.cliente_telefone||'').replace(/\\D/g,'')}

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
    if(tipo==='c')t='Ola, '+a.cliente_nome+'! Seu agendamento foi confirmado.\\n\\nServico: '+(a.servicos?.nome||'')+'\\nProfissional: '+(a.profissionais?.nome||'')+'\\nData: '+dt+'\\nHorario: '+hr+'\\n\\n'+(perfil?.nome_negocio||'')
    else if(tipo==='l')t='Ola, '+a.cliente_nome+'! Passando para lembrar do seu agendamento.\\n\\nServico: '+(a.servicos?.nome||'')+'\\nData: '+dt+'\\nHorario: '+hr+'\\n\\nTe esperamos!\\n'+(perfil?.nome_negocio||'')
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
      <style>{\`${fullCSS}\`}</style>
      {msg&&<div className="tst-ag">{msg}</div>}

      ${sidebarJSX}

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
`

fs.writeFileSync('app/painel/agendamentos/page.tsx', nova, 'utf8')
console.log('Pagina reescrita com sucesso!')
console.log('Linhas:', nova.split('\n').length)