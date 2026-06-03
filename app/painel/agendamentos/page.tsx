'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

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

  const s: React.CSSProperties & Record<string,any> = {}

  function Det(){
    if(!sel)return(
      <div style={{background:'linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid rgba(148,163,184,.14)',borderRadius:20,padding:22}}>
        <div style={{textAlign:'center',padding:'48px 16px'}}>
          <div style={{fontSize:36,marginBottom:14,opacity:.25}}>📋</div>
          <p style={{fontSize:15,fontWeight:700,color:'#F8FAFC',marginBottom:8}}>Selecione um agendamento</p>
          <p style={{fontSize:13,color:'#475569',lineHeight:1.6}}>Clique em um atendimento para ver detalhes.</p>
        </div>
      </div>
    )
    const sc=stCfg[sel.status]||stCfg.pendente
    const tf=fTel(sel.cliente_whatsapp||sel.cliente_telefone||'')
    const wC=wpp(sel,'c'),wL=wpp(sel,'l'),wW=wpp(sel,'w')
    const bsty={display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginTop:10}
    const dbtn=(extra:React.CSSProperties):React.CSSProperties=>({borderRadius:10,padding:'9px 10px',fontSize:11,fontWeight:700,cursor:'pointer',border:'1px solid',fontFamily:'inherit',whiteSpace:'nowrap' as const,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:4,transition:'opacity .15s',...extra})
    return(
      <div style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid rgba(148,163,184,.14)',borderRadius:20,padding:22}}>
        <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.10em',color:'#475569',marginBottom:16}}>Detalhes do agendamento</p>
        <div style={{width:56,height:56,borderRadius:'50%',background:G,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',margin:'0 auto 14px',boxShadow:'0 0 20px rgba(59,130,246,.22)'}}>{(sel.cliente_nome||'C').charAt(0).toUpperCase()}</div>
        <p style={{fontSize:18,fontWeight:800,color:'#F8FAFC',textAlign:'center',marginBottom:4}}>{sel.cliente_nome||'Cliente sem nome'}</p>
        <div style={{textAlign:'center',marginBottom:18}}>
          <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:999,whiteSpace:'nowrap' as const,lineHeight:'18px',background:sc.bg,color:sc.c,border:'1px solid '+sc.bd}}>{sc.t}</span>
        </div>
        <div style={{marginBottom:16,paddingBottom:16,borderBottom:'1px solid rgba(148,163,184,.07)'}}>
          <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.10em',color:'#475569',marginBottom:10}}>Contato</p>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
            <span style={{fontSize:12,color:'#64748B'}}>WhatsApp</span>
            <span style={{fontSize:12,fontWeight:700,color:'#CBD5E1'}}>{tf||'Nao informado'}</span>
          </div>
          <div style={bsty}>
            {wW
              ?<a href={wW} target="_blank" rel="noreferrer" style={{...dbtn({background:'rgba(37,211,102,.12)',borderColor:'rgba(37,211,102,.25)',color:'#25D366'}),gridColumn:'1/-1'}}>Abrir WhatsApp</a>
              :<button disabled style={{...dbtn({background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.10)',color:'#334155',cursor:'not-allowed'}),gridColumn:'1/-1'}}>Sem telefone</button>
            }
            <button onClick={()=>copiar(sel)} style={{...dbtn({background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.14)',color:'#94A3B8'}),gridColumn:'1/-1'}}>Copiar contato</button>
          </div>
        </div>
        <div style={{marginBottom:16,paddingBottom:16,borderBottom:'1px solid rgba(148,163,184,.07)'}}>
          <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.10em',color:'#475569',marginBottom:10}}>Atendimento</p>
          {[
            {l:'Servico',v:sel.servicos?.nome||'Nao informado',c:'#F8FAFC'},
            {l:'Profissional',v:sel.profissionais?.nome||'Nao informado',c:'#F8FAFC'},
            {l:'Data',v:fDF(sel.data_hora),c:'#F8FAFC',fs:11},
            {l:'Horario',v:fH(sel.data_hora),c:'#60A5FA'},
            ...(sel.servicos?.preco?[{l:'Valor',v:'R$ '+sel.servicos.preco,c:'#22C55E'}]:[]),
          ].map(({l,v,c,fs}:any)=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
              <span style={{fontSize:12,color:'#64748B'}}>{l}</span>
              <span style={{fontSize:fs||12,fontWeight:700,color:c,textAlign:'right',maxWidth:'60%'}}>{v}</span>
            </div>
          ))}
        </div>
        <div>
          <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.10em',color:'#475569',marginBottom:10}}>Acoes rapidas</p>
          <div style={bsty}>
            {wC&&(sel.status==='pendente'||!sel.status||sel.status==='retorno')&&<a href={wC} target="_blank" rel="noreferrer" style={dbtn({background:'rgba(34,197,94,.12)',borderColor:'rgba(34,197,94,.25)',color:'#22C55E'})}>Confirmar</a>}
            {wL&&<a href={wL} target="_blank" rel="noreferrer" style={dbtn({background:'rgba(245,158,11,.10)',borderColor:'rgba(245,158,11,.22)',color:'#FCD34D'})}>Lembrete</a>}
            {sel.status!=='compareceu'&&<button onClick={()=>updSt(sel.id,'compareceu')} style={dbtn({background:'rgba(34,197,94,.10)',borderColor:'rgba(34,197,94,.20)',color:'#4ADE80'})}>Compareceu</button>}
            {sel.status!=='faltou'&&<button onClick={()=>updSt(sel.id,'faltou')} style={dbtn({background:'rgba(239,68,68,.08)',borderColor:'rgba(239,68,68,.18)',color:'#F87171'})}>Faltou</button>}
            {sel.status!=='realizado'&&<button onClick={()=>updSt(sel.id,'realizado')} style={dbtn({background:'rgba(34,197,94,.08)',borderColor:'rgba(34,197,94,.16)',color:'#22C55E'})}>Realizado</button>}
            {sel.status!=='retorno'&&<button onClick={()=>updSt(sel.id,'retorno')} style={dbtn({background:'rgba(124,58,237,.10)',borderColor:'rgba(124,58,237,.22)',color:'#C4B5FD'})}>Retorno</button>}
            {sel.status!=='cancelado'&&<button onClick={()=>updSt(sel.id,'cancelado')} style={dbtn({background:'rgba(239,68,68,.06)',borderColor:'rgba(239,68,68,.14)',color:'#F87171'})}>Cancelar</button>}
          </div>
        </div>
      </div>
    )
  }

  if(loading)return(<div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}><p style={{color:'#475569',fontSize:14}}>Carregando...</p></div>)

  const btnP:React.CSSProperties={background:G,color:'#fff',border:'none',borderRadius:12,padding:'0 18px',height:40,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:6,whiteSpace:'nowrap',boxShadow:'0 4px 16px rgba(59,130,246,.22)',transition:'opacity .15s'}
  const btnS:React.CSSProperties={background:'rgba(15,23,42,.88)',color:'#CBD5E1',border:'1px solid rgba(148,163,184,.20)',borderRadius:12,padding:'0 16px',height:40,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',gap:6,transition:'all .15s'}

  return(
    <div style={{paddingBottom:80}}>
      {msg&&<div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:'rgba(15,23,42,.97)',border:'1px solid rgba(59,130,246,.30)',borderRadius:12,padding:'12px 24px',fontSize:13,fontWeight:600,color:'#F8FAFC',zIndex:200,boxShadow:'0 8px 32px rgba(0,0,0,.5)',pointerEvents:'none',whiteSpace:'nowrap'}}>{msg}</div>}

      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.03em',marginBottom:4}}>Agenda</h1>
          <p style={{fontSize:14,color:'#CBD5E1',lineHeight:1.5}}>Veja seus horarios, confirme clientes e acompanhe os atendimentos do dia.</p>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <Link href="/painel/agendamentos/novo" style={btnP}>+ Novo agendamento</Link>
          <button style={btnS} onClick={()=>toast('Funcao de bloqueio em breve!')}>Bloquear horario</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:22}}>
        {[
          {l:'Hoje',n:agsHj.length,c:'#60A5FA',bd:'rgba(59,130,246,.22)'},
          {l:'Confirmados',n:conf,c:'#4ADE80',bd:'rgba(34,197,94,.20)'},
          {l:'Pendentes',n:pend,c:'#FCD34D',bd:'rgba(245,158,11,.20)'},
        ].map(({l,n,c,bd})=>(
          <div key={l} style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid '+bd,borderRadius:16,padding:'16px 18px'}}>
            <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.10em',color:'#64748B',marginBottom:6}}>{l}</p>
            <p style={{fontSize:32,fontWeight:900,letterSpacing:'-0.04em',lineHeight:1,color:c}}>{n}</p>
          </div>
        ))}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:18,flexWrap:'wrap'}}>
        {(['hoje','semana'] as const).map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{height:36,padding:'0 16px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',border:'1px solid '+(view===v?'rgba(59,130,246,.35)':'rgba(148,163,184,.16)'),background:view===v?'rgba(59,130,246,.14)':'transparent',color:view===v?'#60A5FA':'#64748B',fontFamily:'inherit',transition:'all .15s',whiteSpace:'nowrap' as const}}>
            {v==='hoje'?'Hoje':'Semana'}
          </button>
        ))}
        {view==='hoje'&&(
          <div style={{display:'flex',gap:6,flex:1,flexWrap:'wrap'}}>
            {['todos','pendente','confirmado','realizado','cancelado'].map(f=>(
              <button key={f} onClick={()=>setFSt(f)} style={{height:32,padding:'0 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt===f?'rgba(59,130,246,.28)':'rgba(148,163,184,.14)'),background:fSt===f?'rgba(59,130,246,.12)':'transparent',color:fSt===f?'#60A5FA':'#64748B',fontFamily:'inherit',transition:'all .15s',whiteSpace:'nowrap' as const}}>
                {f==='todos'?'Todos':stCfg[f]?.t||f}
              </button>
            ))}
          </div>
        )}
        <select value={fPr} onChange={e=>setFPr(e.target.value)} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.18)',borderRadius:10,padding:'0 12px',height:34,fontSize:12,color:'#CBD5E1',fontFamily:'inherit',cursor:'pointer',outline:'none',marginLeft:'auto'}}>
          <option value="todos">Todos profissionais</option>
          {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>

      {view==='hoje'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:18}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',margin:'0 0 8px',letterSpacing:'.06em'}}>Proximos atendimentos de hoje</p>
            {agsF.length===0?(
              <div style={{textAlign:'center',padding:'50px 20px',background:'linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1px solid rgba(148,163,184,.10)',borderRadius:18}}>
                <div style={{fontSize:32,marginBottom:12,opacity:.3}}>📅</div>
                <h3 style={{fontSize:16,fontWeight:800,color:'#F8FAFC',marginBottom:8}}>Nenhum atendimento para hoje</h3>
                <p style={{fontSize:13,color:'#64748B',marginBottom:20,lineHeight:1.6}}>Quando seus clientes agendarem, os horarios aparecerao aqui.</p>
                <Link href="/painel/agendamentos/novo" style={{...btnP,display:'inline-flex'}}>+ Novo agendamento</Link>
              </div>
            ):agsF.map(a=>{
              const sc=stCfg[a.status]||stCfg.pendente
              const tf=fTel(a.cliente_whatsapp||a.cliente_telefone||'')
              const isSel=sel?.id===a.id
              const wC=wpp(a,'c'),wW=wpp(a,'w')
              return(
                <div key={a.id} onClick={()=>setSel(a)} style={{background:'linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid '+(isSel?'rgba(59,130,246,.55)':'rgba(148,163,184,.13)'),borderRadius:16,padding:'14px 16px',marginBottom:8,cursor:'pointer',transition:'all .15s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap'}}>
                    <span style={{display:'inline-flex',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.22)',borderRadius:8,padding:'4px 10px',fontSize:14,fontWeight:800,color:'#60A5FA',flexShrink:0}}>{fH(a.data_hora)}</span>
                    <span style={{fontSize:14,fontWeight:800,color:'#F8FAFC',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.cliente_nome||'—'}</span>
                    <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:999,whiteSpace:'nowrap',flexShrink:0,lineHeight:'18px',background:sc.bg,color:sc.c,border:'1px solid '+sc.bd}}>{sc.t}</span>
                  </div>
                  {tf&&<p style={{fontSize:12,color:'#CBD5E1',marginBottom:4}}>📱 {tf}</p>}
                  <p style={{fontSize:12,color:'#94A3B8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:8}}>
                    {a.servicos?.nome||'Servico nao informado'}
                    {a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}
                    {a.servicos?.preco?<span style={{color:'#22C55E'}}> · R$ {a.servicos.preco}</span>:null}
                  </p>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}} onClick={e=>e.stopPropagation()}>
                    {wW&&<a href={wW} target="_blank" rel="noreferrer" style={{borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer',border:'1px solid rgba(37,211,102,.22)',background:'rgba(37,211,102,.10)',color:'#25D366',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:3}}>WhatsApp</a>}
                    {wC&&(a.status==='pendente'||!a.status)&&<a href={wC} target="_blank" rel="noreferrer" style={{borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer',border:'1px solid rgba(34,197,94,.22)',background:'rgba(34,197,94,.10)',color:'#22C55E',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:3}}>Confirmar</a>}
                    <div style={{position:'relative',display:'inline-block'}} ref={mnu===a.id?mnuRef:undefined}>
                      <button onClick={()=>setMnu(mnu===a.id?null:a.id)} style={{borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer',border:'1px solid rgba(148,163,184,.16)',background:'rgba(255,255,255,.04)',color:'#64748B',fontFamily:'inherit'}}>Mais</button>
                      {mnu===a.id&&(
                        <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,background:'rgba(10,15,25,.98)',border:'1px solid rgba(148,163,184,.20)',borderRadius:14,padding:8,minWidth:170,zIndex:50,boxShadow:'0 20px 60px rgba(0,0,0,.6)'}}>
                          {[
                            {l:'Copiar contato',fn:()=>copiar(a)},
                            {l:'Compareceu',fn:()=>updSt(a.id,'compareceu'),skip:a.status==='compareceu'},
                            {l:'Faltou',fn:()=>updSt(a.id,'faltou'),skip:a.status==='faltou'},
                            {l:'Realizado',fn:()=>updSt(a.id,'realizado'),skip:a.status==='realizado'},
                            {l:'Retorno',fn:()=>updSt(a.id,'retorno'),skip:a.status==='retorno'},
                            {l:'Confirmado',fn:()=>updSt(a.id,'confirmado'),skip:a.status==='confirmado'},
                            {l:'Cancelar',fn:()=>updSt(a.id,'cancelado'),skip:a.status==='cancelado'},
                          ].filter(i=>!i.skip).map(({l,fn})=>(
                            <button key={l} onClick={fn} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',color:'#CBD5E1',border:'none',background:'none',fontFamily:'inherit',width:'100%',textAlign:'left',whiteSpace:'nowrap'}}>
                              {l}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view==='semana'&&(
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
            <p style={{fontSize:14,fontWeight:700,color:'#CBD5E1'}}>{fDC(dS[0])} - {fDC(dS[6])} {dS[6].getFullYear()}</p>
            <div style={{display:'flex',gap:8}}>
              {[{l:'Anterior',fn:()=>setSemOff(s=>s-1)},{l:'Hoje',fn:()=>setSemOff(0)},{l:'Proxima',fn:()=>setSemOff(s=>s+1)}].map(({l,fn})=>(
                <button key={l} onClick={fn} style={{...btnS,height:34,padding:'0 14px',fontSize:12}}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5}}>
            {dS.map((d,i)=>{
              const ds=d.toISOString().split('T')[0]
              const eh=ds===hoje
              const it=ags.filter(a=>{
                const ad=new Date(a.data_hora).toISOString().split('T')[0]
                return ad===ds&&(fPr==='todos'||a.profissional_id===fPr)
              })
              return(
                <div key={i} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.10)',borderRadius:12,overflow:'hidden',minHeight:130}}>
                  <div style={{padding:'8px 6px',textAlign:'center',fontSize:10,fontWeight:700,color:eh?'#60A5FA':'#64748B',textTransform:'uppercase',borderBottom:'1px solid rgba(148,163,184,.07)',background:eh?'rgba(59,130,246,.14)':'rgba(59,130,246,.04)'}}>
                    <div>{['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][d.getDay()]}</div>
                    <div style={{fontSize:14,fontWeight:800,color:'#F8FAFC',marginTop:2}}>{d.getDate()}</div>
                  </div>
                  {it.map(a=>(
                    <div key={a.id} onClick={()=>{setSel(a);setView('hoje')}} style={{background:'rgba(59,130,246,.10)',borderRadius:6,padding:'4px 6px',margin:4,fontSize:10,color:'#93C5FD',cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',border:'1px solid rgba(59,130,246,.15)',lineHeight:1.5}} title={a.cliente_nome+' '+fH(a.data_hora)}>
                      {fH(a.data_hora)} {(a.cliente_nome||'').split(' ')[0]}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
