'use client'
import SeletorIdiomaGlobal from '../components/SeletorIdiomaGlobal'
import {useIdiomaGlobal} from '../components/IdiomaProviderGlobal'
import {inadimplencia26Extra} from '../lib/i18n-global/inadimplencia-26'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { garantirPerfilNoServidor } from '../lib/garantir-perfil-cliente'
import { Suspense } from 'react'
import BannerPagamentoSucesso from '../components/BannerPagamentoSucesso'
import {diasCalendarioAtraso,dataBrasilia} from '../lib/inadimplencia'
import AvisoPagamentoPendente, { SUPORTE_REGULARIZACAO } from '../components/AvisoPagamentoPendente'
import BloqueioPorPlano from '../components/BloqueioPorPlano'
import { normalizarPlano, ehPlanoComGestao, permiteAgenda, podeUsarProfissionais, ehPlanoFree, ehAguardandoPagamento, statusPermiteAcessoCompleto, statusPrecisaFinalizarCheckout, obterNomePlano, obterPrecoPlanoPorCiclo, normalizarBillingCycle, bloqueioPorRotaDoPainel } from '../lib/planos'

const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'
// Nomes amigaveis pra mensagem de erro refletir o plano real da pessoa (antes ficava fixo
// dizendo "Plano Equipe", mesmo quando o problema era com o MiniPage).
const NOME_PLANO_AMIGAVEL: Record<string, string> = { minipage: 'MiniPage', essencial: 'Profissional', equipe: 'Equipe' }
function nomePlanoAtual(planoTipo: string) { return NOME_PLANO_AMIGAVEL[planoTipo] || 'atual' }

// Cria um perfil inicial seguro pra uma conta que existe no Auth mas nao tem linha em
// `perfis` ainda (bug de cadastro: a chamada original pra /api/cadastro/criar-perfil e
// "dispara e esquece", sem checar sucesso - se falhar por qualquer motivo, a conta fica
// sem perfil pra sempre, sem ninguem perceber). Usa SEMPRE o auth.uid() da sessao atual
// (nunca busca por e-mail, nunca reaproveita perfil de outra pessoa). Reconfere com
// select antes de inserir, pra nao duplicar se outra aba/effect ja criou nesse meio-tempo.
async function criarPerfilAutomatico(userId: string, _metadata: any) {
  const { data: jaExiste } = await supabase.from('perfis').select('id').eq('user_id', userId).maybeSingle()
  if (jaExiste) return { criado: false }

  // SEGURANCA (P1): a criacao do perfil acontece SO no servidor (/api/cadastro/criar-perfil): sempre Free, nunca para
  // profissional de equipe, e sem aceitar plano nem nome vindos do navegador. O navegador nao faz mais INSERT em "perfis".
  const r = await garantirPerfilNoServidor()
  if (!r.ok) {
    console.warn('[criarPerfilAutomatico] Erro ao criar perfil:', r.erro)
    return { criado: false, erro: r.erro }
  }
  return { criado: r.criado, slug: r.slug }
}

export default function PainelLayoutClient({ children }: { children: React.ReactNode }) {
  const {idioma}=useIdiomaGlobal()
  const extra=inadimplencia26Extra(idioma)
  const [status, setStatus] = useState<string>('ativo')
  const [planoTipo, setPlanoTipo] = useState<string>('essencial')
  const [diasAtraso, setDiasAtraso] = useState<number|null>(null)
  const [freePorAtraso,setFreePorAtraso]=useState(false)
  const [erroPerfil,setErroPerfil]=useState(false)
  // Para a tela de "primeiro pagamento" (conta que ainda nao tem assinatura no gateway nem pagou).
  // Otimistas ate a consulta terminar, para nunca mostrar a tela errada por engano.
  const [gatewaySubId, setGatewaySubId] = useState<string | null>('carregando')
  const [primeiroPago, setPrimeiroPago] = useState(true)
  const [cicloPerfil, setCicloPerfil] = useState<string | null>(null)
  const [temAssinaturaAutorizada, setTemAssinaturaAutorizada] = useState(true) // otimista ate confirmar - nunca bloqueia por engano antes da consulta terminar
  const [loadingPag, setLoadingPag] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isProfissional, setIsProfissional] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  function abrirCheckout() {
    if (loadingPag) return
    // Nunca criar uma nova assinatura para regularizar uma cobrança antiga.
    if (freePorAtraso||['em_atraso','bloqueado','cancelado'].includes(status)) {window.location.href=SUPORTE_REGULARIZACAO;return}
    setLoadingPag(true)
    // /pos-confirmacao mostra a escolha entre Cartao de Credito e Pix, e so ali a API
    // /api/asaas/criar-assinatura e chamada de verdade, com o metodo escolhido - chamar a
    // API direto por aqui (como antes) sempre falha hoje, ja que ela exige metodoPagamento
    // explicito e nunca mais aceita UNDEFINED.
    window.location.href = '/pos-confirmacao'
  }

  useEffect(() => {
    let ocupado=false
    let encerrado=false
    async function verificar() {
      if(ocupado||encerrado)return
      ocupado=true
      try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      let { data: p, error: perfilError } = await supabase
        .from('perfis')
        .select('status_acesso, trial_ends_at, plano_ativo_ate, plano_tipo, mp_subscription_id, gateway_subscription_id, primeiro_pagamento_confirmado, billing_cycle, motivo_downgrade, plano_anterior_downgrade, inadimplencia_vencimento')
        .eq('user_id', user.id)
        .single()

      // Durante a instalacao, tolerar somente a ausencia da nova coluna, nunca outros erros.
      if(perfilError&&['42703','PGRST204'].includes(perfilError.code)&&perfilError.message.includes('inadimplencia_vencimento')){
        const fallback=await supabase.from('perfis').select('status_acesso, trial_ends_at, plano_ativo_ate, plano_tipo, mp_subscription_id, gateway_subscription_id, primeiro_pagamento_confirmado, billing_cycle, motivo_downgrade, plano_anterior_downgrade').eq('user_id',user.id).single()
        p=fallback.data?{...fallback.data,inadimplencia_vencimento:null}:null;perfilError=fallback.error
      }
      if(perfilError&&perfilError.code!=='PGRST116'){setErroPerfil(true);setLoading(false);return}
      setErroPerfil(false)
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
      setGatewaySubId(p?.gateway_subscription_id || null)
      setPrimeiroPago(p?.primeiro_pagamento_confirmado === true)
      setCicloPerfil(p?.billing_cycle || null)

      let st = p?.status_acesso || 'ativo'

      // NOTA: existia aqui uma logica baseada em trial_ends_at (trial de 7 dias) que
      // calculava se o trial tinha vencido e, nesse caso, mudava status_acesso pra
      // 'em_atraso' sozinha. Essa logica foi DESATIVADA - a nova regra de negocio nao usa
      // mais trial: Free e gratis sem vencimento, planos pagos so liberam/bloqueiam via
      // status_acesso definido pelo webhook do Asaas (pagamento confirmado libera,
      // atraso/cancelamento bloqueia). O campo trial_ends_at continua existindo no banco
      // (ainda preenchido pelo trigger_set_trial, que nao foi alterado), mas nao e mais
      // lido/usado aqui pra nenhuma decisao de acesso.

      setFreePorAtraso(p.plano_tipo==='free'&&p.motivo_downgrade==='inadimplencia'&&!!p.plano_anterior_downgrade)
      const venc=p.inadimplencia_vencimento||(p.plano_ativo_ate?dataBrasilia(p.plano_ativo_ate):null)
      setDiasAtraso(st==='em_atraso'&&venc?diasCalendarioAtraso(venc):null)

      setStatus(st)
      setLoading(false)
      }catch{if(!encerrado){setErroPerfil(true);setLoading(false)}}finally{ocupado=false}
    }
    void verificar()
    const refresh=()=>{if(document.visibilityState==='visible')void verificar()}
    window.addEventListener('focus',refresh)
    const timer=window.setInterval(refresh,60000)
    return ()=>{encerrado=true;window.removeEventListener('focus',refresh);window.clearInterval(timer)}
  }, [])

  // Reavalia o bloqueio de rota a cada navegacao (sem repetir as consultas pesadas)
  useEffect(() => {
    if (!loading && isProfissional && pathname !== '/painel/minha-agenda' && pathname !== '/painel/alterar-senha' && pathname !== '/painel/meu-desempenho') {
      router.replace('/painel/minha-agenda')
    }
  }, [pathname, isProfissional, loading])

  if(erroPerfil)return <div style={{minHeight:'60vh',padding:32,color:'#fff',background:'#0B0A10'}}>{extra[1]} <button type="button" onClick={()=>window.location.reload()}>{extra[2]}</button> <a href="/painel/suporte">{extra[3]}</a></div>

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#475569',fontSize:'14px'}}>Carregando...</p>
    </div>
  )

  // O servidor confirma downgrade. Nunca rebaixar ou bloquear por relogio do navegador.
  const nivelAtraso = freePorAtraso?'free':!ehPlanoFree(planoTipo)&&status==='em_atraso'?((diasAtraso??0)<=3?'leve':'forte'):null

  // So mostra a tela "Finalize sua assinatura" quando o trial JA venceu (status em_atraso,
  // ou seja, ja caiu em algum nivelAtraso) E a pessoa NUNCA autorizou nenhuma assinatura de
  // verdade no Mercado Pago (mp_subscription_id nunca foi preenchido pelo webhook). Nao
  // bloqueia ninguem ainda dentro do trial, nem quem ja pagou normalmente antes - so o caso
  // especifico "trial acabou e nunca chegou a autorizar nada".
  void temAssinaturaAutorizada

  // ETAPA 4 - 'aguardandoPagamento' agora e usado DE VERDADE mais abaixo, pra bloquear o
  // painel de contas pagas que nunca autorizaram nenhuma assinatura. precisaFinalizarCheckout
  // e statusPermiteAcessoCompleto continuam so preparados (Etapa 2), ainda sem uso real.
  const aguardandoPagamento = ehAguardandoPagamento(status)
  const precisaFinalizarCheckout = statusPrecisaFinalizarCheckout(status)
  void precisaFinalizarCheckout
  void statusPermiteAcessoCompleto

  // Bloqueio por PLANO (nao por atraso de pagamento): algumas rotas so fazem sentido pros
  // planos com gestao completa (Pro/Equipe) ou exclusivamente pro plano Equipe. Sempre via
  // funcoes centralizadas de app/lib/planos.ts - nunca comparacao solta tipo plano==='x'.
  const planoAtual = normalizarPlano(planoTipo)
  // Agenda, Loja e Pro podem operar horarios/servicos. Financeiro e gestao administrativa
  // continuam exclusivos de Pro/Equipe. Nao ampliar podeUsarProfissionais aqui:
  // cadastros e logins de equipe exigem verificacao separada dos limites e da RLS.
  const ROTAS_AGENDA = ['/painel/agendamentos', '/painel/servicos', '/painel/perfil/agenda']
  const ROTAS_GESTAO = ['/painel/clientes', '/painel/orcamentos', '/painel/cobrancas', '/painel/financeiro', '/painel/relatorio']
  const ROTAS_PROFISSIONAIS = ['/painel/profissionais']
  const precisaAgenda = ROTAS_AGENDA.some(r => pathname === r || pathname.startsWith(r + '/'))
  const precisaGestao = ROTAS_GESTAO.some(r => pathname === r || pathname.startsWith(r + '/'))
  const precisaProfissionais = ROTAS_PROFISSIONAIS.some(r => pathname === r || pathname.startsWith(r + '/'))
  const bloqueadoPorPlano = (precisaAgenda && !permiteAgenda(planoAtual)) || (precisaGestao && !ehPlanoComGestao(planoAtual)) || (precisaProfissionais && !podeUsarProfissionais(planoAtual))
  // Rotas dos modulos da pagina (albuns, cards, Spotify, destaques, videos, eventos, catalogo): barra a URL direta conforme o plano
  const bloqueioModulo = bloqueioPorRotaDoPainel(pathname, planoAtual)

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
        <p style={{fontSize:'14px',color:'#94A3B8',marginBottom:'28px',lineHeight:1.6}}>Regularize o pagamento para voltar a acessar o MiniPage Pro.</p>
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
  // Conta que ainda NAO tem assinatura no gateway e nunca pagou (ex: recebeu a MiniPage por
  // transferencia): tela de "primeiro pagamento". Quem ja iniciou o checkout (tem assinatura
  // mas ainda nao pagou) continua vendo a tela de baixo, e o mesmo botao reaproveita a cobranca.
  const primeiroPagamentoPendente = aguardandoPagamento && !ehPlanoFree(planoTipo) && gatewaySubId === null && !primeiroPago
  const cicloExibido = normalizarBillingCycle(cicloPerfil)   // vazio (conta antiga/transferida) = mensal
  const precoExibido = obterPrecoPlanoPorCiclo(planoTipo, cicloExibido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  if (primeiroPagamentoPendente) return (
    <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#060C18,#050B16)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',fontFamily:'system-ui'}}>
      <div style={{maxWidth:'440px',width:'100%',background:'rgba(15,23,42,.95)',border:'1px solid rgba(139,92,246,.30)',borderRadius:'20px',padding:'40px 32px',textAlign:'center'}}>
        <div style={{fontSize:'36px',marginBottom:'16px'}}>🎉</div>
        <h2 style={{fontSize:'20px',fontWeight:800,color:'#F8FAFC',marginBottom:'12px'}}>Sua MiniPage está pronta 🎉</h2>
        <p style={{fontSize:'14px',color:'#94A3B8',marginBottom:'20px',lineHeight:1.6}}>Finalize sua assinatura para continuar usando todos os recursos da sua página profissional.</p>
        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'24px'}}>Plano {obterNomePlano(planoTipo)} — {precoExibido}/{cicloExibido === 'anual' ? 'ano' : 'mês'}</p>
        <button onClick={abrirCheckout} disabled={loadingPag} style={{display:'flex',width:'100%',alignItems:'center',justifyContent:'center',height:'48px',background:G,color:'#fff',border:'none',borderRadius:'12px',textDecoration:'none',fontSize:'14px',fontWeight:700,cursor:loadingPag?'wait':'pointer',opacity:loadingPag?.7:1,fontFamily:'inherit',marginBottom:'12px'}}>{loadingPag?'Gerando...':'Finalizar assinatura'}</button>
        <a href={`https://wa.me/5511941059063?text=${encodeURIComponent('Olá! Preciso de ajuda para finalizar minha assinatura da MiniPage Pro.')}`} target="_blank" rel="noopener noreferrer" style={{display:'block',fontSize:'12px',color:'#64748B',textDecoration:'underline'}}>Precisa de ajuda? Fale com o suporte</a>
      </div>
    </div>
  )

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


  // Bloqueio por PLANO: a rota exige gestao completa ou o plano Equipe, e a conta nao tem
  // essa permissao. So chega aqui se nao houver nenhum bloqueio de pagamento pendente antes.
  // REGRAS DE PLANO: a URL do modulo e de um recurso que o plano nao tem (nao basta esconder o botao no hub)
  if (bloqueioModulo) return (
    <BloqueioPorPlano
      permitido={false}
      titulo={bloqueioModulo.titulo}
      descricao={bloqueioModulo.descricao}
    >
      {null}
    </BloqueioPorPlano>
  )

  if (bloqueadoPorPlano) return (
    <BloqueioPorPlano
      permitido={false}
      titulo={precisaAgenda ? 'Recurso disponível no MiniPage Agenda' : 'Recurso disponível no MiniPage Pro'}
      descricao={precisaAgenda ? 'Agendamentos e serviços estão incluídos nos planos Agenda, Loja e Pro.' : 'Gestão administrativa, cobranças e financeiro são recursos do MiniPage Pro.'}
    >
      {null}
    </BloqueioPorPlano>
  )

  return (
    <>
      <div style={{display:'flex',justifyContent:'flex-end',padding:'5px 16px',background:'#08060A'}}><SeletorIdiomaGlobal compacto /></div>
      {nivelAtraso!==null&&<AvisoPagamentoPendente nivel={nivelAtraso}/>}
      <Suspense fallback={null}><BannerPagamentoSucesso /></Suspense>
      {children}
    </>
  )
}