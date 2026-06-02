'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { CheckCircle2, CalendarDays, CircleDollarSign, TrendingUp, Search, Home, Calendar, Users, ClipboardList, Wallet, CreditCard, Sparkles, User, BarChart3, Settings } from 'lucide-react'
import PlanoBloqueado from '@/components/PlanoBloqueado'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'

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
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:12px;height:44px;padding:0 20px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-p:hover{transform:translateY(-1px)}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:10px;height:42px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-s:hover{border-color:rgba(124,58,237,.38);color:#fff}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;flex-shrink:0;transition:all .18s;font-family:inherit}
.pill:hover{background:rgba(124,58,237,.10);border-color:rgba(124,58,237,.28);color:#fff}
.pill.on{background:${G};border-color:transparent;color:#fff;box-shadow:0 0 16px rgba(124,58,237,.28)}
.inp{width:100%;background:rgba(15,23,42,.88);border:1.5px solid rgba(148,163,184,.18);border-radius:12px;padding:0 14px;height:46px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.55)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:6px}
@media(max-width:1023px){
  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mob-hdr{display:flex!important}.bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .topo-r{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .topo-btns{display:flex!important;gap:8px!important}
  .topo-btns a,.topo-btns button{flex:1!important;justify-content:center!important}
  .fg3{grid-template-columns:1fr!important}
  .fg2{grid-template-columns:1fr!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
`

const SB_LINKS=[
  {h:'/painel',l:'Início',I:Home},
  {h:'/painel/agendamentos',l:'Agenda',I:Calendar},
  {h:'/painel/clientes',l:'Clientes',I:Users},
  {h:'/painel/orcamentos',l:'Orçamentos',I:ClipboardList},
  {h:'/painel/cobrancas',l:'Cobranças',I:Wallet},
  {h:'/painel/pagamentos',l:'Pagamentos',I:CreditCard,on:true},
  {h:'/painel/servicos',l:'Serviços',I:Sparkles},
  {h:'/painel/profissionais',l:'Profissionais',I:User},
  {h:'/painel/relatorio',l:'Relatórios',I:BarChart3},
  {h:'/painel/perfil',l:'Configurações',I:Settings},
]

const FILTROS=['Todos','Hoje','Este mês','Pix','Cartão','Dinheiro','Parcial','Completo']
const FORMAS=['Pix','Dinheiro','Cartão de débito','Cartão de crédito','Transferência','Outro']

export default function Pagamentos(){
  const [perfil,setPerfil]=useState<any>(null)
  const [pagamentos,setPagamentos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [busca,setBusca]=useState('')
  const [filtro,setFiltro]=useState('Todos')
  const [showForm,setShowForm]=useState(false)
  const [fCliente,setFCliente]=useState('')
  const [fValor,setFValor]=useState('')
  const [fForma,setFForma]=useState('Pix')
  const [fTipo,setFTipo]=useState('completo')
  const [fRef,setFRef]=useState('')
  const [salvando,setSalvando]=useState(false)
  const [msg,setMsg]=useState('')

  useEffect(()=>{load()},[])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:pags}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('pagamentos').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
    ])
    setPerfil(p);setPagamentos(pags||[]);setLoading(false)
  }

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'P').charAt(0).toUpperCase()
  const hoje=new Date().toISOString().split('T')[0]
  const mes=new Date().toISOString().slice(0,7)
  const fBRL=(v:number)=>`R$ ${(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
  const fData=(d:string)=>{if(!d)return'';const[a,m,di]=d.split('-');return`${di}/${m}/${a}`}

  const recMes=pagamentos.filter(p=>p.data?.startsWith(mes)).reduce((a,p)=>a+(p.valor||0),0)
  const recHoje=pagamentos.filter(p=>p.data===hoje).reduce((a,p)=>a+(p.valor||0),0)
  const parciais=pagamentos.filter(p=>p.tipo==='parcial').length
  const ticket=pagamentos.length>0?pagamentos.reduce((a,p)=>a+(p.valor||0),0)/pagamentos.length:0

  const filtrados=pagamentos.filter(p=>{
    const passaF=
      filtro==='Todos'||
      (filtro==='Hoje'&&p.data===hoje)||
      (filtro==='Este mês'&&p.data?.startsWith(mes))||
      (filtro==='Pix'&&p.forma==='Pix')||
      (filtro==='Cartão'&&p.forma?.toLowerCase().includes('cart'))||
      (filtro==='Dinheiro'&&p.forma==='Dinheiro')||
      (filtro==='Parcial'&&p.tipo==='parcial')||
      (filtro==='Completo'&&p.tipo==='completo')
    const passaB=!busca||[p.cliente_nome,p.forma,p.referencia].some((v:string)=>v?.toLowerCase().includes(busca.toLowerCase()))
    return passaF&&passaB
  })

  async function registrar(){
    if(!fCliente.trim()||!fValor){setMsg('Informe o cliente e o valor.');return}
    setSalvando(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSalvando(false);return}
    await supabase.from('pagamentos').insert({
      user_id:user.id,cliente_nome:fCliente.trim(),
      valor:parseFloat(fValor.replace(',','.'))||0,
      forma:fForma,tipo:fTipo,
      referencia:fRef.trim()||null,
      data:hoje,status:'confirmado'
    })
    setFCliente('');setFValor('');setFForma('Pix');setFTipo('completo');setFRef('')
    setShowForm(false);setMsg('Pagamento registrado com sucesso!')
    setTimeout(()=>setMsg(''),3000);setSalvando(false);await load()
  }

  const SidebarComp=()=>(
    <aside className="sb">
      <div className="sb-logo">
        <div className="sb-ic"><Calendar size={14} color="#fff"/></div>
        <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
      </div>
      <nav>{SB_LINKS.map(it=>(<Link key={it.l} href={it.h} prefetch={false} className={'nl'+(it.on?' on':'')}><it.I size={16}/><span>{it.l}</span></Link>))}</nav>
      <div className="sb-foot">
        <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
          <div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div>
        </div>
      </div>
    </aside>
  )if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)

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
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Pagamentos</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">
                    

          {msg&&<div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'rgba(34,197,94,.16)',border:'1px solid rgba(34,197,94,.36)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#4ADE80',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{msg}</div>}

          {/* Header */}
          <div className="topo-r" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'8px'}}>
            <div>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Pagamentos</h1>
              <p style={{fontSize:'13px',color:'#64748B'}}>Histórico de valores recebidos e pagamentos confirmados.</p>
            </div>
            <div className="topo-btns" style={{display:'flex',gap:'8px',flexShrink:0}}>
              <button onClick={()=>setShowForm(!showForm)} className="btn-p">+ Registrar recebimento</button>
              <Link href="/painel/cobrancas" prefetch={false} className="btn-s">Ver cobranças</Link>
            </div>
          </div>

          {/* Badge conceito */}
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'22px',padding:'8px 14px',background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.18)',borderRadius:'10px',width:'fit-content'}}>
            <CheckCircle2 size={14} color="#4ADE80"/>
            <p style={{fontSize:'12px',color:'#4ADE80',fontWeight:600}}>Esta página mostra o dinheiro que <strong>já entrou</strong> no caixa</p>
          </div>

          {/* Form registrar */}
          {showForm&&(
            <div className="crd" style={{padding:'22px',marginBottom:'20px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#4ADE80'}}>Registrar recebimento</p>
                <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#64748B',cursor:'pointer',fontSize:'20px',lineHeight:1,fontFamily:'inherit'}}>×</button>
              </div>
              <div className="fg3" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                <div><label className="lbl">Cliente *</label><input className="inp" type="text" placeholder="Nome do cliente" value={fCliente} onChange={e=>setFCliente(e.target.value)}/></div>
                <div><label className="lbl">Valor recebido *</label><div style={{position:'relative'}}><span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600}}>R$</span><input className="inp" type="text" inputMode="decimal" placeholder="0,00" value={fValor} onChange={e=>setFValor(e.target.value)} style={{paddingLeft:'36px'}}/></div></div>
                <div><label className="lbl">Forma de pagamento</label><select className="inp" style={{cursor:'pointer'}} value={fForma} onChange={e=>setFForma(e.target.value)}>{FORMAS.map(f=><option key={f}>{f}</option>)}</select></div>
              </div>
              <div className="fg2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                <div><label className="lbl">Tipo de recebimento</label><select className="inp" style={{cursor:'pointer'}} value={fTipo} onChange={e=>setFTipo(e.target.value)}><option value="completo">Completo — valor total recebido</option><option value="parcial">Parcial — parte do valor</option></select></div>
                <div><label className="lbl">Referência (opcional)</label><input className="inp" type="text" placeholder="Ex: orçamento #123, consulta do dia..." value={fRef} onChange={e=>setFRef(e.target.value)}/></div>
              </div>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                <button onClick={registrar} disabled={salvando} className="btn-p" style={{opacity:salvando?.7:1,background:'linear-gradient(135deg,#16A34A,#059669)'}}>{salvando?'Registrando...':'✓ Confirmar recebimento'}</button>
                <button onClick={()=>setShowForm(false)} className="btn-s">Cancelar</button>
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {l:'RECEBIDO NO MÊS',sub:'Total confirmado',v:fBRL(recMes),c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.28)',I:CheckCircle2},
              {l:'RECEBIDO HOJE',sub:'Entradas do dia',v:fBRL(recHoje),c:'#60A5FA',bg:'rgba(59,130,246,.10)',bd:'rgba(59,130,246,.28)',I:CalendarDays},
              {l:'PAGAMENTOS PARCIAIS',sub:'Recebimentos incompletos',v:parciais,c:'#C4B5FD',bg:'rgba(124,58,237,.10)',bd:'rgba(124,58,237,.28)',I:CircleDollarSign},
              {l:'TICKET MÉDIO',sub:'Média por pagamento',v:fBRL(ticket),c:'#22D3EE',bg:'rgba(6,182,212,.10)',bd:'rgba(6,182,212,.28)',I:TrendingUp},
            ].map(k=>(
              <div key={k.l} className="crd" style={{padding:'18px 16px',background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'10px'}}><k.I size={18} color={k.c}/></div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'3px'}}>{k.l}</p>
                <p style={{fontSize:'11px',color:'#64748B',marginBottom:'6px'}}>{k.sub}</p>
                <p style={{fontSize:'22px',fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* Busca */}
          <div style={{position:'relative',marginBottom:'12px'}}>
            <Search size={15} color="#64748B" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
            <input type="text" placeholder="Buscar pagamento, cliente, forma ou referência..." value={busca} onChange={e=>setBusca(e.target.value)}
              style={{width:'100%',background:'rgba(15,23,42,.88)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'12px',padding:'11px 16px 11px 42px',fontSize:'13px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
          </div>

          {/* Filtros */}
          <div style={{display:'flex',gap:'6px',overflowX:'auto',scrollbarWidth:'none',paddingBottom:'4px',marginBottom:'20px'}}>
            {FILTROS.map(f=>(<button key={f} onClick={()=>setFiltro(f)} className={`pill${filtro===f?' on':''}`}>{f}</button>))}
          </div>

          {/* Lista */}
          {filtrados.length===0?(
            <div className="crd" style={{padding:'56px 24px',textAlign:'center'}}>
              <div style={{width:'60px',height:'60px',borderRadius:'18px',background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.28)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',boxShadow:'0 0 24px rgba(34,197,94,.14)'}}><CircleDollarSign size={26} color="#4ADE80"/></div>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>Nenhum pagamento registrado</p>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.6,marginBottom:'6px',maxWidth:'380px',margin:'0 auto 6px'}}>Quando um recebimento for confirmado, ele aparecerá aqui no histórico.</p>
              <p style={{fontSize:'12px',color:'#475569',marginBottom:'24px'}}>Você também pode registrar pagamentos diretamente em uma cobrança.</p>
              <div style={{display:'flex',gap:'10px',justifyContent:'center',flexWrap:'wrap'}}>
                <button onClick={()=>setShowForm(true)} className="btn-p" style={{background:'linear-gradient(135deg,#16A34A,#059669)'}}>+ Registrar recebimento</button>
                <Link href="/painel/cobrancas" prefetch={false} className="btn-s">Ver cobranças</Link>
              </div>
            </div>
          ):(
            <>
              {/* Resumo do total filtrado */}
              {filtrados.length>0&&(
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.18)',borderRadius:'12px',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
                  <p style={{fontSize:'12px',color:'#64748B'}}>{filtrados.length} pagamento{filtrados.length!==1?'s':''} encontrado{filtrados.length!==1?'s':''}</p>
                  <p style={{fontSize:'15px',fontWeight:800,color:'#4ADE80'}}>Total: {fBRL(filtrados.reduce((a,p)=>a+(p.valor||0),0))}</p>
                </div>
              )}
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {filtrados.map(p=>{
                  const isParcial=p.tipo==='parcial'
                  return(
                    <div key={p.id} className="crd" style={{padding:'16px 20px'}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',flexWrap:'wrap'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>{p.cliente_nome}</p>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                            <span style={{fontSize:'12px',color:'#64748B'}}>{p.forma}</span>
                            {p.data&&<><span style={{fontSize:'10px',color:'#374151'}}>·</span><span style={{fontSize:'12px',color:'#64748B'}}>{fData(p.data)}</span></>}
                            {p.referencia&&<><span style={{fontSize:'10px',color:'#374151'}}>·</span><span style={{fontSize:'12px',color:'#94A3B8',fontStyle:'italic'}}>{p.referencia}</span></>}
                          </div>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'6px',flexShrink:0}}>
                          <p style={{fontSize:'20px',fontWeight:800,color:'#4ADE80',lineHeight:1}}>{fBRL(p.valor)}</p>
                          <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'999px',background:isParcial?'rgba(124,58,237,.14)':'rgba(34,197,94,.14)',color:isParcial?'#C4B5FD':'#4ADE80',border:`1px solid ${isParcial?'rgba(124,58,237,.28)':'rgba(34,197,94,.28)'}`}}>
                            {isParcial?'Parcial':'Recebido'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

        </div></div>
      </div>
    </div>
  )
}