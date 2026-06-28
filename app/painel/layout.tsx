'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { Suspense } from 'react'
import BannerPagamentoSucesso from '../components/BannerPagamentoSucesso'

const CHECKOUT_URL = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=1a0fb25c46214e45b0eb3d21b494e5d6"
const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<string>('ativo')
  const [diasTrial, setDiasTrial] = useState<number|null>(null)
  const [loadingPag, setLoadingPag] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function abrirCheckout() {
    if (loadingPag) return
    setLoadingPag(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { window.location.href = CHECKOUT_URL; return }
      const res = await fetch('/api/mercadopago/criar-assinatura', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
      })
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        window.location.href = CHECKOUT_URL
      }
    } catch {
      window.location.href = CHECKOUT_URL
    } finally {
      setLoadingPag(false)
    }
  }

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase
        .from('perfis')
        .select('status_acesso, trial_ends_at, plano_ativo_ate')
        .eq('user_id', user.id)
        .single()

      let st = p?.status_acesso || 'ativo'

      // Clientes legados (trial_ends_at null): nao aplicar regra automatica
      if (p?.trial_ends_at) {
        const agora = new Date()
        const fimTrial = new Date(p.trial_ends_at)
        const fimPlano = p?.plano_ativo_ate ? new Date(p.plano_ativo_ate) : null
        const msRestantes = fimTrial.getTime() - agora.getTime()
        const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24))

        const trialVencido = agora > fimTrial
        const planoAtivo = fimPlano && agora < fimPlano

        if (!trialVencido) {
          // Trial ainda ativo
          if (diasRestantes <= 2) setDiasTrial(diasRestantes)
        } else if (!planoAtivo) {
          // Trial vencido e sem plano ativo: mudar para em_atraso
          if (st === 'ativo') {
            st = 'em_atraso'
            await supabase.from('perfis').update({ status_acesso: 'em_atraso' }).eq('user_id', user.id)
          }
        }
      }

      setStatus(st)
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

  return (
    <>
      {status === 'em_atraso' && (
        <div style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.28)',borderRadius:'0',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',position:'sticky',top:0,zIndex:100}}>
          <p style={{fontSize:'13px',fontWeight:600,color:'#FCD34D',margin:0}}>
            ⚠️ Sua mensalidade está pendente. Regularize o pagamento para evitar o bloqueio do acesso.
          </p>
          <button onClick={abrirCheckout} disabled={loadingPag} style={{display:'inline-flex',alignItems:'center',height:'32px',padding:'0 16px',background:G,color:'#fff',borderRadius:'8px',border:'none',fontSize:'12px',fontWeight:700,whiteSpace:'nowrap',flexShrink:0,cursor:loadingPag?'wait':'pointer',opacity:loadingPag?.7:1,fontFamily:'inherit'}}>
            {loadingPag ? 'Gerando...' : 'Regularizar'}
          </button>
        </div>
      )}
      {diasTrial !== null && status === 'ativo' && (
        <div style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(96,165,250,.22)',borderRadius:'0',padding:'10px 24px',display:'flex',alignItems:'center',gap:'10px',position:'sticky',top:0,zIndex:100}}>
          <p style={{fontSize:'13px',fontWeight:600,color:'#93C5FD',margin:0}}>
            🕐 Seu teste grátis termina em {diasTrial <= 0 ? 'menos de 1 dia' : `${diasTrial} dia${diasTrial === 1 ? '' : 's'}`}. Ative seu plano para continuar usando o ClienteMarcado.
          </p>
          <button onClick={abrirCheckout} disabled={loadingPag} style={{display:'inline-flex',alignItems:'center',height:'30px',padding:'0 14px',background:G,color:'#fff',borderRadius:'8px',border:'none',fontSize:'12px',fontWeight:700,whiteSpace:'nowrap',flexShrink:0,cursor:loadingPag?'wait':'pointer',opacity:loadingPag?.7:1,fontFamily:'inherit'}}>
            {loadingPag ? 'Gerando...' : 'Ativar plano'}
          </button>
        </div>
      )}
      <Suspense fallback={null}><BannerPagamentoSucesso /></Suspense>
      {children}
    </>
  )
}