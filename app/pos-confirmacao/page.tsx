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
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'sem_perfil' | 'escolher_pagamento' | 'confirmando'>('carregando')
  const [mensagemErro, setMensagemErro] = useState('')
  const [metodoEscolhendo, setMetodoEscolhendo] = useState<'CREDIT_CARD' | 'PIX' | null>(null)
  const [tempoEsgotado, setTempoEsgotado] = useState(false)
  const [verificandoAgora, setVerificandoAgora] = useState(false)
  const [jaConfirmado, setJaConfirmado] = useState(false)
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

      // Pago e aguardando_pagamento: se o cliente esta voltando do Asaas (?aguardando=1,
      // preenchido no callback.successUrl que mandamos na criacao da cobranca), nao faz
      // sentido mostrar a escolha Cartao/Pix de novo - ele ja escolheu e ja pagou (ou esta
      // prestes a). Em vez disso, mostra "Confirmando pagamento..." e comeca o polling.
      const paramsAtuais = new URLSearchParams(window.location.search)
      if (paramsAtuais.get('aguardando') === '1') {
        setEstado('confirmando')
        iniciarPolling(session.user.id)
        return
      }

      // Pago e aguardando_pagamento: em vez de chamar o checkout automaticamente (como
      // antes), mostra a tela de escolha entre Cartao de Credito e Pix - a chamada real
      // pra /api/asaas/criar-assinatura so acontece depois que o cliente clicar em um dos 2
      // botoes (funcao escolherMetodo abaixo). Boleto nunca e oferecido em nenhum momento.
      setEstado('escolher_pagamento')
    } catch {
      setEstado('erro')
      setMensagemErro('Não foi possível iniciar o checkout agora.')
    }
  }

  // Polling simples: verifica status_acesso a cada 2.5s, por ate 30s (12 tentativas).
  // NUNCA libera o painel sozinho aqui - so redireciona quando o banco ja mostrar um
  // status diferente de 'aguardando_pagamento', e esse valor so muda via webhook do Asaas
  // (PAYMENT_CONFIRMED/PAYMENT_RECEIVED). Este polling e so uma conveniencia de UX pra nao
  // deixar o cliente parado numa tela de bloqueio logo apos pagar de verdade.
  function iniciarPolling(userId: string) {
    let tentativas = 0
    const LIMITE_TENTATIVAS = 12
    const intervalo = setInterval(async () => {
      tentativas++
      const { data: perfilAtual } = await supabase
        .from('perfis')
        .select('status_acesso')
        .eq('user_id', userId)
        .maybeSingle()

      if (perfilAtual && perfilAtual.status_acesso !== 'aguardando_pagamento') {
        clearInterval(intervalo)
        window.location.href = '/painel'
        return
      }

      if (tentativas >= LIMITE_TENTATIVAS) {
        clearInterval(intervalo)
        setTempoEsgotado(true)
      }
    }, 2500)
  }

  async function atualizarStatusManual() {
    setVerificandoAgora(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data: perfilAtual } = await supabase
        .from('perfis')
        .select('status_acesso')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (perfilAtual && perfilAtual.status_acesso !== 'aguardando_pagamento') {
        setJaConfirmado(true)
      }
    } finally {
      setVerificandoAgora(false)
    }
  }

  async function escolherMetodo(metodo: 'CREDIT_CARD' | 'PIX') {
    setMetodoEscolhendo(metodo)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setEstado('erro')
        setMensagemErro('Não conseguimos confirmar sua sessão. Faça login novamente.')
        return
      }
      const res = await fetch('/api/asaas/criar-assinatura', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ metodoPagamento: metodo }),
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
    } finally {
      setMetodoEscolhendo(null)
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

  if (estado === 'confirmando') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#060C18,#050B16)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: 'rgba(15,23,42,.95)', border: '1px solid rgba(139,92,246,.30)', borderRadius: '20px', padding: '40px 32px', textAlign: 'center' }}>
          {!tempoEsgotado ? (
            <>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,.25)', borderTopColor: '#8B5CF6', borderRadius: '999px', margin: '0 auto 20px', animation: 'girar 0.8s linear infinite' }} />
              <style>{'@keyframes girar{to{transform:rotate(360deg)}}'}</style>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginBottom: '10px' }}>Confirmando seu pagamento...</h2>
              <p style={{ fontSize: '13.5px', color: '#94A3B8', lineHeight: 1.6 }}>Recebemos seu retorno do Asaas e estamos aguardando a confirmação automática. Isso costuma levar alguns segundos.</p>
            </>
          ) : jaConfirmado ? (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginBottom: '10px' }}>Pagamento confirmado!</h2>
              <p style={{ fontSize: '13.5px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '22px' }}>Sua MiniPage já está ativa.</p>
              <a
                href="/painel"
                style={{ display: 'block', width: '100%', height: '46px', lineHeight: '46px', background: 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}
              >
                Ir para o painel
              </a>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginBottom: '10px' }}>Ainda confirmando</h2>
              <p style={{ fontSize: '13.5px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '22px' }}>Ainda estamos aguardando a confirmação do pagamento. Se você já pagou, aguarde alguns instantes e clique em Atualizar status.</p>
              <button
                onClick={atualizarStatusManual}
                disabled={verificandoAgora}
                style={{ display: 'block', width: '100%', height: '46px', background: 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: verificandoAgora ? 'wait' : 'pointer', fontFamily: 'inherit' }}
              >
                {verificandoAgora ? 'Verificando...' : 'Atualizar status'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (estado === 'escolher_pagamento') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#060C18,#050B16)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: 'rgba(15,23,42,.95)', border: '1px solid rgba(139,92,246,.30)', borderRadius: '20px', padding: '36px 28px' }}>
          <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#F8FAFC', marginBottom: '8px', textAlign: 'center' }}>Escolha sua forma de pagamento</h2>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5 }}>Para ativar sua MiniPage, escolha como deseja pagar seu plano.</p>

          <button
            onClick={() => escolherMetodo('CREDIT_CARD')}
            disabled={metodoEscolhendo !== null}
            style={{ display: 'block', width: '100%', textAlign: 'left', background: 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)', border: 'none', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px', cursor: metodoEscolhendo !== null ? 'wait' : 'pointer', fontFamily: 'inherit' }}
          >
            <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
              {metodoEscolhendo === 'CREDIT_CARD' ? 'Preparando...' : 'Cartão de crédito ou débito — recomendado'}
            </p>
            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.85)', lineHeight: 1.5 }}>Pagamento rápido e seguro. Após a confirmação do pagamento, sua MiniPage será ativada.</p>
          </button>

          <button
            onClick={() => escolherMetodo('PIX')}
            disabled={metodoEscolhendo !== null}
            style={{ display: 'block', width: '100%', textAlign: 'left', background: 'rgba(148,163,184,.08)', border: '1px solid rgba(148,163,184,.25)', borderRadius: '14px', padding: '16px 18px', cursor: metodoEscolhendo !== null ? 'wait' : 'pointer', fontFamily: 'inherit' }}
          >
            <p style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', marginBottom: '4px' }}>
              {metodoEscolhendo === 'PIX' ? 'Preparando...' : 'Pix'}
            </p>
            <p style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: 1.5 }}>Pagamento manual. Sua MiniPage será ativada após a confirmação do Pix.</p>
          </button>
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
