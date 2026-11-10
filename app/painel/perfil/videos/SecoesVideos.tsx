'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'
import VerMiniPageButton from '@/app/components/VerMiniPageButton'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
input{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.18),transparent 32%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh}
.bdy{max-width:820px;margin:0 auto;padding:28px 32px 80px;width:100%}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px}
.lbl{display:block;font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:10px;padding:10px 12px;color:#F8F4F7;font-size:13px;font-family:inherit}
.inp:focus{outline:none;border-color:rgba(236,72,153,.5)}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}.fg2{grid-template-columns:1fr!important}}
`
const botoes = {background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',borderRadius:'8px',color:'#B8AAB8',cursor:'pointer',fontFamily:'inherit'} as const

type Secao = { id:string; user_id:string; titulo:string; subtitulo:string|null; ordem:number; ativo:boolean }

export default function SecoesVideos(){
  const [userId,setUserId] = useState('')
  const [secoes,setSecoes] = useState<Secao[]>([])
  const [contagens,setContagens] = useState<Record<string,number>>({})
  const [carregando,setCarregando] = useState(true)
  const [salvando,setSalvando] = useState(false)
  const [editando,setEditando] = useState<Secao|'novo'|null>(null)
  const [titulo,setTitulo] = useState('')
  const [subtitulo,setSubtitulo] = useState('')
  const [msg,setMsg] = useState('')

  useEffect(()=>{ void carregar() },[])

  async function carregar(){
    const {data:{user}} = await supabase.auth.getUser()
    if(!user){ window.location.href='/login';return }
    setUserId(user.id)
    const [{data:secs,error:erroSecoes},{data:videos,error:erroVideos}] = await Promise.all([
      supabase.from('pagina_videos_secoes').select('id,user_id,titulo,subtitulo,ordem,ativo').eq('user_id',user.id).order('ordem').order('created_at'),
      supabase.from('pagina_videos').select('secao_id').eq('user_id',user.id),
    ])
    if(erroSecoes || erroVideos){setMsg('Não foi possível carregar as seções. Atualize a página.');setCarregando(false);return}
    setSecoes((secs||[]) as Secao[])
    const contagem:Record<string,number>={}
    ;(videos||[]).forEach(v=>{ if(v.secao_id)contagem[v.secao_id]=(contagem[v.secao_id]||0)+1 })
    setContagens(contagem)
    setCarregando(false)
  }

  async function validarSessao(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return false}
    if(user.id!==userId){setMsg('Sua sessão mudou. Atualize a página.');return false}
    return true
  }
  function editar(sec:Secao|'novo'){
    setEditando(sec);setTitulo(sec==='novo'?'':sec.titulo);setSubtitulo(sec==='novo'?'':sec.subtitulo||'')
  }
  function fechar(){setEditando(null);setTitulo('');setSubtitulo('')}

  async function salvar(){
    if(!(await validarSessao())||!editando)return
    if(!titulo.trim()){setMsg('Informe o título da seção.');return}
    setSalvando(true)
    const dados={titulo:titulo.trim(),subtitulo:subtitulo.trim()||null}
    if(editando==='novo'){
      const {error}=await supabase.from('pagina_videos_secoes').insert({...dados,user_id:userId,ativo:true,ordem:secoes.length})
      if(error){setMsg('Não foi possível criar a seção: '+error.message)}
      else{fechar();setMsg('Seção criada.');await carregar()}
    }else{
      const {error}=await supabase.from('pagina_videos_secoes').update(dados).eq('id',editando.id).eq('user_id',userId)
      if(error)setMsg('Não foi possível editar: '+error.message)
      else{setSecoes(prev=>prev.map(sec=>sec.id===editando.id?{...sec,...dados}:sec));fechar();setMsg('Seção atualizada.')}
    }
    setSalvando(false)
  }
  async function visibilidade(sec:Secao){
    if(!(await validarSessao()))return
    const {error}=await supabase.from('pagina_videos_secoes').update({ativo:!sec.ativo}).eq('id',sec.id).eq('user_id',userId)
    if(error){setMsg('Não foi possível atualizar a visibilidade: '+error.message);return}
    setSecoes(prev=>prev.map(s=>s.id===sec.id?{...s,ativo:!s.ativo}:s))
  }
  async function excluir(sec:Secao){
    if(!(await validarSessao()))return
    if((contagens[sec.id]||0)>0){setMsg('Esta seção possui vídeos. Exclua ou mova os vídeos antes de excluí-la.');return}
    if(!window.confirm(`Excluir a seção "${sec.titulo}"?`))return
    const {error}=await supabase.from('pagina_videos_secoes').delete().eq('id',sec.id).eq('user_id',userId)
    if(error){setMsg('Não foi possível excluir. Confirme que a seção não possui vídeos.');return}
    setSecoes(prev=>prev.filter(s=>s.id!==sec.id))
  }
  async function mover(sec:Secao,direcao:-1|1){
    if(!(await validarSessao()))return
    const index=secoes.findIndex(s=>s.id===sec.id),novo=index+direcao
    if(index<0||novo<0||novo>=secoes.length)return
    const itens=[...secoes];[itens[index],itens[novo]]=[itens[novo],itens[index]]
    const ordenados=itens.map((s,i)=>({...s,ordem:i}))
    // Só atualiza a interface depois de todas as gravações confirmadas.
    for(const item of ordenados){
      const {error}=await supabase.from('pagina_videos_secoes').update({ordem:item.ordem}).eq('id',item.id).eq('user_id',userId)
      if(error){setMsg('Erro ao reordenar. Recarregando...');await carregar();return}
    }
    setSecoes(ordenados)
  }

  if(carregando)return <div style={{minHeight:'100vh',background:'#08060A',color:'#B8AAB8',padding:32}}>Carregando seções...</div>
  return <div style={{display:'flex',minHeight:'100vh',background:'#08060A',fontFamily:'system-ui,sans-serif',width:'100%',overflowX:'hidden'}}>
    <style dangerouslySetInnerHTML={{__html:CSS}}/>
    <PainelSidebar tituloMobile="Vídeos"/>
    <div className="psb-main"><div className="pg"><div className="bdy">
      <Link href="/painel/perfil" style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:13,color:'#B8AAB8',textDecoration:'none',marginBottom:18}}><ArrowLeft size={15}/> Voltar para Configurações</Link>
      <h1 style={{fontSize:22,fontWeight:800,color:'#F8F4F7',marginBottom:8}}>Seções de vídeos</h1>
      <p style={{color:'#B8AAB8',fontSize:13,marginBottom:22}}>Crie grupos de vídeos com títulos personalizados. Na Ordem da página pública, cada seção pode ocupar uma posição diferente.</p>
      {msg&&<p role="status" style={{background:'rgba(139,92,246,.12)',color:'#F8F4F7',padding:12,borderRadius:10,marginBottom:16,fontSize:13}}>{msg}</p>}
      {editando&&<div className="crd" style={{padding:18,marginBottom:20}}>
        <h2 style={{color:'#F8F4F7',fontSize:15,marginBottom:14}}>{editando==='novo'?'Nova seção':'Editar seção'}</h2>
        <div className="fg2" style={{marginBottom:14}}>
          <div><label className="lbl">Título *</label><input className="inp" value={titulo} onChange={e=>setTitulo(e.target.value)} maxLength={120} placeholder="Ex.: Tutoriais"/></div>
          <div><label className="lbl">Subtítulo (opcional)</label><input className="inp" value={subtitulo} onChange={e=>setSubtitulo(e.target.value)} maxLength={250} placeholder="Ex.: Aprenda passo a passo"/></div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button type="button" onClick={fechar} style={{...botoes,padding:'9px 15px'}}>Cancelar</button>
          <button type="button" disabled={salvando} onClick={()=>void salvar()} style={{background:G,color:'#fff',border:0,borderRadius:8,padding:'9px 15px',cursor:'pointer'}}>{salvando?'Salvando...':'Salvar seção'}</button>
        </div>
      </div>}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:18}}>
        <span style={{color:'#F8F4F7',fontWeight:700}}>Suas seções ({secoes.length})</span>
        <div style={{display:'flex',gap:10,alignItems:'center'}}><VerMiniPageButton/><button type="button" onClick={()=>editar('novo')} style={{background:G,border:0,borderRadius:10,padding:'10px 18px',color:'#fff',fontWeight:700,cursor:'pointer'}}>+ Nova seção</button></div>
      </div>
      {secoes.length===0&&<p style={{fontSize:13,color:'#B8AAB8'}}>Nenhuma seção cadastrada.</p>}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {secoes.map((sec,i)=><div className="crd" key={sec.id} style={{padding:16,display:'flex',gap:12}}>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            <button type="button" aria-label="Subir seção" disabled={i===0} onClick={()=>void mover(sec,-1)} style={{...botoes,width:28,height:28,opacity:i===0?.4:1}}><ArrowUp size={14}/></button>
            <button type="button" aria-label="Descer seção" disabled={i===secoes.length-1} onClick={()=>void mover(sec,1)} style={{...botoes,width:28,height:28,opacity:i===secoes.length-1?.4:1}}><ArrowDown size={14}/></button>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{color:'#F8F4F7',fontSize:15,fontWeight:700}}>{sec.titulo}</p>
            {sec.subtitulo&&<p style={{color:'#B8AAB8',fontSize:12,marginTop:3}}>{sec.subtitulo}</p>}
            <p style={{color:'#8B7D8B',fontSize:12,marginTop:7,marginBottom:13}}>{contagens[sec.id]||0} vídeos · {sec.ativo?'Visível':'Oculta'}</p>
            <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
              <Link href={`/painel/perfil/videos/${sec.id}`} style={{background:G,color:'#fff',borderRadius:8,padding:'8px 14px',fontSize:12,fontWeight:700,textDecoration:'none'}}>Gerenciar vídeos</Link>
              <button type="button" onClick={()=>editar(sec)} style={{...botoes,padding:'8px 14px'}}>Editar</button>
              <button type="button" onClick={()=>void visibilidade(sec)} style={{...botoes,padding:'8px 14px',color:sec.ativo?'#22C55E':'#B8AAB8'}}>{sec.ativo?'Ocultar':'Mostrar'}</button>
              <button type="button" onClick={()=>void excluir(sec)} style={{...botoes,padding:'8px 14px',color:'#EF4444'}}>Excluir</button>
            </div>
          </div>
        </div>)}
      </div>
    </div></div></div>
  </div>
}
