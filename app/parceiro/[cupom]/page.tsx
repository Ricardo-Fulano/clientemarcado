import Link from 'next/link'

// Painel legado: cupons nao permitem consultar dados financeiros.
// O acesso atual passa por autenticacao em /painel/afiliado.
export default function PainelParceiroLegado() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#100A17', color: '#F8F4F7', fontFamily: 'system-ui, sans-serif' }}>
      <section style={{ maxWidth: 480, width: '100%', padding: 32, borderRadius: 18, background: '#1C1024', border: '1px solid #50305D', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, marginBottom: 14 }}>Painel de afiliado protegido</h1>
        <p style={{ lineHeight: 1.6, color: '#C7B9D0', marginBottom: 24 }}>
          O acesso às indicações e comissões agora exige login na conta MiniPage vinculada à sua parceria. Seu cupom de indicação continua válido.
        </p>
        <Link href="/painel/afiliado" style={{ display: 'block', background: 'linear-gradient(100deg,#EC4899,#8B5CF6)', padding: 14, borderRadius: 12, fontWeight: 700, color: '#fff', textDecoration: 'none', marginBottom: 14 }}>
          Acessar meu painel de afiliado
        </Link>
        <Link href="/login" style={{ color: '#E5C2F8' }}>Entrar na minha conta</Link>
      </section>
    </main>
  )
}
