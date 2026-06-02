'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { CreditCard, AlertTriangle, Hourglass, CircleDollarSign, Search, Home, Calendar, Users, ClipboardList, Wallet, Sparkles, User, BarChart3, Settings } from 'lucide-react'
import PlanoBloqueado from '@/components/PlanoBloqueado'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
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
@media(max-width:1023px){
  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mob-hdr{display:flex!important}.bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .topo-r{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .topo-btns{flex-direction:row!important;gap:8px!important}
  .topo-btns a,.topo-btns button{flex:1!important;justify-content:center!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
`

const SB_LINKS=[
  {h:'/painel',l:'Início',I:Home},
  {h:'/painel/agendamentos',l:'Agenda',I:Calendar},
  {h:'/painel/clientes',l:'Clientes',I:Users},
  {h:'/painel/orcamentos',l:'Orçamentos',I:ClipboardList},
  {h:'/painel/cobrancas',l:'Cobranças',I:Wallet,on:true},
  {h:'/painel/pagamentos',l:'Pagamentos',I:CreditCard},
  {h:'/painel/servicos',l:'Serviços',I:Sparkles},
  {h:'/painel/profissionais',l:'Profissionais',I:User},
  {h:'/painel/relatorio',l:'Relatórios',I:BarChart3},
  {h:'/painel/perfil',l:'Configurações',I:Settings},
]

const FILTROS=['Todas','Em aberto','Vencidas','Parciais','Pagas','Canceladas']

export default function Cobrancas(){
  const [perfil,setPerfil]=useState<any>(null)
  const [cobrancas,setCobrancas]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [busca,setBusca]=useState('')
  const [filtro,setFiltro]=useState('Todas')

  useEffect(()=>{load()},[])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:orcs}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('orcamentos').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
    ])
    setPerfil(p)
    setCobrancas(orcs||[])
    setLoading(false)
  }

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'C').charAt(0).toUpperCase()

  const aReceber=cobrancas.filter(o=>!['Pago','Finalizado','Cancelado'].includes(o.status)).reduce((a,o)=>a+(o.saldo_restante||0),0)
  const vencidas=cobrancas.filter(o=>o.vencimento&&new Date(o.vencimento)<new Date()&&!['Pago','Finalizado','Cancelado'].includes(o.status)).length
  const parciais=cobrancas.filter(o=>o.status==='Parcialmente pago').length
  const emAberto=cobrancas.filter(o=>o.status==='Aberto').length

  const fBRL=(v:number)=>`R$ ${(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
  const fData=(d:string)=>{if(!d)return'';const[a,m,di]=d.split('-');return`${di}/${m}/${a}`}

  const filtradas=cobrancas.filter(o=>{
    const passaF=filtro==='Todas'||(filtro==='Em aberto'&&o.status==='Aberto')||(filtro==='Vencidas'&&o.vencimento&&new Date(o.vencimento)<new Date()&&!['Pago','Finalizado','Cancelado'].includes(o.status))||(filtro==='Parciais'&&o.status==='Parcialmente pago')||(filtro==='Pagas'&&(o.status==='Pago'||o.status==='Finalizado'))||(filtro==='Canceladas'&&o.status==='Cancelado')
    const passaB=!busca||[o.cliente_nome,o.cliente_whatsapp,o.tipo].some((v:string)=>v?.toLowerCase().includes(busca.toLowerCase()))
    return passaF&&passaB
  })

  function enviarWpp(orc:any){
    const tel=(orc.cliente_whatsapp||'').replace(/\D/g,'')
    if(!tel)return
    const msg=`Olá, ${orc.cliente_nome}!\n\nVocê tem um saldo pendente de ${fBRL(orc.saldo_restante)} referente a ${orc.tipo}.\n\nPor favor, entre em contato para regularizar. Obrigado!`
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`,'_blank')
  }

  const SidebarComp=()=>(
    <aside className="sb">
      <div className="sb-logo">
        <div className="sb-ic"><Calendar size={14} color="#fff"/></div>
        <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
      </div>
      <nav>{SB_LINKS.map(it=>(<Link key={it.l} href={it.h} className={'nl'+(it.on?' on':'')}><it.I size={16}/><span>{it.l}</span></Link>))}</nav>
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
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{SB_LINKS.map(it=>(<Link key={it.l} href={it.h} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}><it.I size={16}/><span>{it.l}</span></Link>))}</nav>
      </div>
      <SidebarComp/>
      <div className="main">
        <div className="mob-hdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>{[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:`${w}px`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}</button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Cobranças</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">
                              

          {/* Header */}
          <div className="topo-r" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Cobranças</h1>
              <p style={{fontSize:'13px',color:'#64748B'}}>Veja quem ainda precisa pagar e envie cobranças com rapidez.</p>
            </div>
            <div className="topo-btns" style={{display:'flex',gap:'8px',flexShrink:0}}>
              <Link href="/painel/orcamentos/novo" className="btn-p">+ Nova cobrança</Link>
              <Link href="/painel/orcamentos" className="btn-s">Ver orçamentos</Link>
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {l:'A RECEBER',sub:'Total em aberto',v:fBRL(aReceber),c:'#FBBF24',bg:'rgba(245,158,11,.10)',bd:'rgba(245,158,11,.28)',I:CreditCard},
              {l:'VENCIDAS',sub:'Cobranças em atraso',v:vencidas,c:'#F87171',bg:'rgba(239,68,68,.10)',bd:'rgba(239,68,68,.28)',I:AlertTriangle},
              {l:'PARCIAIS',sub:'Pagas em parte',v:parciais,c:'#C4B5FD',bg:'rgba(124,58,237,.10)',bd:'rgba(124,58,237,.28)',I:CircleDollarSign},
              {l:'EM ABERTO',sub:'Aguardando pagamento',v:emAberto,c:'#22D3EE',bg:'rgba(6,182,212,.10)',bd:'rgba(6,182,212,.28)',I:Hourglass},
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
            <input type="text" placeholder="Buscar cliente, serviço, WhatsApp ou cobrança..." value={busca} onChange={e=>setBusca(e.target.value)}
              style={{width:'100%',background:'rgba(15,23,42,.88)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'12px',padding:'11px 16px 11px 42px',fontSize:'13px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
          </div>

          {/* Filtros */}
          <div style={{display:'flex',gap:'6px',overflowX:'auto',scrollbarWidth:'none',paddingBottom:'4px',marginBottom:'20px'}}>
            {FILTROS.map(f=>(<button key={f} onClick={()=>setFiltro(f)} className={`pill${filtro===f?' on':''}`}>{f}</button>))}
          </div>

          {/* Lista */}
          {filtradas.length===0?(
            <div className="crd" style={{padding:'56px 24px',textAlign:'center'}}>
              <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'rgba(59,130,246,.14)',border:'1px solid rgba(59,130,246,.28)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}><CreditCard size={24} color="#60A5FA"/></div>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>Nenhuma cobrança em aberto</p>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.6,marginBottom:'6px'}}>Quando houver orçamento pendente, cobrança vencida ou saldo restante, tudo aparecerá aqui.</p>
              <p style={{fontSize:'12px',color:'#475569',marginBottom:'20px'}}>Você também pode gerar cobranças a partir de um orçamento.</p>
              <Link href="/painel/orcamentos/novo" className="btn-p" style={{display:'inline-flex'}}>+ Nova cobrança</Link>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {filtradas.map(orc=>{
                const saldoC=orc.saldo_restante>0?'#FBBF24':'#4ADE80'
                const statusC=orc.status==='Pago'||orc.status==='Finalizado'?{bg:'rgba(34,197,94,.14)',c:'#4ADE80',bd:'rgba(34,197,94,.28)'}:orc.status==='Parcialmente pago'?{bg:'rgba(124,58,237,.14)',c:'#C4B5FD',bd:'rgba(124,58,237,.28)'}:orc.status==='Cancelado'?{bg:'rgba(239,68,68,.14)',c:'#F87171',bd:'rgba(239,68,68,.28)'}:{bg:'rgba(245,158,11,.14)',c:'#FBBF24',bd:'rgba(245,158,11,.28)'}
                return(
                  <div key={orc.id} className="crd" style={{padding:'18px 20px'}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px',marginBottom:'14px',flexWrap:'wrap'}}>
                      <div>
                        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'3px'}}>{orc.cliente_nome}</p>
                        <p style={{fontSize:'12px',color:'#64748B'}}>{orc.tipo} · {fData(orc.data)}{orc.cliente_whatsapp&&` · ${orc.cliente_whatsapp}`}</p>
                      </div>
                      <span style={{fontSize:'11px',fontWeight:700,padding:'4px 12px',borderRadius:'999px',background:statusC.bg,color:statusC.c,border:`1px solid ${statusC.bd}`,flexShrink:0,whiteSpace:'nowrap'}}>{orc.status}</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'14px'}}>
                      {[{l:'Total',v:fBRL(orc.total),c:'#F8FAFC'},{l:'Pago',v:fBRL(orc.valor_pago),c:'#4ADE80'},{l:'Saldo',v:fBRL(orc.saldo_restante),c:saldoC}].map(f=>(
                        <div key={f.l} style={{background:'rgba(255,255,255,.04)',borderRadius:'10px',padding:'10px 12px',border:'1px solid rgba(255,255,255,.07)'}}>
                          <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'3px'}}>{f.l}</p>
                          <p style={{fontSize:'14px',fontWeight:800,color:f.c}}>{f.v}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                      {orc.cliente_whatsapp&&<button onClick={()=>enviarWpp(orc)} style={{flex:1,minWidth:'100px',background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.28)',borderRadius:'8px',height:'38px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'}}>💬 Cobrar no WhatsApp</button>}
                      <Link href="/painel/orcamentos" style={{flex:1,minWidth:'100px',background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.20)',borderRadius:'8px',height:'38px',fontSize:'12px',fontWeight:600,color:'#CBD5E1',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',textDecoration:'none'}}>Ver detalhes</Link>
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
