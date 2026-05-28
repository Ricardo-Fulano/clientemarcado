'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'
const SB=[
  {h:'/painel',l:'Início'},{h:'/painel/agendamentos',l:'Agenda'},
  {h:'/painel/clientes',l:'Clientes'},{h:'/painel/orcamentos',l:'Orçamentos'},
  {h:'/painel/cobrancas',l:'Cobranças'},{h:'/painel/pagamentos',l:'Pagamentos',on:true},
  {h:'/painel/servicos',l:'Serviços'},{h:'/painel/profissionais',l:'Profissionais'},
  {h:'/painel/relatorio',l:'Relatórios'},{h:'/painel/perfil',l:'Configurações'},
]
const fBRL=(v:number)=>`R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2})}`
const FORMAS=['Pix','Cartão de crédito','Cartão de débito','Dinheiro','Transferência','Boleto','Link de pagamento','Outro']
const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
select option{background:#07111F;color:#F8FAFC}
.sb{width:240px;min-height:100vh;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);border-right:1px solid rgba(148,163,184,.14);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.sb-logo{padding:22px 18px 16px;border-bottom:1px solid rgba(148,163,184,.10);display:flex;align-items:center;gap:10px}
.sb-ic{width:30px;height:30px;border-radius:8px;background:${G};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 20px rgba(124,58,237,.5)}
.sb nav{flex:1;padding:10px 8px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:500;color:#94A3B8;transition:all .15s;border:1px solid transparent}
.nl:hover{background:rgba(124,58,237,.10);border-color:rgba(124,58,237,.20);color:#fff}
.nl.on{background:${G};color:#fff;font-weight:700;border-color:rgba(255,255,255,.10);box-shadow:0 0 26px rgba(124,58,237,.34),inset 0 1px 0 rgba(255,255,255,.12)}
.sb-foot{padding:12px 10px;border-top:1px solid rgba(148,163,184,.10)}
.mhdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.96);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.12);position:sticky;top:0;z-index:20;width:100%;max-width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.14)}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:240px;flex:1;min-height:100vh;width:calc(100% - 240px);max-width:calc(100% - 240px)}
.pg{background:radial-gradient(circle at top left,rgba(34,197,94,.08),transparent 30%),radial-gradient(circle at top right,rgba(59,130,246,.10),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1200px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(34,197,94,.06),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;height:46px;padding:0 20px;font-size:13px;font-weight:700;box-shadow:0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.26);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-p:hover{transform:translateY(-1px)}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:44px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-s:hover{border-color:rgba(34,197,94,.38);color:#fff}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
.pag-card{background:radial-gradient(circle at top left,rgba(34,197,94,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.14);border-radius:18px;padding:18px;margin-bottom:8px;transition:border-color .18s,box-shadow .18s;overflow:hidden}
.pag-card:hover{border-color:rgba(34,197,94,.26);box-shadow:0 4px 20px rgba(34,197,94,.08)}
.pill{padding:0 13px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.16);transition:all .18s;white-space:nowrap;background:rgba(15,23,42,.72);color:#94A3B8;height:34px;display:inline-flex;align-items:center}
.pill:hover{border-color:rgba(34,197,94,.30);color:#CBD5E1}
.pill.on{background:rgba(34,197,94,.14);border:1px solid rgba(34,197,94,.34);color:#F8FAFC}
.srch{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:0 16px 0 42px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s}
.srch:focus{border-color:rgba(34,197,94,.55);box-shadow:0 0 0 3px rgba(34,197,94,.12)}
.inp{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:0 14px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(34,197,94,.55);box-shadow:0 0 0 3px rgba(34,197,94,.12)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:7px}
.act{border-radius:9px;padding:0 10px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .18s;font-family:inherit;display:inline-flex;align-items:center;gap:3px;white-space:nowrap;height:30px}
.act:hover{filter:brightness(1.12)}
@media(max-width:1023px){
  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mhdr{display:flex!important}.bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .hdr-r{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .hdr-btns{display:flex!important;gap:8px!important}
  .hdr-btns button,.hdr-btns a{flex:1!important;justify-content:center!important}
  .pills-row{overflow-x:auto!important;flex-wrap:nowrap!important;scrollbar-width:none!important;display:flex!important;gap:5px!important;padding-bottom:2px!important}
  .pills-row::-webkit-scrollbar{display:none!important}
  .fg2{grid-template-columns:1fr!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
`

export default function Pagamentos(){
  const [perfil,setPerfil]=useState<any>(null)
  const [pagamentos,setPagamentos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [busca,setBusca]=useState('')
  const [filtro,setFiltro]=useState('todos')
  const [msg,setMsg]=useState('')
  const [showForm,setShowForm]=useState(false)
  const [salvando,setSalvando]=useState(false)
  const [fCliente,setFCliente]=useState('')
  const [fValor,setFValor]=useState('')
  const [fForma,setFForma]=useState('Pix')
  const [fRef,setFRef]=useState('')
  const [fTipo,setFTipo]=useState('completo')
  const [fData,setFData]=useState(new Date().toISOString().split('T')[0])

  useEffect(()=>{load()},[])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:pags}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('pagamentos').select('*').eq('user_id',user.id).order('data',{ascending:false}),
    ])
    setPerfil(p);setPagamentos(pags||[]);setLoading(false)
  }

  async function salvar(){
    if(!fCliente.trim()||!fValor){setMsg('⚠ Informe cliente e valor.');return}
    setSalvando(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSalvando(false);return}
    const {data:novo}=await supabase.from('pagamentos').insert({
      user_id:user.id,cliente_nome:fCliente.trim(),
      valor:parseFloat(fValor.replace(',','.')),
      forma:fForma,referencia:fRef.trim()||null,
      tipo:fTipo,data:fData,status:'confirmado',
    }).select('*').single()
    if(novo) setPagamentos(prev=>[novo,...prev])
    setFCliente('');setFValor('');setFForma('Pix');setFRef('');setFTipo('completo')
    setFData(new Date().toISOString().split('T')[0])
    setShowForm(false);setMsg('✓ Pagamento registrado!');setTimeout(()=>setMsg(''),2500);setSalvando(false)
  }

  async function excluir(id:string){
    if(!confirm('Remover este pagamento do histórico?')) return
    await supabase.from('pagamentos').delete().eq('id',id)
    setPagamentos(prev=>prev.filter(p=>p.id!==id))
    setMsg('Removido.');setTimeout(()=>setMsg(''),2000)
  }

  const hoje=new Date().toISOString().split('T')[0]
  const mes=new Date().toISOString().slice(0,7)
  const recMes=pagamentos.filter(p=>p.data?.startsWith(mes)).reduce((a,p)=>a+(p.valor||0),0)
  const recHoje=pagamentos.filter(p=>p.data===hoje).reduce((a,p)=>a+(p.valor||0),0)
  const parciais=pagamentos.filter(p=>p.tipo==='parcial').length
  const ticket=pagamentos.length>0?pagamentos.reduce((a,p)=>a+(p.valor||0),0)/pagamentos.length:0

  const filtrados=pagamentos.filter(p=>{
    const q=busca.toLowerCase()
    const mb=!busca||(p.cliente_nome?.toLowerCase().includes(q)||p.referencia?.toLowerCase().includes(q)||p.forma?.toLowerCase().includes(q))
    if(!mb) return false
    if(filtro==='hoje') return p.data===hoje
    if(filtro==='mes') return p.data?.startsWith(mes)
    if(filtro==='parcial') return p.tipo==='parcial'
    if(filtro==='completo') return p.tipo==='completo'||p.tipo===null
    if(['Pix','Cartão de crédito','Cartão de débito','Dinheiro','Transferência'].includes(filtro)) return p.forma===filtro
    return true
  })

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'P').charAt(0).toUpperCase()

  const Sb=()=>(
    <aside className="sb">
      <div className="sb-logo"><div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span></div>
      <nav>{SB.map(it=><Link key={it.l} href={it.h} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot"><div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div><div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div></div></div>
    </aside>
  )

  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando pagamentos...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drw${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid rgba(148,163,184,.10)'}}><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span><button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button></div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{SB.map(it=><Link key={it.l} href={it.h} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}>{it.l}</Link>)}</nav>
      </div>
      <Sb/>
      <div className="main">
        <div className="mhdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>{[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:`${w}px`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}</button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Pagamentos</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">

          {msg&&<div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'rgba(34,197,94,.18)',border:'1px solid rgba(34,197,94,.38)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#4ADE80',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{msg}</div>}

          {/* Header */}
          <div className="hdr-r" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'24px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Pagamentos</h1>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5}}>Histórico de valores recebidos e pagamentos confirmados.</p>
            </div>
            <div className="hdr-btns" style={{display:'flex',gap:'8px',flexShrink:0}}>
              <button className="btn-p" onClick={()=>setShowForm(!showForm)}>+ Registrar pagamento</button>
              <Link href="/painel/cobrancas" className="btn-s">Ver cobranças</Link>
            </div>
          </div>

          {/* KPIs — foco em RECEBIDOS */}
          <div className="kpi-grid">
            {[
              {l:'Recebido no mês',d:'Total confirmado',v:fBRL(recMes),c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.24)',ico:'✓'},
              {l:'Recebido hoje',d:'Entradas do dia',v:fBRL(recHoje),c:'#60A5FA',bg:'rgba(59,130,246,.10)',bd:'rgba(59,130,246,.24)',ico:'📅'},
              {l:'Pagamentos parciais',d:'Baixas parciais',v:parciais,c:'#C4B5FD',bg:'rgba(124,58,237,.10)',bd:'rgba(124,58,237,.24)',ico:'◑'},
              {l:'Ticket médio',d:'Média por pagamento',v:fBRL(ticket),c:'#22D3EE',bg:'rgba(6,182,212,.10)',bd:'rgba(6,182,212,.24)',ico:'↗'},
            ].map(k=>(
              <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:'18px',padding:'18px 16px',boxSizing:'border-box' as const}}>
                <div style={{width:'38px',height:'38px',borderRadius:'11px',background:k.bg,border:`1px solid ${k.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',marginBottom:'10px'}}>{k.ico}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'2px'}}>{k.l}</p>
                <p style={{fontSize:'11px',color:'#64748B',marginBottom:'5px'}}>{k.d}</p>
                <p style={{fontSize:'22px',fontWeight:800,color:k.c,lineHeight:1,letterSpacing:'-0.02em'}}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* Form registrar pagamento */}
          {showForm&&(
            <div className="crd" style={{padding:'22px',marginBottom:'18px',border:'1.5px solid rgba(34,197,94,.24)'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#4ADE80',marginBottom:'4px',display:'flex',alignItems:'center',gap:'7px'}}><span style={{background:'rgba(34,197,94,.14)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>Novo</span>Registrar recebimento</p>
              <p style={{fontSize:'12px',color:'#64748B',marginBottom:'18px'}}>Registre um pagamento recebido de cliente ou cobrança.</p>
              <div className="fg2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                <div><label className="lbl">Cliente / Paciente *</label><input className="inp" type="text" placeholder="Nome do cliente..." value={fCliente} onChange={e=>setFCliente(e.target.value)}/></div>
                <div>
                  <label className="lbl">Valor recebido *</label>
                  <div style={{position:'relative'}}><span style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600,pointerEvents:'none'}}>R$</span><input className="inp" type="text" inputMode="decimal" placeholder="0,00" value={fValor} onChange={e=>setFValor(e.target.value)} style={{paddingLeft:'36px'}}/></div>
                </div>
                <div><label className="lbl">Forma de pagamento</label><select className="inp" value={fForma} onChange={e=>setFForma(e.target.value)}>{FORMAS.map(f=><option key={f} value={f}>{f}</option>)}</select></div>
                <div><label className="lbl">Data do recebimento</label><input className="inp" type="date" value={fData} onChange={e=>setFData(e.target.value)}/></div>
                <div style={{gridColumn:'1/-1'}}><label className="lbl">Referência (cobrança, orçamento, serviço...)</label><input className="inp" type="text" placeholder="Ex: Orçamento #001, Consulta de retorno..." value={fRef} onChange={e=>setFRef(e.target.value)}/></div>
              </div>
              <div style={{display:'flex',gap:'10px',marginBottom:'16px'}}>
                {[{v:'completo',l:'✓ Pagamento completo',c:'#4ADE80',bg:'rgba(34,197,94,.12)',bd:'rgba(34,197,94,.32)'},{v:'parcial',l:'◑ Pagamento parcial',c:'#C4B5FD',bg:'rgba(124,58,237,.12)',bd:'rgba(124,58,237,.32)'}].map(t=>(
                  <button key={t.v} onClick={()=>setFTipo(t.v)} style={{background:fTipo===t.v?t.bg:'rgba(15,23,42,.75)',border:`1px solid ${fTipo===t.v?t.bd:'rgba(148,163,184,.18)'}`,borderRadius:'10px',height:'40px',padding:'0 16px',fontSize:'12px',fontWeight:600,color:fTipo===t.v?t.c:'#94A3B8',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>{t.l}</button>
                ))}
              </div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button onClick={salvar} disabled={salvando} className="btn-p" style={{opacity:salvando?.7:1}}>{salvando?'Salvando...':'✓ Registrar pagamento'}</button>
                <button onClick={()=>setShowForm(false)} style={{background:'rgba(15,23,42,.88)',color:'#CBD5E1',border:'1px solid rgba(148,163,184,.20)',borderRadius:'12px',height:'44px',padding:'0 16px',fontSize:'13px',fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Busca + filtros */}
          <div className="crd" style={{padding:'16px 18px',marginBottom:'16px'}}>
            <div style={{position:'relative',marginBottom:'10px'}}>
              <svg style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',color:'#64748B',pointerEvents:'none'}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="srch" placeholder="Buscar pagamento, cliente, forma ou referência..." value={busca} onChange={e=>setBusca(e.target.value)}/>
            </div>
            <div className="pills-row" style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
              {[{v:'todos',l:'Todos'},{v:'hoje',l:'Hoje'},{v:'mes',l:'Este mês'},{v:'Pix',l:'Pix'},{v:'Cartão de crédito',l:'Cartão'},{v:'Dinheiro',l:'Dinheiro'},{v:'parcial',l:'Parcial'},{v:'completo',l:'Completo'}].map(f=>(
                <button key={f.v} className={`pill${filtro===f.v?' on':''}`} onClick={()=>setFiltro(f.v)}>{f.l}</button>
              ))}
            </div>
          </div>

          {/* Lista */}
          {filtrados.length===0?(
            <div className="crd" style={{padding:'60px 24px',textAlign:'center'}}>
              <div style={{width:'58px',height:'58px',borderRadius:'16px',background:'rgba(34,197,94,.10)',border:'1px solid rgba(34,197,94,.24)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 16px'}}>💰</div>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'6px'}}>Nenhum pagamento registrado</p>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.6,maxWidth:'320px',margin:'0 auto 8px'}}>Quando um cliente pagar uma cobrança ou orçamento, o recebimento aparecerá aqui.</p>
              <p style={{fontSize:'12px',color:'#374151',marginBottom:'20px'}}>Você também pode registrar pagamentos diretamente em uma cobrança.</p>
              <button className="btn-p" style={{display:'inline-flex'}} onClick={()=>setShowForm(true)}>+ Registrar pagamento</button>
            </div>
          ):(
            filtrados.map((p:any)=>(
              <div key={p.id} className="pag-card">
                <div style={{display:'flex',alignItems:'flex-start',gap:'12px'}}>
                  <div style={{width:'44px',height:'44px',borderRadius:'50%',background:AV,border:'1px solid rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:700,color:'#fff',flexShrink:0}}>{(p.cliente_nome||'?').charAt(0).toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'8px',marginBottom:'4px',flexWrap:'wrap'}}>
                      <div>
                        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'1px'}}>{p.cliente_nome||'—'}</p>
                        {p.referencia&&<p style={{fontSize:'12px',color:'#94A3B8'}}>{p.referencia}</p>}
                      </div>
                      {/* VALOR é o destaque em Pagamentos */}
                      <div style={{textAlign:'right' as const,flexShrink:0}}>
                        <p style={{fontSize:'20px',fontWeight:800,color:'#4ADE80',lineHeight:1}}>{fBRL(p.valor||0)}</p>
                        <span style={{fontSize:'10px',fontWeight:600,padding:'2px 8px',borderRadius:'999px',background:p.tipo==='parcial'?'rgba(124,58,237,.14)':'rgba(34,197,94,.14)',color:p.tipo==='parcial'?'#C4B5FD':'#4ADE80',border:`1px solid ${p.tipo==='parcial'?'rgba(124,58,237,.30)':'rgba(34,197,94,.30)'}`}}>{p.tipo==='parcial'?'Parcial':'Completo'}</span>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center',marginBottom:'8px'}}>
                      {p.forma&&<span style={{fontSize:'11px',fontWeight:600,padding:'2px 8px',borderRadius:'999px',background:'rgba(59,130,246,.12)',color:'#93C5FD',border:'1px solid rgba(59,130,246,.24)'}}>{p.forma}</span>}
                      {p.data&&<span style={{fontSize:'11px',color:'#64748B'}}>📅 {new Date(p.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}</span>}
                      <span style={{fontSize:'10px',fontWeight:600,padding:'2px 8px',borderRadius:'999px',background:'rgba(34,197,94,.10)',color:'#4ADE80',border:'1px solid rgba(34,197,94,.22)'}}>Confirmado</span>
                    </div>
                    <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                      <Link href="/painel/cobrancas" className="act" style={{background:'rgba(59,130,246,.10)',border:'1px solid rgba(59,130,246,.22)',color:'#93C5FD',textDecoration:'none'}}>Ver cobranças</Link>
                      <Link href="/painel/clientes" className="act" style={{background:'rgba(124,58,237,.10)',border:'1px solid rgba(124,58,237,.22)',color:'#C4B5FD',textDecoration:'none'}}>Ver cliente</Link>
                      <button onClick={()=>excluir(p.id)} className="act" style={{background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.18)',color:'#F87171'}}>✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

        </div></div>
      </div>
    </div>
  )
}
