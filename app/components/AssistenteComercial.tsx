'use client'
import { useState, useRef, useEffect } from 'react'
import { X, MessageCircle, Send, ChevronRight } from 'lucide-react'

const COMERCIAL_WHATSAPP = '5511999999999'
const CHECKOUT_URL = '/assinar'

const RESPOSTAS: Record<string, string> = {
  'como-funciona': 'O ClienteMarcado é um painel simples para negócios organizarem agenda, clientes, serviços, orçamentos, cobranças e pagamentos. Você também recebe uma página pública para seus clientes agendarem online.',
  'quanto-custa': 'O plano ClienteMarcado custa R$ 79,90 por mês após o período grátis. Você pode começar com 7 dias grátis e cancelar quando quiser.',
  'fidelidade': 'Não. O ClienteMarcado não tem fidelidade. Você pode cancelar quando quiser, sem multa ou prazo mínimo.',
  'dias-gratis': 'Você começa usando o sistema por 7 dias grátis, sem precisar de cartão. Depois desse período, a mensalidade passa a ser R$ 79,90 por mês.',
  'meu-negocio': 'O ClienteMarcado foi pensado para barbearias, salões, estética, clínicas, consultórios, odontologia, profissionais autônomos e pequenos negócios que trabalham com horário marcado.',
  'app': 'Não. O ClienteMarcado funciona pelo navegador, no celular, tablet ou computador. Você e seus clientes acessam por um link, sem instalar nada.',
  'clientes-app': 'Não. Seus clientes acessam sua página pública por um link e fazem o agendamento pelo navegador, sem precisar baixar nenhum aplicativo.',
  'whatsapp': 'Sim. O sistema facilita o contato pelo WhatsApp, permite copiar confirmação, abrir conversa com o cliente e organizar melhor os atendimentos.',
  'incluso': 'O plano inclui agenda online, página pública de agendamento, cadastro de clientes, serviços, profissionais, orçamentos, cobranças, pagamentos, relatórios simples e mensagens prontas para WhatsApp.',
  'mensagem-automatica': 'Nesta versão, o ClienteMarcado trabalha com botões e mensagens prontas para WhatsApp, sem automação avançada por API. Isso deixa o sistema mais simples, seguro e acessível.',
  'como-comecar': 'Clique em "Começar 7 dias grátis", crie sua conta e configure seu negócio. Depois você poderá cadastrar serviços, horários, profissionais e compartilhar sua página de agendamento.',
}

const KEYWORDS: Array<{ key: string; words: string[] }> = [
  { key: 'como-funciona', words: ['funciona', 'como funciona', 'o que é', 'sistema', 'painel'] },
  { key: 'quanto-custa', words: ['custa', 'preço', 'valor', 'mensalidade', 'plano', 'cobrado'] },
  { key: 'fidelidade', words: ['fidelidade', 'contrato', 'cancelar', 'cancelamento', 'prazo'] },
  { key: 'dias-gratis', words: ['grátis', 'gratis', '7 dias', 'free', 'teste', 'trial'] },
  { key: 'meu-negocio', words: ['meu negócio', 'negocio', 'barbearia', 'salão', 'clinica', 'serve', 'segmento'] },
  { key: 'app', words: ['aplicativo', 'app', 'baixar', 'instalar', 'celular', 'mobile'] },
  { key: 'whatsapp', words: ['whatsapp', 'zap', 'mensagem', 'contato'] },
  { key: 'incluso', words: ['incluso', 'incluído', 'funcionalidades', 'recursos', 'tem no plano'] },
  { key: 'como-comecar', words: ['começar', 'comecar', 'iniciar', 'cadastro', 'criar conta'] },
]

const BOTOES_RAPIDOS = [
  { id: 'como-funciona', label: 'Como funciona?' },
  { id: 'quanto-custa', label: 'Quanto custa?' },
  { id: 'fidelidade', label: 'Tem fidelidade?' },
  { id: 'meu-negocio', label: 'Serve para meu negócio?' },
  { id: 'incluso', label: 'O que está incluso?' },
  { id: 'dias-gratis', label: 'Como são os 7 dias grátis?' },
  { id: 'app', label: 'Precisa baixar app?' },
  { id: 'como-comecar', label: 'Como começar?' },
]

function buscarResposta(texto: string): string | null {
  const lower = texto.toLowerCase()
  for (const item of KEYWORDS) {
    if (item.words.some(w => lower.includes(w))) {
      return RESPOSTAS[item.key]
    }
  }
  return null
}

export default function AssistenteComercial() {
  const [aberto, setAberto] = useState(false)
  const [resposta, setResposta] = useState('')
  const [perguntaAtiva, setPerguntaAtiva] = useState('')
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (aberto && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [aberto])

  function responder(id: string, label: string) {
    setPerguntaAtiva(id)
    setResposta(RESPOSTAS[id] || '')
    setInput('')
  }

  function enviarInput() {
    const txt = input.trim()
    if (!txt) return
    const res = buscarResposta(txt)
    if (res) {
      setPerguntaAtiva('custom')
      setResposta(res)
    } else {
      setPerguntaAtiva('nao-encontrado')
      setResposta('')
    }
    setInput('')
  }

  const linkWpp = `https://wa.me/${COMERCIAL_WHATSAPP}?text=${encodeURIComponent('Olá! Tenho uma dúvida sobre o ClienteMarcado.')}`

  return (
    <>
      {/* Botão flutuante */}
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg,#3B82F6,#7C3AED)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 999,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(59,130,246,.35), 0 0 0 1px rgba(255,255,255,.08)',
            fontFamily: 'inherit',
            transition: 'transform .18s, box-shadow .18s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <MessageCircle size={18} />
          <span>Tirar dúvidas</span>
        </button>
      )}

      {/* Chat */}
      {aberto && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9001,
          width: 'min(420px, calc(100vw - 32px))',
          maxHeight: 'min(580px, 80vh)',
          background: 'linear-gradient(145deg,rgba(15,23,42,.99),rgba(7,17,31,.99))',
          border: '1.5px solid rgba(148,163,184,.18)',
          borderRadius: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        }}>
          {/* Header */}
          <div style={{
            padding: '18px 20px 14px',
            background: 'linear-gradient(135deg,rgba(59,130,246,.15),rgba(124,58,237,.12))',
            borderBottom: '1px solid rgba(148,163,184,.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3B82F6,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,.4)' }}>
                <MessageCircle size={16} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>Assistente ClienteMarcado</p>
                <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>Tire dúvidas antes de começar</p>
              </div>
            </div>
            <button onClick={() => { setAberto(false); setPerguntaAtiva(''); setResposta('') }} style={{ background: 'rgba(148,163,184,.12)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>

          {/* Corpo */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 12px' }}>
            {/* Mensagem inicial */}
            <div style={{ background: 'rgba(59,130,246,.10)', border: '1px solid rgba(59,130,246,.20)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                Olá! Posso te ajudar a entender se o ClienteMarcado serve para o seu negócio, como funcionam os <strong style={{ color: '#93C5FD' }}>7 dias grátis</strong> e o que está incluso no plano.
              </p>
            </div>

            {/* Resposta */}
            {resposta && (
              <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.20)', borderRadius: 14, padding: '12px 14px', marginBottom: 14, animation: 'fadeIn .2s ease' }}>
                <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>{resposta}</p>
              </div>
            )}
            {perguntaAtiva === 'nao-encontrado' && !resposta && (
              <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.20)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 13, color: '#FCD34D', lineHeight: 1.6, margin: 0 }}>Não encontrei uma resposta exata. Fale conosco pelo WhatsApp!</p>
              </div>
            )}

            {/* Botões rápidos */}
            <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Dúvidas frequentes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {BOTOES_RAPIDOS.map(b => (
                <button key={b.id} onClick={() => responder(b.id, b.label)} style={{
                  background: perguntaAtiva === b.id ? 'rgba(59,130,246,.16)' : 'rgba(15,23,42,.72)',
                  border: `1px solid ${perguntaAtiva === b.id ? 'rgba(59,130,246,.40)' : 'rgba(148,163,184,.14)'}`,
                  borderRadius: 10,
                  padding: '9px 12px',
                  fontSize: 13,
                  color: perguntaAtiva === b.id ? '#93C5FD' : '#CBD5E1',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: perguntaAtiva === b.id ? 700 : 400,
                  transition: 'all .15s',
                }}>
                  {b.label}
                  <ChevronRight size={14} style={{ opacity: .5, flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(148,163,184,.10)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarInput()}
                placeholder="Digite sua dúvida..."
                style={{
                  flex: 1,
                  background: 'rgba(15,23,42,.88)',
                  border: '1px solid rgba(148,163,184,.18)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  fontSize: 13,
                  color: '#F8FAFC',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button onClick={enviarInput} style={{
                background: 'linear-gradient(135deg,#3B82F6,#7C3AED)',
                border: 'none',
                borderRadius: 10,
                padding: '0 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Send size={15} color="#fff" />
              </button>
            </div>
            {/* CTAs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <a href={CHECKOUT_URL} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg,#3B82F6,#7C3AED)',
                color: '#fff', borderRadius: 10, padding: '9px 8px',
                fontSize: 12, fontWeight: 800, textDecoration: 'none', textAlign: 'center',
                boxShadow: '0 4px 16px rgba(59,130,246,.28)',
              }}>
                Começar grátis →
              </a>
              <a href={linkWpp} target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: 'rgba(34,197,94,.12)',
                border: '1px solid rgba(34,197,94,.25)',
                color: '#4ADE80', borderRadius: 10, padding: '9px 8px',
                fontSize: 12, fontWeight: 700, textDecoration: 'none',
              }}>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </>
  )
}
