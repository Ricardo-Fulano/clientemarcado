const fs = require('fs')

// Reverter layout para simples - sem sidebar, só guard de acesso
const layout = `'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const CHECKOUT_URL = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=1a0fb25c46214e45b0eb3d21b494e5d6"
const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<string>('ativo')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('perfis').select('status_acesso').eq('user_id', user.id).single()
      setStatus(p?.status_acesso || 'ativo')
      setLoading(false)
    }
    verificar()
  }, [])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#475569',fontSize:'14px'}}>Carregando...</p>
    </div>
  )

  if (status === 'bloqueado' || status === 'cancelado') return (
    <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#060C18,#050B16)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',fontFamily:'system-ui'}}>
      <div style={{maxWidth:'440px',width:'100%',background:'rgba(15,23,42,.95)',border:'1px solid rgba(124,58,237,.30)',borderRadius:'20px',padding:'40px 32px',textAlign:'center'}}>
        <div style={{fontSize:'36px',marginBottom:'16px'}}>🔒</div>
        <h2 style={{fontSize:'20px',fontWeight:800,color:'#F8FAFC',marginBottom:'12px'}}>Acesso bloqueado</h2>
        <p style={{fontSize:'14px',color:'#94A3B8',marginBottom:'28px',lineHeight:1.6}}>Regularize o pagamento para voltar a acessar o ClienteMarcado.</p>
        <a href={CHECKOUT_URL} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'48px',background:G,color:'#fff',borderRadius:'12px',textDecoration:'none',fontSize:'14px',fontWeight:700}}>Regularizar pagamento</a>
      </div>
    </div>
  )

  return <>{children}</>
}
`

fs.writeFileSync('app/painel/layout.tsx', layout, 'utf8')
console.log('Layout revertido para transparente!')

// Restaurar painel/page.tsx com sidebar propria (original)
// Primeiro verificar se o painel/page.tsx atual tem sidebar
const p = fs.readFileSync('app/painel/page.tsx', 'utf8')
console.log('Tem aside no painel:', p.includes('<aside'))
console.log('Primeiras 3 linhas:', p.split('\n').slice(0,3).join('\n'))