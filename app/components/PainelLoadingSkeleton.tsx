// Skeleton de carregamento compartilhado pelas rotas do painel.
// Server Component puro (sem 'use client', sem hooks) - so aparece
// instantaneamente durante a troca de rota, antes da pagina de destino
// montar de verdade. Nao substitui nem altera o loading interno de cada
// pagina (aquele "Carregando..." que já existia continua igual).
export default function PainelLoadingSkeleton() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', width: '100%' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pls-pulse { 0%,100%{opacity:.55} 50%{opacity:.9} }
          .pls-skel{animation:pls-pulse 1.6s ease-in-out infinite}
          .pls-sidebar{display:none}
          @media(min-width:1024px){.pls-sidebar{display:block}}
        `
      }} />

      <div className="pls-sidebar" style={{ width: '220px', minHeight: '100vh', background: 'linear-gradient(180deg,#070F1D,#08060A)', borderRight: '1px solid #2A1A2F', flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '28px 32px', maxWidth: '1200px' }}>
        <div className="pls-skel" style={{ height: '26px', width: '200px', background: 'rgba(255,255,255,.05)', borderRadius: '8px', marginBottom: '28px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="pls-skel" style={{ height: '84px', background: 'rgba(24,16,27,.6)', border: '1.5px solid rgba(236,72,153,.16)', borderRadius: '16px', animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>

        {[0, 1, 2].map(i => (
          <div key={i} className="pls-skel" style={{ height: '68px', background: 'rgba(24,16,27,.5)', border: '1.5px solid rgba(236,72,153,.12)', borderRadius: '14px', marginBottom: '12px', animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    </div>
  )
}
