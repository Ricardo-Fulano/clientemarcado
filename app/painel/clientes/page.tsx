'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import PainelSidebar from '@/app/components/PainelSidebar'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
select option{background:#07111F;color:#F8FAFC}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1200px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;height:46px;padding:0 20px;font-size:13px;font-weight:700;box-shadow:0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.26);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-p:hover{transform:translateY(-1px)}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:44px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-s:hover{border-color:rgba(34,211,238,.35);color:#fff}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
.cli-card{background:radial-gradient(circle at top left,rgba(34,211,238,.06),transparent 36%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:18px;padding:16px 18px;margin-bottom:8px;transition:all .18s;overflow:hidden}
.cli-card:hover{border-color:rgba(34,211,238,.30);box-shadow:0 0 28px rgba(34,211,238,.10);transform:translateY(-1px)}
.pill{padding:0 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.18);transition:all .18s;white-space:nowrap;background:rgba(15,23,42,.72);color:#94A3B8;height:34px;display:inline-flex;align-items:center}
.pill:hover{border-color:rgba(34,211,238,.32);color:#CBD5E1}
.pill.on{background:rgba(34,211,238,.14);border:1px solid rgba(34,211,238,.38);color:#F8FAFC}
.srch{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:0 16px 0 42px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s}
.srch:focus{border-color:rgba(34,211,238,.55);box-shadow:0 0 0 3px rgba(34,211,238,.12)}
.inp{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:0 14px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(34,211,238,.55);box-shadow:0 0 0 3px rgba(34,211,238,.12)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:7px}
.cli-act{border-radius:8px;padding:0 10px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .2s;font-family:inherit;display:inline-flex;align-items:center;gap:3px;white-space:nowrap;height:32px}
.cli-act:hover{filter:brightness(1.15)}
@media(max-width:1023px){
  .bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .hdr-row{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .hdr-btns{flex-direction:row!important;gap:8px!important}
  .hdr-btns a,.hdr-btns button{flex:1!important;justify-content:center!important}
  .pills-row{overflow-x:auto!important;display:flex!important;gap:5px!important;flex-wrap:nowrap!important;scrollbar-width:none!important;padding-bottom:2px!important}
  .pills-row::-webkit-scrollbar{display:none!important}
  .cli-card-inner{flex-direction:column!important;gap:10px!important}
  .cli-acts{display:grid!important;grid-template-columns:1fr 1fr!important;gap:6px!important;width:100%!important}
  .cli-acts .cli-act{width:100%!important;height:34px!important;font-size:12px!important;justify-content:center!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
`

type Cliente={id:string;nome:string;whatsapp:string;email:string;tipo:string;obs:string;created_at:string;ativo:boolean}

export default function Clientes(){
  const [perfil,setPerfil]=useState<any>(null)
  const [clientes,setClientes]=useState<Cliente[]>([])
  const [loading,setLoading]=useState(true)
  const [busca,setBusca]=useState('')
  const [filtro,setFiltro]=useState('todos')
  const [msg,setMsg]=useState('')
  const [showForm,setShowForm]=useState(false)
  const [salvando,setSalvando]=useState(false)
  const [fNome,setFNome]=useState('')
  const [fWpp,setFWpp]=useState('')
  const [fEmail,setFEmail]=useState('')
  const [fTipo,setFTipo]=useState('cliente')
  const [fObs,setFObs]=useState('')

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:clis}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('clientes').select('*').eq('user_id',user.id).order('nome',{ascending:true}),
    ])
    setPerfil(p);setClientes(clis||[]);setLoading(false)
  }

  async function salvarCliente(){
    if(!fNome.trim()){setMsg('⚠ Informe o nome.');return}
    setSalvando(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSalvando(false);return}
    const {data:novo,error}=await supabase.from('clientes').insert({
      user_id:user.id,nome:fNome.trim(),whatsapp:fWpp.replace(/\D/g,'')||null,
      email:fEmail.trim()||null,tipo:fTipo,obs:fObs.trim()||null,ativo:true,
    }).select('*').single()
    if(error){setMsg('Erro ao salvar.');setSalvando(false);return}
    setClientes(prev=>[novo,...prev].sort((a,b)=>a.nome.localeCompare(b.nome)))
    setFNome('');setFWpp('');setFEmail('');setFTipo('cliente');setFObs('')
    setShowForm(false);setMsg('Cliente cadastrado! ✓')
    setTimeout(()=>setMsg(''),2500)
    setSalvando(false)
  }

  async function excluir(id:string){
    await supabase.from('clientes').delete().eq('id',id)
    setClientes(prev=>prev.filter(c=>c.id!==id))
    setMsg('Cliente removido.');setTimeout(()=>setMsg(''),2000)
  }

  const filtrados=clientes.filter(c=>{
    const q=busca.toLowerCase()
    const matchBusca=!busca||(c.nome?.toLowerCase().includes(q)||c.whatsapp?.includes(q)||c.email?.toLowerCase().includes(q))
    if(!matchBusca) return false
    if(filtro==='ativos') return c.ativo!==false
    if(filtro==='inativos') return c.ativo===false
    return true
  })

  const mesAtual=new Date().toISOString().slice(0,7)
  const novosNoMes=clientes.filter(c=>c.created_at?.startsWith(mesAtual)).length
  const nome=perfil?.nome_negocio||''

  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando clientes...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      <PainelSidebar nome={nome} tituloMobile="Clientes" />

      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg&&<div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'rgba(6,182,212,.18)',border:'1px solid rgba(6,182,212,.40)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#22D3EE',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>{msg}</div>}

          <div className="hdr-row" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'24px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Clientes</h1>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5}}>Gerencie clientes, pacientes, contatos e histórico em um só lugar.</p>
            </div>
            <div className="hdr-btns" style={{display:'flex',gap:'8px',flexShrink:0,flexWrap:'wrap'}}>
              <button onClick={()=>setShowForm(!showForm)} className="btn-p">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {showForm?'Cancelar':'Novo cliente'}
              </button>
            </div>
          </div>

          <div className="kpi-grid">
            {[
              {l:'Total de clientes',v:clientes.length,c:'#22D3EE',bg:'rgba(6,182,212,.08)',bd:'rgba(6,182,212,.18)',ico:'👥'},
              {l:'Retornos pendentes',v:'—',c:'#FBBF24',bg:'rgba(245,158,11,.08)',bd:'rgba(245,158,11,.18)',ico:'🔄'},
              {l:'Cobranças em aberto',v:'R$ —',c:'#C4B5FD',bg:'rgba(124,58,237,.08)',bd:'rgba(124,58,237,.18)',ico:'💳'},
              {l:'Novos no mês',v:novosNoMes,c:'#4ADE80',bg:'rgba(34,197,94,.08)',bd:'rgba(34,197,94,.18)',ico:'✨'},
            ].map(k=>(
              <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:'18px',padding:'18px 16px',boxSizing:'border-box' as const,boxShadow:'0 20px 48px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)'}}>
                <div style={{width:'38px',height:'38px',borderRadius:'11px',background:k.bg,border:`1px solid ${k.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',marginBottom:'10px'}}>{k.ico}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>{k.l}</p>
                <p style={{fontSize:'26px',fontWeight:800,color:k.c,lineHeight:1,letterSpacing:'-0.03em'}}>{k.v}</p>
              </div>
            ))}
          </div>

          {showForm&&(
            <div className="crd" style={{padding:'22px',marginBottom:'18px',border:'1.5px solid rgba(34,211,238,.22)'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#22D3EE',marginBottom:'16px',display:'flex',alignItems:'center',gap:'7px'}}>
                <span style={{background:'rgba(34,211,238,.14)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>Novo</span>
                Cadastrar cliente / paciente
              </p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}} className="form-grid2">
                <style>{`@media(max-width:640px){.form-grid2{grid-template-columns:1fr!important}}`}</style>
                <div><label className="lbl">Nome *</label><input className="inp" type="text" placeholder="Nome completo..." value={fNome} onChange={e=>setFNome(e.target.value)}/></div>
                <div><label className="lbl">WhatsApp</label><input className="inp" type="tel" placeholder="(11) 99999-9999" value={fWpp} onChange={e=>setFWpp(e.target.value)}/></div>
                <div><label className="lbl">E-mail</label><input className="inp" type="email" placeholder="email@exemplo.com" value={fEmail} onChange={e=>setFEmail(e.target.value)}/></div>
                <div>
                  <label className="lbl">Tipo</label>
                  <select className="inp" value={fTipo} onChange={e=>setFTipo(e.target.value)}>
                    <option value="cliente">Cliente</option>
                    <option value="paciente">Paciente</option>
                  </select>
                </div>
              </div>
              <div style={{marginBottom:'16px'}}>
                <label className="lbl">Observações internas</label>
                <textarea className="inp" rows={2} placeholder="Alergias, preferências, observações clínicas..." value={fObs} onChange={e=>setFObs(e.target.value)} style={{height:'auto',padding:'10px 14px',resize:'none',lineHeight:1.5}}/>
              </div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button onClick={salvarCliente} disabled={salvando} className="btn-p" style={{opacity:salvando?.7:1}}>
                  {salvando?'Salvando...':'✓ Salvar cliente'}
                </button>
                <button onClick={()=>setShowForm(false)} className="btn-s">Cancelar</button>
              </div>
            </div>
          )}

          <div className="crd" style={{padding:'16px 18px',marginBottom:'16px'}}>
            <div style={{position:'relative',marginBottom:'10px'}}>
              <svg style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',color:'#64748B',pointerEvents:'none'}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="srch" style={{paddingLeft:'42px'}} placeholder="Buscar cliente, paciente, WhatsApp ou e-mail..." value={busca} onChange={e=>setBusca(e.target.value)}/>
            </div>
            <div className="pills-row" style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              {[{v:'todos',l:'Todos'},{v:'com_retorno',l:'Com retorno'},{v:'com_cobranca',l:'Com cobrança'},{v:'ativos',l:'Ativos'},{v:'inativos',l:'Inativos'}].map(f=>(
                <button key={f.v} className={`pill${filtro===f.v?' on':''}`} onClick={()=>setFiltro(f.v)}>{f.l}</button>
              ))}
            </div>
          </div>

          {filtrados.length===0?(
            <div style={{background:'radial-gradient(circle at center,rgba(34,211,238,.08),transparent 35%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.16)',borderRadius:'20px',padding:'60px 24px',textAlign:'center',boxShadow:'0 20px 48px rgba(0,0,0,.28)'}}>
              <div style={{width:'58px',height:'58px',borderRadius:'16px',background:'rgba(34,211,238,.12)',border:'1px solid rgba(34,211,238,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',margin:'0 auto 16px',color:'#22D3EE'}}>👥</div>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'6px'}}>{busca?'Nenhum cliente encontrado':'Nenhum cliente cadastrado ainda'}</p>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5,maxWidth:'300px',margin:'0 auto 20px'}}>{busca?'Tente buscar com outro termo.':'Cadastre seu primeiro cliente para organizar agenda, orçamentos, cobranças e retornos em um só lugar.'}</p>
              {!busca&&<button onClick={()=>setShowForm(true)} className="btn-p" style={{display:'inline-flex'}}>+ Criar primeiro cliente</button>}
            </div>
          ):(
            filtrados.map(c=>{
              const inic=(c.nome||'?').charAt(0).toUpperCase()
              return(
                <div key={c.id} className="cli-card">
                  <div className="cli-card-inner" style={{display:'flex',alignItems:'center',gap:'14px'}}>
                    <div style={{width:'44px',height:'44px',borderRadius:'50%',background:AV,border:'1px solid rgba(6,182,212,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',fontWeight:700,color:'#fff',flexShrink:0}}>{inic}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px',flexWrap:'wrap'}}>
                        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.nome}</p>
                        <span style={{fontSize:'10px',fontWeight:600,padding:'2px 8px',borderRadius:'999px',background:'rgba(6,182,212,.12)',color:'#22D3EE',border:'1px solid rgba(6,182,212,.25)',flexShrink:0,textTransform:'capitalize' as const}}>{c.tipo||'cliente'}</span>
                        {c.ativo===false&&<span style={{fontSize:'10px',fontWeight:600,padding:'2px 8px',borderRadius:'999px',background:'rgba(71,85,105,.14)',color:'#94A3B8',border:'1px solid rgba(71,85,105,.25)',flexShrink:0}}>Inativo</span>}
                      </div>
                      {c.whatsapp&&<p style={{fontSize:'12px',color:'#64748B',marginBottom:'1px'}}>📱 {c.whatsapp}</p>}
                      {c.email&&<p style={{fontSize:'12px',color:'#64748B'}}>✉ {c.email}</p>}
                    </div>
                    <div className="cli-acts" style={{display:'flex',gap:'5px',flexShrink:0,flexWrap:'wrap',justifyContent:'flex-end'}}>
                      {c.whatsapp&&(
                        <button onClick={()=>window.open(`https://wa.me/55${c.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá, ${c.nome}!`)}`,'_blank')} className="cli-act" style={{background:'rgba(34,197,94,.10)',border:'1px solid rgba(34,197,94,.28)',color:'#4ADE80'}}>💬 WhatsApp</button>
                      )}
                      <Link href={`/painel/agendamentos/novo?cliente=${c.id}&nome=${encodeURIComponent(c.nome)}`} className="cli-act" style={{background:'rgba(37,99,235,.10)',border:'1px solid rgba(37,99,235,.28)',color:'#60A5FA',textDecoration:'none'}}>📅 Agendar</Link>
                      <Link href={`/painel/orcamentos?cliente=${c.id}&nome=${encodeURIComponent(c.nome)}`} className="cli-act" style={{background:'rgba(124,58,237,.10)',border:'1px solid rgba(124,58,237,.28)',color:'#C4B5FD',textDecoration:'none'}}>📄 Orçamento</Link>
                      <button onClick={()=>confirm(`Remover ${c.nome}?`)&&excluir(c.id)} className="cli-act" style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.22)',color:'#F87171'}}>✕</button>
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
