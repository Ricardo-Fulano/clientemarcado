'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Sparkles, Search, Plus, Pencil, Power, Trash2, Tag } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const FILTROS=['Todos','Ativos','Inativos','Barbearia / Salão','Estética','Clínica','Odontologia','Outros']
const CATEGORIAS=['Barbearia / Salão','Estética','Clínica','Odontologia','Outro']
const DURACOES=['10 min','15 min','20 min','30 min','45 min','60 min','90 min','120 min','Sem duração']
const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
select option{background:#07111F;color:#F8FAFC}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1200px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.16);border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.28)}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:12px;height:44px;padding:0 20px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none;box-shadow:0 8px 24px rgba(59,130,246,.28)}
.btn-p:hover{transform:translateY(-1px)}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;flex-shrink:0;transition:all .18s;font-family:inherit}.fil-sv{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;width:100%}.fil-sv .pill{flex-shrink:0;text-align:center;justify-content:center;display:flex;align-items:center;white-space:normal;font-size:11px;height:36px;padding:0 8px}@media(max-width:767px){.fil-sv{grid-template-columns:repeat(2,1fr)!important}.fil-sv .pill{height:40px!important;font-size:12px!important}}
.pill:hover{background:rgba(124,58,237,.10);border-color:rgba(124,58,237,.28);color:#fff}
.pill.on{background:${G};border-color:transparent;color:#fff}
.inp{width:100%;background:rgba(15,23,42,.88);border:1.5px solid rgba(148,163,184,.18);border-radius:12px;padding:0 14px;height:46px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.12)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:6px}
.sv-card{width:100%;box-sizing:border-box;padding:18px 20px}
.sv-acoes{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
@media(max-width:1023px){
  .psb-main .bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .topo-r{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .fg2{grid-template-columns:1fr!important}
  .fg3{grid-template-columns:1fr!important}
  .sv-acoes{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}
  .sv-acoes button{width:100%!important;justify-content:center!important}
  .sv-excluir{grid-column:1/-1!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
`
type Servico={id:string;nome:string;descricao?:string;preco?:number;duracao?:number;duracao_minutos?:number;categoria?:string;profissional_nome?:string;profissionais_ids?:string[];ativo:boolean}
type Profissional={id:string;nome:string}
export default function Servicos(){
  const [perfil,setPerfil]=useState<any>(null)
  const [servicos,setServicos]=useState<Servico[]>([])
  const [profs,setProfs]=useState<Profissional[]>([])
  const [loading,setLoading]=useState(true)
  const [busca,setBusca]=useState('')
  const [filtro,setFiltro]=useState('Todos')
  const [showForm,setShowForm]=useState(false)
  const [editId,setEditId]=useState<string|null>(null)
  const [msg,setMsg]=useState('')
  const [salvando,setSalvando]=useState(false)
  const [fNome,setFNome]=useState('')
  const [fDesc,setFDesc]=useState('')
  const [fPreco,setFPreco]=useState('')
  const [fDur,setFDur]=useState('30 min')
  const [fCat,setFCat]=useState('Barbearia / Salão')
  const [fProfTipo,setFProfTipo]=useState<'todos'|'especificos'>('especificos')
  const [fProfIds,setFProfIds]=useState<string[]>([])
  useEffect(()=>{load()},[])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:svs},{data:pr}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('servicos').select('*').eq('user_id',user.id).order('nome'),
      supabase.from('profissionais').select('id,nome').eq('user_id',user.id).order('nome'),
    ])
    setPerfil(p);setServicos(svs||[]);setProfs(pr||[]);setLoading(false)
  }
  function resetForm(){setFNome('');setFDesc('');setFPreco('');setFDur('30 min');setFCat('Barbearia / Salão');setFProfTipo('especificos');setFProfIds([]);setEditId(null)}
  function abrirEditar(s:Servico){
    setEditId(s.id);setFNome(s.nome);setFDesc(s.descricao||'')
    setFPreco(s.preco&&s.preco>0?String(s.preco):'')
    const durVal=s.duracao||s.duracao_minutos;setFDur(durVal?String(durVal).includes('min')?String(durVal):String(durVal)+' min':'30 min');setFCat(s.categoria||'Barbearia / Salão')
    if(s.profissionais_ids&&s.profissionais_ids.length>0){setFProfTipo('especificos');setFProfIds(s.profissionais_ids)}
    else{setFProfTipo('todos');setFProfIds([])}
    setShowForm(true);window.scrollTo({top:0,behavior:'smooth'})
  }
  function toggleProfId(id:string){setFProfIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])}
  async function salvar(){
    if(!fNome.trim()){setMsg('Informe o nome do servico.');return}
    if(fProfIds.length===0){setMsg('Selecione pelo menos um profissional para este servico.');setSalvando(false);return}
    setSalvando(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSalvando(false);return}
    const profNome=fProfTipo==='todos'?'Todos os profissionais':(fProfIds.length>0?`${fProfIds.length} profissional(is)`:null)
    const precoVal=parseFloat((fPreco||'0').replace(',','.'))||0
    const payload:any={
      nome:fNome.trim(),
      descricao:fDesc.trim()||null,
      preco:precoVal,
      duracao_minutos:parseInt(fDur)||null,duracao:parseInt(fDur)||null,
      categoria:fCat,
      profissional_nome:profNome,
    }
    let error:any=null
    if(editId){
      const {error:e}=await supabase.from('servicos').update(payload).eq('id',editId)
      error=e
    } else {
      const {error:e}=await supabase.from('servicos').insert({user_id:user.id,ativo:true,...payload})
      error=e
    }
    if(error){
      console.error('Erro ao salvar servico:',error)
      if(error.code==='PGRST204'||error.message?.includes('profissionais_ids')){
        delete payload.profissionais_ids
        if(editId){await supabase.from('servicos').update(payload).eq('id',editId)}
        else{await supabase.from('servicos').insert({user_id:user.id,ativo:true,...payload})}
      } else {
        setMsg('Erro ao salvar servico.');setSalvando(false);return
      }
    }
    await load();resetForm();setShowForm(false);setSalvando(false)
    setMsg(editId?'Servico atualizado!':'Servico cadastrado!');setTimeout(()=>setMsg(''),3000)
  }
  async function toggleAtivo(s:Servico){
    await supabase.from('servicos').update({ativo:!s.ativo}).eq('id',s.id);await load()
  }
  async function excluir(id:string){
    if(!confirm('Excluir este servico?'))return
    await supabase.from('servicos').delete().eq('id',id);await load()
  }
  const nome=perfil?.nome_negocio||''
  const fBRL=(v:number)=>`R$ ${(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
  const ativos=servicos.filter(s=>s.ativo).length
  const cats=new Set(servicos.filter(s=>s.categoria).map(s=>s.categoria)).size
  const comPreco=servicos.filter(s=>s.preco&&s.preco>0)
  const ticketMedio=comPreco.length>0?comPreco.reduce((a,s)=>a+(s.preco||0),0)/comPreco.length:0
  const filtrados=servicos.filter(s=>{
    const CATS_MAIN=['Barbearia / Salão','Estética','Clínica','Odontologia'];const passaF=filtro==='Todos'||(filtro==='Ativos'&&s.ativo)||(filtro==='Inativos'&&!s.ativo)||(filtro==='Outros'&&(!s.categoria||!CATS_MAIN.includes(s.categoria)))||s.categoria===filtro
    const passaB=!busca||[s.nome,s.descricao,s.categoria,s.profissional_nome].some(v=>v?.toLowerCase().includes(busca.toLowerCase()))
    return passaF&&passaB
  })
  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)
  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar nome={nome} tituloMobile="Servicos"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">
          {msg&&<div style={{position:'fixed',top:'72px',left:'50%',transform:'translateX(-50%)',background:'rgba(124,58,237,.18)',border:'1px solid rgba(124,58,237,.36)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#C4B5FD',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{msg}</div>}
          <div className="topo-r" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Servicos / Procedimentos</h1>
              <p style={{fontSize:'13px',color:'#64748B'}}>Cadastre servicos, procedimentos, valores, duracao e profissionais responsaveis.</p>
            </div>
            <div style={{flexShrink:0}}>
              <button onClick={()=>{resetForm();setShowForm(!showForm)}} className="btn-p"><Plus size={15}/>Novo servico</button>
            </div>
          </div>
          {showForm&&(
            <div className="crd" style={{padding:'24px',marginBottom:'20px',border:'1.5px solid rgba(124,58,237,.28)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'18px'}}>
                <p style={{fontSize:'15px',fontWeight:700,color:'#C4B5FD'}}>{editId?'Editar servico':'Novo servico'}</p>
                <button onClick={()=>{resetForm();setShowForm(false)}} style={{background:'none',border:'none',color:'#64748B',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button>
              </div>
              <div className="fg2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
                <div><label className="lbl">Nome do servico *</label><input className="inp" type="text" placeholder="Ex: Corte masculino, Canal, Limpeza de pele..." value={fNome} onChange={e=>setFNome(e.target.value)}/></div>
                <div>
                  <label className="lbl">Valor (R$) <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,color:'#475569'}}>— opcional</span></label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600}}>R$</span>
                    <input className="inp" type="text" inputMode="decimal" placeholder="0,00" value={fPreco} onChange={e=>setFPreco(e.target.value)} style={{paddingLeft:'36px'}}/>
                  </div>
                  <p style={{fontSize:'11px',color:'#475569',marginTop:'5px',lineHeight:1.5}}>Deixe vazio para retornos, avaliações ou atendimentos sem cobrança.</p>
                </div>
              </div>
              <div className="fg2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
                <div><label className="lbl">Duracao</label><select className="inp" style={{cursor:'pointer'}} value={fDur} onChange={e=>setFDur(e.target.value)}>{DURACOES.map(d=><option key={d}>{d}</option>)}</select></div>
                <div><label className="lbl">Categoria</label><select className="inp" style={{cursor:'pointer'}} value={fCat} onChange={e=>setFCat(e.target.value)}>{CATEGORIAS.map(c=><option key={c}>{c}</option>)}</select></div>
              </div>
              <div style={{marginBottom:'14px'}}>
                <label className="lbl">Profissionais que realizam esse servico</label>
                <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
                  {(['todos','especificos'] as const).map(t=>(
                    <button key={t} type="button" onClick={()=>{setFProfTipo(t);if(t==='todos')setFProfIds([])}}
                      style={{height:'36px',padding:'0 14px',borderRadius:'8px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',border:`1px solid ${fProfTipo===t?'rgba(124,58,237,.5)':'rgba(148,163,184,.2)'}`,background:fProfTipo===t?'rgba(124,58,237,.18)':'rgba(15,23,42,.88)',color:fProfTipo===t?'#C4B5FD':'#94A3B8'}}>
                      {t==='todos'?'Todos os profissionais':'Selecionar especificos'}
                    </button>
                  ))}
                </div>
                {fProfTipo==='especificos'&&(
                  <div style={{display:'flex',flexDirection:'column',gap:'8px',padding:'14px',background:'rgba(124,58,237,.08)',border:'1px solid rgba(124,58,237,.18)',borderRadius:'10px'}}>
                    {profs.length===0?<p style={{fontSize:'12px',color:'#64748B'}}>Nenhum profissional cadastrado ainda.</p>
                    :profs.map(p=>(
                      <label key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer'}}>
                        <input type="checkbox" checked={fProfIds.includes(p.id)} onChange={()=>toggleProfId(p.id)}
                          style={{width:'16px',height:'16px',accentColor:'#7C3AED',cursor:'pointer'}}/>
                        <span style={{fontSize:'13px',color:'#F8FAFC',fontWeight:500}}>{p.nome}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div style={{marginBottom:'16px'}}><label className="lbl">Descricao (opcional)</label><input className="inp" type="text" placeholder="Detalhes extras sobre o servico ou procedimento..." value={fDesc} onChange={e=>setFDesc(e.target.value)}/></div>
              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={salvar} disabled={salvando} className="btn-p" style={{opacity:salvando?.7:1}}>{salvando?'Salvando...':'Salvar servico'}</button>
                <button onClick={()=>{resetForm();setShowForm(false)}} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.20)',borderRadius:'10px',height:'44px',padding:'0 16px',fontSize:'13px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
              </div>
            </div>
          )}
          <div className="kpi-grid">
            {[
              {l:'TOTAL CADASTRADO',sub:'Servicos e procedimentos',v:servicos.length,fmt:'n',c:'#60A5FA',bg:'rgba(59,130,246,.10)',bd:'rgba(59,130,246,.22)',I:Sparkles},
              {l:'SERVICOS ATIVOS',sub:'Disponíveis para agendamento',v:ativos,fmt:'n',c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.28)',I:Tag},
              {l:'CATEGORIAS',sub:'Tipos de servico',v:cats||0,fmt:'n',c:'#94A3B8',bg:'rgba(148,163,184,.08)',bd:'rgba(148,163,184,.20)',I:Tag},
              {l:'VALOR MEDIO',sub:comPreco.length>0?'Media dos servicos com preco':'Sem valores cadastrados',v:ticketMedio,fmt:'brl',c:'#60A5FA',bg:'rgba(59,130,246,.10)',bd:'rgba(96,165,250,.22)',I:Tag},
            ].map(k=>(
              <div key={k.l} className="crd" style={{padding:'18px 16px',background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'10px'}}><k.I size={18} color={k.c}/></div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'3px'}}>{k.l}</p>
                <p style={{fontSize:'11px',color:'#64748B',marginBottom:'6px'}}>{k.sub}</p>
                <p style={{fontSize:'24px',fontWeight:800,color:k.c,lineHeight:1}}>{k.fmt==='brl'?fBRL(k.v as number):k.v}</p>
              </div>
            ))}
          </div>
          <div style={{position:'relative',marginBottom:'12px'}}>
            <Search size={15} color="#64748B" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
            <input type="text" placeholder="Buscar servico, categoria ou profissional..." value={busca} onChange={e=>setBusca(e.target.value)}
              style={{width:'100%',background:'rgba(15,23,42,.88)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'12px',padding:'11px 16px 11px 42px',fontSize:'13px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
          </div>
          <div className="fil-sv">
            {FILTROS.map(f=>(<button key={f} onClick={()=>setFiltro(f)} className={`pill${filtro===f?' on':''}`}>{f}</button>))}
          </div>
          {filtrados.length===0?(
            <div className="crd" style={{padding:'56px 24px',textAlign:'center'}}>
              <div style={{width:'60px',height:'60px',borderRadius:'18px',background:'rgba(59,130,246,.10)',border:'1px solid rgba(59,130,246,.22)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}><Sparkles size={26} color="#60A5FA"/></div>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>Nenhum servico cadastrado</p>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.6,marginBottom:'24px',maxWidth:'380px',margin:'0 auto 24px'}}>Cadastre servicos ou procedimentos para comecar a organizar sua agenda e seus orcamentos.</p>
              <button onClick={()=>{resetForm();setShowForm(true)}} className="btn-p" style={{display:'inline-flex'}}><Plus size={15}/>Novo servico</button>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {filtrados.map(s=>{
                const profLabel=s.profissional_nome||'Todos os profissionais'
                const ehGratuito=!s.preco||s.preco===0
                return(
                  <div key={s.id} className="crd sv-card" style={{background:s.ativo?'radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))':'linear-gradient(145deg,rgba(10,18,30,.98),rgba(6,14,24,.99))',border:`1.5px solid ${s.ativo?'rgba(148,163,184,.18)':'rgba(148,163,184,.10)'}`}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',marginBottom:'10px',flexWrap:'wrap'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',minWidth:0}}>
                        <div style={{width:'38px',height:'38px',borderRadius:'10px',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.22)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Sparkles size={18} color="#60A5FA"/></div>
                        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.nome}</p>
                      </div>
                      <div style={{display:'flex',gap:'6px',alignItems:'center',flexShrink:0}}>
                        {ehGratuito&&<span style={{fontSize:'10px',fontWeight:700,padding:'3px 8px',borderRadius:'999px',background:'rgba(148,163,184,.10)',color:'#64748B',border:'1px solid rgba(148,163,184,.16)'}}>Gratuito</span>}
                        <span style={{fontSize:'11px',fontWeight:700,padding:'4px 12px',borderRadius:'999px',background:s.ativo?'rgba(34,197,94,.14)':'rgba(148,163,184,.10)',color:s.ativo?'#4ADE80':'#94A3B8',border:`1px solid ${s.ativo?'rgba(34,197,94,.28)':'rgba(148,163,184,.16)'}`}}>{s.ativo?'Ativo':'Inativo'}</span>
                      </div>
                    </div>
                    {!ehGratuito&&<p style={{fontSize:'20px',fontWeight:800,color:'#22C55E',marginBottom:'8px'}}>{fBRL(s.preco||0)}</p>}
                    <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'12px'}}>
                      {s.duracao&&<span style={{fontSize:'11px',color:'#94A3B8',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'6px',padding:'3px 10px'}}>{typeof s.duracao==='number'?s.duracao+' min':String(s.duracao).includes('min')?s.duracao:s.duracao+' min'}</span>}
                      {s.categoria&&<span style={{fontSize:'11px',color:'#94A3B8',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'6px',padding:'3px 10px'}}>{s.categoria}</span>}
                      <span style={{fontSize:'11px',color:'#94A3B8',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'6px',padding:'3px 10px'}}>{profLabel}</span>
                      {s.descricao&&<span style={{fontSize:'11px',color:'#64748B',fontStyle:'italic'}}>{s.descricao}</span>}
                    </div>
                    <div className="sv-acoes">
                      <button onClick={()=>abrirEditar(s)} style={{height:'36px',padding:'0 14px',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.28)',borderRadius:'8px',fontSize:'12px',fontWeight:600,color:'#60A5FA',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px',whiteSpace:'nowrap'}}><Pencil size={13}/>Editar</button>
                      <button onClick={()=>toggleAtivo(s)} style={{height:'36px',padding:'0 14px',background:'rgba(59,130,246,.10)',border:'1px solid rgba(59,130,246,.24)',borderRadius:'8px',fontSize:'12px',fontWeight:600,color:'#93C5FD',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px',whiteSpace:'nowrap'}}><Power size={13}/>{s.ativo?'Desativar':'Ativar'}</button>
                      <button className="sv-excluir" onClick={()=>excluir(s.id)} style={{height:'36px',padding:'0 14px',background:'rgba(59,130,246,.10)',border:'1px solid rgba(59,130,246,.24)',borderRadius:'8px',color:'#93C5FD',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px',fontSize:'12px',fontWeight:600}}><Trash2 size={13}/>Excluir</button>
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
