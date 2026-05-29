'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'
const SB=[
  {h:'/painel',l:'Inicio'},{h:'/painel/agendamentos',l:'Agenda'},
  {h:'/painel/clientes',l:'Clientes'},{h:'/painel/orcamentos',l:'Orcamentos',on:true},
  {h:'/painel/cobrancas',l:'Cobrancas'},{h:'/painel/pagamentos',l:'Pagamentos'},
  {h:'/painel/servicos',l:'Servicos'},{h:'/painel/profissionais',l:'Profissionais'},
  {h:'/painel/relatorio',l:'Relatorios'},{h:'/painel/perfil',l:'Configuracoes'},
]
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
.bdy{max-width:860px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04);padding:24px;margin-bottom:16px}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;height:48px;padding:0 24px;font-size:14px;font-weight:700;box-shadow:0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.26);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-p:hover{transform:translateY(-1px)}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:44px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.inp{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:0 14px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.14)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:7px}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:1023px){
  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mhdr{display:flex!important}.bdy{padding:14px 16px 80px!important}
  .fg2{grid-template-columns:1fr!important}
}
`

const STATUS=['aberto','aguardando_aprovacao','em_andamento','parcialmente_pago','pago','finalizado','cancelado']

export default function NovoOrcamento(){
  const router=useRouter()
  const [perfil,setPerfil]=useState<any>(null)
  const [clientes,setClientes]=useState<any[]>([])
  const [servicos,setServicos]=useState<any[]>([])
  const [mob,setMob]=useState(false)
  const [salvando,setSalvando]=useState(false)
  const [msg,setMsg]=useState('')

  const [fCliente,setFCliente]=useState('')
  const [fClienteId,setFClienteId]=useState('')
  const [fDescricao,setFDescricao]=useState('')
  const [fValorTotal,setFValorTotal]=useState('')
  const [fValorPago,setFValorPago]=useState('0')
  const [fStatus,setFStatus]=useState('aberto')
  const [fVencimento,setFVencimento]=useState('')
  const [fObs,setFObs]=useState('')
  const [showSugestoes,setShowSugestoes]=useState(false)

  useEffect(()=>{load()},[])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:cls},{data:svs}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('clientes').select('id,nome,whatsapp').eq('user_id',user.id).order('nome'),
      supabase.from('servicos').select('id,nome,preco').eq('user_id',user.id).order('nome'),
    ])
    setPerfil(p);setClientes(cls||[]);setServicos(svs||[])
  }

  const sugestoes=clientes.filter(c=>c.nome?.toLowerCase().includes(fCliente.toLowerCase())&&fCliente.length>0)

  async function salvar(){
    if(!fCliente.trim()||!fValorTotal){setMsg('Informe o cliente e o valor total.');return}
    setSalvando(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSalvando(false);return}
    const {data:novo,error}=await supabase.from('orcamentos').insert({
      user_id:user.id,
      cliente_nome:fCliente.trim(),
      cliente_id:fClienteId||null,
      descricao:fDescricao.trim()||null,
      valor_total:parseFloat(fValorTotal.replace(',','.')),
      valor_pago:parseFloat(fValorPago.replace(',','.')||'0'),
      status:fStatus,
      vencimento:fVencimento||null,
      observacoes:fObs.trim()||null,
    }).select('*').single()
    if(error){setMsg('Erro ao salvar. Tente novamente.');setSalvando(false);return}
    setMsg('Orcamento criado!')
    setTimeout(()=>router.push('/painel/orcamentos'),1200)
  }

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'O').charAt(0).toUpperCase()

  const Sb=()=>(
    <aside className="sb">
      <div className="sb-logo"><div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span></div>
      <nav>{SB.map(it=><Link key={it.l} href={it.h} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot"><div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}><div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div><div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negocio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div></div></div>
    </aside>
  )

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drw${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid rgba(148,163,184,.10)'}}><span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span><button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>x</button></div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{SB.map(it=><Link key={it.l} href={it.h} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}>{it.l}</Link>)}</nav>
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

          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px',flexWrap:'wrap'}}>
            <Link href="/painel/orcamentos" className="btn-s" style={{height:'36px',fontSize:'12px'}}>← Voltar</Link>
            <div><h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.03em'}}>Novo orcamento</h1><p style={{fontSize:'13px',color:'#64748B'}}>Crie um orcamento personalizado para seu cliente.</p></div>
          </div>

          {/* Cliente */}
          <div className="crd">
            <p style={{fontSize:'14px',fontWeight:700,color:'#C4B5FD',marginBottom:'16px',display:'flex',alignItems:'center',gap:'7px'}}><span style={{background:'rgba(124,58,237,.16)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>1</span>Cliente</p>
            <div style={{position:'relative'}}>
              <label className="lbl">Nome do cliente *</label>
              <input className="inp" type="text" placeholder="Digite o nome do cliente..." value={fCliente}
                onChange={e=>{setFCliente(e.target.value);setFClienteId('');setShowSugestoes(true)}}
                onBlur={()=>setTimeout(()=>setShowSugestoes(false),200)}/>
              {showSugestoes&&sugestoes.length>0&&(
                <div style={{position:'absolute',top:'100%',left:0,right:0,background:'rgba(8,20,33,.99)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'12px',zIndex:20,overflow:'hidden',marginTop:'4px'}}>
                  {sugestoes.slice(0,6).map(c=>(
                    <button key={c.id} onClick={()=>{setFCliente(c.nome);setFClienteId(c.id);setShowSugestoes(false)}}
                      style={{width:'100%',padding:'10px 14px',background:'none',border:'none',color:'#F8FAFC',textAlign:'left',cursor:'pointer',fontSize:'13px',borderBottom:'1px solid rgba(148,163,184,.08)'}}>
                      {c.nome}{c.whatsapp&&<span style={{color:'#64748B',marginLeft:'8px',fontSize:'11px'}}>{c.whatsapp}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detalhes */}
          <div className="crd">
            <p style={{fontSize:'14px',fontWeight:700,color:'#C4B5FD',marginBottom:'16px',display:'flex',alignItems:'center',gap:'7px'}}><span style={{background:'rgba(124,58,237,.16)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>2</span>Detalhes</p>
            <div style={{marginBottom:'12px'}}>
              <label className="lbl">Descricao / servico *</label>
              <input className="inp" type="text" placeholder="Ex: Tratamento odontologico, Corte + barba..." value={fDescricao} onChange={e=>setFDescricao(e.target.value)}/>
            </div>
            <div className="fg2" style={{marginBottom:'12px'}}>
              <div>
                <label className="lbl">Valor total *</label>
                <div style={{position:'relative'}}><span style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600,pointerEvents:'none'}}>R$</span><input className="inp" type="text" inputMode="decimal" placeholder="0,00" value={fValorTotal} onChange={e=>setFValorTotal(e.target.value)} style={{paddingLeft:'36px'}}/></div>
              </div>
              <div>
                <label className="lbl">Valor pago</label>
                <div style={{position:'relative'}}><span style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600,pointerEvents:'none'}}>R$</span><input className="inp" type="text" inputMode="decimal" placeholder="0,00" value={fValorPago} onChange={e=>setFValorPago(e.target.value)} style={{paddingLeft:'36px'}}/></div>
              </div>
            </div>
            <div className="fg2">
              <div>
                <label className="lbl">Status</label>
                <select className="inp" value={fStatus} onChange={e=>setFStatus(e.target.value)}>
                  {STATUS.map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="lbl">Vencimento</label>
                <input className="inp" type="date" value={fVencimento} onChange={e=>setFVencimento(e.target.value)}/>
              </div>
            </div>
          </div>

          {/* Observacoes */}
          <div className="crd">
            <p style={{fontSize:'14px',fontWeight:700,color:'#C4B5FD',marginBottom:'16px',display:'flex',alignItems:'center',gap:'7px'}}><span style={{background:'rgba(124,58,237,.16)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>3</span>Observacoes</p>
            <textarea className="inp" placeholder="Anotacoes, condicoes especiais, parcelamento..." value={fObs} onChange={e=>setFObs(e.target.value)} style={{height:'100px',padding:'12px 14px',resize:'none',lineHeight:1.5}}/>
          </div>

          <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
            <button onClick={salvar} disabled={salvando} className="btn-p" style={{opacity:salvando?.7:1}}>{salvando?'Salvando...':'✓ Criar orcamento'}</button>
            <Link href="/painel/orcamentos" className="btn-s">Cancelar</Link>
          </div>

        </div></div>
      </div>
    </div>
  )
}
