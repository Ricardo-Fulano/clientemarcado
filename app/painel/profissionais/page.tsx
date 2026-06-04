'use client'
import { useEffect, useState, useRef } from 'react'
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
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:42px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-s:hover{border-color:rgba(139,92,246,.38);color:#fff}
.inp{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:0 14px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(139,92,246,.55);box-shadow:0 0 0 3px rgba(139,92,246,.14)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:7px}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
.prof-card{background:radial-gradient(circle at top left,rgba(139,92,246,.08),transparent 36%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:18px;padding:18px;margin-bottom:8px;transition:all .18s;overflow:hidden}
.prof-card:hover{border-color:rgba(139,92,246,.32);box-shadow:0 0 28px rgba(139,92,246,.12);transform:translateY(-1px)}
.pill{padding:0 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.18);transition:all .18s;white-space:nowrap;background:rgba(15,23,42,.72);color:#94A3B8;height:34px;display:inline-flex;align-items:center}
.pill:hover{border-color:rgba(139,92,246,.32);color:#CBD5E1}
.pill.on{background:rgba(139,92,246,.16);border:1px solid rgba(139,92,246,.38);color:#F8FAFC}
.srch{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:0 16px 0 42px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s}
.srch:focus{border-color:rgba(139,92,246,.55);box-shadow:0 0 0 3px rgba(139,92,246,.14)}
.pact{border-radius:8px;padding:0 10px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .2s;font-family:inherit;display:inline-flex;align-items:center;gap:3px;white-space:nowrap;height:30px}
.pact:hover{filter:brightness(1.15)}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:1023px){
  .bdy{padding:14px 16px 80px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .hdr-row{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .hdr-btns button{width:100%!important;justify-content:center!important}
  .pills-row{overflow-x:auto!important;display:flex!important;gap:5px!important;flex-wrap:nowrap!important;scrollbar-width:none!important;padding-bottom:2px!important}
  .pills-row::-webkit-scrollbar{display:none!important}
  .fg2{grid-template-columns:1fr!important}
  .prof-card-inner{flex-direction:column!important;gap:10px!important}
  .prof-acts{display:grid!important;grid-template-columns:1fr 1fr!important;gap:6px!important;width:100%!important}
  .prof-acts .pact{width:100%!important;height:34px!important;font-size:12px!important;justify-content:center!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
`

type Prof={id:string;nome:string;cargo:string;whatsapp:string;email:string;foto_url:string|null;ativo:boolean;servicos_nomes:string|null;created_at:string}

export default function Profissionais(){
  const [perfil,setPerfil]=useState<any>(null)
  const [profs,setProfs]=useState<Prof[]>([])
  const [loading,setLoading]=useState(true)
  const [msg,setMsg]=useState('')
  const [salvando,setSalvando]=useState(false)
  const [showForm,setShowForm]=useState(false)
  const [editId,setEditId]=useState<string|null>(null)
  const [busca,setBusca]=useState('')
  const [filtro,setFiltro]=useState('todos')
  const fileRef=useRef<HTMLInputElement>(null)
  const [fNome,setFNome]=useState('')
  const [fCargo,setFCargo]=useState('')
  const [fWpp,setFWpp]=useState('')
  const [fEmail,setFEmail]=useState('')
  const [fAtivo,setFAtivo]=useState(true)
  const [fFoto,setFFoto]=useState<File|null>(null)
  const [fFotoPreview,setFFotoPreview]=useState<string|null>(null)

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:ps}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('*').eq('user_id',user.id).order('nome'),
    ])
    setPerfil(p);setProfs(ps||[]);setLoading(false)
  }

  function resetForm(){
    setFNome('');setFCargo('');setFWpp('');setFEmail('');setFAtivo(true)
    setFFoto(null);setFFotoPreview(null);setEditId(null)
  }

  function abrirForm(p?:Prof){
    if(p){
      setFNome(p.nome);setFCargo(p.cargo||'');setFWpp(p.whatsapp||'')
      setFEmail(p.email||'');setFAtivo(p.ativo!==false)
      setFFotoPreview(p.foto_url||null);setEditId(p.id)
    } else resetForm()
    setShowForm(true)
    setTimeout(()=>document.querySelector('.form-nome')?.scrollIntoView({behavior:'smooth',block:'center'}),100)
  }

  function onFoto(e:React.ChangeEvent<HTMLInputElement>){
    const f=e.target.files?.[0]
    if(!f) return
    setFFoto(f)
    setFFotoPreview(URL.createObjectURL(f))
  }

  async function salvar(){
    if(!fNome.trim()){setMsg('⚠ Informe o nome.');return}
    setSalvando(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSalvando(false);return}
    let foto_url:string|null=null
    if(fFoto){
      const ext=fFoto.name.split('.').pop()
      const path=`profissionais/${user.id}/${Date.now()}.${ext}`
      const {error:upErr}=await supabase.storage.from('fotos').upload(path,fFoto,{upsert:true})
      if(!upErr){
        const {data:pub}=supabase.storage.from('fotos').getPublicUrl(path)
        foto_url=pub.publicUrl
      }
    }
    const payload:any={user_id:user.id,nome:fNome.trim(),cargo:fCargo.trim()||null,whatsapp:fWpp.replace(/\D/g,'')||null,email:fEmail.trim()||null,ativo:fAtivo}
    if(foto_url) payload.foto_url=foto_url
    if(editId){
      await supabase.from('profissionais').update(payload).eq('id',editId)
      setProfs(prev=>prev.map(p=>p.id===editId?{...p,...payload,id:editId}:p).sort((a,b)=>a.nome.localeCompare(b.nome)))
      setMsg('Profissional atualizado! ✓')
    } else {
      const {data:novo}=await supabase.from('profissionais').insert(payload).select('*').single()
      if(novo) setProfs(prev=>[...prev,novo].sort((a,b)=>a.nome.localeCompare(b.nome)))
      setMsg('Profissional cadastrado! ✓')
    }
    resetForm();setShowForm(false)
    setTimeout(()=>setMsg(''),2500);setSalvando(false)
  }

  async function excluir(id:string,nome:string){
    if(!confirm(`Remover "${nome}"?\n\nEle pode estar vinculado a agendamentos existentes.`)) return
    await supabase.from('profissionais').delete().eq('id',id)
    setProfs(prev=>prev.filter(p=>p.id!==id))
    setMsg('Removido.');setTimeout(()=>setMsg(''),2000)
  }

  async function toggleAtivo(p:Prof){
    await supabase.from('profissionais').update({ativo:!p.ativo}).eq('id',p.id)
    setProfs(prev=>prev.map(x=>x.id===p.id?{...x,ativo:!p.ativo}:x))
    setMsg(p.ativo?'Profissional desativado.':'Profissional ativado.');setTimeout(()=>setMsg(''),2000)
  }

  const filtrados=profs.filter(p=>{
    const q=busca.toLowerCase()
    const mb=!busca||(p.nome?.toLowerCase().includes(q)||p.cargo?.toLowerCase().includes(q))
    if(!mb) return false
    if(filtro==='ativos') return p.ativo!==false
    if(filtro==='inativos') return p.ativo===false
    return true
  })

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'P').charAt(0).toUpperCase()
  const ativos=profs.filter(p=>p.ativo!==false).length

  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      <PainelSidebar nome={nome} tituloMobile="Profissionais" />

      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg&&<div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'rgba(139,92,246,.18)',border:'1px solid rgba(139,92,246,.40)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#C4B5FD',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>{msg}</div>}

          <div className="hdr-row" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'24px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Profissionais</h1>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5}}>Cadastre profissionais, funções e organize a agenda da equipe.</p>
            </div>
            <div className="hdr-btns">
              <button onClick={()=>abrirForm()} className="btn-p">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {showForm&&!editId?'Cancelar':'Novo profissional'}
              </button>
            </div>
          </div>

          <div className="kpi-grid">
            {[
              {l:'Total',v:profs.length,c:'#C4B5FD',bg:'rgba(139,92,246,.10)',bd:'rgba(139,92,246,.22)',ico:'👥'},
              {l:'Ativos',v:ativos,c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.22)',ico:'✓'},
              {l:'Inativos',v:profs.length-ativos,c:'#94A3B8',bg:'rgba(71,85,105,.10)',bd:'rgba(71,85,105,.22)',ico:'—'},
              {l:'Na agenda',v:ativos,c:'#60A5FA',bg:'rgba(59,130,246,.10)',bd:'rgba(59,130,246,.22)',ico:'📅'},
            ].map(k=>(
              <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:'18px',padding:'18px 16px',boxSizing:'border-box' as const,boxShadow:'0 20px 48px rgba(0,0,0,.28)'}}>
                <div style={{width:'38px',height:'38px',borderRadius:'11px',background:k.bg,border:`1px solid ${k.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',marginBottom:'10px'}}>{k.ico}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>{k.l}</p>
                <p style={{fontSize:'26px',fontWeight:800,color:k.c,lineHeight:1,letterSpacing:'-0.03em'}}>{k.v}</p>
              </div>
            ))}
          </div>

          {showForm&&(
            <div className="crd" style={{padding:'24px',marginBottom:'20px',border:'1.5px solid rgba(139,92,246,.28)'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#C4B5FD',marginBottom:'4px',display:'flex',alignItems:'center',gap:'7px'}}>
                <span style={{background:'rgba(139,92,246,.18)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>{editId?'Editar':'Novo'}</span>
                {editId?'Editar profissional':'Adicionar profissional'}
              </p>
              <p style={{fontSize:'12px',color:'#64748B',marginBottom:'20px'}}>Inclua membros da equipe para usar na agenda, serviços e atendimentos.</p>
              <div className="fg2" style={{marginBottom:'12px'}}>
                <div><label className="lbl">Nome *</label><input className="inp form-nome" type="text" placeholder="Nome completo..." value={fNome} onChange={e=>setFNome(e.target.value)}/></div>
                <div><label className="lbl">Cargo / Função</label><input className="inp" type="text" placeholder="Ex: Cabeleireiro, Dentista, Esteticista..." value={fCargo} onChange={e=>setFCargo(e.target.value)}/></div>
              </div>
              <div className="fg2" style={{marginBottom:'12px'}}>
                <div><label className="lbl">WhatsApp</label><input className="inp" type="tel" placeholder="(11) 99999-9999" value={fWpp} onChange={e=>setFWpp(e.target.value)}/></div>
                <div><label className="lbl">E-mail</label><input className="inp" type="email" placeholder="email@exemplo.com" value={fEmail} onChange={e=>setFEmail(e.target.value)}/></div>
              </div>
              <div style={{marginBottom:'16px'}}>
                <label className="lbl">Foto do profissional (opcional)</label>
                <div style={{display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
                  {fFotoPreview?(
                    <img src={fFotoPreview} alt="preview" style={{width:'60px',height:'60px',borderRadius:'50%',objectFit:'cover',border:'2px solid rgba(139,92,246,.4)',flexShrink:0}}/>
                  ):(
                    <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'rgba(139,92,246,.12)',border:'1.5px dashed rgba(139,92,246,.35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',flexShrink:0,color:'#8B5CF6'}}>👤</div>
                  )}
                  <div onClick={()=>fileRef.current?.click()} style={{flex:1,minWidth:'160px',background:'rgba(15,23,42,.6)',border:'1.5px dashed rgba(148,163,184,.24)',borderRadius:'14px',padding:'14px 18px',cursor:'pointer',transition:'all .18s',textAlign:'center'}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='rgba(139,92,246,.45)';(e.currentTarget as HTMLDivElement).style.background='rgba(139,92,246,.06)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='rgba(148,163,184,.24)';(e.currentTarget as HTMLDivElement).style.background='rgba(15,23,42,.6)'}}>
                    <p style={{fontSize:'13px',color:'#CBD5E1',marginBottom:'2px'}}>Clique para enviar uma foto</p>
                    <p style={{fontSize:'11px',color:'#64748B'}}>Proporção 1:1 · JPG, PNG ou WEBP · Máx. 3 MB</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFoto}/>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
                <button onClick={()=>setFAtivo(!fAtivo)} style={{display:'flex',alignItems:'center',gap:'8px',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',padding:0}}>
                  <div style={{width:'40px',height:'22px',borderRadius:'999px',background:fAtivo?'#22C55E':'rgba(255,255,255,.15)',transition:'background .2s',position:'relative',flexShrink:0}}>
                    <span style={{position:'absolute',top:'3px',left:fAtivo?'21px':'3px',width:'16px',height:'16px',borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
                  </div>
                  <span style={{fontSize:'13px',color:'#CBD5E1'}}>Profissional ativo</span>
                </button>
              </div>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                <button onClick={salvar} disabled={salvando} className="btn-p" style={{opacity:salvando?.7:1}}>{salvando?'Salvando...':`✓ ${editId?'Salvar alterações':'Adicionar profissional'}`}</button>
                <button onClick={()=>{setShowForm(false);resetForm()}} className="btn-s">Cancelar</button>
              </div>
            </div>
          )}

          <div className="crd" style={{padding:'16px 18px',marginBottom:'16px'}}>
            <div style={{position:'relative',marginBottom:'10px'}}>
              <svg style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',color:'#64748B',pointerEvents:'none'}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="srch" placeholder="Buscar profissional, função ou cargo..." value={busca} onChange={e=>setBusca(e.target.value)}/>
            </div>
            <div className="pills-row" style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              {[{v:'todos',l:'Todos'},{v:'ativos',l:'Ativos'},{v:'inativos',l:'Inativos'}].map(f=>(
                <button key={f.v} className={`pill${filtro===f.v?' on':''}`} onClick={()=>setFiltro(f.v)}>{f.l}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Profissionais cadastrados</p>
              <span style={{fontSize:'12px',color:'#64748B'}}>{filtrados.length} cadastrado{filtrados.length!==1?'s':''}</span>
            </div>
            {filtrados.length===0?(
              <div style={{background:'radial-gradient(circle at center,rgba(139,92,246,.08),transparent 35%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.16)',borderRadius:'20px',padding:'60px 24px',textAlign:'center'}}>
                <div style={{width:'58px',height:'58px',borderRadius:'16px',background:'rgba(139,92,246,.12)',border:'1px solid rgba(139,92,246,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',margin:'0 auto 16px'}}>👤</div>
                <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'6px'}}>{busca?'Nenhum profissional encontrado':'Nenhum profissional cadastrado'}</p>
                <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5,maxWidth:'300px',margin:'0 auto 20px'}}>{busca?'Tente outro termo.':'Cadastre sua equipe para organizar agenda, serviços, horários e atendimentos.'}</p>
                {!busca&&<button onClick={()=>abrirForm()} className="btn-p" style={{display:'inline-flex'}}>+ Adicionar primeiro profissional</button>}
              </div>
            ):(
              filtrados.map(p=>{
                const ini2=(p.nome||'?').charAt(0).toUpperCase()
                return(
                  <div key={p.id} className="prof-card">
                    <div className="prof-card-inner" style={{display:'flex',alignItems:'center',gap:'14px'}}>
                      {p.foto_url?(
                        <img src={p.foto_url} alt={p.nome} style={{width:'52px',height:'52px',borderRadius:'50%',objectFit:'cover',border:'1px solid rgba(255,255,255,.12)',flexShrink:0}}/>
                      ):(
                        <div style={{width:'52px',height:'52px',borderRadius:'50%',background:AV,border:'1px solid rgba(255,255,255,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',fontWeight:800,color:'#fff',flexShrink:0}}>{ini2}</div>
                      )}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px',flexWrap:'wrap'}}>
                          <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>{p.nome}</p>
                          <span style={{fontSize:'10px',fontWeight:600,padding:'2px 8px',borderRadius:'999px',background:p.ativo!==false?'rgba(34,197,94,.14)':'rgba(71,85,105,.14)',color:p.ativo!==false?'#4ADE80':'#94A3B8',border:`1px solid ${p.ativo!==false?'rgba(34,197,94,.32)':'rgba(71,85,105,.28)'}`}}>{p.ativo!==false?'Ativo':'Inativo'}</span>
                        </div>
                        {p.cargo&&<p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'2px'}}>{p.cargo}</p>}
                        <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                          {p.whatsapp&&<p style={{fontSize:'11px',color:'#64748B'}}>📱 {p.whatsapp}</p>}
                          {p.email&&<p style={{fontSize:'11px',color:'#64748B'}}>✉ {p.email}</p>}
                        </div>
                      </div>
                      <div className="prof-acts" style={{display:'flex',gap:'5px',flexShrink:0,flexWrap:'wrap',justifyContent:'flex-end'}}>
                        <button onClick={()=>abrirForm(p)} className="pact" style={{background:'rgba(59,130,246,.14)',border:'1px solid rgba(59,130,246,.32)',color:'#93C5FD'}}>✏ Editar</button>
                        <button onClick={()=>toggleAtivo(p)} className="pact" style={{background:p.ativo!==false?'rgba(245,158,11,.12)':'rgba(34,197,94,.12)',border:`1px solid ${p.ativo!==false?'rgba(245,158,11,.30)':'rgba(34,197,94,.30)'}`,color:p.ativo!==false?'#FBBF24':'#4ADE80'}}>{p.ativo!==false?'Desativar':'Ativar'}</button>
                        <button onClick={()=>excluir(p.id,p.nome)} className="pact" style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.28)',color:'#F87171'}}>✕</button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

        </div></div>
      </div>
    </div>
  )
}
