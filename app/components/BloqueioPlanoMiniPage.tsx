'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { ehPlanoMiniPage } from '../lib/planos'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

// Envolve o conteudo de uma pagina do painel que so deve ficar disponivel pros planos
// Profissional/Equipe. Se o usuario estiver no plano MiniPage, mostra um card de upgrade
// no lugar do conteudo, sem quebrar a pagina nem redirecionar de forma abrupta.
// /painel/perfil NUNCA deve ser envolvido por esse componente - o plano MiniPage precisa
// continuar editando a propria pagina.
export default function BloqueioPlanoMiniPage({ children }: { children: React.ReactNode }) {
  const [carregando, setCarregando] = useState(true)
  const [bloqueado, setBloqueado] = useState(false)

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCarregando(false); return }
      const { data: perfil } = await supabase.from('perfis').select('plano_tipo').eq('user_id', user.id).maybeSingle()
      if (perfil && ehPlanoMiniPage(perfil.plano_tipo)) setBloqueado(true)
      setCarregando(false)
    }
    verificar()
  }, [])

  if (carregando) return null

  if (bloqueado) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '460px', textAlign: 'center', background: 'radial-gradient(circle at top left,rgba(139,92,246,.09),transparent 60%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99))', border: '1.5px solid #2A1A2F', borderRadius: '22px', padding: '44px 32px' }}>
          <p style={{ fontSize: '19px', fontWeight: 800, color: '#F8F4F7', marginBottom: '10px' }}>Este recurso está disponível no Plano Profissional.</p>
          <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '26px' }}>Sua MiniPage está ativa, mas agenda, clientes, financeiro e relatórios fazem parte de um plano com mais recursos.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/painel/plano" style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>Ver planos</Link>
            <Link href="/painel" style={{ background: 'rgba(24,16,27,.92)', color: '#F8F4F7', border: '1px solid rgba(229,72,184,.28)', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Voltar ao início</Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
