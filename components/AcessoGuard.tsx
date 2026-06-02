'use client'
import { useEffect, useState, createContext, useContext } from 'react'
import { supabase } from '../app/lib/supabase'
import { useRouter } from 'next/navigation'

const CHECKOUT_URL = "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=1a0fb25c46214e45b0eb3d21b494e5d6"
const SUPORTE_WHATSAPP = ""
const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

interface AcessoCtx { status: string; checkout: string }
const Ctx = createContext<AcessoCtx>({ status: 'ativo', checkout: '' })
export function useAcesso() { return useContext(Ctx) }

export function AvisoAtraso() {
  const { status, checkout } = useAcesso()
  if (status !== 'em_atraso') return null
  return (
    <div style={{
      background: 'rgba(245,158,11,.08)',
      border: '1px solid rgba(245,158,11,.28)',
      borderRadius: '16px',
      padding: '14px 20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      <div>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#FCD34D', marginBottom: '3px' }}>
          Sua mensalidade esta pendente
        </p>
        <p style={{ fontSize: '12px', color: '#B45309', lineHeight: 1.5 }}>
          Regularize o pagamento para evitar o bloqueio do painel.
        </p>
      </div>
      <a href={checkout} target="_blank" rel="noreferrer" style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        height: '38px', padding: '0 18px', background: G, color: '#fff',
        borderRadius: '10px', textDecoration: 'none', fontSize: '12px',
        fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        Regularizar pagamento
      </a>
    </div>
  )
}

export default function AcessoGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: perfil } = await supabase
        .from('perfis').select('status_acesso').eq('user_id', user.id).single()
      setStatus(perfil?.status_acesso || 'ativo')
      setLoading(false)
    }
    verificar()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050B16', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <p style={{ color: '#475569', fontSize: '14px' }}>Carregando...</p>
    </div>
  )

  if (status === 'bloqueado' || status === 'cancelado') {
    const bloqueado = status === 'bloqueado'
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top,rgba(124,58,237,.12),transparent 50%),linear-gradient(180deg,#060C18,#050B16)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '480px', background: 'rgba(15,23,42,.95)', border: '1px solid rgba(124,58,237,.30)', borderRadius: '22px', padding: '40px 32px', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,.5)' }}>
          <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: bloqueado ? 'rgba(239,68,68,.10)' : 'rgba(100,116,139,.10)', border: bloqueado ? '1px solid rgba(239,68,68,.25)' : '1px solid rgba(100,116,139,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '30px' }}>
            {bloqueado ? '🔒' : '⛔'}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC', marginBottom: '12px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
            {bloqueado ? 'Acesso temporariamente bloqueado' : 'Acesso cancelado'}
          </h2>
          <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.7, marginBottom: '8px' }}>
            {bloqueado ? 'Identificamos uma pendencia na sua mensalidade. Regularize o pagamento para voltar a acessar o ClienteMarcado.' : 'Seu acesso ao ClienteMarcado foi encerrado. Para reativar sua conta, entre em contato com o suporte.'}
          </p>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '32px' }}>
            {bloqueado ? 'Assim que o pagamento for confirmado, seu acesso sera liberado.' : 'Podemos ajuda-lo a reativar sua conta.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bloqueado && (
              <a href={CHECKOUT_URL} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50px', background: G, color: '#fff', borderRadius: '14px', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>
                Regularizar pagamento
              </a>
            )}
            {SUPORTE_WHATSAPP && (
              <a href={`https://wa.me/${SUPORTE_WHATSAPP}?text=${encodeURIComponent('Ola! Preciso regularizar meu acesso ao ClienteMarcado.')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '44px', background: 'rgba(15,23,42,.88)', color: '#CBD5E1', border: '1px solid rgba(148,163,184,.18)', borderRadius: '12px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                Falar com suporte
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Ctx.Provider value={{ status: status || 'ativo', checkout: CHECKOUT_URL }}>
      {children}
    </Ctx.Provider>
  )
}
