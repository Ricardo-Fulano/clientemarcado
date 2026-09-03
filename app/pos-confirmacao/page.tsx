'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { ehPlanoFree } from '../lib/planos'

// Rota intermediaria pos-confirmacao de e-mail. So decide 1 coisa: pra onde mandar o
// usuario depois que ele confirma o e-mail - painel direto (Free ou pago ja ativo) ou
// checkout Asaas automatico (pago ainda aguardando_pagamento). NUNCA libera o painel
// completo pra quem esta aguardando_pagamento - mesma regra ja aplicada no
// PainelLayoutClient, que continua funcionando como ultima linha de defesa se o usuario
// tentar burlar essa pagina de alguma forma.
export default function PosConfirmacao() {
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'sem_perfil'>('carregando')
  const [mensagemErro, setMensagemErro] = useState('')
  // Guard contra duplo disparo (StrictMode do React chama efeitos 2x em dev, e recarregar
  // a pagina manualmente tambem re-executaria isso) - garante que so tentamos criar UMA
  // assinatura por carregamento real desta pagina.
  const jaTentou = useRef(false)

  useEffect(() => {
    if (jaTentou.current) return
    jaTentou.current = true
    processar()
  }, [])

  async function processar() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setEstado('erro')
        setMensagemErro('Não conseguimos confirmar sua sessão. Faça login novamente.')
        return
      }

      const { data: perfil, error: erroPerfil } = await supabase
        .from('perfis')
        .select('plano_tipo, status_acesso, gateway_subscription_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (erroPerfil || !perfil) {
        setEstado('sem_perfil')
        return
      }

      // Free nunca passa por checkout - vai direto pro painel, como sempre.
      if (ehPlanoFree(perfil.plano_tipo)) {
        window.location.href = '/painel'
        return
      }

      // Pago mas ja nao esta mais aguardando pagamento (ja autorizou antes, por algum
      // motivo) - vai direto pro painel, sem tentar criar outra cobranca.
      if (perfil.status_acesso !== 'aguardando_pagamento') {
        window.location.href = '/painel'
        return
      }

      // Pago e aguardando_pagamento: chama a mesma rota ja validada de criacao de
      // assinatura/cobranca no Asaas, e redireciona automaticamente pro checkout.
      const res = await fetch('/api/asaas/criar-assinatura', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + session.access_token },
      })
      const data = await res.json().catch(() => null)
      if (data?.init_point) {
        window.location.href = data.init_point
      } else {
        setEstado('erro')
        setMensagemErro(data?.error || 'Não foi possível iniciar o checkout agora.')
      }
    } catch {
      setEstado('erro')
      setMensagemErro('Não foi possível iniciar o checkout agora.')
    }
  }

  function tentarDeNovo() {
    jaTentou.current = false
    setEstado('carregando')
    processar()
  }

  if (estado === 'carregando') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#060C18,#050B16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,.25)', borderTopColor: '#8B5CF6', borderRadius: '999px', margin: '0 auto 16px', animation: 'girar 0.8s linear infinite' }} />
          <style>{`@keyframes girar{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: '#94A3B8', fontSize: '14px' }}>Preparando seu acesso...</p>
        </div>
      </div>
    )
  }

  if (estado === 'sem_perfil') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#060C18,#050B16)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: 'rgba(15,23,42,.95)', border: '1px solid rgba(139,92,246,.30)', borderRadius: '20px', padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>👤</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginBottom: '12px' }}>Não encontramos seu cadastro</h2>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '24px', lineHeight: 1.6 }}>Isso pode acontecer se o cadastro não foi concluído corretamente. Tente fazer login ou fale com o suporte.</p>
          <a href="/login" style={{ display: 'block', height: '46px', lineHeight: '46px', background: 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Ir para o login</a>
          <a href={`https://wa.me/5511941059063?text=${encodeURIComponent('Olá! Tive um problema ao confirmar meu cadastro na MiniPage Pro.')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'underline' }}>Falar com o suporte</a>
        </div>
      </div>
    )
  }

  // estado === 'erro'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#060C18,#050B16)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: '420px', width: '100%', background: 'rgba(15,23,42,.95)', border: '1px solid rgba(139,92,246,.30)', borderRadius: '20px', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginBottom: '12px' }}>Não foi possível iniciar o checkout</h2>
        <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '24px', lineHeight: 1.6 }}>{mensagemErro}</p>
        <button onClick={tentarDeNovo} style={{ display: 'block', width: '100%', height: '46px', background: 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '12px', fontFamily: 'inherit' }}>Tentar novamente</button>
        <a href={`https://wa.me/5511941059063?text=${encodeURIComponent('Olá! Preciso de ajuda para finalizar minha assinatura da MiniPage Pro.')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'underline' }}>Falar com o suporte</a>
      </div>
    </div>
  )
}
