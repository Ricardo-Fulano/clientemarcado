'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
import { normalizarPlano, obterNomePlano, obterLimiteSecoesDestaques } from '../../../lib/planos'

const G='linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

// Lista de SECOES de destaques - adaptada diretamente do padrao ja usado e aprovado em
// ListaCatalogos (app/painel/perfil/catalogo/page.tsx), so trocando os nomes das tabelas
// e textos. Mesma logica de limite por plano, mesmo layout, mesmo fluxo de criar/editar/
// mover/ativar/excluir.
function proximoPlanoSugestao(planoTipo: string | null | undefined) {
  const p = normalizarPlano(planoTipo)
  if (p === 'free') return obterNomePlano('minipage')
  if (p === 'minipage') return obterNomePlano('loja')
  return null // loja, essencial (Pro) e equipe ja tem secoes ilimitadas
}

function mensagemLimiteSecao(limite: number, proximo: string | null) {
  const sugestao = proximo ? ` Para criar${limite === 0 ? '' : ' mais'} seções de destaques, altere para o plano ${proximo}.` : ''
  if (limite === 0) return `Destaques estão disponíveis a partir do plano MiniPage.${sugestao}`
  if (limite === 1) return `Seu plano permite 1 seção de destaques.${sugestao}`
  return `Seu plano permite até ${limite} seções de destaques.${sugestao}`
}

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
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}.fg2{grid-template-columns:1fr!important}}
`

export default function ListaSecoesDestaques(){
  const [userId,setUserId]=useState('')
  const [planoTipo,setPlanoTipo]=useState('essencial')
  const [secoes,setSecoes]=useState<any[]>([])
  const [contagemItens,setContagemItens]=useState<Record<string,number>>({})
  const [carregando,setCarregando]=useState(true)
  const [msg,setMsg]=useState('')
  const [editando,setEditando]=useState<any>(null)
  const [tituloForm,setTituloForm]=useState('')
  const [subtituloForm,setSubtituloForm]=useState('')
  const [salvando,setSalvando]=useState(false)

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const [{data:perfil},{data:secs}]=await Promise.all([
      supabase.from('perfis').select('plano_tipo').eq('user_id',user.id).maybeSingle(),
      supabase.from('pagina_destaques_secoes').select('*').eq('user_id',user.id).order('ordem'),
    ])
    if(perfil?.plano_tipo) setPlanoTipo(perfil.plano_tipo)
    const listaSecoes=secs||[]
    setSecoes(listaSecoes)

    if(listaSecoes.length>0){
      const {data:todosItens}=await supabase.from('pagina_destaques').select('secao_id').eq('user_id',user.id)
      const contagem:Record<string,number>={}
      ;(todosItens||[]).forEach((it:any)=>{ if(it.secao_id) contagem[it.secao_id]=(contagem[it.secao_id]||0)+1 })
      setContagemItens(contagem)
    }
    setCarregando(false)
  }

  async function validarSessao(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return false}
    if(user.id!==userId){setMsg('A sessão mudou. Recarregue a página antes de salvar.');return false}
    return true
  }

  function abrirNovo(){
    const limite=obterLimiteSecoesDestaques(planoTipo)
    if(secoes.length>=limite){
      const proximo=proximoPlanoSugestao(planoTipo)
      setMsg(mensagemLimiteSecao(limite, proximo))
      setTimeout(()=>setMsg(''),6000)
      return
    }
    setEditando({novo:true})
    setTituloForm('')
    setSubtituloForm('')
  }
  function abrirEditar(sec:any){
    setEditando(sec)
    setTituloForm(sec.titulo||'')
    setSubtituloForm(sec.subtitulo||'')
  }
  function fecharForm(){
    setEditando(null)
    setTituloForm('')
    setSubtituloForm('')
  }

  async function salvarSecao(){
    if(!(await validarSessao()))return
    if(!tituloForm.trim()){setMsg('Dê um título para a seção de destaques.');return}
    setSalvando(true)
    if(editando.novo){
      const limite=obterLimiteSecoesDestaques(planoTipo)
      if(secoes.length>=limite){
        const proximo=proximoPlanoSugestao(planoTipo)
        setMsg(mensagemLimiteSecao(limite, proximo))
        setSalvando(false)
        return
      }
      const payload={user_id:userId,titulo:tituloForm.trim(),subtitulo:subtituloForm.trim()||null,ativo:true,ordem:secoes.length}
      const {data,error}=await supabase.from('pagina_destaques_secoes').insert(payload).select().single()
      if(error){setMsg('Erro ao criar seção: '+error.message)}
      else{setSecoes(prev=>[...prev,data]);setMsg('Seção criada!');fecharForm()}
    } else {
      const payload={titulo:tituloForm.trim(),subtitulo:subtituloForm.trim()||null}
      const {error}=await supabase.from('pagina_destaques_secoes').update(payload).eq('id',editando.id).eq('user_id',userId)
      if(error){setMsg('Erro ao salvar: '+error.message)}
      else{setSecoes(prev=>prev.map(s=>s.id===editando.id?{...s,...payload}:s));setMsg('Seção salva!');fecharForm()}
    }
    setSalvando(false)
    setTimeout(()=>setMsg(''),3000)
  }

  async function toggleAtivo(sec:any){
    if(!(await validarSessao()))return
    const {error}=await supabase.from('pagina_destaques_secoes').update({ativo:!sec.ativo}).eq('id',sec.id).eq('user_id',userId)
    if(error){setMsg('Erro: '+error.message);return}
    setSecoes(prev=>prev.map(s=>s.id===sec.id?{...s,ativo:!s.ativo}:s))
  }

  async function excluirSecao(sec:any){
    if(!(await validarSessao()))return
    const qtdItens=contagemItens[sec.id]||0
    // Nao promete mais cascade delete (que nunca existiu de verdade - so gerava erro tecnico
    // de foreign key) - agora bloqueia de proposito, pedindo pro dono esvaziar a secao antes.
    if(qtdItens>0){
      setMsg('Esta seção possui destaques cadastrados. Exclua os destaques primeiro ou mova-os para outra seção antes de excluir.')
      setTimeout(()=>setMsg(''),6000)
      return
    }
    if(!window.confirm('Excluir esta seção?'))return
    const {error}=await supabase.from('pagina_destaques_secoes').delete().eq('id',sec.id).eq('user_id',userId)
    if(error){
      // Defesa extra: se por algum motivo ainda vier erro de foreign key (ex: contagem
      // desatualizada), nunca mostra o erro tecnico cru pro usuario.
      if(error.message.includes('foreign key')||error.message.includes('violates')){
        setMsg('Esta seção possui destaques cadastrados. Exclua os destaques primeiro ou mova-os para outra seção antes de excluir.')
      } else {
        setMsg('Erro ao excluir: '+error.message)
      }
      return
    }
    setSecoes(prev=>prev.filter(s=>s.id!==sec.id))
  }

  async function mover(id:string,direcao:'up'|'down'){
    const idx=secoes.findIndex(s=>s.id===id)
    if(idx<0)return
    const novoIdx=direcao==='up'?idx-1:idx+1
    if(novoIdx<0||novoIdx>=secoes.length)return
    const copia=[...secoes]
    ;[copia[idx],copia[novoIdx]]=[copia[novoIdx],copia[idx]]
    const comOrdem=copia.map((item,i)=>({...item,ordem:i}))
    setSecoes(comOrdem)
    for(const item of comOrdem){
      await supabase.from('pagina_destaques_secoes').update({ordem:item.ordem}).eq('id',item.id).eq('user_id',userId)
    }
  }

  if(carregando)return(<div style={{minHeight:'100vh',background:'#08060A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#B8AAB8',fontSize:'14px'}}>Carregando...</p></div>)

  const limite=obterLimiteSecoesDestaques(planoTipo)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#08060A',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar tituloMobile="Destaques"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:msg.includes('rro')?'rgba(239,68,68,.16)':msg.includes('disponíveis')||msg.includes('permite')?'rgba(250,204,21,.16)':'rgba(34,197,94,.16)',border:`1px solid ${msg.includes('rro')?'rgba(239,68,68,.36)':msg.includes('disponíveis')||msg.includes('permite')?'rgba(250,204,21,.36)':'rgba(34,197,94,.36)'}`,borderRadius:'10px',padding:'10px 20px',zIndex:99,color:msg.includes('rro')?'#EF4444':msg.includes('disponíveis')||msg.includes('permite')?'#FACC15':'#22C55E',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',maxWidth:'90vw',textAlign:'center'}}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'#B8AAB8',textDecoration:'none',marginBottom:'18px'}}><ArrowLeft size={15}/> Voltar para Configurações</Link>

          <p style={{fontSize:'22px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em',marginBottom:'8px'}}>Destaques</p>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginBottom:'6px'}}>Organize ofertas, vendedores, produtos recomendados ou divulgações em seções separadas de destaques.</p>
          <p style={{fontSize:'12px',color:'#8B7D8B',marginBottom:'24px'}}>{limite===Infinity?`${secoes.length} seções (ilimitado no seu plano)`:`${secoes.length} de ${limite} seções usadas no seu plano.`}</p>

          {editando && (
            <div className="crd" style={{padding:'18px',marginBottom:'20px'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#F8F4F7',marginBottom:'14px'}}>{editando.novo?'Nova seção de destaques':'Editar seção'}</p>
              <div className="fg2" style={{marginBottom:'14px'}}>
                <div><label className="lbl">Título *</label><input className="inp" autoFocus value={tituloForm} onChange={e=>setTituloForm(e.target.value)} placeholder="Ex: Ofertas principais"/></div>
                <div><label className="lbl">Subtítulo (opcional)</label><input className="inp" value={subtituloForm} onChange={e=>setSubtituloForm(e.target.value)} placeholder="Ex: Aproveite antes que acabe"/></div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button type="button" onClick={fecharForm} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'8px',padding:'9px 16px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
                <button type="button" onClick={salvarSecao} disabled={salvando} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'9px 18px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:salvando?.7:1}}>{salvando?'Salvando...':'Salvar seção'}</button>
              </div>
            </div>
          )}

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',marginBottom:'20px'}}>
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7'}}>Suas seções de destaques</p>
            <button type="button" onClick={abrirNovo} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Nova seção</button>
          </div>

          {secoes.length===0&&<p style={{fontSize:'13px',color:'#B8AAB8',padding:'12px 0'}}>Nenhuma seção de destaques cadastrada ainda.</p>}

          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {secoes.map((sec,i)=>{
              const qtdItens=contagemItens[sec.id]||0
              return (
                <div key={sec.id} className="crd" style={{padding:'16px',display:'flex',gap:'12px'}}>
                  <div style={{display:'flex',flexDirection:'column',gap:'4px',flexShrink:0,paddingTop:'2px'}}>
                    <button type="button" onClick={()=>mover(sec.id,'up')} disabled={i===0} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===0?'#4A3F4E':'#B8AAB8',cursor:i===0?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowUp size={14}/></button>
                    <button type="button" onClick={()=>mover(sec.id,'down')} disabled={i===secoes.length-1} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===secoes.length-1?'#4A3F4E':'#B8AAB8',cursor:i===secoes.length-1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowDown size={14}/></button>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'2px'}}>{sec.titulo}</p>
                    {sec.subtitulo && <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'6px'}}>{sec.subtitulo}</p>}
                    <p style={{fontSize:'12px',color:'#8B7D8B',marginBottom:'14px'}}>{qtdItens} destaque{qtdItens!==1?'s':''} · <span style={{color:sec.ativo?'#22C55E':'#B8AAB8'}}>{sec.ativo?'Ativo':'Oculto'}</span></p>
                    <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                      <Link href={`/painel/perfil/destaques/${sec.id}`} style={{background:G,color:'#fff',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:700,textDecoration:'none',fontFamily:'inherit'}}>Gerenciar destaques</Link>
                      <button type="button" onClick={()=>abrirEditar(sec)} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                      <button type="button" onClick={()=>toggleAtivo(sec)} style={{background:sec.ativo?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(sec.ativo?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:8,padding:'8px 14px',fontSize:12,fontWeight:700,color:sec.ativo?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit'}}>{sec.ativo?'Desativar':'Ativar'}</button>
                      <button type="button" onClick={()=>excluirSecao(sec)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',color:'#EF4444',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

        </div></div>
      </div>
    </div>
  )
}
