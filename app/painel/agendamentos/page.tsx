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
.bdy{max-width:1200px;margin:0 auto;padding:24px 28px 80px;width:100%;box-sizing:border-box}
.ag-grid{display:grid;grid-template-columns:1fr;gap:16px}
.det-col{display:none}
.kpi-g{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.hdr-btns{display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0}
.fil-wrap{margin:0 -14px 14px;overflow:hidden}.fil-scroll{display:flex;align-items:center;gap:8px;margin-bottom:14px;width:100%;max-width:100%;flex-wrap:wrap}.fil-g1{display:flex;gap:8px;flex-wrap:nowrap}.fil-g2{display:flex;gap:8px;flex-wrap:wrap}.fil-g3{width:100%}@media(min-width:768px){.fil-scroll{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.fil-g1,.fil-g2{flex-wrap:nowrap}}
.fil-scroll::-webkit-scrollbar{display:none}
.ag-item{background:linear-gradient(145deg,rgba(11,22,40,.98),rgba(8,16,28,.99));border:1px solid rgba(59,130,246,.18);border-radius:20px;padding:16px;margin-bottom:12px;cursor:pointer;transition:all .15s}
.ag-item:hover{border-color:rgba(59,130,246,.35)}
.ag-item.sel{border-color:rgba(59,130,246,.55);background:radial-gradient(circle at top left,rgba(59,130,246,.09),transparent 60%),linear-gradient(145deg,rgba(11,22,40,.98),rgba(8,16,28,.99))}
.mnu-item{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;color:#CBD5E1;border:none;background:none;font-family:inherit;width:100%;text-align:left;transition:background .1s}
.mnu-item:hover{background:rgba(255,255,255,.06)}
.card-btns{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.card-btn{border-radius:9px;padding:6px 11px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;border:1px solid transparent;transition:all .12s}
.conf-area{margin-top:10px;padding-top:10px;border-top:1px solid rgba(148,163,184,.10)}
.conf-btns{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.conf-btns a,.conf-btns button{border-radius:9px;padding:6px 11px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid transparent;font-family:inherit;display:inline-flex;align-items:center;gap:4px;flex:1;justify-content:center;min-height:38px}
.sem-card{background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:16px;padding:16px;cursor:pointer;transition:all .15s}
.sem-card:hover{border-color:rgba(148,163,184,.24)}
.sem-card.hoje-card{border-color:rgba(59,130,246,.35)}
.sem-card.sel-card{border-color:rgba(59,130,246,.55);box-shadow:0 0 20px rgba(59,130,246,.15)}
.sem-det-item{background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.12);border-radius:12px;padding:12px 14px;margin-bottom:6px;display:flex;gap:12px;align-items:flex-start}
.bs-ovl{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:60;opacity:0;pointer-events:none;transition:opacity .25s}
.bs-ovl.open{opacity:1;pointer-events:auto}
.bs{position:fixed;bottom:0;left:0;right:0;background:#0B1628;border-top:1px solid rgba(255,255,255,.10);border-radius:22px 22px 0 0;padding:24px 24px 36px;z-index:61;transform:translateY(100%);transition:transform .28s ease;max-height:82vh;overflow-y:auto;box-sizing:border-box}
.bs.open{transform:translateY(0)}
.bs-handle{width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;margin:0 auto 20px}
.bs-item{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;font-size:14px;font-weight:500;background:none;border-left:none;border-right:none;border-top:none;font-family:inherit;width:100%;text-align:left;min-height:48px}
.bs-item:last-child{border-bottom:none}
.bs-label{font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.08em;margin:14px 0 6px}
.bl-ovl{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(8px);z-index:80;opacity:0;pointer-events:none;transition:opacity .24s ease}
.bl-ovl.open{opacity:1;pointer-events:auto}
.bl-modal{position:fixed;z-index:90;background:linear-gradient(145deg,#0B1628,#101B2D);border:1px solid rgba(59,130,246,.25);box-shadow:0 24px 80px rgba(0,0,0,.55),0 0 40px rgba(59,130,246,.12);color:#F8FAFC;overflow-y:auto;transition:transform .24s ease,opacity .24s ease;pointer-events:none;opacity:0}
.bl-modal.open{pointer-events:auto;opacity:1}
.bl-handle{width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;margin:0 auto 20px}
.bl-grid{display:grid;gap:12px}
.bl-actions{display:flex;gap:10px;margin-top:4px}
@media(min-width:768px){.bl-modal{left:50%;top:50%;bottom:auto;width:min(92vw,560px);max-height:86vh;border-radius:28px;padding:26px;transform:translate(-50%,-46%) scale(.96)}.bl-modal.open{transform:translate(-50%,-50%) scale(1)}.bl-grid{grid-template-columns:1fr 1fr}.bl-actions{flex-direction:row}.bl-handle{display:none}}
@media(max-width:767px){.bl-modal{left:0;right:0;bottom:0;width:100%;max-height:88vh;border-radius:26px 26px 0 0;padding:22px;transform:translateY(105%);opacity:1}.bl-modal.open{transform:translateY(0)}.bl-grid{grid-template-columns:1fr}.bl-actions{flex-direction:column}}
@media(min-width:1100px){.ag-grid{grid-template-columns:1fr 360px}.det-col{display:block}}
@media(max-width:1023px){
  .bdy{padding:14px 14px 80px!important;max-width:100%!important;width:100%!important;overflow-x:hidden!important}
  .kpi-g{grid-template-columns:repeat(3,1fr)!important;gap:6px!important}
  .hdr-btns{display:grid!important;grid-template-columns:1fr 1fr;gap:8px;width:100%}
  .hdr-btns a,.hdr-btns button{width:100%;justify-content:center;min-height:48px!important}
  .ag-item{border-radius:20px!important;padding:16px!important}
  .card-btns{display:grid!important;grid-template-columns:1fr 1fr!important;gap:6px!important}
  .card-btn{justify-content:center!important;min-height:40px!important}
  .conf-btns{display:grid!important;grid-template-columns:1fr 1fr!important}
}
@media(max-width:480px){
  .kpi-g{grid-template-columns:repeat(3,1fr)!important}
}
`


const confCfg: Record<string,{t:string,bg:string,c:string}> = {
  pendente:         {t:'Aguardando confirmação',bg:'rgba(245,158,11,.12)',c:'#FCD34D'},
  mensagem_enviada: {t:'Mensagem enviada',      bg:'rgba(59,130,246,.12)', c:'#60A5FA'},
  confirmado:       {t:'Confirmado',            bg:'rgba(34,197,94,.12)',  c:'#4ADE80'},
  sem_resposta:     {t:'Sem resposta',          bg:'rgba(245,158,11,.12)',c:'#FCD34D'},
  nao_comparece:    {t:'Não vai comparecer',    bg:'rgba(239,68,68,.12)',  c:'#F87171'},
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
  const [bsAg,setBsAg]=useState<any>(null)
  const [showBloqueio,setShowBloqueio]=useState(false)
  const [bData,setBData]=useState('')
  const [bHoraIni,setBHoraIni]=useState('')
  const [bHoraFim,setBHoraFim]=useState('')
  const [bProfId,setBProfId]=useState('')
  const [bMotivo,setBMotivo]=useState('')
  const [salvandoBloqueio,setSalvandoBloqueio]=useState(false)
  const [bloqueios,setBloqueios]=useState<any[]>([])

  async function salvarBloqueio(){
    if(!bData||!bHoraIni||!bHoraFim){toast('Preencha data e horários.');return}
    if(bHoraFim<=bHoraIni){toast('Horário final deve ser maior que o inicial.');return}
    setSalvandoBloqueio(true)
    const{data:{user}}=await supabase.auth.getUser()
    if(!user){toast('Sessao expirada. Faca login novamente.');setSalvandoBloqueio(false);return}
    const{error}=await supabase.from('bloqueios_agenda').insert({
      user_id:user.id,data:bData,horario_inicio:bHoraIni,
      horario_fim:bHoraFim,profissional_id:bProfId||null,motivo:bMotivo||null
    })
    if(error){console.error('Erro ao bloquear horario:',error);toast('Erro ao bloquear horario.');setSalvandoBloqueio(false);return}
    const{data:bl}=await supabase.from('bloqueios_agenda').select('*').eq('user_id',user.id).order('data',{ascending:true})
    setBloqueios(bl||[])
    toast('Horário bloqueado com sucesso.')
    setShowBloqueio(false);setBData('');setBHoraIni('');setBHoraFim('');setBMotivo('');setBProfId('')
    setSalvandoBloqueio(false)
  }

  async function updConf(id:string, status:string){
    await supabase.from('agendamentos').update({
      confirmacao_status: status,
      confirmacao_atualizada_em: new Date().toISOString(),
    }).eq('id',id)
    setAgs(prev=>prev.map(a=>a.id===id?{...a,confirmacao_status:status,confirmacao_atualizada_em:new Date().toISOString()}:a))
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

  function resgatarCliente(a:any){
    const tel=gTel(a)
    if(!tel){toast('Cliente sem WhatsApp cadastrado.');return}
    const ph=tel.startsWith('55')?tel:'55'+tel
    const msg=encodeURIComponent('Ola, tudo bem? Faz alguns dias que nao vemos voce por aqui. Quer que eu veja um horario disponivel para continuarmos seu atendimento?')
    window.open('https://wa.me/'+ph+'?text='+msg,'_blank')
  }
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
    const{data:bl}=await supabase.from('bloqueios_agenda').select('*').eq('user_id',user.id).order('data',{ascending:true})
    setBloqueios(bl||[])
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
        <div style={{fontSize:32,opacity:.2,color:"#94A3B8"}}>—</div>
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
            <button onClick={()=>copiar(sel)} style={{...dBtn({background:'rgba(255,255,255,.04)',borderColor:'rgba(148,163,184,.14)',color:'#94A3B8'}),gridColumn:'1/-1'}}>Copiar contato</button>
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
            {wL&&<a href={wL} target="_blank" rel="noreferrer" style={dBtn({background:'rgba(245,158,11,.10)',borderColor:'rgba(245,158,11,.22)',color:'#FCD34D'})}>Lembrete</a>}
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
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar nome={perfil?.nome_negocio||''} tituloMobile="Agenda"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg&&<div style={{position:'fixed',top:72,left:'50%',transform:'translateX(-50%)',background:'rgba(15,23,42,.96)',border:'1px solid rgba(59,130,246,.35)',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:600,color:'#F8FAFC',zIndex:99,whiteSpace:'nowrap',boxShadow:'0 8px 24px rgba(0,0,0,.5)'}}>{msg}</div>}

          {loading&&<p style={{color:'#475569',fontSize:13,textAlign:'center',padding:'40px 0'}}>Carregando...</p>}

          {!loading&&(
          <>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:14,marginBottom:16,flexWrap:'wrap'}}>
            <div>
              <h1 style={{fontSize:22,fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.03em',marginBottom:2}}>Agenda</h1>
              <p style={{fontSize:13,color:'#94A3B8',lineHeight:1.4}}>Veja seus horários, confirme clientes e acompanhe os atendimentos do dia.</p>
            </div>
            <div className="hdr-btns">
              <Link href="/painel/agendamentos/novo" style={btnP}>+ Novo agendamento</Link>
              <button style={btnS} onClick={()=>setShowBloqueio(true)}>Bloquear horário</button>
            </div>
          </div>

          <div className="kpi-g">
            {[
              {l:'Hoje',n:agsHj.length,c:'#60A5FA',bd:'rgba(59,130,246,.28)',bg:'rgba(59,130,246,.08)',ic:<svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='#60A5FA' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='4' width='18' height='18' rx='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg>},
              {l:'Confirmados',n:conf,c:'#4ADE80',bd:'rgba(34,197,94,.28)',bg:'rgba(34,197,94,.08)',ic:<svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='#4ADE80' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><polyline points='20 6 9 17 4 12'/></svg>},
              {l:'Pendentes',n:pend,c:'#FBBF24',bd:'rgba(245,158,11,.28)',bg:'rgba(245,158,11,.08)',ic:<svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='#FBBF24' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>},
            ].map(({l,n,c,bd,bg,ic})=>(
              <div key={l} style={{background:'radial-gradient(circle at top left,'+bg+',transparent 70%),linear-gradient(145deg,rgba(11,22,40,.97),rgba(8,16,28,.99))',border:'1.5px solid '+bd,borderRadius:16,padding:'12px 10px',display:'flex',flexDirection:'column',gap:4,minWidth:0,boxSizing:'border-box'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28}}>{ic}</div>
                <p style={{fontSize:9,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.08em',color:'#64748B'}}>{l}</p>
                <p style={{fontSize:22,fontWeight:800,color:c,lineHeight:1}}>{n}</p>
              </div>
            ))}
          </div>

          <div className="fil-scroll">
            {(['hoje','semana'] as const).map(v=>(
              <button key={v} onClick={()=>{setView(v);setDiaSel(null)}}
                style={{height:32,padding:'0 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(view===v?'rgba(59,130,246,.4)':'rgba(148,163,184,.15)'),background:view===v?'rgba(59,130,246,.15)':'transparent',color:view===v?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>
                {v==='hoje'?'Hoje':'Semana'}
              </button>
            ))}
            {view==='hoje'&&['todos','pendente','confirmado','realizado','cancelado'].map(f=>(
              <button key={f} onClick={()=>setFSt(f)}
                style={{height:32,padding:'0 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt===f?'rgba(59,130,246,.35)':'rgba(148,163,184,.13)'),background:fSt===f?'rgba(59,130,246,.12)':'transparent',color:fSt===f?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>
                {f==='todos'?'Todos':stCfg[f]?.t||f}
              </button>
            ))}
            <select value={fPr} onChange={e=>setFPr(e.target.value)}
              style={{height:32,background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.16)',borderRadius:8,padding:'0 10px',fontSize:11,color:'#CBD5E1',fontFamily:'inherit',cursor:'pointer',outline:'none',flexShrink:0,minWidth:180}}>
              <option value="todos">Todos profissionais</option>
              {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          {view==='hoje'&&(
            <div className="ag-grid">
              <div>
                <p style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase' as const,marginBottom:8,letterSpacing:'.08em'}}>{agsF.length} atendimento{agsF.length!==1?'s':''}</p>
                {agsF.length===0?(
                  <div style={{background:'linear-gradient(145deg,rgba(11,22,40,.98),rgba(8,16,28,.99))',border:'1px solid rgba(148,163,184,.12)',borderRadius:20,padding:32,textAlign:'center'}}>
                    <div style={{width:44,height:44,borderRadius:12,background:"rgba(59,130,246,.14)",border:"1px solid rgba(59,130,246,.24)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 0 10px"}}><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                    <p style={{fontSize:15,fontWeight:600,color:'#F8FAFC',marginBottom:6}}>Nenhum atendimento</p>
                    <p style={{fontSize:13,color:'#64748B',marginBottom:16}}>Sem agendamentos para o filtro selecionado.</p>
                    <Link href="/painel/agendamentos/novo" style={{...btnP,display:'inline-flex'}}>+ Novo agendamento</Link>
                  </div>
                ):agsF.map(a=>{
                  const sc=stCfg[a.status]||stCfg.pendente
                  const tf=fTel(a.cliente_whatsapp||a.cliente_telefone||'')
                  const isSel=sel?.id===a.id
                  const wW=wpp(a,'w')
                  const wC2=wppConf(a)
                  const cs=a.confirmacao_status||'pendente'
                  const cc=confCfg[cs]||confCfg.pendente
                  return(
                    <div key={a.id} className={'ag-item'+(isSel?' sel':'')} onClick={()=>setSel(a)}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                        <span style={{fontSize:12,fontWeight:800,color:'#60A5FA',background:'rgba(59,130,246,.14)',border:'1px solid rgba(59,130,246,.28)',borderRadius:6,padding:'2px 7px',flexShrink:0}}>{fH(a.data_hora)}</span>
                        <span style={{fontSize:14,fontWeight:700,color:'#F8FAFC',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{a.cliente_nome||'—'}</span>
                        <span style={{...stBadge(a.status),flexShrink:0}}>{sc.t}</span>
                      </div>
                      {tf&&<p style={{fontSize:11,color:'#CBD5E1',marginBottom:2}}>{tf}</p>}
                      <p style={{fontSize:11,color:'#94A3B8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,marginBottom:8}}>
                        {a.servicos?.nome||'Servico nao informado'}{a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}
                        {a.servicos?.preco?<span style={{color:'#22C55E'}}> · R$ {a.servicos.preco}</span>:null}
                      </p>
                      <div className="card-btns" onClick={e=>e.stopPropagation()}>
                        {wW&&<a href={wW} target="_blank" rel="noreferrer" className="card-btn"
                          style={{background:'rgba(34,197,94,.12)',color:'#4ADE80',border:'1px solid rgba(34,197,94,.28)'}}>
                          WhatsApp
                        </a>}
                        {wC2&&<a href={wC2} target="_blank" rel="noreferrer" className="card-btn"
                          onClick={()=>updConf(a.id,'mensagem_enviada')}
                          style={{background:'rgba(59,130,246,.12)',color:'#BFDBFE',border:'1px solid rgba(59,130,246,.28)'}}>
                          Enviar confirmação
                        </a>}
                        {a.confirmacao_status!=='confirmado'&&<button className="card-btn"
                          onClick={()=>updConf(a.id,'confirmado')}
                          style={{background:'rgba(34,197,94,.10)',color:'#86EFAC',border:'1px solid rgba(34,197,94,.22)'}}>
                          ✓ Confirmou
                        </button>}
                        <button className="card-btn"
                          onClick={()=>setBsAg(a)}
                          style={{background:'rgba(255,255,255,.05)',color:'#94A3B8',border:'1px solid rgba(148,163,184,.16)'}}>
                          ⋯ Mais
                        </button>
                      </div>
                      <div className="conf-area" onClick={e=>e.stopPropagation()}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{fontSize:10,fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>Confirmacao</span>
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:'999px',background:cc.bg,color:cc.c}}>{cc.t}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {bloqueios.filter(b=>b.data===hoje).map(b=>(
                <div key={b.id} style={{background:'linear-gradient(145deg,rgba(11,22,40,.98),rgba(8,16,28,.99))',border:'1px solid rgba(239,68,68,.22)',borderRadius:20,padding:16,marginBottom:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:800,color:'#F87171',background:'rgba(239,68,68,.14)',border:'1px solid rgba(239,68,68,.28)',borderRadius:6,padding:'2px 7px',flexShrink:0}}>{b.horario_inicio} - {b.horario_fim}</span>
                    <span style={{fontSize:13,fontWeight:700,color:'#F8FAFC',flex:1}}>Horário bloqueado</span>
                    <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:999,background:'rgba(239,68,68,.14)',color:'#F87171',border:'1px solid rgba(239,68,68,.28)'}}>Bloqueado</span>
                  </div>
                  {b.motivo&&<p style={{fontSize:11,color:'#94A3B8',marginBottom:2}}>Motivo: {b.motivo}</p>}
                  {b.profissional_id&&<p style={{fontSize:11,color:'#94A3B8'}}>Prof: {profs.find((p:any)=>p.id===b.profissional_id)?.nome||'—'}</p>}
                </div>
              ))}
              <div className="det-col"><div style={{position:'sticky',top:16}}><Det/></div></div>
            </div>
          )}

          {view==='semana'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
                <p style={{fontSize:14,fontWeight:700,color:'#CBD5E1'}}>{fDC(dS[0])} - {fDC(dS[6])} {dS[6].getFullYear()}</p>
                <div style={{display:'flex',gap:6}}>
                  {[{l:'Anterior',fn:()=>{setSemOff(s=>s-1);setDiaSel(null)}},{l:'Hoje',fn:()=>{setSemOff(0);setDiaSel(null)}},{l:'Próxima',fn:()=>{setSemOff(s=>s+1);setDiaSel(null)}}].map(({l,fn})=>(
                    <button key={l} onClick={fn} style={{...btnS,height:30,padding:'0 12px',fontSize:11}}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10,marginBottom:16}}>
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
                    <div key={ds} onClick={()=>setDiaSel(isSel?null:ds)}
                      className={'sem-card'+(ehHoje?' hoje-card':'')+(isSel?' sel-card':'')}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                        <p style={{fontSize:11,fontWeight:700,color:ehHoje?'#60A5FA':'#CBD5E1',textTransform:'capitalize' as const}}>{d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})}</p>
                        {it.length>0&&<span style={{fontSize:10,fontWeight:800,color:'#60A5FA',background:'rgba(59,130,246,.14)',borderRadius:999,padding:'1px 7px'}}>{it.length}</span>}
                      </div>
                      {it.length===0?<p style={{fontSize:11,color:'#475569'}}>Livre</p>:(
                        <>
                          {primeiro&&<p style={{fontSize:11,color:'#94A3B8',marginBottom:2}}>A partir das {primeiro}</p>}
                          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                            {totalConf>0&&<span style={{fontSize:10,fontWeight:700,color:'#4ADE80',background:'rgba(34,197,94,.12)',borderRadius:999,padding:'1px 6px'}}>{totalConf} conf</span>}
                            {totalPend>0&&<span style={{fontSize:10,fontWeight:700,color:'#FBBF24',background:'rgba(245,158,11,.12)',borderRadius:999,padding:'1px 6px'}}>{totalPend} pend</span>}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
              {diaSel&&(()=>{
                const itD=ags.filter(a=>new Date(a.data_hora).toISOString().split('T')[0]===diaSel&&(fPr==='todos'||a.profissional_id===fPr)).sort((a,b)=>a.data_hora.localeCompare(b.data_hora))
                return(
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:'#CBD5E1',marginBottom:10}}>{new Date(diaSel+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</p>
                    {itD.length===0?<p style={{fontSize:13,color:'#64748B',padding:'20px 0'}}>Nenhum agendamento neste dia.</p>:itD.map(a=>{
                      const sc=stCfg[a.status]||stCfg.pendente
                      const tf=fTel(a.cliente_whatsapp||a.cliente_telefone||'')
                      const wW=wpp(a,'w')
                      return(
                        <div key={a.id} className="sem-det-item">
                          <span style={{fontSize:13,fontWeight:800,color:'#60A5FA',flexShrink:0,minWidth:40}}>{fH(a.data_hora)}</span>
                          <div style={{minWidth:0,flex:1}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:2}}>
                              <p style={{fontSize:13,fontWeight:700,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{a.cliente_nome||'—'}</p>
                              <span style={stBadge(a.status)}>{sc.t}</span>
                            </div>
                            <p style={{fontSize:11,color:'#94A3B8',marginBottom:tf?3:0}}>{a.servicos?.nome||''}{a.profissionais?.nome?' · '+a.profissionais.nome:''}</p>
                            {tf&&<p style={{fontSize:11,color:'#CBD5E1'}}>{tf}</p>}
                          </div>
                          {wW&&<a href={wW} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                            style={{...dBtn({background:'rgba(34,197,94,.12)',color:'#4ADE80',border:'1px solid rgba(34,197,94,.25)'}),padding:'5px 10px',fontSize:11,flexShrink:0}}>
                            WPP
                          </a>}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}
          </>
          )}

        </div></div>
      </div>

      <div className={'bs-ovl'+(bsAg?' open':'')} onClick={()=>setBsAg(null)}/>
      <div className={'bs'+(bsAg?' open':'')}>
        <div className="bs-handle"/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <p style={{fontSize:15,fontWeight:700,color:'#F8FAFC'}}>Ações do atendimento</p>
            {bsAg&&<p style={{fontSize:12,color:'#64748B'}}>{bsAg.cliente_nome||'—'} · {fH(bsAg.data_hora)}</p>}
          </div>
          <button onClick={()=>setBsAg(null)} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:22,lineHeight:1}}>×</button>
        </div>
        <p className="bs-label">Contato</p>
        <button className="bs-item" style={{color:'#CBD5E1'}} onClick={()=>{bsAg&&copiar(bsAg);setBsAg(null)}}>Copiar contato</button>
        <button className="bs-item" style={{color:'#60A5FA'}} onClick={()=>{bsAg&&resgatarCliente(bsAg);setBsAg(null)}}>🔄 Resgatar cliente</button>
        <p className="bs-label">Status</p>
        {bsAg&&[
          {l:'✓ Compareceu',s:'compareceu',c:'#4ADE80'},
          {l:'★ Realizado',s:'realizado',c:'#67E8F9'},
          {l:'✗ Faltou',s:'faltou',c:'#F87171'},
          {l:'✓ Confirmado',s:'confirmado',c:'#4ADE80'},
          {l:'✕ Cancelar',s:'cancelado',c:'#F87171'},
        ].filter(i=>bsAg.status!==i.s).map(({l,s,c})=>(
          <button key={s} className="bs-item" style={{color:c}} onClick={()=>{updSt(bsAg.id,s);setBsAg(null)}}>{l}</button>
        ))}
        <p className="bs-label">Continuidade</p>
        <button className="bs-item" style={{color:'#A78BFA'}} onClick={()=>{bsAg&&updSt(bsAg.id,'retorno');setBsAg(null)}}>↩ Criar retorno</button>
      </div>

      {/* Bottom Sheet Bloqueio */}
      <div className={'bl-ovl'+(showBloqueio?' open':'')} onClick={()=>setShowBloqueio(false)}/>
      <div className={'bl-modal'+(showBloqueio?' open':'')} onClick={(e:any)=>e.stopPropagation()}>
        <div className="bl-handle"/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:'#60A5FA',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:4}}>Agenda</p>
            <p style={{fontSize:16,fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>Bloquear horário</p>
            <p style={{fontSize:12,color:'#94A3B8',marginTop:2}}>Reserve um período indisponível na agenda.</p>
          </div>
          <button onClick={()=>setShowBloqueio(false)} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:22,lineHeight:1,marginTop:2}}>x</button>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:4}}>Data *</label>
          <input type="date" value={bData} onChange={e=>setBData(e.target.value)} style={{width:'100%',background:'#111827',border:'1px solid rgba(148,163,184,.18)',borderRadius:10,padding:'10px 14px',color:'#F8FAFC',fontSize:14,fontFamily:'inherit',boxSizing:'border-box' as any,colorScheme:'dark' as any}}/>
        </div>
        <div className="bl-grid" style={{marginBottom:14}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:4}}>Horário inicial *</label>
            <input type="time" value={bHoraIni} onChange={e=>setBHoraIni(e.target.value)} style={{width:'100%',background:'#111827',border:'1px solid rgba(148,163,184,.18)',borderRadius:10,padding:'10px 14px',color:'#F8FAFC',fontSize:14,fontFamily:'inherit',boxSizing:'border-box' as any,colorScheme:'dark' as any}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:4}}>Horário final *</label>
            <input type="time" value={bHoraFim} onChange={e=>setBHoraFim(e.target.value)} style={{width:'100%',background:'#111827',border:'1px solid rgba(148,163,184,.18)',borderRadius:10,padding:'10px 14px',color:'#F8FAFC',fontSize:14,fontFamily:'inherit',boxSizing:'border-box' as any,colorScheme:'dark' as any}}/>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:4}}>Profissional</label>
          <select value={bProfId} onChange={e=>setBProfId(e.target.value)} style={{width:'100%',background:'#111827',border:'1px solid rgba(148,163,184,.18)',borderRadius:10,padding:'10px 14px',color:'#F8FAFC',fontSize:14,fontFamily:'inherit',boxSizing:'border-box' as any}}>
            <option value="">Todos os profissionais</option>
            {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <div style={{marginBottom:24}}>
          <label style={{fontSize:11,fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:4}}>Motivo</label>
          <input value={bMotivo} onChange={e=>setBMotivo(e.target.value)} placeholder="Ex: almoco, reuniao, compromisso..." style={{width:'100%',background:'#111827',border:'1px solid rgba(148,163,184,.18)',borderRadius:10,padding:'10px 14px',color:'#F8FAFC',fontSize:14,fontFamily:'inherit',boxSizing:'border-box' as any}}/>
        </div>
        <div className="bl-actions">
          <button onClick={()=>setShowBloqueio(false)} style={{flex:1,background:'rgba(15,23,42,.85)',border:'1px solid rgba(148,163,184,.18)',borderRadius:16,padding:'14px',color:'#CBD5E1',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',height:52}}>Cancelar</button>
          <button onClick={salvarBloqueio} disabled={salvandoBloqueio} style={{flex:2,background:'linear-gradient(135deg,#3B82F6,#7C3AED)',border:'none',borderRadius:16,padding:'14px',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',height:52,boxShadow:'0 8px 24px rgba(59,130,246,.25)'}}>{salvandoBloqueio?'Salvando...':'Salvar bloqueio'}</button>
        </div>
      </div>
    </div>
  )
}
