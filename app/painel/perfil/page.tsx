'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { Home, Calendar, Users, ClipboardList, Wallet, CreditCard, Sparkles, User, BarChart3, Settings, Copy, Check, ExternalLink } from 'lucide-react'

const G='linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const AV='linear-gradient(135deg,rgba(236,72,153,.95),rgba(139,92,246,.95))'

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

// Compatibilidade com valores antigos salvos no banco (nao apaga dados, so traduz visualmente)
const TEMA_LEGADO: Record<string,string> = {padrao:'modelo1', beleza:'modelo2', barbearia:'modelo3', minimal:'modelo4', saude:'modelo5'}
function resolverTema(id:string){ return TEMA_LEGADO[id] || id }

const TEMAS=[
  {id:'modelo1',nome:'Modelo 1',desc:'Rosa vibrante, moderno e marcante.',p:'#FF4FA3',s:'#D946EF'},
  {id:'modelo2',nome:'Modelo 2',desc:'Rosa suave e elegante, com presença sofisticada.',p:'#DB6A9A',s:'#8B5CF6'},
  {id:'modelo3',nome:'Modelo 3',desc:'Preto e dourado, visual luxuoso e de alto padrão.',p:'#D4AF37',s:'#9C7A2F'},
  {id:'modelo4',nome:'Modelo 4',desc:'Lilás e roxo, delicado, moderno e sofisticado.',p:'#A78BFA',s:'#7C3AED'},
  {id:'modelo5',nome:'Modelo 5',desc:'Nude e champagne, visual natural e acolhedor.',p:'#D6A77A',s:'#A47148'},
]

const TEMA_CORES: Record<string, {primary:string;secondary:string;accent:string;border:string;bg:string;text:string;btnText:string}> = {
  modelo1: {primary:'#FF4FA3',secondary:'#D946EF',accent:'#EC4899',border:'rgba(255,79,163,.38)', bg:'rgba(255,79,163,.10)', text:'#FF8FC4', btnText:'#fff'},
  modelo2: {primary:'#DB6A9A',secondary:'#8B5CF6',accent:'#B85C8E',border:'rgba(219,106,154,.38)',bg:'rgba(219,106,154,.10)',text:'#D8A0BE', btnText:'#fff'},
  modelo3: {primary:'#D4AF37',secondary:'#9C7A2F',accent:'#F0D98A',border:'rgba(212,175,55,.38)', bg:'rgba(212,175,55,.10)', text:'#F0D98A', btnText:'#1A140A'},
  modelo4: {primary:'#A78BFA',secondary:'#7C3AED',accent:'#C084FC',border:'rgba(167,139,250,.38)',bg:'rgba(167,139,250,.10)',text:'#C4B5FD', btnText:'#fff'},
  modelo5: {primary:'#D6A77A',secondary:'#A47148',accent:'#E8C39E',border:'rgba(214,167,122,.38)',bg:'rgba(214,167,122,.10)',text:'#E8C39E', btnText:'#2A1810'},
}

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
input,select,textarea{color-scheme:dark}
select option{background:#120A14;color:#F8F4F7}
.sb{width:220px;min-height:100vh;background:radial-gradient(circle at top left,rgba(139,92,246,.14),transparent 32%),linear-gradient(180deg,#070F1D,#08060A);border-right:1px solid #2A1A2F;display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.sb-logo{padding:20px 16px 16px;border-bottom:1px solid #2A1A2F;display:flex;align-items:center;gap:8px}
.sb-ic{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 22px rgba(236,72,153,.28)}
.sb nav{flex:1;padding:10px 8px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:500;color:#B8AAB8;transition:all .18s;border:1px solid transparent;white-space:nowrap}
.nl:hover{background:rgba(236,72,153,.10);color:#F8F4F7;border-color:rgba(236,72,153,.24)}
.nl.on{background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);color:#fff;font-weight:700;box-shadow:0 0 26px rgba(236,72,153,.28),inset 0 1px 0 rgba(255,255,255,.10);border-color:rgba(255,255,255,.10)}
.sb-foot{padding:10px;border-top:1px solid #2A1A2F}
.mob-hdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.94);backdrop-filter:blur(20px);border-bottom:1px solid #2A1A2F;position:sticky;top:0;z-index:20;width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:linear-gradient(180deg,#070F1D,#08060A);z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid #2A1A2F}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:220px;flex:1;min-height:100vh;width:calc(100% - 220px);max-width:calc(100% - 220px)}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.20),transparent 32%),radial-gradient(circle at top right,rgba(236,72,153,.14),transparent 28%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1060px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.08),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px;padding:24px;margin-bottom:16px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.inp{width:100%;background:rgba(24,16,27,.88);border:1.5px solid #2A1A2F;border-radius:12px;padding:0 14px;height:48px;font-size:14px;color:#F8F4F7;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(236,72,153,.55);box-shadow:0 0 0 3px rgba(236,72,153,.12)}
.lbl{font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:7px}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.dia-btn{border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all .18s;font-family:inherit;border:1.5px solid #2A1A2F;background:rgba(24,16,27,.72);color:#B8AAB8}
.dia-btn.on{background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);color:#fff;border-color:transparent;box-shadow:0 0 14px rgba(236,72,153,.28)}
.tema-card{background:rgba(24,16,27,.72);border:1.5px solid #2A1A2F;border-radius:14px;padding:14px;cursor:pointer;transition:all .18s;text-align:left;font-family:inherit;width:100%}
.tema-card.on{border-color:rgba(139,92,246,.55);background:rgba(139,92,246,.10);box-shadow:0 0 18px rgba(139,92,246,.18)}
.btn-verpag:hover{border-color:rgba(236,72,153,.32)!important;color:#F8F4F7!important}
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
  const [promoAtiva,setPromoAtiva]=useState(false)
  const [promoTitulo,setPromoTitulo]=useState('')
  const [promoDesc,setPromoDesc]=useState('')
  const [promoPrecoAnt,setPromoPrecoAnt]=useState('')
  const [promoPrecoNovo,setPromoPrecoNovo]=useState('')
  const [promoBotao,setPromoBotao]=useState('Agendar promoção')
  const [promoObs,setPromoObs]=useState('')
  const [promoInicio,setPromoInicio]=useState('')
  const [promoFim,setPromoFim]=useState('')
  const [msg,setMsg]=useState('')
  const [copied,setCopied]=useState(false)
  const imgRef=useRef<HTMLInputElement>(null)

  const [nome,setNome]=useState('')
  const [slug,setSlug]=useState('')
  const [end,setEnd]=useState('')
  const [wpp,setWpp]=useState('')
  const [insta,setInsta]=useState('')
  const [cidade,setCidade]=useState('')
  const [desc,setDesc]=useState('')
  const [capUrl,setCapUrl]=useState('')

  const [diasAtivos,setDiasAtivos]=useState([false,true,true,true,true,true,true])
  const [horarios,setHorarios]=useState(DIAS.map(()=>({abertura:'08:00',fechamento:'18:00'})))
  const [intervalo,setIntervalo]=useState('30 min')
  const [abertura,setAbertura]=useState('08:00')
  const [fechamento,setFechamento]=useState('18:00')
  const [antecedencia,setAntecedencia]=useState('Sem restrição')
  const [publicTheme,setPublicTheme]=useState('modelo2')

  const tc = TEMA_CORES[publicTheme] ?? TEMA_CORES.modelo2

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)

    // ✅ CORRIGIDO: trocado .single() por .maybeSingle() para evitar erro 406
    const {data:p,error}=await supabase.from('perfis').select('*').eq('user_id',user.id).maybeSingle()
    if(error){console.error('Erro ao carregar perfil:',error)}
    if(p){
      setNome(p.nome_negocio||'')
      setSlug(p.slug||'')
      setEnd(p.endereco||'')
      setWpp(p.whatsapp||'')
      setInsta(p.instagram||'')
      setCidade(p.cidade||p.cidade_estado||'')
      setDesc(p.descricao||'')
      setCapUrl(p.capa_url||p.imagem_capa||'')
      if(p.dias_ativos) setDiasAtivos(p.dias_ativos)
      if(p.horarios) setHorarios(p.horarios)
      if(p.intervalo||p.intervalo_agenda) setIntervalo(p.intervalo||p.intervalo_agenda||'30 min')
      if(p.abertura_geral) setAbertura(p.abertura_geral)
      if(p.fechamento_geral) setFechamento(p.fechamento_geral)
      if(p.antecedencia||p.antecedencia_minima) setAntecedencia(p.antecedencia||p.antecedencia_minima||'Sem restrição')
      if(p.public_theme||p.tema_publico||p.tema_cor) setPublicTheme(resolverTema(p.public_theme||p.tema_publico||p.tema_cor||'modelo2'))
      if(p.promocao_ativa!==undefined&&p.promocao_ativa!==null) setPromoAtiva(p.promocao_ativa)
      if(p.promocao_titulo) setPromoTitulo(p.promocao_titulo)
      if(p.promocao_descricao) setPromoDesc(p.promocao_descricao)
      if(p.promocao_preco_antigo) setPromoPrecoAnt(String(p.promocao_preco_antigo))
      if(p.promocao_preco_novo) setPromoPrecoNovo(String(p.promocao_preco_novo))
      if(p.promocao_botao_texto) setPromoBotao(p.promocao_botao_texto)
      if(p.promocao_observacao) setPromoObs(p.promocao_observacao)
      if(p.promocao_data_inicio) setPromoInicio(p.promocao_data_inicio)
      if(p.promocao_data_fim) setPromoFim(p.promocao_data_fim)
    }
  }

  async function salvar(){
    if(!nome.trim()||!slug.trim()){setMsg('Nome e link são obrigatórios.');return}
    setSalvando(true)
    const slugFmt=slug.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')

    const payloadSeguro:any={
      nome_negocio:nome.trim(),
      slug:slugFmt,
      public_theme:publicTheme,
    }
    if(end!==undefined) payloadSeguro.endereco=end.trim()||null
    if(wpp!==undefined) payloadSeguro.whatsapp=wpp.replace(/\D/g,'')||null
    if(insta!==undefined) payloadSeguro.instagram=insta.trim()||null
    if(cidade!==undefined) payloadSeguro.cidade=cidade.trim()||null
    if(desc!==undefined) payloadSeguro.descricao=desc.trim()||null
    if(capUrl!==undefined) payloadSeguro.capa_url=capUrl||null

    payloadSeguro.promocao_ativa=promoAtiva
    payloadSeguro.promocao_titulo=promoTitulo.trim()||null
    payloadSeguro.promocao_descricao=promoDesc.trim()||null
    payloadSeguro.promocao_preco_antigo=promoPrecoAnt?parseFloat(promoPrecoAnt.replace(',','.'))||null:null
    payloadSeguro.promocao_preco_novo=promoPrecoNovo?parseFloat(promoPrecoNovo.replace(',','.'))||null:null
    payloadSeguro.promocao_botao_texto=promoBotao.trim()||'Agendar promoção'
    payloadSeguro.promocao_observacao=promoObs.trim()||null
    payloadSeguro.promocao_data_inicio=promoInicio||null
    payloadSeguro.promocao_data_fim=promoFim||null

    try{
      payloadSeguro.dias_ativos=diasAtivos
      payloadSeguro.horarios=horarios
      payloadSeguro.intervalo=intervalo
      payloadSeguro.abertura_geral=abertura
      payloadSeguro.fechamento_geral=fechamento
      payloadSeguro.antecedencia=antecedencia
    }catch(_){}

    console.log('PAYLOAD enviado:', payloadSeguro)

    // ✅ CORRIGIDO: também usando maybeSingle() aqui
    const {data:existente}=await supabase.from('perfis').select('id').eq('user_id',userId).maybeSingle()

    let saveError:any=null
    if(existente){
      const {error,data:upd}=await supabase.from('perfis').update(payloadSeguro).eq('user_id',userId).select()
      console.log('UPDATE resultado:', upd, 'erro:', error)
      saveError=error
    } else {
      const {error}=await supabase.from('perfis').insert({...payloadSeguro,user_id:userId})
      saveError=error
    }

    if(saveError){
      console.error('Erro ao salvar:', saveError)
      setMsg('Erro ao salvar: '+saveError.message)
      setSalvando(false)
      return
    }

    setSalvando(false)
    setMsg('Perfil salvo com sucesso!')
    setTimeout(()=>setMsg(''),3000)
  }

  async function restaurarCapa() {
    const {data:{user}}=await supabase.auth.getUser();if(!user)return
    await supabase.from('perfis').update({capa_url:null}).eq('user_id',user.id)
    setCapUrl('')
    setMsg('Imagem padrão restaurada!')
    setTimeout(()=>setMsg(''),3000)
  }
  // ✅ CORRIGIDO: uploadCapa com validações, contentType e salvamento no perfil
  async function uploadCapa(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return

    const allowedTypes=['image/jpeg','image/jpg','image/png','image/webp']
    if(!allowedTypes.includes(file.type)){
      setMsg('Envie uma imagem JPG, PNG ou WEBP.')
      return
    }
    if(file.size>5*1024*1024){
      setMsg('A imagem deve ter no máximo 5MB.')
      return
    }

    const {data:userData}=await supabase.auth.getUser()
    if(!userData?.user){
      setMsg('Sua sessão expirou. Faça login novamente.')
      return
    }

    const ext=file.name.split('.').pop()?.toLowerCase()||'png'
    const path=`capas/${userId}-${Date.now()}.${ext}`

    const {error:uploadError}=await supabase.storage.from('fotos').upload(path,file,{
      upsert:true,
      contentType:file.type,
      cacheControl:'3600',
    })

    if(uploadError){
      console.error('Erro no upload:',uploadError)
      setMsg('Erro no upload: '+uploadError.message)
      return
    }

    const {data}=supabase.storage.from('fotos').getPublicUrl(path)
    const imageUrl=data.publicUrl
    setCapUrl(imageUrl)

    // ✅ Salva a URL da capa direto no perfil após o upload
    const {error:updateError}=await supabase.from('perfis').update({capa_url:imageUrl}).eq('user_id',userId)
    if(updateError){
      console.error('Erro ao salvar capa no perfil:',updateError)
      setMsg('Imagem enviada, mas erro ao salvar no perfil: '+updateError.message)
      return
    }

    setMsg('Imagem de capa salva com sucesso!')
    setTimeout(()=>setMsg(''),3000)
  }

  function toggleDia(i:number){setDiasAtivos(prev=>prev.map((v,j)=>j===i?!v:v))}
  function setHor(i:number,campo:'abertura'|'fechamento',val:string){setHorarios(prev=>prev.map((h,j)=>j===i?{...h,[campo]:val}:h))}
  function copiarLink(){navigator.clipboard.writeText(pubUrl);setCopied(true);setTimeout(()=>setCopied(false),2000)}

  const ini=(nome||'C').charAt(0).toUpperCase()
  const pubUrl=`${typeof window!=='undefined'?window.location.origin:'https://clientemarcado-3p4t.vercel.app'}/${slug}`

  const SidebarComp=()=>(
    <aside className="sb">
      <div className="sb-logo"><div className="sb-ic"><Calendar size={14} color="#fff"/></div><span style={{fontSize:'14px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.02em'}}>ClienteMarcado</span></div>
      <nav>{SB_LINKS.map(it=>(<Link key={it.l} href={it.h} prefetch={false} className={'nl'+(it.on?' on':'')}><it.I size={16}/><span>{it.l}</span></Link>))}</nav>
      <div className="sb-foot"><div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(24,16,27,.6)',border:'1px solid #2A1A2F',borderRadius:'10px',padding:'10px 12px'}}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div><div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8F4F7',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'10px',color:'#B8AAB8'}}>Administrador</p></div></div></div>
              <button onClick={()=>{supabase.auth.signOut().then(()=>{window.location.href='/login'})}} style={{width:'100%',marginTop:'8px',background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'10px',padding:'9px 14px',color:'#EF4444',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'8px'}}>Sair</button>
    </aside>
  )

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#08060A',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drw${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid #2A1A2F'}}><span style={{fontSize:'14px',fontWeight:800,color:'#F8F4F7'}}>ClienteMarcado</span><button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button></div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{SB_LINKS.map(it=>(<Link key={it.l} href={it.h} prefetch={false} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}><it.I size={16}/><span>{it.l}</span></Link>))}</nav>
      </div>
      <SidebarComp/>
      <div className="main">
        <div className="mob-hdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>{[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:`${w}px`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}</button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8F4F7'}}>Configurações</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">

          {msg&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:msg.includes('rro')?'rgba(239,68,68,.16)':'rgba(34,197,94,.16)',border:`1px solid ${msg.includes('rro')?'rgba(239,68,68,.36)':'rgba(34,197,94,.36)'}`,borderRadius:'10px',padding:'10px 20px',zIndex:99,color:msg.includes('rro')?'#EF4444':'#22C55E',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>
              {msg}
            </div>
          )}

          <div className="topo-r" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8F4F7',letterSpacing:'-0.04em',marginBottom:'5px'}}>Perfil do negócio</h1>
              <p style={{fontSize:'13px',color:'#B8AAB8'}}>Configure como seu negócio aparece para os clientes.</p>
            </div>
            <Link href="/painel" prefetch={false} className="btn-verpag" style={{fontSize:'13px',color:'#B8AAB8',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px',flexShrink:0,padding:'8px 12px',background:'rgba(24,16,27,.72)',border:'1px solid #2A1A2F',borderRadius:'8px'}}>← Voltar ao painel</Link>
          </div>

          {slug&&(
            <div className="crd" style={{border:'1.5px solid rgba(139,92,246,.24)',background:'radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 40%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99))'}}>
              <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Seu link de agendamento</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'14px'}}>Compartilhe este link para receber agendamentos online.</p>
              <div style={{background:'rgba(24,16,27,.72)',border:'1px solid #2A1A2F',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'8px',overflowX:'auto'}}>
                <span style={{fontSize:'13px',color:'#8B5CF6',fontFamily:'monospace',fontWeight:600,whiteSpace:'nowrap'}}>{pubUrl}</span>
              </div>
              <div className="link-btns" style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button onClick={copiarLink} style={{background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'12px',height:'42px',padding:'0 18px',fontSize:'13px',fontWeight:700,display:'inline-flex',alignItems:'center',gap:'6px',cursor:'pointer',fontFamily:'inherit',boxShadow:'0 8px 24px rgba(236,72,153,.28)',whiteSpace:'nowrap'}}>
                  {copied?<Check size={14}/>:<Copy size={14}/>}{copied?'Copiado!':'Copiar link'}
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent('Agende comigo: '+pubUrl)}`} target="_blank" rel="noreferrer" style={{background:'rgba(34,197,94,.14)',border:'1px solid rgba(34,197,94,.28)',color:'#22C55E',borderRadius:'10px',height:'42px',padding:'0 16px',fontSize:'13px',fontWeight:600,display:'inline-flex',alignItems:'center',gap:'6px',textDecoration:'none',whiteSpace:'nowrap'}}>WhatsApp</a>
                <a href={pubUrl} target="_blank" rel="noreferrer" className="btn-verpag" style={{background:'rgba(24,16,27,.88)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'10px',height:'42px',padding:'0 16px',fontSize:'13px',fontWeight:600,display:'inline-flex',alignItems:'center',gap:'6px',textDecoration:'none',whiteSpace:'nowrap'}}><ExternalLink size={14}/>Ver página</a>
              </div>
            </div>
          )}

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Informações do negócio</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Dados principais que identificam seu negócio.</p>
            <div style={{marginBottom:'14px'}}>
              <label className="lbl">Nome do negócio *</label>
              <input className="inp" type="text" placeholder="Ex: Nome do seu negócio" value={nome} onChange={e=>setNome(e.target.value)}/>
            </div>
            <div style={{marginBottom:'14px'}}>
              <label className="lbl">Link personalizado *</label>
              <div style={{display:'flex',alignItems:'center',background:'rgba(24,16,27,.88)',border:'1.5px solid #2A1A2F',borderRadius:'12px',overflow:'hidden',transition:'border-color .2s'}} onFocusCapture={e=>(e.currentTarget.style.borderColor='rgba(236,72,153,.55)')} onBlurCapture={e=>(e.currentTarget.style.borderColor='#2A1A2F')}>
                <span style={{padding:'0 12px',fontSize:'12px',color:'#B8AAB8',whiteSpace:'nowrap',borderRight:'1px solid #2A1A2F',height:'48px',display:'flex',alignItems:'center',background:'rgba(255,255,255,.03)',flexShrink:0}}>clientemarcado.vercel.app/</span>
                <input type="text" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''))} placeholder="seu-negocio" style={{flex:1,background:'transparent',border:'none',outline:'none',padding:'0 14px',height:'48px',fontSize:'14px',color:'#F8F4F7',fontFamily:'inherit'}}/>
              </div>
            </div>
            <div>
              <label className="lbl">Endereço (opcional)</label>
              <input className="inp" type="text" placeholder="Ex: Rua Principal, 123 - São Paulo" value={end} onChange={e=>setEnd(e.target.value)}/>
            </div>
          </div>

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Dados públicos do negócio</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Informações que aparecem na sua página de agendamento.</p>
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
              <textarea value={desc} onChange={e=>setDesc(e.target.value.slice(0,180))} placeholder="Ex: Atendimento com horário marcado, ambiente confortável e profissionais especializados." style={{width:'100%',background:'rgba(24,16,27,.88)',border:'1.5px solid #2A1A2F',borderRadius:'12px',padding:'12px 14px',fontSize:'14px',color:'#F8F4F7',outline:'none',fontFamily:'inherit',resize:'none',height:'90px',lineHeight:1.5,boxSizing:'border-box',transition:'border-color .2s'}} onFocus={e=>(e.target.style.borderColor='rgba(236,72,153,.55)')} onBlur={e=>(e.target.style.borderColor='#2A1A2F')}/>
              <p style={{fontSize:'11px',color:'#B8AAB8',textAlign:'right',marginTop:'4px'}}>{desc.length}/180</p>
            </div>
          </div>

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Funcionamento do negócio</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Defina os dias e horários em que seus clientes podem agendar.</p>
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
                  <input type="time" value={horarios[i]?.abertura||'08:00'} onChange={e=>setHor(i,'abertura',e.target.value)} style={{background:'rgba(24,16,27,.88)',border:'1px solid #2A1A2F',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',color:'#F8F4F7',outline:'none',fontFamily:'inherit',cursor:'pointer'}}/>
                  <span style={{fontSize:'12px',color:'#B8AAB8'}}>até</span>
                  <input type="time" value={horarios[i]?.fechamento||'18:00'} onChange={e=>setHor(i,'fechamento',e.target.value)} style={{background:'rgba(24,16,27,.88)',border:'1px solid #2A1A2F',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',color:'#F8F4F7',outline:'none',fontFamily:'inherit',cursor:'pointer'}}/>
                </div>
              )
            })}
          </div>

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Configurações da agenda</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Controle como o agendamento público funciona.</p>
            <div className="fg2" style={{marginBottom:'14px'}}>
              <div><label className="lbl">Intervalo entre horários</label><select className="inp" style={{cursor:'pointer'}} value={intervalo} onChange={e=>setIntervalo(e.target.value)}>{INTERVALOS.map(v=><option key={v}>{v}</option>)}</select></div>
              <div><label className="lbl">Antecedência mínima</label><select className="inp" style={{cursor:'pointer'}} value={antecedencia} onChange={e=>setAntecedencia(e.target.value)}>{ANTECEDENCIAS.map(v=><option key={v}>{v}</option>)}</select></div>
            </div>
            <div className="fg2">
              <div><label className="lbl">Abertura geral</label><input className="inp" type="time" value={abertura} onChange={e=>setAbertura(e.target.value)}/></div>
              <div><label className="lbl">Fechamento geral</label><input className="inp" type="time" value={fechamento} onChange={e=>setFechamento(e.target.value)}/></div>
            </div>
          </div>

          <div className="crd">
            <p style={{fontSize:'15px',fontWeight:700,color:'#F8F4F7',marginBottom:'4px'}}>Aparência da página pública</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'18px'}}>Personalize a página que seus clientes acessam para agendar.</p>

            <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'8px'}}>Imagem de capa</p>
            <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'12px'}}>Aparece no topo da sua página de agendamento. Use uma imagem horizontal (16:9).</p>
            {capUrl?(
              <div style={{position:'relative',borderRadius:'14px',overflow:'hidden',marginBottom:'16px',border:'1px solid #2A1A2F'}}>
                <img src={capUrl} alt="Capa" style={{width:'100%',height:'200px',objectFit:'cover',display:'block'}}/>
                <div style={{position:'absolute',top:'10px',right:'10px',display:'flex',gap:'6px'}}>
                  <button onClick={()=>imgRef.current?.click()} style={{background:'rgba(24,16,27,.9)',border:'1px solid #2A1A2F',color:'#B8AAB8',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Trocar</button>
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

            <div style={{borderTop:'1px solid #2A1A2F',paddingTop:'18px',marginTop:'4px'}}>
              <p style={{fontSize:'13px',fontWeight:600,color:'#B8AAB8',marginBottom:'4px'}}>Cor de destaque</p>
              <p style={{fontSize:'12px',color:'#B8AAB8',marginBottom:'14px'}}>Escolha uma cor pronta para combinar com o estilo do seu negócio. Afeta apenas a página pública.</p>
              <div className="temas-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>
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

          <div style={{
            marginTop:32,
            background:`radial-gradient(circle at top right,${tc.bg},transparent 40%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(18,10,20,.99))`,
            border:`1px solid ${tc.border}`,
            borderRadius:20,
            padding:'24px 28px',
            transition:'border-color .3s, background .3s',
          }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap' as const,gap:10}}>
              <div>
                <h3 style={{fontSize:16,fontWeight:800,color:'#F8F4F7',marginBottom:4}}>Promoção em destaque</h3>
                <p style={{fontSize:13,color:'#B8AAB8'}}>Cadastre uma oferta para aparecer na sua página pública.</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:999,background:promoAtiva?'rgba(34,197,94,.14)':'#2A1A2F',color:promoAtiva?'#22C55E':'#B8AAB8',border:'1px solid '+(promoAtiva?'rgba(34,197,94,.25)':'#2A1A2F')}}>
                  {promoAtiva?'Ativa na página pública':'Oculta'}
                </span>
                <button type="button" onClick={()=>setPromoAtiva(a=>!a)} style={{background:promoAtiva?'rgba(34,197,94,.14)':'#2A1A2F',border:'1px solid '+(promoAtiva?'rgba(34,197,94,.25)':'#2A1A2F'),borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,color:promoAtiva?'#22C55E':'#B8AAB8',cursor:'pointer',fontFamily:'inherit'}}>
                  {promoAtiva?'Desativar':'Ativar promoção'}
                </button>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14,marginBottom:20}}>
              {([
                {lbl:'Título da promoção',val:promoTitulo,set:setPromoTitulo,ph:'Ex: Corte + Barba Especial'},
                {lbl:'Descrição curta',val:promoDesc,set:setPromoDesc,ph:'Ex: Oferta válida por tempo limitado'},
                {lbl:'Preço antigo (R$)',val:promoPrecoAnt,set:setPromoPrecoAnt,ph:'Ex: 80'},
                {lbl:'Preço promocional (R$)',val:promoPrecoNovo,set:setPromoPrecoNovo,ph:'Ex: 59.90'},
                {lbl:'Texto do botão',val:promoBotao,set:setPromoBotao,ph:'Agendar promoção'},
                {lbl:'Observação',val:promoObs,set:setPromoObs,ph:'Ex: Válido até domingo'},
              ] as any[]).map(({lbl,val,set,ph}:any)=>(
                <div key={lbl}>
                  <label style={{display:'block',fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:6}}>{lbl}</label>
                  <input type="text" value={val} onChange={(e:any)=>set(e.target.value)} placeholder={ph} style={{width:'100%',background:'rgba(24,16,27,.88)',border:`1px solid ${tc.border}`,borderRadius:10,padding:'10px 14px',fontSize:13,color:'#F8F4F7',fontFamily:'inherit',outline:'none',boxSizing:'border-box' as const,transition:'border-color .2s'}}
                    onFocus={e=>(e.target.style.borderColor=tc.accent)}
                    onBlur={e=>(e.target.style.borderColor=tc.border)}
                  />
                </div>
              ))}
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:6}}>Data início</label>
                <input type="date" value={promoInicio} onChange={(e:any)=>setPromoInicio(e.target.value)} style={{width:'100%',background:'rgba(24,16,27,.88)',border:`1px solid ${tc.border}`,borderRadius:10,padding:'10px 14px',fontSize:13,color:'#F8F4F7',fontFamily:'inherit',outline:'none',boxSizing:'border-box' as const,colorScheme:'dark' as const}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:6}}>Data fim</label>
                <input type="date" value={promoFim} onChange={(e:any)=>setPromoFim(e.target.value)} style={{width:'100%',background:'rgba(24,16,27,.88)',border:`1px solid ${tc.border}`,borderRadius:10,padding:'10px 14px',fontSize:13,color:'#F8F4F7',fontFamily:'inherit',outline:'none',boxSizing:'border-box' as const,colorScheme:'dark' as const}}/>
              </div>
            </div>

            {promoAtiva&&promoTitulo&&(
              <div>
                <p style={{fontSize:11,fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:12}}>Prévia na página pública</p>
                <div style={{
                  background:`radial-gradient(circle at top right,${tc.bg.replace(',.10)',', .22)')},transparent 35%),linear-gradient(135deg,rgba(15,23,42,.98),rgba(17,24,39,.96))`,
                  border:`1px solid ${tc.border}`,
                  borderRadius:18,
                  padding:'20px 24px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'space-between',
                  gap:20,
                  flexWrap:'wrap' as const,
                  transition:'all .3s',
                }}>
                  <div style={{flex:1,minWidth:200}}>
                    <p style={{fontSize:10,fontWeight:800,color:tc.accent,letterSpacing:'.12em',textTransform:'uppercase' as const,marginBottom:6}}>Oferta da semana</p>
                    <p style={{fontSize:20,fontWeight:900,color:'#F8F4F7',marginBottom:4}}>{promoTitulo}</p>
                    {promoDesc&&<p style={{fontSize:13,color:'#B8AAB8'}}>{promoDesc}</p>}
                    {promoObs&&<p style={{fontSize:12,color:'#B8AAB8',marginTop:6}}>{promoObs}</p>}
                  </div>
                  <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:8}}>
                    {promoPrecoAnt&&<p style={{fontSize:12,color:'#B8AAB8',textDecoration:'line-through',margin:0}}>De R$ {promoPrecoAnt}</p>}
                    {promoPrecoNovo&&<p style={{fontSize:24,fontWeight:900,color:tc.accent,margin:0}}>R$ {promoPrecoNovo}</p>}
                    <div style={{
                      background:`linear-gradient(135deg,${tc.primary},${tc.accent},${tc.secondary})`,
                      color:tc.btnText,
                      borderRadius:10,
                      padding:'9px 20px',
                      fontSize:13,
                      fontWeight:800,
                      cursor:'pointer',
                      boxShadow:`0 4px 20px ${tc.border}`,
                      whiteSpace:'nowrap' as const,
                    }}>{promoBotao||'Agendar promoção'} →</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button onClick={salvar} disabled={salvando} style={{width:'100%',marginTop:24,background:G,color:'#fff',border:'1px solid rgba(255,255,255,.12)',borderRadius:'14px',height:'52px',fontSize:'15px',fontWeight:800,cursor:salvando?'not-allowed':'pointer',fontFamily:'inherit',boxShadow:'0 12px 32px rgba(236,72,153,.30),0 0 28px rgba(139,92,246,.22)',opacity:salvando?.7:1,transition:'all .18s'}}>
            {salvando?'Salvando...':'Salvar perfil'}
          </button>

        </div></div>
      </div>
    </div>
  )
}
