'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const GRAD='linear-gradient(135deg,#2563EB,#4F46E5)'
const CATS=['Barbearia / Salão','Estética','Clínica','Odontologia','Outros']

const SB=[
  {href:'/painel',l:'Início'},{href:'/painel/agendamentos',l:'Agenda'},
  {href:'/painel/clientes',l:'Clientes'},{href:'/painel/orcamentos',l:'Orçamentos'},
  {href:'/painel/cobrancas',l:'Cobranças'},{href:'/painel/pagamentos',l:'Pagamentos'},
  {href:'/painel/servicos',l:'Serviços',on:true},
  {href:'/painel/profissionais',l:'Profissionais'},{href:'/painel/relatorio',l:'Relatórios'},
  {href:'/painel/perfil',l:'Configurações'},
]

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#07111F}
input,select,textarea{color-scheme:dark}
select option{background:#0B1628;color:#F8FAFC}
.sb{width:250px;min-height:100vh;background:#0A1322;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.sb-logo{padding:20px 18px 16px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px}
.sb-ic{width:30px;height:30px;border-radius:8px;background:${GRAD};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 18px rgba(124,58,237,.4)}
.sb nav{flex:1;padding:10px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:500;color:#CBD5E1;transition:all .15s;border:1px solid transparent}
.nl:hover{background:rgba(59,130,246,.08);color:#fff}
.nl.on{background:${GRAD};color:#fff;font-weight:700;box-shadow:0 8px 24px rgba(37,99,235,.25);border-color:rgba(255,255,255,.10)}
.sb-foot{padding:12px;border-top:1px solid rgba(255,255,255,.06)}
.mhdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(7,17,31,.96);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.06);position:sticky;top:0;z-index:20;width:100%;max-width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:#0A1322;z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,.06)}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:250px;flex:1;min-height:100vh;width:calc(100% - 250px);max-width:calc(100% - 250px)}
.pg{background:radial-gradient(circle at 15% 10%,rgba(219,39,119,.08),transparent 32%),radial-gradient(circle at 85% 10%,rgba(37,99,235,.07),transparent 30%),linear-gradient(180deg,#07111F,#081421);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1200px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.btn-p{background:${GRAD};color:#fff;border:1px solid rgba(255,255,255,.10);border-radius:12px;height:44px;padding:0 18px;font-size:13px;font-weight:700;box-shadow:0 8px 22px rgba(37,99,235,.24);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 12px 30px rgba(37,99,235,.34)}
.btn-s{background:rgba(15,23,42,.7);color:#CBD5E1;border:1px solid rgba(255,255,255,.10);border-radius:12px;height:42px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-s:hover{border-color:rgba(59,130,246,.28);color:#fff}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.srv-card{background:#0F1B2E;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:16px 18px;margin-bottom:8px;transition:all .18s;overflow:hidden}
.srv-card:hover{border-color:rgba(219,39,119,.20);box-shadow:0 8px 24px rgba(0,0,0,.22)}
.pill{padding:0 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,.10);transition:all .18s;white-space:nowrap;background:rgba(15,23,42,.5);color:#94A3B8;height:34px;display:inline-flex;align-items:center}
.pill:hover{border-color:rgba(255,255,255,.20);color:#CBD5E1}
.pill.on{background:rgba(219,39,119,.14);border:1px solid rgba(219,39,119,.38);color:#F8FAFC}
.srch{width:100%;background:#0E1728;border:1.5px solid rgba(255,255,255,.10);border-radius:12px;padding:0 16px 0 42px;height:46px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s}
.srch:focus{border-color:rgba(219,39,119,.45);box-shadow:0 0 0 3px rgba(219,39,119,.10)}
.inp{width:100%;background:#0E1728;border:1.5px solid rgba(255,255,255,.10);border-radius:12px;padding:0 14px;height:46px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s;display:block}
.inp:focus{border-color:rgba(37,99,235,.5);box-shadow:0 0 0 3px rgba(37,99,235,.10)}
.lbl{font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:6px}
.srv-act{border-radius:8px;padding:0 10px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .2s;font-family:inherit;display:inline-flex;align-items:center;gap:3px;white-space:nowrap;height:30px}
.srv-act:hover{filter:brightness(1.15)}
@media(max-width:1023px){
  .sb{display:none!important}
  .main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mhdr{display:flex!important}
  .bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .hdr-row{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .hdr-btns a,.hdr-btns button{flex:1!important;justify-content:center!important}
  .pills-row{overflow-x:auto!important;display:flex!important;gap:5px!important;flex-wrap:nowrap!important;scrollbar-width:none!important;padding-bottom:2px!important}
  .pills-row::-webkit-scrollbar{display:none!important}
  .srv-card-inner{flex-direction:column!important;gap:10px!important}
  .srv-acts{display:grid!important;grid-template-columns:1fr 1fr!important;gap:6px!important;width:100%!important}
  .srv-acts .srv-act{width:100%!important;height:34px!important;font-size:12px!important;justify-content:center!important}
  .fg2{grid-template-columns:1fr!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
`

type Servico={id:string;nome:string;categoria:string;valor:number|null;duracao:number|null;profissional_nome:string|null;ativo:boolean;odonto:boolean;desc:string|null}

export default function Servicos(){
  const [perfil,setPerfil]=useState<any>(null)
  const [servicos,setServicos]=useState<Servico[]>([])
  const [profs,setProfs]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [busca,setBusca]=useState('')
  const [filtro,setFiltro]=useState('todos')
  const [msg,setMsg]=useState('')
  const [showForm,setShowForm]=useState(false)
  const [salvando,setSalvando]=useState(false)
  const [editId,setEditId]=useState<string|null>(null)

  const [fNome,setFNome]=useState('')
  const [fCat,setFCat]=useState('Barbearia / Salão')
  const [fValor,setFValor]=useState('')
  const [fDur,setFDur]=useState('')
  const [fProf,setFProf]=useState('')
  const [fDesc,setFDesc]=useState('')
  const [fAtivo,setFAtivo]=useState(true)
  const [fOdonto,setFOdonto]=useState(false)

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:sv},{data:pr}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('servicos').select('*').eq('user_id',user.id).order('nome'),
      supabase.from('profissionais').select('id,nome').eq('user_id',user.id).order('nome'),
    ])
    setPerfil(p);setServicos(sv||[]);setProfs(pr||[]);setLoading(false)
  }

  function resetForm(){setFNome('');setFCat('Barbearia / Salão');setFValor('');setFDur('');setFProf('');setFDesc('');setFAtivo(true);setFOdonto(false);setEditId(null)}

  function abrirForm(s?:Servico){
    if(s){setFNome(s.nome);setFCat(s.categoria||'Barbearia / Salão');setFValor(s.valor?.toString()||'');setFDur(s.duracao?.toString()||'');setFProf(s.profissional_nome||'');setFDesc(s.desc||'');setFAtivo(s.ativo!==false);setFOdonto(!!s.odonto);setEditId(s.id)}
    else resetForm()
    setShowForm(true)
  }

  async function salvar(){
    if(!fNome.trim()){setMsg('⚠ Informe o nome.');return}
    setSalvando(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSalvando(false);return}
    const payload={user_id:user.id,nome:fNome.trim(),categoria:fCat,valor:fValor?parseFloat(fValor):null,duracao:fDur?parseInt(fDur):null,profissional_nome:fProf||null,desc:fDesc.trim()||null,ativo:fAtivo,odonto:fOdonto}
    if(editId){
      // Update no banco
      await supabase.from('servicos').update({
        nome:fNome.trim(),categoria:fCat,
        valor:fValor?parseFloat(fValor):null,
        duracao:fDur?parseInt(fDur):null,
        profissional_nome:fProf||null,
        desc:fDesc.trim()||null,
        ativo:fAtivo,odonto:fOdonto,
      }).eq('id',editId)
      // Atualiza lista local imediatamente — não depende do retorno do Supabase
      const idToUpdate=editId
      setServicos(prev=>prev.map(s=>s.id===idToUpdate?{
        ...s,
        nome:fNome.trim(),categoria:fCat,
        valor:fValor?parseFloat(fValor):null,
        duracao:fDur?parseInt(fDur):null,
        profissional_nome:fProf||null,
        desc:fDesc.trim()||null,
        ativo:fAtivo,odonto:fOdonto,
      }:s).sort((a,b)=>a.nome.localeCompare(b.nome)))
      setMsg('Serviço atualizado! ✓')
    } else {
      const {data:novo}=await supabase.from('servicos').insert(payload).select('*').single()
      if(novo) setServicos(prev=>[...prev,novo].sort((a,b)=>a.nome.localeCompare(b.nome)))
      setMsg('Serviço cadastrado! ✓')
    }
    resetForm();setShowForm(false)
    setTimeout(()=>setMsg(''),2500)
    setSalvando(false)
  }

  async function toggleAtivo(s:Servico){
    await supabase.from('servicos').update({ativo:!s.ativo}).eq('id',s.id)
    setServicos(prev=>prev.map(x=>x.id===s.id?{...x,ativo:!s.ativo}:x))
  }

  async function excluir(id:string,nome:string){
    if(!confirm(`Remover "${nome}"?`)) return
    await supabase.from('servicos').delete().eq('id',id)
    setServicos(prev=>prev.filter(s=>s.id!==id))
    setMsg('Serviço removido.');setTimeout(()=>setMsg(''),2000)
  }

  const filtrados=servicos.filter(s=>{
    const q=busca.toLowerCase()
    const mb=!busca||(s.nome?.toLowerCase().includes(q)||s.categoria?.toLowerCase().includes(q))
    if(!mb) return false
    if(filtro==='ativos') return s.ativo!==false
    if(filtro==='inativos') return s.ativo===false
    if(filtro==='odonto') return !!s.odonto
    const cats:Record<string,string>={'barbsalao':'Barbearia / Salão','estetica':'Estética','clinica':'Clínica','odonto2':'Odontologia'}
    if(cats[filtro]) return s.categoria===cats[filtro]
    return true
  })

  const valorMedio=servicos.filter(s=>s.valor&&s.ativo!==false).reduce((a,s,_,arr)=>a+(s.valor||0)/arr.length,0)
  const cats=new Set(servicos.map(s=>s.categoria).filter(Boolean)).size
  const nome=perfil?.nome_negocio||''
  const ini=(nome||'S').charAt(0).toUpperCase()
  const ABGR='linear-gradient(135deg,#2563EB,#4F46E5)'

  const Sidebar=()=>(
    <aside className="sb">
      <div className="sb-logo">
        <div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
      </div>
      <nav>{SB.map(it=><Link key={it.l+it.href} href={it.href} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot">
        <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.8)',border:'1px solid rgba(255,255,255,.06)',borderRadius:'10px',padding:'10px 12px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:ABGR,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
          <div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div>
        </div>
      </div>
    </aside>
  )

  if(loading)return(<div style={{minHeight:'100vh',background:'#07111F',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando serviços...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#07111F',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drw${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span>
          <button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button>
        </div>
        <nav style={{flex:1,padding:'10px',overflowY:'auto'}}>{SB.map(it=><Link key={it.l+it.href} href={it.href} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}>{it.l}</Link>)}</nav>
      </div>
      <Sidebar/>
      <div className="main">
        <div className="mhdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            {[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:`${w}px`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Serviços</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:ABGR,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">

          {msg&&<div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'rgba(219,39,119,.18)',border:'1px solid rgba(219,39,119,.40)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#F472B6',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{msg}</div>}

          {/* Header */}
          <div className="hdr-row" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'24px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Serviços / Procedimentos</h1>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5}}>Cadastre serviços, procedimentos, valores, duração e profissionais responsáveis.</p>
            </div>
            <div className="hdr-btns" style={{display:'flex',gap:'8px',flexShrink:0}}>
              <button onClick={()=>abrirForm()} className="btn-p">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {showForm&&!editId?'Cancelar':'Novo serviço'}
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {l:'Total cadastrado',v:servicos.length,c:'#F472B6',bg:'rgba(219,39,119,.08)',bd:'rgba(219,39,119,.18)',ico:'📋'},
              {l:'Serviços ativos',v:servicos.filter(s=>s.ativo!==false).length,c:'#4ADE80',bg:'rgba(34,197,94,.08)',bd:'rgba(34,197,94,.18)',ico:'✓'},
              {l:'Categorias',v:cats,c:'#22D3EE',bg:'rgba(6,182,212,.08)',bd:'rgba(6,182,212,.18)',ico:'📁'},
              {l:'Valor médio',v:valorMedio>0?`R$ ${valorMedio.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`:'R$ —',c:'#FBBF24',bg:'rgba(245,158,11,.08)',bd:'rgba(245,158,11,.18)',ico:'💰'},
            ].map(k=>(
              <div key={k.l} style={{background:'#0F1B2E',border:`1px solid ${k.bd}`,borderRadius:'16px',padding:'16px',boxSizing:'border-box' as const}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',marginBottom:'8px'}}>{k.ico}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'3px'}}>{k.l}</p>
                <p style={{fontSize:'24px',fontWeight:800,color:k.c,lineHeight:1,letterSpacing:'-0.03em'}}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          {showForm&&(
            <div style={{background:'#0F1B2E',border:'1.5px solid rgba(219,39,119,.22)',borderRadius:'20px',padding:'22px',marginBottom:'18px',boxShadow:'0 12px 30px rgba(0,0,0,.28)'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#F472B6',marginBottom:'16px',display:'flex',alignItems:'center',gap:'7px'}}>
                <span style={{background:'rgba(219,39,119,.18)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>{editId?'Editar':'Novo'}</span>
                {editId?'Editar serviço':'Cadastrar serviço / procedimento'}
              </p>
              <div className="fg2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                <div style={{gridColumn:'1/-1'}}>
                  <label className="lbl">Nome do serviço / procedimento *</label>
                  <input className="inp" type="text" placeholder="Ex: Corte masculino, Canal, Restauração, Limpeza de pele..." value={fNome} onChange={e=>setFNome(e.target.value)}/>
                </div>
                <div>
                  <label className="lbl">Categoria</label>
                  <select className="inp" value={fCat} onChange={e=>setFCat(e.target.value)}>
                    {CATS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl">Profissional responsável</label>
                  <select className="inp" value={fProf} onChange={e=>setFProf(e.target.value)}>
                    <option value="">Todos os profissionais</option>
                    {profs.map((p:any)=><option key={p.id} value={p.nome}>{p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl">Valor (R$)</label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600,pointerEvents:'none'}}>R$</span>
                    <input className="inp" type="number" min="0" step="0.01" placeholder="0,00" value={fValor} onChange={e=>setFValor(e.target.value)} style={{paddingLeft:'36px'}}/>
                  </div>
                </div>
                <div>
                  <label className="lbl">Duração estimada (min)</label>
                  <div style={{position:'relative'}}>
                    <input className="inp" type="number" min="0" placeholder="Ex: 40" value={fDur} onChange={e=>setFDur(e.target.value)} style={{paddingRight:'48px'}}/>
                    <span style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'#64748B',pointerEvents:'none'}}>min</span>
                  </div>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label className="lbl">Descrição curta (opcional)</label>
                  <input className="inp" type="text" placeholder="Descrição breve do serviço..." value={fDesc} onChange={e=>setFDesc(e.target.value)}/>
                </div>
              </div>
              <div style={{display:'flex',gap:'16px',marginBottom:'16px',flexWrap:'wrap'}}>
                {[{val:fAtivo,set:setFAtivo,l:'Ativo',c:'#4ADE80'},{val:fOdonto,set:setFOdonto,l:'Procedimento odontológico',c:'#22D3EE'}].map(({val,set,l,c})=>(
                  <button key={l} onClick={()=>set(!val)} style={{display:'flex',alignItems:'center',gap:'8px',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:0}}>
                    <div style={{width:'36px',height:'20px',borderRadius:'999px',border:'none',cursor:'pointer',position:'relative',background:val?c:'rgba(255,255,255,.15)',transition:'background .2s',flexShrink:0}}>
                      <span style={{position:'absolute',top:'3px',left:val?'18px':'3px',width:'14px',height:'14px',borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                    </div>
                    <span style={{fontSize:'13px',color:'#CBD5E1'}}>{l}</span>
                  </button>
                ))}
              </div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <button onClick={salvar} disabled={salvando} className="btn-p" style={{opacity:salvando?.7:1}}>{salvando?'Salvando...':'✓ Salvar serviço'}</button>
                <button onClick={()=>{setShowForm(false);resetForm()}} className="btn-s">Cancelar</button>
              </div>
            </div>
          )}

          {/* Busca + Filtros */}
          <div style={{background:'#0F1B2E',border:'1px solid rgba(255,255,255,.08)',borderRadius:'16px',padding:'14px 16px',marginBottom:'16px'}}>
            <div style={{position:'relative',marginBottom:'10px'}}>
              <svg style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',color:'#64748B',pointerEvents:'none'}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="srch" placeholder="Buscar serviço, procedimento, categoria ou profissional..." value={busca} onChange={e=>setBusca(e.target.value)}/>
            </div>
            <div className="pills-row" style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              {[{v:'todos',l:'Todos'},{v:'ativos',l:'Ativos'},{v:'inativos',l:'Inativos'},{v:'barbsalao',l:'Barbearia / Salão'},{v:'estetica',l:'Estética'},{v:'clinica',l:'Clínica'},{v:'odonto',l:'Odontologia'}].map(f=>(
                <button key={f.v} className={`pill${filtro===f.v?' on':''}`} onClick={()=>setFiltro(f.v)}>{f.l}</button>
              ))}
            </div>
          </div>

          {/* Lista */}
          {filtrados.length===0?(
            <div style={{background:'#0F1B2E',border:'1px solid rgba(255,255,255,.08)',borderRadius:'20px',padding:'56px 24px',textAlign:'center'}}>
              <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'rgba(219,39,119,.10)',border:'1px solid rgba(219,39,119,.20)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',margin:'0 auto 16px'}}>📋</div>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'6px'}}>{busca?'Nenhum serviço encontrado':'Nenhum serviço cadastrado ainda'}</p>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5,maxWidth:'300px',margin:'0 auto 20px'}}>{busca?'Tente buscar com outro termo.':'Cadastre seus serviços ou procedimentos para usar na agenda, orçamentos e cobranças.'}</p>
              {!busca&&<button onClick={()=>abrirForm()} className="btn-p" style={{display:'inline-flex'}}>+ Criar primeiro serviço</button>}
            </div>
          ):(
            filtrados.map(s=>(
              <div key={s.id} className="srv-card">
                <div className="srv-card-inner" style={{display:'flex',alignItems:'center',gap:'14px'}}>
                  {/* Ícone */}
                  <div style={{width:'44px',height:'44px',borderRadius:'12px',background:s.odonto?'rgba(6,182,212,.12)':'rgba(59,130,246,.10)',border:`1px solid ${s.odonto?'rgba(6,182,212,.25)':'rgba(59,130,246,.18)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {s.odonto?(
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.5 2 6 5 6 8.5c0 2 .8 3.8 2 5V20a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6.5c1.2-1.2 2-3 2-5C18 5 15.5 2 12 2z"/></svg>
                    ):(
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><rect x="3" y="6" width="18" height="16" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'3px',flexWrap:'wrap'}}>
                      <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.nome}</p>
                      {s.ativo===false&&<span style={{fontSize:'10px',fontWeight:600,padding:'2px 7px',borderRadius:'999px',background:'rgba(71,85,105,.16)',color:'#94A3B8',border:'1px solid rgba(71,85,105,.25)',flexShrink:0}}>Inativo</span>}
                      {s.odonto&&<span style={{fontSize:'10px',fontWeight:600,padding:'2px 7px',borderRadius:'999px',background:'rgba(6,182,212,.12)',color:'#22D3EE',border:'1px solid rgba(6,182,212,.25)',flexShrink:0}}>Odonto</span>}
                    </div>
                    <div style={{display:'flex',gap:'12px',flexWrap:'wrap',alignItems:'center'}}>
                      {s.categoria&&<span style={{fontSize:'12px',color:'#64748B'}}>{s.categoria}</span>}
                      {s.valor!=null&&<span style={{fontSize:'13px',fontWeight:700,color:'#FBBF24'}}>R$ {s.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>}
                      {s.duracao&&<span style={{fontSize:'12px',color:'#64748B'}}>⏱ {s.duracao} min</span>}
                      {s.profissional_nome&&<span style={{fontSize:'12px',color:'#64748B'}}>👤 {s.profissional_nome}</span>}
                    </div>
                    {s.desc&&<p style={{fontSize:'11px',color:'#374151',marginTop:'3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.desc}</p>}
                  </div>
                  {/* Ações */}
                  <div className="srv-acts" style={{display:'flex',gap:'5px',flexShrink:0,flexWrap:'wrap',justifyContent:'flex-end'}}>
                    <button onClick={()=>abrirForm(s)} className="srv-act" style={{background:'rgba(37,99,235,.10)',border:'1px solid rgba(37,99,235,.25)',color:'#60A5FA'}}>✏ Editar</button>
                    <button onClick={()=>toggleAtivo(s)} className="srv-act" style={{background:s.ativo!==false?'rgba(245,158,11,.08)':'rgba(34,197,94,.08)',border:`1px solid ${s.ativo!==false?'rgba(245,158,11,.22)':'rgba(34,197,94,.22)'}`,color:s.ativo!==false?'#FBBF24':'#4ADE80'}}>
                      {s.ativo!==false?'Desativar':'Ativar'}
                    </button>
                    <button onClick={()=>excluir(s.id,s.nome)} className="srv-act" style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.20)',color:'#F87171'}}>✕</button>
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

