export default function Home() {
  const features = [
    {
      icon: 'ð',
      titulo: 'Agendamento online',
      desc: 'Seus clientes agendam pelo celular, 24h por dia, sem precisar ligar.',
    },
    {
      icon: 'â',
      titulo: 'Controle presencial',
      desc: 'Registre atendimentos presenciais com 2 toques. Simples e rápido.',
    },
    {
      icon: 'ð',
      titulo: 'Relatório por profissional',
      desc: 'Veja receita, serviços e atendimentos de cada profissional em um lugar só.',
    },
  ]

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)' }}>

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>ClienteMarcado</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/login" style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}>Entrar</a>
          <a href="/cadastro" style={{ background: 'var(--accent)', color: '#fff', fontSize: '14px', fontWeight: '600', padding: '8px 20px', borderRadius: '8px', textDecoration: 'none' }}>Começar grátis</a>
        </div>
      </nav>

      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '120px 24px 80px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '500', padding: '4px 12px', borderRadius: '999px', marginBottom: '32px', background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
          â¦ Agendamento inteligente para negócios locais
        </div>

        <h2 style={{ fontSize: '52px', fontWeight: 'bold', lineHeight: '1.15', marginBottom: '24px', color: 'var(--text-primary)' }}>
          Seu cliente agenda sozinho.{' '}
          <span style={{ color: 'var(--accent)' }}>VocÃª só atende.</span>
        </h2>

        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: '1.7', marginBottom: '40px' }}>
          Plataforma de agendamento para barbearias, salões, clínicas, estética e petshops. Simples, rápida e pronta para usar.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/cadastro" style={{ background: 'var(--accent)', color: '#fff', fontWeight: '600', fontSize: '16px', padding: '14px 32px', borderRadius: '12px', textDecoration: 'none' }}>Criar minha agenda grátis</a>
          <a href="/login" style={{ background: 'var(--card)', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '16px', padding: '14px 32px', borderRadius: '12px', border: '1px solid var(--border)', textDecoration: 'none' }}>Já tenho conta</a>
        </div>
      </section>

      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 100px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {features.map((item) => (
          <div key={item.titulo} style={{ background: 'var(--card)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>
              {item.icon}
            </div>
            <p style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)', fontSize: '15px' }}>{item.titulo}</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{item.desc}</p>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
          </div>
        ))}
      </section>

      <footer style={{ textAlign: 'center', paddingBottom: '40px', fontSize: '12px', color: 'var(--text-muted)' }}>
        Â© 2025 ClienteMarcado Â· Todos os direitos reservados
      </footer>

    </main>
  )
}