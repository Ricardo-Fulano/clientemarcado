'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'
const AV = 'linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'

const LINKS = [
  { h: '/painel',               l: 'Início'        },
  { h: '/painel/agendamentos',  l: 'Agenda'        },
  { h: '/painel/clientes',      l: 'Clientes'      },
  { h: '/painel/orcamentos',    l: 'Orçamentos'    },
  { h: '/painel/cobrancas',     l: 'Cobranças'     },
  { h: '/painel/pagamentos',    l: 'Pagamentos'    },
  { h: '/painel/servicos',      l: 'Serviços'      },
  { h: '/painel/profissionais', l: 'Profissionais' },
  { h: '/painel/relatorio',     l: 'Relatórios'    },
  { h: '/painel/parceiros',     l: 'Parceiros'     },
  { h: '/painel/suporte',       l: 'Suporte'       },
  { h: '/painel/perfil',        l: 'Configurações' },
]

const CSS = `
.psb{width:240px;min-height:100vh;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);border-right:1px solid rgba(148,163,184,.14);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.psb-logo{padding:22px 18px 16px;border-bottom:1px solid rgba(148,163,184,.10);display:flex;align-items:center;gap:10px}
.psb-ic{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#3B82F6,#7C3AED);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 20px rgba(124,58,237,.5)}
.psb nav{flex:1;padding:10px 8px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:500;color:#94A3B8;transition:all .15s;border:1px solid transparent;white-space:nowrap}
.nl:hover{background:rgba(124,58,237,.10);border-color:rgba(124,58,237,.20);color:#fff}
.nl.on{background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;font-weight:700;border-color:rgba(255,255,255,.10);box-shadow:0 0 26px rgba(124,58,237,.34),inset 0 1px 0 rgba(255,255,255,.12)}
.psb-foot{padding:12px 10px;border-top:1px solid rgba(148,163,184,.10)}
.psb-mhdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.96);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.12);position:fixed;top:0;left:0;right:0;z-index:20;width:100%}
.psb-drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.14)}
.psb-drw.open{transform:translateX(0)}
.psb-ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.psb-ovl.open{opacity:1;pointer-events:auto}
.psb-main{margin-left:240px;flex:1;min-height:100vh;width:calc(100% - 240px);max-width:calc(100% - 240px);overflow-x:hidden}
@media(max-width:1023px){html,body{overflow-x:hidden!important;width:100%!important;max-width:100vw!important}
  .psb{display:none!important}
  .psb-main{margin-left:0!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:hidden!important;box-sizing:border-box!important;padding-top:56px!important}
  .psb-mhdr{display:flex!important}
}
`

interface Props {
  nome?: string
  tituloMobile?: string
}

export default function PainelSidebar({ nome = '', tituloMobile = 'Painel' }: Props) {
  const [mob, setMob] = useState(false)
  const path = usePathname()
  const ini = (nome || 'C').charAt(0).toUpperCase()

  function ativo(href: string) {
    if (href === '/painel') return path === '/painel'
    return path.startsWith(href)
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {LINKS.map(it => (
        <Link
          key={it.h}
          href={it.h}
          prefetch={false}
          onClick={onClick}
          className={'nl' + (ativo(it.h) ? ' on' : '')}
        >
          {it.l}
        </Link>
      ))}
    </>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Overlay mobile */}
      <div className={`psb-ovl${mob ? ' open' : ''}`} onClick={() => setMob(false)} />

      {/* Drawer mobile */}
      <div className={`psb-drw${mob ? ' open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(148,163,184,.10)' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC' }}>ClienteMarcado</span>
          <button onClick={() => setMob(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>×</button>
        </div>
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          <NavLinks onClick={() => setMob(false)} />
        </nav>
      </div>

      {/* Sidebar desktop */}
      <aside className="psb">
        <div className="psb-logo">
          <div className="psb-ic">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>ClienteMarcado</span>
        </div>
        <nav><NavLinks /></nav>
        <div className="psb-foot">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(148,163,184,.12)', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: AV, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{ini}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome || 'Meu negócio'}</p>
              <p style={{ fontSize: '10px', color: '#64748B' }}>Administrador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Header mobile */}
      <div className="psb-mhdr">
        <button onClick={() => setMob(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {[22, 22, 16].map((w, i) => (
            <span key={i} style={{ display: 'block', width: `${w}px`, height: '2px', background: 'rgba(255,255,255,.8)', borderRadius: '2px' }} />
          ))}
        </button>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC' }}>{tituloMobile}</span>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: AV, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff' }}>{ini}</div>
      </div>
    </>
  )
}
