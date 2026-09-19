'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ExternalLink } from 'lucide-react'

// Botao reutilizavel "Ver MiniPage" - resolve a slug do usuario logado (nunca hardcoded)
// e abre a pagina publica em nova aba. Usado em Links, Destaques, Agenda/Eventos, Videos
// e Catalogos - nao cria rota nova, so aponta pro link publico ja existente do projeto.
export default function VerMiniPageButton() {
  const [slug, setSlug] = useState('')

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('perfis').select('slug').eq('user_id', user.id).maybeSingle()
      if (data?.slug) setSlug(data.slug)
    }
    carregar()
  }, [])

  if (!slug) return null

  return (
    <a
      href={`https://minipage.pro/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#F8F4F7',
        borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 700,
        textDecoration: 'none', fontFamily: 'inherit', flexShrink: 0,
      }}
    >
      Ver MiniPage <ExternalLink size={14} />
    </a>
  )
}
