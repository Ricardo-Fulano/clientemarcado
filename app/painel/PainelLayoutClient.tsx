'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { Suspense } from 'react'
import BannerPagamentoSucesso from '../components/BannerPagamentoSucesso'
import BloqueioPorPlano from '../components/BloqueioPorPlano'
import { normalizarPlano, ehPlanoComGestao, permiteEquipe, ehPlanoFree, ehAguardandoPagamento, statusPermiteAcessoCompleto, statusPrecisaFinalizarCheckout } from '../lib/planos'

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'
// Nomes amigaveis pra mensagem de erro refletir o plano real da pessoa (antes ficava fixo
// dizendo "Plano Equipe", mesmo quando o problema era com o MiniPage).
const NOME_PLANO_AMIGAVEL: Record<string, string> = { minipage: 'MiniPage', essencial: 'Profissional', equipe: 'Equipe' }
function nomePlanoAtual(planoTipo: string) { return NOME_PLANO_AMIGAVEL[planoTipo] || 'atual' }

// Mesma normalizacao usada em app/api/cadastro/criar-perfil/route.ts (fonte original desse
// slug). Repetida aqui porque essa e uma tela client-side, sem acesso direto ao helper da rota.
function gerarSlugBase(nome: string, userId: string) {
  const limpo = (nome || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 30)
  return limpo || ('negocio' + userId.replace(/-/g, '').slice(0, 8))
}

// Cria um perfil inicial seguro pra uma conta que existe no Auth mas nao tem linha em
// `perfis` ainda (bug de cadastro: a chamada original pra /api/cadastro/criar-perfil e
// "dispara e esquece", sem checar sucesso - se falhar por qualquer motivo, a conta fica
// sem perfil pra sempre, sem ninguem perceber). Usa SEMPRE o auth.uid() da sessao atual
// (nunca busca por e-mail, nunca reaproveita perfil de outra pessoa). Reconfere com
// select antes de inserir, pra nao duplicar se outra aba/effect ja criou nesse meio-tempo.
async function criarPerfilAutomatico(userId: string, metadata: any) {
  const { data: jaExiste } = await supabase.from('perfis').select('id').eq('user_id', userId).maybeSingle()
  if (jaExiste) return { criado: false }

  const nomeNegocio = metadata?.nome_negocio || metadata?.nome_usuario || 'Meu negócio'
  const planoMeta = metadata?.plano_tipo
  const planoTipo = planoMeta === 'equipe' ? 'equipe' : planoMeta === 'minipage' ? 'minipage' : 'essencial'
  const slugBase = gerarSlugBase(nomeNegocio, userId)

  let slugTentativa = slugBase
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const { error } = await supabase.from('perfis').insert({
      user_id: userId,
      nome_negocio: nomeNegocio,
      slug: slugTentativa,
      plano_tipo: planoTipo,
    })
    if (!error) return { criado: true, slug: slugTentativa }
    if (error.code === '23505') {
      // slug colidiu: tenta de novo com sufixo curto do user_id
      const sufixo = userId.replace(/-/g, '').slice(tentativa * 4, tentativa * 4 + 4)
      slugTentativa = `${slugBase}${sufixo}`
      continue
    }
    console.warn('[criarPerfilAutomatico] Erro ao criar perfil:', error.message)
    return { criado: false, erro: error.message }
  }
  return { criado: false, erro: 'Não foi possível gerar um link único.' }
}

export default function PainelLayoutClient({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<string>('ativo')
  const [planoTipo, setPlanoTipo] = useState<string>('essencial')
  const [diasTrial, setDiasTrial] = useState<number|null>(null)
  const [diasAtraso, setDiasAtraso] = useState<number|null>(null)
  const [temAssinaturaAutorizada, setTemAssinaturaAutorizada] = useState(true) // otimista ate confirmar - nunca bloqueia por engano antes da consulta terminar
  const [loadingPag, setLoadingPag] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isProfissional, setIsProfissional] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  async function abrirCheckout() {
    if (loadingPag) return
    setLoadingPag(true)
    const MENSAGEM_ERRO_CHECKOUT = 'Não foi possível iniciar o checkout agora. Tente novamente ou fale com o suporte.'
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        alert('Sessão expirada. Faça login novamente para regularizar o pagamento.')
        return
      }
      // Rota trocada pra Asaas - o fluxo real de "Finalizar assinatura" do painel agora usa
      // /api/asaas/criar-assinatura. Os antigos fallbacks pro link fixo do Mercado Pago
      // (CHECKOUT_URL) foram removidos de proposito: misturar os 2 gateways em caso de erro
      // criaria inconsistencia (cliente pagaria no MP, sistema esperaria confirmacao do
      // Asaas). Em qualquer erro agora, mostra so a mensagem clara pedindo pra tentar de
      // novo ou falar com o suporte.
      const res = await fetch('/api/asaas/criar-assinatura', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
      })
      const data = await res.json().catch(() => null)
      if (data?.init_point) {
        window.location.href = data.init_point
      } else {
        // Mostra o motivo especifico que a API retornou (ex: "Precisamos do seu CPF...")
        // em vez de sempre a mensagem generica - a mensagem generica continua como
        // fallback, se a API nao mandar nada util.
        alert(data?.error || MENSAGEM_ERRO_CHECKOUT)
      }
    } catch {
      alert(MENSAGEM_ERRO_CHECKOUT)
    } finally {
      setLoadingPag(false)
    }
  }

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p, error: perfilError } = await supabase
        .from('perfis')
        .select('status_acesso, trial_ends_at, plano_ativo_ate, plano_tipo, mp_subscription_id')
        .eq('user_id', user.id)
        .single()

      // Sem perfil proprio (nao e dona): pode ser uma profissional com acesso individual
      if (!p || perfilError) {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (token) {
          try {
            const res = await fetch('/api/equipe/meu-vinculo', { headers: { 'Authorization': 'Bearer ' + token } })
            const vinculo = await res.json()
            if (res.ok && vinculo?.role === 'profissional' && vinculo?.ativo) {
              setIsProfissional(true)
              setLoading(false)
              return
            }
          } catch (e) { console.warn('Erro ao verificar vinculo de equipe:', e) }
        }
        // Sem perfil e sem vinculo: tenta criar automaticamente um perfil inicial seguro
        // (usa sempre o auth.uid() da sessao atual - nunca busca por e-mail, nunca reaproveita
        // perfil de outra pessoa). Cobre o caso da chamada original de cadastro ter falhado
        // silenciosamente. Se a criacao falhar por qualquer motivo, mantem o comportamento
        // anterior (deixa passar como ativo) - a tela de /painel/perfil ainda tem o botao
        // manual "Criar meu perfil" como rede de seguranca final.
        await criarPerfilAutomatico(user.id, user.user_metadata)
        setStatus('ativo')
        setLoading(false)
        return
      }

      setPlanoTipo(normalizarPlano(p?.plano_tipo))
      setTemAssinaturaAutorizada(!!p?.mp_subscription_id)

      let st = p?.status_acesso || 'ativo'

      // Free nunca tem cobranca - nao faz sentido avaliar atraso nem marcar em_atraso pra essas
      // contas, mesmo que o trial de 7 dias (dado a todo cadastro, independente do plano
      // escolhido depois) ja tenha vencido.
      if (p?.trial_ends_at && !ehPlanoFree(p?.plano_tipo)) {
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

        // Dias de atraso: usa a data de fim do plano pago como referencia (mais precisa pra
        // quem ja pagou antes e teve a assinatura vencida); se nunca pagou, usa o fim do trial.
        // Nao inventa campo novo no banco - reaproveita o que ja existe.
        if (st === 'em_atraso') {
          const dataReferencia = fimPlano || fimTrial
          const diasDesde = Math.floor((agora.getTime() - dataReferencia.getTime()) / (1000 * 60 * 60 * 24))
          setDiasAtraso(Math.max(0, diasDesde))
        }
      }

      setStatus(st)
      setLoading(false)
    }
    verificar()
  }, [])

  // Reavalia o bloqueio de rota a cada navegacao (sem repetir as consultas pesadas)
  useEffect(() => {
    if (!loading && isProfissional && pathname !== '/painel/minha-agenda' && pathname !== '/painel/alterar-senha' && pathname !== '/painel/meu-desempenho') {
      router.replace('/painel/minha-agenda')
    }
  }, [pathname, isProfissional, loading])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#475569',fontSize:'14px'}}>Carregando...</p>
    </div>
  )

  // Bloqueio progressivo por mensalidade em atraso (so aplica quando status==='em_atraso'):
  // ate 3 dias = aviso leve | 4-7 dias = aviso forte | 8-14 dias = bloqueio parcial (algumas
  // rotas de criacao/gerenciamento ficam indisponiveis) | 15+ dias = bloqueio quase total
  // (so Inicio/Meu plano/Suporte continuam acessiveis). diasAtraso null (sem data confiavel)
  // cai no nivel mais brando (leve), nunca bloqueia sem certeza.
  const nivelAtraso: 'leve'|'forte'|'parcial'|'total'|null =
    ehPlanoFree(planoTipo) ? null
    : status !== 'em_atraso' ? null
    : diasAtraso === null ? 'leve'
    : diasAtraso <= 3 ? 'leve'
    : diasAtraso <= 7 ? 'forte'
    : diasAtraso <= 14 ? 'parcial'
    : 'total'

  // So mostra a tela "Finalize sua assinatura" quando o trial JA venceu (status em_atraso,
  // ou seja, ja caiu em algum nivelAtraso) E a pessoa NUNCA autorizou nenhuma assinatura de
  // verdade no Mercado Pago (mp_subscription_id nunca foi preenchido pelo webhook). Nao
  // bloqueia ninguem ainda dentro do trial, nem quem ja pagou normalmente antes - so o caso
  // especifico "trial acabou e nunca chegou a autorizar nada".
  const precisaFinalizarAssinatura = nivelAtraso !== null && !temAssinaturaAutorizada

  // ETAPA 4 - 'aguardandoPagamento' agora e usado DE VERDADE mais abaixo, pra bloquear o
  // painel de contas pagas que nunca autorizaram nenhuma assinatura. precisaFinalizarCheckout
  // e statusPermiteAcessoCompleto continuam so preparados (Etapa 2), ainda sem uso real.
  const aguardandoPagamento = ehAguardandoPagamento(status)
  const precisaFinalizarCheckout = statusPrecisaFinalizarCheckout(status)
  void precisaFinalizarCheckout
  void statusPermiteAcessoCompleto

  // Bloqueio TOTAL (15+ dias): so essas rotas continuam acessiveis
  const ROTAS_PERMITIDAS_BLOQUEIO_TOTAL = ['/painel', '/painel/plano', '/painel/suporte']
  // Bloqueio PARCIAL (8-14 dias): essas rotas de criacao/gerenciamento ficam bloqueadas
  // (o restante do painel - agenda, clientes, financeiro em modo leitura, etc - continua acessivel)
  const PREFIXOS_BLOQUEADOS_PARCIAL = ['/painel/agendamentos/novo', '/painel/orcamentos/novo', '/painel/servicos', '/painel/profissionais', '/painel/perfil']

  const bloqueadoTotal = nivelAtraso === 'total' && !ROTAS_PERMITIDAS_BLOQUEIO_TOTAL.includes(pathname)
  const bloqueadoParcial = nivelAtraso === 'parcial' && PREFIXOS_BLOQUEADOS_PARCIAL.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Bloqueio por PLANO (nao por atraso de pagamento): algumas rotas so fazem sentido pros
  // planos com gestao completa (Pro/Equipe) ou exclusivamente pro plano Equipe. Sempre via
  // funcoes centralizadas de app/lib/planos.ts - nunca comparacao solta tipo plano==='x'.
  const planoAtual = normalizarPlano(planoTipo)
  const ROTAS_GESTAO = ['/painel/agendamentos', '/painel/clientes', '/painel/orcamentos', '/painel/cobrancas', '/painel/financeiro', '/painel/servicos', '/painel/relatorio', '/painel/perfil/agenda']
  const ROTAS_EQUIPE = ['/painel/profissionais']
  const precisaGestao = ROTAS_GESTAO.some(r => pathname === r || pathname.startsWith(r + '/'))
  const precisaEquipe = ROTAS_EQUIPE.some(r => pathname === r || pathname.startsWith(r + '/'))
  const bloqueadoPorPlano = (precisaGestao && !ehPlanoComGestao(planoAtual)) || (precisaEquipe && !permiteEquipe(planoAtual))

  // Profissional tentando acessar rota administrativa: nao renderiza nada ate o redirecionamento
  if (isProfissional && pathname !== '/painel/minha-agenda' && pathname !== '/painel/alterar-senha' && pathname !== '/painel/meu-desempenho') return (
    <div style={{minHeight:'100vh',background:'#08060A',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#B8AAB8',fontSize:'14px'}}>Redirecionando...</p>
    </div>
  )

  // Profissional na propria area: sem banners de cobranca (irrelevantes pra ela)
  if (isProfissional) return <>{children}</>

  if (status === 'bloqueado' || status === 'cancelado') return (
    <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#060C18,#050B16)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',fontFamily:'system-ui'}}>
      <div style={{maxWidth:'440px',width:'100%',background:'rgba(15,23,42,.95)',border:'1px solid rgba(124,58,237,.30)',borderRadius:'20px',padding:'40px 32px',textAlign:'center'}}>
        <div style={{fontSize:'36px',marginBottom:'16px'}}>🔒</div>
        <h2 style={{fontSize:'20px',fontWeight:800,color:'#F8FAFC',marginBottom:'12px'}}>Acesso bloqueado</h2>
        <p style={{fontSize:'14px',color:'#94A3B8',marginBottom:'28px',lineHeight:1.6}}>Regularize o pagamento para voltar a acessar o ClienteMarcado.</p>
        <button onClick={abrirCheckout} disabled={loadingPag} style={{display:'flex',width:'100%',alignItems:'center',justifyContent:'center',height:'48px',background:G,color:'#fff',border:'none',borderRadius:'12px',textDecoration:'none',fontSize:'14px',fontWeight:700,cursor:loadingPag?'wait':'pointer',opacity:loadingPag?.7:1,fontFamily:'inherit'}}>{loadingPag?'Gerando...':'Regularizar pagamento'}</button>
      </div>
    </div>
  )

  // ETAPA 4 - bloqueio de verdade pra quem esta 'aguardando_pagamento' (cadastro criado mas
  // nunca autorizou nenhuma assinatura no Mercado Pago ainda). So bloqueia planos PAGOS -
  // Free nunca cai aqui, ja que Free nunca tem status 'aguardando_pagamento' (a migration da
  // Etapa 3, ainda nao aplicada, so vai gravar esse valor pra planos pagos). Usa o MESMO
  // botao/endpoint (abrirCheckout -> /api/mercadopago/criar-assinatura) que o resto do
  // sistema ja usa - nao cria nenhum fluxo novo de pagamento.
  if (aguardandoPagamento && !ehPlanoFree(planoTipo)) return (
    <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#060C18,#050B16)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',fontFamily:'system-ui'}}>
      <div style={{maxWidth:'440px',width:'100%',background:'rgba(15,23,42,.95)',border:'1px solid rgba(139,92,246,.30)',borderRadius:'20px',padding:'40px 32px',textAlign:'center'}}>
        <div style={{fontSize:'36px',marginBottom:'16px'}}>💳</div>
        <h2 style={{fontSize:'20px',fontWeight:800,color:'#F8FAFC',marginBottom:'12px'}}>Finalize sua assinatura para ativar sua MiniPage Pro</h2>
        <p style={{fontSize:'14px',color:'#94A3B8',marginBottom:'20px',lineHeight:1.6}}>Seu cadastro foi criado, mas sua assinatura ainda não foi concluída. Finalize o pagamento com segurança para liberar o painel e iniciar seu período grátis.</p>
        <button onClick={abrirCheckout} disabled={loadingPag} style={{display:'flex',width:'100%',alignItems:'center',justifyContent:'center',height:'48px',background:G,color:'#fff',border:'none',borderRadius:'12px',textDecoration:'none',fontSize:'14px',fontWeight:700,cursor:loadingPag?'wait':'pointer',opacity:loadingPag?.7:1,fontFamily:'inherit',marginBottom:'12px'}}>{loadingPag?'Gerando...':'Finalizar assinatura'}</button>
        <a href={`https://wa.me/5511941059063?text=${encodeURIComponent('Olá! Preciso de ajuda para finalizar minha assinatura da MiniPage Pro.')}`} target="_blank" rel="noopener noreferrer" style={{display:'block',fontSize:'13px',color:'#94A3B8',textDecoration:'underline',marginBottom:'16px'}}>Falar com o suporte</a>
        <p style={{fontSize:'11px',color:'#64748B',lineHeight:1.5}}>Você só começa seu período grátis após concluir a assinatura.</p>
      </div>
    </div>
  )


  // Bloqueio TOTAL por atraso (15+ dias): mesmo estilo visual do bloqueio manual acima, so que
  // disparado automaticamente pelos dias calculados, com links pras 3 rotas ainda permitidas.
  if (bloqueadoTotal) return (
    <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#060C18,#050B16)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',fontFamily:'system-ui'}}>
      <div style={{maxWidth:'440px',width:'100%',background:'rgba(15,23,42,.95)',border:'1px solid rgba(239,68,68,.30)',borderRadius:'20px',padding:'40px 32px',textAlign:'center'}}>
        <div style={{fontSize:'36px',marginBottom:'16px'}}>🔒</div>
        <h2 style={{fontSize:'20px',fontWeight:800,color:'#F8FAFC',marginBottom:'12px'}}>Acesso temporariamente bloqueado</h2>
        <p style={{fontSize:'14px',color:'#94A3B8',marginBottom:'28px',lineHeight:1.6}}>Seu acesso está temporariamente bloqueado por mensalidade pendente. Regularize o pagamento para reativar sua conta.</p>
        <button onClick={abrirCheckout} disabled={loadingPag} style={{display:'flex',width:'100%',alignItems:'center',justifyContent:'center',height:'48px',background:G,color:'#fff',border:'none',borderRadius:'12px',textDecoration:'none',fontSize:'14px',fontWeight:700,cursor:loadingPag?'wait':'pointer',opacity:loadingPag?.7:1,fontFamily:'inherit',marginBottom:'14px'}}>{loadingPag?'Gerando...':'Regularizar pagamento'}</button>
        <div style={{display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap'}}>
          <a href="/painel" style={{fontSize:'12px',color:'#64748B',textDecoration:'underline'}}>Início</a>
          <a href="/painel/plano" style={{fontSize:'12px',color:'#64748B',textDecoration:'underline'}}>Meu plano</a>
          <a href="/painel/suporte" style={{fontSize:'12px',color:'#64748B',textDecoration:'underline'}}>Suporte</a>
        </div>
      </div>
    </div>
  )

  // Bloqueio PARCIAL por atraso (8-14 dias): mostra a tela so no lugar do conteudo da rota
  // bloqueada, mas mantem o restante da navegacao do painel intacto (o cliente pode voltar
  // pro Inicio ou outras areas nao-bloqueadas normalmente).
  if (bloqueadoParcial) return (
    <div style={{minHeight:'70vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',fontFamily:'system-ui'}}>
      <div style={{maxWidth:'440px',width:'100%',background:'rgba(15,23,42,.95)',border:'1px solid rgba(245,158,11,.30)',borderRadius:'20px',padding:'40px 32px',textAlign:'center'}}>
        <div style={{fontSize:'36px',marginBottom:'16px'}}>⚠️</div>
        <h2 style={{fontSize:'20px',fontWeight:800,color:'#F8FAFC',marginBottom:'12px'}}>Recurso indisponível</h2>
        <p style={{fontSize:'14px',color:'#94A3B8',marginBottom:'28px',lineHeight:1.6}}>Seu acesso está limitado por mensalidade pendente. Regularize o pagamento para voltar a usar todos os recursos.</p>
        <button onClick={abrirCheckout} disabled={loadingPag} style={{display:'flex',width:'100%',alignItems:'center',justifyContent:'center',height:'48px',background:G,color:'#fff',border:'none',borderRadius:'12px',textDecoration:'none',fontSize:'14px',fontWeight:700,cursor:loadingPag?'wait':'pointer',opacity:loadingPag?.7:1,fontFamily:'inherit',marginBottom:'14px'}}>{loadingPag?'Gerando...':'Regularizar pagamento'}</button>
        <a href="/painel" style={{fontSize:'12px',color:'#64748B',textDecoration:'underline'}}>Voltar para o Início</a>
      </div>
    </div>
  )

  // Bloqueio por PLANO: a rota exige gestao completa ou o plano Equipe, e a conta nao tem
  // essa permissao. So chega aqui se nao houver nenhum bloqueio de pagamento pendente antes.
  if (bloqueadoPorPlano) return (
    <BloqueioPorPlano
      permitido={false}
      titulo="Recurso disponível no MiniPage Pro"
      descricao="Este recurso faz parte dos planos com gestão completa. Faça upgrade para usar agenda, clientes, cobranças, financeiro e relatórios."
    >
      {null}
    </BloqueioPorPlano>
  )

  return (
    <>
      {nivelAtraso === 'leve' && (
        <div style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.28)',borderRadius:'0',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',position:'sticky',top:0,zIndex:40}}>
          <p style={{fontSize:'13px',fontWeight:600,color:'#FCD34D',margin:0}}>
            {precisaFinalizarAssinatura ? '⚠️ Seu período grátis acabou e você ainda não finalizou sua assinatura. Finalize agora para continuar usando sua MiniPage.' : '⚠️ Sua mensalidade está pendente. Regularize para evitar bloqueio do acesso.'}
          </p>
          <button onClick={abrirCheckout} disabled={loadingPag} style={{display:'inline-flex',alignItems:'center',height:'32px',padding:'0 16px',background:G,color:'#fff',borderRadius:'8px',border:'none',fontSize:'12px',fontWeight:700,whiteSpace:'nowrap',flexShrink:0,cursor:loadingPag?'wait':'pointer',opacity:loadingPag?.7:1,fontFamily:'inherit'}}>
            {loadingPag ? 'Gerando...' : precisaFinalizarAssinatura ? 'Finalizar assinatura' : 'Regularizar'}
          </button>
        </div>
      )}
      {nivelAtraso === 'forte' && (
        <div style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.32)',borderRadius:'0',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',position:'sticky',top:0,zIndex:40}}>
          <p style={{fontSize:'13px',fontWeight:700,color:'#FCA5A5',margin:0}}>
            {precisaFinalizarAssinatura ? '⚠️ Você ainda não finalizou sua assinatura há alguns dias. Finalize para evitar limitações no painel.' : '⚠️ Sua mensalidade está pendente há alguns dias. Regularize para evitar limitações no painel.'}
          </p>
          <button onClick={abrirCheckout} disabled={loadingPag} style={{display:'inline-flex',alignItems:'center',height:'32px',padding:'0 16px',background:G,color:'#fff',borderRadius:'8px',border:'none',fontSize:'12px',fontWeight:700,whiteSpace:'nowrap',flexShrink:0,cursor:loadingPag?'wait':'pointer',opacity:loadingPag?.7:1,fontFamily:'inherit'}}>
            {loadingPag ? 'Gerando...' : precisaFinalizarAssinatura ? 'Finalizar assinatura' : 'Regularizar'}
          </button>
        </div>
      )}
      {(nivelAtraso === 'parcial' || nivelAtraso === 'total') && (
        <div style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.36)',borderRadius:'0',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',position:'sticky',top:0,zIndex:40}}>
          <p style={{fontSize:'13px',fontWeight:700,color:'#FCA5A5',margin:0}}>
            🔒 {precisaFinalizarAssinatura
              ? (nivelAtraso === 'total' ? 'Seu acesso está temporariamente bloqueado. Finalize sua assinatura no Mercado Pago para reativar sua conta.' : 'Seu acesso está limitado porque a assinatura ainda não foi finalizada. Finalize para voltar a usar todos os recursos.')
              : (nivelAtraso === 'total' ? 'Seu acesso está temporariamente bloqueado por mensalidade pendente. Regularize o pagamento para reativar sua conta.' : 'Seu acesso está limitado por mensalidade pendente. Regularize o pagamento para voltar a usar todos os recursos.')}
          </p>
          <button onClick={abrirCheckout} disabled={loadingPag} style={{display:'inline-flex',alignItems:'center',height:'32px',padding:'0 16px',background:G,color:'#fff',borderRadius:'8px',border:'none',fontSize:'12px',fontWeight:700,whiteSpace:'nowrap',flexShrink:0,cursor:loadingPag?'wait':'pointer',opacity:loadingPag?.7:1,fontFamily:'inherit'}}>
            {loadingPag ? 'Gerando...' : precisaFinalizarAssinatura ? 'Finalizar assinatura' : 'Regularizar'}
          </button>
        </div>
      )}
      {diasTrial !== null && status === 'ativo' && (
        <div style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(96,165,250,.22)',borderRadius:'0',padding:'10px 24px',display:'flex',alignItems:'center',gap:'10px',position:'sticky',top:0,zIndex:40}}>
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