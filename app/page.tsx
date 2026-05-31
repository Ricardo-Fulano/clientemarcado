'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const ESSENCIAL_CHECKOUT_URL = "https://SEU-LINK-ESSENCIAL"
const COMPLETO_CHECKOUT_URL = "https://SEU-LINK-COMPLETO"

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'
const G2 = 'linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'

const beneficios = [
  { icon: '📅', titulo: 'Agendamento online', texto: 'Seu cliente agenda pelo celular, sem depender de mensagens manuais.' },
  { icon: '🔗', titulo: 'Página pública', texto: 'Compartilhe seu link e receba agendamentos de forma prática e profissional.' },
  { icon: '🏪', titulo: 'Controle presencial', texto: 'Registre atendimentos no balcão em poucos segundos.' },
  { icon: '👥', titulo: 'Gestão da equipe', texto: 'Organize profissionais, serviços e horários em um painel simples.' },
  { icon: '💳', titulo: 'Financeiro simples', texto: 'Acompanhe recebimentos, cobranças e movimentações com mais controle.' },
  { icon: '📊', titulo: 'Relatórios', texto: 'Tenha uma visão clara da operação e acompanhe o desempenho do negócio.' },
]

const comparacao = [
  { item: 'Agenda online', essencial: true, completo: true },
  { item: 'Clientes', essencial: true, completo: true },
  { item: 'Serviços e profissionais', essencial: true, completo: true },
  { item: 'Página pública de agendamento', essencial: true, completo: true },
  { item: 'Perfil do negócio', essencial: true, completo: true },
  { item: 'Orçamentos', essencial: false, completo: true },
  { item: 'Cobranças', essencial: false, completo: true },
  { item: 'Pagamentos', essencial: false, completo: true },
  { item: 'Relatórios', essencial: false, completo: true },
]

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <div style={{ background: '#050B16', minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;width:100%;max-width:100%}
        .btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:0 28px;height:50px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:all .18s;box-shadow:0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.26);white-space:nowrap}
        .btn-p:hover{transform:translateY(-2px)}
        .btn-s{background:rgba(15,23,42,.88);color:#CBD5E1;border:1px solid rgba(148,163,184,.25);border-radius:14px;padding:0 28px;height:50px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:all .18s;white-space:nowrap}
        .btn-s:hover{border-color:rgba(124,58,237,.45);color:#fff}
        .card-b{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 60%),linear-gradient(145deg,rgba(15,23,42,.95),rgba(8,20,33,.98));border:1px solid rgba(148,163,184,.14);border-radius:18px;padding:28px 24px;transition:border-color .2s,transform .2s}
        .card-b:hover{border-color:rgba(124,58,237,.30);transform:translateY(-2px)}
        @media(max-width:768px){
          .hero-btns{flex-direction:column!important;align-items:stretch!important}
          .hero-btns a,.hero-btns button{width:100%!important}
          .grid-3{grid-template-columns:1fr!important}
          .grid-2{grid-template-columns:1fr!important}
          .planos-grid{grid-template-columns:1fr!important}
          .cta-btns{flex-direction:column!important;align-items:stretch!important}
          .cta-btns a{width:100%!important}
        }
      `}</style>

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: scrolled ? 'rgba(5,11,22,.96)' : 'transparent', backdropFilter: 'blur(20px)', borderBottom: scrolled ? '1px solid rgba(148,163,184,.12)' : '1px solid transparent', transition: 'all .3s', padding: '0 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,.5)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>ClienteMarcado</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none', fontWeight: 500 }}>Entrar</Link>
            <Link href="/cadastro" className="btn-p" style={{ height: '38px', padding: '0 18px', fontSize: '13px', borderRadius: '10px' }}>Criar conta grátis</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={{ padding: '100px 24px 80px', textAlign: 'center', background: 'radial-gradient(circle at 50% 0%,rgba(124,58,237,.18),transparent 60%),radial-gradient(circle at 80% 50%,rgba(37,99,235,.12),transparent 40%)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.25)', borderRadius: '999px', padding: '6px 16px', marginBottom: '32px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA', letterSpacing: '.06em', textTransform: 'uppercase' }}>Agendamento inteligente para negócios locais</span>
          </div>
          <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '24px' }}>
            Seu cliente agenda sozinho.<br />
            <span style={{ background: G, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Você só atende.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: '#94A3B8', lineHeight: 1.7, marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
            Organize agenda, clientes, equipe e atendimentos em um só lugar. O ClienteMarcado ajuda barbearias, salões, clínicas, estéticas e consultórios a venderem melhor e perderem menos clientes.
          </p>
          <div className="hero-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/cadastro" className="btn-p">Criar minha agenda grátis</Link>
            <a href="#planos" className="btn-s">Ver planos</a>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '12px' }}>Tudo que seu negócio precisa</h2>
          <p style={{ fontSize: '15px', color: '#94A3B8' }}>Do agendamento ao financeiro, em um painel simples e completo.</p>
        </div>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
          {beneficios.map((b, i) => (
            <div key={i} className="card-b">
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>{b.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px' }}>{b.titulo}</h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6 }}>{b.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" style={{ padding: '80px 24px', background: 'radial-gradient(circle at 50% 50%,rgba(124,58,237,.10),transparent 60%)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '12px' }}>Escolha o plano ideal para o seu negócio</h2>
            <p style={{ fontSize: '15px', color: '#94A3B8' }}>Comece com o Essencial ou evolua para o Completo quando quiser mais controle e gestão.</p>
          </div>
          <div className="planos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Essencial */}
            <div style={{ background: 'rgba(15,23,42,.95)', border: '1px solid rgba(148,163,184,.18)', borderRadius: '22px', padding: '36px 32px' }}>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.08em' }}>Para começar</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC', marginBottom: '8px' }}>Plano Essencial</h3>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '40px', fontWeight: 900, color: '#F8FAFC' }}>R$ 97</span>
                <span style={{ fontSize: '14px', color: '#94A3B8' }}>/mês</span>
              </div>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px', lineHeight: 1.6 }}>Para negócios que querem organizar agenda e atendimento sem complicação.</p>
              <div style={{ marginBottom: '28px' }}>
                {['Agenda online','Clientes','Serviços','Profissionais','Página pública de agendamento','Perfil do negócio','Horários de funcionamento'].map((item,i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ color: '#22C55E', fontSize: '13px' }}>✓</span>
                    <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{item}</span>
                  </div>
                ))}
              </div>
              <a href={ESSENCIAL_CHECKOUT_URL} target="_blank" rel="noreferrer" className="btn-s" style={{ width: '100%', justifyContent: 'center' }}>Quero o Essencial</a>
            </div>
            {/* Completo */}
            <div style={{ background: 'radial-gradient(circle at top left,rgba(124,58,237,.15),transparent 50%),rgba(15,23,42,.95)', border: '1.5px solid rgba(124,58,237,.45)', borderRadius: '22px', padding: '36px 32px', boxShadow: '0 0 60px rgba(124,58,237,.15)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: G, borderRadius: '999px', padding: '4px 16px', fontSize: '11px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>⭐ Mais escolhido</div>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#C4B5FD', textTransform: 'uppercase', letterSpacing: '.08em' }}>Gestão completa</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC', marginBottom: '8px' }}>Plano Completo</h3>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '40px', fontWeight: 900, color: '#F8FAFC' }}>R$ 149</span>
                <span style={{ fontSize: '14px', color: '#94A3B8' }}>/mês</span>
              </div>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px', lineHeight: 1.6 }}>Para negócios que querem agenda + financeiro + controle completo da operação.</p>
              <div style={{ marginBottom: '28px' }}>
                {['Tudo do Essencial','Orçamentos','Cobranças','Pagamentos','Relatórios','Controle a receber','Histórico financeiro simples'].map((item,i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ color: '#22C55E', fontSize: '13px' }}>✓</span>
                    <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{item}</span>
                  </div>
                ))}
              </div>
              <a href={COMPLETO_CHECKOUT_URL} target="_blank" rel="noreferrer" className="btn-p" style={{ width: '100%', justifyContent: 'center' }}>Quero o Plano Completo</a>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARAÇÃO */}
      <section style={{ padding: '60px 24px', maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#F8FAFC', textAlign: 'center', marginBottom: '32px', letterSpacing: '-0.02em' }}>Compare os planos</h2>
        <div style={{ background: 'rgba(15,23,42,.95)', border: '1px solid rgba(148,163,184,.14)', borderRadius: '18px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', padding: '14px 24px', borderBottom: '1px solid rgba(148,163,184,.10)', background: 'rgba(124,58,237,.08)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.06em' }}>Recurso</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.06em' }}>Essencial</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#C4B5FD', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.06em' }}>Completo</span>
          </div>
          {comparacao.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', padding: '14px 24px', borderBottom: i < comparacao.length - 1 ? '1px solid rgba(148,163,184,.07)' : 'none', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{r.item}</span>
              <span style={{ textAlign: 'center', fontSize: '16px' }}>{r.essencial ? '✓' : '—'}</span>
              <span style={{ textAlign: 'center', fontSize: '16px', color: r.completo ? '#22C55E' : '#475569' }}>{r.completo ? '✓' : '—'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'radial-gradient(circle at 50% 50%,rgba(124,58,237,.12),transparent 60%)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.2 }}>
            Pronto para parar de perder clientes e organizar seu negócio?
          </h2>
          <p style={{ fontSize: '15px', color: '#94A3B8', marginBottom: '36px', lineHeight: 1.7 }}>
            Escolha seu plano e comece a usar o ClienteMarcado para agendar melhor, atender melhor e ter mais controle do dia a dia.
          </p>
          <div className="cta-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={ESSENCIAL_CHECKOUT_URL} target="_blank" rel="noreferrer" className="btn-s">Começar com o Essencial</a>
            <a href={COMPLETO_CHECKOUT_URL} target="_blank" rel="noreferrer" className="btn-p">Quero o Plano Completo</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(148,163,184,.10)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#475569' }}>© 2026 ClienteMarcado. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
