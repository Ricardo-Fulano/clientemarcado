'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'
const SB=[
  {h:'/painel',l:'Início'},{h:'/painel/agendamentos',l:'Agenda'},
  {h:'/painel/clientes',l:'Clientes'},{h:'/painel/orcamentos',l:'Orçamentos'},
  {h:'/painel/cobrancas',l:'Cobranças',on:true},{h:'/painel/pagamentos',l:'Pagamentos'},
  {h:'/painel/servicos',l:'Serviços'},{h:'/painel/profissionais',l:'Profissionais'},
  {h:'/painel/relatorio',l:'Relatórios'},{h:'/painel/perfil',l:'Configurações'},
]
const fBRL=(v:number)=>`R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2})}`
const SC:Record<string,{bg:string,bd:string,c:string,t:string}>={
  em_aberto:   {bg:'rgba(245,158,11,.14)', bd:'rgba(245,158,11,.34)', c:'#FBBF24',t:'Em aberto'},
  vencida:     {bg:'rgba(239,68,68,.14)',  bd:'rgba(239,68,68,.32)',  c:'#F87171',t:'Vencida'},
  parcial:     {bg:'rgba(139,92,246,.14)', bd:'rgba(139,92,246,.34)', c:'#C4B5FD',t:'Parcialmente paga'},
  paga:        {bg:'rgba(34,197,94,.14)',  bd:'rgba(34,197,94,.34)',  c:'#4ADE80',t:'Paga'},
  cancelada:   {bg:'rgba(71,85,105,.14)', bd:'rgba(71,85,105,.28)',  c:'#94A3B8',t:'Cancelada'},
}
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
.mhdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.96);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.12);position:sticky;top:0;z-index:20;width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.14)}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:240px;flex:1;min-height:100vh;width:calc(100% - 240px);max-width:calc(100% - 240px)}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1200px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;height:46px;padding:0 20px;font-size:13px;font-weight:700;box-shadow:0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.26);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-p:hover{transform:translateY(-1px)}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:42px;padding:0 14px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-s:hover{border-color:rgba(124,58,237,.38);color:#fff}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
.cob-card{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 36%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:18px;padding:16px 18px;margin-bottom:8px;transition:border-color .18s;overflow:hidden}
.cob-card:hover{border-color:rgba(124,58,237,.28)}
.pill{padding:0 13px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.16);transition:all .18s;white-space:nowrap;background:rgba(15,23,42,.7);color:#94A3B8;height:34px;display:inline-flex;align-items:center}
.pill:hover{border-color:rgba(124,58,237,.30);color:#CBD5E1}
.pill.on{background:rgba(124,58,237,.16);border:1px solid rgba(124,58,237,.38);color:#F8FAFC}
.srch{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:0 16px 0 42px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s}
.srch:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.12)}
.act{border-radius:8px;padding:0 10px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .18s;font-family:inherit;display:inline-flex;align-items:center;gap:3px;white-space:nowrap;height:30px}
.act:hover{filter:brightness(1.12)}
@media(max-width:1023px){
  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mhdr{display:flex!important}.bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .hdr-r{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .hdr-r button,.hdr-r a{width:100%!important;justify-content:center!important}
  .frow{overflow-x:auto!important;flex-wrap:nowrap!important;scrollbar-width:none!important}
  .frow::-webkit-scrollbar{display:none!important}
  .cob-acts{display:grid!important;grid-template-columns:1fr 1fr!important;gap:5px!important;width:100%!important;margin-top:8px!important}
  .cob-acts .act{width:100%!important;height:34px!important;justify-content:center!important}
  .cob-card-inner{flex-direction:column!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
`
export default function Cobrancas(){
  const [perfil,setPerfil]=useState<any>(null)
  const [cobrancas,setCobrancas]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [busca,setBusca]=useState('')
  const [filtro,setFiltro]=useState('todas')
  const [msg,setMsg]=useState('')

  useEffect(()=>{load()},[])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:cobs}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('cobrancas').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
    ])
    setPerfil(p);setCobrancas(cobs||[]);setLoading(false)
  }
  async function regPagamento(id:string,total:number,pago:number){
    const v=prompt(`Registrar pagamento\nTotal: ${fBRL(total)}\nJá pago: ${fBRL(pago)}\nValor a registrar (número):`)
    if(!v) return
    const novo=pago+parseFloat(v.replace(',','.'))
    const st=novo>=total?'paga':'parcial'
    await supabase.from('cobrancas').update({valor_pago:novo,status:st}).eq('id',id)
    setCobrancas(prev=>prev.map(c=>c.id===id?{...c,valor_pago:novo,status:st}:c))
    setMsg('Pagamento registrado! ✓');setTimeout(()=>setMsg(''),2500)
  }
  async function cancelar(id:string){
    if(!confirm('Cancelar esta cobrança?')) return
    await supabase.from('cobrancas').update({status:'cancelada'}).eq('id',id)
    setCobrancas(prev=>prev.map(c=>c.id===id?{...c,status:'cancelada'}:c))
    setMsg('Cobrança cancelada.');setTimeout(()=>setMsg(''),2000)
  }

  const hoje=new Date().toISOString().split('T')[0]
  const aReceber=cobrancas.filter(c=>c.status==='em_aberto'||c.status==='parcial').reduce((a,c)=>(c.valor_total||0)-(c.valor_pago||0)+a,0)
  const vencidas=cobrancas.filter(c=>c.status==='em_aberto'&&c.vencimento&&c.vencimento<hoje).length
  const parciais=cobrancas.filter(c=>c.status==='parcial').length
  const mesAtual=new Date().toISOString().slice(0,7)
  const recMes=cobrancas.filter(c=>c.updated_at?.startsWith(mesAtual)&&(c.status==='paga'||c.status==='parcial')).reduce((a,c)=>a+(c.valor_pago||0),0)

  const filtrados=cobrancas.filter(c=>{
    const q=busca.toLowerCase()
    const mb=!busca||(c.cliente_nome?.toLowerCase().includes(q)||c.descricao?.toLowerCase().includes(q))
    if(!mb) return false
    if(filtro==='em_aberto') return c.status==='em_aberto'
    if(filtro==='vencidas') return c.status==='em_aberto'&&c.vencimento&&c.vencimento<hoje
    if(filtro==='parcial') return c.status==='parcial'
    if(filtro==='pagas') return c.status==='paga'
    if(filtro==='canceladas') return c.status==='cancelada'
    return true
  })
  const nome=perfil?.nome_negocio||''
  const ini=(nome||'C').charAt(0).toUpperCase()
  const Sb=()=>(
    <aside className="sb">
      <div className="sb-logo"><div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span></div>
      <nav>{SB.map(it=><Link key={it.l} href={it.h} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot"><div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div><div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div></div></div>
    </aside>
  )
  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)
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
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Cobranças</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">
          {msg&&<div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'rgba(124,58,237,.18)',border:'1px solid rgba(124,58,237,.40)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#C4B5FD',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{msg}</div>}
          <div className="hdr-r" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div><h1 style={{fontSize:'24px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Cobranças</h1><p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5}}>Acompanhe valores em aberto, vencimentos e envio de cobranças.</p></div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}><button className="btn-p" onClick={()=>setMsg('Em breve: Nova cobrança')}>+ Nova cobrança</button><Link href="/painel/orcamentos" className="btn-s">Ver orçamentos</Link></div>
          </div>
          <div className="kpi-grid">
            {[
              {l:'A receber',v:fBRL(aReceber),c:'#FBBF24',bg:'rgba(245,158,11,.10)',bd:'rgba(245,158,11,.24)',ico:'💳'},
              {l:'Vencidas',v:vencidas,c:'#F87171',bg:'rgba(239,68,68,.10)',bd:'rgba(239,68,68,.24)',ico:'⚠'},
              {l:'Parc. pagas',v:parciais,c:'#C4B5FD',bg:'rgba(124,58,237,.10)',bd:'rgba(124,58,237,.24)',ico:'◑'},
              {l:'Recebido no mês',v:fBRL(recMes),c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.24)',ico:'✓'},
            ].map(k=>(
              <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:'18px',padding:'18px 16px',boxSizing:'border-box' as const}}>
                <div style={{width:'38px',height:'38px',borderRadius:'11px',background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',marginBottom:'10px'}}>{k.ico}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>{k.l}</p>
                <p style={{fontSize:'22px',fontWeight:800,color:k.c,lineHeight:1,letterSpacing:'-0.02em'}}>{k.v}</p>
              </div>
            ))}
          </div>
          <div className="crd" style={{padding:'16px 18px',marginBottom:'16px'}}>
            <div style={{position:'relative',marginBottom:'10px'}}><svg style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',color:'#64748B',pointerEvents:'none'}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input className="srch" placeholder="Buscar cliente, serviço ou cobrança..." value={busca} onChange={e=>setBusca(e.target.value)}/></div>
            <div className="frow" style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
              {[{v:'todas',l:'Todas'},{v:'em_aberto',l:'Em aberto'},{v:'vencidas',l:'Vencidas'},{v:'parcial',l:'Parcialmente pagas'},{v:'pagas',l:'Pagas'},{v:'canceladas',l:'Canceladas'}].map(f=>(
                <button key={f.v} className={`pill${filtro===f.v?' on':''}`} onClick={()=>setFiltro(f.v)}>{f.l}</button>
              ))}
            </div>
          </div>
          {filtrados.length===0?(
            <div className="crd" style={{padding:'56px 24px',textAlign:'center'}}>
              <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'rgba(124,58,237,.12)',border:'1px solid rgba(124,58,237,.26)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',margin:'0 auto 16px'}}>💳</div>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'6px'}}>Nenhuma cobrança cadastrada</p>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5,maxWidth:'300px',margin:'0 auto 20px'}}>Quando você criar uma cobrança ou gerar um orçamento com pagamento, ela aparecerá aqui.</p>
              <button className="btn-p" style={{display:'inline-flex'}} onClick={()=>setMsg('Em breve: Nova cobrança')}>+ Nova cobrança</button>
            </div>
          ):(
            filtrados.map((c:any)=>{
              const sc=SC[c.status]||SC.em_aberto
              const saldo=(c.valor_total||0)-(c.valor_pago||0)
              return(
                <div key={c.id} className="cob-card">
                  <div className="cob-card-inner" style={{display:'flex',alignItems:'flex-start',gap:'14px'}}>
                    <div style={{width:'44px',height:'44px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:700,color:'#fff',flexShrink:0}}>{(c.cliente_nome||'?').charAt(0).toUpperCase()}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'6px',flexWrap:'wrap',marginBottom:'4px'}}>
                        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>{c.cliente_nome||'—'}</p>
                        <span style={{fontSize:'10px',fontWeight:600,padding:'2px 9px',borderRadius:'999px',background:sc.bg,color:sc.c,border:`1px solid ${sc.bd}`,flexShrink:0}}>{sc.t}</span>
                      </div>
                      {c.descricao&&<p style={{fontSize:'13px',color:'#94A3B8',marginBottom:'4px'}}>{c.descricao}</p>}
                      <div style={{display:'flex',gap:'14px',flexWrap:'wrap',marginBottom:'6px'}}>
                        <span style={{fontSize:'12px',color:'#64748B'}}>Total: <strong style={{color:'#F8FAFC'}}>{fBRL(c.valor_total||0)}</strong></span>
                        <span style={{fontSize:'12px',color:'#64748B'}}>Pago: <strong style={{color:'#4ADE80'}}>{fBRL(c.valor_pago||0)}</strong></span>
                        <span style={{fontSize:'12px',color:'#64748B'}}>Saldo: <strong style={{color:saldo>0?'#FBBF24':'#4ADE80'}}>{fBRL(saldo)}</strong></span>
                        {c.vencimento&&<span style={{fontSize:'11px',color:c.vencimento<hoje&&c.status==='em_aberto'?'#F87171':'#64748B'}}>Vence: {new Date(c.vencimento+'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                      </div>
                      <div className="cob-acts" style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                        {c.cliente_whatsapp&&<button onClick={()=>window.open(`https://wa.me/55${c.cliente_whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá, ${c.cliente_nome}! Você possui uma cobrança em aberto de ${fBRL(saldo)}. Pode confirmar o pagamento?`)}`,'_blank')} className="act" style={{background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.28)',color:'#4ADE80'}}>💬 WhatsApp</button>}
                        {c.status!=='paga'&&c.status!=='cancelada'&&<button onClick={()=>regPagamento(c.id,c.valor_total||0,c.valor_pago||0)} className="act" style={{background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.28)',color:'#93C5FD'}}>+ Registrar pgto</button>}
                        {c.status!=='cancelada'&&<button onClick={()=>cancelar(c.id)} className="act" style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.22)',color:'#F87171'}}>Cancelar</button>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div></div>
      </div>
    </div>
  )
}
