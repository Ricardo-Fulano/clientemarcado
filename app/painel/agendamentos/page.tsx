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
function fDataFull(dh:string){return new Date(dh).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}
function fDataCurta(d:Date){return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
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

  useEffect(()=>{ load() },[])

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

  // Shared styles
  const card:React.CSSProperties={background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid rgba(148,163,184,.13)',borderRadius:18,padding:'16px 18px',marginBottom:8,cursor:'pointer',transition:'border-color .15s'}
  const btnP:React.CSSProperties={background:G,color:'#fff',border:'none',borderRadius:12,padding:'0 16px',height:38,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:5,whiteSpace:'nowrap',transition:'opacity .15s'}
  const btnS:React.CSSProperties={background:'rgba(15,23,42,.88)',color:'#CBD5E1',border:'1px solid rgba(148,163,184,.20)',borderRadius:12,padding:'0 14px',height:38,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',transition:'all .15s'}
  const badge=(sc:any):React.CSSProperties=>({fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:999,whiteSpace:'nowrap',flexShrink:0,lineHeight:'18px',background:sc.bg,color:sc.c,border:'1px solid '+sc.bd})
  const detBtn=(extra:React.CSSProperties):React.CSSProperties=>({borderRadius:10,padding:'9px 10px',fontSize:11,fontWeight:700,cursor:'pointer',border:'1px solid',fontFamily:'inherit',whiteSpace:'nowrap',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:4,transition:'opacity .15s',...extra})

  function PainelDetalhe(){
    if(!sel)return(
      <div style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid rgba(148,163,184,.13)',borderRadius:20,padding:24,height:'100%',minHeight:400}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',padding:'48px 16px',textAlign:'center',gap:12}}>
          <div style={{fontSize:40,opacity:.2}}>📋</div>
          <p style={{fontSize:15,fontWeight:700,color:'#F8FAFC'}}>Selecione um agendamento</p>
          <p style={{fontSize:13,color:'#475569',lineHeight:1.6}}>Clique em um atendimento da lista para ver detalhes e acoes rapidas.</p>
        </div>
      </div>
    )
    const sc=stCfg[sel.status]||stCfg.pendente
    const tf=fTel(sel.cliente_whatsapp||sel.cliente_telefone||'')
    const wC=wpp(sel,'c'),wL=wpp(sel,'l'),wW=wpp(sel,'w')
    const grid2:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginTop:8}
    const secStyle:React.CSSProperties={marginBottom:18,paddingBottom:18,borderBottom:'1px solid rgba(148,163,184,.07)'}
    const secTitle:React.CSSProperties={fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.10em',color:'#475569',marginBottom:10}
    const rowStyle:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}
    return(
      <div style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid rgba(124,58,237,.22)',borderRadius:20,padding:22,position:'sticky',top:0}}>
        <p style={secTitle}>Detalhes do agendamento</p>
        <div style={{width:52,height:52,borderRadius:'50%',background:G,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#fff',margin:'0 auto 12px',boxShadow:'0 0 20px rgba(59,130,246,.22)'}}>{(sel.cliente_nome||'C').charAt(0).toUpperCase()}</div>
        <p style={{fontSize:17,fontWeight:800,color:'#F8FAFC',textAlign:'center',marginBottom:4}}>{sel.cliente_nome||'Cliente sem nome'}</p>
        <div style={{textAlign:'center',marginBottom:16}}><span style={badge(sc)}>{sc.t}</span></div>

        <div style={secStyle}>
          <p style={secTitle}>Contato</p>
          <div style={rowStyle}><span style={{fontSize:12,color:'#64748B'}}>WhatsApp</span><span style={{fontSize:12,fontWeight:700,color:'#CBD5E1'}}>{tf||'Nao informado'}</span></div>
          <div style={grid2}>
            {wW
              ?<a href={wW} target="_blank" rel="noreferrer" style={{...detBtn({background:'rgba(37,211,102,.12)',borderColor:'rgba(37,211,102,.25)',color:'#25D366'}),gridColumn:'1/-1'}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Abrir WhatsApp
              </a>
              :<button disabled style={{...detBtn({background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.10)',color:'#334155',cursor:'not-allowed'}),gridColumn:'1/-1'}}>Sem telefone</button>
            }
            <button onClick={()=>copiar(sel)} style={{...detBtn({background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.14)',color:'#94A3B8'}),gridColumn:'1/-1'}}>📋 Copiar contato</button>
          </div>
        </div>

        <div style={secStyle}>
          <p style={secTitle}>Atendimento</p>
          {[
            {l:'Servico',v:sel.servicos?.nome||'Nao informado',c:'#F8FAFC'},
            {l:'Profissional',v:sel.profissionais?.nome||'Nao informado',c:'#F8FAFC'},
            {l:'Data',v:fDataFull(sel.data_hora),c:'#CBD5E1',fs:11},
            {l:'Horario',v:fH(sel.data_hora),c:'#60A5FA'},
            ...(sel.servicos?.preco?[{l:'Valor',v:'R$ '+sel.servicos.preco,c:'#22C55E'}]:[]),
          ].map(({l,v,c,fs}:any)=>(
            <div key={l} style={rowStyle}>
              <span style={{fontSize:12,color:'#64748B'}}>{l}</span>
              <span style={{fontSize:fs||12,fontWeight:700,color:c,textAlign:'right',maxWidth:'58%'}}>{v}</span>
            </div>
          ))}
        </div>

        <div>
          <p style={secTitle}>Acoes rapidas</p>
          <div style={grid2}>
            {wC&&(sel.status==='pendente'||!sel.status||sel.status==='retorno')&&<a href={wC} target="_blank" rel="noreferrer" style={detBtn({background:'rgba(34,197,94,.12)',borderColor:'rgba(34,197,94,.25)',color:'#22C55E'})}>✓ Confirmar</a>}
            {wL&&<a href={wL} target="_blank" rel="noreferrer" style={detBtn({background:'rgba(245,158,11,.10)',borderColor:'rgba(245,158,11,.22)',color:'#FCD34D'})}>🔔 Lembrete</a>}
            {sel.status!=='compareceu'&&<button onClick={()=>updSt(sel.id,'compareceu')} style={detBtn({background:'rgba(34,197,94,.10)',borderColor:'rgba(34,197,94,.20)',color:'#4ADE80'})}>✓ Compareceu</button>}
            {sel.status!=='faltou'&&<button onClick={()=>updSt(sel.id,'faltou')} style={detBtn({background:'rgba(239,68,68,.08)',borderColor:'rgba(239,68,68,.18)',color:'#F87171'})}>✗ Faltou</button>}
            {sel.status!=='realizado'&&<button onClick={()=>updSt(sel.id,'realizado')} style={detBtn({background:'rgba(34,197,94,.08)',borderColor:'rgba(34,197,94,.16)',color:'#22C55E'})}>★ Realizado</button>}
            {sel.status!=='retorno'&&<button onClick={()=>updSt(sel.id,'retorno')} style={detBtn({background:'rgba(124,58,237,.10)',borderColor:'rgba(124,58,237,.22)',color:'#C4B5FD'})}>↩ Retorno</button>}
            {sel.status!=='cancelado'&&<button onClick={()=>updSt(sel.id,'cancelado')} style={detBtn({background:'rgba(239,68,68,.06)',borderColor:'rgba(239,68,68,.14)',color:'#F87171'})}>✕ Cancelar</button>}
          </div>
        </div>
      </div>
    )
  }

  if(loading)return(<div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}><p style={{color:'#475569',fontSize:14}}>Carregando...</p></div>)

  return(
    <div style={{paddingBottom:80}}>
      {msg&&<div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',background:'rgba(15,23,42,.97)',border:'1px solid rgba(59,130,246,.30)',borderRadius:12,padding:'12px 24px',fontSize:13,fontWeight:600,color:'#F8FAFC',zIndex:200,boxShadow:'0 8px 32px rgba(0,0,0,.5)',pointerEvents:'none',whiteSpace:'nowrap'}}>{msg}</div>}

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.03em',marginBottom:4}}>Agenda</h1>
          <p style={{fontSize:14,color:'#CBD5E1',lineHeight:1.5}}>Veja seus horarios, confirme clientes e acompanhe os atendimentos do dia.</p>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <Link href="/painel/agendamentos/novo" style={{...btnP,height:40,fontSize:13}}>+ Novo agendamento</Link>
          <button style={{...btnS,height:40,fontSize:13}} onClick={()=>toast('Funcao de bloqueio em breve!')}>Bloquear horario</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:22}}>
        {[
          {l:'Hoje',n:agsHj.length,c:'#60A5FA',bd:'rgba(59,130,246,.25)',ic:'📅'},
          {l:'Confirmados',n:conf,c:'#4ADE80',bd:'rgba(34,197,94,.22)',ic:'✓'},
          {l:'Pendentes',n:pend,c:'#FCD34D',bd:'rgba(245,158,11,.22)',ic:'⏳'},
        ].map(({l,n,c,bd,ic})=>(
          <div key={l} style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid '+bd,borderRadius:16,padding:'16px 20px',display:'flex',alignItems:'center',gap:14}}>
            <span style={{fontSize:22,opacity:.7}}>{ic}</span>
            <div>
              <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.10em',color:'#64748B',marginBottom:4}}>{l}</p>
              <p style={{fontSize:28,fontWeight:900,letterSpacing:'-0.04em',lineHeight:1,color:c}}>{n}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:18,flexWrap:'wrap'}}>
        {(['hoje','semana'] as const).map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{height:36,padding:'0 16px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',border:'1px solid '+(view===v?'rgba(59,130,246,.35)':'rgba(148,163,184,.16)'),background:view===v?'rgba(59,130,246,.14)':'transparent',color:view===v?'#60A5FA':'#64748B',fontFamily:'inherit',transition:'all .15s',whiteSpace:'nowrap'}}>
            {v==='hoje'?'Hoje':'Semana'}
          </button>
        ))}
        {view==='hoje'&&(
          <div style={{display:'flex',gap:6,flex:1,overflowX:'auto',flexWrap:'nowrap'}}>
            {['todos','pendente','confirmado','realizado','cancelado'].map(f=>(
              <button key={f} onClick={()=>setFSt(f)} style={{height:32,padding:'0 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt===f?'rgba(59,130,246,.28)':'rgba(148,163,184,.14)'),background:fSt===f?'rgba(59,130,246,.12)':'transparent',color:fSt===f?'#60A5FA':'#64748B',fontFamily:'inherit',transition:'all .15s',whiteSpace:'nowrap',flexShrink:0}}>
                {f==='todos'?'Todos':stCfg[f]?.t||f}
              </button>
            ))}
          </div>
        )}
        <select value={fPr} onChange={e=>setFPr(e.target.value)} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.18)',borderRadius:10,padding:'0 12px',height:34,fontSize:12,color:'#CBD5E1',fontFamily:'inherit',cursor:'pointer',outline:'none',marginLeft:'auto',flexShrink:0}}>
          <option value="todos">Todos profissionais</option>
          {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>

      {/* ABA HOJE */}
      {view==='hoje'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:20}}>
          {/* DESKTOP: 2 colunas via CSS injection */}
          <style>{`@media(min-width:1100px){.ag-2col{grid-template-columns:1fr 400px!important}}`}</style>
          <div className="ag-2col" style={{display:'grid',gridTemplateColumns:'1fr',gap:20}}>

            {/* Lista */}
            <div>
              <p style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase',margin:'0 0 10px',letterSpacing:'.06em'}}>
                {agsF.length>0?'Proximos atendimentos de hoje':'Nenhum atendimento'}
              </p>
              {agsF.length===0?(
                <div style={{textAlign:'center',padding:'50px 20px',background:'linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1px solid rgba(148,163,184,.10)',borderRadius:18}}>
                  <div style={{fontSize:32,marginBottom:12,opacity:.3}}>📅</div>
                  <h3 style={{fontSize:16,fontWeight:800,color:'#F8FAFC',marginBottom:8}}>Nenhum atendimento para hoje</h3>
                  <p style={{fontSize:13,color:'#64748B',marginBottom:20,lineHeight:1.6}}>Quando seus clientes agendarem, os horarios aparecerao aqui.</p>
                  <Link href="/painel/agendamentos/novo" style={{...btnP,display:'inline-flex',height:40,fontSize:13}}>+ Novo agendamento</Link>
                </div>
              ):agsF.map(a=>{
                const sc=stCfg[a.status]||stCfg.pendente
                const tf=fTel(a.cliente_whatsapp||a.cliente_telefone||'')
                const isSel=sel?.id===a.id
                const wW=wpp(a,'w')
                const wC=wpp(a,'c')
                return(
                  <div key={a.id} onClick={()=>setSel(a)} style={{...card,borderColor:isSel?'rgba(59,130,246,.50)':'rgba(148,163,184,.13)',background:isSel?'radial-gradient(circle at top left,rgba(59,130,246,.10),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))':card.background}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                      <span style={{display:'inline-flex',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.22)',borderRadius:8,padding:'4px 10px',fontSize:14,fontWeight:800,color:'#60A5FA',flexShrink:0}}>{fH(a.data_hora)}</span>
                      <span style={{fontSize:14,fontWeight:800,color:'#F8FAFC',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.cliente_nome||'—'}</span>
                      <span style={badge(sc)}>{sc.t}</span>
                    </div>
                    {tf&&<p style={{fontSize:12,color:'#CBD5E1',marginBottom:4}}>📱 {tf}</p>}
                    <p style={{fontSize:12,color:'#94A3B8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:10}}>
                      {a.servicos?.nome||'Servico nao informado'}
                      {a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}
                      {a.servicos?.preco?<span style={{color:'#22C55E'}}> · R$ {a.servicos.preco}</span>:null}
                    </p>
                    {/* Mobile actions */}
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}} onClick={e=>e.stopPropagation()}>
                      {wW&&<a href={wW} target="_blank" rel="noreferrer" style={{borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer',border:'1px solid rgba(37,211,102,.22)',background:'rgba(37,211,102,.10)',color:'#25D366',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:3}}>WhatsApp</a>}
                      {wC&&(a.status==='pendente'||!a.status)&&<a href={wC} target="_blank" rel="noreferrer" style={{borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer',border:'1px solid rgba(34,197,94,.22)',background:'rgba(34,197,94,.10)',color:'#22C55E',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:3}}>✓ Confirmar</a>}
                      <div style={{position:'relative',display:'inline-block'}} ref={mnu===a.id?mnuRef:undefined}>
                        <button onClick={()=>setMnu(mnu===a.id?null:a.id)} style={{borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:700,cursor:'pointer',border:'1px solid rgba(148,163,184,.16)',background:'rgba(255,255,255,.04)',color:'#64748B',fontFamily:'inherit'}}>Mais</button>
                        {mnu===a.id&&(
                          <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,background:'rgba(10,15,25,.98)',border:'1px solid rgba(148,163,184,.20)',borderRadius:14,padding:8,minWidth:170,zIndex:50,boxShadow:'0 20px 60px rgba(0,0,0,.6)'}}>
                            {[
                              {l:'📋 Copiar contato',fn:()=>copiar(a)},
                              {l:'✓ Compareceu',fn:()=>updSt(a.id,'compareceu'),skip:a.status==='compareceu'},
                              {l:'✗ Faltou',fn:()=>updSt(a.id,'faltou'),skip:a.status==='faltou'},
                              {l:'★ Realizado',fn:()=>updSt(a.id,'realizado'),skip:a.status==='realizado'},
                              {l:'↩ Retorno',fn:()=>updSt(a.id,'retorno'),skip:a.status==='retorno'},
                              {l:'✓ Confirmado',fn:()=>updSt(a.id,'confirmado'),skip:a.status==='confirmado'},
                              {l:'✕ Cancelar',fn:()=>updSt(a.id,'cancelado'),skip:a.status==='cancelado'},
                            ].filter((i:any)=>!i.skip).map(({l,fn}:any)=>(
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

            {/* Painel Detalhes - só desktop via CSS */}
            <style>{`@media(max-width:1099px){.det-panel{display:none!important}}`}</style>
            <div className="det-panel">
              <PainelDetalhe/>
            </div>
          </div>
        </div>
      )}

      {/* ABA SEMANA */}
      {view==='semana'&&(
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
            <p style={{fontSize:14,fontWeight:700,color:'#CBD5E1'}}>{fDataCurta(dS[0])} - {fDataCurta(dS[6])} {dS[6].getFullYear()}</p>
            <div style={{display:'flex',gap:8}}>
              {[{l:'Anterior',fn:()=>setSemOff(s=>s-1)},{l:'Hoje',fn:()=>setSemOff(0)},{l:'Proxima',fn:()=>setSemOff(s=>s+1)}].map(({l,fn})=>(
                <button key={l} onClick={fn} style={{...btnS,height:34,padding:'0 12px',fontSize:12}}>{l}</button>
              ))}
            </div>
          </div>

          {/* Desktop: grade 7 colunas */}
          <style>{`@media(max-width:768px){.sem-desktop{display:none!important}}@media(min-width:769px){.sem-mobile{display:none!important}}`}</style>

          <div className="sem-desktop" style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5}}>
            {dS.map((d,i)=>{
              const ds=d.toISOString().split('T')[0]
              const eh=ds===hoje
              const it=ags.filter(a=>{
                const ad=new Date(a.data_hora).toISOString().split('T')[0]
                return ad===ds&&(fPr==='todos'||a.profissional_id===fPr)
              })
              return(
                <div key={i} style={{background:'rgba(15,23,42,.88)',border:'1px solid '+(eh?'rgba(59,130,246,.25)':'rgba(148,163,184,.10)'),borderRadius:12,overflow:'hidden',minHeight:130}}>
                  <div style={{padding:'8px 6px',textAlign:'center',fontSize:10,fontWeight:700,color:eh?'#60A5FA':'#64748B',textTransform:'uppercase',borderBottom:'1px solid rgba(148,163,184,.07)',background:eh?'rgba(59,130,246,.14)':'rgba(59,130,246,.04)'}}>
                    <div>{['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][d.getDay()]}</div>
                    <div style={{fontSize:14,fontWeight:800,color:eh?'#60A5FA':'#F8FAFC',marginTop:2}}>{d.getDate()}</div>
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

          {/* Mobile: lista por dia */}
          <div className="sem-mobile" style={{display:'flex',flexDirection:'column',gap:16}}>
            {dS.map((d,i)=>{
              const ds=d.toISOString().split('T')[0]
              const eh=ds===hoje
              const it=ags.filter(a=>{
                const ad=new Date(a.data_hora).toISOString().split('T')[0]
                return ad===ds&&(fPr==='todos'||a.profissional_id===fPr)
              })
              return(
                <div key={i}>
                  <p style={{fontSize:12,fontWeight:700,color:eh?'#60A5FA':'#94A3B8',marginBottom:8,textTransform:'capitalize',paddingBottom:6,borderBottom:'1px solid rgba(59,130,246,.12)'}}>
                    {d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})}{eh?' · Hoje':''}
                  </p>
                  {it.length===0
                    ?<p style={{fontSize:12,color:'#334155',padding:'8px 0'}}>Nenhum atendimento</p>
                    :it.map(a=>{
                      const sc=stCfg[a.status]||stCfg.pendente
                      return(
                        <div key={a.id} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.12)',borderRadius:12,padding:'12px 14px',marginBottom:6,display:'flex',gap:12,alignItems:'center'}}>
                          <span style={{fontSize:13,fontWeight:800,color:'#60A5FA',flexShrink:0,minWidth:42}}>{fH(a.data_hora)}</span>
                          <div style={{minWidth:0,flex:1}}>
                            <p style={{fontSize:13,fontWeight:700,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.cliente_nome||'—'}</p>
                            <p style={{fontSize:11,color:'#94A3B8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.servicos?.nome||''}{a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}</p>
                          </div>
                          <span style={badge(sc)}>{sc.t}</span>
                        </div>
                      )
                    })
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
