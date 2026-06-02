'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { Sparkles, Home, Calendar, Users, ClipboardList, Wallet, CreditCard, User, BarChart3, Settings, Search, Plus, Pencil, Power, Trash2, Tag } from 'lucide-react'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'

const SB_LINKS=[
  {h:'/painel',l:'Início',I:Home},
  {h:'/painel/agendamentos',l:'Agenda',I:Calendar},
  {h:'/painel/clientes',l:'Clientes',I:Users},
  {h:'/painel/orcamentos',l:'Orçamentos',I:ClipboardList},
  {h:'/painel/cobrancas',l:'Cobranças',I:Wallet},
  {h:'/painel/pagamentos',l:'Pagamentos',I:CreditCard},
  {h:'/painel/servicos',l:'Serviços',I:Sparkles,on:true},
  {h:'/painel/profissionais',l:'Profissionais',I:User},
  {h:'/painel/relatorio',l:'Relatórios',I:BarChart3},
  {h:'/painel/perfil',l:'Configurações',I:Settings},
]

const FILTROS=['Todos','Ativos','Inativos','Barbearia / Salão','Estética','Clínica','Odontologia']
const CATEGORIAS=['Barbearia / Salão','Estética','Clínica','Odontologia','Outro']
const DURACOES=['15 min','30 min','45 min','1 hora','1h 30min','2 horas','Sem duração']

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
select option{background:#07111F;color:#F8FAFC}
.sb{width:220px;min-height:100vh;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);border-right:1px solid rgba(148,163,184,.14);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.sb-logo{padding:20px 16px 16px;border-bottom:1px solid rgba(148,163,184,.08);display:flex;align-items:center;gap:8px}
.sb-ic{width:28px;height:28px;border-radius:8px;background:${G};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 22px rgba(124,58,237,.48)}
.sb nav{flex:1;padding:10px 8px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:500;color:#94A3B8;transition:all .18s;border:1px solid transparent;white-space:nowrap}
.nl:hover{background:rgba(124,58,237,.10);color:#fff;border-color:rgba(124,58,237,.20)}
.nl.on{background:${G};color:#fff;font-weight:700;box-shadow:0 0 26px rgba(124,58,237,.34),inset 0 1px 0 rgba(255,255,255,.10);border-color:rgba(255,255,255,.10)}
.sb-foot{padding:10px;border-top:1px solid rgba(148,163,184,.08)}
.mob-hdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.94);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.1);position:sticky;top:0;z-index:20;width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.12)}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:220px;flex:1;min-height:100vh;width:calc(100% - 220px);max-width:calc(100% - 220px)}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1200px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:12px;height:44px;padding:0 20px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none;box-shadow:0 8px 24px rgba(59,130,246,.28),0 0 20px rgba(124,58,237,.22)}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(59,130,246,.36)}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;flex-shrink:0;transition:all .18s;font-family:inherit}
.pill:hover{background:rgba(124,58,237,.10);border-color:rgba(124,58,237,.28);color:#fff}
.pill.on{background:${G};border-color:transparent;color:#fff;box-shadow:0 0 16px rgba(124,58,237,.28)}
.inp{width:100%;background:rgba(15,23,42,.88);border:1.5px solid rgba(148,163,184,.18);border-radius:12px;padding:0 14px;height:46px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.12)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:6px}
.svc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
@media(max-width:1023px){
  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mob-hdr{display:flex!important}.bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .topo-r{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .topo-btns{display:flex!important;gap:8px!important}
  .svc-grid{grid-template-columns:1fr!important}
  .fg2{grid-template-columns:1fr!important}
  .fg3{grid-template-columns:1fr!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
`

type Servico={id:string;nome:string;descricao?:string;preco?:number;duracao?:string;categoria?:string;profissional_nome?:string;ativo:boolean}

export default function Servicos(){
  const [userId,setUserId]=useState('')
  const [perfil,setPerfil]=useState<any>(null)
  const [servicos,setServicos]=useState<Servico[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [busca,setBusca]=useState('')
  const [filtro,setFiltro]=useState('Todos')
  const [showForm,setShowForm]=useState(false)
  const [editId,setEditId]=useState<string|null>(null)
  const [msg,setMsg]=useState('')
  const [salvando,setSalvando]=useState(false)

  // Form
  const [fNome,setFNome]=useState('')
  const [fDesc,setFDesc]=useState('')
  const [fPreco,setFPreco]=useState('')
  const [fDur,setFDur]=useState('30 min')
  const [fCat,setFCat]=useState('Barbearia / Salão')
  const [fProf,setFProf]=useState('')

  useEffect(()=>{load()},[])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUserId(user.id)
    const [{data:p},{data:svs}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('servicos').select('*').eq('user_id',user.id).order('nome'),
    ])
    setPerfil(p);setServicos(svs||[]);setLoading(false)
  }

  function resetForm(){setFNome('');setFDesc('');setFPreco('');setFDur('30 min');setFCat('Barbearia / Salão');setFProf('');setEditId(null)}

  function abrirEditar(s:Servico){
    setEditId(s.id);setFNome(s.nome);setFDesc(s.descricao||'');setFPreco(s.preco?String(s.preco):'')
    setFDur(s.duracao||'30 min');setFCat(s.categoria||'Barbearia / Salão');setFProf(s.profissional_nome||'')
    setShowForm(true);window.scrollTo({top:0,behavior:'smooth'})
  }

  async function salvar(){
    if(!fNome.trim()){setMsg('Informe o nome do serviço.');return}
    setSalvando(true)
    const payload={user_id:userId,nome:fNome.trim(),descricao:fDesc.trim()||null,preco:parseFloat(fPreco.replace(',','.'))||null,duracao:fDur,categoria:fCat,profissional_nome:fProf.trim()||null,ativo:true}
    if(editId){await supabase.from('servicos').update(payload).eq('id',editId)}
    else{await supabase.from('servicos').insert(payload)}
    resetForm();setShowForm(false);setSalvando(false);setMsg(editId?'Serviço atualizado!':'Serviço cadastrado!');setTimeout(()=>setMsg(''),3000);await load()
  }

  async function toggleAtivo(s:Servico){
    await supabase.from('servicos').update({ativo:!s.ativo}).eq('id',s.id);await load()
  }

  async function excluir(id:string){
    if(!confirm('Excluir este serviço?'))return
    await supabase.from('servicos').delete().eq('id',id);await load()
  }

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'S').charAt(0).toUpperCase()
  const fBRL=(v:number)=>`R$ ${(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`

  const ativos=servicos.filter(s=>s.ativo).length
  const cats=new Set(servicos.filter(s=>s.categoria).map(s=>s.categoria)).size
  const comPreco=servicos.filter(s=>s.preco&&s.preco>0)
  const ticketMedio=comPreco.length>0?comPreco.reduce((a,s)=>a+(s.preco||0),0)/comPreco.length:0

  const filtrados=servicos.filter(s=>{
    const passaF=filtro==='Todos'||(filtro==='Ativos'&&s.ativo)||(filtro==='Inativos'&&!s.ativo)||s.categoria===filtro
    const passaB=!busca||[s.nome,s.descricao,s.categoria,s.profissional_nome].some(v=>v?.toLowerCase().includes(busca.toLowerCase()))
    return passaF&&passaB
  })

  const SidebarComp=()=>(
    <aside className="sb">
      <div className="sb-logo"><div className="sb-ic"><Calendar size={14} color="#fff"/></div><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span></div>
      <nav>{SB_LINKS.map(it=>(<Link key={it.l} href={it.h} prefetch={false} className={'nl'+(it.on?' on':'')}><it.I size={16}/><span>{it.l}</span></Link>))}</nav>
      <div className="sb-foot"><div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div><div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div></div></div>
    </aside>
  )

  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)

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
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Serviços</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">
          <AvisoAtraso/>

          {msg&&<div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'rgba(124,58,237,.18)',border:'1px solid rgba(124,58,237,.36)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#C4B5FD',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{msg}</div>}

          {/* Header */}
          <div className="topo-r" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Serviços / Procedimentos</h1>
              <p style={{fontSize:'13px',color:'#64748B'}}>Cadastre serviços, procedimentos, valores, duração e profissionais responsáveis.</p>
            </div>
            <div className="topo-btns" style={{flexShrink:0}}>
              <button onClick={()=>{resetForm();setShowForm(!showForm)}} className="btn-p"><Plus size={15}/>Novo serviço</button>
            </div>
          </div>

          {/* Form */}
          {showForm&&(
            <div className="crd" style={{padding:'24px',marginBottom:'20px',border:'1.5px solid rgba(124,58,237,.28)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'18px'}}>
                <p style={{fontSize:'15px',fontWeight:700,color:'#C4B5FD'}}>{editId?'Editar serviço':'Novo serviço'}</p>
                <button onClick={()=>{resetForm();setShowForm(false)}} style={{background:'none',border:'none',color:'#64748B',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button>
              </div>
              <div className="fg2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
                <div><label className="lbl">Nome do serviço *</label><input className="inp" type="text" placeholder="Ex: Corte masculino, Canal, Limpeza de pele..." value={fNome} onChange={e=>setFNome(e.target.value)}/></div>
                <div><label className="lbl">Valor (R$)</label><div style={{position:'relative'}}><span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600}}>R$</span><input className="inp" type="text" inputMode="decimal" placeholder="0,00" value={fPreco} onChange={e=>setFPreco(e.target.value)} style={{paddingLeft:'36px'}}/></div></div>
              </div>
              <div className="fg3" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'14px',marginBottom:'14px'}}>
                <div><label className="lbl">Duração</label><select className="inp" style={{cursor:'pointer'}} value={fDur} onChange={e=>setFDur(e.target.value)}>{DURACOES.map(d=><option key={d}>{d}</option>)}</select></div>
                <div><label className="lbl">Categoria</label><select className="inp" style={{cursor:'pointer'}} value={fCat} onChange={e=>setFCat(e.target.value)}>{CATEGORIAS.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><label className="lbl">Profissional responsável</label><input className="inp" type="text" placeholder="Nome ou 'Todos'" value={fProf} onChange={e=>setFProf(e.target.value)}/></div>
              </div>
              <div style={{marginBottom:'16px'}}><label className="lbl">Descrição (opcional)</label><input className="inp" type="text" placeholder="Detalhes extras sobre o serviço ou procedimento..." value={fDesc} onChange={e=>setFDesc(e.target.value)}/></div>
              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={salvar} disabled={salvando} className="btn-p" style={{opacity:salvando?.7:1}}>{salvando?'Salvando...':'Salvar serviço'}</button>
                <button onClick={()=>{resetForm();setShowForm(false)}} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.20)',borderRadius:'10px',height:'44px',padding:'0 16px',fontSize:'13px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {l:'TOTAL CADASTRADO',sub:'Serviços e procedimentos',v:servicos.length,fmt:'n',c:'#F472B6',bg:'rgba(236,72,153,.10)',bd:'rgba(236,72,153,.28)',I:Sparkles},
              {l:'SERVIÇOS ATIVOS',sub:'Disponíveis para agendamento',v:ativos,fmt:'n',c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.28)',I:Tag},
              {l:'CATEGORIAS',sub:'Tipos de serviço',v:cats||0,fmt:'n',c:'#22D3EE',bg:'rgba(6,182,212,.10)',bd:'rgba(6,182,212,.28)',I:Tag},
              {l:'VALOR MÉDIO',sub:comPreco.length>0?'Média dos serviços com preço':'Sem valores cadastrados',v:ticketMedio,fmt:'brl',c:'#FBBF24',bg:'rgba(245,158,11,.10)',bd:'rgba(245,158,11,.28)',I:Tag},
            ].map(k=>(
              <div key={k.l} className="crd" style={{padding:'18px 16px',background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'10px'}}><k.I size={18} color={k.c}/></div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'3px'}}>{k.l}</p>
                <p style={{fontSize:'11px',color:'#64748B',marginBottom:'6px'}}>{k.sub}</p>
                <p style={{fontSize:'24px',fontWeight:800,color:k.c,lineHeight:1}}>{k.fmt==='brl'?fBRL(k.v as number):k.v}</p>
              </div>
            ))}
          </div>

          {/* Busca */}
          <div style={{position:'relative',marginBottom:'12px'}}>
            <Search size={15} color="#64748B" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
            <input type="text" placeholder="Buscar serviço, procedimento, categoria ou profissional..." value={busca} onChange={e=>setBusca(e.target.value)}
              style={{width:'100%',background:'rgba(15,23,42,.88)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'12px',padding:'11px 16px 11px 42px',fontSize:'13px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
          </div>

          {/* Filtros */}
          <div style={{display:'flex',gap:'6px',overflowX:'auto',scrollbarWidth:'none',paddingBottom:'4px',marginBottom:'20px'}}>
            {FILTROS.map(f=>(<button key={f} onClick={()=>setFiltro(f)} className={`pill${filtro===f?' on':''}`}>{f}</button>))}
          </div>

          {/* Lista */}
          {filtrados.length===0?(
            <div className="crd" style={{padding:'56px 24px',textAlign:'center'}}>
              <div style={{width:'60px',height:'60px',borderRadius:'18px',background:'rgba(236,72,153,.12)',border:'1px solid rgba(236,72,153,.28)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',boxShadow:'0 0 24px rgba(236,72,153,.14)'}}><Sparkles size={26} color="#F472B6"/></div>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>Nenhum serviço cadastrado</p>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.6,marginBottom:'24px',maxWidth:'380px',margin:'0 auto 24px'}}>Cadastre serviços ou procedimentos para começar a organizar sua agenda e seus orçamentos.</p>
              <button onClick={()=>{resetForm();setShowForm(true)}} className="btn-p" style={{display:'inline-flex'}}><Plus size={15}/>Novo serviço</button>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {filtrados.map(s=>{
                const durRaw=s.duracao?String(s.duracao).trim():null;const durLabel=durRaw?(/^\d+$/.test(durRaw)?`${durRaw} min`:durRaw):null
                const infoItems=[durLabel,s.categoria,s.profissional_nome||'Todos os profissionais'].filter(Boolean)
                return(
                  <div key={s.id} className="crd" style={{padding:'18px 20px',width:'100%',boxSizing:'border-box' as const,background:s.ativo?'radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))':'linear-gradient(145deg,rgba(10,18,30,.98),rgba(6,14,24,.99))',border:`1.5px solid ${s.ativo?'rgba(148,163,184,.18)':'rgba(148,163,184,.10)'}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap' as const}}>
                      <div style={{display:'flex',alignItems:'center',gap:'12px',flex:1,minWidth:0}}>
                        <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'rgba(236,72,153,.14)',border:'1px solid rgba(236,72,153,.22)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Sparkles size={20} color="#F472B6"/></div>
                        <div style={{minWidth:0,flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px',flexWrap:'wrap' as const}}>
                            <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>{s.nome}</p>
                            {s.preco&&s.preco>0&&<span style={{fontSize:'13px',fontWeight:800,color:'#4ADE80'}}>{fBRL(s.preco)}</span>}
                          </div>
                          <div style={{display:'flex',flexWrap:'wrap' as const,gap:'5px'}}>
                            {infoItems.map((item,i)=>(<span key={i} style={{fontSize:'11px',color:'#94A3B8',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'6px',padding:'2px 8px'}}>{item}</span>))}
                            {s.descricao&&<span style={{fontSize:'11px',color:'#64748B',fontStyle:'italic'}}>{s.descricao}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0,flexWrap:'wrap' as const}}>
                        <span style={{fontSize:'11px',fontWeight:700,padding:'4px 12px',borderRadius:'999px',background:s.ativo?'rgba(34,197,94,.14)':'rgba(148,163,184,.10)',color:s.ativo?'#4ADE80':'#94A3B8',border:`1px solid ${s.ativo?'rgba(34,197,94,.28)':'rgba(148,163,184,.16)'}`,whiteSpace:'nowrap'}}>{s.ativo?'Ativo':'Inativo'}</span>
                        <button onClick={()=>abrirEditar(s)} style={{height:'36px',padding:'0 14px',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.28)',borderRadius:'8px',fontSize:'12px',fontWeight:600,color:'#60A5FA',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px',whiteSpace:'nowrap',transition:'all .18s'}} onMouseEnter={e=>(e.currentTarget.style.background='rgba(59,130,246,.22)')} onMouseLeave={e=>(e.currentTarget.style.background='rgba(59,130,246,.12)')}><Pencil size={13}/>Editar</button>
                        <button onClick={()=>toggleAtivo(s)} style={{height:'36px',padding:'0 14px',background:s.ativo?'rgba(245,158,11,.12)':'rgba(34,197,94,.12)',border:`1px solid ${s.ativo?'rgba(245,158,11,.28)':'rgba(34,197,94,.28)'}`,borderRadius:'8px',fontSize:'12px',fontWeight:600,color:s.ativo?'#FBBF24':'#4ADE80',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px',whiteSpace:'nowrap',transition:'all .18s'}}><Power size={13}/>{s.ativo?'Desativar':'Ativar'}</button>
                        <button onClick={()=>excluir(s.id)} style={{width:'36px',height:'36px',background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.24)',borderRadius:'8px',color:'#F87171',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .18s'}} onMouseEnter={e=>(e.currentTarget.style.background='rgba(239,68,68,.20)')} onMouseLeave={e=>(e.currentTarget.style.background='rgba(239,68,68,.10)')}><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div></div>
      </div>
    </div>
  )
}
