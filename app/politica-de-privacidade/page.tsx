'use client'

import Link from 'next/link'
import SeletorIdiomaGlobal from '../components/SeletorIdiomaGlobal'
import { useIdiomaGlobal } from '../components/IdiomaProviderGlobal'
import { PRIVACIDADE_28 } from '../lib/i18n-global/privacidade-28'
import { normalizarIdioma } from '../lib/i18n-global/idiomas'

const DATA = '2026-11-28'
const EMAIL = 'minipagepro@gmail.com'
const WHATSAPP = 'https://wa.me/5511941059063'

export default function Privacidade() {
  const { idioma } = useIdiomaGlobal()
  const locale = normalizarIdioma(idioma)
  const p = PRIVACIDADE_28[locale]
  const data = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(DATA + 'T12:00:00Z'))
  return (
    <main className="mp28" lang={locale}>
      <style>{`
        .mp28{min-height:100vh;background:radial-gradient(ellipse at top,#21182D 0%,#0B0A10 65%);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff;padding:32px 16px 64px;box-sizing:border-box}
        .mp28 *{box-sizing:border-box}
        .mp28 .wrap{max-width:860px;margin:0 auto;width:100%}
        .mp28 .top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:24px}
        .mp28 .marca{display:inline-flex;align-items:center;gap:10px;color:#fff;font-size:19px;font-weight:800;text-decoration:none}
        .mp28 .marca-icon{display:grid;place-items:center;background:#0B0A10;border:1px solid #544267;color:#C9FA45;width:38px;height:38px;border-radius:10px}
        .mp28 .card{background:#21182D;border:1px solid #443451;border-radius:20px;padding:36px;box-shadow:0 12px 36px rgba(0,0,0,.2)}
        .mp28 h1{font-size:clamp(25px,4vw,34px);letter-spacing:-.03em;margin:0 0 12px;line-height:1.2}
        .mp28 h2{font-size:18px;font-weight:700;line-height:1.4;color:#fff;margin:0 0 8px}
        .mp28 p{font-size:15px;line-height:1.75;color:#D8D0E2;margin:0;overflow-wrap:anywhere}
        .mp28 .intro{padding-bottom:22px;border-bottom:1px solid #443451}
        .mp28 .date{font-size:12px;color:#C5BCD1;margin-top:12px}
        .mp28 .secao{padding:20px 0;border-bottom:1px solid #443451;scroll-margin-top:24px}
        .mp28 .secao:last-child{border-bottom:0}
        .mp28 a:not(.marca):not(.btn){color:#C9FA45;text-underline-offset:3px;overflow-wrap:anywhere}
        .mp28 .links{display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin-top:12px;font-size:14px;line-height:1.5}
        .mp28 .nav{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
        .mp28 .btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 16px;border-radius:12px;border:1px solid #544267;background:#21182D;color:#fff;text-decoration:none;font-weight:600;font-size:14px;text-align:center}
        .mp28 .primary{background:#C9FA45;color:#0B0A10;border-color:#C9FA45;font-weight:700}
        .mp28 a:focus-visible,.mp28 select:focus-visible{outline:2px solid #C9FA45;outline-offset:4px}
        @media(max-width:600px){.mp28{padding:20px 12px 40px}.mp28 .card{padding:22px 18px;border-radius:16px}.mp28 .nav .btn{flex:1 1 100%}.mp28 .top{gap:12px}}
      `}</style>
      <div className="wrap">
        <header className="top">
          <Link href="/" className="marca" aria-label="MiniPage Pro">
            <span className="marca-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
            <span>MiniPage <span style={{color:'#C9FA45'}}>Pro</span></span>
          </Link>
          <SeletorIdiomaGlobal compacto />
        </header>
        <article className="card">
          <header className="intro">
            <h1>{p.titulo}</h1>
            <p>{p.intro}</p>
            <p className="date">{p.atualizacao}: <time dateTime={DATA}>{data}</time> · {p.versao} 1.2</p>
          </header>
          {p.secoes.map((s, i) => (
            <section key={i} className="secao" id={i === 14 ? 'google-login' : i === 16 ? 'google-exclusao' : `secao-${i+1}`}>
              <h2>{s.t}</h2>
              <p>{s.c}</p>
              {i === 12 && <div className="links"><a href={`mailto:${EMAIL}`}>{p.contato}: {EMAIL}</a><a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp: +55 11 94105-9063</a></div>}
              {i === 15 && <div className="links"><a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">{p.politicaGoogle}</a></div>}
              {i === 16 && <div className="links"><a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer">{p.revogar}</a><a href={`mailto:${EMAIL}`}>{p.contato}: {EMAIL}</a></div>}
            </section>
          ))}
        </article>
        <nav className="nav">
          <Link href="/" className="btn">← {p.voltar}</Link>
          <Link href="/termos-de-uso" className="btn">{p.termos}</Link>
          <Link href="/contrato-de-adesao" className="btn">{p.contrato}</Link>
          <Link href="/cadastro?plano=free" className="btn primary">{p.cadastro} →</Link>
        </nav>
      </div>
    </main>
  )
}
