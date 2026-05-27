'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const AVATAR_COLORS=['linear-gradient(135deg,#2563EB,#7C3AED)','linear-gradient(135deg,#7C3AED,#EC4899)','linear-gradient(135deg,#06B6D4,#2563EB)','linear-gradient(135deg,#16A34A,#06B6D4)','linear-gradient(135deg,#DC2626,#7C3AED)','linear-gradient(135deg,#D97706,#EC4899)']
function avatarGrad(n:string){return AVATAR_COLORS[(n||'A').charCodeAt(0)%AVATAR_COLORS.length]}

const SB_ITEMS=[
  {href:'/painel',label:'Início',icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>},
  {href:'/painel/agendamentos',label:'Agenda',icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01"/></svg>},
  {href:'/painel/clientes',label:'Clientes',icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
  {href:'/painel/orcamentos',label:'Orçamentos',icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><rect x="3" y="6" width="18" height="16" rx="2"/><path d="M8 12h8M8 16h5"/></svg>},
  {href:'/painel/financeiro',label:'Cobranças',icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><path d="M20 12a2 2 0 0 1 0 4h-2a2 2 0 0 1 0-4h2z"/></svg>},
  {href:'/painel/financeiro',label:'Pagamentos',icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>},
  {href:'/painel/servicos',label:'Serviços',icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/></svg>},
  {href:'/painel/profissionais',label:'Profissionais',icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>},
  {href:'/painel/relatorio',label:'Relatórios',icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>},
  {href:'/painel/perfil',label:'Configurações',icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>},
]

const MOTIVOS=['Almoço','Pausa','Folga','Manutenção','Ausência','Reunião','Curso','Feriado','Horário indisponível','Outro']

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%}
input,select,textarea{color-scheme:dark}
select option{background:#070F1D;color:#F8FAFC}
.sb{width:220px;min-height:100vh;background:linear-gradient(180deg,#070F1D,#050B16);border-right:1px solid rgba(148,163,184,.12);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.sb-logo{padding:20px 16px 16px;border-bottom:1px solid rgba(148,163,184,.08);display:flex;align-items:center;gap:8px}
.sb-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#2563EB,#7C3AED);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 18px rgba(124,58,237,.45)}
.sb nav{flex:1;padding:10px 8px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:400;color:#94A3B8;transition:all .18s;border:1px solid transparent;white-space:nowrap}
.nl:hover{background:rgba(124,58,237,.12);color:#F8FAFC;border-color:rgba(124,58,237,.28)}
.nl.on{background:linear-gradient(135deg,#2563EB,#7C3AED);color:#fff;font-weight:600;box-shadow:0 0 24px rgba(124,58,237,.36);border-color:rgba(255,255,255,.1)}
.sb-foot{padding:10px;border-top:1px solid rgba(148,163,184,.08)}
.mob-hdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.94);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.1);position:sticky;top:0;z-index:20;flex-shrink:0;width:100%;max-width:100%}
.drawer{position:fixed;top:0;left:0;bottom:0;width:300px;max-width:85vw;background:linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .3s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.12)}
.drawer.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .3s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:220px;flex:1;min-height:100vh;display:flex;flex-direction:column;width:calc(100% - 220px);max-width:calc(100% - 220px)}
.pg{background:radial-gradient(circle at top left,rgba(239,68,68,.12),transparent 30%),radial-gradient(circle at top right,rgba(124,58,237,.10),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;width:100%;overflow-x:hidden}
.body{max-width:1100px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.btn-pri{background:linear-gradient(135deg,#2563EB,#7C3AED);color:#fff;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:11px 20px;font-size:13px;font-weight:700;box-shadow:0 12px 30px rgba(37,99,235,.28);text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;transition:all .2s;font-family:inherit;cursor:pointer}
.btn-pri:hover{box-shadow:0 16px 38px rgba(37,99,235,.38),0 0 34px rgba(124,58,237,.40);transform:translateY(-1px)}
.btn-sec{background:rgba(15,23,42,.86);color:#CBD5E1;border:1px solid rgba(148,163,184,.18);border-radius:10px;padding:11px 18px;font-size:13px;font-weight:600;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;transition:all .2s;font-family:inherit;cursor:pointer}
.btn-sec:hover{background:rgba(124,58,237,.12);border-color:rgba(124,58,237,.35);color:#fff}
.inp{width:100%;background:rgba(15,23,42,.88);border:1.5px solid rgba(148,163,184,.18);border-radius:10px;padding:11px 14px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s}
.inp:focus{border-color:rgba(37,99,235,.6);box-shadow:0 0 0 3px rgba(37,99,235,.14)}
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
.blk-card{background:linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98));border:1px solid rgba(239,68,68,.22);border-radius:16px;padding:14px 16px;margin-bottom:8px;transition:border-color .2s,box-shadow .2s}
.blk-card:hover{border-color:rgba(239,68,68,.40);box-shadow:0 0 20px rgba(239,68,68,.10)}
@media(max-width:1023px){
  .sb{display:none!important}
  .main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mob-hdr{display:flex!important}
  .body{padding:14px 16px 80px!important}
  .topo{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .topo-btns{flex-direction:column!important;width:100%!important;gap:8px!important}
  .topo-btns a,.topo-btns button{width:100%!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .form-grid{grid-template-columns:1fr!important;gap:10px!important}
}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}}
`

export default function Bloqueios(){
  const [perfil,setPerfil]=useState<any>(null)
  const [profissionais,setProfissionais]=useState<any[]>([])
  const [bloqueios,setBloqueios]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [mob,setMob]=useState(false)
  const [mensagem,setMensagem]=useState('')
  const [salvando,setSalvando]=useState(false)

  // Form state
  const [profId,setProfId]=useState('todos')
  const [data,setData]=useState(new Date().toISOString().split('T')[0])
  const [horaI,setHoraI]=useState('12:00')
  const [horaF,setHoraF]=useState('13:00')
  const [motivo,setMotivo]=useState('Almoço')
  const [motivoCustom,setMotivoCustom]=useState('')

  useEffect(()=>{init()},[])

  async function init(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:profs},{data:blks}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('id,nome').eq('user_id',user.id).order('nome'),
      supabase.from('bloqueios').select('*,profissionais(nome)').eq('user_id',user.id).order('data',{ascending:true}).order('hora_inicio',{ascending:true}),
    ])
    setPerfil(p);setProfissionais(profs||[]);setBloqueios(blks||[])
    setLoading(false)
  }

  async function salvar(){
    if(!data||!horaI||!horaF){setMensagem('⚠ Preencha data e horários.');return}
    if(horaF<=horaI){setMensagem('⚠ Hora fim deve ser maior que hora início.');return}
    setSalvando(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSalvando(false);return}
    const mot=motivo==='Outro'?(motivoCustom.trim()||'Indisponível'):motivo
    const payload={
      user_id:user.id,
      profissional_id:profId==='todos'?null:profId,
      data,hora_inicio:horaI,hora_fim:horaF,
      motivo:mot,
      geral:profId==='todos',
    }
    const {data:novo,error}=await supabase.from('bloqueios').insert(payload).select('*,profissionais(nome)').single()
    if(error){setMensagem('Erro ao salvar. Tente novamente.');setSalvando(false);return}
    setBloqueios(prev=>[...prev,novo].sort((a,b)=>a.data>b.data?1:a.hora_inicio>b.hora_inicio?1:-1))
    limpar()
    setMensagem('Bloqueio adicionado! ✓')
    setTimeout(()=>setMensagem(''),2500)
    setSalvando(false)
  }

  async function excluir(id:string){
    await supabase.from('bloqueios').delete().eq('id',id)
    setBloqueios(prev=>prev.filter(b=>b.id!==id))
    setMensagem('Bloqueio removido.')
    setTimeout(()=>setMensagem(''),2000)
  }

  function limpar(){
    setProfId('todos');setData(new Date().toISOString().split('T')[0])
    setHoraI('12:00');setHoraF('13:00');setMotivo('Almoço');setMotivoCustom('')
  }

  function fmtData(s:string){return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}

  const hoje=new Date().toISOString().split('T')[0]
  const fim7=new Date();fim7.setDate(fim7.getDate()+7)
  const blkHoje=bloqueios.filter(b=>b.data===hoje)
  const blkSemana=bloqueios.filter(b=>b.data>=hoje&&b.data<=fim7.toISOString().split('T')[0])
  const profsAfetados=new Set(bloqueios.filter(b=>b.profissional_id&&b.data>=hoje).map(b=>b.profissional_id)).size
  const proximo=bloqueios.find(b=>b.data>=hoje)

  const nome=perfil?.nome_negocio||''
  const ini=(nome||'B').charAt(0).toUpperCase()
  const grad=avatarGrad(nome)

  const Sidebar=()=>(
    <aside className="sb">
      <div className="sb-logo">
        <div className="sb-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>ClienteMarcado</span>
      </div>
      <nav>
        {SB_ITEMS.map(it=>(
          <Link key={it.label} href={it.href} className="nl">
            {it.icon}<span>{it.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sb-foot">
        <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(15,23,42,.78)',border:'1px solid rgba(148,163,184,.12)',borderRadius:'10px',padding:'10px 12px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff',flexShrink:0}}>{ini}</div>
          <div style={{minWidth:0}}>
            <p style={{fontSize:'12px',fontWeight:600,color:'#F8FAFC',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nome||'Meu negócio'}</p>
            <p style={{fontSize:'10px',color:'#64748B'}}>Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  )

  if(loading)return(
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p>
    </div>
  )

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',maxWidth:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className={`ovl${mob?' open':''}`} onClick={()=>setMob(false)}/>
      <div className={`drawer${mob?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid rgba(148,163,184,.1)'}}>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span>
          <button onClick={()=>setMob(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:'24px',lineHeight:1}}>×</button>
        </div>
        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>
          {SB_ITEMS.map(it=>(
            <Link key={it.label} href={it.href} onClick={()=>setMob(false)} className="nl" style={{fontSize:'14px',padding:'11px 14px'}}>
              {it.icon}<span>{it.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <Sidebar/>
      <div className="main">
        <div className="mob-hdr">
          <button onClick={()=>setMob(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'8px',display:'flex',flexDirection:'column',gap:'5px'}}>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
            <span style={{display:'block',width:'22px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
            <span style={{display:'block',width:'16px',height:'2px',background:'rgba(255,255,255,.8)',borderRadius:'2px'}}/>
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>Bloqueio de horários</span>
          <div style={{width:'36px',height:'36px',borderRadius:'50%',background:grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:'#fff'}}>{ini}</div>
        </div>

        <div className="pg">
        <div className="body">

          {/* Toast */}
          {mensagem&&(
            <div style={{position:'fixed',top:'20px',left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,rgba(239,68,68,.22),rgba(124,58,237,.18))',border:'1px solid rgba(239,68,68,.38)',borderRadius:'10px',padding:'10px 20px',zIndex:99,color:'#F87171',fontSize:'13px',fontWeight:700,backdropFilter:'blur(20px)',whiteSpace:'nowrap'}}>
              {mensagem}
            </div>
          )}

          {/* Cabeçalho */}
          <div className="topo" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.03em',marginBottom:'4px'}}>Bloqueio de horários</h1>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5}}>Bloqueie horários para pausas, folgas, ausências, manutenção ou indisponibilidades.</p>
            </div>
            <div className="topo-btns" style={{display:'flex',gap:'8px',flexShrink:0}}>
              <Link href="/painel/agendamentos" className="btn-sec" style={{fontSize:'12px',padding:'9px 14px'}}>
                ← Voltar à agenda
              </Link>
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              {label:'Bloqueios hoje',val:blkHoje.length,ico:'🚫',c:'#F87171',bg:'rgba(239,68,68,.1)',bd:'rgba(239,68,68,.28)'},
              {label:'Esta semana',val:blkSemana.length,ico:'📅',c:'#FBBF24',bg:'rgba(245,158,11,.1)',bd:'rgba(245,158,11,.28)'},
              {label:'Profissionais afetados',val:profsAfetados,ico:'👤',c:'#22D3EE',bg:'rgba(6,182,212,.1)',bd:'rgba(6,182,212,.28)'},
              {label:'Total cadastrado',val:bloqueios.length,ico:'📋',c:'#A78BFA',bg:'rgba(124,58,237,.1)',bd:'rgba(124,58,237,.28)'},
              {label:'Gerais (equipe toda)',val:bloqueios.filter(b=>b.geral).length,ico:'🏢',c:'#C4B5FD',bg:'rgba(139,92,246,.1)',bd:'rgba(139,92,246,.28)'},
              {label:'Por profissional',val:bloqueios.filter(b=>!b.geral).length,ico:'👥',c:'#F472B6',bg:'rgba(236,72,153,.1)',bd:'rgba(236,72,153,.28)'},
            ].map(k=>(
              <div key={k.label} style={{background:'linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98))',border:`1px solid ${k.bd}`,borderRadius:'14px',padding:'14px',boxSizing:'border-box' as const}}>
                <div style={{width:'34px',height:'34px',borderRadius:'10px',background:k.bg,border:`1px solid ${k.bd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',marginBottom:'8px'}}>{k.ico}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',marginBottom:'3px'}}>{k.label}</p>
                <p style={{fontSize:'22px',fontWeight:800,color:k.c,letterSpacing:'-0.02em',lineHeight:1.1}}>{k.val}</p>
              </div>
            ))}
          </div>

          {/* Formulário */}
          <div style={{background:'linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98))',border:'1.5px solid rgba(239,68,68,.24)',borderRadius:'18px',padding:'24px',marginBottom:'24px',boxShadow:'0 18px 45px rgba(0,0,0,.34)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'18px'}}>
              <div style={{width:'36px',height:'36px',borderRadius:'12px',background:'rgba(239,68,68,.16)',border:'1px solid rgba(239,68,68,.30)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>🚫</div>
              <div>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>Adicionar bloqueio</p>
                <p style={{fontSize:'12px',color:'#64748B'}}>Bloqueie um horário específico na agenda da equipe.</p>
              </div>
            </div>

            {/* Profissional */}
            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'11px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:'6px'}}>Profissional</label>
              <select className="inp" value={profId} onChange={e=>setProfId(e.target.value)}>
                <option value="todos">🏢 Todos os profissionais (equipe inteira)</option>
                {profissionais.map((p:any)=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <p style={{fontSize:'11px',color:profId==='todos'?'#FBBF24':'#64748B',marginTop:'5px',paddingLeft:'2px'}}>
                {profId==='todos'?'⚠ Este bloqueio será aplicado para toda a equipe.':'Este bloqueio será aplicado apenas para este profissional.'}
              </p>
            </div>

            {/* Data */}
            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'11px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:'6px'}}>Data</label>
              <input className="inp" type="date" value={data} onChange={e=>setData(e.target.value)}/>
            </div>

            {/* Horas */}
            <div className="form-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
              <div>
                <label style={{fontSize:'11px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:'6px'}}>Hora início</label>
                <input className="inp" type="time" value={horaI} onChange={e=>setHoraI(e.target.value)}/>
              </div>
              <div>
                <label style={{fontSize:'11px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:'6px'}}>Hora fim</label>
                <input className="inp" type="time" value={horaF} onChange={e=>setHoraF(e.target.value)}/>
                {horaF&&horaI&&horaF<=horaI&&<p style={{fontSize:'11px',color:'#F87171',marginTop:'4px'}}>⚠ Hora fim deve ser maior que hora início.</p>}
              </div>
            </div>

            {/* Motivo */}
            <div style={{marginBottom:'20px'}}>
              <label style={{fontSize:'11px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:'6px'}}>Motivo</label>
              <select className="inp" value={motivo} onChange={e=>setMotivo(e.target.value)} style={{marginBottom:'8px'}}>
                {MOTIVOS.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
              {motivo==='Outro'&&(
                <input className="inp" type="text" placeholder="Descreva o motivo..." value={motivoCustom} onChange={e=>setMotivoCustom(e.target.value)}/>
              )}
            </div>

            {/* Ações */}
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
              <button onClick={salvar} disabled={salvando} className="btn-pri" style={{flex:1,minWidth:'160px',background:salvando?'rgba(37,99,235,.5)':'linear-gradient(135deg,#2563EB,#7C3AED)',opacity:salvando?.7:1}}>
                {salvando?'Salvando...':<>🚫 Adicionar bloqueio</>}
              </button>
              <button onClick={limpar} className="btn-sec" style={{padding:'11px 16px'}}>Limpar</button>
            </div>
          </div>

          {/* Lista de bloqueios */}
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Bloqueios cadastrados</p>
              <span style={{fontSize:'12px',color:'#64748B'}}>{bloqueios.length} registro{bloqueios.length!==1?'s':''}</span>
            </div>

            {bloqueios.length===0?(
              <div style={{background:'linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.98))',border:'1px solid rgba(148,163,184,.14)',borderRadius:'18px',padding:'52px 24px',textAlign:'center'}}>
                <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.24)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 16px'}}>🚫</div>
                <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'6px'}}>Nenhum bloqueio cadastrado</p>
                <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5,maxWidth:'280px',margin:'0 auto 20px'}}>Você ainda não registrou horários indisponíveis. Adicione acima para bloquear períodos na agenda.</p>
              </div>
            ):(
              bloqueios.map((b:any)=>{
                const isGeral=b.geral||!b.profissional_id
                const profNome=b.profissionais?.nome||'Equipe inteira'
                const profG=avatarGrad(profNome)
                return(
                  <div key={b.id} className="blk-card">
                    <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                      {/* Ícone */}
                      <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'rgba(239,68,68,.14)',border:'1px solid rgba(239,68,68,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>
                        {isGeral?'🏢':'👤'}
                      </div>

                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginBottom:'2px'}}>
                          <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC'}}>{profNome}</p>
                          <span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'999px',background:isGeral?'rgba(245,158,11,.15)':'rgba(239,68,68,.15)',color:isGeral?'#FBBF24':'#F87171',border:`1px solid ${isGeral?'rgba(245,158,11,.3)':'rgba(239,68,68,.3)'}`}}>
                            {isGeral?'Geral':'Individual'}
                          </span>
                        </div>
                        <p style={{fontSize:'12px',color:'#64748B'}}>
                          📅 {fmtData(b.data)} · ⏰ {b.hora_inicio} às {b.hora_fim}
                          {b.motivo&&<span style={{color:'#94A3B8'}}> · {b.motivo}</span>}
                        </p>
                      </div>

                      {/* Excluir */}
                      <button onClick={()=>excluir(b.id)}
                        style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.24)',borderRadius:'8px',padding:'7px 12px',fontSize:'12px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit',transition:'all .15s',flexShrink:0}}
                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(239,68,68,.22)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='rgba(239,68,68,.1)')}>
                        Excluir
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

        </div>
        </div>
      </div>
    </div>
  )
}
