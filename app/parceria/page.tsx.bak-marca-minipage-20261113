import type { Metadata } from 'next'

const PROPOSTA_PDF_URL = "https://patolrzrcgnopvxgrnvv.supabase.co/storage/v1/object/public/documentos/proposta-clientemarcado.pdf"
const PARCERIA_WHATSAPP = '5511941059063'
const linkWppParceria = 'https://wa.me/' + PARCERIA_WHATSAPP + '?text=' + encodeURIComponent('Olá! Tenho interesse em ser parceira ClienteMarcado e gostaria de saber mais.')
const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

// Página exclusiva de parceria — não faz parte da navegação principal e não deve ser indexada pelos buscadores.
export const metadata: Metadata = {
  title: 'Seja parceira ClienteMarcado',
  description: 'Indique o ClienteMarcado e ganhe por cada nova assinatura.',
  robots: { index: false, follow: false },
}

const destaques = [
  { titulo: '50% da primeira mensalidade', texto: 'De cada assinatura paga indicada por você, na primeira cobrança.' },
  { titulo: '+ R$ 500 de bônus', texto: 'A cada 50 novos clientes pagantes indicados.' },
  { titulo: 'Cupom exclusivo', texto: 'Para acompanhar todas as suas indicações em um só lugar.' },
  { titulo: 'Transparência total', texto: 'Acompanhamento claro dos resultados de cada indicação.' },
]

export default function Parceria() {
  return (
    <div style={{ background: '#08060A', minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;width:100%;max-width:100%}
        .btn-p{background:${G};color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:0 28px;height:52px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:all .2s;box-shadow:0 12px 32px rgba(236,72,153,.25);white-space:nowrap}
        .btn-p:hover{transform:translateY(-2px)}
        .btn-s{background:rgba(24,16,27,.88);color:#B8AAB8;border:1px solid #2A1A2F;border-radius:14px;padding:0 28px;height:52px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:all .2s;white-space:nowrap}
        .btn-s:hover{border-color:rgba(139,92,246,.45);color:#fff}
        .card-b{background:radial-gradient(circle at top left,rgba(139,92,246,.07),transparent 60%),linear-gradient(145deg,rgba(24,16,27,.96),rgba(18,10,20,.99));border:1px solid #2A1A2F;border-radius:18px;padding:28px 24px;transition:border-color .2s,transform .2s}
        .card-b:hover{border-color:rgba(139,92,246,.28);transform:translateY(-3px)}
        @media(max-width:768px){
          .destaques-grid{grid-template-columns:1fr!important}
          .parceria-btns{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
          .parceria-btns a{width:100%!important}
        }
      `}</style>

      {/* HEADER SIMPLES */}
      <header style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,92,246,.45)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em' }}>ClienteMarcado</span>
        </div>
      </header>

      {/* HERO */}
      <section style={{ padding: '60px 24px 70px', textAlign: 'center', background: 'radial-gradient(ellipse at 50% -10%,rgba(139,92,246,.22),transparent 55%)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(236,72,153,.10)', border: '1px solid rgba(236,72,153,.22)', borderRadius: '999px', padding: '6px 18px', marginBottom: '28px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EC4899', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#EC4899', letterSpacing: '.04em' }}>Programa de parceria</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px,5.5vw,52px)', fontWeight: 900, color: '#F8F4F7', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '20px' }}>
            Seja parceira ClienteMarcado
          </h1>
          <p style={{ fontSize: 'clamp(16px,2.2vw,19px)', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '36px' }}>
            Indique o ClienteMarcado para suas alunas, seguidores ou profissionais da sua comunidade e ganhe por cada nova assinatura.
          </p>
          <div className="parceria-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={PROPOSTA_PDF_URL} target="_blank" rel="noopener noreferrer" className="btn-p">Ver proposta completa</a>
            <a href={linkWppParceria} target="_blank" rel="noopener noreferrer" className="btn-s">Quero ser parceira</a>
          </div>
        </div>
      </section>

      {/* DESTAQUES */}
      <section style={{ padding: '0 24px 70px' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div className="destaques-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px' }}>
            {destaques.map(d => (
              <div key={d.titulo} className="card-b">
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#F8F4F7', marginBottom: '8px', letterSpacing: '-0.02em' }}>{d.titulo}</h3>
                <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.6 }}>{d.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REGRA DO BÔNUS */}
      <section style={{ padding: '0 24px 70px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ background: 'radial-gradient(ellipse at top,rgba(139,92,246,.16),transparent 55%),rgba(24,16,27,.97)', border: '1.5px solid rgba(139,92,246,.35)', borderRadius: '22px', padding: '40px 32px', textAlign: 'center', boxShadow: '0 0 64px rgba(139,92,246,.14)' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '14px' }}>Meta simples e alcançável</p>
            <p style={{ fontSize: 'clamp(19px,3vw,24px)', fontWeight: 800, color: '#F8F4F7', lineHeight: 1.4, marginBottom: '14px', letterSpacing: '-0.02em' }}>
              A cada 50 novos clientes pagantes indicados, você recebe + R$ 500 de bônus.
            </p>
            <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.7 }}>
              Sem limite de ciclos: complete mais um grupo de 50 clientes pagantes e receba mais R$ 500.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '10px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.3 }}>
            Quer conhecer todos os detalhes da parceria?
          </h2>
          <p style={{ fontSize: '15px', color: '#B8AAB8', marginBottom: '32px', lineHeight: 1.7 }}>
            Veja a proposta completa em PDF ou fale diretamente com a nossa equipe pelo WhatsApp.
          </p>
          <div className="parceria-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={PROPOSTA_PDF_URL} target="_blank" rel="noopener noreferrer" className="btn-p">Ver proposta completa</a>
            <a href={linkWppParceria} target="_blank" rel="noopener noreferrer" className="btn-s">Quero ser parceira</a>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #2A1A2F', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#B8AAB8' }}>© 2026 ClienteMarcado. Todos os direitos reservados.</p>
        <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>CNPJ: 31.671.616/0001-18</p>
      </footer>
    </div>
  )
}
