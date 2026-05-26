'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

const SIDEBAR_ITEMS = [
  { href:'/painel',               icon:'⊞',  label:'Início',        active:true },
  { href:'/painel/agendamentos',  icon:'📅', label:'Agenda'         },
  { href:'/painel/clientes',      icon:'👥', label:'Clientes'       },
  { href:'/painel/orcamentos',    icon:'📋', label:'Orçamentos'     },
  { href:'/painel/financeiro',    icon:'💰', label:'Cobranças'      },
  { href:'/painel/financeiro',    icon:'💳', label:'Pagamentos'     },
  { href:'/painel/servicos',      icon:'🛎️', label:'Serviços'       },
  { href:'/painel/profissionais', icon:'👤', label:'Profissionais'  },
  { href:'/painel/relatorio',     icon:'📊', label:'Relatórios'     },
  { href:'/painel/perfil',        icon:'⚙️', label:'Configurações'  },
]

const AVATAR_COLORS = [
  'linear-gradient(135deg,#2563EB,#7C3AED)',
  'linear-gradient(135deg,#7C3AED,#EC4899)',
  'linear-gradient(135deg,#06B6D4,#2563EB)',
  'linear-gradient(135deg,#16A34A,#06B6D4)',
  'linear-gradient(135deg,#DC2626,#7C3AED)',
  'linear-gradient(135deg,#D97706,#EC4899)',
]
function avatarGrad(n:string){return AVATAR_COLORS[(n||'A').charCodeAt(0)%AVATAR_COLORS.length]}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%}
input,select,textarea{color-scheme:dark}
select option{background:#070F1D;color:#F8FAFC}

/* ── Sidebar ── */
.sb{
  width:220px;min-height:100vh;
  background:#070F1D;
  border-right:1px solid rgba(148,163,184,.12);
  display:flex;flex-direction:column;
  position:fixed;top:0;left:0;z-index:30;
}
.sb-logo{
  padding:20px 16px 16px;
  border-bottom:1px solid rgba(148,163,184,.1);
  display:flex;align-items:center;gap:8px;
}
.sb-icon{
  width:28px;height:28px;border-radius:8px;
  background:linear-gradient(135deg,#2563EB,#7C3AED);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  box-shadow:0 0 16px rgba(124,58,237,.4);
}
.sb nav{flex:1;padding:10px 8px}
.nl{
  display:flex;align-items:center;gap:10px;
  padding:9px 12px;border-radius:8px;margin-bottom:2px;
  text-decoration:none;font-size:13px;font-weight:400;
  color:#CBD5E1;transition:all .18s;
  border:1px solid transparent;white-space:nowrap;
}
.nl:hover{
  background:rgba(124,58,237,.12);
  color:#fff;
  border-color:rgba(124,58,237,.28);
}
.nl.on{
  background:linear-gradient(135deg,#2563EB,#7C3AED);
  color:#fff;font-weight:600;
  box-shadow:0 0 20px rgba(124,58,237,.35);
  border-color:rgba(255,255,255,.1);
}
.sb-foot{
  padding:12px;
  border-top:1px solid rgba(148,163,184,.1);
}
.sb-foot-inner{
  display:flex;align-items:center;gap:10px;
  background:rgba(15,23,42,.78);
  border:1px solid rgba(148,163,184,.12);
  border-radius:10px;padding:10px 12px;
}

/* ── Mobile Header ── */
.mob-hdr{
  display:none;align-items:center;justify-content:space-between;
  padding:0 16px;height:56px;
  background:rgba(5,11,22,.92);
  backdrop-filter:blur(16px);
  border-bottom:1px solid rgba(148,163,184,.1);
  position:sticky;top:0;z-index:20;flex-shrink:0;width:100%;max-width:100%;
}

/* ── Drawer ── */
.drawer{
  position:fixed;top:0;left:0;bottom:0;width:300px;max-width:85vw;
  background:#070F1D;z-index:50;
  transform:translateX(-100%);transition:transform .3s ease;
  display:flex;flex-direction:column;
  border-right:1px solid rgba(148,163,184,.12);
}
.drawer.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:49;opacity:0;pointer-events:none;transition:opacity .3s}
.ovl.open{opacity:1;pointer-events:auto}

/* ── Layout ── */
.main{
  margin-left:220px;flex:1;min-height:100vh;
  display:flex;flex-direction:column;
  width:calc(100% - 220px);max-width:calc(100% - 220px);
}
.pg{
  background:
    radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 30%),
    radial-gradient(circle at top right,rgba(37,99,235,.12),transparent 28%),
    linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);
  min-height:100vh;width:100%;overflow-x:hidden;
}
.body{max-width:1280px;margin:0 auto;padding:28px 32px 64px;width:100%;box-sizing:border-box}

/* ── Botões ── */
.btn-primary{
  background:linear-gradient(135deg,#2563EB,#7C3AED);
  color:#fff;border:1px solid rgba(255,255,255,.1);
  border-radius:10px;padding:11px 20px;
  font-size:13px;font-weight:700;
  box-shadow:0 10px 28px rgba(37,99,235,.28);
  text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;
  white-space:nowrap;transition:box-shadow .2s,transform .2s;font-family:inherit;cursor:pointer;
}
.btn-primary:hover{box-shadow:0 0 30px rgba(124,58,237,.42);transform:translateY(-1px)}
.btn-secondary{
  background:rgba(15,23,42,.86);
  color:#CBD5E1;border:1px solid rgba(148,163,184,.18);
  border-radius:10px;padding:11px 18px;
  font-size:13px;font-weight:600;
  text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;
  white-space:nowrap;transition:all .2s;font-family:inherit;cursor:pointer;
}
.btn-secondary:hover{background:rgba(124,58,237,.12);border-color:rgba(124,58,237,.35);color:#fff}

/* ── Cards ── */
.card-base{
  background:linear-gradient(145deg,rgba(15,23,42,.92),rgba(8,20,33,.96));
  border:1px solid rgba(148,163,184,.14);
  border-radius:18px;
  box-shadow:0 18px 40px rgba(0,0,0,.28);
}
.card-hover{transition:border-color .2s,box-shadow .2s,transform .2s}
.card-hover:hover{
  border-color:rgba(124,58,237,.42)!important;
  box-shadow:0 0 28px rgba(124,58,237,.18)!important;
  transform:translateY(-2px);
}

/* ── Grids ── */
.atl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;width:100%}
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;width:100%}
.ac-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;width:100%}

/* ── Agenda ── */
.agenda-wrap{
  background:linear-gradient(145deg,rgba(15,23,42,.94),rgba(8,20,33,.96));
  border:1px solid rgba(148,163,184,.14);
  border-radius:18px;overflow:hidden;margin-bottom:20px;width:100%;
}
.agenda-hdr{
  padding:16px 24px;border-bottom:1px solid rgba(148,163,184,.1);
  display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;
}
.ag-row{
  display:flex;align-items:center;gap:10px;padding:12px 24px;
  border-bottom:1px solid rgba(148,163,184,.06);transition:background .15s;
}
.ag-row:last-child{border-bottom:none}
.ag-row:hover{background:rgba(124,58,237,.07)}
.ag-hora{
  font-size:12px;font-weight:700;color:#fff;
  background:linear-gradient(135deg,rgba(37,99,235,.85),rgba(124,58,237,.85));
  border-radius:8px;padding:4px 10px;flex-shrink:0;min-width:52px;text-align:center;
}

/* ── Responsivo ── */
@media(max-width:1023px){
  .sb{display:none!important}
  .main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mob-hdr{display:flex!important}
  .body{padding:14px 16px 80px!important}
  .topo{flex-direction:column!important;align-items:stretch!important;gap:12px!important}
  .topo-btns{flex-direction:column!important;width:100%!important;gap:8px!important}
  .topo-btns a,.topo-btns button{width:100%!important}
  .pagina-ativa{flex-direction:column!important;align-items:stretch!important;gap:12px!important}
  .pagina-ativa-btns{width:100%!important}
  .pagina-ativa-btns a,.pagina-ativa-btns button{flex:1!important;justify-content:center!important}
  .atl-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .ac-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .agenda-hdr{padding:14px 16px!important}
  .ag-row{padding:10px 16px!important}
}
@media(max-width:360px){
  .atl-grid{grid-template-columns:1fr!important}
  .kpi-grid{grid-template-columns:1fr!important}
  .ac-grid{grid-template-columns:1fr!important}
  .body{padding:12px 12px 80px!important}
}
`

export default function Painel() {
  const [perfil,       setPerfil]       = useState<any>(null)
  const [loading,      setLoading]      = useState(true)
  const [mob,          setMob]          = useState(false)
  const [copiado,      setCopiado]      = useState(false)
  const [agHoje,       setAgHoje]       = useState(0)
  const [proxHoje,     setProxHoje]     = useState<any[]>([])
  const [orcAbertos,   setOrcAbertos]   = useState(0)
  const [totalReceber, setTotalReceber] = useState(0)
  const [recMes,       setRecMes]       = useState(0)
  const [proxCount,    setProxCount]    = useState(0)
  const [retornos,     setRetornos]     = useState(0)
  const [pendentes,    setPendentes]    = useState(0)
  const [checklist, setChecklist] = useState({
    temPerfil:false,temBanner:false,temServico:false,
    temProfissional:false,temWhatsapp:false,slug:'',
  })

  useEffect(()=>{ init() },[])

  async function init(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const hoje=new Date().toISOString().split('T')[0]
    const mes=new Date().toISOString().slice(0,7)
    const [{data:p},{data:agsH},{data:agsMes},{data:orcs},{data:servs},{data:profs}]=
      await Promise.all([
        supabase.from('perfis').select('*').eq('user_id',user.id).single(),
        supabase.from('agendamentos')
          .select('*,servicos(nome,preco),profissionais(nome)')
          .eq('user_id',user.id)
          .gte('data_hora',hoje+'T00:00:00').lte('data_hora',hoje+'T23:59:59')
          .neq('status','cancelado').order('data_hora',{ascending:true}),
        supabase.from('agendamentos').select('servicos(preco)')
          .eq('user_id',user.id).gte('data_hora',mes+'-01').neq('status','cancelado'),
        supabase.from('orcamentos').select('status,saldo_restante').eq('user_id',user.id),
        supabase.from('servicos').select('id').eq('user_id',user.id),
        supabase.from('profissionais').select('id').eq('user_id',user.id),
      ])
    setPerfil(p)
    setAgHoje(agsH?.length||0)
    setProxHoje(agsH||[])
    const amanha=new Date();amanha.setDate(amanha.getDate()+1)
    const {data:prox}=await supabase.from('agendamentos').select('id')
      .eq('user_id',user.id).gte('data_hora',amanha.toISOString().split('T')[0]+'T00:00:00').neq('status','cancelado')
    setProxCount(prox?.length||0)
    setRecMes((agsMes||[]).reduce((a:number,ag:any)=>a+(parseFloat(ag.servicos?.preco||'0')||0),0))
    const ab=(orcs||[]).filter(o=>!['Pago','Finalizado','Cancelado'].includes(o.status))
    setOrcAbertos(ab.length)
    setTotalReceber(ab.reduce((a,o)=>a+(o.saldo_restante||0),0))
    const {data:rets}=await supabase.from('agendamentos').select('id').eq('user_id',user.id).eq('status','retorno')
    setRetornos(rets?.length||0)
    setPendentes((agsH||[]).filter((a:any)=>a.status==='pendente').length)
    setChecklist({
      temPerfil:!!(p?.nome_negocio&&p?.slug),temBanner:!!p?.banner_url,
      temServico:(servs?.length||0)>0,temProfissional:(profs?.length||0)>0,
      temWhatsapp:!!p?.whatsapp,slug:p?.slug||'',
    })
    setLoading(false)
  }

  async function logout(){ await supabase.auth.signOut(); window.location.href='/login' }
  function copiarLink(){
    navigator.clipboard.writeText((typeof window!=='undefined'?window.location.origin:'')+'/'+checklist.slug)
    setCopiado(true);setTimeout(()=>setCopiado(false),2000)
  }
  function fmtH(s:string){return new Date(s).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
  function fmtBRL(v:number){return v.toLocaleString('pt-BR',{minimumFractionDigits:2})}
  function fmtDia(){return new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'N').charAt(0).toUpperCase()
  const grad=avatarGrad(nome)
  const itensChk=[
    {feito:checklist.temPerfil,      texto:'Cadastrar dados do negócio',   href:'/painel/perfil'},
    {feito:checklist.temBanner,      texto:'Enviar imagem de capa',         href:'/painel/perfil'},
    {feito:checklist.temServico,     texto:'Cadastrar primeiro serviço',    href:'/painel/servicos'},
    {feito:checklist.temProfissional,texto:'Cadastrar profissional',        href:'/painel/profissionais'},
    {feito:checklist.temWhatsapp,    texto:'Adicionar WhatsApp do negócio', href:'/painel/perfil'},
  ]
  const totalF=itensChk.filter(i=>i.feito).length
  const chkOk=totalF===itensChk.length
  const prog=Math.round((totalF/itensChk.length)*100)
  const urlPub=(typeof window!=='undefined'?window.location.origin:'')+'/'+checklist.slug

  const SB=()=>(
    <aside className="sb">
      <div className="sb-logo">
        <div className="sb-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
      </div>
      <nav>
        {SIDEBAR_ITEMS.map(it=>(
          <Link key={it.label} href={it.href} className={'nl'+(it.active?' on':'')}>
            <span style={{fontSize:'15px'}}>{it.icon}</span>{it.label}
          </Link>
        ))}
      </nav>
      <div className="sb-foot">
        <div className="sb-foot-inner">
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0,boxShadow:'0 0 16px rgba(124,58,237,.4)'}}>
            {ini}
          </div>
          <div style={{minWidth:0}}>
            <p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p>
            <p style={{fontSize:'10px',color:'#64748B',marginTop:'1px'}}>Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  )

  if(loading) return(
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p>
    </div>
  )

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',maxWidth:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drawer${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid rgba(148,163,184,.12)'}}>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span>
          <button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'24px',lineHeight:1}}>×</button>
        </div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>
          {SIDEBAR_ITEMS.map(it=>(
            <Link key={it.label} href={it.href} onClick={()=>setMob(false)} className={'nl'+(it.active?' on':'')} style={{fontSize:'14px',padding:'11px 14px'}}>
              <span style={{fontSize:'18px'}}>{it.icon}</span>{it.label}
            </Link>
          ))}
        </nav>
        <div style={{padding:'12px',borderTop:'1px solid rgba(148,163,184,.1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.78)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
            <div><p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC'}}>{nome||'Meu negócio'}</p><p style={{fontSize:'11px',color:'#64748B'}}>Administrador</p></div>
          </div>
        </div>
      </div>

      <SB/>
      <div className="main">
        {/* Header mobile */}
        <div className="mob-hdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
            <span style={{display:'block',width:'16px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span>
          <div style={{width:'36px',height:'36px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',boxShadow:'0 0 14px rgba(124,58,237,.4)'}}>{ini}</div>
        </div>

        <div className="pg">
        <div className="body">

          {/* ── TOPO ── */}
          <div className="topo" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px',width:'100%'}}>
            <div style={{minWidth:0}}>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.03em',marginBottom:'4px',lineHeight:1.2}}>
                {nome?`Olá, ${nome} 👋`:'Painel ClienteMarcado'}
              </h1>
              <p style={{fontSize:'14px',color:'#94A3B8',lineHeight:1.5}}>
                Acompanhe sua agenda, clientes, cobranças e retornos em um só lugar.
              </p>
            </div>
            <div className="topo-btns" style={{display:'flex',gap:'8px',flexShrink:0}}>
              <Link href="/painel/agendamentos" className="btn-primary">📅 Novo agendamento</Link>
              <Link href="/painel/orcamentos" className="btn-secondary">📋 Novo orçamento</Link>
            </div>
          </div>

          {/* ── PÁGINA PÚBLICA ATIVA ── */}
          {chkOk&&checklist.slug&&(
            <div className="pagina-ativa" style={{
              background:'radial-gradient(circle at top left,rgba(34,197,94,.18),transparent 35%),linear-gradient(145deg,rgba(6,78,59,.28),rgba(15,23,42,.94))',
              border:'1px solid rgba(34,197,94,.32)',borderRadius:'16px',
              padding:'16px 20px',marginBottom:'20px',
              display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',
              width:'100%',boxSizing:'border-box' as const,
            }}>
              <div style={{display:'flex',alignItems:'flex-start',gap:'12px',flex:1,minWidth:0}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#22C55E',flexShrink:0,marginTop:'5px',boxShadow:'0 0 10px rgba(34,197,94,.7)'}}/>
                <div style={{minWidth:0,flex:1}}>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#4ADE80',marginBottom:'3px'}}>Sua página pública está ativa</p>
                  <p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'4px',lineHeight:1.4}}>Compartilhe este link com seus clientes para receber agendamentos e contatos.</p>
                  <p style={{fontSize:'11px',color:'#64748B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'100%'}}>{urlPub}</p>
                </div>
              </div>
              <div className="pagina-ativa-btns" style={{display:'flex',gap:'8px',flexShrink:0,flexWrap:'wrap'}}>
                <a href={'/'+checklist.slug} target="_blank" rel="noopener noreferrer"
                  style={{background:'linear-gradient(135deg,#16A34A,#22C55E)',color:'#fff',borderRadius:'8px',padding:'9px 16px',fontSize:'12px',fontWeight:700,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',whiteSpace:'nowrap',boxShadow:'0 8px 20px rgba(34,197,94,.25)'}}>
                  🔗 Ver página
                </a>
                <button onClick={copiarLink}
                  style={{background:'rgba(15,23,42,.85)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'8px',padding:'9px 14px',fontSize:'12px',fontWeight:600,color:copiado?'#4ADE80':'#CBD5E1',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',transition:'color .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'}}>
                  {copiado?'✓ Copiado!':'📋 Copiar link'}
                </button>
              </div>
            </div>
          )}

          {/* ── NOTIF PENDENTES ── */}
          {pendentes>0&&(
            <div style={{background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.3)',borderRadius:'12px',padding:'12px 16px',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',width:'100%',boxSizing:'border-box' as const}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',minWidth:0}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#F59E0B',flexShrink:0,boxShadow:'0 0 8px rgba(245,158,11,.6)'}}/>
                <p style={{fontSize:'13px',fontWeight:600,color:'#FBBF24',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {pendentes} agendamento{pendentes>1?'s':''} pendente{pendentes>1?'s':''} hoje
                </p>
              </div>
              <Link href="/painel/agendamentos" style={{fontSize:'12px',fontWeight:700,color:'#F59E0B',textDecoration:'none',flexShrink:0}}>Ver →</Link>
            </div>
          )}

          {/* ── CARDS ATALHO ── */}
          <div className="atl-grid">
            {[
              {label:'Agenda',     sub:'Veja e gerencie seus horários.',   icon:'📅',href:'/painel/agendamentos',
                bg:'radial-gradient(circle at top left,rgba(37,99,235,.22),transparent 35%),linear-gradient(145deg,rgba(15,23,42,.95),rgba(8,20,33,.98))',
                bd:'rgba(37,99,235,.32)',ico_bg:'rgba(37,99,235,.18)',ico_c:'#60A5FA'},
              {label:'Clientes',   sub:'Seus clientes em um só lugar.',    icon:'👥',href:'/painel/clientes',
                bg:'radial-gradient(circle at top left,rgba(6,182,212,.20),transparent 35%),linear-gradient(145deg,rgba(15,23,42,.95),rgba(8,20,33,.98))',
                bd:'rgba(6,182,212,.30)',ico_bg:'rgba(6,182,212,.16)',ico_c:'#22D3EE'},
              {label:'Orçamentos', sub:'Crie e acompanhe orçamentos.',     icon:'📋',href:'/painel/orcamentos',
                bg:'radial-gradient(circle at top left,rgba(124,58,237,.24),transparent 35%),linear-gradient(145deg,rgba(15,23,42,.95),rgba(8,20,33,.98))',
                bd:'rgba(124,58,237,.36)',ico_bg:'rgba(124,58,237,.18)',ico_c:'#A78BFA'},
              {label:'Cobranças',  sub:'Gerencie cobranças e pagamentos.', icon:'💰',href:'/painel/financeiro',
                bg:'radial-gradient(circle at top left,rgba(139,92,246,.22),transparent 35%),linear-gradient(145deg,rgba(15,23,42,.95),rgba(8,20,33,.98))',
                bd:'rgba(139,92,246,.34)',ico_bg:'rgba(139,92,246,.18)',ico_c:'#C4B5FD'},
            ].map(a=>(
              <Link key={a.label} href={a.href} className="card-hover"
                style={{background:a.bg,border:`1px solid ${a.bd}`,borderRadius:'18px',padding:'20px',textDecoration:'none',display:'block',position:'relative',width:'100%',boxSizing:'border-box' as const,boxShadow:'0 18px 40px rgba(0,0,0,.28)'}}>
                <div style={{width:'44px',height:'44px',borderRadius:'50%',background:a.ico_bg,border:`1px solid ${a.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',marginBottom:'12px'}}>
                  <span style={{filter:`drop-shadow(0 0 8px ${a.ico_c})`}}>{a.icon}</span>
                </div>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>{a.label}</p>
                <p style={{fontSize:'11px',color:'#64748B',lineHeight:1.4}}>{a.sub}</p>
                <span style={{position:'absolute',top:'18px',right:'18px',color:a.ico_c,fontSize:'16px',opacity:.7}}>→</span>
              </Link>
            ))}
          </div>

          {/* ── KPIs ── */}
          <div className="kpi-grid">
            {[
              {label:'Atendimentos hoje',     valor:agHoje,      fmt:'n',  icon:'📅',cor:'#60A5FA', bg:'rgba(37,99,235,.08)',  bd:'rgba(37,99,235,.28)'},
              {label:'Próximos agendamentos', valor:proxCount,    fmt:'n',  icon:'🗓️',cor:'#22D3EE', bg:'rgba(6,182,212,.08)',  bd:'rgba(6,182,212,.28)'},
              {label:'Orçamentos em aberto',  valor:orcAbertos,  fmt:'n',  icon:'📋',cor:'#A78BFA', bg:'rgba(124,58,237,.1)',  bd:'rgba(124,58,237,.32)'},
              {label:'Total a receber',       valor:totalReceber,fmt:'brl',icon:'⏳',cor:'#F59E0B', bg:'rgba(245,158,11,.08)', bd:'rgba(245,158,11,.32)'},
              {label:'Recebido no mês',       valor:recMes,      fmt:'brl',icon:'✅',cor:'#22C55E', bg:'rgba(34,197,94,.08)',  bd:'rgba(34,197,94,.32)'},
              {label:'Retornos pendentes',    valor:retornos,    fmt:'n',  icon:'🔄',cor:'#FBBF24', bg:'rgba(245,158,11,.08)', bd:'rgba(245,158,11,.28)'},
            ].map(m=>(
              <div key={m.label} style={{background:`linear-gradient(145deg,rgba(15,23,42,.92),rgba(8,20,33,.96))`,border:`1px solid ${m.bd}`,borderRadius:'16px',padding:'18px',boxSizing:'border-box' as const}}>
                <div style={{width:'38px',height:'38px',borderRadius:'50%',background:m.bg,border:`1px solid ${m.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',marginBottom:'10px'}}>
                  {m.icon}
                </div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'4px',lineHeight:1.3}}>{m.label}</p>
                <p style={{fontSize:'22px',fontWeight:800,color:m.cor,letterSpacing:'-0.02em',lineHeight:1.1}}>
                  {m.fmt==='brl'?'R$ '+fmtBRL(m.valor as number):m.valor}
                </p>
              </div>
            ))}
          </div>

          {/* ── CHECKLIST ── */}
          {!chkOk&&(
            <div style={{background:'linear-gradient(145deg,rgba(15,23,42,.92),rgba(8,20,33,.96))',border:'1px solid rgba(148,163,184,.14)',borderRadius:'18px',padding:'20px',marginBottom:'20px',width:'100%',boxSizing:'border-box' as const}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                <div>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'2px'}}>Configure seu negócio</p>
                  <p style={{fontSize:'12px',color:'#64748B'}}>{totalF} de {itensChk.length} etapas concluídas</p>
                </div>
                <span style={{fontSize:'14px',fontWeight:700,color:'#A78BFA',flexShrink:0}}>{prog}%</span>
              </div>
              <div style={{height:'4px',background:'rgba(148,163,184,.1)',borderRadius:'999px',marginBottom:'14px',overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:'999px',background:'linear-gradient(90deg,#2563EB,#7C3AED)',width:prog+'%',transition:'width .4s ease'}}/>
              </div>
              {itensChk.map(it=>(
                <Link key={it.texto} href={it.feito?'#':it.href}
                  style={{display:'flex',alignItems:'center',gap:'10px',padding:'6px 0',textDecoration:'none'}}>
                  <div style={{width:'20px',height:'20px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,background:it.feito?'linear-gradient(135deg,#16A34A,#22C55E)':'transparent',border:it.feito?'none':'1px solid rgba(148,163,184,.2)',color:it.feito?'#fff':'transparent'}}>
                    {it.feito?'✓':''}
                  </div>
                  <span style={{fontSize:'13px',flex:1,color:it.feito?'#374151':'#CBD5E1',fontWeight:it.feito?400:500,textDecoration:it.feito?'line-through':'none',lineHeight:1.4}}>{it.texto}</span>
                  {!it.feito&&<span style={{fontSize:'11px',color:'#A78BFA',flexShrink:0}}>Configurar →</span>}
                </Link>
              ))}
            </div>
          )}

          {/* ── AGENDA DE HOJE ── */}
          <div className="agenda-wrap">
            <div className="agenda-hdr">
              <div style={{minWidth:0}}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'2px'}}>Agenda de hoje</p>
                <p style={{fontSize:'11px',color:'#64748B',textTransform:'capitalize' as const}}>{fmtDia()}</p>
              </div>
              <Link href="/painel/agendamentos" style={{fontSize:'12px',fontWeight:700,color:'#60A5FA',textDecoration:'none',whiteSpace:'nowrap',flexShrink:0}}>Ver agenda →</Link>
            </div>

            {proxHoje.length===0?(
              <div style={{padding:'36px 16px',textAlign:'center'}}>
                <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'rgba(37,99,235,.16)',border:'1px solid rgba(37,99,235,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',margin:'0 auto 12px'}}>📅</div>
                <p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC',marginBottom:'6px'}}>Nenhum atendimento hoje</p>
                <p style={{fontSize:'12px',color:'#64748B',lineHeight:1.5,marginBottom:'16px',maxWidth:'240px',margin:'0 auto 16px'}}>Quando houver horários marcados, eles aparecerão aqui.</p>
                <Link href="/painel/agendamentos" className="btn-primary" style={{display:'inline-flex',fontSize:'13px',padding:'9px 20px',borderRadius:'8px'}}>
                  + Novo agendamento
                </Link>
              </div>
            ):(
              <>
                {proxHoje.slice(0,6).map((ag:any)=>{
                  const sc=ag.status==='confirmado'
                    ?{bg:'rgba(34,197,94,.15)',c:'#4ADE80',bd:'rgba(34,197,94,.35)',t:'Confirmado'}
                    :ag.status==='pendente'
                    ?{bg:'rgba(245,158,11,.15)',c:'#FBBF24',bd:'rgba(245,158,11,.35)',t:'Pendente'}
                    :{bg:'rgba(148,163,184,.12)',c:'#CBD5E1',bd:'rgba(148,163,184,.22)',t:ag.status||'Agendado'}
                  const agGrad=avatarGrad(ag.cliente_nome||'A')
                  return(
                    <div key={ag.id} className="ag-row">
                      <div className="ag-hora">{fmtH(ag.data_hora)}</div>
                      <div style={{width:'30px',height:'30px',borderRadius:'50%',background:agGrad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#fff',flexShrink:0}}>
                        {(ag.cliente_nome||'?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',marginBottom:'1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.cliente_nome||'—'}</p>
                        <p style={{fontSize:'11px',color:'#64748B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ag.servicos?.nome}{ag.profissionais?.nome?' · '+ag.profissionais.nome:''}</p>
                      </div>
                      <span style={{fontSize:'10px',fontWeight:700,padding:'3px 9px',borderRadius:'999px',background:sc.bg,color:sc.c,border:`1px solid ${sc.bd}`,whiteSpace:'nowrap',flexShrink:0}}>{sc.t}</span>
                    </div>
                  )
                })}
                {proxHoje.length>6&&(
                  <div style={{padding:'12px 16px',textAlign:'center'}}>
                    <Link href="/painel/agendamentos" style={{fontSize:'13px',color:'#60A5FA',textDecoration:'none',fontWeight:600}}>Ver todos os {proxHoje.length} atendimentos →</Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── AÇÕES RÁPIDAS ── */}
          <div style={{marginBottom:'32px'}}>
            <p style={{fontSize:'11px',fontWeight:700,color:'#475569',textTransform:'uppercase' as const,letterSpacing:'.09em',marginBottom:'12px'}}>Ações rápidas</p>
            <div className="ac-grid">
              {[
                {label:'Novo agendamento',   sub:'Agende um atendimento',  icon:'📅',href:'/painel/agendamentos',  bg:'rgba(37,99,235,.1)',  bd:'rgba(37,99,235,.3)',  ic:'rgba(37,99,235,.18)', cor:'#60A5FA'},
                {label:'Novo cliente',       sub:'Cadastre um contato',    icon:'👥',href:'/painel/clientes',      bg:'rgba(6,182,212,.1)', bd:'rgba(6,182,212,.3)', ic:'rgba(6,182,212,.16)',cor:'#22D3EE'},
                {label:'Novo orçamento',     sub:'Crie em segundos',       icon:'📋',href:'/painel/orcamentos',    bg:'rgba(124,58,237,.1)',bd:'rgba(124,58,237,.34)',ic:'rgba(124,58,237,.18)',cor:'#A78BFA'},
                {label:'Registrar pagamento',sub:'Marque como recebido',   icon:'💳',href:'/painel/financeiro',    bg:'rgba(34,197,94,.1)', bd:'rgba(34,197,94,.32)', ic:'rgba(34,197,94,.16)', cor:'#4ADE80'},
                {label:'Novo serviço',       sub:'Cadastre um serviço',    icon:'🛎️',href:'/painel/servicos',      bg:'rgba(236,72,153,.1)',bd:'rgba(236,72,153,.28)',ic:'rgba(236,72,153,.15)',cor:'#F472B6'},
                {label:'Novo profissional',  sub:'Adicione à equipe',      icon:'👤',href:'/painel/profissionais', bg:'rgba(139,92,246,.1)',bd:'rgba(139,92,246,.30)',ic:'rgba(139,92,246,.16)',cor:'#C4B5FD'},
                {label:'Configurar horários',sub:'Ajuste funcionamento',   icon:'⚙️',href:'/painel/perfil',        bg:'rgba(148,163,184,.06)',bd:'rgba(148,163,184,.22)',ic:'rgba(148,163,184,.12)',cor:'#CBD5E1'},
                {label:'Bloqueios de agenda',sub:'Feche dias ou horários', icon:'🚫',href:'/painel/bloqueios',     bg:'rgba(239,68,68,.1)', bd:'rgba(239,68,68,.28)', ic:'rgba(239,68,68,.14)', cor:'#F87171'},
                {label:'Relatórios',         sub:'Veja indicadores',       icon:'📊',href:'/painel/relatorio',     bg:'rgba(56,189,248,.1)',bd:'rgba(56,189,248,.30)',ic:'rgba(56,189,248,.15)',cor:'#38BDF8'},
              ].map(a=>(
                <Link key={a.label} href={a.href}
                  style={{background:`linear-gradient(145deg,rgba(15,23,42,.88),rgba(8,20,33,.92))`,
                    border:`1px solid ${a.bd}`,borderRadius:'14px',padding:'16px',
                    textDecoration:'none',display:'block',width:'100%',boxSizing:'border-box' as const,
                    transition:'border-color .2s,box-shadow .2s'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'10px',background:a.ic,border:`1px solid ${a.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',marginBottom:'10px'}}>
                    <span style={{filter:`drop-shadow(0 0 6px ${a.cor})`}}>{a.icon}</span>
                  </div>
                  <p style={{fontSize:'12px',fontWeight:700,color:'#F8FAFC',marginBottom:'2px',lineHeight:1.3}}>{a.label}</p>
                  <p style={{fontSize:'11px',color:'#64748B',lineHeight:1.3}}>{a.sub}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <div style={{paddingTop:'16px',borderTop:'1px solid rgba(148,163,184,.08)',display:'flex',justifyContent:'flex-end'}}>
            <button onClick={logout}
              style={{background:'rgba(15,23,42,.86)',border:'1px solid rgba(148,163,184,.18)',borderRadius:'8px',padding:'8px 16px',fontSize:'13px',fontWeight:600,color:'#64748B',cursor:'pointer',fontFamily:'inherit',transition:'color .2s'}}>
              Sair da conta
            </button>
          </div>

        </div>
        </div>
      </div>
    </div>
  )
}
