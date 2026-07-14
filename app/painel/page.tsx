'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import PainelSidebar from '@/app/components/PainelSidebar'

const G='linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV='linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'

// Ícones SVG inline profissionais
const IcoCalendar=({c='#60A5FA',s=18}:{c?:string,s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoClock=({c='#C4B5FD',s=18}:{c?:string,s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IcoClipboard=({c='#FBBF24',s=18}:{c?:string,s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
const IcoCreditCard=({c='#F87171',s=18}:{c?:string,s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const IcoCheck=({c='#4ADE80',s=18}:{c?:string,s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoUsers=({c='#22D3EE',s=18}:{c?:string,s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IcoWallet=({c='#C4B5FD',s=18}:{c?:string,s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 11h.01"/><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/></svg>
const IcoTag=({c='#22D3EE',s=18}:{c?:string,s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
const IcoUser=({c='#C4B5FD',s=18}:{c?:string,s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoBar=({c='#FBBF24',s=18}:{c?:string,s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const IcoLink=({c='#4ADE80',s=18}:{c?:string,s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>

const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh}
.bdy{max-width:1200px;margin:0 auto;padding:28px 32px 80px;width:100%}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.10),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px}
.btn-p{background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;height:46px;padding:0 20px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:all .18s;font-family:inherit;cursor:pointer;text-decoration:none;box-shadow:0 8px 24px rgba(59,130,246,.25)}
.btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.20);border-radius:12px;height:44px;padding:0 16px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-family:inherit;cursor:pointer;text-decoration:none}
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
.atalho-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
.atalho{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.16);border-radius:16px;padding:18px 14px;text-decoration:none;display:flex;flex-direction:column;gap:8px;transition:all .18s}
.atalho:hover{background:linear-gradient(145deg,rgba(20,30,55,.97),rgba(12,25,45,.99));border-color:rgba(59,130,246,.35);transform:translateY(-2px)}
.ag-item{background:rgba(15,23,42,.72);border:1px solid rgba(148,163,184,.14);border-radius:12px;padding:12px 14px;margin-bottom:6px}
@media(max-width:1023px){
  .psb-main .bdy{padding:14px 14px 80px!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important}
  .kpi-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .atalho-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .mob-hide{display:none!important}
  .mob-show{display:block!important}
}
@media(min-width:1024px){.mob-show{display:none!important}}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr!important}.atalho-grid{grid-template-columns:1fr 1fr!important}}
`

export default function Home(){
  const [perfil,setPerfil]=useState<any>(null)
  const [agendamentos,setAgendamentos]=useState<any[]>([])
  const [orcamentos,setOrcamentos]=useState<any[]>([])
  const [pagamentos,setPagamentos]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [copied,setCopied]=useState(false)
  useEffect(()=>{load()},[])
  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    const [{data:p},{data:ags},{data:orcs},{data:pags}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('agendamentos').select('*').eq('user_id',user.id).order('data_hora'),
      supabase.from('orcamentos').select('*').eq('user_id',user.id),
      supabase.from('pagamentos').select('valor,data').eq('user_id',user.id),
    ])
    setPerfil(p);setAgendamentos(ags||[]);setOrcamentos(orcs||[]);setPagamentos(pags||[]);setLoading(false)
  }
  const hoje=new Date().toISOString().split('T')[0]
  const agsHoje=agendamentos.filter(a=>a.data_hora?.startsWith(hoje))
  const proximos=agendamentos.filter(a=>a.data_hora>new Date().toISOString()&&a.status!=='cancelado').slice(0,5)
  const mesAtual=new Date().toISOString().slice(0,7)
  const recMes=pagamentos.filter(p=>p.data?.startsWith(mesAtual)).reduce((a,p)=>a+(p.valor||0),0)
  const fBRL=(v:number)=>`R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2})}`
  const orcsAbertos=orcamentos.filter(o=>o.status==='aberto'||o.status==='em_andamento').length
  const saldoRaw=orcamentos.filter(o=>o.status!=='pago'&&o.status!=='cancelado').reduce((a,o)=>(o.valor_total||0)-(o.valor_pago||0)+a,0)
const saldo=Math.max(0,saldoRaw)
  const nome=perfil?.nome_negocio||'seu negócio'
  const slug=perfil?.slug||''
  const ini=(nome||'C').charAt(0).toUpperCase()
  const pubUrl=slug?`${typeof window!=='undefined'?window.location.origin:''}/${slug}`:''
  function copiarLink(){if(pubUrl)navigator.clipboard.writeText(pubUrl);setCopied(true);setTimeout(()=>setCopied(false),2000)}
  const fmtHora=(s:string)=>new Date(s).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
  const fmtData=(s:string)=>new Date(s).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})
  if(loading)return(<div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}><p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p></div>)
  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',overflowX:'hidden',width:'100%',position:'relative'}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <PainelSidebar nome={nome} tituloMobile="Início"/>
      <div className="psb-main">
        <div className="pg"><div className="bdy">
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
            <div>
              <h1 style={{fontSize:'24px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.04em',marginBottom:'5px'}}>Olá, {nome}!</h1>
              <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.5}}>Acompanhe sua agenda, pacientes, cobranças e retornos em um só lugar.</p>
            </div>
            <div style={{display:'flex',gap:'8px',flexShrink:0,flexWrap:'wrap'}}>
              <Link href="/painel/agendamentos/novo" className="btn-p">+ Novo agendamento</Link>
              <Link href="/painel/orcamentos/novo" className="btn-s">+ Novo orçamento</Link>
            </div>
          </div>
          {/* Agenda de hoje - mobile */}
          <div className="mob-show">
            <div style={{marginBottom:'12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Agenda de hoje</p>
              <a href="/painel/agendamentos" style={{fontSize:'12px',color:'#64748B',textDecoration:'none'}}>Ver tudo</a>
            </div>
            {agsHoje.length===0?(
              <div className="crd" style={{padding:'28px 20px',textAlign:'center',marginBottom:'16px'}}>
                <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'rgba(59,130,246,.14)',border:'1px solid rgba(59,130,246,.24)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}><IcoCalendar c="#60A5FA" s={22}/></div>
                <p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC',marginBottom:'4px'}}>Nenhum atendimento hoje</p>
                <p style={{fontSize:'12px',color:'#64748B',marginBottom:'14px'}}>Quando houver horários marcados, aparecerão aqui.</p>
                <a href="/painel/agendamentos/novo" style={{background:'linear-gradient(135deg,#3B82F6,#7C3AED)',color:'#fff',borderRadius:'10px',padding:'8px 16px',fontSize:'13px',fontWeight:700,textDecoration:'none',display:'inline-block'}}>+ Novo agendamento</a>
              </div>
            ):(
              <div style={{marginBottom:'16px'}}>
                {agsHoje.map(a=>(
                  <div key={a.id} className="ag-item">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                      <div><p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC'}}>{a.cliente_nome||'—'}</p><p style={{fontSize:'12px',color:'#94A3B8'}}>{fmtHora(a.data_hora)}</p></div>
                      <span style={{fontSize:'11px',fontWeight:600,padding:'3px 10px',borderRadius:'999px',background:'rgba(59,130,246,.14)',color:'#93C5FD',border:'1px solid rgba(59,130,246,.28)'}}>{a.status||'pendente'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {slug&&(
            <div className="crd" style={{padding:'16px 20px',marginBottom:'20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'rgba(34,197,94,.14)',border:'1px solid rgba(34,197,94,.28)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IcoLink c="#4ADE80" s={18}/></div>
                <div><p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',marginBottom:'2px'}}>Sua página pública está ativa</p><p style={{fontSize:'11px',color:'#64748B'}}>Compartilhe com seus pacientes para receber agendamentos online.</p></div>
              </div>
              <div style={{display:'flex',gap:'8px',flexShrink:0}}>
                <a href={pubUrl} target="_blank" rel="noreferrer" className="btn-s" style={{height:'36px',fontSize:'12px'}}>Ver página</a>
                <button onClick={copiarLink} className="btn-p" style={{height:'36px',fontSize:'12px'}}>{copied?'Copiado!':'Copiar link'}</button>
              </div>
            </div>
          )}
          <div className="kpi-grid">
            {([
              {l:'Atendimentos hoje',v:agsHoje.length,c:'#60A5FA',bg:'rgba(59,130,246,.10)',bd:'rgba(59,130,246,.24)',I:<IcoCalendar c="#60A5FA"/>},
              {l:'Próximos agendamentos',v:proximos.length,c:'#C4B5FD',bg:'rgba(124,58,237,.10)',bd:'rgba(124,58,237,.24)',I:<IcoClock c="#C4B5FD"/>},
              {l:'Orçamentos em aberto',v:orcsAbertos,c:'#FBBF24',bg:'rgba(245,158,11,.10)',bd:'rgba(245,158,11,.24)',I:<IcoClipboard c="#FBBF24"/>},
              {l:'Total a receber',v:fBRL(saldo||0),c:'#F87171',bg:'rgba(239,68,68,.10)',bd:'rgba(239,68,68,.24)',I:<IcoCreditCard c="#F87171"/>},
              {l:'Recebido no mês',v:fBRL(recMes),c:'#4ADE80',bg:'rgba(34,197,94,.10)',bd:'rgba(34,197,94,.24)',I:<IcoCheck c="#4ADE80"/>},
              {l:'Pacientes cadastrados',v:0,c:'#22D3EE',bg:'rgba(6,182,212,.10)',bd:'rgba(6,182,212,.24)',I:<IcoUsers c="#22D3EE"/>},
            ] as any[]).map((k:any)=>(
              <div key={k.l} style={{background:`radial-gradient(circle at top left,${k.bg},transparent 60%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))`,border:`1.5px solid ${k.bd}`,borderRadius:'18px',padding:'18px 16px'}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:k.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'8px'}}>{k.I}</div>
                <p style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>{k.l}</p>
                <p style={{fontSize:'22px',fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</p>
              </div>
            ))}
          </div>
          <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>Acesso rápido</p>
          <div className="atalho-grid">
            {([
              {h:'/painel/agendamentos',l:'Agenda',I:<IcoCalendar c="#60A5FA" s={17}/>,bg:'rgba(59,130,246,.10)'},
              {h:'/painel/clientes',l:'Pacientes',I:<IcoUsers c="#4ADE80" s={17}/>,bg:'rgba(34,197,94,.10)'},
              {h:'/painel/orcamentos',l:'Orçamentos',I:<IcoClipboard c="#FBBF24" s={17}/>,bg:'rgba(245,158,11,.10)'},
              {h:'/painel/cobrancas',l:'Cobranças',I:<IcoWallet c="#C4B5FD" s={17}/>,bg:'rgba(124,58,237,.10)'},
              {h:'/painel/pagamentos',l:'Pagamentos',I:<IcoCheck c="#4ADE80" s={17}/>,bg:'rgba(34,197,94,.10)'},
              {h:'/painel/servicos',l:'Serviços',I:<IcoTag c="#22D3EE" s={17}/>,bg:'rgba(6,182,212,.10)'},
              {h:'/painel/profissionais',l:'Profissionais',I:<IcoUser c="#C4B5FD" s={17}/>,bg:'rgba(124,58,237,.10)'},
              {h:'/painel/relatorio',l:'Relatórios',I:<IcoBar c="#FBBF24" s={17}/>,bg:'rgba(245,158,11,.10)'},
            ] as any[]).map((a:any)=>(
              <Link key={a.h} href={a.h} className="atalho">
                <div style={{width:'34px',height:'34px',borderRadius:'10px',background:a.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>{a.I}</div>
                <p style={{fontSize:'13px',fontWeight:600,color:'#CBD5E1'}}>{a.l}</p>
              </Link>
            ))}
          </div>
          <div className="mob-hide">
            <div style={{marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Agenda de hoje</p>
              <Link href="/painel/agendamentos" style={{fontSize:'12px',color:'#64748B',textDecoration:'none'}}>Ver tudo</Link>
            </div>
            {agsHoje.length===0?(
              <div className="crd" style={{padding:'36px 24px',textAlign:'center',marginBottom:'24px'}}>
                <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'rgba(59,130,246,.14)',border:'1px solid rgba(59,130,246,.24)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}><IcoCalendar c="#60A5FA" s={26}/></div>
                <p style={{fontSize:'15px',fontWeight:600,color:'#F8FAFC',marginBottom:'5px'}}>Nenhum atendimento hoje</p>
                <p style={{fontSize:'13px',color:'#64748B',marginBottom:'16px'}}>Quando houver horários marcados, eles aparecerão aqui.</p>
                <Link href="/painel/agendamentos/novo" className="btn-p" style={{display:'inline-flex'}}>+ Novo agendamento</Link>
              </div>
            ):(
              <div style={{marginBottom:'24px'}}>
                {agsHoje.map(a=>(
                  <div key={a.id} className="ag-item">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                      <div><p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC'}}>{a.cliente_nome||'—'}</p><p style={{fontSize:'12px',color:'#94A3B8'}}>{fmtHora(a.data_hora)}</p></div>
                      <span style={{fontSize:'11px',fontWeight:600,padding:'3px 10px',borderRadius:'999px',background:'rgba(59,130,246,.14)',color:'#93C5FD',border:'1px solid rgba(59,130,246,.28)'}}>{a.status||'confirmado'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {proximos.length>0&&(
              <>
                <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',marginBottom:'12px'}}>Próximos agendamentos</p>
                {proximos.map(a=>(
                  <div key={a.id} className="ag-item">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',flexWrap:'wrap'}}>
                      <div><p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC'}}>{a.cliente_nome||'—'}</p><p style={{fontSize:'12px',color:'#94A3B8'}}>{fmtData(a.data_hora)} - {fmtHora(a.data_hora)}</p></div>
                      <span style={{fontSize:'11px',fontWeight:600,padding:'3px 10px',borderRadius:'999px',background:'rgba(124,58,237,.14)',color:'#C4B5FD',border:'1px solid rgba(124,58,237,.28)'}}>{a.status||'confirmado'}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div></div>
      </div>
    </div>
  )
}
