'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, UploadCloud, Lock } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
import { obterLimiteModelosCor, ehPlanoFree } from '../../../lib/planos'

const G='linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

// Compatibilidade com valores antigos salvos no banco (nao apaga dados, so traduz visualmente)
const TEMA_LEGADO: Record<string,string> = {padrao:'modelo1', beleza:'modelo2', barbearia:'modelo3', minimal:'modelo4', saude:'modelo5'}
function resolverTema(id:string){ return TEMA_LEGADO[id] || id }

const TEMAS=[
  {id:'modelo1',nome:'Modelo 1',desc:'Rosa vibrante, moderno e marcante.',p:'#FF4FA3',s:'#D946EF'},
  {id:'modelo2',nome:'Modelo 2',desc:'Preto e grafite, premium e minimalista.',p:'#EDEDF0',s:'#A1A1AA'},
  {id:'modelo3',nome:'Modelo 3',desc:'Grafite e preto, moderno e sofisticado.',p:'#1C1C1F',s:'#0A0A0B'},
  {id:'modelo4',nome:'Modelo 4',desc:'Preto e dourado, visual luxuoso e de alto padrão.',p:'#D4AF37',s:'#9C7A2F'},
  {id:'modelo5',nome:'Modelo 5',desc:'Cinza claro e branco, clean e editorial.',p:'#C97B93',s:'#8B5D73'},
  {id:'modelo6',nome:'Modelo 6',desc:'Branco e cinza suave, refinado e elegante.',p:'#5FA8A0',s:'#3D7871'},
  {id:'modelo7',nome:'Modelo 7',desc:'Rosa blush premium, ideal para beleza e estética.',p:'#F5C3D6',s:'#E83E8C'},
  {id:'modelo8',nome:'Modelo 8',desc:'Rosa forte premium, marcante e feminino.',p:'#F1B6CF',s:'#C2185B'},
  {id:'modelo9',nome:'Modelo 9',desc:'Lilás profundo, sofisticado e marcante.',p:'#B69AF0',s:'#8B6FD9'},
  {id:'modelo10',nome:'Modelo 10',desc:'Nude e mocha, acolhedor e refinado.',p:'#A67C52',s:'#7A5A3A'},
  {id:'modelo11',nome:'Modelo 11',desc:'Bordô profundo, elegante e marcante.',p:'#7F1D1D',s:'#BE123C'},
  {id:'modelo12',nome:'Modelo 12',desc:'Azul-meia-noite, premium e versátil.',p:'#3B82F6',s:'#10243D'},
  {id:'modelo13',nome:'Modelo 13',desc:'Vermelho neon, intenso, moderno e impactante.',p:'#FF1744',s:'#FF6B85'},
  {id:'modelo14',nome:'Modelo 14',desc:'Verde neon, vibrante, moderno e tecnológico.',p:'#00FF85',s:'#6FFFB0'},
  {id:'modelo15',nome:'Modelo 15',desc:'Azul neon, marcante, sofisticado e digital.',p:'#00BFFF',s:'#66D9FF'},
  {id:'modelo16',nome:'Modelo 16',desc:'Rosa neon, forte, feminino e super marcante.',p:'#FF2DAA',s:'#FF7ACB'},
  {id:'modelo17',nome:'Modelo 17',desc:'Laranja neon, energético, criativo e ousado.',p:'#FF7A00',s:'#FFB066'},
  {id:'modelo18',nome:'Modelo 18',desc:'Dourado neon, luxuoso, intenso e premium.',p:'#FFD700',s:'#FFEB80'},
]

const BANNERS_PRONTOS=Array.from({length:14},(_,i)=>`/banners/prontos/banner-${String(i+1).padStart(2,'0')}.webp`)

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
input,select,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.18),transparent 32%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh}
.bdy{max-width:820px;margin:0 auto;padding:28px 32px 100px;width:100%}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px;padding:22px}
.lbl{display:block;font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:10px;padding:10px 12px;color:#F8F4F7;font-size:13px;font-family:inherit}
.inp:focus{outline:none;border-color:rgba(236,72,153,.5)}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.banner-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.banner-thumb{position:relative;aspect-ratio:16/9;border-radius:10px;overflow:hidden;border:2px solid #2A1A2F;padding:0;cursor:pointer;background:#120A14}
.banner-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.banner-thumb.sel{border-color:#EC4899;box-shadow:0 0 0 1px #EC4899}
.banner-sel-badge{position:absolute;bottom:4px;right:4px;background:rgba(236,72,153,.92);color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:6px}
.temas-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.tema-card{background:rgba(24,16,27,.9);border:1.5px solid #2A1A2F;border-radius:12px;padding:12px;cursor:pointer;text-align:left;font-family:inherit}
@media(max-width:767px){
  .psb-main .bdy{padding:14px 14px 100px!important}
  .fg2{grid-template-columns:1fr!important}
  .banner-grid{grid-template-columns:repeat(3,1fr)!important}
  .temas-grid{grid-template-columns:1fr 1fr!important}
}
@media(max-width:480px){.temas-grid{grid-template-columns:1fr!important}}
`

export default function GerenciarAparencia(){
  const [userId,setUserId]=useState('')
  const [planoTipo,setPlanoTipo]=useState('essencial')
  const [carregando,setCarregando]=useState(true)
  const [salvando,setSalvando]=useState(false)
  const [msg,setMsg]=useState('')

  const [capUrl,setCapUrl]=useState('')
  const [bannerMobilePosicao,setBannerMobilePosicao]=useState('padrao')
  const [bannerMobileZoom,setBannerMobileZoom]=useState('normal')
  const [bannerTipo,setBannerTipo]=useState('imagem') // 'imagem' | 'video'
  const [bannerVideoUrl,setBannerVideoUrl]=useState('')
  const [seguidoresTexto,setSeguidoresTexto]=useState('')
  
  const [topoMobileTipo,setTopoMobileTipo]=useState('imagem') // 'imagem' | 'video'
  const [topoMobileUrl,setTopoMobileUrl]=useState('')
  const [enviandoTopoMobile,setEnviandoTopoMobile]=useState(false)
  const [publicTheme,setPublicTheme]=useState('modelo2')
  const imgRef=useRef<HTMLInputElement>(null)
  const videoRef=useRef<HTMLInputElement>(null)
  const topoMobileRef=useRef<HTMLInputElement>(null)
  const [enviandoVideo,setEnviandoVideo]=useState(false)
  const [avancadoVideoAberto,setAvancadoVideoAberto]=useState(false)

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const {data:p,error}=await supabase.from('perfis').select('*').eq('user_id',user.id).maybeSingle()
    if(error){setMsg('Erro ao carregar: '+error.message)}
    if(p){
      setPlanoTipo(p.plano_tipo||'essencial')
      setCapUrl(p.capa_url||p.imagem_capa||'')
      setBannerMobilePosicao(p.banner_mobile_position||'padrao')
      setBannerMobileZoom(p.banner_mobile_zoom||'normal')
      setBannerTipo(p.banner_tipo||'imagem')
      setBannerVideoUrl(p.banner_video_url||'')
      setSeguidoresTexto(p.seguidores_texto||'')
      setTopoMobileTipo(p.topo_mobile_tipo||'imagem')
      setTopoMobileUrl(p.topo_mobile_url||'')
      if(p.public_theme||p.tema_publico||p.tema_cor) setPublicTheme(resolverTema(p.public_theme||p.tema_publico||p.tema_cor||'modelo2'))
    }
    setCarregando(false)
  }

  async function validarSessao(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return false}
    if(user.id!==userId){setMsg('A sessão mudou. Recarregue a página antes de salvar.');return false}
    return true
  }

  async function uploadCapa(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    if(!(await validarSessao()))return

    const allowedTypes=['image/jpeg','image/jpg','image/png','image/webp']
    if(!allowedTypes.includes(file.type)){setMsg('Envie uma imagem JPG, PNG ou WEBP.');return}
    if(file.size>5*1024*1024){setMsg('A imagem deve ter no máximo 5MB.');return}

    const ext=file.name.split('.').pop()?.toLowerCase()||'png'
    const path=`capas/${userId}-${Date.now()}.${ext}`
    const {error:uploadError}=await supabase.storage.from('fotos').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'})
    if(uploadError){setMsg('Erro no upload: '+uploadError.message);return}

    const {data}=supabase.storage.from('fotos').getPublicUrl(path)
    const imageUrl=data.publicUrl
    setCapUrl(imageUrl)

    // Mesmo comportamento de antes: a capa ja e salva no banco assim que o upload termina,
    // sem depender do botao "Salvar aparencia" (os demais campos dessa pagina sim dependem).
    const {error:updateError}=await supabase.from('perfis').update({capa_url:imageUrl}).eq('user_id',userId)
    if(updateError){setMsg('Imagem enviada, mas erro ao salvar no perfil: '+updateError.message);return}
    setMsg('Capa enviada!')
    setTimeout(()=>setMsg(''),3000)
    if(imgRef.current)imgRef.current.value=''
  }

  async function uploadCapaVideo(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    if(!(await validarSessao()))return

    // So aceita MP4 (o formato que a capa em video foi pensada pra usar - outros formatos/
    // origens como YouTube/Instagram/TikTok ficam pra "Videos em destaque", que ja tem seu
    // proprio fluxo separado).
    if(file.type!=='video/mp4'){setMsg('Envie um vídeo no formato MP4.');return}
    // Limite generoso o suficiente pra um video curto (10-15s) em boa qualidade, mas que
    // protege a pagina de ficar lenta com arquivos gigantes.
    if(file.size>25*1024*1024){setMsg('O vídeo deve ter no máximo 25MB. Tente comprimir ou encurtar o vídeo.');return}

    setEnviandoVideo(true)
    const path=`capas/${userId}-${Date.now()}.mp4`
    const {error:uploadError}=await supabase.storage.from('fotos').upload(path,file,{upsert:true,contentType:'video/mp4',cacheControl:'3600'})
    if(uploadError){setMsg('Erro no upload do vídeo: '+uploadError.message);setEnviandoVideo(false);return}

    const {data}=supabase.storage.from('fotos').getPublicUrl(path)
    setBannerVideoUrl(data.publicUrl)
    setEnviandoVideo(false)
    if(videoRef.current)videoRef.current.value=''
  }

  async function uploadTopoMobile(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    if(!(await validarSessao()))return

    if(topoMobileTipo==='video'){
      if(file.type!=='video/mp4'){setMsg('Envie um vídeo no formato MP4.');return}
      if(file.size>25*1024*1024){setMsg('O vídeo deve ter no máximo 25MB. Tente comprimir ou encurtar o vídeo.');return}
    } else {
      const allowedTypes=['image/jpeg','image/jpg','image/png','image/webp']
      if(!allowedTypes.includes(file.type)){setMsg('Envie uma imagem JPG, PNG ou WEBP.');return}
      if(file.size>5*1024*1024){setMsg('A imagem deve ter no máximo 5MB.');return}
    }

    setEnviandoTopoMobile(true)
    const ext=topoMobileTipo==='video'?'mp4':(file.name.split('.').pop()?.toLowerCase()||'jpg')
    const path=`topo-mobile/${userId}-${Date.now()}.${ext}`
    const {error:uploadError}=await supabase.storage.from('fotos').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'})
    if(uploadError){setMsg('Erro no upload: '+uploadError.message);setEnviandoTopoMobile(false);return}

    const {data}=supabase.storage.from('fotos').getPublicUrl(path)
    setTopoMobileUrl(data.publicUrl)
    setEnviandoTopoMobile(false)
    if(topoMobileRef.current)topoMobileRef.current.value=''
  }

  async function salvarAparencia(){
    if(!(await validarSessao()))return
    setSalvando(true)
    // Protecao extra: mesmo que o state tenha ficado com 'video' por algum motivo (ex: o
    // cliente era pago e virou Free depois), nunca salva video pra conta Free - sempre
    // forca 'imagem' nesse caso, protegendo contra o bloqueio ser so visual.
    const bannerTipoFinal = ehPlanoFree(planoTipo) ? 'imagem' : bannerTipo
    const {error}=await supabase.from('perfis').update({
      capa_url:capUrl||null,
      banner_mobile_position:bannerMobilePosicao,
      banner_mobile_zoom:bannerMobileZoom,
      public_theme:publicTheme,
      banner_tipo:bannerTipoFinal,
      banner_video_url:bannerTipoFinal==='video'?(bannerVideoUrl.trim()||null):null,
      seguidores_texto:seguidoresTexto.trim()||null,
      topo_mobile_tipo:topoMobileTipo,
      topo_mobile_url:topoMobileUrl.trim()||null,
    }).eq('user_id',userId)
    setSalvando(false)
    if(error){setMsg('Erro ao salvar: '+error.message);return}
    setMsg('Aparência salva com sucesso!')
    setTimeout(()=>setMsg(''),3000)
  }

  if(carregando)return(<div style={{minHeight:'100vh',background:'#08060A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#B8AAB8',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#08060A',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar tituloMobile="Aparência"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:msg.includes('rro')?'rgba(239,68,68,.16)':'rgba(34,197,94,.16)',border:`1px solid ${msg.includes('rro')?'rgba(239,68,68,.36)':'rgba(34,197,94,.36)'}`,borderRadius:'10px',padding:'10px 20px',zIndex:99,color:msg.includes('rro')?'#EF4444':'#22C55E',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'#B8AAB8',textDecoration:'none',marginBottom:'18px'}}><ArrowLeft size={15}/> Voltar para Configurações</Link>

          <p style={{fontSize:'22px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em',marginBottom:'8px'}}>Aparência da MiniPage</p>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginBottom:'24px'}}>Personalize o visual da página que seus visitantes acessam.</p>

          <div className="crd">
            <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'8px'}}>Tipo de capa</p>
            <div style={{display:'flex',gap:'8px',marginBottom:'18px',flexWrap:'wrap'}}>
              <button type="button" onClick={()=>setBannerTipo('imagem')} style={{background:bannerTipo==='imagem'?G:'rgba(24,16,27,.9)',color:bannerTipo==='imagem'?'#fff':'#B8AAB8',border:bannerTipo==='imagem'?'1px solid rgba(255,255,255,.12)':'1px solid #2A1A2F',borderRadius:'10px',padding:'9px 16px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Imagem</button>
              <button type="button" onClick={()=>{if(ehPlanoFree(planoTipo))return;setBannerTipo('video')}} disabled={ehPlanoFree(planoTipo)} style={{background:bannerTipo==='video'?G:'rgba(24,16,27,.9)',color:bannerTipo==='video'?'#fff':ehPlanoFree(planoTipo)?'#4A3F4E':'#B8AAB8',border:bannerTipo==='video'?'1px solid rgba(255,255,255,.12)':'1px solid #2A1A2F',borderRadius:'10px',padding:'9px 16px',fontSize:'13px',fontWeight:600,cursor:ehPlanoFree(planoTipo)?'not-allowed':'pointer',fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:'6px'}}>
                {ehPlanoFree(planoTipo)&&<Lock size={12}/>} Vídeo
              </button>
            </div>
            {ehPlanoFree(planoTipo)&&(
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>🔒 Capa em vídeo disponível no plano MiniPage Pro.</p>
            )}

            {bannerTipo==='video'&&!ehPlanoFree(planoTipo)?(
              <div style={{marginBottom:'18px'}}>
                <div style={{background:'rgba(139,92,246,.08)',border:'1px solid rgba(139,92,246,.24)',borderRadius:'12px',padding:'14px 16px',marginBottom:'16px'}}>
                  <p style={{fontSize:'13px',fontWeight:600,color:'#F8F4F7',marginBottom:'4px'}}>Use um vídeo curto em MP4, de preferência com até 10–15 segundos. O vídeo aparecerá sem som, em loop e com reprodução automática no topo da sua MiniPage.</p>
                  <p style={{fontSize:'11px',color:'#B8AAB8'}}>Para vídeos do YouTube, Instagram ou TikTok, use a seção Vídeos em destaque.</p>
                </div>

                <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Vídeo da capa</p>
                <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'12px'}}>Escolha um vídeo curto em MP4 para aparecer no topo da sua MiniPage.</p>

                {bannerVideoUrl?(
                  <div style={{position:'relative',borderRadius:'14px',overflow:'hidden',marginBottom:'12px',border:'1px solid #2A1A2F'}}>
                    <video src={bannerVideoUrl} muted loop autoPlay playsInline controls={false} style={{width:'100%',height:'200px',objectFit:'cover',display:'block'}}/>
                    <div style={{position:'absolute',top:'10px',right:'10px',display:'flex',gap:'6px'}}>
                      <button onClick={()=>videoRef.current?.click()} disabled={enviandoVideo} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:600,cursor:enviandoVideo?'wait':'pointer',fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:'5px'}}><UploadCloud size={13}/> {enviandoVideo?'Enviando...':'Trocar vídeo'}</button>
                      <button onClick={()=>setBannerVideoUrl('')} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#EF4444',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Remover vídeo</button>
                    </div>
                  </div>
                ):(
                  <div onClick={()=>videoRef.current?.click()} style={{border:'2px dashed #2A1A2F',borderRadius:'14px',padding:'32px',textAlign:'center',cursor:enviandoVideo?'wait':'pointer',marginBottom:'12px',transition:'border-color .18s'}} onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(236,72,153,.40)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='#2A1A2F')}>
                    <p style={{fontSize:'14px',color:'#B8AAB8',marginBottom:'4px',display:'inline-flex',alignItems:'center',gap:'6px'}}><UploadCloud size={16}/> {enviandoVideo?'Enviando vídeo...':'Enviar vídeo MP4'}</p>
                  </div>
                )}
                <input ref={videoRef} type="file" accept="video/mp4" onChange={uploadCapaVideo} style={{display:'none'}}/>

                <button type="button" onClick={()=>setAvancadoVideoAberto(a=>!a)} style={{marginTop:'6px',background:'transparent',border:'none',color:'#8B5CF6',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',padding:0,textDecoration:'underline'}}>
                  {avancadoVideoAberto?'Ocultar opções avançadas':'Opções avançadas'}
                </button>
                {avancadoVideoAberto&&(
                  <div style={{marginTop:'10px',padding:'12px',background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.18)',borderRadius:'10px'}}>
                    <label className="lbl">URL do vídeo</label>
                    <input className="inp" value={bannerVideoUrl} onChange={e=>setBannerVideoUrl(e.target.value)} placeholder="https://.../seu-video.mp4"/>
                    <p style={{fontSize:'10px',color:'#B8AAB8',marginTop:'6px'}}>Normalmente não é preciso mexer aqui — use o botão "Enviar vídeo MP4" acima. Esse campo é preenchido automaticamente pelo upload.</p>
                  </div>
                )}
              </div>
            ):(
              <>
                <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'8px'}}>Imagem de capa</p>
                <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'12px'}}>Aparece no topo da sua MiniPage. Use uma imagem horizontal (16:9).</p>
                {capUrl?(
                  <div style={{position:'relative',borderRadius:'14px',overflow:'hidden',marginBottom:'16px',border:'1px solid #2A1A2F'}}>
                    <img src={capUrl} alt="Capa" style={{width:'100%',height:'200px',objectFit:'cover',display:'block'}}/>
                    <div style={{position:'absolute',top:'10px',right:'10px',display:'flex',gap:'6px'}}>
                      <button onClick={()=>imgRef.current?.click()} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:'5px'}}><UploadCloud size={13}/> Enviar imagem</button>
                      <button onClick={()=>setCapUrl('')} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#EF4444',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Remover</button>
                    </div>
                  </div>
                ):(
                  <div onClick={()=>imgRef.current?.click()} style={{border:'2px dashed #2A1A2F',borderRadius:'14px',padding:'32px',textAlign:'center',cursor:'pointer',marginBottom:'16px',transition:'border-color .18s'}} onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(236,72,153,.40)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='#2A1A2F')}>
                    <p style={{fontSize:'14px',color:'#B8AAB8',marginBottom:'4px'}}>Clique para adicionar imagem de capa</p>
                    <p style={{fontSize:'12px',color:'#B8AAB8'}}>Recomendado: 1200x400px, formato JPG ou PNG</p>
                  </div>
                )}
                <input ref={imgRef} type="file" accept="image/*" onChange={uploadCapa} style={{display:'none'}}/>

                <div style={{borderTop:'1px solid #2A1A2F',paddingTop:'18px',marginTop:'4px',marginBottom:'18px'}}>
                  <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Escolha um banner pronto</p>
                  <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'14px'}}>Selecione uma imagem pronta para combinar com o estilo da sua página.</p>
                  <div className="banner-grid">
                    {BANNERS_PRONTOS.map(b=>(
                      <button key={b} type="button" onClick={()=>setCapUrl(b)} className={`banner-thumb${capUrl===b?' sel':''}`}>
                        <img src={b} alt="Banner pronto" loading="lazy"/>
                        {capUrl===b&&<span className="banner-sel-badge">Selecionado</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={{borderTop:'1px solid #2A1A2F',paddingTop:'18px',marginTop:'4px',marginBottom:'18px'}}>
              <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Enquadramento no celular</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'14px'}}>Ajuste como a capa aparece no celular. Útil quando o banner fica muito distante ou corta uma parte importante.</p>
              <div className="fg2">
                <div>
                  <label className="lbl">Posição no celular</label>
                  <select className="inp" style={{cursor:'pointer'}} value={bannerMobilePosicao} onChange={e=>setBannerMobilePosicao(e.target.value)}>
                    <option value="padrao">Padrão</option>
                    <option value="centro">Centro</option>
                    <option value="topo">Topo</option>
                    <option value="esquerda">Esquerda</option>
                    <option value="direita">Direita</option>
                    <option value="inferior">Inferior</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Zoom no celular</label>
                  <select className="inp" style={{cursor:'pointer'}} value={bannerMobileZoom} onChange={e=>setBannerMobileZoom(e.target.value)}>
                    <option value="normal">Normal</option>
                    <option value="medio">Médio</option>
                    <option value="alto">Alto</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{borderTop:'1px solid #2A1A2F',paddingTop:'18px',marginTop:'4px',marginBottom:'18px'}}>
              <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Topo no celular (opcional)</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'12px'}}>Envie uma imagem ou vídeo específico para o topo no celular, em formato vertical (proporção 4:5, como no feed do Instagram). Tamanho recomendado: 1080x1350. Se não enviar nada aqui, o celular usa a mesma capa do desktop.</p>

              <div style={{display:'flex',gap:'8px',marginBottom:'14px',flexWrap:'wrap'}}>
                <button type="button" onClick={()=>setTopoMobileTipo('imagem')} style={{background:topoMobileTipo==='imagem'?G:'rgba(24,16,27,.9)',color:topoMobileTipo==='imagem'?'#fff':'#B8AAB8',border:topoMobileTipo==='imagem'?'1px solid rgba(255,255,255,.12)':'1px solid #2A1A2F',borderRadius:'10px',padding:'9px 16px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Imagem</button>
                <button type="button" onClick={()=>setTopoMobileTipo('video')} style={{background:topoMobileTipo==='video'?G:'rgba(24,16,27,.9)',color:topoMobileTipo==='video'?'#fff':'#B8AAB8',border:topoMobileTipo==='video'?'1px solid rgba(255,255,255,.12)':'1px solid #2A1A2F',borderRadius:'10px',padding:'9px 16px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Vídeo</button>
              </div>

              {topoMobileUrl?(
                <div style={{position:'relative',borderRadius:'14px',overflow:'hidden',marginBottom:'12px',border:'1px solid #2A1A2F',maxWidth:'220px'}}>
                  {topoMobileTipo==='video'?(
                    <video src={topoMobileUrl} muted loop autoPlay playsInline style={{width:'100%',aspectRatio:'4/5',objectFit:'cover',display:'block'}}/>
                  ):(
                    <img src={topoMobileUrl} alt="Topo mobile" style={{width:'100%',aspectRatio:'4/5',objectFit:'cover',display:'block'}}/>
                  )}
                  <div style={{position:'absolute',top:'8px',right:'8px',display:'flex',gap:'6px'}}>
                    <button onClick={()=>topoMobileRef.current?.click()} disabled={enviandoTopoMobile} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'8px',padding:'5px 10px',fontSize:'11px',fontWeight:600,cursor:enviandoTopoMobile?'wait':'pointer',fontFamily:'inherit'}}>Trocar</button>
                    <button onClick={()=>setTopoMobileUrl('')} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#EF4444',borderRadius:'8px',padding:'5px 10px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Remover</button>
                  </div>
                </div>
              ):(
                <div onClick={()=>topoMobileRef.current?.click()} style={{border:'2px dashed #2A1A2F',borderRadius:'14px',padding:'24px',textAlign:'center',cursor:enviandoTopoMobile?'wait':'pointer',marginBottom:'12px',maxWidth:'220px',transition:'border-color .18s'}} onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(236,72,153,.40)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='#2A1A2F')}>
                  <p style={{fontSize:'13px',color:'#B8AAB8',display:'inline-flex',alignItems:'center',gap:'6px'}}><UploadCloud size={15}/> {enviandoTopoMobile?'Enviando...':topoMobileTipo==='video'?'Enviar vídeo MP4':'Enviar imagem'}</p>
                </div>
              )}
              <input ref={topoMobileRef} type="file" accept={topoMobileTipo==='video'?'video/mp4':'image/*'} onChange={uploadTopoMobile} style={{display:'none'}}/>
            </div>

            <div style={{borderTop:'1px solid #2A1A2F',paddingTop:'18px',marginTop:'4px',marginBottom:'18px'}}>
              <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Contagem / destaque social</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'10px'}}>Escreva como deseja exibir na página. Ex: "107 mi seguidores", "200K no YouTube", "+ de 4 mil alunas".</p>
              <input className="inp" value={seguidoresTexto} onChange={e=>setSeguidoresTexto(e.target.value)} placeholder="Ex: 107 mi seguidores"/>
            </div>

            <div style={{borderTop:'1px solid #2A1A2F',paddingTop:'18px',marginTop:'4px'}}>
              <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Cor de destaque</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'14px'}}>Escolha uma cor pronta para combinar com o estilo do seu negócio. Afeta apenas a página pública.</p>
              <div className="temas-grid">
                {TEMAS.map(t=>{
                  const numeroModelo=parseInt(t.id.replace('modelo',''),10)||0
                  // O tema JA selecionado nunca fica bloqueado (nao apaga escolha antiga de
                  // conta que testou um modelo premium antes do limite existir) - so modelos
                  // DIFERENTES do atual, acima do limite do plano, ficam bloqueados.
                  const bloqueado=numeroModelo>obterLimiteModelosCor(planoTipo)&&publicTheme!==t.id
                  return (
                  <button key={t.id} onClick={()=>{if(!bloqueado)setPublicTheme(t.id)}} className={`tema-card${publicTheme===t.id?' on':''}`}
                    style={{...(publicTheme===t.id?{borderColor:t.p,background:`${t.p}1A`,boxShadow:`0 0 18px ${t.p}30`}:undefined),...(bloqueado?{opacity:.45,cursor:'not-allowed'}:undefined)}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                      <div style={{display:'flex',gap:'4px'}}>
                        <div style={{width:'16px',height:'16px',borderRadius:'50%',background:t.p,flexShrink:0}}/>
                        <div style={{width:'16px',height:'16px',borderRadius:'50%',background:t.s,flexShrink:0}}/>
                      </div>
                      {publicTheme===t.id&&<span style={{fontSize:'10px',fontWeight:700,color:t.p,background:`${t.p}24`,borderRadius:'6px',padding:'2px 7px',marginLeft:'auto'}}>Ativo</span>}
                      {bloqueado&&<span style={{fontSize:'10px',fontWeight:700,color:'#B8AAB8',background:'rgba(184,170,184,.14)',borderRadius:'6px',padding:'2px 7px',marginLeft:'auto',display:'flex',alignItems:'center',gap:'3px'}}><Lock size={9}/> MiniPage</span>}
                    </div>
                    <p style={{fontSize:'12px',fontWeight:700,color:publicTheme===t.id?'#F8F4F7':'#B8AAB8',marginBottom:'3px'}}>{t.nome}</p>
                    <p style={{fontSize:'11px',color:'#B8AAB8',lineHeight:1.4}}>{t.desc}</p>
                  </button>
                  )
                })}
              </div>
            </div>
          </div>

          <button onClick={salvarAparencia} disabled={salvando} style={{width:'100%',marginTop:24,background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'14px',height:'52px',fontSize:'15px',fontWeight:800,cursor:salvando?'not-allowed':'pointer',fontFamily:'inherit',boxShadow:'0 12px 32px rgba(236,72,153,.30),0 0 28px rgba(139,92,246,.22)',opacity:salvando?.7:1,transition:'all .18s'}}>
            {salvando?'Salvando...':'Salvar aparência'}
          </button>

        </div></div>
      </div>
    </div>
  )
}
