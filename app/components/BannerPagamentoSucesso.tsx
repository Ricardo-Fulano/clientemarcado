'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function BannerPagamentoSucesso() {
  const params = useSearchParams()
  const router = useRouter()
  const [visivel, setVisivel] = useState(false)
  const [msg, setMsg] = useState<'sucesso'|'processando'|'aguardando'>('aguardando')

  useEffect(() => {
    if (params.get('pagamento') !== 'sucesso') return
    setVisivel(true)
    async function checar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('perfis').select('status_acesso, plano_ativo_ate').eq('user_id', user.id).single()
      if (p?.status_acesso === 'ativo' && p?.plano_ativo_ate) {
        setMsg('sucesso')
      } else if (p?.status_acesso === 'em_atraso') {
        setMsg('processando')
      } else {
        setMsg('aguardando')
      }
    }
    checar()
  }, [params])

  if (!visivel) return null

  const textos = {
    sucesso: { titulo: '✅ Plano ativado com sucesso!', sub: 'Seu acesso premium está ativo. Aproveite o ClienteMarcado!', cor: 'rgba(16,185,129,.10)', borda: 'rgba(52,211,153,.30)', texto: '#34D399' },
    processando: { titulo: '⏳ Pagamento em processamento.', sub: 'Aguarde alguns instantes e atualize a página.', cor: 'rgba(245,158,11,.08)', borda: 'rgba(245,158,11,.28)', texto: '#FCD34D' },
    aguardando: { titulo: '✉️ Pagamento recebido!', sub: 'Estamos confirmando sua assinatura. Se aprovado, seu acesso será ativado automaticamente em instantes.', cor: 'rgba(59,130,246,.08)', borda: 'rgba(96,165,250,.22)', texto: '#93C5FD' },
  }

  const { titulo, sub, cor, borda, texto } = textos[msg]

  return (
    <div style={{background:cor,border:'1px solid '+borda,borderRadius:'0',padding:'12px 24px',display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',position:'sticky',top:0,zIndex:101}}>
      <div style={{flex:1}}>
        <p style={{fontSize:'13px',fontWeight:700,color:texto,margin:'0 0 2px 0'}}>{titulo}</p>
        <p style={{fontSize:'12px',color:'#94A3B8',margin:0}}>{sub}</p>
      </div>
      <div style={{display:'flex',gap:'8px',flexShrink:0}}>
        {msg === 'processando' && (
          <button onClick={() => window.location.reload()} style={{height:'30px',padding:'0 12px',background:'rgba(96,165,250,.15)',border:'1px solid rgba(96,165,250,.30)',color:'#93C5FD',borderRadius:'8px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            Atualizar status
          </button>
        )}
        <button onClick={() => { setVisivel(false); router.replace('/painel') }} style={{height:'30px',padding:'0 12px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.10)',color:'#94A3B8',borderRadius:'8px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
          Entendi
        </button>
      </div>
    </div>
  )
}
