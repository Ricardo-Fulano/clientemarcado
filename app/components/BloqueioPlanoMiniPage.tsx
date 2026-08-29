'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ehPlanoMiniPage } from '../lib/planos'
import BloqueioPorPlano from './BloqueioPorPlano'

// Envolve o conteudo de uma pagina do painel que so deve ficar disponivel pros planos
// Profissional/Equipe. Se o usuario estiver no plano MiniPage, mostra um card de upgrade
// no lugar do conteudo, sem quebrar a pagina nem redirecionar de forma abrupta.
// /painel/perfil NUNCA deve ser envolvido por esse componente - o plano MiniPage precisa
// continuar editando a propria pagina.
//
// Por baixo, agora usa o componente generico BloqueioPorPlano (Etapa 2 da reorganizacao
// de planos) - mantido como wrapper de compatibilidade, com o MESMO texto/visual de antes,
// pra nao quebrar nenhum import existente e nao mudar nada visivel.
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

  return (
    <BloqueioPorPlano
      permitido={!bloqueado}
      titulo="Este recurso está disponível no Plano Profissional."
      descricao="Sua MiniPage está ativa, mas agenda, clientes, financeiro e relatórios fazem parte de um plano com mais recursos."
    >
      {children}
    </BloqueioPorPlano>
  )
}
