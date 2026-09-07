'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'

const G='linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const INTERVALOS=['15 min','30 min','45 min','1 hora']
const ANTECEDENCIAS=['Sem restrição','1 hora antes','2 horas antes','4 horas antes','1 dia antes']

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
input,select,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.18),transparent 32%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh}
.bdy{max-width:820px;margin:0 auto;padding:28px 32px 80px;width:100%}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px;padding:24px}
.lbl{display:block;font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:10px;padding:10px 12px;color:#F8F4F7;font-size:13px;font-family:inherit}
.inp:focus{outline:none;border-color:rgba(236,72,153,.5)}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.dia-btn{background:rgba(24,16,27,.9);border:1px solid #2A1A2F;color:#B8AAB8;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
.dia-btn.on{background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);color:#fff;border-color:transparent}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}.fg2{grid-template-columns:1fr!important}}
`

export default function GerenciarAgenda(){
  const [userId,setUserId]=useState('')
  const [nome,setNome]=useState('')
  const [carregando,setCarregando]=useState(true)
  const [salvando,setSalvando]=useState(false)
  const [msg,setMsg]=useState('')

  const [diasAtivos,setDiasAtivos]=useState([false,true,true,true,true,true,true])
  const [horarios,setHorarios]=useState(DIAS.map(()=>({abertura:'08:00',fechamento:'18:00'})))
  const [intervalo,setIntervalo]=useState('30 min')
  const [abertura,setAbertura]=useState('08:00')
  const [fechamento,setFechamento]=useState('18:00')
  const [antecedencia,setAntecedencia]=useState('Sem restrição')

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const {data:p}=await supabase.from('perfis').select('nome_negocio,dias_ativos,horarios,intervalo,abertura_geral,fechamento_geral,antecedencia').eq('user_id',user.id).maybeSingle()
    if(p){
      setNome(p.nome_negocio||'')
      if(p.dias_ativos) setDiasAtivos(p.dias_ativos)
      if(p.horarios) setHorarios(p.horarios)
      if(p.intervalo) setIntervalo(p.intervalo)
      if(p.abertura_geral) setAbertura(p.abertura_geral)
      if(p.fechamento_geral) setFechamento(p.fechamento_geral)
      if(p.antecedencia) setAntecedencia(p.antecedencia)
    }
    setCarregando(false)
  }

  function toggleDia(i:number){setDiasAtivos(prev=>prev.map((v,j)=>j===i?!v:v))}
  function setHor(i:number,campo:'abertura'|'fechamento',val:string){setHorarios(prev=>prev.map((h,j)=>j===i?{...h,[campo]:val}:h))}

  async function salvar(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    if(user.id!==userId){setMsg('A sessão mudou. Recarregue a página antes de salvar.');return}
    setSalvando(true)
    const {error}=await supabase.from('perfis').update({
      dias_ativos:diasAtivos,
      horarios:horarios,
      intervalo:intervalo,
      abertura_geral:abertura,
      fechamento_geral:fechamento,
      antecedencia:antecedencia,
    }).eq('user_id',userId)
    setSalvando(false)
    if(error){setMsg('Erro ao salvar: '+error.message);return}
    setMsg('Agenda salva com sucesso!')
    setTimeout(()=>setMsg(''),3000)
  }

  if(carregando)return(<div style={{minHeight:'100vh',background:'#08060A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#B8AAB8',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#08060A',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar nome={nome} tituloMobile="Agenda"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:msg.includes('rro')?'rgba(239,68,68,.16)':'rgba(34,197,94,.16)',border:`1px solid ${msg.includes('rro')?'rgba(239,68,68,.36)':'rgba(34,197,94,.36)'}`,borderRadius:'10px',padding:'10px 20px',zIndex:99,color:msg.includes('rro')?'#EF4444':'#22C55E',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'#B8AAB8',textDecoration:'none',marginBottom:'18px'}}><ArrowLeft size={15}/> Voltar para Configurações</Link>

          <p style={{fontSize:'22px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em',marginBottom:'8px'}}>Agenda e horários</p>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginBottom:'24px'}}>Configure como sua agenda aparece para visitantes e clientes.</p>

          <div className="crd" style={{marginBottom:'20px'}}>
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Dias e horários de atendimento</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Defina os dias e horários disponíveis para agendamentos.</p>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'18px'}}>
              {DIAS.map((d,i)=>(
                <button key={d} onClick={()=>toggleDia(i)} className={`dia-btn${diasAtivos[i]?' on':''}`}>{d}</button>
              ))}
            </div>
            {DIAS.map((d,i)=>{
              if(!diasAtivos[i])return null
              return(
                <div key={d} style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'10px',padding:'12px 14px',background:'rgba(255,255,255,.03)',borderRadius:'10px',border:'1px solid rgba(255,255,255,.06)',flexWrap:'wrap'}}>
                  <span style={{fontSize:'12px',fontWeight:700,color:'#C4B5FD',width:'32px',flexShrink:0}}>{d}</span>
                  <input type="time" value={horarios[i]?.abertura||'08:00'} onChange={e=>setHor(i,'abertura',e.target.value)} style={{background:'rgba(24,16,27,.88)',border:'1px solid #2A1A2F',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',color:'#F8F4F7',outline:'none',fontFamily:'inherit',cursor:'pointer'}}/>
                  <span style={{fontSize:'12px',color:'#B8AAB8'}}>até</span>
                  <input type="time" value={horarios[i]?.fechamento||'18:00'} onChange={e=>setHor(i,'fechamento',e.target.value)} style={{background:'rgba(24,16,27,.88)',border:'1px solid #2A1A2F',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',color:'#F8F4F7',outline:'none',fontFamily:'inherit',cursor:'pointer'}}/>
                </div>
              )
            })}
          </div>

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Configurações da agenda</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Controle como o agendamento público funciona.</p>
            <div className="fg2" style={{marginBottom:'14px'}}>
              <div><label className="lbl">Intervalo entre horários</label><select className="inp" style={{cursor:'pointer'}} value={intervalo} onChange={e=>setIntervalo(e.target.value)}>{INTERVALOS.map(v=><option key={v}>{v}</option>)}</select></div>
              <div><label className="lbl">Antecedência mínima</label><select className="inp" style={{cursor:'pointer'}} value={antecedencia} onChange={e=>setAntecedencia(e.target.value)}>{ANTECEDENCIAS.map(v=><option key={v}>{v}</option>)}</select></div>
            </div>
            <div className="fg2">
              <div><label className="lbl">Abertura geral</label><input className="inp" type="time" value={abertura} onChange={e=>setAbertura(e.target.value)}/></div>
              <div><label className="lbl">Fechamento geral</label><input className="inp" type="time" value={fechamento} onChange={e=>setFechamento(e.target.value)}/></div>
            </div>
          </div>

          <button onClick={salvar} disabled={salvando} style={{width:'100%',marginTop:24,background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'14px',height:'52px',fontSize:'15px',fontWeight:800,cursor:salvando?'not-allowed':'pointer',fontFamily:'inherit',boxShadow:'0 12px 32px rgba(236,72,153,.30),0 0 28px rgba(139,92,246,.22)',opacity:salvando?.7:1,transition:'all .18s'}}>
            {salvando?'Salvando...':'Salvar agenda'}
          </button>

        </div></div>
      </div>
    </div>
  )
}
