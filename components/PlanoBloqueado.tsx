'use client'
import Link from 'next/link'

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

interface Props {
  recurso?: string
}

export default function PlanoBloqueado({ recurso }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left,rgba(124,58,237,.18),transparent 35%),radial-gradient(circle at bottom right,rgba(37,99,235,.12),transparent 30%),linear-gradient(135deg,#050B16 0%,#07111F 50%,#050B16 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(15,23,42,.92)',
        border: '1px solid rgba(124,58,237,.35)',
        borderRadius: '22px',
        boxShadow: '0 32px 80px rgba(0,0,0,.5),0 0 60px rgba(124,58,237,.12)',
        padding: '40px 36px',
        textAlign: 'center',
      }}>
        {/* Ícone */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg,rgba(124,58,237,.25),rgba(59,130,246,.20))',
          border: '1px solid rgba(124,58,237,.40)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 0 32px rgba(124,58,237,.20)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#lockGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="lockGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3B82F6"/>
                <stop offset="100%" stopColor="#7C3AED"/>
              </linearGradient>
            </defs>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(124,58,237,.15)',
          border: '1px solid rgba(124,58,237,.30)',
          borderRadius: '999px',
          padding: '4px 14px',
          marginBottom: '20px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#C4B5FD', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Plano Completo
          </span>
        </div>

        {/* Título */}
        <h2 style={{
          fontSize: '22px',
          fontWeight: 800,
          color: '#F8FAFC',
          letterSpacing: '-0.03em',
          marginBottom: '12px',
          lineHeight: 1.3,
        }}>
          Recurso disponível no<br />Plano Completo
        </h2>

        {/* Subtítulo */}
        <p style={{
          fontSize: '14px',
          color: '#94A3B8',
          lineHeight: 1.6,
          marginBottom: '8px',
        }}>
          {recurso
            ? `${recurso} está disponível no Plano Completo.`
            : 'Desbloqueie orçamentos, cobranças, pagamentos e relatórios para controlar melhor seu negócio.'}
        </p>

        <p style={{
          fontSize: '13px',
          color: '#64748B',
          lineHeight: 1.6,
          marginBottom: '32px',
        }}>
          O Plano Completo libera a gestão financeira simples do ClienteMarcado em um só painel.
        </p>

        {/* Recursos incluídos */}
        <div style={{
          background: 'rgba(59,130,246,.06)',
          border: '1px solid rgba(59,130,246,.15)',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '28px',
          textAlign: 'left',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px' }}>
            Incluído no Plano Completo
          </p>
          {[
            'Orçamentos e propostas',
            'Cobranças e controle a receber',
            'Pagamentos e recebidos',
            'Relatórios por período e profissional',
            'Histórico financeiro completo',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < 4 ? '8px' : 0 }}>
              <span style={{ color: '#4ADE80', fontSize: '13px' }}>✓</span>
              <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => alert('Entre em contato pelo WhatsApp para desbloquear o Plano Completo!')}
            style={{
              width: '100%',
              height: '48px',
              background: G,
              color: '#fff',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 12px 32px rgba(59,130,246,.30),0 0 28px rgba(124,58,237,.26)',
              transition: 'all .18s',
            }}
          >
            🚀 Desbloquear Plano Completo
          </button>

          <Link
            href="/painel"
            style={{
              width: '100%',
              height: '44px',
              background: 'rgba(15,23,42,.88)',
              color: '#CBD5E1',
              border: '1px solid rgba(148,163,184,.20)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: 'all .18s',
            }}
          >
            Voltar ao painel
          </Link>
        </div>

        {/* Nota */}
        <p style={{
          fontSize: '11px',
          color: '#475569',
          marginTop: '20px',
          lineHeight: 1.5,
        }}>
          Você continua usando agenda, clientes, serviços e profissionais no Plano Essencial.
        </p>
      </div>
    </div>
  )
}
