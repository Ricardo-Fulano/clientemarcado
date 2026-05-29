'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'
const SB_ITEMS=[
  {h:'/painel',l:'Inicio'},{h:'/painel/agendamentos',l:'Agenda'},
  {h:'/painel/clientes',l:'Clientes'},{h:'/painel/orcamentos',l:'Orcamentos',on:true},
  {h:'/painel/cobrancas',l:'Cobrancas'},{h:'/painel/pagamentos',l:'Pagamentos'},
  {h:'/painel/servicos',l:'Servicos'},{h:'/painel/profissionais',l:'Profissionais'},
  {h:'/painel/relatorio',l:'Relatorios'},{h:'/painel/perfil',l:'Configuracoes'},
]

// Dentes adultos (FDI)
const DENTES_SUP=[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
const DENTES_INF=[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]

type Item={id:string;nome:string;qtd:number;valor:number;obs:string}
type ProcOdonto={id:string;nome:string;dentes:number[];qtd:number;valor:number;status:string;obs:string}

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
.bdy{padding:24px 28px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;padding:22px;margin-bottom:14px}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;height:46px;padding:0 20px;font-size:13px;font-weight:700;box-shadow:0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.26);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none;width:100%;justify-content:center}
.btn-p:hover{transform:translateY(-1px)}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:40px;padding:0 14px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-s:hover{border-color:rgba(124,58,237,.38);color:#fff}
.inp{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:12px;padding:0 14px;height:46px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.14)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:6px}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fg3{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px}
.tipo-btn{background:rgba(15,23,42,.72);border:1.5px solid rgba(148,163,184,.18);border-radius:14px;padding:16px;cursor:pointer;transition:all .18s;text-align:left}
.tipo-btn.on{border-color:rgba(124,58,237,.48);background:rgba(124,58,237,.10)}
.dente{width:30px;height:30px;border-radius:6px;border:1px solid rgba(148,163,184,.22);background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;font-size:9px;color:#94A3B8;cursor:pointer;transition:all .15s;flex-shrink:0}
.dente.sel{background:rgba(124,58,237,.30);border-color:rgba(124,58,237,.60);color:#C4B5FD;font-weight:700}
.resumo{position:sticky;top:24px}
@media(max-width:1199px){.layout{flex-direction:column!important}.resumo{position:static!important;width:100%!important}}
@media(max-width:1023px){
  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mhdr{display:flex!important}.bdy{padding:14px 14px 80px!important}
  .fg2{grid-template-columns:1fr!important}.fg3{grid-template-columns:1fr!important}
}
`

function uid(){return Math.random().toString(36).slice(2,8)}
function fBRL(v:number){return`R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2})}`}

function Odontograma({selecionados,onChange}:{selecionados:number[],onChange:(d:number[])=>void}){
  function toggle(d:number){
    onChange(selecionados.includes(d)?selecionados.filter(x=>x!==d):[...selecionados,d])
  }
  return(
    <div style={{marginTop:'10px'}}>
      <p style={{fontSize:'11px',color:'#94A3B8',marginBottom:'8px',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>Selecione os dentes</p>
      <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'4px'}}>
        {DENTES_SUP.map(d=><button key={d} onClick={()=>toggle(d)} className={`dente${selecionados.includes(d)?' sel':''}`}>{d}</button>)}
      </div>
      <div style={{height:'1px',background:'rgba(148,163,184,.14)',margin:'4px 0'}}/>
      <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
        {DENTES_INF.map(d=><button key={d} onClick={()=>toggle(d)} className={`dente${selecionados.includes(d)?' sel':''}`}>{d}</button>)}
      </div>
      {selecionados.length>0&&<p style={{fontSize:'11px',color:'#C4B5FD',marginTop:'6px'}}>Dentes: {selecionados.sort((a,b)=>a-b).join(', ')}</p>}
    </div>
  )
}

export default function NovoOrcamento(){
  const router=useRouter()
  const [perfil,setPerfil]=useState<any>(null)
  const [clientes,setClientes]=useState<any[]>([])
  const [mob,setMob]=useState(false)
  const [salvando,setSalvando]=useState(false)
  const [msg,setMsg]=useState('')

  // Cliente
  const [fNome,setFNome]=useState('')
  const [fWpp,setFWpp]=useState('')
  const [fEmail,setFEmail]=useState('')
  const [showSug,setShowSug]=useState(false)

  // Tipo
  const [tipo,setTipo]=useState<'comum'|'odonto'>('comum')

  // Itens comuns
  const [itens,setItens]=useState<Item[]>([{id:uid(),nome:'',qtd:1,valor:0,obs:''}])

  // Procedimentos odonto
  const [procs,setProcs]=useState<ProcOdonto[]>([{id:uid(),nome:'',dentes:[],qtd:1,valor:0,status:'planejado',obs:''}])

  // Pagamento
  const [desconto,setDesconto]=useState(0)
  const [status,setStatus]=useState('aberto')
  const [vencimento,setVencimento]=useState('')

  useEffect(()=>{load()},[])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:cls}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('clientes').select('id,nome,whatsapp,email').eq('user_id',user.id).order('nome'),
    ])
    setPerfil(p);setClientes(cls||[])
  }

  const sugestoes=clientes.filter(c=>c.nome?.toLowerCase().includes(fNome.toLowerCase())&&fNome.length>1)

  // Calculos
  const subtotalComum=itens.reduce((a,i)=>a+i.qtd*i.valor,0)
  const subtotalOdonto=procs.reduce((a,p)=>a+p.qtd*p.valor,0)
  const subtotal=tipo==='comum'?subtotalComum:subtotalOdonto
  const total=Math.max(0,subtotal-desconto)

  function addItem(){setItens(prev=>[...prev,{id:uid(),nome:'',qtd:1,valor:0,obs:''}])}
  function updItem(id:string,k:keyof Item,v:any){setItens(prev=>prev.map(i=>i.id===id?{...i,[k]:v}:i))}
  function rmItem(id:string){setItens(prev=>prev.filter(i=>i.id!==id))}

  function addProc(){setProcs(prev=>[...prev,{id:uid(),nome:'',dentes:[],qtd:1,valor:0,status:'planejado',obs:''}])}
  function updProc(id:string,k:keyof ProcOdonto,v:any){setProcs(prev=>prev.map(p=>p.id===id?{...p,[k]:v}:p))}
  function rmProc(id:string){setProcs(prev=>prev.filter(p=>p.id!==id))}

  async function salvar(acao:'criar'|'rascunho'){
    if(!fNome.trim()){setMsg('Informe o nome do cliente.');return}
    if(tipo==='comum'&&itens.every(i=>!i.nome.trim())){setMsg('Adicione pelo menos um servico.');return}
    setSalvando(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSalvando(false);return}
    const payload={
      user_id:user.id,
      cliente_nome:fNome.trim(),
      cliente_whatsapp:fWpp.replace(/\D/g,'')||null,
      cliente_email:fEmail.trim()||null,
      tipo,
      itens:tipo==='comum'?JSON.stringify(itens):null,
      procedimentos:tipo==='odonto'?JSON.stringify(procs):null,
      valor_total:total,
      valor_pago:0,
      desconto,
      status:acao==='rascunho'?'rascunho':status,
      vencimento:vencimento||null,
    }
    const {data:novo}=await supabase.from('orcamentos').insert(payload).select('id').single()
    setMsg(acao==='rascunho'?'Rascunho salvo!':'Orcamento criado!')
    setTimeout(()=>router.push('/painel/orcamentos'),1200)
    setSalvando(false)
  }

  function enviarWpp(){
    if(!fWpp){setMsg('Informe o WhatsApp do cliente.');return}
    const txt=`Ola ${fNome}! Seu orcamento esta pronto.\n\nTotal: ${fBRL(total)}\n\nEntraremos em contato para confirmar.`
    window.open(`https://wa.me/55${fWpp.replace(/\D/g,'')}?text=${encodeURIComponent(txt)}`,'_blank')
  }

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'O').charAt(0).toUpperCase()

  const Sb=()=>(
    <aside className="sb">
      <div className="sb-logo"><div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span></div>
      <nav>{SB_ITEMS.map(it=><Link key={it.l} href={it.h} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot"><div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div><div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negocio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div></div></div>
    </aside>
  )

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drw${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid rgba(148,163,184,.10)'}}><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span><button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>x</button></div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{SB_ITEMS.map(it=><Link key={it.l} href={it.h} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}>{it.l}</Link>)}</nav>
      </div>
      <Sb/>
      <div className="main">
        <div className="mhdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>{[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:`${w}px`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}</button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Novo orcamento</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">

          {msg&&<div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'rgba(124,58,237,.18)',border:'1px solid rgba(124,58,237,.40)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#C4B5FD',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{msg}</div>}

          {/* Page header */}
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'22px',flexWrap:'wrap'}}>
            <Link href="/painel/orcamentos" className="btn-s" style={{height:'36px',fontSize:'12px',flexShrink:0}}>← Voltar</Link>
            <div style={{flex:1}}>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.03em',marginBottom:'2px'}}>Novo orcamento</h1>
              <p style={{fontSize:'12px',color:'#64748B'}}>Preencha os dados e envie para o cliente ou paciente.</p>
            </div>
            <span style={{fontSize:'11px',color:'#4ADE80',background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.24)',borderRadius:'8px',padding:'4px 10px',flexShrink:0}}>✓ Salvo automaticamente</span>
          </div>

          <div className="layout" style={{display:'flex',gap:'18px',alignItems:'flex-start'}}>
            {/* Coluna principal */}
            <div style={{flex:1,minWidth:0}}>

              {/* Bloco 1 - Cliente */}
              <div className="crd">
                <p style={{fontSize:'13px',fontWeight:700,color:'#C4B5FD',marginBottom:'14px',display:'flex',alignItems:'center',gap:'7px'}}><span style={{background:'rgba(124,58,237,.20)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>1</span>Cliente</p>
                <div style={{position:'relative',marginBottom:'12px'}}>
                  <label className="lbl">Nome do cliente / paciente *</label>
                  <input className="inp" type="text" placeholder="Digite o nome..." value={fNome}
                    onChange={e=>{setFNome(e.target.value);setShowSug(true)}}
                    onBlur={()=>setTimeout(()=>setShowSug(false),180)}/>
                  {showSug&&sugestoes.length>0&&(
                    <div style={{position:'absolute',top:'100%',left:0,right:0,background:'rgba(8,20,33,.99)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'12px',zIndex:20,overflow:'hidden',marginTop:'4px',maxHeight:'200px',overflowY:'auto'}}>
                      {sugestoes.slice(0,6).map(c=>(
                        <button key={c.id} onClick={()=>{setFNome(c.nome);setFWpp(c.whatsapp||'');setFEmail(c.email||'');setShowSug(false)}}
                          style={{width:'100%',padding:'10px 14px',background:'none',border:'none',color:'#F8FAFC',textAlign:'left' as const,cursor:'pointer',fontSize:'13px',borderBottom:'1px solid rgba(148,163,184,.08)',fontFamily:'inherit'}}>
                          {c.nome}{c.whatsapp&&<span style={{color:'#64748B',marginLeft:'8px',fontSize:'11px'}}>{c.whatsapp}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="fg2">
                  <div><label className="lbl">WhatsApp</label><input className="inp" type="tel" placeholder="(11) 99999-9999" value={fWpp} onChange={e=>setFWpp(e.target.value)}/></div>
                  <div><label className="lbl">E-mail (opcional)</label><input className="inp" type="email" placeholder="email@exemplo.com" value={fEmail} onChange={e=>setFEmail(e.target.value)}/></div>
                </div>
              </div>

              {/* Bloco 2 - Tipo */}
              <div className="crd">
                <p style={{fontSize:'13px',fontWeight:700,color:'#C4B5FD',marginBottom:'14px',display:'flex',alignItems:'center',gap:'7px'}}><span style={{background:'rgba(124,58,237,.20)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>2</span>Tipo de orcamento</p>
                <div className="fg2">
                  <button className={`tipo-btn${tipo==='comum'?' on':''}`} onClick={()=>setTipo('comum')}>
                    <p style={{fontSize:'18px',marginBottom:'6px'}}>✂</p>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC',marginBottom:'3px'}}>Orcamento comum</p>
                    <p style={{fontSize:'11px',color:'#64748B'}}>Para barbearia, salao, estetica e servicos gerais.</p>
                  </button>
                  <button className={`tipo-btn${tipo==='odonto'?' on':''}`} onClick={()=>setTipo('odonto')}>
                    <p style={{fontSize:'18px',marginBottom:'6px'}}>🦷</p>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC',marginBottom:'3px'}}>Tratamento odontologico</p>
                    <p style={{fontSize:'11px',color:'#64748B'}}>Para selecionar dentes, procedimentos e acompanhar evolucao.</p>
                  </button>
                </div>
              </div>

              {/* Bloco 3 - Servicos (comum) */}
              {tipo==='comum'&&(
                <div className="crd">
                  <p style={{fontSize:'13px',fontWeight:700,color:'#C4B5FD',marginBottom:'14px',display:'flex',alignItems:'center',gap:'7px'}}><span style={{background:'rgba(124,58,237,.20)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>3</span>Servicos / Procedimentos</p>
                  {itens.map((item,idx)=>(
                    <div key={item.id} style={{background:'rgba(15,23,42,.5)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'14px',padding:'14px',marginBottom:'10px'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                        <p style={{fontSize:'12px',fontWeight:600,color:'#94A3B8'}}>Item {idx+1}</p>
                        {itens.length>1&&<button onClick={()=>rmItem(item.id)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.24)',color:'#F87171',borderRadius:'8px',padding:'4px 10px',fontSize:'11px',cursor:'pointer',fontFamily:'inherit'}}>Remover</button>}
                      </div>
                      <div className="fg3" style={{marginBottom:'8px'}}>
                        <div><label className="lbl">Servico / procedimento</label><input className="inp" style={{height:'42px'}} type="text" placeholder="Ex: Corte, limpeza..." value={item.nome} onChange={e=>updItem(item.id,'nome',e.target.value)}/></div>
                        <div><label className="lbl">Qtd</label><input className="inp" style={{height:'42px'}} type="number" min={1} value={item.qtd} onChange={e=>updItem(item.id,'qtd',parseInt(e.target.value)||1)}/></div>
                        <div><label className="lbl">Valor unit.</label><div style={{position:'relative'}}><span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'#64748B'}}>R$</span><input className="inp" style={{height:'42px',paddingLeft:'32px'}} type="text" inputMode="decimal" placeholder="0,00" value={item.valor||''} onChange={e=>updItem(item.id,'valor',parseFloat(e.target.value.replace(',','.'))||0)}/></div></div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                        <input className="inp" style={{height:'38px',fontSize:'12px'}} type="text" placeholder="Observacao do item (opcional)" value={item.obs} onChange={e=>updItem(item.id,'obs',e.target.value)}/>
                        <span style={{marginLeft:'12px',fontSize:'13px',fontWeight:700,color:'#4ADE80',flexShrink:0}}>{fBRL(item.qtd*item.valor)}</span>
                      </div>
                    </div>
                  ))}
                  <button onClick={addItem} style={{width:'100%',background:'rgba(124,58,237,.10)',border:'1.5px dashed rgba(124,58,237,.30)',borderRadius:'12px',color:'#C4B5FD',padding:'12px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all .18s'}}>+ Adicionar servico</button>
                  <div style={{marginTop:'14px',padding:'12px 14px',background:'rgba(15,23,42,.5)',borderRadius:'12px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}><span style={{fontSize:'12px',color:'#94A3B8'}}>Subtotal</span><span style={{fontSize:'13px',color:'#CBD5E1',fontWeight:600}}>{fBRL(subtotalComum)}</span></div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                      <span style={{fontSize:'12px',color:'#94A3B8'}}>Desconto</span>
                      <div style={{position:'relative'}}><span style={{position:'absolute',left:'8px',top:'50%',transform:'translateY(-50%)',fontSize:'11px',color:'#64748B'}}>R$</span><input type="text" inputMode="decimal" value={desconto||''} onChange={e=>setDesconto(parseFloat(e.target.value.replace(',','.'))||0)} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'8px',color:'#F8FAFC',padding:'4px 8px 4px 28px',width:'100px',fontSize:'12px',outline:'none',fontFamily:'inherit'}}/></div>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid rgba(148,163,184,.12)',paddingTop:'8px'}}><span style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC'}}>Total</span><span style={{fontSize:'16px',fontWeight:800,color:'#4ADE80'}}>{fBRL(total)}</span></div>
                  </div>
                </div>
              )}

              {/* Bloco 3 - Odonto */}
              {tipo==='odonto'&&(
                <div className="crd">
                  <p style={{fontSize:'13px',fontWeight:700,color:'#C4B5FD',marginBottom:'14px',display:'flex',alignItems:'center',gap:'7px'}}><span style={{background:'rgba(124,58,237,.20)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>3</span>Procedimentos odontologicos</p>
                  {procs.map((proc,idx)=>(
                    <div key={proc.id} style={{background:'rgba(15,23,42,.5)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'14px',padding:'16px',marginBottom:'12px'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                        <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC'}}>Procedimento {idx+1}</p>
                        {procs.length>1&&<button onClick={()=>rmProc(proc.id)} style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.24)',color:'#F87171',borderRadius:'8px',padding:'4px 10px',fontSize:'11px',cursor:'pointer',fontFamily:'inherit'}}>Remover</button>}
                      </div>
                      <div style={{marginBottom:'10px'}}><label className="lbl">Nome do procedimento</label><input className="inp" type="text" placeholder="Ex: Canal, extracao, clareamento..." value={proc.nome} onChange={e=>updProc(proc.id,'nome',e.target.value)}/></div>
                      <Odontograma selecionados={proc.dentes} onChange={d=>updProc(proc.id,'dentes',d)}/>
                      <div className="fg2" style={{marginTop:'10px',marginBottom:'8px'}}>
                        <div><label className="lbl">Sessoes / Qtd</label><input className="inp" style={{height:'42px'}} type="number" min={1} value={proc.qtd} onChange={e=>updProc(proc.id,'qtd',parseInt(e.target.value)||1)}/></div>
                        <div><label className="lbl">Valor unit.</label><div style={{position:'relative'}}><span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'#64748B'}}>R$</span><input className="inp" style={{height:'42px',paddingLeft:'32px'}} type="text" inputMode="decimal" placeholder="0,00" value={proc.valor||''} onChange={e=>updProc(proc.id,'valor',parseFloat(e.target.value.replace(',','.'))||0)}/></div></div>
                      </div>
                      <div className="fg2" style={{marginBottom:'8px'}}>
                        <div><label className="lbl">Status</label><select className="inp" style={{height:'42px'}} value={proc.status} onChange={e=>updProc(proc.id,'status',e.target.value)}><option value="planejado">Planejado</option><option value="em_andamento">Em andamento</option><option value="concluido">Concluido</option></select></div>
                        <div style={{display:'flex',alignItems:'flex-end'}}><p style={{fontSize:'15px',fontWeight:800,color:'#4ADE80',padding:'0 0 6px 4px'}}>{fBRL(proc.qtd*proc.valor)}</p></div>
                      </div>
                      <div><label className="lbl">Observacao</label><input className="inp" style={{height:'38px',fontSize:'12px'}} type="text" placeholder="Observacao do procedimento..." value={proc.obs} onChange={e=>updProc(proc.id,'obs',e.target.value)}/></div>
                    </div>
                  ))}
                  <button onClick={addProc} style={{width:'100%',background:'rgba(124,58,237,.10)',border:'1.5px dashed rgba(124,58,237,.30)',borderRadius:'12px',color:'#C4B5FD',padding:'12px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ Adicionar procedimento</button>
                  <div style={{marginTop:'14px',padding:'12px 14px',background:'rgba(15,23,42,.5)',borderRadius:'12px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}><span style={{fontSize:'12px',color:'#94A3B8'}}>Subtotal</span><span style={{fontSize:'13px',color:'#CBD5E1',fontWeight:600}}>{fBRL(subtotalOdonto)}</span></div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                      <span style={{fontSize:'12px',color:'#94A3B8'}}>Desconto</span>
                      <div style={{position:'relative'}}><span style={{position:'absolute',left:'8px',top:'50%',transform:'translateY(-50%)',fontSize:'11px',color:'#64748B'}}>R$</span><input type="text" inputMode="decimal" value={desconto||''} onChange={e=>setDesconto(parseFloat(e.target.value.replace(',','.'))||0)} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'8px',color:'#F8FAFC',padding:'4px 8px 4px 28px',width:'100px',fontSize:'12px',outline:'none',fontFamily:'inherit'}}/></div>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid rgba(148,163,184,.12)',paddingTop:'8px'}}><span style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC'}}>Total</span><span style={{fontSize:'16px',fontWeight:800,color:'#4ADE80'}}>{fBRL(total)}</span></div>
                  </div>
                </div>
              )}

              {/* Pagamento */}
              <div className="crd">
                <p style={{fontSize:'13px',fontWeight:700,color:'#C4B5FD',marginBottom:'14px',display:'flex',alignItems:'center',gap:'7px'}}><span style={{background:'rgba(124,58,237,.20)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>4</span>Pagamento e status</p>
                <div className="fg2">
                  <div><label className="lbl">Status</label><select className="inp" value={status} onChange={e=>setStatus(e.target.value)}><option value="aberto">Aberto</option><option value="aguardando_aprovacao">Aguardando aprovacao</option><option value="em_andamento">Em andamento</option><option value="parcialmente_pago">Parcialmente pago</option><option value="pago">Pago</option><option value="finalizado">Finalizado</option><option value="cancelado">Cancelado</option></select></div>
                  <div><label className="lbl">Vencimento</label><input className="inp" type="date" value={vencimento} onChange={e=>setVencimento(e.target.value)}/></div>
                </div>
              </div>

            </div>

            {/* Resumo lateral */}
            <div style={{width:'280px',flexShrink:0}} className="resumo">
              <div className="crd" style={{border:'1.5px solid rgba(124,58,237,.28)'}}>
                <p style={{fontSize:'13px',fontWeight:700,color:'#C4B5FD',marginBottom:'14px'}}>Resumo do orcamento</p>
                <div style={{marginBottom:'12px'}}>
                  <p style={{fontSize:'11px',color:'#64748B',marginBottom:'2px'}}>Cliente</p>
                  <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC'}}>{fNome||'—'}</p>
                  {fWpp&&<p style={{fontSize:'11px',color:'#64748B'}}>{fWpp}</p>}
                </div>
                <div style={{marginBottom:'12px'}}>
                  <p style={{fontSize:'11px',color:'#64748B',marginBottom:'2px'}}>Tipo</p>
                  <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC'}}>{tipo==='comum'?'Orcamento comum':'Tratamento odontologico'}</p>
                </div>
                <div style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.20)',borderRadius:'12px',padding:'12px',marginBottom:'14px',textAlign:'center' as const}}>
                  <p style={{fontSize:'11px',color:'#64748B',marginBottom:'3px'}}>Total</p>
                  <p style={{fontSize:'24px',fontWeight:800,color:'#4ADE80'}}>{fBRL(total)}</p>
                  {desconto>0&&<p style={{fontSize:'11px',color:'#64748B'}}>Desconto: {fBRL(desconto)}</p>}
                </div>
                <div style={{display:'flex',flexDirection:'column' as const,gap:'8px'}}>
                  <button onClick={()=>salvar('criar')} disabled={salvando} className="btn-p" style={{opacity:salvando?.7:1}}>{salvando?'Salvando...':'✓ Criar orcamento'}</button>
                  <button onClick={enviarWpp} style={{width:'100%',background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.28)',color:'#4ADE80',borderRadius:'12px',height:'40px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>💬 Enviar no WhatsApp</button>
                  <button onClick={()=>window.print()} style={{width:'100%',background:'rgba(59,130,246,.10)',border:'1px solid rgba(59,130,246,.24)',color:'#93C5FD',borderRadius:'12px',height:'40px',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>🖨 Gerar PDF</button>
                  <button onClick={()=>salvar('rascunho')} style={{width:'100%',background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.20)',color:'#94A3B8',borderRadius:'12px',height:'38px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Salvar como rascunho</button>
                </div>
              </div>
            </div>

          </div>
        </div></div>
      </div>
    </div>
  )
}
