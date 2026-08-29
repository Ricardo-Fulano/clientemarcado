import Link from 'next/link'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

/**
 * Envolve qualquer conteudo do painel que dependa de uma permissao de plano. Se `permitido`
 * for true, renderiza os children normalmente. Se for false, mostra um card de upgrade no
 * lugar do conteudo, sem quebrar a pagina nem redirecionar de forma abrupta.
 *
 * Uso esperado:
 *   <BloqueioPorPlano permitido={permiteAgenda(planoTipo)}>
 *     {conteudo}
 *   </BloqueioPorPlano>
 *
 * A decisao de QUAL permissao checar fica sempre com quem usa o componente (via as funcoes
 * centralizadas de app/lib/planos.ts) - esse componente so cuida do "o que mostrar", nunca
 * decide sozinho se algo e permitido ou nao.
 */
export default function BloqueioPorPlano({
  permitido,
  nomeRecurso,
  titulo,
  descricao,
  children,
}: {
  permitido: boolean
  nomeRecurso?: string
  titulo?: string
  descricao?: string
  children: React.ReactNode
}) {
  if (permitido) return <>{children}</>

  const tituloFinal = titulo || 'Recurso disponível em outro plano'
  const descricaoFinal = descricao || (nomeRecurso
    ? `${nomeRecurso} está disponível em planos superiores da MiniPage Pro.`
    : 'Esse recurso está disponível em planos superiores da MiniPage Pro.')

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '460px', textAlign: 'center', background: 'radial-gradient(circle at top left,rgba(139,92,246,.09),transparent 60%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99))', border: '1.5px solid #2A1A2F', borderRadius: '22px', padding: '44px 32px' }}>
        <p style={{ fontSize: '19px', fontWeight: 800, color: '#F8F4F7', marginBottom: '10px' }}>{tituloFinal}</p>
        <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '26px' }}>{descricaoFinal}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/painel/plano" style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>Ver planos</Link>
          <Link href="/painel" style={{ background: 'rgba(24,16,27,.92)', color: '#F8F4F7', border: '1px solid rgba(229,72,184,.28)', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}
