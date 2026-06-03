'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

const CHECKOUT_URL = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=1a0fb25c46214e45b0eb3d21b494e5d6"
const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

const SB_ITEMS = [
  {h:'/painel',l:'Inicio'},
  {h:'/painel/agendamentos',l:'Agenda'},
  {h:'/painel/clientes',l:'Clientes'},
  {h:'/painel/orcamentos',l:'Orcamentos'},
  {h:'/painel/cobrancas',l:'Cobrancas'},
  {h:'/painel/pagamentos',l:'Pagamentos'},
  {h:'/painel/servicos',l:'Servicos'},
  {h:'/painel/profissionais',l:'Profissionais'},
  {h:'/painel/relatorio',l:'Relatorios'},
  {h:'/painel/perfil',l:'Configuracoes'},
]

function TelaBloqueada({ status }: { status: string }) {
  const bloqueado = status === 'bloqueado'
  return (
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at top,rgba(124,58,237,.12),transparent 50%),linear-gradient(180deg,#060C18,#050B16)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif'}}>
      <div style={{width:'100%',maxWidth:'480px',background:'rgba(15,23,42,.95)',border:'1px solid rgba(124,58,237,.30)',borderRadius:'22px',padding:'40px 32px',textAlign:'center',boxShadow:'0 32px 80px rgba(0,0,0,.5)'}}>
        <div style={{width:'68px',height:'68px',borderRadius:'50%',background:bloqueado?'rgba(239,68,68,.10)':'rgba(100,116,139,.10)',border:bloqueado?'1px solid rgba(239,68,68,.25)':'1px solid rgba(100,116,139,.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:'30px'}}>
          {bloqueado?'🔒':'⛔'}
        </div>
        <h2 style={{fontSize:'22px',fontWeight:800,color:'#F8FAFC',marginBottom:'12px'}}>{bloqueado?'Acesso temporariamente bloqueado':'Acesso cancelado'}</h2>
        <p style={{fontSize:'14px',color:'#94A3B8',lineHeight:1.7,marginBottom:'32px'}}>
          {bloqueado?'Identificamos uma pendencia na sua mensalidade.':'Seu acesso foi encerrado. Entre em contato com o suporte.'}
        </p>
        <a href={CHECKOUT_URL} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'50px',background:G,color:'#fff',borderRadius:'14px',textDecoration:'none',fontSize:'14px',fontWeight:700}}>
          Regularizar pagamento
        </a>
      </div>
    </div>
  )
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const [perfil, setPerfil] = useState<any>(null)
  const [status, setStatus] = useState<string>('ativo')
  const [vencimento, setVencimento] = useState<string|undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [mob, setMob] = useState(false)
  const [mopen, setMopen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const chk = () => setMob(window.innerWidth < 768)
    chk(); window.addEventListener('resize', chk)
    return () => window.removeEventListener('resize', chk)
  }, [])

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()
      setPerfil(p)
      setStatus(p?.status_acesso || 'ativo')
      setVencimento(p?.data_vencimento || undefined)
      setLoading(false)
    }
    verificar()
  }, [])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#475569',fontSize:'14px'}}>Carregando...</p>
    </div>
  )

  if (status === 'bloqueado' || status === 'cancelado') {
    return <TelaBloqueada status={status} />
  }

  const ini = perfil?.nome_negocio?.charAt(0)?.toUpperCase() || 'N'
  const cssLayout = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
    input,select,textarea{color-scheme:dark}
    .sb{width:240px;min-height:100vh;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);border-right:1px solid rgba(148,163,184,.14);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
    .sb-logo{padding:22px 18px 16px;border-bottom:1px solid rgba(148,163,184,.10);display:flex;align-items:center;gap:10px}
    .sb-ic{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#3B82F6,#7C3AED);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(124,58,237,.45);flex-shrink:0}
    .sb-name{font-size:14px;font-weight:800;color:#F8FAFC;letter-spacing:-0.02em}
    .sb-nav{flex:1;padding:12px 10px;overflow-y:auto}
    .sb-item{display:flex;align-items:center;gap:10px;padding:10px 10px;border-radius:10px;font-size:13px;font-weight:600;color:#64748B;text-decoration:none;margin-bottom:2px;transition:all .15s;cursor:pointer;border:none;background:none;font-family:inherit;width:100%}
    .sb-item:hover{background:rgba(255,255,255,.05);color:#94A3B8}
    .sb-item.on{background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;box-shadow:0 4px 16px rgba(59,130,246,.25)}
    .sb-foot{padding:14px 12px;border-top:1px solid rgba(148,163,184,.10);display:flex;align-items:center;gap:10px}
    .sb-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#7C3AED);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0}
    .sb-biz{font-size:12px;font-weight:700;color:#F8FAFC;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .sb-role{font-size:10px;color:#475569}
    .pg{flex:1;min-width:0;overflow-y:auto;background:#050B16}
    .bdy{max-width:1200px;margin:0 auto;padding:28px 24px}
    .mob-hdr{display:none;align-items:center;justify-content:space-between;padding:14px 16px;background:rgba(5,11,22,.97);border-bottom:1px solid rgba(148,163,184,.10);position:sticky;top:0;z-index:20;backdrop-filter:blur(20px)}
    @media(max-width:768px){
      .sb{transform:translateX(-100%);transition:transform .25s;z-index:50}
      .sb.open{transform:translateX(0)}
      .mob-hdr{display:flex}
      .bdy{padding:16px 14px}
    }
    @media(min-width:769px){.mob-hdr{display:none}}
    .aviso-atr{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.28);border-radius:16px;padding:14px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
    .aviso-test{background:rgba(124,58,237,.10);border:1px solid rgba(124,58,237,.28);border-radius:16px;padding:14px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
  `

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#050B16',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <style>{cssLayout}</style>

      {/* Sidebar */}
      <aside className={`sb${mob && mopen ? ' open' : ''}`}>
        <div className="sb-logo">
          <div className="sb-ic">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <span className="sb-name">ClienteMarcado</span>
        </div>
        <nav className="sb-nav">
          {SB_ITEMS.map(({h,l}) => (
            <Link key={h} href={h} onClick={() => setMopen(false)}
              className={`sb-item${pathname === h || (h !== '/painel' && pathname?.startsWith(h)) ? ' on' : ''}`}>
              {l}
            </Link>
          ))}
        </nav>
        <div className="sb-foot">
          <div className="sb-av">{ini}</div>
          <div style={{minWidth:0}}>
            <p className="sb-biz">{perfil?.nome_negocio||'Negocio'}</p>
            <p className="sb-role">Administrador</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mob && mopen && <div onClick={() => setMopen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:40,backdropFilter:'blur(4px)'}}/>}

      {/* Content */}
      <div className="pg" style={{marginLeft: mob ? 0 : '240px'}}>
        {/* Mobile header */}
        <div className="mob-hdr">
          <button onClick={() => setMopen(o => !o)} style={{background:'none',border:'none',color:'#F8FAFC',cursor:'pointer',padding:4}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span style={{fontSize:'14px',fontWeight:800,color:'#F8FAFC'}}>ClienteMarcado</span>
          <div style={{width:22}}/>
        </div>

        <div className="bdy">
          {/* Aviso status */}
          {status === 'em_atraso' && (
            <div className="aviso-atr">
              <div>
                <p style={{fontSize:13,fontWeight:700,color:'#FCD34D',marginBottom:3}}>Sua mensalidade esta pendente</p>
                <p style={{fontSize:12,color:'#B45309',lineHeight:1.5}}>Regularize o pagamento para evitar o bloqueio do painel.</p>
              </div>
              <a href={CHECKOUT_URL} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',height:38,padding:'0 18px',background:G,color:'#fff',borderRadius:10,textDecoration:'none',fontSize:12,fontWeight:700,whiteSpace:'nowrap',flexShrink:0}}>Regularizar pagamento</a>
            </div>
          )}
          {status === 'teste_gratis' && (
            <div className="aviso-test">
              <div>
                <p style={{fontSize:13,fontWeight:700,color:'#C4B5FD',marginBottom:3}}>Voce esta no teste gratis do ClienteMarcado</p>
                <p style={{fontSize:12,color:'#7C3AED',lineHeight:1.5}}>Aproveite 7 dias para testar o painel completo.{vencimento?' Termina em: '+vencimento:''}</p>
              </div>
              <a href={CHECKOUT_URL} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',height:38,padding:'0 18px',background:G,color:'#fff',borderRadius:10,textDecoration:'none',fontSize:12,fontWeight:700,whiteSpace:'nowrap',flexShrink:0}}>Assinar agora</a>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}
