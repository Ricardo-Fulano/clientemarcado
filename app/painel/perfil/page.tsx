'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { Home, Calendar, Users, ClipboardList, Wallet, CreditCard, Sparkles, User, BarChart3, Settings, Copy, Check, ExternalLink } from 'lucide-react'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'

const SB_LINKS=[
  {h:'/painel',l:'Início',I:Home},
  {h:'/painel/agendamentos',l:'Agenda',I:Calendar},
  {h:'/painel/clientes',l:'Clientes',I:Users},
  {h:'/painel/orcamentos',l:'Orçamentos',I:ClipboardList},
  {h:'/painel/cobrancas',l:'Cobranças',I:Wallet},
  {h:'/painel/pagamentos',l:'Pagamentos',I:CreditCard},
  {h:'/painel/servicos',l:'Serviços',I:Sparkles},
  {h:'/painel/profissionais',l:'Profissionais',I:User},
  {h:'/painel/relatorio',l:'Relatórios',I:BarChart3},
  {h:'/painel/perfil',l:'Configurações',I:Settings,on:true},
]

const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const INTERVALOS=['15 min','30 min','45 min','1 hora']
const ANTECEDENCIAS=['Sem restrição','1 hora antes','2 horas antes','4 horas antes','1 dia antes']

const TEMAS=[
  {id:'padrao',nome:'Padrão ClienteMarcado',desc:'Azul + roxo, ideal para qualquer negócio.',p:'#3B82F6',s:'#7C3AED'},
  {id:'beleza',nome:'Beleza Premium',desc:'Rosa + roxo, ideal para estética, salão e beleza.',p:'#EC4899',s:'#7C3AED'},
  {id:'saude',nome:'Saúde Premium',desc:'Verde + ciano, ideal para clínicas e saúde.',p:'#22C55E',s:'#22D3EE'},
  {id:'barbearia',nome:'Barbearia Premium',desc:'Laranja + dourado, ideal para barbearias.',p:'#F59E0B',s:'#FACC15'},
  {id:'minimal',nome:'Minimal Premium',desc:'Azul + cinza, visual neutro e profissional.',p:'#3B82F6',s:'#94A3B8'},
]

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
select option{background:#07111F;color:#F8FAFC}
.sb{width:220px;min-height:100vh;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);border-right:1px solid rgba(148,163,184,.14);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.sb-logo{padding:20px 16px 16px;border-bottom:1px solid rgba(148,163,184,.08);display:flex;align-items:center;gap:8px}
.sb-ic{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#3B82F6,#7C3AED);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 22px rgba(124,58,237,.48)}
.sb nav{flex:1;padding:10px 8px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:500;color:#94A3B8;transition:all .18s;border:1px solid transparent;white-space:nowrap}
.nl:hover{background:rgba(124,58,237,.10);color:#fff;border-color:rgba(124,58,237,.20)}
.nl.on{background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;font-weight:700;box-shadow:0 0 26px rgba(124,58,237,.34),inset 0 1px 0 rgba(255,255,255,.10);border-color:rgba(255,255,255,.10)}
.sb-foot{padding:10px;border-top:1px solid rgba(148,163,184,.08)}
.mob-hdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.94);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.1);position:sticky;top:0;z-index:20;width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.12)}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:220px;flex:1;min-height:100vh;width:calc(100% - 220px);max-width:calc(100% - 220px)}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1060px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;padding:24px;margin-bottom:16px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.inp{width:100%;background:rgba(15,23,42,.88);border:1.5px solid rgba(148,163,184,.18);border-radius:12px;padding:0 14px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.12)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:7px}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.dia-btn{border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all .18s;font-family:inherit;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.72);color:#64748B}
.dia-btn.on{background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;border-color:transparent;box-shadow:0 0 14px rgba(124,58,237,.28)}
.tema-card{background:rgba(15,23,42,.72);border:1.5px solid rgba(148,163,184,.16);border-radius:14px;padding:14px;cursor:pointer;transition:all .18s;text-align:left;font-family:inherit;width:100%}
.tema-card.on{border-color:rgba(124,58,237,.55);background:rgba(124,58,237,.10);box-shadow:0 0 18px rgba(124,58,237,.18)}
@media(max-width:1023px){
  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mob-hdr{display:flex!important}.bdy{padding:14px 16px 80px!important}
  .fg2{grid-template-columns:1fr!important}
  .topo-r{flex-direction:column!important;gap:8px!important}
  .link-btns{flex-direction:column!important}
  .link-btns a,.link-btns button{width:100%!important;justify-content:center!important}
  .temas-grid{grid-template-columns:1fr 1fr!important}
}
@media(max-width:480px){.temas-grid{grid-template-columns:1fr!important}}
`

export default function Perfil(){
  const [userId,setUserId]=useState('')
  const [mob,setMob]=useState(false)
  const [salvando,setSalvando]=useState(false)
  const [msg,setMsg]=useState('')
  const [copied,setCopied]=useState(false)
  const imgRef=useRef<HTMLInputElement>(null)

  // Campos da tabela perfis (apenas campos que existem no banco)
  const [nome,setNome]=useState('')
  const [slug,setSlug]=useState('')
  const [end,setEnd]=useState('')
  const [wpp,setWpp]=useState('')
  const [insta,setInsta]=useState('')
  const [cidade,setCidade]=useState('')
  const [desc,setDesc]=useState('')
  const [capUrl,setCapUrl]=useState('')

  // Campos de agenda (verificar se existem no banco antes de enviar)
  const [diasAtivos,setDiasAtivos]=useState([false,true,true,true,true,true,true])
  const [horarios,setHorarios]=useState(DIAS.map(()=>({abertura:'08:00',fechamento:'18:00'})))
  const [intervalo,setIntervalo]=useState('30 min')
  const [abertura,setAbertura]=useState('08:00')
  const [fechamento,setFechamento]=useState('18:00')
  const [antecedencia,setAntecedencia]=useState('Sem restrição')

  // Tema (estado local — conectar ao banco quando criar coluna tema_publico)
  const [publicTheme,setPublicTheme]=useState('padrao')

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const {data:p,error}=await supabase.from('perfis').select('*').eq('user_id',user.id).single()
    if(error&&error.code!=='PGRST116'){console.error('Erro ao carregar perfil:',error)}
    if(p){
      setNome(p.nome_negocio||'')
      setSlug(p.slug||'')
      setEnd(p.endereco||'')
      setWpp(p.whatsapp||'')
      setInsta(p.instagram||'')
      setCidade(p.cidade||p.cidade_estado||'')
      setDesc(p.descricao||'')
      setCapUrl(p.capa_url||p.imagem_capa||'')
      // Agenda — campos podem ter nomes diferentes dependendo da versão
      if(p.dias_ativos) setDiasAtivos(p.dias_ativos)
      if(p.horarios) setHorarios(p.horarios)
      if(p.intervalo||p.intervalo_agenda) setIntervalo(p.intervalo||p.intervalo_agenda||'30 min')
      if(p.abertura_geral) setAbertura(p.abertura_geral)
      if(p.fechamento_geral) setFechamento(p.fechamento_geral)
      if(p.antecedencia||p.antecedencia_minima) setAntecedencia(p.antecedencia||p.antecedencia_minima||'Sem restrição')
      // Tema (se existir no banco)
      if(p.public_theme||p.tema_publico||p.tema_cor) setPublicTheme(p.public_theme||p.tema_publico||p.tema_cor||'padrao')
    }
  }

  async function salvar(){
    if(!nome.trim()||!slug.trim()){setMsg('Nome e link são obrigatórios.');return}
    setSalvando(true)
    const slugFmt=slug.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')

    // Payload com apenas campos base garantidos na tabela perfis
    const payloadBase:any={
      user_id:userId,
      nome_negocio:nome.trim(),
      slug:slugFmt,
    }

    // Campos opcionais — adicionados com segurança
    if(end!==undefined) payloadBase.endereco=end.trim()||null
    if(wpp!==undefined) payloadBase.whatsapp=wpp.replace(/\D/g,'')||null
    if(insta!==undefined) payloadBase.instagram=insta.trim()||null
    if(cidade!==undefined) payloadBase.cidade=cidade.trim()||null
    if(desc!==undefined) payloadBase.descricao=desc.trim()||null
    if(capUrl!==undefined) payloadBase.capa_url=capUrl||null

    // Campos de agenda — tentar enviar, capturar erro por coluna
    try {
      payloadBase.dias_ativos=diasAtivos
      payloadBase.horarios=horarios
      payloadBase.intervalo=intervalo
      payloadBase.abertura_geral=abertura
      payloadBase.fechamento_geral=fechamento
      payloadBase.antecedencia=antecedencia
    } catch(_){}

    // Tema público — só envia se coluna existir (sem quebrar se não existir)
    payloadBase.public_theme=publicTheme
    console.log('Tema antes de salvar:', publicTheme)

    console.log('Payload perfil:', payloadBase)

    // Verificar se perfil ja existe
    const {data:existente}=await supabase.from('perfis').select('id').eq('user_id',userId).single()

    // Salvar apenas campos seguros + public_theme
    const payloadSeguro:any={
      nome_negocio:nome.trim(),
      slug:slugFmt,
      public_theme:publicTheme,
    }
    // Adicionar campos opcionais se existirem
    if(end!==undefined) payloadSeguro.endereco=end.trim()||null
    if(wpp!==undefined) payloadSeguro.whatsapp=wpp.replace(/\D/g,'')||null
    if(insta!==undefined) payloadSeguro.instagram=insta.trim()||null
    if(cidade!==undefined) payloadSeguro.cidade=cidade.trim()||null
    if(desc!==undefined) payloadSeguro.descricao=desc.trim()||null
    if(capUrl!==undefined) payloadSeguro.capa_url=capUrl||null
    try{payloadSeguro.dias_ativos=diasAtivos;payloadSeguro.horarios=horarios;payloadSeguro.intervalo=intervalo;payloadSeguro.abertura_geral=abertura;payloadSeguro.fechamento_geral=fechamento;payloadSeguro.antecedencia=antecedencia}catch(_){}

    console.log('SALVANDO - publicTheme:', publicTheme)
    console.log('PAYLOAD:', payloadSeguro)

    let saveError:any=null
    if(existente){
      const {error,data:upd}=await supabase.from('perfis').update(payloadSeguro).eq('user_id',userId).select('public_theme')
      console.log('UPDATE resultado:', upd, 'erro:', error)
      saveError=error
    } else {
      const {error}=await supabase.from('perfis').insert({...payloadSeguro,user_id:userId})
      saveError=error
    }

    if(saveError){
      console.error('Erro ao salvar:', saveError)
      // Fallback: salvar apenas o essencial
      const {error:e2}=await supabase.from('perfis').update({nome_negocio:nome.trim(),slug:slugFmt,public_theme:publicTheme}).eq('user_id',userId)
      if(e2){console.error('Erro fallback:',e2);setMsg('Erro ao salvar. Tente novamente.');setSalvando(false);return}
    }

    // Verificar o que foi salvo no banco
    const {data:check}=await supabase.from('perfis').select('public_theme').eq('user_id',userId).single()
    console.log('VERIFICACAO - public_theme no banco AGORA:', check?.public_theme)

    setSalvando(false)
    setMsg('Perfil salvo com sucesso!')
    setTimeout(()=>setMsg(''),3000)
  }

  async function uploadCapa(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    const ext=file.name.split('.').pop()
    const path=`capas/${userId}.${ext}`
    const {error}=await supabase.storage.from('fotos').upload(path,file,{upsert:true})
    if(error){setMsg('Erro no upload da imagem.');return}
    const {data}=supabase.storage.from('fotos').getPublicUrl(path)
    setCapUrl(data.publicUrl)
  }

  function toggleDia(i:number){setDiasAtivos(prev=>prev.map((v,j)=>j===i?!v:v))}
  function setHor(i:number,campo:'abertura'|'fechamento',val:string){setHorarios(prev=>prev.map((h,j)=>j===i?{...h,[campo]:val}:h))}
  function copiarLink(){navigator.clipboard.writeText(pubUrl);setCopied(true);setTimeout(()=>setCopied(false),2000)}

  const ini=(nome||'C').charAt(0).toUpperCase()
  const pubUrl=`${typeof window!=='undefined'?window.location.origin:'https://clientemarcado-3p4t.vercel.app'}/${slug}`

  const SidebarComp=()=>(
    <aside className="sb">
      <div className="sb-logo"><div className="sb-ic"><Calendar size={14} color="#fff"/></div><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span></div>
      <nav>{SB_LINKS.map(it=>(<Link key={it.l} href={it.h} prefetch={false} className={'nl'+(it.on?' on':'')}><it.I size={16}/><span>{it.l}</span></Link>))}</nav>
      <div className="sb-foot"><div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div><div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div></div></div>
    </aside>
  )

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drw${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid rgba(148,163,184,.10)'}}><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span><button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button></div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{SB_LINKS.map(it=>(<Link key={it.l} href={it.h} prefetch={false} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}><it.I size={16}/><span>{it.l}</span></Link>))}</nav>
      </div>
      <SidebarComp/>
      <div className="main">
        <div className="mob-hdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>{[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:`${w}px`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}</button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Configurações</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">
          <AvisoAtraso/>
                    

          {msg&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:msg.includes('rro')?'rgba(239,68,68,.16)':'rgba(34,197,94,.16)',border:`1px solid ${msg.includes('rro')?'rgba(239,68,68,.36)':'rgba(34,197,94,.36)'}`,borderRadius:'10px',padding:'10px 20px',zIndex:99,color:msg.includes('rro')?'#F87171':'#4ADE80',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>
              {msg}
            </div>
          )}

          {/* Header */}
          <div className="topo-r" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Perfil do negócio</h1>
              <p style={{fontSize:'13px',color:'#64748B'}}>Configure como seu negócio aparece para os clientes.</p>
            </div>
            <Link href="/painel" prefetch={false} style={{fontSize:'13px',color:'#64748B',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px',flexShrink:0,padding:'8px 12px',background:'rgba(15,23,42,.72)',border:'1px solid rgba(148,163,184,.14)',borderRadius:'8px'}}>← Voltar ao painel</Link>
          </div>

          {/* Link publico */}
          {slug&&(
            <div className="crd" style={{border:'1.5px solid rgba(34,211,238,.24)',background:'radial-gradient(circle at top left,rgba(6,182,212,.10),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))'}}>
              <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Seu link de agendamento</p>
              <p style={{fontSize:'12px',color:'#64748B',marginBottom:'14px'}}>Compartilhe este link para receber agendamentos online.</p>
              <div style={{background:'rgba(15,23,42,.72)',border:'1px solid rgba(148,163,184,.14)',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'8px',overflowX:'auto'}}>
                <span style={{fontSize:'13px',color:'#22D3EE',fontFamily:'monospace',fontWeight:600,whiteSpace:'nowrap'}}>{pubUrl}</span>
              </div>
              <div className="link-btns" style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button onClick={copiarLink} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'12px',height:'42px',padding:'0 18px',fontSize:'13px',fontWeight:700,display:'inline-flex',alignItems:'center',gap:'6px',cursor:'pointer',fontFamily:'inherit',boxShadow:'0 8px 24px rgba(59,130,246,.28)',whiteSpace:'nowrap'}}>
                  {copied?<Check size={14}/>:<Copy size={14}/>}{copied?'Copiado!':'Copiar link'}
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent('Agende comigo: '+pubUrl)}`} target="_blank" rel="noreferrer" style={{background:'rgba(34,197,94,.14)',border:'1px solid rgba(34,197,94,.28)',color:'#4ADE80',borderRadius:'10px',height:'42px',padding:'0 16px',fontSize:'13px',fontWeight:600,display:'inline-flex',alignItems:'center',gap:'6px',textDecoration:'none',whiteSpace:'nowrap'}}>WhatsApp</a>
                <a href={pubUrl} target="_blank" rel="noreferrer" style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.20)',color:'#CBD5E1',borderRadius:'10px',height:'42px',padding:'0 16px',fontSize:'13px',fontWeight:600,display:'inline-flex',alignItems:'center',gap:'6px',textDecoration:'none',whiteSpace:'nowrap'}}><ExternalLink size={14}/>Ver página</a>
              </div>
            </div>
          )}

          {/* Informacoes do negocio */}
          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Informações do negócio</p>
            <p style={{fontSize:'12px',color:'#64748B',marginBottom:'18px'}}>Dados principais que identificam seu negócio.</p>
            <div style={{marginBottom:'14px'}}>
              <label className="lbl">Nome do negócio *</label>
              <input className="inp" type="text" placeholder="Ex: Barbearia da Cabeça" value={nome} onChange={e=>setNome(e.target.value)}/>
            </div>
            <div style={{marginBottom:'14px'}}>
              <label className="lbl">Link personalizado *</label>
              <div style={{display:'flex',alignItems:'center',background:'rgba(15,23,42,.88)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'12px',overflow:'hidden',transition:'border-color .2s'}} onFocusCapture={e=>(e.currentTarget.style.borderColor='rgba(124,58,237,.55)')} onBlurCapture={e=>(e.currentTarget.style.borderColor='rgba(148,163,184,.18)')}>
                <span style={{padding:'0 12px',fontSize:'12px',color:'#64748B',whiteSpace:'nowrap',borderRight:'1px solid rgba(148,163,184,.14)',height:'48px',display:'flex',alignItems:'center',background:'rgba(255,255,255,.03)',flexShrink:0}}>clientemarcado.vercel.app/</span>
                <input type="text" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''))} placeholder="seu-negocio" style={{flex:1,background:'transparent',border:'none',outline:'none',padding:'0 14px',height:'48px',fontSize:'14px',color:'#F8FAFC',fontFamily:'inherit'}}/>
              </div>
            </div>
            <div>
              <label className="lbl">Endereço (opcional)</label>
              <input className="inp" type="text" placeholder="Ex: Rua Principal, 123 - São Paulo" value={end} onChange={e=>setEnd(e.target.value)}/>
            </div>
          </div>

          {/* Dados publicos */}
          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Dados públicos do negócio</p>
            <p style={{fontSize:'12px',color:'#64748B',marginBottom:'18px'}}>Informações que aparecem na sua página de agendamento.</p>
            <div className="fg2" style={{marginBottom:'14px'}}>
              <div><label className="lbl">WhatsApp do negócio</label><input className="inp" type="tel" placeholder="(11) 99999-9999" value={wpp} onChange={e=>setWpp(e.target.value)}/></div>
              <div><label className="lbl">Instagram</label><input className="inp" type="text" placeholder="@seunegocio" value={insta} onChange={e=>setInsta(e.target.value)}/></div>
            </div>
            <div style={{marginBottom:'14px'}}>
              <label className="lbl">Cidade / Estado</label>
              <input className="inp" type="text" placeholder="Ex: São Paulo - SP" value={cidade} onChange={e=>setCidade(e.target.value)}/>
            </div>
            <div>
              <label className="lbl">Descrição curta do negócio</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value.slice(0,180))} placeholder="Ex: Atendimento com horário marcado, ambiente confortável e profissionais especializados." style={{width:'100%',background:'rgba(15,23,42,.88)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'12px',padding:'12px 14px',fontSize:'14px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',resize:'none',height:'90px',lineHeight:1.5,boxSizing:'border-box',transition:'border-color .2s'}} onFocus={e=>(e.target.style.borderColor='rgba(124,58,237,.55)')} onBlur={e=>(e.target.style.borderColor='rgba(148,163,184,.18)')}/>
              <p style={{fontSize:'11px',color:'#475569',textAlign:'right',marginTop:'4px'}}>{desc.length}/180</p>
            </div>
          </div>

          {/* Funcionamento */}
          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Funcionamento do negócio</p>
            <p style={{fontSize:'12px',color:'#64748B',marginBottom:'18px'}}>Defina os dias e horários em que seus clientes podem agendar.</p>
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
                  <input type="time" value={horarios[i]?.abertura||'08:00'} onChange={e=>setHor(i,'abertura',e.target.value)} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',cursor:'pointer'}}/>
                  <span style={{fontSize:'12px',color:'#64748B'}}>até</span>
                  <input type="time" value={horarios[i]?.fechamento||'18:00'} onChange={e=>setHor(i,'fechamento',e.target.value)} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',cursor:'pointer'}}/>
                </div>
              )
            })}
          </div>

          {/* Config agenda */}
          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Configurações da agenda</p>
            <p style={{fontSize:'12px',color:'#64748B',marginBottom:'18px'}}>Controle como o agendamento público funciona.</p>
            <div className="fg2" style={{marginBottom:'14px'}}>
              <div><label className="lbl">Intervalo entre horários</label><select className="inp" style={{cursor:'pointer'}} value={intervalo} onChange={e=>setIntervalo(e.target.value)}>{INTERVALOS.map(v=><option key={v}>{v}</option>)}</select></div>
              <div><label className="lbl">Antecedência mínima</label><select className="inp" style={{cursor:'pointer'}} value={antecedencia} onChange={e=>setAntecedencia(e.target.value)}>{ANTECEDENCIAS.map(v=><option key={v}>{v}</option>)}</select></div>
            </div>
            <div className="fg2">
              <div><label className="lbl">Abertura geral</label><input className="inp" type="time" value={abertura} onChange={e=>setAbertura(e.target.value)}/></div>
              <div><label className="lbl">Fechamento geral</label><input className="inp" type="time" value={fechamento} onChange={e=>setFechamento(e.target.value)}/></div>
            </div>
          </div>

          {/* Aparencia */}
          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Aparência da página pública</p>
            <p style={{fontSize:'12px',color:'#64748B',marginBottom:'18px'}}>Personalize a página que seus clientes acessam para agendar.</p>

            <p style={{fontSize:'13px',fontWeight:600,color:'#CBD5E1',marginBottom:'8px'}}>Imagem de capa</p>
            <p style={{fontSize:'12px',color:'#64748B',marginBottom:'12px'}}>Aparece no topo da sua página de agendamento. Use uma imagem horizontal (16:9).</p>
            {capUrl?(
              <div style={{position:'relative',borderRadius:'14px',overflow:'hidden',marginBottom:'16px',border:'1px solid rgba(148,163,184,.14)'}}>
                <img src={capUrl} alt="Capa" style={{width:'100%',height:'200px',objectFit:'cover',display:'block'}}/>
                <div style={{position:'absolute',top:'10px',right:'10px',display:'flex',gap:'6px'}}>
                  <button onClick={()=>imgRef.current?.click()} style={{background:'rgba(15,23,42,.9)',border:'1px solid rgba(148,163,184,.24)',color:'#CBD5E1',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Trocar</button>
                  <button onClick={()=>setCapUrl('')} style={{background:'rgba(239,68,68,.18)',border:'1px solid rgba(239,68,68,.36)',color:'#F87171',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Remover</button>
                </div>
              </div>
            ):(
              <div onClick={()=>imgRef.current?.click()} style={{border:'2px dashed rgba(148,163,184,.22)',borderRadius:'14px',padding:'32px',textAlign:'center',cursor:'pointer',marginBottom:'16px',transition:'border-color .18s'}} onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(124,58,237,.40)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(148,163,184,.22)')}>
                <p style={{fontSize:'14px',color:'#64748B',marginBottom:'4px'}}>Clique para adicionar imagem de capa</p>
                <p style={{fontSize:'12px',color:'#475569'}}>Recomendado: 1200x400px, formato JPG ou PNG</p>
              </div>
            )}
            <input ref={imgRef} type="file" accept="image/*" onChange={uploadCapa} style={{display:'none'}}/>

            <div style={{borderTop:'1px solid rgba(148,163,184,.10)',paddingTop:'18px',marginTop:'4px'}}>
              <p style={{fontSize:'13px',fontWeight:600,color:'#CBD5E1',marginBottom:'4px'}}>Cor de destaque</p>
              <p style={{fontSize:'12px',color:'#64748B',marginBottom:'14px'}}>Escolha uma cor pronta para combinar com o estilo do seu negócio. Afeta apenas a página pública.</p>
              {/* TODO: conectar tema ao banco criando coluna tema_publico text default 'padrao' na tabela perfis */}
              <div className="temas-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>
                {TEMAS.map(t=>(
                  <button key={t.id} onClick={()=>setPublicTheme(t.id)} className={`tema-card${publicTheme===t.id?' on':''}`}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                      <div style={{display:'flex',gap:'4px'}}>
                        <div style={{width:'16px',height:'16px',borderRadius:'50%',background:t.p,flexShrink:0}}/>
                        <div style={{width:'16px',height:'16px',borderRadius:'50%',background:t.s,flexShrink:0}}/>
                      </div>
                      {publicTheme===t.id&&<span style={{fontSize:'10px',fontWeight:700,color:'#C4B5FD',background:'rgba(124,58,237,.18)',borderRadius:'6px',padding:'2px 7px',marginLeft:'auto'}}>Ativo</span>}
                    </div>
                    <p style={{fontSize:'12px',fontWeight:700,color:publicTheme===t.id?'#F8FAFC':'#CBD5E1',marginBottom:'3px'}}>{t.nome}</p>
                    <p style={{fontSize:'11px',color:'#64748B',lineHeight:1.4}}>{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Salvar */}
          <button onClick={salvar} disabled={salvando} style={{width:'100%',background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'14px',height:'52px',fontSize:'15px',fontWeight:800,cursor:salvando?'not-allowed':'pointer',fontFamily:'inherit',boxShadow:'0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.22)',opacity:salvando?.7:1,transition:'all .18s'}}>
            {salvando?'Salvando...':'Salvar perfil'}
          </button>

        </div></div>
      </div>
    </div>
  )
}
