'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown, Pencil, Trash2, Mail, MapPin, Link2, Music } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
import VerMiniPageButton from '@/app/components/VerMiniPageButton'
import { obterLimiteLinksRapidos } from '../../../lib/planos'
import { PLATAFORMAS_LINK, placeholderPlataforma, normalizarInstagram, normalizarFacebook } from '../../../lib/plataformasLinks'

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
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}.fg2{grid-template-columns:1fr!important}.top-actions{flex-direction:column;align-items:stretch!important}}
`

// Icone compacto por tipo de link, so pra identificacao visual rapida no card - nao precisa
// ser tao elaborado quanto os icones da pagina publica. lucide-react (v1.47+) removeu os
// icones de marca/logo (Instagram, Youtube, Facebook nao existem mais como export) - por
// isso os SVGs de marca sao customizados aqui, reaproveitando exatamente os mesmos paths
// ja usados na pagina publica (slug) pra garantir fidelidade visual identica.
function IconePlataforma({ tipo }: { tipo: string }) {
  const tamanho = 18
  switch (tipo) {
    case 'whatsapp': return (
      <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="#22C55E">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    )
    case 'instagram': return (
      <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    )
    case 'threads': return (
      <svg width={tamanho} height={tamanho} viewBox="0 0 16 16" fill="#F8F4F7">
        <path d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161"/>
      </svg>
    )
    case 'telegram': return (
      <svg width={tamanho} height={tamanho} viewBox="0 0 16 16" fill="#26A5E4">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.008.868-.32 3.269-2.206 3.374-2.235c.05-.014.12-.03.166.02s.042.121.037.147c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.093.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09"/>
      </svg>
    )
    case 'youtube': return (
      <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6z"/>
      </svg>
    )
    case 'youtube_music': return (
      <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="#FF0000">
        <circle cx="12" cy="12" r="10.5"/><circle cx="12" cy="12" r="6.2" fill="#fff"/><circle cx="12" cy="12" r="2.2"/><path d="M10.5 9.3v5.4l4.6-2.7z" fill="#FF0000"/>
      </svg>
    )
    case 'facebook': return (
      <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="#1877F2">
        <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/>
      </svg>
    )
    case 'tiktok': return (
      <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="#F8F4F7">
        <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/>
      </svg>
    )
    case 'spotify': return <Music size={tamanho} color="#1DB954" />
    case 'email': return <Mail size={tamanho} color="#F8F4F7" />
    case 'endereco': return <MapPin size={tamanho} color="#F8F4F7" />
    default: return <Link2 size={tamanho} color="#B8AAB8" />
  }
}

export default function GerenciarLinks(){
  const [userId,setUserId]=useState('')
  const [planoTipo,setPlanoTipo]=useState('essencial')
  const [links,setLinks]=useState<any[]>([])
  const [carregando,setCarregando]=useState(true)
  const [msg,setMsg]=useState('')
  const [salvandoId,setSalvandoId]=useState('')
  // Controla qual card esta em modo edicao - null significa que todos aparecem compactos.
  const [editandoId,setEditandoId]=useState<string|null>(null)

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const [{data},{data:perfil}]=await Promise.all([
      supabase.from('pagina_links').select('*').eq('user_id',user.id).order('ordem'),
      supabase.from('perfis').select('plano_tipo').eq('user_id',user.id).maybeSingle(),
    ])
    if(perfil?.plano_tipo) setPlanoTipo(perfil.plano_tipo)
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
    const limite=obterLimiteLinksRapidos(planoTipo)
    if(links.length>=limite){
      setMsg(`Seu plano Free permite até ${limite} links rápidos. Faça upgrade para liberar links ilimitados e recursos premium.`)
      setTimeout(()=>setMsg(''),5000)
      return
    }
    const novoId='novo-'+Date.now()
    setLinks(prev=>[{id:novoId,user_id:userId,tipo:'whatsapp',titulo:'',descricao:'',url:'',ativo:true,ordem:prev.length,_novo:true},...prev])
    setEditandoId(novoId)
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
    if(u.includes('threads.net'))return 'threads'
    if(u.includes('t.me/'))return 'telegram'
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
    else if(l.tipo==='instagram')urlFinal=normalizarInstagram(l.url)
    else if(l.tipo==='facebook')urlFinal=normalizarFacebook(l.url)
    const payload={user_id:userId,tipo:l.tipo||'outro',titulo:l.titulo.trim(),descricao:l.descricao?.trim()||null,url:urlFinal,ativo:!!l.ativo,ordem:l.ordem||0}
    if(l._novo){
      const {data,error}=await supabase.from('pagina_links').insert(payload).select().single()
      if(error){setMsg('Erro ao salvar link: '+error.message)}
      else{
        const dataExibicao=l.tipo==='email'&&data.url?.startsWith('mailto:')?{...data,url:data.url.replace('mailto:','')}:data
        setLinks(prev=>prev.map(x=>x.id===l.id?dataExibicao:x));setMsg('Link salvo!')
        setEditandoId(null)
      }
    } else {
      const {error}=await supabase.from('pagina_links').update(payload).eq('id',l.id).eq('user_id',userId)
      if(error){setMsg('Erro ao salvar link: '+error.message)}
      else{setMsg('Link salvo!');setEditandoId(null)}
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
    if(editandoId===id)setEditandoId(null)
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
  // Cancela a edicao de um item ja existente (descarta alteracoes nao salvas, recarrega do
  // banco pra garantir que o card volta com os dados reais). Um item novo (_novo) que for
  // cancelado e simplesmente removido da lista, ja que nunca foi persistido.
  function cancelarEdicao(l:any){
    if(l._novo){
      setLinks(prev=>prev.filter(x=>x.id!==l.id))
    } else {
      load()
    }
    setEditandoId(null)
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

          <div className="top-actions" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',marginBottom:'8px'}}>
            <p style={{fontSize:'22px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em'}}>Links</p>
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
              <VerMiniPageButton/>
              <button type="button" onClick={novoLink} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Novo link</button>
            </div>
          </div>
          <p style={{fontSize:'13px',color:'#B8AAB8',marginBottom:'24px'}}>TikTok, YouTube, Shopee, site, grupo VIP e outros links da sua bio. Use as setas para mudar a ordem de exibição.</p>

          {links.length===0&&<p style={{fontSize:'13px',color:'#B8AAB8',padding:'12px 0'}}>Nenhum link cadastrado ainda.</p>}

          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {links.map((l,i)=>{
              const tipoSugerido=(l.tipo==='outro'||!l.tipo)?detectarTipoPelaUrl(l.url):null
              const emEdicao=editandoId===l.id

              // ===== CARD COMPACTO (padrao de exibicao) =====
              if(!emEdicao){
                return (
                  <div key={l.id} className="crd" style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
                    <div style={{display:'flex',flexDirection:'column',gap:'3px',flexShrink:0}}>
                      <button type="button" onClick={()=>mover(l.id,'up')} disabled={i===0} style={{width:'22px',height:'22px',borderRadius:'6px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===0?'#4A3F4E':'#B8AAB8',cursor:i===0?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowUp size={12}/></button>
                      <button type="button" onClick={()=>mover(l.id,'down')} disabled={i===links.length-1} style={{width:'22px',height:'22px',borderRadius:'6px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:i===links.length-1?'#4A3F4E':'#B8AAB8',cursor:i===links.length-1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><ArrowDown size={12}/></button>
                    </div>
                    <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'rgba(255,255,255,.04)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <IconePlataforma tipo={l.tipo}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:'14px',fontWeight:700,color:'#F8F4F7',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.titulo||'(sem título)'}</p>
                      {l.descricao&&<p style={{fontSize:'12px',color:'#B8AAB8',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.descricao}</p>}
                    </div>
                    <button type="button" onClick={()=>editarLink(l.id,'ativo',!l.ativo)} style={{background:l.ativo?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(l.ativo?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:10,padding:'6px 12px',fontSize:11,fontWeight:700,color:l.ativo?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>{l.ativo?'Ativo':'Oculto'}</button>
                    <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                      <button type="button" onClick={()=>setEditandoId(l.id)} aria-label="Editar" style={{width:'32px',height:'32px',borderRadius:'8px',background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Pencil size={14}/></button>
                      <button type="button" onClick={()=>excluirLink(l.id)} aria-label="Excluir" style={{width:'32px',height:'32px',borderRadius:'8px',background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',color:'#EF4444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Trash2 size={14}/></button>
                    </div>
                  </div>
                )
              }

              // ===== FORMULARIO COMPLETO (so o item em edicao) =====
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
                        {PLATAFORMAS_LINK.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    </div>
                    <div><label className="lbl">Título</label><input className="inp" autoFocus={!!l._novo} value={l.titulo||''} onChange={e=>editarLink(l.id,'titulo',e.target.value)} placeholder="Ex: TikTok"/></div>
                  </div>
                  <div style={{marginBottom:'10px'}}><label className="lbl">Descrição (opcional)</label><input className="inp" value={l.descricao||''} onChange={e=>editarLink(l.id,'descricao',e.target.value)} placeholder="Ex: @studiobellaeducadora"/></div>
                  <div style={{marginBottom:'12px'}}>
                    <label className="lbl">{l.tipo==='whatsapp'?'Número (com DDD) ou @usuário do WhatsApp':l.tipo==='endereco'?'Endereço para abrir no Google Maps':l.tipo==='email'?'E-mail para contato':l.tipo==='secreto'?'Link de direcionamento':'Link (URL)'}</label>
                    <input className="inp" type={l.tipo==='email'?'email':'text'} value={l.url||''} onChange={e=>editarLink(l.id,'url',e.target.value)} placeholder={placeholderPlataforma(l.tipo)}/>
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
                      <button type="button" onClick={()=>cancelarEdicao(l)} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Voltar</button>
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

