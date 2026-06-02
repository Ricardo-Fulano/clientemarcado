'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const CHECKOUT_URL = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=5939bff1048d4e24849edaa1d2db8cc2"
const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

const beneficios = [
  { icon: '📅', titulo: 'Agendamento online', texto: 'Seu cliente agenda pelo celular, sem depender de mensagens manuais.' },
  { icon: '🔗', titulo: 'Página pública profissional', texto: 'Compartilhe seu link e receba agendamentos com uma página moderna do seu negócio.' },
  { icon: '🏪', titulo: 'Controle presencial', texto: 'Registre atendimentos no balcão em poucos segundos, mesmo quando o cliente chega sem agendar.' },
  { icon: '👥', titulo: 'Gestão da equipe', texto: 'Organize profissionais, serviços, horários e responsabilidades em um painel simples.' },
  { icon: '💳', titulo: 'Financeiro simples', texto: 'Acompanhe valores recebidos, cobranças e pendências sem depender de planilhas.' },
  { icon: '📊', titulo: 'Relatórios do negócio', texto: 'Veja o desempenho do período e acompanhe melhor sua operação.' },
]

const inclusos = [
  'Agenda online',
  'Página pública de agendamento',
  'Clientes',
  'Serviços e profissionais',
  'Perfil do negócio',
  'Orçamentos',
  'Cobranças',
  'Pagamentos',
  'Relatórios',
  'Confirmação e lembrete via WhatsApp',
  'Controle de comparecimento',
  'Histórico financeiro simples',
]

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  const scrollToPlano = () => {
    document.getElementById('plano')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ background: '#050B16', minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;width:100%;max-width:100%}
        .btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:0 28px;height:50px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:all .2s;box-shadow:0 12px 32px rgba(59,130,246,.25),0 0 28px rgba(124,58,237,.20);white-space:nowrap}
        .btn-p:hover{transform:translateY(-2px)}
        .btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.25);border-radius:14px;padding:0 28px;height:50px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:all .2s;white-space:nowrap}
        .btn-s:hover{border-color:rgba(124,58,237,.45);color:#fff}
        .card-b{background:radial-gradient(circle at top left,rgba(124,58,237,.07),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,20,33,.99));border:1px solid rgba(148,163,184,.13);border-radius:18px;padding:28px 24px;transition:border-color .2s,transform .2s}
        .card-b:hover{border-color:rgba(124,58,237,.28);transform:translateY(-3px)}
        @media(max-width:768px){
          .hero-btns{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
          .hero-btns button,.hero-btns a{width:100%!important}
          .grid-3{grid-template-columns:1fr!important}
          .cta-btns{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
          .cta-btns a{width:100%!important}
        }
      `}</style>

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: scrolled ? 'rgba(5,11,22,.97)' : 'transparent', backdropFilter: 'blur(20px)', borderBottom: scrolled ? '1px solid rgba(148,163,184,.10)' : '1px solid transparent', transition: 'all .3s', padding: '0 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,.45)', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>ClienteMarcado</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none', fontWeight: 500 }}>Entrar</Link>
            <button onClick={scrollToPlano} className="btn-p" style={{ height: '40px', padding: '0 20px', fontSize: '13px', borderRadius: '10px' }}>Assinar agora</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={{ padding: '100px 24px 80px', textAlign: 'center', background: 'radial-gradient(ellipse at 50% -10%,rgba(124,58,237,.22),transparent 55%)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,.10)', border: '1px solid rgba(59,130,246,.22)', borderRadius: '999px', padding: '6px 18px', marginBottom: '36px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6', display: 'inline-block', flexShrink: 0 }}/>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#60A5FA', letterSpacing: '.04em' }}>Agendamento inteligente para negócios locais</span>
          </div>
          <h1 style={{ fontSize: 'clamp(38px,6vw,66px)', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px' }}>
            Seu cliente agenda sozinho.<br />
            <span style={{ background: G, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Você só atende.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,17px)', color: '#94A3B8', lineHeight: 1.75, marginBottom: '44px', maxWidth: '580px', margin: '0 auto 44px' }}>
            Organize agendamentos, clientes, equipe e financeiro em um painel simples. O ClienteMarcado ajuda barbearias, salões, clínicas, estéticas e consultórios a venderem melhor e perderem menos clientes.
          </p>
          <div className="hero-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={scrollToPlano} className="btn-p">Quero meu acesso por R$ 97/mês</button>
            <Link href="/login" className="btn-s">Já tenho conta</Link>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <h2 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '12px' }}>Tudo que seu negócio precisa</h2>
          <p style={{ fontSize: '15px', color: '#94A3B8', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>Do agendamento ao financeiro, em um painel simples e completo.</p>
        </div>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
          {beneficios.map((b, i) => (
            <div key={i} className="card-b">
              <div style={{ fontSize: '28px', marginBottom: '16px' }}>{b.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px' }}>{b.titulo}</h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.65 }}>{b.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANO ÚNICO */}
      <section id="plano" style={{ padding: '80px 24px', background: 'radial-gradient(ellipse at 50% 50%,rgba(124,58,237,.09),transparent 65%)' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '12px' }}>Um plano. Tudo incluso.</h2>
            <p style={{ fontSize: '15px', color: '#94A3B8', lineHeight: 1.6 }}>Tudo que seu negócio precisa para organizar agenda, clientes, equipe, cobranças e pagamentos em um só painel.</p>
          </div>
          <div style={{ background: 'radial-gradient(ellipse at top,rgba(124,58,237,.16),transparent 55%),rgba(15,23,42,.97)', border: '1.5px solid rgba(124,58,237,.50)', borderRadius: '22px', padding: '40px 36px', boxShadow: '0 0 64px rgba(124,58,237,.14)', position: 'relative' as const }}>
            <div style={{ position: 'absolute' as const, top: '-13px', left: '50%', transform: 'translateX(-50%)', background: G, borderRadius: '999px', padding: '4px 18px', fontSize: '11px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' as const }}>🚀 Preço de lançamento</div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC', marginBottom: '8px' }}>ClienteMarcado Completo</h3>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '52px', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.03em' }}>R$ 97</span>
                <span style={{ fontSize: '15px', color: '#94A3B8' }}>/mês</span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B' }}>Cancele quando quiser</p>
            </div>
            <div style={{ marginBottom: '32px' }}>
              {inclusos.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ color: '#22C55E', fontSize: '14px', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#CBD5E1' }}>{item}</span>
                </div>
              ))}
            </div>
            <a href={CHECKOUT_URL} target="_blank" rel="noreferrer" className="btn-p" style={{ width: '100%', justifyContent: 'center', height: '52px', fontSize: '15px' }}>
              Começar agora
            </a>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#475569', marginTop: '16px' }}>Acesso imediato após a assinatura</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'radial-gradient(ellipse at 50% 50%,rgba(124,58,237,.10),transparent 60%)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.2 }}>
            Pronto para organizar seu negócio de vez?
          </h2>
          <p style={{ fontSize: '15px', color: '#94A3B8', marginBottom: '36px', lineHeight: 1.7 }}>
            Comece hoje com o ClienteMarcado e tenha agenda, clientes, cobranças e relatórios em um só lugar.
          </p>
          <div className="cta-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={CHECKOUT_URL} target="_blank" rel="noreferrer" className="btn-p">Assinar por R$ 97/mês</a>
            <Link href="/login" className="btn-s">Já tenho conta</Link>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', marginTop: '20px' }}>Sem fidelidade. Cancele quando quiser.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(148,163,184,.08)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#334155' }}>© 2026 ClienteMarcado. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
