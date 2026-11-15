import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Planos e Preços | MiniPage Pro',
  description: 'Compare os seis planos MiniPage Pro e escolha assinatura mensal ou anual.',
}

const plans = [
  { name: 'Free', month: 'R$ 0', year: 'Gratuito', description: 'Página básica com links, foto, bio e redes sociais.' },
  { name: 'MiniPage', month: 'R$ 29,90', year: 'R$ 297,80', description: 'Links, destaques, vídeos, eventos e desempenho.' },
  { name: 'Agenda', month: 'R$ 39,90', year: 'R$ 397,40', description: 'Página profissional com agendamento automático e agenda de atendimento.' },
  { name: 'Loja', month: 'R$ 49,90', year: 'R$ 497,00', description: 'Catálogo, divulgação de produtos, links de venda e captação de leads.' },
  { name: 'Pro', month: 'R$ 59,90', year: 'R$ 596,60', description: 'Recursos de loja, agendamentos, clientes e gestão de serviços.' },
  { name: 'Equipe', month: 'R$ 149,90', year: 'R$ 1.493,00', description: 'Acesso de equipe, profissionais, agendas e desempenho individual.' },
] as const

export default function PrecosPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0e0915', color: '#fbf7fd', padding: '45px 20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        <Link href="/" style={{ color: '#e8a5fb', textDecoration: 'none', fontWeight: 700 }}>← MiniPage Pro</Link>
        <h1 style={{ fontSize: 'clamp(29px, 5vw, 44px)', marginTop: 26, marginBottom: 10 }}>Planos e preços MiniPage Pro</h1>
        <p style={{ color: '#d6cbdc', lineHeight: 1.7 }}>Compare os planos de assinatura do software MiniPage Pro. Recursos disponíveis conforme o plano escolhido. Os valores abaixo são os preços públicos para o Brasil, em reais.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))', gap: 16, marginTop: 28 }}>
          {plans.map((plan) => (
            <section key={plan.name} style={{ background: '#1c1126', border: '1px solid #4a3153', borderRadius: 18, padding: 25 }}>
              <h2 style={{ marginTop: 0, fontSize: 21 }}>{plan.name}</h2>
              <p style={{ color: '#d6cbdc', minHeight: 65, lineHeight: 1.6 }}>{plan.description}</p>
              <p><strong style={{ fontSize: 26 }}>{plan.month}</strong><span style={{ color: '#d6cbdc' }}> / mês</span></p>
              <p style={{ color: '#d6cbdc' }}>Anual: <strong style={{ color: '#f7effb' }}>{plan.year}</strong> {plan.name === 'Free' ? '' : 'por ano, à vista'}</p>
              <Link href="/" style={{ display: 'inline-block', marginTop: 12, padding: '12px 16px', background: '#8034a5', borderRadius: 10, color: 'white', textDecoration: 'none', fontWeight: 700 }}>Ver detalhes e contratar</Link>
            </section>
          ))}
        </div>
        <p style={{ color: '#d6cbdc', lineHeight: 1.7, marginTop: 25 }}>As assinaturas pagas são disponibilizadas mediante confirmação de pagamento. A forma de cobrança, impostos aplicáveis e valor final são apresentados antes da confirmação da contratação. O cancelamento da renovação e os reembolsos seguem as condições contratadas e os direitos legais.</p>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 28 }}>
          <Link href="/politica-de-reembolso" style={{ color: '#e8a5fb' }}>Política de Reembolso</Link>
          <Link href="/politica-de-privacidade" style={{ color: '#e8a5fb' }}>Política de Privacidade</Link>
          <Link href="/contrato-de-adesao" style={{ color: '#e8a5fb' }}>Contrato de Adesão</Link>
        </nav>
      </div>
    </main>
  )
}
