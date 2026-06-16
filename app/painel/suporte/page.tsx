'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, MessageCircle, X, CalendarDays, Users, Star, ClipboardList, CreditCard, CircleDollarSign, Globe, Settings, Clock } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
import { supabase } from '../../lib/supabase'
import { useEffect } from 'react'
const SUPORTE_WHATSAPP = '5511999999999'
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
const CORES_CAT: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  'Agenda':              { bg: 'rgba(59,130,246,.10)',  border: 'rgba(59,130,246,.25)',  text: '#93C5FD', iconBg: 'rgba(59,130,246,.18)'  },
  'Clientes':            { bg: 'rgba(34,211,238,.10)',  border: 'rgba(34,211,238,.25)',  text: '#22D3EE', iconBg: 'rgba(34,211,238,.14)'  },
  'Serviços':            { bg: 'rgba(168,85,247,.10)',  border: 'rgba(168,85,247,.25)',  text: '#C4B5FD', iconBg: 'rgba(168,85,247,.16)' },
  'Orçamentos':          { bg: 'rgba(167,139,250,.10)', border: 'rgba(167,139,250,.25)', text: '#A78BFA', iconBg: 'rgba(167,139,250,.16)' },
  'Cobranças':           { bg: 'rgba(245,158,11,.10)',  border: 'rgba(245,158,11,.25)',  text: '#F59E0B', iconBg: 'rgba(245,158,11,.14)'  },
  'Pagamentos':          { bg: 'rgba(34,197,94,.10)',   border: 'rgba(34,197,94,.25)',   text: '#22C55E', iconBg: 'rgba(34,197,94,.14)'   },
  'Página pública':      { bg: 'rgba(34,211,238,.10)',  border: 'rgba(34,211,238,.25)',  text: '#22D3EE', iconBg: 'rgba(34,211,238,.14)'  },
  'Conta e mensalidade': { bg: 'rgba(139,92,246,.10)',  border: 'rgba(139,92,246,.25)',  text: '#8B5CF6', iconBg: 'rgba(139,92,246,.16)'  },
}
const CAT_ICONS: Record<string, React.ReactNode> = {
  'Agenda':              <CalendarDays  size={24} />,
  'Clientes':            <Users         size={24} />,
  'Serviços':            <Star          size={24} />,
  'Orçamentos':          <ClipboardList size={24} />,
  'Cobranças':           <CreditCard    size={24} />,
  'Pagamentos':          <CircleDollarSign size={24} />,
  'Página pública':      <Globe         size={24} />,
  'Conta e mensalidade': <Settings      size={24} />,
}
const G = 'linear-gradient(135deg,#3B82F6,#7C3AED)'
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#050B16}
input,select,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(124,58,237,.20),transparent 32%),radial-gradient(circle at top right,rgba(37,99,235,.14),transparent 28%),linear-gradient(135deg,#050B16 0%,#07111F 45%,#050B16 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:1060px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(124,58,237,.08),transparent 38%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99));border:1.5px solid rgba(148,163,184,.18);border-radius:18px;padding:24px;box-shadow:0 20px 48px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04)}
.inp{width:100%;background:rgba(15,23,42,.88);border:1.5px solid rgba(148,163,184,.18);border-radius:12px;padding:0 14px 0 42px;height:48px;font-size:14px;color:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;display:block;box-sizing:border-box}
.inp:focus{border-color:rgba(124,58,237,.55);box-shadow:0 0 0 3px rgba(124,58,237,.12)}
.cats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
@media(max-width:1023px){
  .bdy{padding:14px 16px 80px!important}
  .cats-grid{grid-template-columns:repeat(2,1fr)!important}
}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
`
export default function Suporte() {
  const [catAtiva, setCatAtiva] = useState<string | null>(null)
  const [pergAtiva, setPergAtiva] = useState<HelpItem | null>(null)
  const [busca, setBusca] = useState('')
  const [nome, setNome] = useState('')
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      supabase.from('perfis').select('nome_negocio').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setNome(data.nome_negocio || '') })
    })
  }, [])
  const linkWpp = (duvida?: string) => {
    const msg = duvida
      ? `Olá! Preciso de ajuda com o ClienteMarcado.\n\nDúvida: ${duvida}`
      : 'Olá! Preciso de ajuda com o ClienteMarcado.'
    return `https://wa.me/${SUPORTE_WHATSAPP}?text=${encodeURIComponent(msg)}`
  }
  const itensFiltrados = (): HelpItem[] => {
    const q = busca.toLowerCase().trim()
    if (!q && !catAtiva) return []
    if (q) return HELP_ITEMS.filter(i =>
      i.keywords.some(k => k.includes(q)) ||
      i.question.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    )
    if (catAtiva) return HELP_ITEMS.filter(i => i.category === catAtiva)
    return []
  }
  const itens = itensFiltrados()
  const semResultado = (busca.trim().length > 2 || catAtiva) && itens.length === 0
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050B16', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar nome={nome} tituloMobile="Suporte" />
      <div className="psb-main">
        <div className="pg">
          <div className="bdy">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.04em', marginBottom: 5 }}>Central de Ajuda</h1>
                <p style={{ fontSize: 13, color: '#64748B' }}>Tire dúvidas sobre o ClienteMarcado e encontre respostas rápidas.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.18)', borderRadius: 8, padding: '5px 10px', width: 'fit-content' }}>
                  <Clock size={12} style={{ color: '#60A5FA', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#93C5FD', fontWeight: 600 }}>Suporte humano: seg a sex, das 08h às 17h</span>
                </div>
              </div>
              <Link href="/painel" prefetch={false} style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.14)', borderRadius: 8 }}>← Voltar ao painel</Link>
            </div>
            {/* Assistente */}
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
                      padding: '7px 12px', fontSize: 12, color: '#CBD5E1', cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      {b.label}
                    </button>
                  ))}
                </div>
              )}
              {itens.length > 0 && !pergAtiva && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeIn .2s ease' }}>
                  {itens.map((item, i) => (
                    <button key={i} onClick={() => setPergAtiva(item)} style={{
                      background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.14)', borderRadius: 10,
                      padding: '10px 14px', fontSize: 13, color: '#CBD5E1', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    }}>
                      <span>
                        <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', marginRight: 6 }}>{item.category}</span>
                        {item.question}
                      </span>
                      <ChevronRight size={14} style={{ flexShrink: 0, opacity: .5 }} />
                    </button>
                  ))}
                </div>
              )}
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
              {semResultado && !pergAtiva && (
                <div style={{ marginTop: 16, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.20)', borderRadius: 14, padding: '14px 16px', animation: 'fadeIn .2s ease' }}>
                  <p style={{ fontSize: 13, color: '#FCD34D', marginBottom: 10 }}>Não encontrei uma resposta exata. Fale conosco pelo WhatsApp!</p>
                  <a href={linkWpp(busca)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,.14)', border: '1px solid rgba(34,197,94,.28)', color: '#4ADE80', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    <MessageCircle size={14} /> Falar com suporte
                  </a>
                </div>
              )}
            </div>
            {/* Categorias */}
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,.10)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 999, padding: '4px 12px', marginBottom: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA', letterSpacing: '.06em' }}>Autoatendimento</span>
                </div>
                <h2 style={{ fontSize: 'clamp(17px,2.5vw,22px)', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.2 }}>Resolva sua dúvida em poucos segundos</h2>
                <p style={{ fontSize: 'clamp(13px,1.5vw,15px)', color: '#94A3B8', lineHeight: 1.6 }}>Escolha uma categoria abaixo e veja respostas rápidas antes de falar com o suporte.</p>
              </div>
              <div className="cats-grid" style={{ marginBottom: 20 }}>
                {CATEGORIAS.map(cat => {
                  const c = CORES_CAT[cat]
                  const ativa = catAtiva === cat
                  return (
                    <button key={cat} onClick={() => { setCatAtiva(ativa ? null : cat); setBusca(''); setPergAtiva(null) }} style={{
                      background: ativa ? c.bg : 'rgba(15,23,42,.72)',
                      border: `1px solid ${ativa ? c.border : 'rgba(148,163,184,.14)'}`,
                      borderRadius: 12, padding: '14px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all .18s',
                    }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: c.iconBg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, color: c.text }}>
                        {CAT_ICONS[cat]}
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: ativa ? c.text : '#CBD5E1', lineHeight: 1.3 }}>{cat}</p>
                    </button>
                  )
                })}
              </div>
              {catAtiva && itens.length > 0 && !pergAtiva && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20, animation: 'fadeIn .2s ease' }}>
                  {itens.map((item, i) => (
                    <button key={i} onClick={() => setPergAtiva(item)} style={{
                      background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.14)', borderRadius: 10,
                      padding: '12px 16px', fontSize: 13, color: '#CBD5E1', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    }}>
                      {item.question}
                      <ChevronRight size={14} style={{ flexShrink: 0, opacity: .5 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Ainda não resolveu */}
            <div style={{ background: 'radial-gradient(circle at top left,rgba(34,197,94,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))', border: '1.5px solid rgba(34,197,94,.18)', borderRadius: 18, padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>Ainda não resolveu?</p>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 10 }}>Se a central de ajuda não responder sua dúvida, fale com o suporte pelo WhatsApp.</p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <Clock size={13} style={{ color: '#4ADE80', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600, marginBottom: 2 }}>Horário: seg a sex, das 08h às 17h</p>
                    <p style={{ fontSize: 11, color: '#475569' }}>Fora desse horário, sua mensagem será respondida no próximo período útil.</p>
                  </div>
                </div>
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
