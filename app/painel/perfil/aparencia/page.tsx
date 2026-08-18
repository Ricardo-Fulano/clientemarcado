'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, UploadCloud } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'

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
  const [carregando,setCarregando]=useState(true)
  const [salvando,setSalvando]=useState(false)
  const [msg,setMsg]=useState('')

  const [capUrl,setCapUrl]=useState('')
  const [bannerMobilePosicao,setBannerMobilePosicao]=useState('padrao')
  const [bannerMobileZoom,setBannerMobileZoom]=useState('normal')
  const [publicTheme,setPublicTheme]=useState('modelo2')
  const imgRef=useRef<HTMLInputElement>(null)

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const {data:p,error}=await supabase.from('perfis').select('*').eq('user_id',user.id).maybeSingle()
    if(error){setMsg('Erro ao carregar: '+error.message)}
    if(p){
      setCapUrl(p.capa_url||p.imagem_capa||'')
      setBannerMobilePosicao(p.banner_mobile_position||'padrao')
      setBannerMobileZoom(p.banner_mobile_zoom||'normal')
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

  async function salvarAparencia(){
    if(!(await validarSessao()))return
    setSalvando(true)
    const {error}=await supabase.from('perfis').update({
      capa_url:capUrl||null,
      banner_mobile_position:bannerMobilePosicao,
      banner_mobile_zoom:bannerMobileZoom,
      public_theme:publicTheme,
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

            <div style={{borderTop:'1px solid #2A1A2F',paddingTop:'18px',marginTop:'4px',marginBottom:'18px'}}>
              <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Enquadramento no celular</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'14px'}}>Ajuste como a imagem de capa aparece no celular. Útil quando o banner fica muito distante ou corta uma parte importante.</p>
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

            <div style={{borderTop:'1px solid #2A1A2F',paddingTop:'18px',marginTop:'4px'}}>
              <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Cor de destaque</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'14px'}}>Escolha uma cor pronta para combinar com o estilo do seu negócio. Afeta apenas a página pública.</p>
              <div className="temas-grid">
                {TEMAS.map(t=>(
                  <button key={t.id} onClick={()=>setPublicTheme(t.id)} className={`tema-card${publicTheme===t.id?' on':''}`}
                    style={publicTheme===t.id?{borderColor:t.p,background:`${t.p}1A`,boxShadow:`0 0 18px ${t.p}30`}:undefined}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                      <div style={{display:'flex',gap:'4px'}}>
                        <div style={{width:'16px',height:'16px',borderRadius:'50%',background:t.p,flexShrink:0}}/>
                        <div style={{width:'16px',height:'16px',borderRadius:'50%',background:t.s,flexShrink:0}}/>
                      </div>
                      {publicTheme===t.id&&<span style={{fontSize:'10px',fontWeight:700,color:t.p,background:`${t.p}24`,borderRadius:'6px',padding:'2px 7px',marginLeft:'auto'}}>Ativo</span>}
                    </div>
                    <p style={{fontSize:'12px',fontWeight:700,color:publicTheme===t.id?'#F8F4F7':'#B8AAB8',marginBottom:'3px'}}>{t.nome}</p>
                    <p style={{fontSize:'11px',color:'#B8AAB8',lineHeight:1.4}}>{t.desc}</p>
                  </button>
                ))}
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
