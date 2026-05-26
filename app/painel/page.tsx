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

const AVATAR_COLORS = ['#2563EB','#7C3AED','#0891B2','#16A34A','#DC2626','#D97706','#DB2777']
function avatarColor(n:string){return AVATAR_COLORS[(n||'A').charCodeAt(0)%AVATAR_COLORS.length]}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%}

/* ── Sidebar ── */
.sb{width:220px;min-height:100vh;background:#0B172A;display:flex;flex-direction:column;
  position:fixed;top:0;left:0;z-index:30;border-right:1px solid rgba(255,255,255,.06)}
.sb-logo{padding:20px 16px 16px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:8px}
.sb-icon{width:28px;height:28px;border-radius:8px;background:#2563EB;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb nav{flex:1;padding:10px 8px}
.nl{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:2px;
  text-decoration:none;font-size:13px;font-weight:400;color:rgba(255,255,255,.5);
  transition:all .15s;border-left:2px solid transparent;white-space:nowrap}
.nl:hover{background:rgba(255,255,255,.05);color:rgba(255,255,255,.8)}
.nl.on{background:rgba(37,99,235,.2);color:#93C5FD;font-weight:600;border-left-color:#2563EB}
.sb-foot{padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:10px}

/* ── Mobile Header ── */
.mob-hdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;
  background:#0B172A;border-bottom:1px solid rgba(255,255,255,.07);
  position:sticky;top:0;z-index:20;flex-shrink:0;width:100%;max-width:100%}

/* ── Drawer ── */
.drawer{position:fixed;top:0;left:0;bottom:0;width:300px;max-width:85vw;background:#0B172A;
  z-index:50;transform:translateX(-100%);transition:transform .3s ease;
  display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,.08)}
.drawer.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:49;opacity:0;pointer-events:none;transition:opacity .3s}
.ovl.open{opacity:1;pointer-events:auto}

/* ── Layout principal ── */
.main{margin-left:220px;flex:1;min-height:100vh;display:flex;flex-direction:column;
  width:calc(100% - 220px);max-width:calc(100% - 220px)}
.pg{background:#07111F;min-height:100vh;width:100%;overflow-x:hidden}
.body{max-width:1280px;margin:0 auto;padding:28px 32px 64px;width:100%;box-sizing:border-box}

/* ── Card página ativa ── */
.pagina-ativa{
  background:rgba(22,163,74,.1);border:1px solid rgba(22,163,74,.25);border-radius:16px;
  padding:16px 20px;margin-bottom:20px;
  display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;
  width:100%;box-sizing:border-box
}
.pagina-ativa-info{display:flex;align-items:flex-start;gap:12px;flex:1;min-width:0}
.pagina-ativa-btns{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap}

/* ── Topo ── */
.topo{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;
  flex-wrap:wrap;margin-bottom:24px;width:100%}
.topo-btns{display:flex;gap:8px;flex-shrink:0}

/* ── Cards atalho ── */
.atl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;width:100%}
.atl-card{border-radius:16px;padding:20px;cursor:pointer;text-align:left;text-decoration:none;
  position:relative;transition:box-shadow .2s,border-color .2s;display:block;
  width:100%;box-sizing:border-box}
.atl-card:hover{box-shadow:0 6px 28px rgba(0,0,0,.4)}
.atl-ico{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:12px}

/* ── KPIs ── */
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;width:100%}
.kpi-card{border-radius:16px;padding:18px;box-sizing:border-box}
.kpi-ico{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;margin-bottom:10px}

/* ── Agenda ── */
.agenda-card{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.09);
  border-radius:16px;overflow:hidden;margin-bottom:20px;width:100%}
.agenda-hdr{padding:16px 24px;border-bottom:1px solid rgba(255,255,255,.07);
  display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.ag-row{display:flex;align-items:center;gap:10px;padding:12px 24px;
  border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}
.ag-row:last-child{border-bottom:none}
.ag-row:hover{background:rgba(255,255,255,.03)}
.ag-hora{font-size:12px;font-weight:700;color:#93C5FD;background:rgba(37,99,235,.15);
  border:1px solid rgba(37,99,235,.3);border-radius:8px;padding:4px 10px;
  flex-shrink:0;min-width:50px;text-align:center}

/* ── Ações ── */
.ac-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;width:100%}
.ac-card{border-radius:14px;padding:16px;text-align:left;cursor:pointer;font-family:inherit;
  width:100%;box-sizing:border-box;text-decoration:none;display:block;transition:opacity .2s}
.ac-card:hover{opacity:.82}

/* ── Checklist ── */
.chk{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.09);
  border-radius:16px;padding:20px;margin-bottom:20px;width:100%}

/* ══════════════════════════════════════
   BREAKPOINTS MOBILE
══════════════════════════════════════ */
@media(max-width:1023px){
  .sb{display:none!important}
  .main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mob-hdr{display:flex!important}
  .body{padding:14px 16px 80px!important}

  /* topo mobile */
  .topo{flex-direction:column!important;align-items:stretch!important;gap:12px!important}
  .topo-btns{flex-direction:column!important;width:100%!important;gap:8px!important}
  .topo-btns a{width:100%!important;justify-content:center!important}

  /* card página ativa mobile */
  .pagina-ativa{flex-direction:column!important;align-items:stretch!important;gap:12px!important}
  .pagina-ativa-info{align-items:flex-start!important}
  .pagina-ativa-btns{width:100%!important;flex-direction:row!important}
  .pagina-ativa-btns a,.pagina-ativa-btns button{flex:1!important;justify-content:center!important;text-align:center!important}

  /* cards atalho 2 colunas mobile */
  .atl-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .atl-card{padding:16px!important;border-radius:14px!important}
  .atl-ico{width:38px!important;height:38px!important;font-size:18px!important;margin-bottom:10px!important}

  /* KPIs 2 colunas mobile */
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .kpi-card{padding:14px!important}
  .kpi-ico{width:34px!important;height:34px!important;font-size:15px!important;margin-bottom:8px!important}

  /* agenda mobile */
  .agenda-hdr{padding:14px 16px!important}
  .ag-row{padding:10px 16px!important;gap:8px!important}

  /* ações 2 colunas mobile */
  .ac-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
  .ac-card{padding:14px!important;border-radius:12px!important}
}

/* Telas muito pequenas — 1 coluna */
@media(max-width:360px){
  .atl-grid{grid-template-columns:1fr!important}
  .kpi-grid{grid-template-columns:1fr!important}
  .ac-grid{grid-template-columns:1fr!important}
  .body{padding:12px 12px 80px!important}
}
`

export default function Painel() {
  const [perfil, setPerfil]    = useState<any>(null)
  const [loading, setLoading]  = useState(true)
  const [mob, setMob]          = useState(false)
  const [copiado, setCopiado]  = useState(false)

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
          .gte('data_hora',hoje+'T00:00:00')
          .lte('data_hora',hoje+'T23:59:59')
          .neq('status','cancelado')
          .order('data_hora',{ascending:true}),
        supabase.from('agendamentos')
          .select('servicos(preco)')
          .eq('user_id',user.id)
          .gte('data_hora',mes+'-01')
          .neq('status','cancelado'),
        supabase.from('orcamentos')
          .select('status,saldo_restante,valor_pago')
          .eq('user_id',user.id),
        supabase.from('servicos').select('id').eq('user_id',user.id),
        supabase.from('profissionais').select('id').eq('user_id',user.id),
      ])

    setPerfil(p)
    setAgHoje(agsH?.length||0)
    setProxHoje(agsH||[])

    const amanha=new Date();amanha.setDate(amanha.getDate()+1)
    const {data:prox}=await supabase.from('agendamentos')
      .select('id').eq('user_id',user.id)
      .gte('data_hora',amanha.toISOString().split('T')[0]+'T00:00:00')
      .neq('status','cancelado')
    setProxCount(prox?.length||0)

    setRecMes((agsMes||[]).reduce((a:number,ag:any)=>a+(parseFloat(ag.servicos?.preco||'0')||0),0))

    const ab=(orcs||[]).filter(o=>!['Pago','Finalizado','Cancelado'].includes(o.status))
    setOrcAbertos(ab.length)
    setTotalReceber(ab.reduce((a,o)=>a+(o.saldo_restante||0),0))

    const {data:rets}=await supabase.from('agendamentos')
      .select('id').eq('user_id',user.id).eq('status','retorno')
    setRetornos(rets?.length||0)
    setPendentes((agsH||[]).filter((a:any)=>a.status==='pendente').length)

    setChecklist({
      temPerfil:!!(p?.nome_negocio&&p?.slug),
      temBanner:!!p?.banner_url,
      temServico:(servs?.length||0)>0,
      temProfissional:(profs?.length||0)>0,
      temWhatsapp:!!p?.whatsapp,
      slug:p?.slug||'',
    })
    setLoading(false)
  }

  async function logout(){
    await supabase.auth.signOut()
    window.location.href='/login'
  }
  function copiarLink(){
    navigator.clipboard.writeText((typeof window!=='undefined'?window.location.origin:'')+'/'+checklist.slug)
    setCopiado(true); setTimeout(()=>setCopiado(false),2000)
  }
  function fmtH(s:string){return new Date(s).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
  function fmtBRL(v:number){return v.toLocaleString('pt-BR',{minimumFractionDigits:2})}
  function fmtDia(){return new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'N').charAt(0).toUpperCase()
  const ac=avatarColor(nome)

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
        <span style={{fontSize:'14px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
      </div>
      <nav>
        {SIDEBAR_ITEMS.map(it=>(
          <Link key={it.label} href={it.href} className={'nl'+(it.active?' on':'')}>
            <span style={{fontSize:'15px'}}>{it.icon}</span>{it.label}
          </Link>
        ))}
      </nav>
      <div className="sb-foot">
        <div style={{width:'32px',height:'32px',borderRadius:'50%',background:ac,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
        <div style={{minWidth:0}}>
          <p style={{fontSize:'12px',fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p>
          <p style={{fontSize:'10px',color:'rgba(255,255,255,.4)',marginTop:'1px'}}>Administrador</p>
        </div>
      </div>
    </aside>
  )

  if(loading) return(
    <div style={{minHeight:'100vh',background:'#07111F',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#4B5563',fontSize:'14px'}}>Carregando...</p>
    </div>
  )

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#07111F',
      fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      overflowX:'hidden',width:'100%',maxWidth:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drawer${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
          <span style={{fontSize:'14px',fontWeight:800,color:'#fff'}}>ClienteMarcado</span>
          <button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.6)',cursor:'pointer',fontSize:'24px',lineHeight:1}}>×</button>
        </div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>
          {SIDEBAR_ITEMS.map(it=>(
            <Link key={it.label} href={it.href} onClick={()=>setMob(false)}
              className={'nl'+(it.active?' on':'')} style={{fontSize:'14px',padding:'11px 14px'}}>
              <span style={{fontSize:'18px'}}>{it.icon}</span>{it.label}
            </Link>
          ))}
        </nav>
        <div style={{padding:'14px 20px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:ac,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
          <div>
            <p style={{fontSize:'13px',fontWeight:600,color:'#fff'}}>{nome||'Meu negócio'}</p>
            <p style={{fontSize:'11px',color:'rgba(255,255,255,.4)'}}>Administrador</p>
          </div>
        </div>
      </div>

      <SB/>

      <div className="main">
        <div className="mob-hdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
            <span style={{display:'block',width:'16px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#fff'}}>ClienteMarcado</span>
          <div style={{width:'36px',height:'36px',borderRadius:'50%',background:ac,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>

        <div className="pg">
        <div className="body">

          {/* ── TOPO ── */}
          <div className="topo">
            <div style={{minWidth:0}}>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#fff',letterSpacing:'-0.03em',marginBottom:'4px',lineHeight:1.2}}>
                {nome?`Olá, ${nome} 👋`:'Painel ClienteMarcado'}
              </h1>
              <p style={{fontSize:'14px',color:'#64748B',lineHeight:1.5}}>
                Acompanhe sua agenda, clientes, cobranças e retornos em um só lugar.
              </p>
            </div>
            <div className="topo-btns">
              <Link href="/painel/agendamentos"
                style={{background:'#2563EB',color:'#fff',borderRadius:'10px',padding:'11px 18px',
                  fontSize:'13px',fontWeight:700,textDecoration:'none',display:'flex',
                  alignItems:'center',justifyContent:'center',gap:'6px',
                  boxShadow:'0 4px 16px rgba(37,99,235,.4)',whiteSpace:'nowrap'}}>
                📅 Novo agendamento
              </Link>
              <Link href="/painel/orcamentos"
                style={{background:'rgba(255,255,255,.07)',color:'#CBD5E1',
                  border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'11px 18px',
                  fontSize:'13px',fontWeight:600,textDecoration:'none',display:'flex',
                  alignItems:'center',justifyContent:'center',gap:'6px',whiteSpace:'nowrap'}}>
                📋 Novo orçamento
              </Link>
            </div>
          </div>

          {/* ── PÁGINA PÚBLICA ATIVA ── */}
          {chkOk&&checklist.slug&&(
            <div className="pagina-ativa">
              <div className="pagina-ativa-info">
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#22C55E',
                  flexShrink:0,marginTop:'5px',boxShadow:'0 0 8px rgba(34,197,94,.6)'}}/>
                <div style={{minWidth:0,flex:1}}>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#4ADE80',marginBottom:'3px'}}>
                    Sua página pública está ativa
                  </p>
                  <p style={{fontSize:'12px',color:'#64748B',marginBottom:'4px',lineHeight:1.4}}>
                    Compartilhe este link com seus clientes para receber agendamentos e contatos.
                  </p>
                  <p style={{fontSize:'11px',color:'#374151',overflow:'hidden',textOverflow:'ellipsis',
                    whiteSpace:'nowrap',maxWidth:'100%'}}>
                    {urlPub}
                  </p>
                </div>
              </div>
              <div className="pagina-ativa-btns">
                <a href={'/'+checklist.slug} target="_blank" rel="noopener noreferrer"
                  style={{background:'#22C55E',color:'#fff',borderRadius:'8px',padding:'9px 16px',
                    fontSize:'12px',fontWeight:700,textDecoration:'none',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',whiteSpace:'nowrap'}}>
                  🔗 Ver página
                </a>
                <button onClick={copiarLink}
                  style={{background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',
                    borderRadius:'8px',padding:'9px 14px',fontSize:'12px',fontWeight:600,
                    color:copiado?'#4ADE80':'#94A3B8',cursor:'pointer',fontFamily:'inherit',
                    whiteSpace:'nowrap',transition:'color .2s',display:'flex',
                    alignItems:'center',justifyContent:'center',gap:'5px'}}>
                  {copiado?'✓ Copiado!':'📋 Copiar link'}
                </button>
              </div>
            </div>
          )}

          {/* ── NOTIF PENDENTES ── */}
          {pendentes>0&&(
            <div style={{background:'rgba(37,99,235,.1)',border:'1px solid rgba(37,99,235,.22)',
              borderRadius:'12px',padding:'12px 16px',marginBottom:'16px',
              display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',
              width:'100%',boxSizing:'border-box' as const}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',minWidth:0}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#2563EB',flexShrink:0}}/>
                <p style={{fontSize:'13px',fontWeight:600,color:'#93C5FD',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {pendentes} agendamento{pendentes>1?'s':''} pendente{pendentes>1?'s':''} hoje
                </p>
              </div>
              <Link href="/painel/agendamentos"
                style={{fontSize:'12px',fontWeight:700,color:'#3B82F6',textDecoration:'none',flexShrink:0}}>
                Ver →
              </Link>
            </div>
          )}

          {/* ── CARDS ATALHO ── */}
          <div className="atl-grid">
            {[
              {label:'Agenda',     sub:'Veja e gerencie seus horários.',   icon:'📅',href:'/painel/agendamentos',cor:'#3B82F6',bg:'rgba(59,130,246,.1)', bd:'rgba(59,130,246,.22)'},
              {label:'Clientes',   sub:'Seus clientes em um só lugar.',    icon:'👥',href:'/painel/clientes',    cor:'#06B6D4',bg:'rgba(6,182,212,.1)',  bd:'rgba(6,182,212,.22)'},
              {label:'Orçamentos', sub:'Crie e acompanhe orçamentos.',     icon:'📋',href:'/painel/orcamentos',  cor:'#7C3AED',bg:'rgba(124,58,237,.1)',bd:'rgba(124,58,237,.22)'},
              {label:'Cobranças',  sub:'Gerencie cobranças e pagamentos.', icon:'💰',href:'/painel/financeiro',  cor:'#22C55E',bg:'rgba(34,197,94,.1)',  bd:'rgba(34,197,94,.22)'},
            ].map(a=>(
              <Link key={a.label} href={a.href} className="atl-card"
                style={{background:a.bg,border:`1px solid ${a.bd}`}}>
                <div className="atl-ico" style={{background:a.bg,border:`1px solid ${a.bd}`}}>
                  <span>{a.icon}</span>
                </div>
                <p style={{fontSize:'14px',fontWeight:700,color:'#fff',marginBottom:'4px',lineHeight:1.2}}>{a.label}</p>
                <p style={{fontSize:'11px',color:'#64748B',lineHeight:1.4}}>{a.sub}</p>
                <span style={{position:'absolute',top:'16px',right:'16px',color:a.cor,fontSize:'16px',opacity:.6}}>→</span>
              </Link>
            ))}
          </div>

          {/* ── KPIs ── */}
          <div className="kpi-grid">
            {[
              {label:'Atendimentos hoje',     valor:agHoje,       fmt:'n',  icon:'📅',cor:'#3B82F6',bg:'rgba(59,130,246,.1)', bd:'rgba(59,130,246,.2)'},
              {label:'Próximos agendamentos', valor:proxCount,     fmt:'n',  icon:'🗓️',cor:'#06B6D4',bg:'rgba(6,182,212,.1)',  bd:'rgba(6,182,212,.2)'},
              {label:'Orçamentos em aberto',  valor:orcAbertos,    fmt:'n',  icon:'📋',cor:'#7C3AED',bg:'rgba(124,58,237,.1)',bd:'rgba(124,58,237,.2)'},
              {label:'Total a receber',       valor:totalReceber,  fmt:'brl',icon:'⏳',cor:'#F59E0B',bg:'rgba(245,158,11,.1)', bd:'rgba(245,158,11,.2)'},
              {label:'Recebido no mês',       valor:recMes,        fmt:'brl',icon:'✅',cor:'#22C55E',bg:'rgba(34,197,94,.1)',  bd:'rgba(34,197,94,.2)'},
              {label:'Retornos pendentes',    valor:retornos,      fmt:'n',  icon:'🔄',cor:'#F59E0B',bg:'rgba(245,158,11,.1)', bd:'rgba(245,158,11,.2)'},
            ].map(m=>(
              <div key={m.label} className="kpi-card" style={{background:m.bg,border:`1px solid ${m.bd}`}}>
                <div className="kpi-ico" style={{background:m.bg,border:`1px solid ${m.bd}`}}>
                  <span>{m.icon}</span>
                </div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,
                  letterSpacing:'.06em',marginBottom:'4px',lineHeight:1.3}}>{m.label}</p>
                <p style={{fontSize:'22px',fontWeight:800,color:m.cor,letterSpacing:'-0.02em',lineHeight:1.1}}>
                  {m.fmt==='brl'?'R$ '+fmtBRL(m.valor as number):m.valor}
                </p>
              </div>
            ))}
          </div>

          {/* ── CHECKLIST ── */}
          {!chkOk&&(
            <div className="chk">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                <div>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#fff',marginBottom:'2px'}}>Configure seu negócio</p>
                  <p style={{fontSize:'12px',color:'#64748B'}}>{totalF} de {itensChk.length} etapas concluídas</p>
                </div>
                <span style={{fontSize:'13px',fontWeight:700,color:'#2563EB',flexShrink:0}}>{prog}%</span>
              </div>
              <div style={{height:'4px',background:'rgba(255,255,255,.07)',borderRadius:'999px',marginBottom:'14px',overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:'999px',background:'#2563EB',width:prog+'%',transition:'width .4s ease'}}/>
              </div>
              {itensChk.map(it=>(
                <Link key={it.texto} href={it.feito?'#':it.href}
                  style={{display:'flex',alignItems:'center',gap:'10px',padding:'6px 0',textDecoration:'none'}}>
                  <div style={{width:'20px',height:'20px',borderRadius:'50%',flexShrink:0,
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,
                    background:it.feito?'#22C55E':'transparent',
                    border:it.feito?'none':'1px solid rgba(255,255,255,.15)',
                    color:it.feito?'#fff':'transparent'}}>
                    {it.feito?'✓':''}
                  </div>
                  <span style={{fontSize:'13px',flex:1,color:it.feito?'#374151':'#CBD5E1',
                    fontWeight:it.feito?400:500,textDecoration:it.feito?'line-through':'none',lineHeight:1.4}}>
                    {it.texto}
                  </span>
                  {!it.feito&&<span style={{fontSize:'11px',color:'#2563EB',flexShrink:0}}>Configurar →</span>}
                </Link>
              ))}
            </div>
          )}

          {/* ── AGENDA DE HOJE ── */}
          <div className="agenda-card">
            <div className="agenda-hdr">
              <div style={{minWidth:0}}>
                <p style={{fontSize:'14px',fontWeight:700,color:'#fff',marginBottom:'2px'}}>Agenda de hoje</p>
                <p style={{fontSize:'11px',color:'#4B5563',textTransform:'capitalize' as const}}>{fmtDia()}</p>
              </div>
              <Link href="/painel/agendamentos"
                style={{fontSize:'12px',fontWeight:700,color:'#3B82F6',textDecoration:'none',
                  whiteSpace:'nowrap',flexShrink:0}}>
                Ver agenda →
              </Link>
            </div>

            {proxHoje.length===0?(
              <div style={{padding:'32px 16px',textAlign:'center'}}>
                <div style={{width:'44px',height:'44px',borderRadius:'50%',
                  background:'rgba(37,99,235,.12)',border:'1px solid rgba(37,99,235,.2)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:'20px',margin:'0 auto 12px'}}>📅</div>
                <p style={{fontSize:'14px',fontWeight:600,color:'#fff',marginBottom:'6px'}}>Nenhum atendimento hoje</p>
                <p style={{fontSize:'12px',color:'#4B5563',lineHeight:1.5,marginBottom:'16px',maxWidth:'260px',margin:'0 auto 16px'}}>
                  Quando houver horários marcados, eles aparecerão aqui.
                </p>
                <Link href="/painel/agendamentos"
                  style={{background:'#2563EB',color:'#fff',borderRadius:'8px',padding:'9px 20px',
                    fontSize:'13px',fontWeight:700,textDecoration:'none',
                    display:'inline-flex',alignItems:'center',gap:'6px'}}>
                  + Novo agendamento
                </Link>
              </div>
            ):(
              <>
                {proxHoje.slice(0,6).map((ag:any)=>{
                  const sc=ag.status==='confirmado'
                    ?{bg:'rgba(34,197,94,.12)',c:'#4ADE80',bd:'rgba(34,197,94,.25)',t:'Confirmado'}
                    :ag.status==='pendente'
                    ?{bg:'rgba(37,99,235,.12)',c:'#93C5FD',bd:'rgba(37,99,235,.25)',t:'Pendente'}
                    :{bg:'rgba(255,255,255,.06)',c:'#94A3B8',bd:'rgba(255,255,255,.1)',t:ag.status||'Agendado'}
                  const av=avatarColor(ag.cliente_nome||'A')
                  return(
                    <div key={ag.id} className="ag-row">
                      <div className="ag-hora">{fmtH(ag.data_hora)}</div>
                      <div style={{width:'30px',height:'30px',borderRadius:'50%',background:av,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:'12px',fontWeight:700,color:'#fff',flexShrink:0}}>
                        {(ag.cliente_nome||'?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:'13px',fontWeight:600,color:'#fff',marginBottom:'1px',
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {ag.cliente_nome||'—'}
                        </p>
                        <p style={{fontSize:'11px',color:'#4B5563',overflow:'hidden',
                          textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {ag.servicos?.nome}{ag.profissionais?.nome?' · '+ag.profissionais.nome:''}
                        </p>
                      </div>
                      <span style={{fontSize:'10px',fontWeight:700,padding:'3px 8px',borderRadius:'999px',
                        background:sc.bg,color:sc.c,border:`1px solid ${sc.bd}`,
                        whiteSpace:'nowrap',flexShrink:0}}>{sc.t}</span>
                    </div>
                  )
                })}
                {proxHoje.length>6&&(
                  <div style={{padding:'12px 16px',textAlign:'center'}}>
                    <Link href="/painel/agendamentos"
                      style={{fontSize:'13px',color:'#3B82F6',textDecoration:'none',fontWeight:600}}>
                      Ver todos os {proxHoje.length} atendimentos →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── AÇÕES RÁPIDAS ── */}
          <div style={{marginBottom:'32px'}}>
            <p style={{fontSize:'11px',fontWeight:700,color:'#374151',
              textTransform:'uppercase' as const,letterSpacing:'.09em',marginBottom:'12px'}}>
              Ações rápidas
            </p>
            <div className="ac-grid">
              {[
                {label:'Novo agendamento',   sub:'Agende um atendimento',   icon:'📅',href:'/painel/agendamentos',  bg:'rgba(37,99,235,.1)',  bd:'rgba(37,99,235,.2)'},
                {label:'Novo cliente',       sub:'Cadastre um contato',     icon:'👥',href:'/painel/clientes',      bg:'rgba(6,182,212,.1)', bd:'rgba(6,182,212,.2)'},
                {label:'Novo orçamento',     sub:'Crie em segundos',        icon:'📋',href:'/painel/orcamentos',    bg:'rgba(124,58,237,.1)',bd:'rgba(124,58,237,.2)'},
                {label:'Registrar pagamento',sub:'Marque como recebido',    icon:'💳',href:'/painel/financeiro',    bg:'rgba(34,197,94,.1)', bd:'rgba(34,197,94,.2)'},
                {label:'Novo serviço',       sub:'Cadastre um serviço',     icon:'🛎️',href:'/painel/servicos',      bg:'rgba(245,158,11,.1)',bd:'rgba(245,158,11,.2)'},
                {label:'Novo profissional',  sub:'Adicione à equipe',       icon:'👤',href:'/painel/profissionais', bg:'rgba(16,185,129,.1)',bd:'rgba(16,185,129,.2)'},
                {label:'Configurar horários',sub:'Ajuste funcionamento',    icon:'⚙️',href:'/painel/perfil',        bg:'rgba(107,114,128,.1)',bd:'rgba(107,114,128,.2)'},
                {label:'Bloqueios de agenda',sub:'Feche dias ou horários',  icon:'🚫',href:'/painel/bloqueios',     bg:'rgba(239,68,68,.1)', bd:'rgba(239,68,68,.2)'},
                {label:'Relatórios',         sub:'Veja indicadores',        icon:'📊',href:'/painel/relatorio',     bg:'rgba(6,182,212,.1)', bd:'rgba(6,182,212,.2)'},
              ].map(a=>(
                <Link key={a.label} href={a.href} className="ac-card"
                  style={{background:a.bg,border:`1px solid ${a.bd}`}}>
                  <span style={{fontSize:'19px',display:'block',marginBottom:'8px'}}>{a.icon}</span>
                  <p style={{fontSize:'12px',fontWeight:700,color:'#fff',marginBottom:'2px',lineHeight:1.3}}>{a.label}</p>
                  <p style={{fontSize:'11px',color:'#64748B',lineHeight:1.3}}>{a.sub}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <div style={{paddingTop:'16px',borderTop:'1px solid rgba(255,255,255,.06)',display:'flex',justifyContent:'flex-end'}}>
            <button onClick={logout}
              style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',
                borderRadius:'8px',padding:'8px 16px',fontSize:'13px',fontWeight:600,
                color:'#4B5563',cursor:'pointer',fontFamily:'inherit'}}>
              Sair da conta
            </button>
          </div>

        </div>
        </div>
      </div>
    </div>
  )
}
