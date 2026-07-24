'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import PainelSidebar from '@/app/components/PainelSidebar'

const G='linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
input,select,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.14),transparent 28%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh}
.bdy{max-width:1200px;margin:0 auto;padding:24px 28px 80px;width:100%;box-sizing:border-box}
.ag-grid{display:grid;grid-template-columns:1fr;gap:16px}
.det-col{display:none}
.kpi-g{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.hdr-btns{display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0}
.fil-scroll{display:flex;align-items:center;gap:8px;margin-bottom:14px;width:100%;flex-wrap:wrap}
.btn-bloq:hover{border-color:rgba(236,72,153,.40)!important}
.ag-item{background:linear-gradient(145deg,rgba(24,16,27,.98),rgba(18,10,20,.99));border:2px solid rgba(236,72,153,.24);border-radius:20px;padding:16px;margin-bottom:16px;box-shadow:0 12px 30px rgba(0,0,0,.22),0 0 0 1px rgba(236,72,153,.04);cursor:pointer;transition:all .15s}
.ag-item:hover{border-color:rgba(236,72,153,.35)}
.ag-item.sel{border-color:rgba(236,72,153,.55);background:radial-gradient(circle at top left,rgba(236,72,153,.09),transparent 60%),linear-gradient(145deg,rgba(24,16,27,.98),rgba(18,10,20,.99))}
.card-btns{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.card-btn{border-radius:9px;padding:6px 11px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;border:1px solid transparent;transition:all .12s}
.card-btn:hover{border-color:rgba(236,72,153,.28)!important}
.conf-area{margin-top:10px;padding-top:10px;border-top:1px solid #2A1A2F}
.sem-card{background:linear-gradient(145deg,rgba(24,16,27,.98),rgba(18,10,20,.99));border:1px solid #2A1A2F;border-radius:16px;padding:14px;cursor:pointer;transition:all .15s}
.sem-card:hover{border-color:rgba(236,72,153,.3)}
.sem-card.hoje-card{border-color:rgba(236,72,153,.35)}
.sem-card.sel-card{border-color:rgba(236,72,153,.55);box-shadow:0 0 20px rgba(236,72,153,.15)}
.sem-det-item{background:linear-gradient(145deg,rgba(24,16,27,.98),rgba(18,10,20,.99));border:1px solid #2A1A2F;border-radius:12px;padding:12px 14px;margin-bottom:8px}
.bs-ovl{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:60;opacity:0;pointer-events:none;transition:opacity .25s}
.bs-ovl.open{opacity:1;pointer-events:auto}
.bs{position:fixed;bottom:0;left:0;right:0;background:#120A14;border-top:1px solid rgba(255,255,255,.10);border-radius:22px 22px 0 0;padding:24px 24px 36px;z-index:61;transform:translateY(100%);transition:transform .28s ease;max-height:82vh;overflow-y:auto;box-sizing:border-box}
.bs.open{transform:translateY(0)}
.bs-handle{width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;margin:0 auto 20px}
.bs-item{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;font-size:14px;font-weight:500;background:none;border-left:none;border-right:none;border-top:none;font-family:inherit;width:100%;text-align:left;min-height:48px}
.bs-item:last-child{border-bottom:none}
.bs-label{font-size:10px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.08em;margin:14px 0 6px}
.bl-ovl{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(8px);z-index:80;opacity:0;pointer-events:none;transition:opacity .24s ease}
.bl-ovl.open{opacity:1;pointer-events:auto}
.bl-modal{position:fixed;z-index:90;background:linear-gradient(145deg,#120A14,#18101B);border:1px solid rgba(236,72,153,.25);box-shadow:0 24px 80px rgba(0,0,0,.55);color:#F8F4F7;overflow-y:auto;transition:transform .24s ease,opacity .24s ease;pointer-events:none;opacity:0}
.bl-modal.open{pointer-events:auto;opacity:1}
.bl-handle{width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;margin:0 auto 20px}
.bl-grid{display:grid;gap:12px}
.bl-actions{display:flex;gap:10px;margin-top:4px}
.grp-hdr{font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #2A1A2F}
.grp-hdr.hoje-hdr{color:#EC4899}
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
  .sem-grid{grid-template-columns:repeat(4,1fr)!important}
}
@media(max-width:540px){
  .sem-grid{grid-template-columns:repeat(2,1fr)!important}
  .kpi-g{grid-template-columns:repeat(3,1fr)!important}
}
`

const confCfg: Record<string,{t:string,bg:string,c:string}> = {
  pendente:         {t:'Aguardando confirmação',bg:'#2A1A2F',c:'#B8AAB8'},
  mensagem_enviada: {t:'Mensagem enviada',      bg:'rgba(236,72,153,.12)', c:'#EC4899'},
  confirmado:       {t:'Cliente confirmou',     bg:'rgba(34,197,94,.08)',  c:'#22C55E'},
  sem_resposta:     {t:'Sem resposta',          bg:'rgba(250,204,21,.08)',c:'#FACC15'},
  nao_comparece:    {t:'Não vai comparecer',    bg:'rgba(239,68,68,.12)',  c:'#EF4444'},
  remarcado:        {t:'Remarcado',             bg:'rgba(139,92,246,.12)',c:'#C4B5FD'},
}

const stCfg: Record<string,{t:string,bg:string,c:string,bd:string}> = {
  pendente:      {t:'Pendente',       bg:'rgba(250,204,21,.10)',c:'#FACC15',bd:'rgba(250,204,21,.22)'},
  confirmado:    {t:'Confirmado',     bg:'rgba(34,197,94,.08)', c:'#22C55E',bd:'rgba(34,197,94,.20)'},
  realizado:     {t:'Realizado',      bg:'rgba(34,197,94,.08)', c:'#22C55E',bd:'rgba(34,197,94,.20)'},
  cancelado:     {t:'Cancelado',      bg:'rgba(239,68,68,.12)', c:'#EF4444',bd:'rgba(239,68,68,.28)'},
  retorno:       {t:'Retorno',        bg:'rgba(139,92,246,.14)',c:'#C4B5FD',bd:'rgba(139,92,246,.30)'},
  compareceu:    {t:'Compareceu',     bg:'rgba(34,197,94,.14)', c:'#22C55E',bd:'rgba(34,197,94,.30)'},
  faltou:        {t:'Faltou',         bg:'rgba(239,68,68,.12)', c:'#EF4444',bd:'rgba(239,68,68,.28)'},
  em_atendimento:{t:'Em atendimento', bg:'rgba(236,72,153,.14)',c:'#EC4899',bd:'rgba(236,72,153,.30)'},
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
  const [view,setView]=useState<'hoje'|'semana'|'todos'>('hoje')
  const [fSt,setFSt]=useState('todos')
  const [fPr,setFPr]=useState('todos')
  const [semOff,setSemOff]=useState(0)
  const [diaSel,setDiaSel]=useState<string|null>(null)
  const [msg,setMsg]=useState('')
  const [sel,setSel]=useState<any>(null)
  const [bsAg,setBsAg]=useState<any>(null)
  const [showBloqueio,setShowBloqueio]=useState(false)
  const [bData,setBData]=useState('')
  const [bHoraIni,setBHoraIni]=useState('')
  const [bHoraFim,setBHoraFim]=useState('')
  const [bProfId,setBProfId]=useState('')
  const [bMotivo,setBMotivo]=useState('')
  const [salvandoBloqueio,setSalvandoBloqueio]=useState(false)
  const [bloqueios,setBloqueios]=useState<any[]>([])
  const [todosAgs,setTodosAgs]=useState<any[]>([])
  // Aba Todos
  const [busca,setBusca]=useState('')
  const [periodoTodos,setPeriodoTodos]=useState<'7d'|'30d'|'mes'|'ano'|'tudo'>('mes')
  const [limTodos,setLimTodos]=useState(30)
  // Ref para scroll no detalhe do dia (semana mobile)
  const refDia=useRef<HTMLDivElement>(null)
  const mnuRef=useRef<HTMLDivElement>(null)

  const hoje=new Date().toISOString().split('T')[0]

  useEffect(()=>{load()},[])
  useEffect(()=>{
    function fc(e:MouseEvent){if(mnuRef.current&&!mnuRef.current.contains(e.target as Node)){}}
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
    // Carregar 90 dias atrás até 60 dias à frente (cobre aba Todos/mês/ano também)
    const fim=new Date();fim.setDate(fim.getDate()+60)
    const atas=new Date();atas.setFullYear(atas.getFullYear()-1)
    const{data:a}=await supabase.from('agendamentos')
      .select('*,servicos(nome,preco),profissionais(nome)')
      .eq('user_id',user.id)
      .gte('data_hora',atas.toISOString())
      .lte('data_hora',fim.toISOString())
      .order('data_hora',{ascending:true})
    setAgs(a||[])
    const{data:todos}=await supabase.from('agendamentos').select('id,data_hora,status,confirmacao_status').eq('user_id',user.id)
    setTodosAgs(todos||[])
    const{data:bl}=await supabase.from('bloqueios_agenda').select('*').eq('user_id',user.id).order('data',{ascending:true})
    setBloqueios(bl||[])
    setLoading(false)
  }

  function toast(m:string){setMsg(m);setTimeout(()=>setMsg(''),2500)}

  async function updSt(id:string,status:string){
    await supabase.from('agendamentos').update({status}).eq('id',id)
    setAgs(p=>p.map(a=>a.id===id?{...a,status}:a))
    if(sel?.id===id)setSel((s:any)=>({...s,status}))
    toast('Status atualizado!')
  }

  async function updConf(id:string,status:string){
    await supabase.from('agendamentos').update({confirmacao_status:status,confirmacao_atualizada_em:new Date().toISOString()}).eq('id',id)
    setAgs(prev=>prev.map(a=>a.id===id?{...a,confirmacao_status:status}:a))
    if(sel?.id===id)setSel((s:any)=>s?{...s,confirmacao_status:status}:s)
  }

  function wppConf(a:any){
    const tel=fTel(a.cliente_whatsapp||a.cliente_telefone||'')
    if(!tel)return''
    const hr=fH(a.data_hora)
    const sv=a.servicos?.nome||'seu atendimento'
    const pr=a.profissionais?.nome?` com ${a.profissionais.nome}`:''
    const neg=perfil?.nome_negocio||'nosso negócio'
    const m=encodeURIComponent(`Olá, ${a.cliente_nome||''}! Tudo bem? Aqui é da ${neg}. Estou passando para confirmar seu horário de hoje às ${hr} para ${sv}${pr}. Você confirma sua presença?`)
    return`https://wa.me/55${tel.replace(/\D/g,'')}?text=${m}`
  }

  function resgatarCliente(a:any){
    const tel=gTel(a)
    if(!tel){toast('Cliente sem WhatsApp cadastrado.');return}
    const ph=tel.startsWith('55')?tel:'55'+tel
    const m=encodeURIComponent('Olá, tudo bem? Faz alguns dias que não vemos você por aqui. Quer que eu veja um horário disponível para continuarmos seu atendimento?')
    window.open('https://wa.me/'+ph+'?text='+m,'_blank')
  }

  function wpp(a:any,tipo:'c'|'l'|'w'){
    const tel=gTel(a);if(!tel)return null
    const d=new Date(a.data_hora)
    const dt=d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})
    const hr=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
    let t=''
    if(tipo==='c')t='Olá, '+a.cliente_nome+'! Seu agendamento foi confirmado.\n\nServiço: '+(a.servicos?.nome||'')+'\nProfissional: '+(a.profissionais?.nome||'')+'\nData: '+dt+'\nHorário: '+hr+'\n\n'+(perfil?.nome_negocio||'')
    else if(tipo==='l')t='Olá, '+a.cliente_nome+'! Passando para lembrar do seu agendamento.\n\nServiço: '+(a.servicos?.nome||'')+'\nData: '+dt+'\nHorário: '+hr+'\n\nTe esperamos!\n'+(perfil?.nome_negocio||'')
    else t='Olá, '+a.cliente_nome+'!'
    return 'https://wa.me/55'+tel+'?text='+encodeURIComponent(t)
  }

  async function copiar(a:any){
    const tel=a.cliente_whatsapp||a.cliente_telefone||''
    if(!tel){toast('Telefone não informado');return}
    try{await navigator.clipboard.writeText(tel);toast('Contato copiado!')}
    catch{toast('Não foi possível copiar')}
  }

  const agsHj=ags.filter(a=>new Date(a.data_hora).toISOString().split('T')[0]===hoje)
  const conf=agsHj.filter(a=>a.status==='confirmado').length
  const hojeBase=new Date();hojeBase.setHours(23,59,59,0)
  const pend=todosAgs.filter(a=>{
    const d=new Date(a.data_hora||'');if(isNaN(d.getTime())||d>hojeBase)return false
    const s=String(a.status||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()
    return !['realizado','concluido','finalizado','finalizada','cancelado','cancelada','faltou','compareceu'].includes(s)&&(s===''||s==='pendente'||s==='aguardando'||s==='retorno'||s==='agendado')
  }).length

  // Filtro Hoje
  const agsF=ags.filter(a=>{
    const d=new Date(a.data_hora).toISOString().split('T')[0]
    if(view==='hoje'&&d!==hoje)return false
    if(fSt!=='todos'){const _s=a.status||'pendente';if(_s!==fSt)return false}
    if(fPr!=='todos'&&a.profissional_id!==fPr)return false
    return true
  })

  // Filtro Todos
  const agsTodosBase=ags.filter(a=>{
    const d=new Date(a.data_hora).toISOString().split('T')[0]
    const agora=new Date()
    if(periodoTodos==='7d'){const lim=new Date();lim.setDate(lim.getDate()-7);if(new Date(a.data_hora)<lim)return false}
    else if(periodoTodos==='30d'){const lim=new Date();lim.setDate(lim.getDate()-30);if(new Date(a.data_hora)<lim)return false}
    else if(periodoTodos==='mes'){if(!d.startsWith(agora.toISOString().slice(0,7)))return false}
    else if(periodoTodos==='ano'){if(!d.startsWith(String(agora.getFullYear())))return false}
    if(fSt!=='todos'){const _s=a.status||'pendente';if(_s!==fSt)return false}
    if(fPr!=='todos'&&a.profissional_id!==fPr)return false
    return true
  })
  const agsTodos=agsTodosBase.filter(a=>{
    if(!busca)return true
    const q=busca.toLowerCase()
    return [a.cliente_nome,a.cliente_whatsapp,a.cliente_telefone,a.servicos?.nome,a.profissionais?.nome,a.status].some((v:any)=>String(v||'').toLowerCase().includes(q))
  })

  // Agrupamento por data para Todos
  const gruposTodos:Record<string,any[]>={}
  agsTodos.slice(0,limTodos).forEach((a:any)=>{
    const d=new Date(a.data_hora).toISOString().split('T')[0]
    if(!gruposTodos[d])gruposTodos[d]=[]
    gruposTodos[d].push(a)
  })
  const datasGrupos=Object.keys(gruposTodos).sort()

  function periodoLabel(){
    if(periodoTodos==='7d')return'nos últimos 7 dias'
    if(periodoTodos==='30d')return'nos últimos 30 dias'
    if(periodoTodos==='mes'){const d=new Date();return`em ${d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}`}
    if(periodoTodos==='ano')return`em ${new Date().getFullYear()}`
    return'em todo o histórico'
  }

  useEffect(()=>{
    if(view==='hoje'){
      if(agsF.length>0&&!sel)setSel(agsF[0])
      if(agsF.length===0)setSel(null)
    }
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

  const btnP:React.CSSProperties={background:G,color:'#fff',border:'none',borderRadius:10,padding:'0 16px',height:36,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:5,whiteSpace:'nowrap',boxShadow:'0 12px 34px rgba(236,72,153,.28)'}
  const btnS:React.CSSProperties={background:'rgba(24,16,27,.75)',color:'#F8F4F7',border:'1px solid #2A1A2F',borderRadius:10,padding:'0 14px',height:36,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',display:'inline-flex',alignItems:'center'}

  const nome=perfil?.nome_negocio||'Negócio'

  // Card de agendamento reutilizável
  function AgCard({a,showSel=true}:{a:any,showSel?:boolean}){
    const sc=stCfg[a.status]||stCfg.pendente
    const tf=fTel(a.cliente_whatsapp||a.cliente_telefone||'')
    const isSel=sel?.id===a.id&&showSel
    const wW=wpp(a,'w')
    const wC2=wppConf(a)
    const cs=a.confirmacao_status||'pendente'
    const cc=confCfg[cs]||confCfg.pendente
    const jaRealizado=a.status==='realizado'||a.status==='compareceu'||a.status==='concluido'||a.status==='concluído'
    return(
      <div className={'ag-item'+(isSel?' sel':'')} onClick={()=>setSel(a)}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
          <span style={{fontSize:12,fontWeight:800,color:'#EC4899',background:'rgba(236,72,153,.14)',border:'1px solid rgba(236,72,153,.28)',borderRadius:6,padding:'2px 7px',flexShrink:0}}>{fH(a.data_hora)}</span>
          <span style={{fontSize:14,fontWeight:700,color:'#F8F4F7',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{a.cliente_nome||'—'}</span>
          <span style={{...stBadge(a.status),flexShrink:0}}>{sc.t}</span>
        </div>
        {tf&&<p style={{fontSize:11,color:'#B8AAB8',marginBottom:2}}>{tf}</p>}
        <p style={{fontSize:11,color:'#B8AAB8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,marginBottom:8}}>
          {a.servicos?.nome||'Serviço não informado'}{a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}
          {a.servicos?.preco?<span style={{color:'#22C55E'}}> · R$ {a.servicos.preco}</span>:null}
        </p>
        <div className="card-btns" onClick={e=>e.stopPropagation()}>
          {wW&&<a href={wW} target="_blank" rel="noreferrer" className="card-btn" style={{background:'rgba(24,16,27,.75)',color:'#F8F4F7',border:'1px solid #2A1A2F'}}>WhatsApp</a>}
          {wC2&&!jaRealizado&&<a href={wC2} target="_blank" rel="noreferrer" className="card-btn" onClick={()=>updConf(a.id,'mensagem_enviada')} style={{background:'rgba(24,16,27,.75)',color:'#F8F4F7',border:'1px solid #2A1A2F'}}>Enviar confirmação</a>}
          {!jaRealizado&&a.status!=='cancelado'&&a.status!=='faltou'&&(
            <button className="card-btn" onClick={()=>updSt(a.id,'realizado')} style={{background:'rgba(24,16,27,.75)',color:'#F8F4F7',border:'1px solid #2A1A2F'}}>✓ Realizado</button>
          )}
          <button className="card-btn" onClick={()=>setBsAg(a)} style={{background:'rgba(24,16,27,.75)',color:'#B8AAB8',border:'1px solid #2A1A2F'}}>⋯ Mais</button>
        </div>
        {!jaRealizado&&a.status!=='faltou'&&a.status!=='cancelado'&&(
          <div className="conf-area" onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:10,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>Confirmação</span>
              <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:'999px',background:cc.bg,color:cc.c}}>{cc.t}</span>
            </div>
          </div>
        )}
        {jaRealizado&&<div className="conf-area"><span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:'999px',background:'rgba(34,197,94,.12)',color:'#22C55E',border:'1px solid rgba(34,197,94,.22)'}}>✓ Atendimento realizado</span></div>}
        {a.status==='faltou'&&<div className="conf-area"><span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:'999px',background:'rgba(239,68,68,.12)',color:'#EF4444',border:'1px solid rgba(239,68,68,.22)'}}>Cliente faltou</span></div>}
        {a.status==='cancelado'&&<div className="conf-area"><span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:'999px',background:'rgba(239,68,68,.10)',color:'#EF4444',border:'1px solid rgba(239,68,68,.18)'}}>Cancelado</span></div>}
      </div>
    )
  }

  function Det(){
    const sc=stCfg[sel?.status]||stCfg.pendente
    const tf=sel?fTel(sel.cliente_whatsapp||sel.cliente_telefone||''):''
    const wC=sel?wpp(sel,'c'):null
    const wL=sel?wpp(sel,'l'):null
    const wW=sel?wpp(sel,'w'):null
    const sec:React.CSSProperties={marginBottom:12,paddingBottom:12,borderBottom:'1px solid #2A1A2F'}
    const secT:React.CSSProperties={fontSize:9,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.10em',color:'#B8AAB8',marginBottom:8}
    const row:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}
    const g2:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:6}
    if(!sel)return(
      <div style={{background:'radial-gradient(circle at top left,rgba(139,92,246,.06),transparent 50%),linear-gradient(145deg,rgba(24,16,27,.98),rgba(18,10,20,.99))',border:'1px solid #2A1A2F',borderRadius:16,padding:20,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:300,textAlign:'center',gap:10}}>
        <p style={{fontSize:14,fontWeight:700,color:'#F8F4F7'}}>Selecione um agendamento</p>
        <p style={{fontSize:12,color:'#B8AAB8',lineHeight:1.5}}>Clique em um atendimento para ver detalhes.</p>
      </div>
    )
    return(
      <div style={{background:'radial-gradient(circle at top left,rgba(139,92,246,.08),transparent 50%),linear-gradient(145deg,rgba(24,16,27,.98),rgba(18,10,20,.99))',border:'1px solid rgba(139,92,246,.20)',borderRadius:16,padding:18,maxHeight:'calc(100vh - 160px)',overflowY:'auto'}}>
        <p style={{...secT,marginBottom:12}}>Detalhes do agendamento</p>
        <div style={{width:44,height:44,borderRadius:'50%',background:G,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#fff',margin:'0 auto 10px'}}>{(sel.cliente_nome||'C').charAt(0).toUpperCase()}</div>
        <p style={{fontSize:15,fontWeight:800,color:'#F8F4F7',textAlign:'center',marginBottom:3}}>{sel.cliente_nome||'Cliente sem nome'}</p>
        <div style={{textAlign:'center',marginBottom:12}}><span style={stBadge(sel.status)}>{sc.t}</span></div>
        <div style={sec}>
          <p style={secT}>Contato</p>
          <div style={row}><span style={{fontSize:11,color:'#B8AAB8'}}>WhatsApp</span><span style={{fontSize:11,fontWeight:700,color:'#B8AAB8'}}>{tf||'Não informado'}</span></div>
          <div style={g2}>
            {wW?<a href={wW} target="_blank" rel="noreferrer" style={{...dBtn({background:'rgba(37,211,102,.12)',borderColor:'rgba(37,211,102,.25)',color:'#25D366'}),gridColumn:'1/-1'}}>Abrir WhatsApp</a>
              :<button disabled style={{...dBtn({background:'rgba(255,255,255,.04)',borderColor:'#2A1A2F',color:'#B8AAB8',cursor:'not-allowed'}),gridColumn:'1/-1'}}>Sem telefone</button>}
            <button onClick={()=>copiar(sel)} style={{...dBtn({background:'rgba(255,255,255,.04)',borderColor:'#2A1A2F',color:'#B8AAB8'}),gridColumn:'1/-1'}}>Copiar contato</button>
          </div>
        </div>
        <div style={sec}>
          <p style={secT}>Atendimento</p>
          {[{l:'Serviço',v:sel.servicos?.nome||'Não informado',c:'#F8F4F7'},{l:'Profissional',v:sel.profissionais?.nome||'Não informado',c:'#F8F4F7'},{l:'Data',v:fDF(sel.data_hora),c:'#B8AAB8',fs:10},{l:'Horário',v:fH(sel.data_hora),c:'#EC4899'},...(sel.servicos?.preco?[{l:'Valor',v:'R$ '+sel.servicos.preco,c:'#22C55E'}]:[])].map(({l,v,c,fs}:any)=>(
            <div key={l} style={row}><span style={{fontSize:11,color:'#B8AAB8'}}>{l}</span><span style={{fontSize:fs||11,fontWeight:700,color:c,textAlign:'right' as const,maxWidth:'58%'}}>{v}</span></div>
          ))}
        </div>
        <div>
          <p style={secT}>Ações rápidas</p>
          <div style={g2}>
            {wC&&(sel.status==='pendente'||!sel.status||sel.status==='retorno')&&<a href={wC} target="_blank" rel="noreferrer" style={dBtn({background:'rgba(34,197,94,.12)',borderColor:'rgba(34,197,94,.25)',color:'#22C55E'})}>✓ Confirmar</a>}
            {wL&&<a href={wL} target="_blank" rel="noreferrer" style={dBtn({background:'rgba(250,204,21,.10)',borderColor:'rgba(250,204,21,.22)',color:'#FCD34D'})}>Lembrete</a>}
            {sel.status!=='realizado'&&<button onClick={()=>updSt(sel.id,'realizado')} style={dBtn({background:'rgba(34,197,94,.10)',borderColor:'rgba(34,197,94,.20)',color:'#22C55E'})}>✓ Realizado</button>}
            {sel.status!=='faltou'&&<button onClick={()=>updSt(sel.id,'faltou')} style={dBtn({background:'rgba(239,68,68,.08)',borderColor:'rgba(239,68,68,.18)',color:'#EF4444'})}>✗ Faltou</button>}
            {sel.status!=='retorno'&&<button onClick={()=>updSt(sel.id,'retorno')} style={dBtn({background:'rgba(139,92,246,.10)',borderColor:'rgba(139,92,246,.22)',color:'#C4B5FD'})}>↩ Retorno</button>}
            {sel.status!=='cancelado'&&<button onClick={()=>updSt(sel.id,'cancelado')} style={dBtn({background:'rgba(239,68,68,.06)',borderColor:'rgba(239,68,68,.14)',color:'#EF4444'})}>✕ Cancelar</button>}
          </div>
        </div>
      </div>
    )
  }

  async function salvarBloqueio(){
    if(!bData||!bHoraIni||!bHoraFim){toast('Preencha data e horários.');return}
    if(bHoraFim<=bHoraIni){toast('Horário final deve ser maior que o inicial.');return}
    setSalvandoBloqueio(true)
    const{data:{user}}=await supabase.auth.getUser()
    if(!user){toast('Sessão expirada.');setSalvandoBloqueio(false);return}
    const{error}=await supabase.from('bloqueios_agenda').insert({user_id:user.id,data:bData,horario_inicio:bHoraIni,horario_fim:bHoraFim,profissional_id:bProfId||null,motivo:bMotivo||null})
    if(error){toast('Erro ao bloquear horário.');setSalvandoBloqueio(false);return}
    const{data:todos}=await supabase.from('agendamentos').select('id,data_hora,status,confirmacao_status').eq('user_id',user.id)
    setTodosAgs(todos||[])
    const{data:bl}=await supabase.from('bloqueios_agenda').select('*').eq('user_id',user.id).order('data',{ascending:true})
    setBloqueios(bl||[])
    toast('Horário bloqueado com sucesso.')
    setShowBloqueio(false);setBData('');setBHoraIni('');setBHoraFim('');setBMotivo('');setBProfId('')
    setSalvandoBloqueio(false)
  }

  if(loading)return(<div style={{minHeight:'100vh',background:'#08060A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#B8AAB8',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#08060A',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar nome={perfil?.nome_negocio||''} tituloMobile="Agenda"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg&&<div style={{position:'fixed',top:72,left:'50%',transform:'translateX(-50%)',background:'rgba(24,16,27,.96)',border:'1px solid rgba(236,72,153,.35)',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:600,color:'#F8F4F7',zIndex:99,whiteSpace:'nowrap',boxShadow:'0 8px 24px rgba(0,0,0,.5)'}}>{msg}</div>}

          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:14,marginBottom:16,flexWrap:'wrap'}}>
            <div>
              <h1 style={{fontSize:22,fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.03em',marginBottom:2}}>Agenda</h1>
              <p style={{fontSize:13,color:'#B8AAB8',lineHeight:1.4}}>Veja seus horários, confirme clientes e acompanhe os atendimentos do dia.</p>
            </div>
            <div className="hdr-btns">
              <Link href="/painel/agendamentos/novo" style={btnP}>+ Novo agendamento</Link>
              <button className="btn-bloq" style={btnS} onClick={()=>setShowBloqueio(true)}>Bloquear horário</button>
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-g">
            {[
              {l:'Hoje',n:agsHj.length,c:'#EC4899',ibg:'rgba(236,72,153,.12)',ic:<svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='#EC4899' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='4' width='18' height='18' rx='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg>},
              {l:'Confirmados',n:conf,c:'#22C55E',ibg:'rgba(34,197,94,.10)',ic:<svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='#22C55E' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'><polyline points='20 6 9 17 4 12'/></svg>},
              {l:'Pendentes',n:pend,c:'#FACC15',ibg:'rgba(250,204,21,.10)',ic:<svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='#FACC15' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>},
            ].map(({l,n,c,ibg,ic})=>(
              <div key={l} style={{background:'#18101B',border:'1.5px solid #2A1A2F',borderRadius:16,padding:'12px 10px',display:'flex',flexDirection:'column',gap:4,minWidth:0,boxSizing:'border-box'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:8,background:ibg}}>{ic}</div>
                <p style={{fontSize:9,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.08em',color:'#B8AAB8'}}>{l}</p>
                <p style={{fontSize:22,fontWeight:800,color:c,lineHeight:1}}>{n}</p>
              </div>
            ))}
          </div>

          {/* Filtros view */}
          <div className="fil-scroll">
            {(['hoje','semana','todos'] as const).map(v=>(
              <button key={v} onClick={()=>{setView(v);setDiaSel(null);setBusca('');setLimTodos(30)}}
                style={{height:32,padding:'0 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(view===v?'rgba(236,72,153,.4)':'#2A1A2F'),background:view===v?'rgba(236,72,153,.15)':'transparent',color:view===v?'#EC4899':'#B8AAB8',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>
                {v==='hoje'?'Hoje':v==='semana'?'Semana':'Todos'}
              </button>
            ))}
            {(view==='hoje')&&['todos','pendente','realizado','faltou','cancelado'].map(f=>(
              <button key={f} onClick={()=>setFSt(f)}
                style={{height:32,padding:'0 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt===f?'rgba(236,72,153,.35)':'#2A1A2F'),background:fSt===f?'rgba(236,72,153,.12)':'transparent',color:fSt===f?'#EC4899':'#B8AAB8',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>
                {f==='todos'?'Status':stCfg[f]?.t||f}
              </button>
            ))}
            <select value={fPr} onChange={e=>setFPr(e.target.value)}
              style={{height:32,background:'rgba(24,16,27,.88)',border:'1px solid #2A1A2F',borderRadius:8,padding:'0 10px',fontSize:11,color:'#B8AAB8',fontFamily:'inherit',cursor:'pointer',outline:'none',flexShrink:0,minWidth:160}}>
              <option value="todos">Todos profissionais</option>
              {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          {/* ── HOJE ── */}
          {view==='hoje'&&(
            <div className="ag-grid">
              <div>
                <p style={{fontSize:10,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,marginBottom:8,letterSpacing:'.08em'}}>{agsF.length} atendimento{agsF.length!==1?'s':''} hoje</p>
                {agsF.length===0?(
                  <div style={{background:'linear-gradient(145deg,rgba(24,16,27,.98),rgba(18,10,20,.99))',border:'1px solid #2A1A2F',borderRadius:20,padding:32,textAlign:'center'}}>
                    <p style={{fontSize:15,fontWeight:600,color:'#F8F4F7',marginBottom:6}}>Nenhum atendimento hoje</p>
                    <p style={{fontSize:13,color:'#B8AAB8',marginBottom:16}}>Sem agendamentos para hoje.</p>
                    <Link href="/painel/agendamentos/novo" style={{...btnP,display:'inline-flex'}}>+ Novo agendamento</Link>
                  </div>
                ):agsF.map(a=><AgCard key={a.id} a={a}/>)}
                {bloqueios.filter(b=>b.data===hoje).map(b=>(
                  <div key={b.id} style={{background:'linear-gradient(145deg,rgba(24,16,27,.98),rgba(18,10,20,.99))',border:'1px solid rgba(239,68,68,.22)',borderRadius:20,padding:16,marginBottom:12}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:800,color:'#EF4444',background:'rgba(239,68,68,.14)',border:'1px solid rgba(239,68,68,.28)',borderRadius:6,padding:'2px 7px',flexShrink:0}}>{b.horario_inicio} - {b.horario_fim}</span>
                      <span style={{fontSize:13,fontWeight:700,color:'#F8F4F7',flex:1}}>Horário bloqueado</span>
                    </div>
                    {b.motivo&&<p style={{fontSize:11,color:'#B8AAB8'}}>Motivo: {b.motivo}</p>}
                  </div>
                ))}
              </div>
              <div className="det-col"><div style={{position:'sticky',top:16}}><Det/></div></div>
            </div>
          )}

          {/* ── SEMANA ── */}
          {view==='semana'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
                <p style={{fontSize:14,fontWeight:700,color:'#B8AAB8'}}>{fDC(dS[0])} — {fDC(dS[6])} {dS[6].getFullYear()}</p>
                <div style={{display:'flex',gap:6}}>
                  {[{l:'Anterior',fn:()=>{setSemOff(s=>s-1);setDiaSel(null)}},{l:'Hoje',fn:()=>{setSemOff(0);setDiaSel(null)}},{l:'Próxima',fn:()=>{setSemOff(s=>s+1);setDiaSel(null)}}].map(({l,fn})=>(
                    <button key={l} onClick={fn} style={{...btnS,height:30,padding:'0 12px',fontSize:11}}>{l}</button>
                  ))}
                </div>
              </div>
              {/* Grid de dias */}
              <div className="sem-grid" style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,marginBottom:16}}>
                {dS.map(d=>{
                  const ds=d.toISOString().split('T')[0]
                  const ehHoje=ds===hoje
                  const it=ags.filter(a=>new Date(a.data_hora).toISOString().split('T')[0]===ds&&(fPr==='todos'||a.profissional_id===fPr))
                  const totalPend=it.filter(a=>!a.status||a.status==='pendente').length
                  const totalConf=it.filter(a=>a.status==='confirmado').length
                  const totalReal=it.filter(a=>a.status==='realizado'||a.status==='compareceu').length
                  const primeiro=it[0]?fH(it[0].data_hora):null
                  const isSel=diaSel===ds
                  return(
                    <div key={ds}
                      onClick={()=>{
                        setDiaSel(isSel?null:ds)
                        setTimeout(()=>refDia.current?.scrollIntoView({behavior:'smooth',block:'start'}),100)
                      }}
                      className={'sem-card'+(ehHoje?' hoje-card':'')+(isSel?' sel-card':'')}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
                        <p style={{fontSize:10,fontWeight:700,color:ehHoje?'#EC4899':'#B8AAB8',textTransform:'capitalize' as const,lineHeight:1.3}}>
                          {d.toLocaleDateString('pt-BR',{weekday:'short'})}<br/>
                          <span style={{fontSize:11,fontWeight:800}}>{d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span>
                        </p>
                        {it.length>0&&<span style={{fontSize:10,fontWeight:800,color:'#EC4899',background:'rgba(236,72,153,.14)',borderRadius:999,padding:'1px 6px',flexShrink:0}}>{it.length}</span>}
                      </div>
                      {it.length===0
                        ?<p style={{fontSize:10,color:'#B8AAB8'}}>Livre</p>
                        :<>
                          {primeiro&&<p style={{fontSize:10,color:'#B8AAB8',marginBottom:3}}>🕐 {primeiro}</p>}
                          <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                            {totalConf>0&&<span style={{fontSize:9,fontWeight:700,color:'#22C55E',background:'rgba(34,197,94,.12)',borderRadius:999,padding:'1px 5px'}}>{totalConf}✓</span>}
                            {totalPend>0&&<span style={{fontSize:9,fontWeight:700,color:'#FACC15',background:'rgba(250,204,21,.12)',borderRadius:999,padding:'1px 5px'}}>{totalPend}⏳</span>}
                            {totalReal>0&&<span style={{fontSize:9,fontWeight:700,color:'#22C55E',background:'rgba(34,197,94,.1)',borderRadius:999,padding:'1px 5px'}}>{totalReal}✔</span>}
                          </div>
                          <p style={{fontSize:9,color:'#EC4899',marginTop:4,fontWeight:600}}>Ver ↓</p>
                        </>
                      }
                    </div>
                  )
                })}
              </div>
              {/* Detalhe do dia selecionado */}
              {diaSel&&(()=>{
                const itD=ags.filter(a=>new Date(a.data_hora).toISOString().split('T')[0]===diaSel&&(fPr==='todos'||a.profissional_id===fPr)).sort((a,b)=>a.data_hora.localeCompare(b.data_hora))
                const labelDia=new Date(diaSel+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})
                return(
                  <div ref={refDia} style={{paddingTop:4}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                      <p style={{fontSize:14,fontWeight:700,color:'#F8F4F7',textTransform:'capitalize' as const}}>{labelDia}</p>
                      <span style={{fontSize:11,color:'#B8AAB8'}}>{itD.length} agendamento{itD.length!==1?'s':''}</span>
                      <button onClick={()=>setDiaSel(null)} style={{marginLeft:'auto',background:'none',border:'none',color:'#B8AAB8',cursor:'pointer',fontSize:18,lineHeight:1}}>×</button>
                    </div>
                    {itD.length===0
                      ?<div style={{background:'rgba(255,255,255,.03)',border:'1px solid #2A1A2F',borderRadius:12,padding:'20px',textAlign:'center'}}><p style={{fontSize:13,color:'#B8AAB8'}}>Nenhum agendamento neste dia.</p></div>
                      :itD.map(a=><AgCard key={a.id} a={a} showSel={false}/>)
                    }
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── TODOS ── */}
          {view==='todos'&&(
            <div>
              {/* Busca */}
              <input type="text" placeholder="Buscar cliente, telefone, serviço ou profissional..." value={busca} onChange={e=>{setBusca(e.target.value);setLimTodos(30)}}
                style={{width:'100%',background:'rgba(24,16,27,.88)',border:'1px solid #2A1A2F',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#F8F4F7',outline:'none',fontFamily:'inherit',boxSizing:'border-box' as const,marginBottom:10}}/>
              {/* Filtros período + status */}
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
                {([['7d','7 dias'],['30d','30 dias'],['mes','Este mês'],['ano','Este ano'],['tudo','Todo período']] as const).map(([val,lbl])=>(
                  <button key={val} onClick={()=>{setPeriodoTodos(val);setLimTodos(30)}}
                    style={{height:30,padding:'0 12px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',border:'1px solid '+(periodoTodos===val?'rgba(236,72,153,.4)':'#2A1A2F'),background:periodoTodos===val?'rgba(236,72,153,.15)':'transparent',color:periodoTodos===val?'#EC4899':'#B8AAB8',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>
                    {lbl}
                  </button>
                ))}
                {['todos','pendente','realizado','faltou','cancelado'].map(f=>(
                  <button key={f} onClick={()=>setFSt(f)}
                    style={{height:30,padding:'0 10px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt===f?'rgba(139,92,246,.4)':'#2A1A2F'),background:fSt===f?'rgba(139,92,246,.12)':'transparent',color:fSt===f?'#C4B5FD':'#B8AAB8',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>
                    {f==='todos'?'Status':stCfg[f]?.t||f}
                  </button>
                ))}
              </div>
              {/* Contador + aviso */}
              <p style={{fontSize:11,color:'#B8AAB8',marginBottom:12}}>
                {busca?`${agsTodos.length} resultado${agsTodos.length!==1?'s':''} para "${busca}" ${periodoLabel()}`:`${agsTodos.length} agendamento${agsTodos.length!==1?'s':''} ${periodoLabel()}`}
                {periodoTodos==='tudo'&&<span style={{color:'#FACC15'}}> · Use a busca para encontrar clientes antigos</span>}
              </p>
              {/* Lista agrupada por data */}
              {agsTodos.length===0?(
                <div style={{background:'linear-gradient(145deg,rgba(24,16,27,.98),rgba(18,10,20,.99))',border:'1px solid #2A1A2F',borderRadius:20,padding:32,textAlign:'center'}}>
                  <p style={{fontSize:15,fontWeight:600,color:'#F8F4F7',marginBottom:6}}>Nenhum agendamento encontrado</p>
                  <p style={{fontSize:13,color:'#B8AAB8',marginBottom:16}}>Tente outro período ou limpe a busca.</p>
                </div>
              ):(
                <>
                  {datasGrupos.map(data=>{
                    const ehHojeData=data===hoje
                    const labelData=ehHojeData?'Hoje':new Date(data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})
                    return(
                      <div key={data} style={{marginBottom:20}}>
                        <p className={'grp-hdr'+(ehHojeData?' hoje-hdr':'')}>
                          {labelData.charAt(0).toUpperCase()+labelData.slice(1)} · {gruposTodos[data].length} atendimento{gruposTodos[data].length!==1?'s':''}
                        </p>
                        {gruposTodos[data].map((a:any)=><AgCard key={a.id} a={a}/>)}
                      </div>
                    )
                  })}
                  {agsTodos.length>limTodos&&(
                    <button onClick={()=>setLimTodos(l=>l+30)}
                      style={{width:'100%',background:'rgba(236,72,153,.10)',border:'1.5px solid rgba(236,72,153,.22)',borderRadius:12,padding:'14px',fontSize:13,fontWeight:700,color:'#EC4899',cursor:'pointer',fontFamily:'inherit',marginTop:4}}>
                      Carregar mais ({agsTodos.length-limTodos} restantes)
                    </button>
                  )}
                </>
              )}
            </div>
          )}

        </div></div>
      </div>

      {/* Bottom Sheet Ações */}
      <div className={'bs-ovl'+(bsAg?' open':'')} onClick={()=>setBsAg(null)}/>
      <div className={'bs'+(bsAg?' open':'')}>
        <div className="bs-handle"/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <p style={{fontSize:15,fontWeight:700,color:'#F8F4F7'}}>Ações do atendimento</p>
            {bsAg&&<p style={{fontSize:12,color:'#B8AAB8'}}>{bsAg.cliente_nome||'—'} · {fH(bsAg.data_hora)}</p>}
          </div>
          <button onClick={()=>setBsAg(null)} style={{background:'none',border:'none',color:'#B8AAB8',cursor:'pointer',fontSize:22,lineHeight:1}}>×</button>
        </div>
        <p className="bs-label">Contato</p>
        <button className="bs-item" style={{color:'#B8AAB8'}} onClick={()=>{bsAg&&copiar(bsAg);setBsAg(null)}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copiar contato
        </button>
        <button className="bs-item" style={{color:'#EC4899'}} onClick={()=>{bsAg&&resgatarCliente(bsAg);setBsAg(null)}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Resgatar cliente
        </button>
        <p className="bs-label">Status do atendimento</p>
        {bsAg&&(()=>{
          const st=(bsAg.status||'').toLowerCase()
          const jaRealizado=['realizado','concluido','concluído','compareceu'].includes(st)
          const jaFaltou=st==='faltou'
          const jaCancelado=st==='cancelado'
          return(<>
            {jaRealizado?(
              <div style={{padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',gap:10}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{fontSize:14,color:'#22C55E',fontWeight:500}}>Atendimento já realizado</span>
              </div>
            ):jaCancelado?null:(
              <button className="bs-item" style={{color:'#22C55E'}} onClick={()=>{updSt(bsAg.id,'realizado');setBsAg(null)}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ✓ Marcar como realizado
              </button>
            )}
            {jaFaltou?(
              <div style={{padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',gap:10}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span style={{fontSize:14,color:'#EF4444',fontWeight:500}}>Cliente marcado como faltou</span>
              </div>
            ):jaCancelado?null:(
              <button className="bs-item" style={{color:'#EF4444'}} onClick={()=>{updSt(bsAg.id,'faltou');setBsAg(null)}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Marcar como faltou
              </button>
            )}
            {jaCancelado?(
              <div style={{padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',gap:10}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8AAB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span style={{fontSize:14,color:'#B8AAB8',fontWeight:500}}>Atendimento cancelado</span>
              </div>
            ):(
              <button className="bs-item" style={{color:'#EF4444'}} onClick={()=>{updSt(bsAg.id,'cancelado');setBsAg(null)}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar atendimento
              </button>
            )}
          </>)
        })()}
        <p className="bs-label">Continuidade</p>
        <button className="bs-item" style={{color:'#A78BFA'}} onClick={()=>{bsAg&&updSt(bsAg.id,'retorno');setBsAg(null)}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.55"/></svg>
          Criar retorno
        </button>
      </div>

      {/* Bottom Sheet Bloqueio */}
      <div className={'bl-ovl'+(showBloqueio?' open':'')} onClick={()=>setShowBloqueio(false)}/>
      <div className={'bl-modal'+(showBloqueio?' open':'')} onClick={(e:any)=>e.stopPropagation()}>
        <div className="bl-handle"/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:'#EC4899',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:4}}>Agenda</p>
            <p style={{fontSize:16,fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em'}}>Bloquear horário</p>
            <p style={{fontSize:12,color:'#B8AAB8',marginTop:2}}>Reserve um período indisponível na agenda.</p>
          </div>
          <button onClick={()=>setShowBloqueio(false)} style={{background:'none',border:'none',color:'#B8AAB8',cursor:'pointer',fontSize:22,lineHeight:1,marginTop:2}}>×</button>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:4}}>Data *</label>
          <input type="date" value={bData} onChange={e=>setBData(e.target.value)} style={{width:'100%',background:'#18101B',border:'1px solid #2A1A2F',borderRadius:10,padding:'10px 14px',color:'#F8F4F7',fontSize:14,fontFamily:'inherit',boxSizing:'border-box' as any,colorScheme:'dark' as any}}/>
        </div>
        <div className="bl-grid" style={{marginBottom:14}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:4}}>Horário inicial *</label>
            <input type="time" value={bHoraIni} onChange={e=>setBHoraIni(e.target.value)} style={{width:'100%',background:'#18101B',border:'1px solid #2A1A2F',borderRadius:10,padding:'10px 14px',color:'#F8F4F7',fontSize:14,fontFamily:'inherit',boxSizing:'border-box' as any,colorScheme:'dark' as any}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:4}}>Horário final *</label>
            <input type="time" value={bHoraFim} onChange={e=>setBHoraFim(e.target.value)} style={{width:'100%',background:'#18101B',border:'1px solid #2A1A2F',borderRadius:10,padding:'10px 14px',color:'#F8F4F7',fontSize:14,fontFamily:'inherit',boxSizing:'border-box' as any,colorScheme:'dark' as any}}/>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:4}}>Profissional</label>
          <select value={bProfId} onChange={e=>setBProfId(e.target.value)} style={{width:'100%',background:'#18101B',border:'1px solid #2A1A2F',borderRadius:10,padding:'10px 14px',color:'#F8F4F7',fontSize:14,fontFamily:'inherit',boxSizing:'border-box' as any}}>
            <option value="">Todos os profissionais</option>
            {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <div style={{marginBottom:24}}>
          <label style={{fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:4}}>Motivo</label>
          <input value={bMotivo} onChange={e=>setBMotivo(e.target.value)} placeholder="Ex: almoço, reunião, compromisso..." style={{width:'100%',background:'#18101B',border:'1px solid #2A1A2F',borderRadius:10,padding:'10px 14px',color:'#F8F4F7',fontSize:14,fontFamily:'inherit',boxSizing:'border-box' as any}}/>
        </div>
        <div className="bl-actions">
          <button onClick={()=>setShowBloqueio(false)} style={{flex:1,background:'rgba(24,16,27,.85)',border:'1px solid #2A1A2F',borderRadius:16,padding:'14px',color:'#B8AAB8',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',height:52}}>Cancelar</button>
          <button onClick={salvarBloqueio} disabled={salvandoBloqueio} style={{flex:2,background:'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)',border:'none',borderRadius:16,padding:'14px',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',height:52,boxShadow:'0 8px 24px rgba(236,72,153,.28)'}}>{salvandoBloqueio?'Salvando...':'Salvar bloqueio'}</button>
        </div>
      </div>
    </div>
  )
}
