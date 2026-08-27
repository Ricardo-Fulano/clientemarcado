'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown, UploadCloud } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'

const G='linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

const TIPOS_DESTINO = ['link','whatsapp','youtube','youtube_shorts','spotify','hotmart','kiwify','shopee','shein','mercadolivre','instagram','tiktok','site','outros']
const NOME_TIPO: Record<string,string> = {
  link:'Link direto', whatsapp:'WhatsApp', youtube:'YouTube', youtube_shorts:'YouTube Shorts', spotify:'Spotify',
  instagram:'Instagram', tiktok:'TikTok', shopee:'Shopee', shein:'Shein', mercadolivre:'Mercado Livre', hotmart:'Hotmart',
  kiwify:'Kiwify', site:'Site externo', outros:'Outros',
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
textarea.inp{resize:vertical;min-height:64px}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}.fg2{grid-template-columns:1fr!important}}
`

export default function GerenciarItensDoCatalogo(){
  const params = useParams()
  const catalogoId = String(params?.catalogoId || '')

  const [userId,setUserId]=useState('')
  const [catalogo,setCatalogo]=useState<any>(null)
  const [itens,setItens]=useState<any[]>([])
  const [carregando,setCarregando]=useState(true)
  const [naoEncontrado,setNaoEncontrado]=useState(false)
  const [msg,setMsg]=useState('')
  const [salvandoId,setSalvandoId]=useState('')
  const [enviandoImgId,setEnviandoImgId]=useState('')
  const [gerandoPreviaId,setGerandoPreviaId]=useState('')
  const fileRefs = useRef<Record<string,HTMLInputElement|null>>({})

  useEffect(()=>{ if(catalogoId) load() },[catalogoId])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const {data:cat}=await supabase.from('pagina_catalogos').select('*').eq('id',catalogoId).eq('user_id',user.id).maybeSingle()
    if(!cat){setNaoEncontrado(true);setCarregando(false);return}
    setCatalogo(cat)
    const {data:its}=await supabase.from('pagina_catalogo_itens').select('*').eq('catalogo_id',catalogoId).eq('user_id',user.id).order('ordem')
    setItens(its||[])
    setCarregando(false)
  }

  async function validarSessao(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return false}
    if(user.id!==userId){setMsg('A sessão mudou. Recarregue a página antes de salvar.');return false}
    return true
  }

  function novoItem(){
    setItens(prev=>[...prev,{id:'novo-'+Date.now(),user_id:userId,catalogo_id:catalogoId,titulo:'',descricao_curta:'',descricao_completa:'',preco:'',imagem_url:'',botao_texto:'Ver mais',tipo_destino:'link',destino_url:'',whatsapp:'',ativo:true,ordem:prev.length,_novo:true}])
  }
  function editarItem(id:string,campo:string,valor:any){
    setItens(prev=>prev.map(it=>it.id===id?{...it,[campo]:valor}:it))
  }

  async function gerarPrevia(it:any){
    if(!it.destino_url?.trim()){setMsg('Cole um link no campo "Link de destino" antes de gerar a prévia.');return}
    setGerandoPreviaId(it.id)
    try{
      const res=await fetch('/api/catalogo/preview-link',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:it.destino_url.trim()})})
      const dados=await res.json()
      if(!dados.success){
        setMsg(dados.message||'Não foi possível gerar a prévia automaticamente. Você pode preencher manualmente.')
        setGerandoPreviaId('')
        setTimeout(()=>setMsg(''),5000)
        return
      }
      // Regra de seguranca: so preenche campos que ainda estao VAZIOS (nunca sobrescreve
      // o que o usuario ja digitou). O tipo_destino sempre atualiza - e o proposito
      // central da deteccao automatica, nao um "conteudo" que o usuario escreveu.
      setItens(prev=>prev.map(x=>{
        if(x.id!==it.id)return x
        return {
          ...x,
          tipo_destino: dados.tipo_destino || x.tipo_destino,
          titulo: x.titulo?.trim() ? x.titulo : (dados.titulo || x.titulo),
          descricao_curta: x.descricao_curta?.trim() ? x.descricao_curta : (dados.descricao || x.descricao_curta),
          imagem_url: x.imagem_url ? x.imagem_url : (dados.imagem_url || x.imagem_url),
        }
      }))
      setMsg('Prévia encontrada. Revise os dados antes de salvar.')
    }catch{
      setMsg('Não foi possível gerar a prévia automaticamente. Você pode preencher manualmente.')
    }
    setGerandoPreviaId('')
    setTimeout(()=>setMsg(''),5000)
  }

  async function uploadImagem(id:string,e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    if(!(await validarSessao()))return
    const allowedTypes=['image/jpeg','image/jpg','image/png','image/webp']
    if(!allowedTypes.includes(file.type)){setMsg('Envie uma imagem JPG, PNG ou WEBP.');return}
    if(file.size>5*1024*1024){setMsg('A imagem deve ter no máximo 5MB.');return}
    setEnviandoImgId(id)
    const ext=file.name.split('.').pop()?.toLowerCase()||'jpg'
    const path=`catalogo/${userId}-${Date.now()}.${ext}`
    const {error:uploadError}=await supabase.storage.from('fotos').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'})
    if(uploadError){setMsg('Erro no upload: '+uploadError.message);setEnviandoImgId('');return}
    const {data}=supabase.storage.from('fotos').getPublicUrl(path)
    editarItem(id,'imagem_url',data.publicUrl)
    setEnviandoImgId('')
    if(fileRefs.current[id])fileRefs.current[id]!.value=''
  }

  async function salvarItem(it:any){
    if(!(await validarSessao()))return
    if(!it.titulo?.trim()){setMsg('Dê um título para o item.');return}
    if(it.tipo_destino==='whatsapp'&&!it.whatsapp?.trim()){setMsg('Informe o número de WhatsApp.');return}
    if(it.tipo_destino!=='whatsapp'&&!it.destino_url?.trim()){setMsg('Informe o link de destino.');return}
    setSalvandoId(it.id)
    const payload={
      user_id:userId,
      catalogo_id:catalogoId,
      titulo:it.titulo.trim(),
      descricao_curta:it.descricao_curta?.trim()||null,
      descricao_completa:it.descricao_completa?.trim()||null,
      preco: it.preco!==''&&it.preco!==null&&it.preco!==undefined ? parseFloat(String(it.preco).replace(',','.'))||null : null,
      imagem_url:it.imagem_url||null,
      botao_texto:it.botao_texto?.trim()||'Ver mais',
      tipo_destino:it.tipo_destino||'link',
      destino_url:it.tipo_destino==='whatsapp'?null:(it.destino_url?.trim()||null),
      whatsapp:it.tipo_destino==='whatsapp'?(it.whatsapp?.trim()||null):null,
      ativo:!!it.ativo,
      ordem:it.ordem||0,
    }
    if(it._novo){
      const {data,error}=await supabase.from('pagina_catalogo_itens').insert(payload).select().single()
      if(error){setMsg('Erro ao salvar: '+error.message)}
      else{setItens(prev=>prev.map(x=>x.id===it.id?data:x));setMsg('Item salvo!')}
    } else {
      const {error}=await supabase.from('pagina_catalogo_itens').update(payload).eq('id',it.id).eq('user_id',userId)
      if(error){setMsg('Erro ao salvar: '+error.message)}
      else{setMsg('Item salvo!')}
    }
    setSalvandoId('')
    setTimeout(()=>setMsg(''),3000)
  }

  async function excluirItem(id:string){
    if(!(await validarSessao()))return
    if(!id.startsWith('novo-')){
      const {error}=await supabase.from('pagina_catalogo_itens').delete().eq('id',id).eq('user_id',userId)
      if(error){setMsg('Erro ao excluir: '+error.message);return}
    }
    setItens(prev=>prev.filter(it=>it.id!==id))
  }

  async function mover(id:string,direcao:'up'|'down'){
    const idx=itens.findIndex(it=>it.id===id)
    if(idx<0)return
    const novoIdx=direcao==='up'?idx-1:idx+1
    if(novoIdx<0||novoIdx>=itens.length)return
    const copia=[...itens]
    ;[copia[idx],copia[novoIdx]]=[copia[novoIdx],copia[idx]]
    const comOrdem=copia.map((item,i)=>({...item,ordem:i}))
    setItens(comOrdem)
    for(const item of comOrdem){
      if(!item.id.startsWith('novo-')){
        await supabase.from('pagina_catalogo_itens').update({ordem:item.ordem}).eq('id',item.id).eq('user_id',userId)
      }
    }
  }

  if(carregando)return(<div style={{minHeight:'100vh',background:'#08060A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#B8AAB8',fontSize:'14px'}}>Carregando...</p></div>)

  if(naoEncontrado)return(
    <div style={{minHeight:'100vh',background:'#08060A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',padding:'20px'}}>
      <div style={{textAlign:'center'}}>
        <p style={{color:'#F8F4F7',fontSize:'16px',fontWeight:700,marginBottom:'10px'}}>Catálogo não encontrado</p>
        <Link href="/painel/perfil/catalogo" style={{color:'#EC4899',fontSize:'13px'}}>Voltar para Catálogos</Link>
      </div>
    </div>
  )

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#08060A',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar tituloMobile="Catálogo"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:msg.includes('rro')?'rgba(239,68,68,.16)':'rgba(34,197,94,.16)',border:`1px solid ${msg.includes('rro')?'rgba(239,68,68,.36)':'rgba(34,197,94,.36)'}`,borderRadius:'10px',padding:'10px 20px',zIndex:99,color:msg.includes('rro')?'#EF4444':'#22C55E',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil/catalogo" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'#B8AAB8',textDecoration:'none',marginBottom:'18px'}}><ArrowLeft size={15}/> Voltar para Catálogos</Link>

          <p style={{fontSize:'22px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em',marginBottom:'4px'}}>{catalogo?.titulo || 'Catálogo'}</p>
          {catalogo?.subtitulo && <p style={{fontSize:'13px',color:'#B8AAB8',marginBottom:'24px'}}>{catalogo.subtitulo}</p>}
          {!catalogo?.subtitulo && <div style={{marginBottom:'20px'}}/>}

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',marginBottom:'8px'}}>
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7'}}>Itens deste catálogo</p>
            <button type="button" onClick={novoItem} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Adicionar item</button>
          </div>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginBottom:'24px'}}>Use as setas para mudar a ordem de exibição.</p>

          {itens.length===0&&<p style={{fontSize:'13px',color:'#B8AAB8',padding:'12px 0'}}>Nenhum item cadastrado ainda neste catálogo.</p>}

          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {itens.map((it,i)=>(
              <div key={it.id} className="crd" style={{padding:'16px',display:'flex',gap:'12px'}}>
                <div style={{display:'flex',flexDirection:'column',gap:'4px',flexShrink:0,paddingTop:'2px'}}>
                  <button type="button" onClick={()=>mover(it.id,'up')} disabled={i===0} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===0?'#4A3F4E':'#B8AAB8',cursor:i===0?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowUp size={14}/></button>
                  <button type="button" onClick={()=>mover(it.id,'down')} disabled={i===itens.length-1} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===itens.length-1?'#4A3F4E':'#B8AAB8',cursor:i===itens.length-1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowDown size={14}/></button>
                </div>
                <div style={{flex:1,minWidth:0}}>

                  <div style={{marginBottom:'12px'}}>
                    <label className="lbl">Imagem</label>
                    <p style={{fontSize:'11px',color:'#B8AAB8',marginBottom:'8px'}}>Use imagem quadrada (1:1) ou vertical (4:5), ideal para produtos, capas, álbuns e achadinhos.</p>
                    {it.imagem_url?(
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <img src={it.imagem_url} alt="" style={{width:'64px',height:'64px',objectFit:'cover',borderRadius:'10px',border:'1px solid #2A1A2F'}}/>
                        <button type="button" onClick={()=>fileRefs.current[it.id]?.click()} disabled={enviandoImgId===it.id} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'8px',padding:'7px 12px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:'5px'}}><UploadCloud size={13}/> {enviandoImgId===it.id?'Enviando...':'Trocar imagem'}</button>
                      </div>
                    ):(
                      <button type="button" onClick={()=>fileRefs.current[it.id]?.click()} disabled={enviandoImgId===it.id} style={{background:'rgba(24,16,27,.9)',border:'1px dashed #2A1A2F',color:'#B8AAB8',borderRadius:'10px',padding:'10px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:'6px'}}><UploadCloud size={14}/> {enviandoImgId===it.id?'Enviando...':'Enviar imagem'}</button>
                    )}
                    <input ref={el=>{fileRefs.current[it.id]=el}} type="file" accept="image/*" onChange={e=>uploadImagem(it.id,e)} style={{display:'none'}}/>
                  </div>

                  <div className="fg2" style={{marginBottom:'10px'}}>
                    <div><label className="lbl">Título *</label><input className="inp" autoFocus={!!it._novo} value={it.titulo||''} onChange={e=>editarItem(it.id,'titulo',e.target.value)} placeholder="Ex: Curso de Alongamento em Gel"/></div>
                    <div><label className="lbl">Preço (opcional)</label><input className="inp" value={it.preco||''} onChange={e=>editarItem(it.id,'preco',e.target.value)} placeholder="Ex: 97,00"/></div>
                  </div>
                  <div style={{marginBottom:'10px'}}><label className="lbl">Descrição curta (aparece no card)</label><input className="inp" value={it.descricao_curta||''} onChange={e=>editarItem(it.id,'descricao_curta',e.target.value)} placeholder="Resumo em até 2 linhas"/></div>
                  <div style={{marginBottom:'12px'}}><label className="lbl">Descrição completa (aparece ao abrir o item)</label><textarea className="inp" value={it.descricao_completa||''} onChange={e=>editarItem(it.id,'descricao_completa',e.target.value)} placeholder="Detalhes completos do item"/></div>

                  <div className="fg2" style={{marginBottom:'10px'}}>
                    <div>
                      <label className="lbl">Tipo de destino</label>
                      <select className="inp" style={{cursor:'pointer'}} value={it.tipo_destino||'link'} onChange={e=>editarItem(it.id,'tipo_destino',e.target.value)}>
                        {TIPOS_DESTINO.map(t=><option key={t} value={t}>{NOME_TIPO[t]}</option>)}
                      </select>
                    </div>
                    <div><label className="lbl">Texto do botão</label><input className="inp" value={it.botao_texto||''} onChange={e=>editarItem(it.id,'botao_texto',e.target.value)} placeholder="Ver mais"/></div>
                  </div>

                  <div style={{marginBottom:'12px'}}>
                    {it.tipo_destino==='whatsapp'?(
                      <>
                        <label className="lbl">Número de WhatsApp</label>
                        <input className="inp" value={it.whatsapp||''} onChange={e=>editarItem(it.id,'whatsapp',e.target.value)} placeholder="(11) 99999-9999"/>
                        <p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'6px'}}>Ao clicar, abre o WhatsApp com a mensagem: &quot;Olá! Quero saber mais sobre: {it.titulo||'(título do item)'}&quot;</p>
                      </>
                    ):(
                      <>
                        <label className="lbl">Link do produto, música, vídeo ou página</label>
                        <input className="inp" value={it.destino_url||''} onChange={e=>editarItem(it.id,'destino_url',e.target.value)} placeholder="https://..."/>
                        <button type="button" onClick={()=>gerarPrevia(it)} disabled={gerandoPreviaId===it.id} style={{marginTop:'8px',background:'rgba(139,92,246,.12)',border:'1px solid rgba(139,92,246,.28)',color:'#C4B5FD',borderRadius:'8px',padding:'7px 14px',fontSize:'12px',fontWeight:700,cursor:gerandoPreviaId===it.id?'wait':'pointer',fontFamily:'inherit',opacity:gerandoPreviaId===it.id?.7:1}}>{gerandoPreviaId===it.id?'Buscando prévia...':'Gerar prévia pelo link'}</button>
                        <p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'6px'}}>Tenta preencher título, descrição, imagem e tipo automaticamente. Você pode editar tudo depois.</p>
                      </>
                    )}
                  </div>

                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                    <button type="button" onClick={()=>editarItem(it.id,'ativo',!it.ativo)} style={{background:it.ativo?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(it.ativo?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,color:it.ativo?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit'}}>{it.ativo?'Ativo':'Oculto'}</button>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button type="button" onClick={()=>excluirItem(it.id)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',color:'#EF4444',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                      <button type="button" onClick={()=>salvarItem(it)} disabled={salvandoId===it.id} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:salvandoId===it.id?.7:1}}>{salvandoId===it.id?'Salvando...':'Salvar'}</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div></div>
      </div>
    </div>
  )
}
