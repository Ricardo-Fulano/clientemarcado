'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Home, Calendar, Users, ClipboardList, Wallet, CreditCard, Sparkles, User, BarChart3, Settings, HelpCircle, Search, ChevronRight, MessageCircle, X } from 'lucide-react'

const SUPORTE_WHATSAPP = '5511999999999'

const SB_LINKS = [
  { h: '/painel', l: 'Início', I: Home },
  { h: '/painel/agendamentos', l: 'Agenda', I: Calendar },
  { h: '/painel/clientes', l: 'Clientes', I: Users },
  { h: '/painel/orcamentos', l: 'Orçamentos', I: ClipboardList },
  { h: '/painel/cobrancas', l: 'Cobranças', I: Wallet },
  { h: '/painel/pagamentos', l: 'Pagamentos', I: CreditCard },
  { h: '/painel/servicos', l: 'Serviços', I: Sparkles },
  { h: '/painel/profissionais', l: 'Profissionais', I: User },
  { h: '/painel/relatorio', l: 'Relatórios', I: BarChart3 },
  { h: '/painel/perfil', l: 'Configurações', I: Settings },
  { h: '/painel/suporte', l: 'Suporte', I: HelpCircle, on: true },
]

interface HelpItem {
  category: string
  question: string
  keywords: string[]
  answer: string
}

const HELP_ITEMS: HelpItem[] = [
  { category: 'Agenda', question: 'Como criar um novo agendamento?', keywords: ['agenda', 'agendamento', 'criar', 'novo', 'horário', 'agendar'], answer: 'Acesse Agenda, clique em Novo agendamento, selecione o cliente, serviço, profissional, data e horário. Depois confirme para registrar o atendimento.' },
  { category: 'Agenda', question: 'Como bloquear um horário?', keywords: ['bloquear', 'bloqueio', 'horário', 'indisponível'], answer: 'Acesse Agenda e clique em Bloquear horário. Escolha a data e o horário que não estará disponível para atendimento.' },
  { category: 'Agenda', question: 'Como confirmar se o cliente compareceu?', keywords: ['compareceu', 'confirmou', 'presença', 'atendimento'], answer: 'Na Agenda, encontre o atendimento e clique em Compareceu. Isso ajuda a manter o histórico organizado.' },
  { category: 'Agenda', question: 'Como marcar uma falta?', keywords: ['falta', 'faltou', 'ausência', 'não compareceu'], answer: 'Na Agenda, encontre o atendimento e clique em Faltou. O status será atualizado para você acompanhar ausências.' },
  { category: 'Agenda', question: 'Como enviar lembrete?', keywords: ['lembrete', 'lembrar', 'aviso', 'notificação'], answer: 'Na Agenda, clique em Lembrete no atendimento desejado. O sistema facilita o envio da mensagem pelo WhatsApp.' },
  { category: 'Clientes', question: 'Como cadastrar um cliente?', keywords: ['cadastrar', 'cliente', 'novo cliente', 'adicionar'], answer: 'Acesse Clientes e clique em Novo cliente. Preencha nome, WhatsApp e os dados necessários.' },
  { category: 'Clientes', question: 'Como encontrar um cliente?', keywords: ['encontrar', 'buscar', 'procurar', 'pesquisar', 'cliente'], answer: 'Acesse Clientes e use a busca para procurar por nome, WhatsApp ou e-mail.' },
  { category: 'Clientes', question: 'Como falar com um cliente pelo WhatsApp?', keywords: ['whatsapp', 'falar', 'mensagem', 'contato', 'cliente'], answer: 'Na lista de clientes ou nos detalhes do atendimento, clique no botão WhatsApp para abrir a conversa.' },
  { category: 'Serviços', question: 'Como cadastrar um serviço?', keywords: ['serviço', 'cadastrar', 'novo serviço', 'adicionar serviço'], answer: 'Acesse Serviços, clique em Novo serviço, preencha nome, valor, duração, categoria e profissional responsável. Depois clique em Salvar.' },
  { category: 'Serviços', question: 'Como editar o valor de um serviço?', keywords: ['editar', 'valor', 'preço', 'serviço', 'alterar'], answer: 'Acesse Serviços, clique em Editar no serviço desejado, altere o valor e salve.' },
  { category: 'Serviços', question: 'Como ativar ou desativar um serviço?', keywords: ['ativar', 'desativar', 'serviço', 'ocultar', 'esconder'], answer: 'Acesse Serviços e use o botão Ativar ou Desativar no serviço desejado.' },
  { category: 'Orçamentos', question: 'Como criar um orçamento?', keywords: ['orçamento', 'criar', 'novo orçamento'], answer: 'Acesse Orçamentos, clique em Novo orçamento, selecione ou cadastre o cliente, adicione serviço, quantidade e valor. Depois salve o orçamento.' },
  { category: 'Orçamentos', question: 'Como enviar orçamento para o cliente?', keywords: ['enviar', 'orçamento', 'cliente', 'whatsapp'], answer: 'Depois de criar o orçamento, use o botão de WhatsApp ou copie a mensagem pronta para enviar ao cliente.' },
  { category: 'Cobranças', question: 'Como criar uma cobrança?', keywords: ['cobrança', 'cobrar', 'criar cobrança'], answer: 'Acesse Cobranças, crie uma nova cobrança vinculada ao cliente ou orçamento, informe o valor e acompanhe o status.' },
  { category: 'Pagamentos', question: 'Como registrar um pagamento?', keywords: ['pagamento', 'registrar', 'receber', 'pago'], answer: 'Acesse Pagamentos, clique em Registrar pagamento, informe o cliente, valor, forma de pagamento e salve.' },
  { category: 'Pagamentos', question: 'Como ver valores recebidos?', keywords: ['recebido', 'valores', 'total', 'mês', 'receita'], answer: 'Acesse Pagamentos ou o painel inicial para acompanhar os valores recebidos no mês.' },
  { category: 'Página pública', question: 'Como copiar o link da minha página?', keywords: ['link', 'página', 'copiar', 'compartilhar', 'pública'], answer: 'No início do painel, encontre o card da sua página pública e clique em Copiar link.' },
  { category: 'Página pública', question: 'Como meus clientes agendam?', keywords: ['clientes', 'agendam', 'como agendam', 'página pública', 'como funciona'], answer: 'Seus clientes acessam sua página pública, escolhem o serviço, profissional, data e horário, depois informam nome e WhatsApp para confirmar o agendamento.' },
  { category: 'Conta e mensalidade', question: 'Minha mensalidade está pendente. O que fazer?', keywords: ['mensalidade', 'pendente', 'pagamento', 'regularizar', 'assinatura'], answer: 'Clique no botão Regularizar pagamento no aviso do painel e conclua o pagamento para evitar bloqueio.' },
  { category: 'Conta e mensalidade', question: 'Meu painel foi bloqueado. O que fazer?', keywords: ['bloqueado', 'bloqueio', 'acesso', 'suspenso'], answer: 'Regularize o pagamento pelo botão disponível no painel. Se o problema continuar após o pagamento, fale com o suporte pelo WhatsApp.' },
  { category: 'Conta e mensalidade', question: 'Como cancelar?', keywords: ['cancelar', 'cancelamento', 'encerrar', 'sair'], answer: 'Para solicitar cancelamento, fale com o suporte pelo WhatsApp. Não existe fidelidade ou prazo mínimo.' },
]

const CATEGORIAS = ['Agenda', 'Clientes', 'Serviços', 'Orçamentos', 'Cobranças', 'Pagamentos', 'Página pública', 'Conta e mensalidade']

const CORES_CAT: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  'Agenda':             { bg: 'rgba(59,130,246,.10)',  border: 'rgba(59,130,246,.25)',  text: '#93C5FD', icon: '📅' },
  'Clientes':           { bg: 'rgba(34,197,94,.10)',   border: 'rgba(34,197,94,.25)',   text: '#86EFAC', icon: '👥' },
  'Serviços':           { bg: 'rgba(168,85,247,.10)',  border: 'rgba(168,85,247,.25)',  text: '#C4B5FD', icon: '✨' },
  'Orçamentos':         { bg: 'rgba(245,158,11,.10)',  border: 'rgba(245,158,11,.25)',  text: '#FCD34D', icon: '📋' },
  'Cobranças':          { bg: 'rgba(239,68,68,.10)',   border: 'rgba(239,68,68,.25)',   text: '#FCA5A5', icon: '💳' },
  'Pagamentos':         { bg: 'rgba(20,184,166,.10)',  border: 'rgba(20,184,166,.25)',  text: '#5EEAD4', icon: '💰' },
  'Página pública':     { bg: 'rgba(99,102,241,.10)',  border: 'rgba(99,102,241,.25)',  text: '#A5B4FC', icon: '🌐' },
  'Conta e mensalidade':{ bg: 'rgba(148,163,184,.10)', border: 'rgba(148,163,184,.25)', text: '#CBD5E1', icon: '⚙️' },
}

const AV = 'linear-gradient(135deg,rgba(59,130,246,.95),rgba(124,58,237,.95))'
const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
.sb{width:220px;min-height:100vh;background:radial-gradient(circle at top left,rgba(124,58,237,.14),transparent 32%),linear-gradient(180deg,#070F1D,#050B16);border-right:1px solid rgba(148,163,184,.14);display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:30}
.sb-logo{padding:20px 16px 16px;border-bottom:1px solid rgba(148,163,184,.08);display:flex;align-items:center;gap:8px}
.sb-ic{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#3B82F6,#7C3AED);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 22px rgba(124,58,237,.48)}
.sb nav{flex:1;padding:10px 8px;overflow-y:auto}
.nl{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;margin-bottom:2px;text-decoration:none;font-size:13px;font-weight:500;color:#94A3B8;transition:all .18s;border:1px solid transparent;white-space:nowrap}
.nl:hover{background:rgba(124,58,237,.10);color:#fff;border-color:rgba(124,58,237,.20)}
.nl.on{background:linear-gradient(135deg,#3B82F6,#7C3AED);color:#fff;font-weight:700;box-shadow:0 0 26px rgba(124,58,237,.34),inset 0 1px 0 rgba(255,255,255,.10);border-color:rgba(255,255,255,.10)}
.sb-foot{padding:10px;border-top:1px solid rgba(148,163,184,.08)}
.mob-hdr{display:none;align-items:center;justify-content:space-between;padding:0 16px;height:56px;background:rgba(5,11,22,.94);backdrop-filter:blur(20px);border-bottom:1px solid rgba(148,163,184,.1);position:sticky;top:0;z-index:20;width:100%}
.drw{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;background:linear-gradient(180deg,#070F1D,#050B16);z-index:50;transform:translateX(-100%);transition:transform .28s ease;display:flex;flex-direction:column;border-right:1px solid rgba(148,163,184,.12)}
.drw.open{transform:translateX(0)}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:49;opacity:0;pointer-events:none;transition:opacity .28s}
.ovl.open{opacity:1;pointer-events:auto}
.main{margin-left:220px;flex:1;min-height:100vh;width:calc(100% - 220px);max-width:calc(100% - 220px)}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1060px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;padding:24px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.inp{width:100%;background:rgba(15,23,42,.88);border:1.5px solid rgba(148,163,184,.18);border-radius:12px;padding:0 14px 0 42px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.12)}
@media(max-width:1023px){
  .sb{display:none!important}.main{margin-left:0!important;width:100%!important;max-width:100%!important}
  .mob-hdr{display:flex!important}.bdy{padding:14px 16px 80px!important}
  .cats-grid{grid-template-columns:repeat(2,1fr)!important}
}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
`

export default function Suporte() {
  const [mob, setMob] = useState(false)
  const [catAtiva, setCatAtiva] = useState<string | null>(null)
  const [pergAtiva, setPergAtiva] = useState<HelpItem | null>(null)
  const [busca, setBusca] = useState('')
  const [nome] = useState('Meu negócio')

  const linkWpp = (duvida?: string) => {
    const msg = duvida
      ? `Olá! Preciso de ajuda com o ClienteMarcado.\n\nDúvida: ${duvida}`
      : 'Olá! Preciso de ajuda com o ClienteMarcado.'
    return `https://wa.me/${SUPORTE_WHATSAPP}?text=${encodeURIComponent(msg)}`
  }

  const itensFiltrados = (): HelpItem[] => {
    const q = busca.toLowerCase().trim()
    if (!q && !catAtiva) return []
    if (q) return HELP_ITEMS.filter(i => i.keywords.some(k => k.includes(q)) || i.question.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    if (catAtiva) return HELP_ITEMS.filter(i => i.category === catAtiva)
    return []
  }

  const itens = itensFiltrados()
  const semResultado = (busca.trim().length > 2 || catAtiva) && itens.length === 0

  const ini = (nome || 'M').charAt(0).toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050B16', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={`ovl${mob ? ' open' : ''}`} onClick={() => setMob(false)} />

      {/* Drawer mobile */}
      <div className={`drw${mob ? ' open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(148,163,184,.10)' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC' }}>ClienteMarcado</span>
          <button onClick={() => setMob(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>×</button>
        </div>
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {SB_LINKS.map(it => (
            <Link key={it.l} href={it.h} prefetch={false} onClick={() => setMob(false)} className={'nl' + (it.on ? ' on' : '')} style={{ fontSize: '14px' }}>
              <it.I size={16} /><span>{it.l}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Sidebar desktop */}
      <aside className="sb">
        <div className="sb-logo">
          <div className="sb-ic"><Calendar size={14} color="#fff" /></div>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>ClienteMarcado</span>
        </div>
        <nav>
          {SB_LINKS.map(it => (
            <Link key={it.l} href={it.h} prefetch={false} className={'nl' + (it.on ? ' on' : '')}>
              <it.I size={16} /><span>{it.l}</span>
            </Link>
          ))}
        </nav>
        <div className="sb-foot">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(148,163,184,.12)', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: AV, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{ini}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</p>
              <p style={{ fontSize: '10px', color: '#64748B' }}>Administrador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <div className="mob-hdr">
          <button onClick={() => setMob(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[22, 22, 16].map((w, i) => <span key={i} style={{ display: 'block', width: `${w}px`, height: '2px', background: 'rgba(255,255,255,.8)', borderRadius: '2px' }} />)}
          </button>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC' }}>Suporte</span>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: AV, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff' }}>{ini}</div>
        </div>

        <div className="pg">
          <div className="bdy">

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.04em', marginBottom: 5 }}>Central de Ajuda</h1>
                <p style={{ fontSize: 13, color: '#64748B' }}>Tire dúvidas sobre o ClienteMarcado e encontre respostas rápidas.</p>
              </div>
              <Link href="/painel" prefetch={false} style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.14)', borderRadius: 8 }}>← Voltar ao painel</Link>
            </div>

            {/* Busca */}
            <div className="crd" style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>Assistente ClienteMarcado</p>
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Digite ou escolha uma dúvida para receber uma resposta rápida.</p>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                <input
                  className="inp"
                  placeholder="Ex: como criar agendamento, cadastrar serviço..."
                  value={busca}
                  onChange={e => { setBusca(e.target.value); setCatAtiva(null); setPergAtiva(null) }}
                />
                {busca && (
                  <button onClick={() => { setBusca(''); setPergAtiva(null) }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex' }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Botões rápidos */}
              {!busca && !catAtiva && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { label: 'Criar agendamento', key: 'agenda' },
                    { label: 'Cadastrar serviço', key: 'serviço' },
                    { label: 'Copiar link da página', key: 'link' },
                    { label: 'Enviar lembrete', key: 'lembrete' },
                    { label: 'Registrar pagamento', key: 'pagamento' },
                    { label: 'Regularizar mensalidade', key: 'mensalidade' },
                  ].map(b => (
                    <button key={b.key} onClick={() => { setBusca(b.key); setCatAtiva(null); setPergAtiva(null) }} style={{
                      background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.16)', borderRadius: 8,
                      padding: '7px 12px', fontSize: 12, color: '#CBD5E1', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.35)'; e.currentTarget.style.color = '#F8FAFC' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,.16)'; e.currentTarget.style.color = '#CBD5E1' }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Resultados */}
              {itens.length > 0 && !pergAtiva && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeIn .2s ease' }}>
                  {itens.map((item, i) => (
                    <button key={i} onClick={() => setPergAtiva(item)} style={{
                      background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.14)', borderRadius: 10,
                      padding: '10px 14px', fontSize: 13, color: '#CBD5E1', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, transition: 'all .15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.30)'; e.currentTarget.style.color = '#F8FAFC' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,.14)'; e.currentTarget.style.color = '#CBD5E1' }}
                    >
                      <span>
                        <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', marginRight: 6 }}>{item.category}</span>
                        {item.question}
                      </span>
                      <ChevronRight size={14} style={{ flexShrink: 0, opacity: .5 }} />
                    </button>
                  ))}
                </div>
              )}

              {/* Resposta */}
              {pergAtiva && (
                <div style={{ marginTop: 16, animation: 'fadeIn .2s ease' }}>
                  <div style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.20)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{pergAtiva.category}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>{pergAtiva.question}</p>
                    <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.7 }}>{pergAtiva.answer}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setPergAtiva(null)} style={{ background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.16)', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#94A3B8', cursor: 'pointer', fontFamily: 'inherit' }}>
                      ← Voltar
                    </button>
                    <a href={linkWpp(pergAtiva.question)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)', color: '#4ADE80', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                      <MessageCircle size={13} /> Falar com suporte
                    </a>
                  </div>
                </div>
              )}

              {/* Sem resultado */}
              {semResultado && !pergAtiva && (
                <div style={{ marginTop: 16, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.20)', borderRadius: 14, padding: '14px 16px', animation: 'fadeIn .2s ease' }}>
                  <p style={{ fontSize: 13, color: '#FCD34D', marginBottom: 10 }}>Não encontrei uma resposta exata para essa dúvida. Fale conosco pelo WhatsApp!</p>
                  <a href={linkWpp(busca)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,.14)', border: '1px solid rgba(34,197,94,.28)', color: '#4ADE80', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    <MessageCircle size={14} /> Falar com suporte
                  </a>
                </div>
              )}
            </div>

            {/* Categorias */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Explorar por categoria</p>
              <div className="cats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
                {CATEGORIAS.map(cat => {
                  const c = CORES_CAT[cat]
                  const ativa = catAtiva === cat
                  return (
                    <button key={cat} onClick={() => { setCatAtiva(ativa ? null : cat); setBusca(''); setPergAtiva(null) }} style={{
                      background: ativa ? c.bg : 'rgba(15,23,42,.72)',
                      border: `1px solid ${ativa ? c.border : 'rgba(148,163,184,.14)'}`,
                      borderRadius: 12, padding: '14px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all .18s',
                    }}
                      onMouseEnter={e => { if (!ativa) { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.bg } }}
                      onMouseLeave={e => { if (!ativa) { e.currentTarget.style.borderColor = 'rgba(148,163,184,.14)'; e.currentTarget.style.background = 'rgba(15,23,42,.72)' } }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: ativa ? c.text : '#CBD5E1', lineHeight: 1.3 }}>{cat}</p>
                    </button>
                  )
                })}
              </div>

              {/* Perguntas da categoria */}
              {catAtiva && itens.length > 0 && !pergAtiva && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20, animation: 'fadeIn .2s ease' }}>
                  {itens.map((item, i) => (
                    <button key={i} onClick={() => setPergAtiva(item)} style={{
                      background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.14)', borderRadius: 10,
                      padding: '12px 16px', fontSize: 13, color: '#CBD5E1', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, transition: 'all .15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.30)'; e.currentTarget.style.color = '#F8FAFC' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,.14)'; e.currentTarget.style.color = '#CBD5E1' }}
                    >
                      {item.question}
                      <ChevronRight size={14} style={{ flexShrink: 0, opacity: .5 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Falar com suporte */}
            <div style={{ background: 'radial-gradient(circle at top left,rgba(34,197,94,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))', border: '1.5px solid rgba(34,197,94,.18)', borderRadius: 18, padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>Não encontrou o que precisava?</p>
                <p style={{ fontSize: 13, color: '#64748B' }}>Nossa equipe responde pelo WhatsApp em horário comercial.</p>
              </div>
              <a href={linkWpp()} target="_blank" rel="noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: G, color: '#fff', borderRadius: 12, padding: '11px 20px',
                fontSize: 13, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap',
                boxShadow: '0 8px 24px rgba(59,130,246,.28)',
              }}>
                <MessageCircle size={15} /> Falar com suporte
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
