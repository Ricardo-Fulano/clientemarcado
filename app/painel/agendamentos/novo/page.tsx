'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'
const SB_ITEMS=[
  {h:'/painel',l:'Início'},{h:'/painel/agendamentos',l:'Agenda',on:true},
  {h:'/painel/clientes',l:'Clientes'},{h:'/painel/orcamentos',l:'Orçamentos'},
  {h:'/painel/cobrancas',l:'Cobranças'},{h:'/painel/pagamentos',l:'Pagamentos'},
  {h:'/painel/servicos',l:'Serviços'},{h:'/painel/profissionais',l:'Profissionais'},
  {h:'/painel/relatorio',l:'Relatórios'},{h:'/painel/perfil',l:'Configurações'},
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
.nl.on{background:${G};color:#fff;font-weight:700;border-color:rgba(255,255,255,.10);box-shadow:0 0 26px rgba(124,58,237,.34)}
.sb-foot{padding:12px 10px;border-top:1px solid rgba(148,163,184,.10)}
.mhdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.96);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.12);position:sticky;top:0;z-index:20;width:100%;max-width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.14)}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:240px;flex:1;min-height:100vh;width:calc(100% - 240px);max-width:calc(100% - 240px)}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1080px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34)}
.inp{width:100%;background:rgba(15,23,42,.88);border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:0 14px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.14)}
.lbl{font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:7px}
.blk-h{font-size:13px;font-weight:700;color:'#60A5FA';margin-bottom:14px;display:flex;align-items:center;gap:7px}
.btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;height:46px;padding:0 20px;font-size:13px;font-weight:700;box-shadow:0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.26);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-p:hover{transform:translateY(-1px)}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:44px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none}
.btn-s:hover{border-color:rgba(59,130,246,.38);color:#fff}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:1023px){
  .sb{display:none!important}
  .main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mhdr{display:flex!important}
  .bdy{padding:14px 16px 80px!important}
  .layout{flex-direction:column!important}
  .aside{width:100%!important;position:static!important}
  .fg2{grid-template-columns:1fr!important}
}
`
export default function NovoAgendamento(){
  const router=useRouter()
  const [perfil,setPerfil]=useState<any>(null)
  const [servs,setServs]=useState<any[]>([])
  const [profs,setProfs]=useState<any[]>([])
  const [clis,setClis]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [salvando,setSalvando]=useState(false)
  const [mob,setMob]=useState(false)
  const [erros,setErros]=useState<string[]>([])
  const [cNome,setCNome]=useState('')
  const [cWpp,setCWpp]=useState('')
  const [cEmail,setCEmail]=useState('')
  const [servId,setServId]=useState('')
  const [profId,setProfId]=useState('')
  const [data,setData]=useState(new Date().toISOString().split('T')[0])
  const [hora,setHora]=useState('09:00')
  const [status,setStatus]=useState('pendente')
  const [obs,setObs]=useState('')
  const [valor,setValor]=useState('')
  const [busca,setBusca]=useState('')
  const [showSug,setShowSug]=useState(false)
  const [horasOcupadas,setHorasOcupadas]=useState<string[]>([])
  const [loadHoras,setLoadHoras]=useState(false)
  useEffect(()=>{init()},[])
  useEffect(()=>{if(data)carregarHoras()},[data,profId])
  async function init(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){router.push('/login');return}
    const [{data:p},{data:sv},{data:pr},{data:cl}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('servicos').select('id,nome,preco').eq('user_id',user.id).order('nome'),
      supabase.from('profissionais').select('id,nome').eq('user_id',user.id).order('nome'),
      supabase.from('clientes').select('id,nome,whatsapp,email').eq('user_id',user.id).order('nome').limit(300),
    ])
    setPerfil(p);setServs(sv||[]);setProfs(pr||[]);setClis(cl||[]);setLoading(false)
  }
  function selCli(c:any){setCNome(c.nome);setCWpp(c.whatsapp||'');setCEmail(c.email||'');setBusca(c.nome);setShowSug(false)}
  function selServ(id:string){setServId(id);const s=servs.find(s=>s.id===id);if(s?.preco)setValor(parseFloat(s.preco).toFixed(2))}
  async function salvar(){
    const err:string[]=[]
    if(!cNome.trim()) err.push('Informe o nome.')
    if(!data) err.push('Selecione a data.')
    if(!hora) err.push('Selecione o horario.')
    if(err.length){setErros(err);return}
    setErros([]);setSalvando(true)
    try{
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){setSalvando(false);return}
      const wpp=cWpp.replace(/[^0-9]/g,"")
      let qv=supabase.from('agendamentos').select('id,status').eq('user_id',user.id).gte('data_hora',data+'T'+hora+':00').lte('data_hora',data+'T'+hora+':59')
      if(profId) qv=qv.eq('profissional_id',profId)
      const {data:conf,error:confError}=await qv.limit(10)
      if(confError){console.error('Erro ao validar conflito:',confError);setErros(['Erro ao validar horario. Tente novamente.']);setSalvando(false);return}
      const conflitoAtivo=(conf||[]).some((a:any)=>a.status?.toLowerCase()!=='cancelado')
      if(conflitoAtivo){setErros(['Esse horario ja esta ocupado. Escolha outro horario.']);setSalvando(false);return}
      const {error}=await supabase.from("agendamentos").insert({user_id:user.id,cliente_nome:cNome.trim(),cliente_whatsapp:wpp||null,servico_id:servId||null,profissional_id:profId||null,data_hora:data+"T"+hora+":00",status:"pendente",observacoes:obs.trim()||null,valor:valor?parseFloat(valor):null})
      if(error){console.error("Erro:",JSON.stringify(error));setErros(["Erro ao salvar. Tente novamente."]);setSalvando(false);return}
      router.push("/painel/agendamentos")
    }catch(e){console.error("Erro inesperado:",e);setErros(["Erro inesperado."]);setSalvando(false)}
  }
  async function carregarHoras(){
    setLoadHoras(true)
    try{
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){setLoadHoras(false);return}
      let q=supabase.from('agendamentos').select('data_hora,status').eq('user_id',user.id).gte('data_hora',data+'T00:00:00').lte('data_hora',data+'T23:59:59')
      if(profId) q=q.eq('profissional_id',profId)
      const {data:ags,error}=await q
      if(error){console.error('Erro ao carregar horarios ocupados:',error);setHorasOcupadas([]);setLoadHoras(false);return}
      const ocupadas=(ags||[]).filter((a:any)=>a.status?.toLowerCase()!=='cancelado').map((a:any)=>a.data_hora.slice(11,16))
      setHorasOcupadas(ocupadas)
      if(ocupadas.includes(hora)) setHora('')
    }catch(e){console.error('Erro carregarHoras:',e);setHorasOcupadas([])}
    setLoadHoras(false)
  }

  const sug=busca.trim().length>1?clis.filter(c=>c.nome.toLowerCase().includes(busca.toLowerCase())).slice(0,6):[]
  const nome=perfil?.nome_negocio||''
  const ini=(nome||'A').charAt(0).toUpperCase()
  const servSel=servs.find(s=>s.id===servId)
  const profSel=profs.find(p=>p.id===profId)
  const Sb=()=>(
    <aside className="sb">
      <div className="sb-logo">
        <div className="sb-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
      </div>
      <nav>{SB_ITEMS.map(it=><Link key={it.l} href={it.h} className={'nl'+(it.on?' on':'')}>{it.l}</Link>)}</nav>
      <div className="sb-foot">
        <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.6)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
          <div style={{minWidth:0}}><p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p></div>
        </div>
      </div>
              <button onClick={sair} style={{width:'100%',marginTop:'8px',background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'10px',padding:'9px 14px',color:'#FCA5A5',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'8px'}}>Sair</button>
    </aside>
  )
  async function sair(){await supabase.auth.signOut();window.location.href='/login'}

  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)
  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drw${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:'1px solid rgba(148,163,184,.10)'}}>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span>
          <button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button>
        </div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>{SB_ITEMS.map(it=><Link key={it.l} href={it.h} onClick={()=>setMob(false)} className={'nl'+(it.on?' on':'')} style={{fontSize:'14px'}}>{it.l}</Link>)}</nav>
      </div>
      <Sb/>
      <div className="main">
        <div className="mhdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            {[22,22,16].map((w,i)=><span key={i} style={{display:'block',width:`${w}px`,height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>)}
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Novo agendamento</span>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>
        <div className="pg"><div className="bdy">
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px',flexWrap:'wrap'}}>
            <Link href="/painel/agendamentos" className="btn-s" style={{height:'38px',padding:'0 14px',fontSize:'12px'}}>← Voltar</Link>
            <div>
              <h1 style={{fontSize:'20px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.03em',marginBottom:'3px'}}>Novo agendamento</h1>
              <p style={{fontSize:'12px',color:'#64748B'}}>Preencha os dados para registrar o horário na agenda.</p>
            </div>
          </div>
          {erros.length>0&&(
            <div style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.28)',borderRadius:'12px',padding:'12px 16px',marginBottom:'16px'}}>
              {erros.map((e,i)=><p key={i} style={{fontSize:'13px',color:'#F87171',marginBottom:i<erros.length-1?'4px':0}}>âš  {e}</p>)}
            </div>
          )}
          <div style={{width:'100%',maxWidth:'760px',margin:'0 auto'}}>
            <div style={{width:'100%'}}>
              {/* Bloco 1 */}
              <div className="crd" style={{padding:'22px',marginBottom:'14px'}}>
                <p style={{fontSize:'13px',fontWeight:700,color:'#60A5FA',marginBottom:'14px',display:'flex',alignItems:'center',gap:'7px'}}>
                  <span style={{background:'rgba(59,130,246,.18)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>1</span>Cliente / Paciente
                </p>
                <div style={{position:'relative',marginBottom:'12px'}}>
                  <label className="lbl">Nome *</label>
                  <input className="inp" type="text" placeholder="Nome ou busque cliente existente..." value={busca}
                    onChange={e=>{setBusca(e.target.value);setCNome(e.target.value);setShowSug(true)}}
                    onFocus={()=>busca.length>1&&setShowSug(true)}
                    onBlur={()=>setTimeout(()=>setShowSug(false),150)}/>
                  {showSug&&sug.length>0&&(
                    <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'rgba(7,17,31,.98)',border:'1.5px solid rgba(59,130,246,.28)',borderRadius:'12px',zIndex:50,overflow:'hidden',boxShadow:'0 16px 40px rgba(0,0,0,.55)'}}>
                      {sug.map((c:any)=>(
                        <div key={c.id} onMouseDown={()=>selCli(c)}
                          style={{padding:'10px 14px',fontSize:'13px',color:'#CBD5E1',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,.05)',display:'flex',alignItems:'center',gap:'10px'}}
                          onMouseEnter={e=>(e.currentTarget.style.background='rgba(59,130,246,.12)')}
                          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                          <div style={{width:'28px',height:'28px',borderRadius:'50%',background:AV,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#fff',flexShrink:0}}>{c.nome.charAt(0).toUpperCase()}</div>
                          <div><p style={{fontWeight:600,color:'#F8FAFC',fontSize:'13px'}}>{c.nome}</p>{c.whatsapp&&<p style={{fontSize:'11px',color:'#64748B'}}>{c.whatsapp}</p>}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="fg2">
                  <div><label className="lbl">WhatsApp</label><input className="inp" type="tel" placeholder="(11) 99999-9999" value={cWpp} onChange={e=>setCWpp(e.target.value)}/></div>
                  <div><label className="lbl">E-mail</label><input className="inp" type="email" placeholder="email@exemplo.com" value={cEmail} onChange={e=>setCEmail(e.target.value)}/></div>
                </div>
              </div>
              {/* Bloco 2 */}
              <div className="crd" style={{padding:'22px',marginBottom:'14px'}}>
                <p style={{fontSize:'13px',fontWeight:700,color:'#60A5FA',marginBottom:'14px',display:'flex',alignItems:'center',gap:'7px'}}>
                  <span style={{background:'rgba(59,130,246,.18)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>2</span>Serviço e profissional
                </p>
                <div className="fg2" style={{marginBottom:'12px'}}>
                  <div><label className="lbl">Serviço / Procedimento</label>
                    <select className="inp" value={servId} onChange={e=>selServ(e.target.value)}>
                      <option value="">Selecionar...</option>
                      {servs.map((s:any)=><option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                  </div>
                  <div><label className="lbl">Profissional</label>
                    <select className="inp" value={profId} onChange={e=>setProfId(e.target.value)}>
                      <option value="">Qualquer profissional</option>
                      {profs.map((p:any)=><option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{maxWidth:'200px'}}>
                  <label className="lbl">Valor (R$)</label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600,pointerEvents:'none'}}>R$</span>
                    <input className="inp" type="number" min="0" step="0.01" placeholder="0,00" value={valor} onChange={e=>setValor(e.target.value)} style={{paddingLeft:'36px'}}/>
                  </div>
                </div>
              </div>
              {/* Bloco 3 */}
              <div className="crd" style={{padding:'22px',marginBottom:'14px'}}>
                <p style={{fontSize:'13px',fontWeight:700,color:'#60A5FA',marginBottom:'14px',display:'flex',alignItems:'center',gap:'7px'}}>
                  <span style={{background:'rgba(59,130,246,.18)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>3</span>Data e horário
                </p>
                <div className="fg2" style={{marginBottom:'14px'}}>
                  <div><label className="lbl">Data *</label><input className="inp" type="date" value={data} onChange={e=>setData(e.target.value)}/></div>
                  <div><label className="lbl">Horário *</label>{loadHoras?<p style={{fontSize:12,color:'#64748B',marginTop:4}}>Carregando horarios...</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:4}}>{(['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']).map((h:string)=>{const ocup=horasOcupadas.includes(h);const sel=hora===h;return <button key={h} type="button" disabled={ocup} onClick={()=>!ocup&&setHora(h)} style={{padding:'10px 4px',borderRadius:10,fontSize:12,fontWeight:600,cursor:ocup?'not-allowed':'pointer',fontFamily:'inherit',minHeight:40,border:'1px solid '+(sel?'rgba(255,255,255,.12)':ocup?'rgba(148,163,184,.12)':'rgba(59,130,246,.25)'),background:sel?'linear-gradient(135deg,#3B82F6,#7C3AED)':ocup?'rgba(15,23,42,.45)':'rgba(15,23,42,.85)',color:sel?'#fff':ocup?'#64748B':'#CBD5E1',opacity:ocup?.55:1}}>{h}{ocup&&<span style={{display:'block',fontSize:9,color:'#EF4444'}}>ocupado</span>}</button>})}</div>}</div>
                </div>
                <label className="lbl">Status inicial</label>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  {[{v:'pendente',l:'⏳ Pendente',c:'#FBBF24',bg:'rgba(245,158,11,.12)',bd:'rgba(245,158,11,.35)'},{v:'confirmado',l:'✓ Confirmado',c:'#4ADE80',bg:'rgba(34,197,94,.12)',bd:'rgba(34,197,94,.35)'}].map(s=>(
                    <button key={s.v} onClick={()=>setStatus(s.v)}
                      style={{background:status===s.v?s.bg:'rgba(15,23,42,.75)',border:`1px solid ${status===s.v?s.bd:'rgba(148,163,184,.18)'}`,borderRadius:'10px',height:'40px',padding:'0 16px',fontSize:'13px',fontWeight:600,color:status===s.v?s.c:'#94A3B8',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Bloco 4 */}
              <div className="crd" style={{padding:'22px'}}>
                <p style={{fontSize:'13px',fontWeight:700,color:'#60A5FA',marginBottom:'14px',display:'flex',alignItems:'center',gap:'7px'}}>
                  <span style={{background:'rgba(59,130,246,.18)',borderRadius:'6px',padding:'2px 9px',fontSize:'11px'}}>4</span>Observações
                </p>
                <textarea className="inp" rows={3} placeholder="Informações adicionais sobre o atendimento..." value={obs} onChange={e=>setObs(e.target.value)} style={{height:'auto',padding:'12px 14px',resize:'none',lineHeight:1.6}}/>
              </div>
            </div>
            {/* Botao salvar mobile */}
            <div style={{marginBottom:'16px'}} className="mob-save">
              {erros.length>0&&<div style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.25)',borderRadius:10,padding:'10px 14px',marginBottom:'12px'}}>
                {erros.map((e,i)=><p key={i} style={{fontSize:12,color:'#F87171',fontWeight:500}}>{e}</p>)}
              </div>}
              <button onClick={salvar} disabled={salvando} className="btn-p" style={{width:'100%',height:'52px',justifyContent:'center',fontSize:'15px',fontWeight:700,borderRadius:14}}>
                {salvando?'Salvando...':'Salvar agendamento'}
              </button>
              <Link href="/painel/agendamentos" className="btn-s" style={{width:'100%',height:'44px',justifyContent:'center',marginTop:'8px',fontSize:'13px',display:'flex',alignItems:'center',textDecoration:'none',borderRadius:12}}>Cancelar</Link>
            </div>

          </div>
        </div></div>
      </div>
    </div>
  )
}
