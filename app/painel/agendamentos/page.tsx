'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import PainelSidebar from '@/app/components/PainelSidebar'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh}
.bdy{max-width:1200px;margin:0 auto;padding:24px 28px 80px}
.ag-grid{display:grid;grid-template-columns:1fr;gap:16px}
.det-col{display:none}
.kpi-g{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.hdr-btns{display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0}
.fil-row{display:flex;align-items:center;gap:7px;margin-bottom:14px;flex-wrap:wrap}
.fil-inner{display:flex;gap:5px;flex:1;overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch}
.fil-inner::-webkit-scrollbar{display:none}
.ag-item{background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:14px;padding:12px 14px;margin-bottom:6px;cursor:pointer;transition:all .15s}
.ag-item:hover{border-color:rgba(148,163,184,.24)}
.ag-item.sel{border-color:rgba(59,130,246,.48);background:radial-gradient(circle at top left,rgba(59,130,246,.09),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))}
.mnu-item{display:flex;align-items:center;gap:7px;padding:8px 11px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;color:#CBD5E1;border:none;background:none;font-family:inherit;width:100%;text-align:left;white-space:nowrap;transition:background .1s}
.mnu-item:hover{background:rgba(255,255,255,.06)}
.conf-area{margin-top:8px;padding-top:8px;border-top:1px solid rgba(148,163,184,.10)}
.conf-btns{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}
.conf-btns a,.conf-btns button{border-radius:7px;padding:4px 9px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid transparent;font-family:inherit;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
@media(max-width:600px){.conf-btns{display:grid!important;grid-template-columns:1fr 1fr!important}.conf-btns a,.conf-btns button{justify-content:center!important;padding:6px 8px!important}}
.sem-card{background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:16px;padding:16px;cursor:pointer;transition:all .15s}
.sem-card:hover{border-color:rgba(148,163,184,.24)}
.sem-card.hoje-card{border-color:rgba(59,130,246,.35);background:radial-gradient(circle at top left,rgba(59,130,246,.08),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))}
.sem-card.sel-card{border-color:rgba(59,130,246,.55);box-shadow:0 0 20px rgba(59,130,246,.15)}
.sem-det-item{background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:12px;padding:12px 14px;margin-bottom:6px;display:flex;gap:12px;align-items:flex-start}
@media(min-width:1100px){.ag-grid{grid-template-columns:1fr 360px}.det-col{display:block}}
@media(max-width:1023px){
  .bdy{padding:14px 14px 80px!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important}
  .kpi-g{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .kpi-g>div:last-child{grid-column:1/-1!important}
  .hdr-btns{width:100%;display:grid!important;grid-template-columns:1fr 1fr;gap:7px}
  .hdr-btns a,.hdr-btns button{width:100%;justify-content:center}
}
@media(max-width:480px){.kpi-g{grid-template-columns:1fr!important}}
`

const confCfg: Record<string,{t:string,bg:string,c:string}> = {
  pendente:         {t:'Aguardando confirmacao',bg:'rgba(245,158,11,.12)',c:'#FCD34D'},
  mensagem_enviada: {t:'Mensagem enviada',      bg:'rgba(59,130,246,.12)', c:'#60A5FA'},
  confirmado:       {t:'Confirmado',            bg:'rgba(34,197,94,.12)',  c:'#4ADE80'},
  sem_resposta:     {t:'Sem resposta',          bg:'rgba(245,158,11,.12)',c:'#FCD34D'},
  nao_comparece:    {t:'Nao vai comparecer',    bg:'rgba(239,68,68,.12)',  c:'#F87171'},
  remarcado:        {t:'Remarcado',             bg:'rgba(124,58,237,.12)',c:'#C4B5FD'},
}

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
function fDF(dh:string){return new Date(dh).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'})}
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
  const [view,setView]=useState<'hoje'|'semana'>('hoje')
  const [fSt,setFSt]=useState('todos')
  const [fPr,setFPr]=useState('todos')
  const [semOff,setSemOff]=useState(0)
  const [diaSel,setDiaSel]=useState<string|null>(null)
  const [msg,setMsg]=useState('')
  const [sel,setSel]=useState<any>(null)
  const [mnu,setMnu]=useState<string|null>(null)
  const [confMnu,setConfMnu]=useState<string|null>(null)

  async function updConf(id:string, status:string){
    await supabase.from('agendamentos').update({
      confirmacao_status: status,
      confirmacao_atualizada_em: new Date().toISOString(),
    }).eq('id',id)
    setAgendamentos(prev=>prev.map(a=>a.id===id?{...a,confirmacao_status:status,confirmacao_atualizada_em:new Date().toISOString()}:a))
    if(sel?.id===id)setSel((s:any)=>s?{...s,confirmacao_status:status}:s)
  }

  function wppConf(a:any){
    const tel=fTel(a.cliente_whatsapp||a.cliente_telefone||'')
    if(!tel)return''
    const hr=fH(a.data_hora)
    const sv=a.servicos?.nome||'seu atendimento'
    const pr=a.profissionais?.nome?` com ${a.profissionais.nome}`:''
    const neg=perfil?.nome_negocio||'nosso negocio'
    const msg=encodeURIComponent(`Ola, ${a.cliente_nome||''}! Tudo bem? Aqui e da ${neg}. Estou passando para confirmar seu horario de hoje as ${hr} para ${sv}${pr}. Voce confirma sua presenca?`)
    return`https://wa.me/55${tel.replace(/\D/g,'')}?text=${msg}`
  }
  const mnuRef=useRef<HTMLDivElement>(null)
  const hoje=new Date().toISOString().split('T')[0]

  useEffect(()=>{load()},[])
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

  function stBadge(status:string):React.CSSProperties{
    const sc=stCfg[status]||stCfg.pendente
    return{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:999,whiteSpace:'nowrap' as const,lineHeight:'17px',background:sc.bg,color:sc.c,border:'1px solid '+sc.bd}
  }
  function dBtn(ex:React.CSSProperties):React.CSSProperties{
    return{borderRadius:8,padding:'7px 8px',fontSize:11,fontWeight:700,cursor:'pointer',border:'1px solid',fontFamily:'inherit',whiteSpace:'nowrap' as const,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:3,transition:'opacity .15s',...ex}
  }

  const btnP:React.CSSProperties={background:G,color:'#fff',border:'none',borderRadius:10,padding:'0 16px',height:36,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:5,whiteSpace:'nowrap',boxShadow:'0 4px 14px rgba(59,130,246,.25)'}
  const btnS:React.CSSProperties={background:'rgba(15,23,42,.88)',color:'#CBD5E1',border:'1px solid rgba(148,163,184,.20)',borderRadius:10,padding:'0 14px',height:36,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',display:'inline-flex',alignItems:'center'}

  const nome=perfil?.nome_negocio||'Negocio'
  const ini=(nome||'N').charAt(0).toUpperCase()

  function Det(){
    const sc=stCfg[sel?.status]||stCfg.pendente
    const tf=sel?fTel(sel.cliente_whatsapp||sel.cliente_telefone||''):''
    const wC=sel?wpp(sel,'c'):null
    const wL=sel?wpp(sel,'l'):null
    const wW=sel?wpp(sel,'w'):null
    const sec:React.CSSProperties={marginBottom:12,paddingBottom:12,borderBottom:'1px solid rgba(148,163,184,.07)'}
    const secT:React.CSSProperties={fontSize:9,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.10em',color:'#475569',marginBottom:8}
    const row:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}
    const g2:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:6}
    if(!sel)return(
      <div style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid rgba(148,163,184,.12)',borderRadius:16,padding:20,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:300,textAlign:'center',gap:10}}>
        <div style={{fontSize:32,opacity:.2}}>📋</div>
        <p style={{fontSize:14,fontWeight:700,color:'#F8FAFC'}}>Selecione um agendamento</p>
        <p style={{fontSize:12,color:'#475569',lineHeight:1.5}}>Clique em um atendimento para ver detalhes.</p>
      </div>
    )
    return(
      <div style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid rgba(124,58,237,.20)',borderRadius:16,padding:18,maxHeight:'calc(100vh - 160px)',overflowY:'auto'}}>
        <p style={{...secT,marginBottom:12}}>Detalhes do agendamento</p>
        <div style={{width:44,height:44,borderRadius:'50%',background:G,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#fff',margin:'0 auto 10px'}}>{(sel.cliente_nome||'C').charAt(0).toUpperCase()}</div>
        <p style={{fontSize:15,fontWeight:800,color:'#F8FAFC',textAlign:'center',marginBottom:3}}>{sel.cliente_nome||'Cliente sem nome'}</p>
        <div style={{textAlign:'center',marginBottom:12}}><span style={stBadge(sel.status)}>{sc.t}</span></div>
        <div style={sec}>
          <p style={secT}>Contato</p>
          <div style={row}><span style={{fontSize:11,color:'#64748B'}}>WhatsApp</span><span style={{fontSize:11,fontWeight:700,color:'#CBD5E1'}}>{tf||'Nao informado'}</span></div>
          <div style={g2}>
            {wW?<a href={wW} target="_blank" rel="noreferrer" style={{...dBtn({background:'rgba(37,211,102,.12)',borderColor:'rgba(37,211,102,.25)',color:'#25D366'}),gridColumn:'1/-1'}}>Abrir WhatsApp</a>
              :<button disabled style={{...dBtn({background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.10)',color:'#334155',cursor:'not-allowed'}),gridColumn:'1/-1'}}>Sem telefone</button>}
            <button onClick={()=>copiar(sel)} style={{...dBtn({background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.14)',color:'#94A3B8'}),gridColumn:'1/-1'}}>📋 Copiar contato</button>
          </div>
        </div>
        <div style={sec}>
          <p style={secT}>Atendimento</p>
          {[{l:'Servico',v:sel.servicos?.nome||'Nao informado',c:'#F8FAFC'},{l:'Profissional',v:sel.profissionais?.nome||'Nao informado',c:'#F8FAFC'},{l:'Data',v:fDF(sel.data_hora),c:'#CBD5E1',fs:10},{l:'Horario',v:fH(sel.data_hora),c:'#60A5FA'},...(sel.servicos?.preco?[{l:'Valor',v:'R$ '+sel.servicos.preco,c:'#22C55E'}]:[])].map(({l,v,c,fs}:any)=>(
            <div key={l} style={row}><span style={{fontSize:11,color:'#64748B'}}>{l}</span><span style={{fontSize:fs||11,fontWeight:700,color:c,textAlign:'right' as const,maxWidth:'58%'}}>{v}</span></div>
          ))}
        </div>
        <div>
          <p style={secT}>Acoes rapidas</p>
          <div style={g2}>
            {wC&&(sel.status==='pendente'||!sel.status||sel.status==='retorno')&&<a href={wC} target="_blank" rel="noreferrer" style={dBtn({background:'rgba(34,197,94,.12)',borderColor:'rgba(34,197,94,.25)',color:'#22C55E'})}>✓ Confirmar</a>}
            {wL&&<a href={wL} target="_blank" rel="noreferrer" style={dBtn({background:'rgba(245,158,11,.10)',borderColor:'rgba(245,158,11,.22)',color:'#FCD34D'})}>🔔 Lembrete</a>}
            {sel.status!=='compareceu'&&<button onClick={()=>updSt(sel.id,'compareceu')} style={dBtn({background:'rgba(34,197,94,.10)',borderColor:'rgba(34,197,94,.20)',color:'#4ADE80'})}>✓ Compareceu</button>}
            {sel.status!=='faltou'&&<button onClick={()=>updSt(sel.id,'faltou')} style={dBtn({background:'rgba(239,68,68,.08)',borderColor:'rgba(239,68,68,.18)',color:'#F87171'})}>✗ Faltou</button>}
            {sel.status!=='realizado'&&<button onClick={()=>updSt(sel.id,'realizado')} style={dBtn({background:'rgba(34,197,94,.08)',borderColor:'rgba(34,197,94,.16)',color:'#22C55E'})}>★ Realizado</button>}
            {sel.status!=='retorno'&&<button onClick={()=>updSt(sel.id,'retorno')} style={dBtn({background:'rgba(124,58,237,.10)',borderColor:'rgba(124,58,237,.22)',color:'#C4B5FD'})}>↩ Retorno</button>}
            {sel.status!=='cancelado'&&<button onClick={()=>updSt(sel.id,'cancelado')} style={dBtn({background:'rgba(239,68,68,.06)',borderColor:'rgba(239,68,68,.14)',color:'#F87171'})}>✕ Cancelar</button>}
          </div>
        </div>
      </div>
    )
  }

  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      {msg&&<div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',background:'rgba(15,23,42,.97)',border:'1px solid rgba(59,130,246,.30)',borderRadius:10,padding:'10px 20px',fontSize:12,fontWeight:600,color:'#F8FAFC',zIndex:200,boxShadow:'0 8px 32px rgba(0,0,0,.5)',pointerEvents:'none',whiteSpace:'nowrap'}}>{msg}</div>}

      <PainelSidebar nome={nome} tituloMobile="Agenda" />

      <div className="psb-main">
        <div className="pg"><div className="bdy">

          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:14,marginBottom:16,flexWrap:'wrap'}}>
            <div>
              <h1 style={{fontSize:22,fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.03em',marginBottom:2}}>Agenda</h1>
              <p style={{fontSize:13,color:'#94A3B8',lineHeight:1.4}}>Veja seus horarios, confirme clientes e acompanhe os atendimentos do dia.</p>
            </div>
            <div className="hdr-btns">
              <Link href="/painel/agendamentos/novo" style={btnP}>+ Novo agendamento</Link>
              <button style={btnS} onClick={()=>toast('Funcao de bloqueio em breve!')}>Bloquear horario</button>
            </div>
          </div>

          <div className="kpi-g">
            {[{l:'Hoje',n:agsHj.length,c:'#60A5FA',bd:'rgba(59,130,246,.22)',ic:'📅'},{l:'Confirmados',n:conf,c:'#4ADE80',bd:'rgba(34,197,94,.20)',ic:'✅'},{l:'Pendentes',n:pend,c:'#FCD34D',bd:'rgba(245,158,11,.20)',ic:'⏳'}].map(({l,n,c,bd,ic})=>(
              <div key={l} style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid '+bd,borderRadius:14,padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:18,opacity:.8,flexShrink:0}}>{ic}</span>
                <div><p style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.10em',color:'#64748B',marginBottom:3}}>{l}</p><p style={{fontSize:26,fontWeight:900,letterSpacing:'-0.04em',lineHeight:1,color:c}}>{n}</p></div>
              </div>
            ))}
          </div>

          <div className="fil-row">
            {(['hoje','semana'] as const).map(v=>(
              <button key={v} onClick={()=>{setView(v);setDiaSel(null)}} style={{height:32,padding:'0 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(view===v?'rgba(59,130,246,.35)':'rgba(148,163,184,.15)'),background:view===v?'rgba(59,130,246,.14)':'transparent',color:view===v?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>
                {v==='hoje'?'Hoje':'Semana'}
              </button>
            ))}
            {view==='hoje'&&(
              <div className="fil-inner">
                {['todos','pendente','confirmado','realizado','cancelado'].map(f=>(
                  <button key={f} onClick={()=>setFSt(f)} style={{height:30,padding:'0 10px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt===f?'rgba(59,130,246,.28)':'rgba(148,163,184,.13)'),background:fSt===f?'rgba(59,130,246,.12)':'transparent',color:fSt===f?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>
                    {f==='todos'?'Todos':stCfg[f]?.t||f}
                  </button>
                ))}
              </div>
            )}
            <select value={fPr} onChange={e=>setFPr(e.target.value)} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.16)',borderRadius:8,padding:'0 10px',height:30,fontSize:11,color:'#CBD5E1',fontFamily:'inherit',cursor:'pointer',outline:'none',marginLeft:'auto',flexShrink:0}}>
              <option value="todos">Todos profissionais</option>
              {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          {view==='hoje'&&(
            <div className="ag-grid">
              <div>
                <p style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',margin:'0 0 8px',letterSpacing:'.06em'}}>Proximos atendimentos de hoje</p>
                {agsF.length===0?(
                  <div style={{textAlign:'center',padding:'44px 20px',background:'linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1px solid rgba(148,163,184,.09)',borderRadius:16}}>
                    <div style={{fontSize:28,marginBottom:10,opacity:.3}}>📅</div>
                    <h3 style={{fontSize:15,fontWeight:800,color:'#F8FAFC',marginBottom:6}}>Nenhum atendimento para hoje</h3>
                    <p style={{fontSize:12,color:'#64748B',marginBottom:18,lineHeight:1.5}}>Quando seus clientes agendarem, os horarios aparecerao aqui.</p>
                    <Link href="/painel/agendamentos/novo" style={{...btnP,display:'inline-flex'}}>+ Novo agendamento</Link>
                  </div>
                ):agsF.map(a=>{
                  const sc=stCfg[a.status]||stCfg.pendente
                  const tf=fTel(a.cliente_whatsapp||a.cliente_telefone||'')
                  const isSel=sel?.id===a.id
                  const wW=wpp(a,'w'),wC=wpp(a,'c')
                  return(
                    <div key={a.id} className={'ag-item'+(isSel?' sel':'')} onClick={()=>setSel(a)}>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5,flexWrap:'wrap'}}>
                        <span style={{display:'inline-flex',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.20)',borderRadius:7,padding:'3px 9px',fontSize:13,fontWeight:800,color:'#60A5FA',flexShrink:0}}>{fH(a.data_hora)}</span>
                        <span style={{fontSize:13,fontWeight:800,color:'#F8FAFC',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.cliente_nome||'—'}</span>
                        <span style={stBadge(a.status)}>{sc.t}</span>
                      </div>
                      {tf&&<p style={{fontSize:11,color:'#CBD5E1',marginBottom:3}}>📱 {tf}</p>}
                      <p style={{fontSize:11,color:'#94A3B8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:8}}>
                        {a.servicos?.nome||'Servico nao informado'}{a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}
                        {a.servicos?.preco?<span style={{color:'#22C55E'}}> · R$ {a.servicos.preco}</span>:null}
                      </p>
                      <div style={{display:'flex',gap:5,flexWrap:'wrap'}} onClick={e=>e.stopPropagation()}>
                        {wW&&<a href={wW} target="_blank" rel="noreferrer" style={{borderRadius:7,padding:'4px 9px',fontSize:10,fontWeight:700,cursor:'pointer',border:'1px solid rgba(37,211,102,.22)',background:'rgba(37,211,102,.10)',color:'#25D366',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:3}}>WhatsApp</a>}
                        {wC&&(a.status==='pendente'||!a.status)&&<a href={wC} target="_blank" rel="noreferrer" style={{borderRadius:7,padding:'4px 9px',fontSize:10,fontWeight:700,cursor:'pointer',border:'1px solid rgba(34,197,94,.22)',background:'rgba(34,197,94,.10)',color:'#22C55E',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:3}}>✓ Confirmar</a>}
                        <div style={{position:'relative',display:'inline-block'}} ref={mnu===a.id?mnuRef:undefined}>
                          <button onClick={()=>setMnu(mnu===a.id?null:a.id)} style={{borderRadius:7,padding:'4px 9px',fontSize:10,fontWeight:700,cursor:'pointer',border:'1px solid rgba(148,163,184,.15)',background:'rgba(255,255,255,.04)',color:'#64748B',fontFamily:'inherit'}}>Mais</button>
                          {mnu===a.id&&(
                            <div style={{position:'absolute',top:'calc(100% + 5px)',left:0,background:'rgba(10,15,25,.98)',border:'1px solid rgba(148,163,184,.18)',borderRadius:12,padding:6,minWidth:160,zIndex:50,boxShadow:'0 16px 48px rgba(0,0,0,.6)'}}>
                              {[{l:'📋 Copiar contato',fn:()=>copiar(a)},{l:'✓ Compareceu',fn:()=>updSt(a.id,'compareceu'),skip:a.status==='compareceu'},{l:'✗ Faltou',fn:()=>updSt(a.id,'faltou'),skip:a.status==='faltou'},{l:'★ Realizado',fn:()=>updSt(a.id,'realizado'),skip:a.status==='realizado'},{l:'↩ Retorno',fn:()=>updSt(a.id,'retorno'),skip:a.status==='retorno'},{l:'✓ Confirmado',fn:()=>updSt(a.id,'confirmado'),skip:a.status==='confirmado'},{l:'✕ Cancelar',fn:()=>updSt(a.id,'cancelado'),skip:a.status==='cancelado'}].filter((i:any)=>!i.skip).map(({l,fn}:any)=>(
                                <button key={l} onClick={fn} className="mnu-item">{l}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Confirmacao de presenca */}
                      <div className="conf-area" onClick={e=>e.stopPropagation()}>
                        {(()=>{
                          const cs=a.confirmacao_status||'pendente'
                          const cc=confCfg[cs]||confCfg.pendente
                          const agora=new Date()
                          const dtAg=new Date(a.data_hora)
                          const diffMin=(dtAg.getTime()-agora.getTime())/60000
                          const urgente=dtAg.toDateString()===agora.toDateString()&&diffMin<120&&diffMin>0&&(cs==='pendente'||cs==='mensagem_enviada')
                          const wC2=wppConf(a)
                          return(
                            <>
                              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                                <span style={{fontSize:10,fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'.06em'}}>Confirmacao</span>
                                <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:'999px',background:cc.bg,color:cc.c}}>{cc.t}</span>
                                {urgente&&<span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:'999px',background:'rgba(245,158,11,.22)',color:'#FBBF24',border:'1px solid rgba(245,158,11,.4)'}}>Confirmar agora</span>}
                              </div>
                              <div className="conf-btns">
                                {wC2&&<a href={wC2} target="_blank" rel="noreferrer"
                                  onClick={()=>updConf(a.id,'mensagem_enviada')}
                                  style={{background:'rgba(37,211,102,.14)',color:'#4ADE80',border:'1px solid rgba(37,211,102,.28)'}}>
                                  📱 Enviar confirmacao
                                </a>}
                                {cs!=='confirmado'&&<button onClick={()=>updConf(a.id,'confirmado')}
                                  style={{background:'rgba(34,197,94,.14)',color:'#4ADE80',border:'1px solid rgba(34,197,94,.28)'}}>
                                  ✓ Confirmou
                                </button>}
                                <div style={{position:'relative',display:'inline-block'}} ref={confMnu===a.id?mnuRef:undefined}>
                                  <button onClick={()=>setConfMnu(confMnu===a.id?null:a.id)}
                                    style={{background:'rgba(255,255,255,.06)',color:'#94A3B8',border:'1px solid rgba(148,163,184,.18)'}}>
                                    Mais ▾
                                  </button>
                                  {confMnu===a.id&&(
                                    <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,background:'rgba(10,15,25,.98)',border:'1px solid rgba(148,163,184,.18)',borderRadius:10,padding:4,zIndex:40,minWidth:180,boxShadow:'0 8px 24px rgba(0,0,0,.5)'}}>
                                      {[
                                        {l:'Sem resposta',s:'sem_resposta'},
                                        {l:'Nao vai comparecer',s:'nao_comparece'},
                                        {l:'Remarcado',s:'remarcado'},
                                      ].map(({l,s})=>(
                                        <button key={s} onClick={()=>{updConf(a.id,s);setConfMnu(null)}} className="mnu-item">{l}</button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="det-col"><div style={{position:'sticky',top:16}}><Det/></div></div>
            </div>
          )}

          {view==='semana'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
                <p style={{fontSize:14,fontWeight:700,color:'#CBD5E1'}}>{fDC(dS[0])} - {fDC(dS[6])} {dS[6].getFullYear()}</p>
                <div style={{display:'flex',gap:6}}>
                  {[{l:'Anterior',fn:()=>{setSemOff(s=>s-1);setDiaSel(null)}},{l:'Hoje',fn:()=>{setSemOff(0);setDiaSel(null)}},{l:'Proxima',fn:()=>{setSemOff(s=>s+1);setDiaSel(null)}}].map(({l,fn})=>(
                    <button key={l} onClick={fn} style={{...btnS,height:30,padding:'0 12px',fontSize:11}}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10,marginBottom:20}}>
                {dS.map((d,i)=>{
                  const ds=d.toISOString().split('T')[0]
                  const ehHoje=ds===hoje
                  const it=ags.filter(a=>{
                    const ad=new Date(a.data_hora).toISOString().split('T')[0]
                    return ad===ds&&(fPr==='todos'||a.profissional_id===fPr)
                  })
                  const totalPend=it.filter(a=>!a.status||a.status==='pendente').length
                  const totalConf=it.filter(a=>a.status==='confirmado').length
                  const primeiro=it[0]?fH(it[0].data_hora):null
                  const isSel=diaSel===ds
                  return(
                    <div key={i} className={'sem-card'+(ehHoje?' hoje-card':'')+(isSel?' sel-card':'')} onClick={()=>setDiaSel(isSel?null:ds)}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                        <div>
                          <p style={{fontSize:11,fontWeight:700,color:ehHoje?'#60A5FA':'#94A3B8',textTransform:'capitalize'}}>{d.toLocaleDateString('pt-BR',{weekday:'short'})}</p>
                          <p style={{fontSize:18,fontWeight:800,color:'#F8FAFC'}}>{d.getDate()}/{String(d.getMonth()+1).padStart(2,'0')}</p>
                        </div>
                        {ehHoje&&<span style={{fontSize:9,fontWeight:700,background:'rgba(59,130,246,.20)',color:'#60A5FA',border:'1px solid rgba(59,130,246,.30)',borderRadius:999,padding:'2px 8px'}}>Hoje</span>}
                      </div>
                      {it.length===0?(
                        <p style={{fontSize:11,color:'#334155'}}>Nenhum atendimento</p>
                      ):(
                        <>
                          <p style={{fontSize:20,fontWeight:900,color:'#F8FAFC',lineHeight:1,marginBottom:4}}>{it.length}</p>
                          <p style={{fontSize:10,color:'#64748B',marginBottom:8}}>atendimento{it.length>1?'s':''}{primeiro?' · Primeiro: '+primeiro:''}</p>
                          <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                            {totalPend>0&&<span style={{fontSize:10,fontWeight:700,padding:'1px 8px',borderRadius:999,background:'rgba(245,158,11,.14)',color:'#FCD34D',border:'1px solid rgba(245,158,11,.25)'}}>{totalPend} Pendente{totalPend>1?'s':''}</span>}
                            {totalConf>0&&<span style={{fontSize:10,fontWeight:700,padding:'1px 8px',borderRadius:999,background:'rgba(34,197,94,.14)',color:'#4ADE80',border:'1px solid rgba(34,197,94,.25)'}}>{totalConf} Confirmado{totalConf>1?'s':''}</span>}
                          </div>
                          <button onClick={e=>{e.stopPropagation();setDiaSel(isSel?null:ds)}} style={{width:'100%',background:isSel?'rgba(59,130,246,.20)':'rgba(59,130,246,.10)',border:'1px solid rgba(59,130,246,.25)',borderRadius:8,padding:'6px 10px',fontSize:11,fontWeight:700,color:'#60A5FA',cursor:'pointer',fontFamily:'inherit'}}>
                            {isSel?'Fechar':'Ver agenda do dia'}
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
              {diaSel&&(()=>{
                const itDia=ags.filter(a=>{
                  const ad=new Date(a.data_hora).toISOString().split('T')[0]
                  return ad===diaSel&&(fPr==='todos'||a.profissional_id===fPr)
                })
                const dObj=new Date(diaSel+'T12:00:00')
                return(
                  <div style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid rgba(59,130,246,.20)',borderRadius:18,padding:20}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                      <p style={{fontSize:14,fontWeight:700,color:'#F8FAFC'}}>Agenda de {dObj.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})}</p>
                      <button onClick={()=>setDiaSel(null)} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:18,lineHeight:1}}>×</button>
                    </div>
                    {itDia.length===0?(
                      <p style={{fontSize:13,color:'#475569',textAlign:'center',padding:'24px 0'}}>Nenhum atendimento neste dia.</p>
                    ):itDia.map(a=>{
                      const sc=stCfg[a.status]||stCfg.pendente
                      const tf=fTel(a.cliente_whatsapp||a.cliente_telefone||'')
                      const wW=wpp(a,'w')
                      return(
                        <div key={a.id} className="sem-det-item">
                          <span style={{fontSize:13,fontWeight:800,color:'#60A5FA',flexShrink:0,minWidth:44,paddingTop:1}}>{fH(a.data_hora)}</span>
                          <div style={{minWidth:0,flex:1}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:3}}>
                              <p style={{fontSize:13,fontWeight:700,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.cliente_nome||'—'}</p>
                              <span style={stBadge(a.status)}>{sc.t}</span>
                            </div>
                            <p style={{fontSize:11,color:'#94A3B8',marginBottom:tf?3:0}}>{a.servicos?.nome||''}{a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}</p>
                            {tf&&<p style={{fontSize:11,color:'#CBD5E1'}}>📱 {tf}</p>}
                          </div>
                          {wW&&<a href={wW} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{flexShrink:0,width:30,height:30,borderRadius:8,background:'rgba(37,211,102,.10)',border:'1px solid rgba(37,211,102,.22)',color:'#25D366',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none'}}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          </a>}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}

        </div></div>
      </div>
    </div>
  )
}
