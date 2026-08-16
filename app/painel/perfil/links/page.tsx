'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'

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

export default function GerenciarLinks(){
  const [userId,setUserId]=useState('')
  const [links,setLinks]=useState<any[]>([])
  const [carregando,setCarregando]=useState(true)
  const [msg,setMsg]=useState('')
  const [salvandoId,setSalvandoId]=useState('')

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const {data}=await supabase.from('pagina_links').select('*').eq('user_id',user.id).order('ordem')
    // Pro tipo email, a URL fica salva como "mailto:..." no banco (formato final que o link publico
    // usa) - mas na tela de edicao o usuario so deve ver/mexer no email puro, sem esse prefixo.
    const tratados=(data||[]).map((l:any)=> l.tipo==='email' && l.url?.startsWith('mailto:') ? {...l,url:l.url.replace('mailto:','')} : l)
    setLinks(tratados)
    setCarregando(false)
  }

  async function validarSessao(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return false}
    if(user.id!==userId){setMsg('A sessão mudou. Recarregue a página antes de salvar.');return false}
    return true
  }

  function novoLink(){
    setLinks(prev=>[{id:'novo-'+Date.now(),user_id:userId,tipo:'whatsapp',titulo:'',descricao:'',url:'',ativo:true,ordem:prev.length,_novo:true},...prev])
  }
  function editarLink(id:string,campo:string,valor:any){
    setLinks(prev=>prev.map(l=>l.id===id?{...l,[campo]:valor}:l))
  }
  function montarLinkWhatsapp(valor:string){
    const v=(valor||'').trim()
    if(!v)return ''
    if(v.startsWith('http://')||v.startsWith('https://'))return v
    const somenteDigitos=v.replace(/\D/g,'')
    const temLetra=/[a-zA-Z]/.test(v)
    if(temLetra){
      const usuario=v.replace('@','').trim()
      return `https://wa.me/${usuario}`
    }
    if(somenteDigitos){
      const numero=somenteDigitos.startsWith('55')?somenteDigitos:`55${somenteDigitos}`
      return `https://wa.me/${numero}`
    }
    return v
  }
  // Deteccao de plataforma pela URL - usada so como SUGESTAO (nunca troca o tipo sozinha)
  function detectarTipoPelaUrl(url:string):string|null{
    const u=(url||'').toLowerCase()
    if(!u)return null
    if(u.includes('instagram.com'))return 'instagram'
    if(u.includes('youtube.com')||u.includes('youtu.be'))return 'youtube'
    if(u.includes('tiktok.com'))return 'tiktok'
    if(u.includes('facebook.com')||u.includes('fb.com'))return 'facebook'
    if(u.includes('x.com')||u.includes('twitter.com'))return 'x'
    if(u.includes('open.spotify.com')||u.includes('spotify.com'))return 'spotify'
    return null
  }
  function emailValido(e:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e||'').trim())}
  async function salvarLink(l:any){
    if(!(await validarSessao()))return
    if(!l.titulo?.trim()){setMsg('Preencha o título.');return}
    if(l.tipo==='email'){
      if(!emailValido(l.url)){setMsg('Informe um e-mail válido.');return}
    } else if(!l.url?.trim()){
      setMsg('Preencha título e link.');return
    }
    setSalvandoId(l.id)
    // Cada tipo monta a URL final do jeito que precisa - o restante do sistema (pagina publica,
    // etc) so precisa ler o campo "url" pronto, sem saber desses detalhes de cada rede.
    let urlFinal=l.url.trim()
    if(l.tipo==='whatsapp')urlFinal=montarLinkWhatsapp(l.url)
    else if(l.tipo==='email')urlFinal=`mailto:${l.url.trim()}`
    const payload={user_id:userId,tipo:l.tipo||'outro',titulo:l.titulo.trim(),descricao:l.descricao?.trim()||null,url:urlFinal,ativo:!!l.ativo,ordem:l.ordem||0}
    if(l._novo){
      const {data,error}=await supabase.from('pagina_links').insert(payload).select().single()
      if(error){setMsg('Erro ao salvar link: '+error.message)}
      else{
        const dataExibicao=l.tipo==='email'&&data.url?.startsWith('mailto:')?{...data,url:data.url.replace('mailto:','')}:data
        setLinks(prev=>prev.map(x=>x.id===l.id?dataExibicao:x));setMsg('Link salvo!')
      }
    } else {
      const {error}=await supabase.from('pagina_links').update(payload).eq('id',l.id).eq('user_id',userId)
      if(error){setMsg('Erro ao salvar link: '+error.message)}
      else{setMsg('Link salvo!')}
    }
    setSalvandoId('')
    setTimeout(()=>setMsg(''),3000)
  }
  async function excluirLink(id:string){
    if(!(await validarSessao()))return
    if(!id.startsWith('novo-')){
      const {error}=await supabase.from('pagina_links').delete().eq('id',id).eq('user_id',userId)
      if(error){setMsg('Erro ao excluir: '+error.message);return}
    }
    setLinks(prev=>prev.filter(l=>l.id!==id))
  }
  async function mover(id:string,direcao:'up'|'down'){
    const idx=links.findIndex(l=>l.id===id)
    if(idx<0)return
    const novoIdx=direcao==='up'?idx-1:idx+1
    if(novoIdx<0||novoIdx>=links.length)return
    const copia=[...links]
    ;[copia[idx],copia[novoIdx]]=[copia[novoIdx],copia[idx]]
    const comOrdem=copia.map((item,i)=>({...item,ordem:i}))
    setLinks(comOrdem)
    for(const item of comOrdem){
      if(!item.id.startsWith('novo-')){
        await supabase.from('pagina_links').update({ordem:item.ordem}).eq('id',item.id).eq('user_id',userId)
      }
    }
  }

  if(carregando)return(<div style={{minHeight:'100vh',background:'#08060A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#B8AAB8',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#08060A',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar tituloMobile="Links"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:msg.includes('rro')?'rgba(239,68,68,.16)':'rgba(34,197,94,.16)',border:`1px solid ${msg.includes('rro')?'rgba(239,68,68,.36)':'rgba(34,197,94,.36)'}`,borderRadius:'10px',padding:'10px 20px',zIndex:99,color:msg.includes('rro')?'#EF4444':'#22C55E',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'#B8AAB8',textDecoration:'none',marginBottom:'18px'}}><ArrowLeft size={15}/> Voltar para Configurações</Link>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',marginBottom:'8px'}}>
            <p style={{fontSize:'22px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em'}}>Links rápidos</p>
            <button type="button" onClick={novoLink} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Novo link</button>
          </div>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginBottom:'24px'}}>TikTok, YouTube, Shopee, site, grupo VIP e outros links da sua bio. Use as setas para mudar a ordem de exibição.</p>

          {links.length===0&&<p style={{fontSize:'13px',color:'#B8AAB8',padding:'12px 0'}}>Nenhum link cadastrado ainda.</p>}

          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {links.map((l,i)=>{
              const tipoSugerido=(l.tipo==='outro'||!l.tipo)?detectarTipoPelaUrl(l.url):null
              return (
              <div key={l.id} className="crd" style={{padding:'16px',display:'flex',gap:'12px'}}>
                <div style={{display:'flex',flexDirection:'column',gap:'4px',flexShrink:0,paddingTop:'2px'}}>
                  <button type="button" onClick={()=>mover(l.id,'up')} disabled={i===0} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===0?'#4A3F4E':'#B8AAB8',cursor:i===0?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowUp size={14}/></button>
                  <button type="button" onClick={()=>mover(l.id,'down')} disabled={i===links.length-1} style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===links.length-1?'#4A3F4E':'#B8AAB8',cursor:i===links.length-1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowDown size={14}/></button>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="fg2" style={{marginBottom:'10px'}}>
                    <div>
                      <label className="lbl">Tipo</label>
                      <select className="inp" style={{cursor:'pointer'}} value={l.tipo||'outro'} onChange={e=>editarLink(l.id,'tipo',e.target.value)}>
                        {['whatsapp','instagram','tiktok','youtube','x','facebook','spotify','email','secreto','shopee','mercadolivre','site','curso','mentoria','endereco','outro'].map(t=><option key={t} value={t}>{t==='endereco'?'Endereço':t==='email'?'E-mail':t==='x'?'X / Twitter':t==='secreto'?'Secreto':t==='outro'?'Outros':t}</option>)}
                      </select>
                    </div>
                    <div><label className="lbl">Título</label><input className="inp" autoFocus={!!l._novo} value={l.titulo||''} onChange={e=>editarLink(l.id,'titulo',e.target.value)} placeholder="Ex: TikTok"/></div>
                  </div>
                  <div style={{marginBottom:'10px'}}><label className="lbl">Descrição (opcional)</label><input className="inp" value={l.descricao||''} onChange={e=>editarLink(l.id,'descricao',e.target.value)} placeholder="Ex: @studiobellaeducadora"/></div>
                  <div style={{marginBottom:'12px'}}>
                    <label className="lbl">{l.tipo==='whatsapp'?'Número (com DDD) ou @usuário do WhatsApp':l.tipo==='endereco'?'Endereço para abrir no Google Maps':l.tipo==='email'?'E-mail para contato':l.tipo==='secreto'?'Link de direcionamento':'Link (URL)'}</label>
                    <input className="inp" type={l.tipo==='email'?'email':'text'} value={l.url||''} onChange={e=>editarLink(l.id,'url',e.target.value)} placeholder={l.tipo==='whatsapp'?'(11) 99999-9999 ou @studiobella':l.tipo==='endereco'?'Ex: Avenida Atlântica, 156 - São Paulo, SP':l.tipo==='email'?'contato@seudominio.com':'https://...'}/>
                    {l.tipo==='whatsapp'&&<p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'6px'}}>Pode digitar só o número com DDD (sem link pronto) ou seu @usuário do WhatsApp, se você já tiver criado um. O link completo é montado sozinho ao salvar.</p>}
                    {l.tipo==='endereco'&&<p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'6px'}}>Digite o endereço completo. O ClienteMarcado abrirá esse local no Google Maps. Também aceita um link do Google Maps já pronto, se preferir colar um.</p>}
                    {l.tipo==='email'&&<p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'6px'}}>Só o e-mail, sem precisar escrever &quot;mailto:&quot; — isso é feito automaticamente. Ao clicar no card, abre o app de e-mail do visitante.</p>}
                    {tipoSugerido&&(
                      <button type="button" onClick={()=>editarLink(l.id,'tipo',tipoSugerido)} style={{marginTop:'8px',background:'rgba(236,72,153,.10)',border:'1px solid rgba(236,72,153,.28)',color:'#EC4899',borderRadius:'8px',padding:'6px 12px',fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                        Esse link parece ser {tipoSugerido==='x'?'X / Twitter':tipoSugerido} — usar esse tipo?
                      </button>
                    )}
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                    <button type="button" onClick={()=>editarLink(l.id,'ativo',!l.ativo)} style={{background:l.ativo?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(l.ativo?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,color:l.ativo?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit'}}>{l.ativo?'Ativo':'Oculto'}</button>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button type="button" onClick={()=>excluirLink(l.id)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',color:'#EF4444',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Excluir</button>
                      <button type="button" onClick={()=>salvarLink(l)} disabled={salvandoId===l.id} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:salvandoId===l.id?.7:1}}>{salvandoId===l.id?'Salvando...':'Salvar'}</button>
                    </div>
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
