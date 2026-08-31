'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
import BloqueioPorPlano from '@/app/components/BloqueioPorPlano'
import { permiteVideos } from '../../../lib/planos'

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
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}.fg2{grid-template-columns:1fr!important}}
`

const FORMATO_RATIO_PAINEL:Record<string,string>={'16:9':'16/9','9:16':'9/16','4:3':'4/3','1:1':'1/1'}

export default function GerenciarVideos(){
  const [userId,setUserId]=useState('')
  const [planoTipo,setPlanoTipo]=useState('essencial')
  const [videos,setVideos]=useState<any[]>([])
  const [carregando,setCarregando]=useState(true)
  const [msg,setMsg]=useState('')
  const [salvandoId,setSalvandoId]=useState('')
  const [uploadingId,setUploadingId]=useState('')
  const [gerandoCapaId,setGerandoCapaId]=useState('')
  const imgRef=useRef<HTMLInputElement>(null)

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const [{data},{data:perfil}]=await Promise.all([
      supabase.from('pagina_videos').select('*').eq('user_id',user.id).order('ordem'),
      supabase.from('perfis').select('plano_tipo').eq('user_id',user.id).maybeSingle(),
    ])
    if(perfil?.plano_tipo) setPlanoTipo(perfil.plano_tipo)
    setVideos(data||[])
    setCarregando(false)
  }

  async function validarSessao(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return false}
    if(user.id!==userId){setMsg('A sessão mudou. Recarregue a página antes de salvar.');return false}
    return true
  }

  function normalizarUrl(valor:string):string{
    let v=(valor||'').trim()
    if(!v)return ''
    const markdown=v.match(/\[([^\]]*)\]\(([^)]+)\)/)
    if(markdown){v=(markdown[2]||markdown[1]||'').trim()}
    else{v=v.replace(/^\[+|\]+$/g,'').trim()}
    if(!v)return ''
    if(!/^https?:\/\//i.test(v)){v='https://'+v.replace(/^\/+/,'')}
    return v
  }
  function detectarVideo(url:string){
    const u=(url||'').toLowerCase()
    if(u.includes('youtube.com/shorts/'))return {plataforma:'youtube',formato:'9:16'}
    if(u.includes('youtu.be/')||u.includes('youtube.com'))return {plataforma:'youtube',formato:'16:9'}
    if(u.includes('instagram.com/reel'))return {plataforma:'instagram',formato:'9:16'}
    if(u.includes('instagram.com/p/'))return {plataforma:'instagram',formato:'1:1'}
    if(u.includes('instagram.com'))return {plataforma:'instagram',formato:'9:16'}
    if(u.includes('tiktok.com'))return {plataforma:'tiktok',formato:'9:16'}
    if(u.includes('vimeo.com'))return {plataforma:'vimeo',formato:'16:9'}
    return {plataforma:'outro',formato:'16:9'}
  }
  function formatoLabel(formato:string){
    if(formato==='9:16')return 'Formato detectado: vídeo vertical'
    if(formato==='1:1')return 'Formato detectado: vídeo quadrado'
    if(formato==='4:3'||formato==='16:9')return 'Formato detectado: vídeo horizontal'
    return 'Formato detectado automaticamente. Se a prévia não ficar boa, ajuste em Configurações avançadas.'
  }
  function thumbYoutube(url:string){
    const m=(url||'').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/)
    return m?`https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`:''
  }
  function labelPlaceholderPainel(v:{plataforma?:string;formato?:string}){
    if(v.plataforma==='instagram')return v.formato==='1:1'?'Post do Instagram':'Reels do Instagram'
    if(v.plataforma==='tiktok')return 'Vídeo do TikTok'
    if(v.plataforma==='vimeo')return 'Vídeo'
    return 'Conteúdo em vídeo'
  }
  function novoVideo(){
    setVideos(prev=>[{id:'novo-'+Date.now(),user_id:userId,titulo:'',descricao:'',url_video:'',plataforma:'youtube',thumbnail_url:'',formato:'16:9',link_destino:'',texto_cta:'',texto_botao_video:'Assistir vídeo',ordem:prev.length,ativo:true,_novo:true},...prev])
  }
  function editarVideo(id:string,campo:string,valor:any){
    setVideos(prev=>prev.map(v=>{
      if(v.id!==id)return v
      const atualizado={...v,[campo]:valor}
      if(campo==='url_video'){
        const det=detectarVideo(valor)
        atualizado.plataforma=det.plataforma
        atualizado.formato=det.formato
      }
      return atualizado
    }))
  }

  // Reaproveita a mesma API criada pro Catalogo (ja detecta YouTube/Vimeo/Open Graph
  // generico). Pra YouTube isso ja acontece automaticamente sem precisar de botao (via
  // thumbYoutube), entao esse botao ajuda principalmente Vimeo e paginas com Open Graph -
  // Instagram/TikTok tendem a bloquear e continuam precisando de capa manual mesmo assim.
  async function gerarCapaAutomatica(v:any){
    if(!v.url_video?.trim()){setMsg('Cole o link do vídeo antes de gerar a capa.');return}
    setGerandoCapaId(v.id)
    try{
      const res=await fetch('/api/catalogo/preview-link',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:v.url_video.trim()})})
      const dados=await res.json()
      if(!dados.success||!dados.imagem_url){
        setMsg('Não foi possível gerar a capa automaticamente. Você pode enviar uma manualmente.')
      }else{
        editarVideo(v.id,'thumbnail_url',dados.imagem_url)
        setMsg('Capa encontrada! Revise antes de salvar.')
      }
    }catch{
      setMsg('Não foi possível gerar a capa automaticamente. Você pode enviar uma manualmente.')
    }
    setGerandoCapaId('')
    setTimeout(()=>setMsg(''),5000)
  }
  async function salvarVideo(v:any){
    if(!(await validarSessao()))return
    if(!v.titulo?.trim()){setMsg('Dê um título para o vídeo.');return}
    const urlVideoNorm=normalizarUrl(v.url_video)
    const linkDestinoNorm=normalizarUrl(v.link_destino)
    if(!urlVideoNorm||!/^https?:\/\//i.test(urlVideoNorm)){setMsg('Informe um link de vídeo válido.');return}
    if(v.link_destino?.trim()&&(!linkDestinoNorm||!/^https?:\/\//i.test(linkDestinoNorm))){setMsg('Informe um link de destino válido.');return}
    setSalvandoId(v.id)
    const payload={
      user_id:userId,
      titulo:v.titulo.trim(),
      descricao:v.descricao?.trim()||null,
      url_video:urlVideoNorm,
      plataforma:v.plataforma||detectarVideo(urlVideoNorm).plataforma,
      thumbnail_url:v.thumbnail_url?.trim()||null,
      formato:v.formato||'16:9',
      link_destino:linkDestinoNorm||null,
      texto_cta:linkDestinoNorm?(v.texto_cta?.trim()||'Saiba mais'):null,
      texto_botao_video:v.texto_botao_video?.trim()||'Assistir vídeo',
      ordem:v.ordem||0,
      ativo:!!v.ativo,
    }
    if(v._novo){
      const {data,error}=await supabase.from('pagina_videos').insert(payload).select().single()
      if(error){setMsg('Erro ao salvar vídeo: '+error.message)}
      else{setVideos(prev=>prev.map(x=>x.id===v.id?data:x));setMsg('Vídeo salvo!')}
    } else {
      const {error}=await supabase.from('pagina_videos').update(payload).eq('id',v.id).eq('user_id',userId)
      if(error){setMsg('Erro ao salvar vídeo: '+error.message)}
      else{setMsg('Vídeo salvo!')}
    }
    setSalvandoId('')
    setTimeout(()=>setMsg(''),3000)
  }
  async function excluirVideo(id:string){
    if(!(await validarSessao()))return
    if(!id.startsWith('novo-')){
      const {error}=await supabase.from('pagina_videos').delete().eq('id',id).eq('user_id',userId)
      if(error){setMsg('Erro ao excluir: '+error.message);return}
    }
    setVideos(prev=>prev.filter(v=>v.id!==id))
  }
  async function mover(id:string,direcao:'up'|'down'){
    const idx=videos.findIndex(v=>v.id===id)
    if(idx<0)return
    const novoIdx=direcao==='up'?idx-1:idx+1
    if(novoIdx<0||novoIdx>=videos.length)return
    const copia=[...videos]
    ;[copia[idx],copia[novoIdx]]=[copia[novoIdx],copia[idx]]
    const comOrdem=copia.map((item,i)=>({...item,ordem:i}))
    setVideos(comOrdem)
    for(const item of comOrdem){
      if(!item.id.startsWith('novo-')){
        await supabase.from('pagina_videos').update({ordem:item.ordem}).eq('id',item.id).eq('user_id',userId)
      }
    }
  }
  async function uploadCapaVideo(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];const id=uploadingId
    if(!file||!id)return
    if(!(await validarSessao()))return
    const allowedTypes=['image/jpeg','image/jpg','image/png','image/webp']
    if(!allowedTypes.includes(file.type)){setMsg('Envie uma imagem JPG, PNG ou WEBP.');return}
    if(file.size>5*1024*1024){setMsg('A imagem deve ter no máximo 5MB.');return}
    const ext=file.name.split('.').pop()?.toLowerCase()||'png'
    const path=`videos/${userId}-${Date.now()}.${ext}`
    const {error:uploadError}=await supabase.storage.from('fotos').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'})
    if(uploadError){setMsg('Erro no upload: '+uploadError.message);setUploadingId('');if(imgRef.current)imgRef.current.value='';return}
    const {data}=supabase.storage.from('fotos').getPublicUrl(path)
    editarVideo(id,'thumbnail_url',data.publicUrl)
    setMsg('Capa enviada! Clique em "Salvar" no vídeo pra confirmar.')
    setTimeout(()=>setMsg(''),3500)
    setUploadingId('')
    if(imgRef.current)imgRef.current.value=''
  }

  if(carregando)return(<div style={{minHeight:'100vh',background:'#08060A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#B8AAB8',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#08060A',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar tituloMobile="Vídeos"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">
        <BloqueioPorPlano permitido={permiteVideos(planoTipo)} titulo="Vídeos disponível a partir do plano MiniPage" descricao="O plano Free é uma amostra limitada da MiniPage Pro. Faça upgrade para usar Vídeos em destaque na sua página.">

          {msg&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:msg.includes('rro')?'rgba(239,68,68,.16)':'rgba(34,197,94,.16)',border:`1px solid ${msg.includes('rro')?'rgba(239,68,68,.36)':'rgba(34,197,94,.36)'}`,borderRadius:'10px',padding:'10px 20px',zIndex:99,color:msg.includes('rro')?'#EF4444':'#22C55E',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'#B8AAB8',textDecoration:'none',marginBottom:'18px'}}><ArrowLeft size={15}/> Voltar para Configurações</Link>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',marginBottom:'8px'}}>
            <p style={{fontSize:'22px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em'}}>Vídeos da página</p>
            <button type="button" onClick={novoVideo} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Novo vídeo</button>
          </div>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginBottom:'4px'}}>Cole o link de um vídeo do YouTube, Instagram, TikTok ou outra plataforma. O formato ideal é detectado automaticamente.</p>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginBottom:'24px'}}>Use as setas para mudar a ordem de exibição.</p>

          {videos.length===0&&<p style={{fontSize:'13px',color:'#B8AAB8',padding:'12px 0'}}>Nenhum vídeo cadastrado ainda. Adicione vídeos para destacar conteúdos, cursos, mentorias ou produtos na sua página.</p>}

          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {videos.map((v,i)=>(
              <div key={v.id} className="crd" style={{padding:'16px',display:'flex',gap:'12px',border:'1px solid rgba(229,72,184,.18)'}}>
                <div style={{display:'flex',flexDirection:'column',gap:'4px',flexShrink:0,paddingTop:'2px'}}>
                  <button type="button" onClick={()=>mover(v.id,'up')} disabled={i===0} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===0?'#4A3F4E':'#B8AAB8',cursor:i===0?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowUp size={14}/></button>
                  <button type="button" onClick={()=>mover(v.id,'down')} disabled={i===videos.length-1} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===videos.length-1?'#4A3F4E':'#B8AAB8',cursor:i===videos.length-1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowDown size={14}/></button>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{marginBottom:'10px'}}><label className="lbl">Título</label><input className="inp" autoFocus={!!v._novo} value={v.titulo||''} onChange={e=>editarVideo(v.id,'titulo',e.target.value)} placeholder="Ex: Lançamento da Mentoria Nail Designer"/></div>
                  <div style={{marginBottom:'10px'}}><label className="lbl">Descrição (opcional)</label><input className="inp" value={v.descricao||''} onChange={e=>editarVideo(v.id,'descricao',e.target.value)} placeholder="Ex: Veja como funciona a mentoria para profissionais da beleza."/></div>
                  <div style={{marginBottom:'6px'}}>
                    <label className="lbl">Link do vídeo</label>
                    <input className="inp" value={v.url_video||''} onChange={e=>editarVideo(v.id,'url_video',e.target.value)} placeholder="https://youtube.com/... ou Reels/TikTok"/>
                    {v.url_video && <p style={{fontSize:'11px',color:'#22C55E',marginTop:'6px'}}>✓ {formatoLabel(v.formato)}</p>}
                    {!v.url_video && <p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'6px'}}>Cole o link do YouTube, Reels, TikTok, Vimeo etc. O formato ideal é detectado automaticamente.</p>}
                  </div>
                  {v.url_video && (
                    <div style={{marginBottom:'14px'}}>
                      <p className="lbl" style={{marginBottom:'8px'}}>Prévia</p>
                      <div style={{width: v.formato==='9:16'?'140px':v.formato==='1:1'?'170px':'240px', aspectRatio: FORMATO_RATIO_PAINEL[v.formato||'16:9'], borderRadius:'12px', overflow:'hidden', position:'relative', background:G, border:'1px solid rgba(229,72,184,.28)'}}>
                        {(v.thumbnail_url||thumbYoutube(v.url_video)) ? (
                          <img src={v.thumbnail_url||thumbYoutube(v.url_video)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        ) : (
                          <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'6px',padding:'8px',textAlign:'center'}}>
                            <div style={{width:'32px',height:'32px',borderRadius:'999px',background:'rgba(255,255,255,.22)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',color:'#fff'}}>▶</div>
                            <span style={{fontSize:'10px',color:'#fff',fontWeight:700}}>{labelPlaceholderPainel(v)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="fg2" style={{marginBottom:'10px'}}>
                    <div><label className="lbl">Texto do botão de assistir</label><input className="inp" value={v.texto_botao_video||''} onChange={e=>editarVideo(v.id,'texto_botao_video',e.target.value)} placeholder="Assistir vídeo"/></div>
                    <div>
                      <label className="lbl">Capa do vídeo (opcional)</label>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                        {v.thumbnail_url && <img src={v.thumbnail_url} alt="" style={{width:'36px',height:'36px',borderRadius:'8px',objectFit:'cover',flexShrink:0,border:'1px solid #2A1A2F'}}/>}
                        <button type="button" onClick={()=>{setUploadingId(v.id);imgRef.current?.click()}} style={{background:'rgba(24,16,27,.92)',border:'1px solid rgba(229,72,184,.28)',borderRadius:'10px',padding:'10px 14px',fontSize:'12px',fontWeight:600,color:'#F8F4F7',cursor:'pointer',fontFamily:'inherit',flex:1}}>
                          {uploadingId===v.id?'Enviando...':v.thumbnail_url?'Trocar capa':'Enviar capa'}
                        </button>
                      </div>
                      <button type="button" onClick={()=>gerarCapaAutomatica(v)} disabled={gerandoCapaId===v.id} style={{background:'rgba(139,92,246,.12)',border:'1px solid rgba(139,92,246,.28)',color:'#C4B5FD',borderRadius:'8px',padding:'7px 14px',fontSize:'12px',fontWeight:700,cursor:gerandoCapaId===v.id?'wait':'pointer',fontFamily:'inherit',opacity:gerandoCapaId===v.id?.7:1,width:'100%'}}>{gerandoCapaId===v.id?'Buscando capa...':'Gerar capa automática pelo link'}</button>
                      <p style={{fontSize:'10px',color:'#B8AAB8',marginTop:'8px'}}>Envie uma capa no mesmo formato do vídeo. Reels, Shorts e TikTok: vertical 9:16. YouTube horizontal: 16:9. Use boa resolução, pra preencher o card sem cortes estranhos.</p>
                      <p style={{fontSize:'10px',color:'#B8AAB8',marginTop:'4px'}}>Algumas plataformas podem não carregar a capa automaticamente. Se isso acontecer, envie uma capa manualmente.</p>
                    </div>
                  </div>
                  <div className="fg2" style={{marginBottom:'10px'}}>
                    <div><label className="lbl">Link de destino (comercial, opcional)</label><input className="inp" value={v.link_destino||''} onChange={e=>editarVideo(v.id,'link_destino',e.target.value)} placeholder="Ex: link da mentoria, curso ou WhatsApp"/></div>
                    {v.link_destino ? (
                      <div><label className="lbl">Texto do botão de destino (CTA)</label><input className="inp" value={v.texto_cta||''} onChange={e=>editarVideo(v.id,'texto_cta',e.target.value)} placeholder="Ex: Quero participar"/></div>
                    ) : <div/>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                    <button type="button" onClick={()=>editarVideo(v.id,'ativo',!v.ativo)} style={{background:v.ativo?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(v.ativo?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,color:v.ativo?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit'}}>{v.ativo?'Ativo':'Oculto'}</button>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button type="button" onClick={()=>excluirVideo(v.id)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',color:'#EF4444',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                      <button type="button" onClick={()=>salvarVideo(v)} disabled={salvandoId===v.id} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:salvandoId===v.id?.7:1}}>{salvandoId===v.id?'Salvando...':'Salvar'}</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <input ref={imgRef} type="file" accept="image/*" onChange={uploadCapaVideo} style={{display:'none'}}/>

        </BloqueioPorPlano>
        </div></div>
      </div>
    </div>
  )
}
