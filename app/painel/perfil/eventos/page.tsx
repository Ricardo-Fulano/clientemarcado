'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
import BloqueioPorPlano from '@/app/components/BloqueioPorPlano'
import { permiteAgendaEventos } from '../../../lib/planos'

const G='linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
input,select,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.18),transparent 32%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh}
.bdy{max-width:820px;margin:0 auto;padding:28px 32px 80px;width:100%}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px}
.lbl{display:block;font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:10px;padding:10px 12px;color:#F8F4F7;font-size:13px;font-family:inherit}
.inp:focus{outline:none;border-color:rgba(236,72,153,.5)}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}}
`

export default function GerenciarEventos(){
  const [userId,setUserId]=useState('')
  const [planoTipo,setPlanoTipo]=useState('essencial')
  const [eventos,setEventos]=useState<any[]>([])
  const [carregando,setCarregando]=useState(true)
  const [msg,setMsg]=useState('')
  const [salvandoId,setSalvandoId]=useState('')

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const [{data},{data:perfil}]=await Promise.all([
      supabase.from('pagina_eventos').select('*').eq('user_id',user.id).order('ordem'),
      supabase.from('perfis').select('plano_tipo').eq('user_id',user.id).maybeSingle(),
    ])
    if(perfil?.plano_tipo) setPlanoTipo(perfil.plano_tipo)
    setEventos(data||[])
    setCarregando(false)
  }

  async function validarSessao(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return false}
    if(user.id!==userId){setMsg('A sessão mudou. Recarregue a página antes de salvar.');return false}
    return true
  }

  function novoEvento(){
    setEventos(prev=>[{id:'novo-'+Date.now(),user_id:userId,titulo:'',url:'',ativo:true,ordem:prev.length,_novo:true},...prev])
  }
  function editarEvento(id:string,campo:string,valor:any){
    setEventos(prev=>prev.map(e=>e.id===id?{...e,[campo]:valor}:e))
  }
  function normalizarUrl(valor:string):string{
    let v=(valor||'').trim()
    if(!v)return ''
    if(!/^https?:\/\//i.test(v)){v='https://'+v.replace(/^\/+/,'')}
    return v
  }
  async function salvarEvento(e:any){
    if(!(await validarSessao()))return
    if(!e.titulo?.trim()){setMsg('Dê um título para o evento.');return}
    const urlFinal=normalizarUrl(e.url)
    if(!urlFinal){setMsg('Informe o link do evento.');return}
    setSalvandoId(e.id)
    const payload={user_id:userId,titulo:e.titulo.trim(),url:urlFinal,ativo:!!e.ativo,ordem:e.ordem||0}
    if(e._novo){
      const {data,error}=await supabase.from('pagina_eventos').insert(payload).select().single()
      if(error){setMsg('Erro ao salvar evento: '+error.message)}
      else{setEventos(prev=>prev.map(x=>x.id===e.id?data:x));setMsg('Evento salvo!')}
    } else {
      const {error}=await supabase.from('pagina_eventos').update(payload).eq('id',e.id).eq('user_id',userId)
      if(error){setMsg('Erro ao salvar evento: '+error.message)}
      else{setMsg('Evento salvo!')}
    }
    setSalvandoId('')
    setTimeout(()=>setMsg(''),3000)
  }
  async function excluirEvento(id:string){
    if(!(await validarSessao()))return
    if(!id.startsWith('novo-')){
      const {error}=await supabase.from('pagina_eventos').delete().eq('id',id).eq('user_id',userId)
      if(error){setMsg('Erro ao excluir: '+error.message);return}
    }
    setEventos(prev=>prev.filter(e=>e.id!==id))
  }
  async function mover(id:string,direcao:'up'|'down'){
    const idx=eventos.findIndex(e=>e.id===id)
    if(idx<0)return
    const novoIdx=direcao==='up'?idx-1:idx+1
    if(novoIdx<0||novoIdx>=eventos.length)return
    const copia=[...eventos]
    ;[copia[idx],copia[novoIdx]]=[copia[novoIdx],copia[idx]]
    const comOrdem=copia.map((item,i)=>({...item,ordem:i}))
    setEventos(comOrdem)
    for(const item of comOrdem){
      if(!item.id.startsWith('novo-')){
        await supabase.from('pagina_eventos').update({ordem:item.ordem}).eq('id',item.id).eq('user_id',userId)
      }
    }
  }

  if(carregando)return(<div style={{minHeight:'100vh',background:'#08060A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#B8AAB8',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#08060A',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar tituloMobile="Eventos"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">
        <BloqueioPorPlano permitido={permiteAgendaEventos(planoTipo)} titulo="Agenda/Eventos disponível a partir do plano MiniPage" descricao="O plano Free é uma amostra limitada da MiniPage Pro. Faça upgrade para usar Agenda/Eventos na sua página.">

          {msg&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:msg.includes('rro')?'rgba(239,68,68,.16)':'rgba(34,197,94,.16)',border:`1px solid ${msg.includes('rro')?'rgba(239,68,68,.36)':'rgba(34,197,94,.36)'}`,borderRadius:'10px',padding:'10px 20px',zIndex:99,color:msg.includes('rro')?'#EF4444':'#22C55E',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'#B8AAB8',textDecoration:'none',marginBottom:'18px'}}><ArrowLeft size={15}/> Voltar para Configurações</Link>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',marginBottom:'8px'}}>
            <p style={{fontSize:'22px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em'}}>Agenda / Eventos</p>
            <button type="button" onClick={novoEvento} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Adicionar evento</button>
          </div>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginBottom:'24px'}}>Adicione seus próximos eventos, shows, workshops ou datas importantes. Use as setas para mudar a ordem de exibição.</p>

          {eventos.length===0&&<p style={{fontSize:'13px',color:'#B8AAB8',padding:'12px 0'}}>Nenhum evento cadastrado ainda.</p>}

          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {eventos.map((e,i)=>(
              <div key={e.id} className="crd" style={{padding:'16px',display:'flex',gap:'12px'}}>
                <div style={{display:'flex',flexDirection:'column',gap:'4px',flexShrink:0,paddingTop:'2px'}}>
                  <button type="button" onClick={()=>mover(e.id,'up')} disabled={i===0} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===0?'#4A3F4E':'#B8AAB8',cursor:i===0?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowUp size={14}/></button>
                  <button type="button" onClick={()=>mover(e.id,'down')} disabled={i===eventos.length-1} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===eventos.length-1?'#4A3F4E':'#B8AAB8',cursor:i===eventos.length-1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowDown size={14}/></button>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{marginBottom:'10px'}}>
                    <label className="lbl">Título</label>
                    <input className="inp" autoFocus={!!e._novo} value={e.titulo||''} onChange={ev=>editarEvento(e.id,'titulo',ev.target.value)} placeholder="Ex: 21/08 | SÃO PAULO — CARIOCA CLUB"/>
                  </div>
                  <div style={{marginBottom:'12px'}}>
                    <label className="lbl">Link do evento</label>
                    <input className="inp" value={e.url||''} onChange={ev=>editarEvento(e.id,'url',ev.target.value)} placeholder="https://site-de-ingressos.com/evento/..."/>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                    <button type="button" onClick={()=>editarEvento(e.id,'ativo',!e.ativo)} style={{background:e.ativo?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(e.ativo?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,color:e.ativo?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit'}}>{e.ativo?'Ativo':'Oculto'}</button>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button type="button" onClick={()=>excluirEvento(e.id)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',color:'#EF4444',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                      <button type="button" onClick={()=>salvarEvento(e)} disabled={salvandoId===e.id} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:salvandoId===e.id?.7:1}}>{salvandoId===e.id?'Salvando...':'Salvar'}</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </BloqueioPorPlano>
        </div></div>
      </div>
    </div>
  )
}
