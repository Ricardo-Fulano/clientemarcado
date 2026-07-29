'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { supabase } from '../lib/supabase'

type Notificacao = {
  id: string
  tipo: string
  titulo: string
  mensagem: string
  link: string | null
  lida: boolean
  created_at: string
}

function tempoRelativo(iso: string) {
  const agora = new Date()
  const data = new Date(iso)
  const diffMs = agora.getTime() - data.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `há ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `há ${diffD}d`
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function NotificacoesSino({ alinhamento = 'right' }: { alinhamento?: 'left' | 'right' }) {
  const [aberto, setAberto] = useState(false)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function carregar() {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return
    try {
      const res = await fetch('/api/notificacoes', { headers: { Authorization: 'Bearer ' + token } })
      const data = await res.json()
      if (res.ok) {
        setNotificacoes(data.notificacoes || [])
        setNaoLidas(data.naoLidas || 0)
      }
    } catch (e) { console.warn('Erro ao carregar notificacoes:', e) }
  }

  useEffect(() => {
    carregar()
    const intervalo = setInterval(carregar, 60000) // atualiza a cada 1 min
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    function fecharSeClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fecharSeClicarFora)
    return () => document.removeEventListener('mousedown', fecharSeClicarFora)
  }, [])

  async function marcarLida(id: string) {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    setNaoLidas(prev => Math.max(0, prev - 1))
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return
    try {
      await fetch('/api/notificacoes/marcar-lida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ id }),
      })
    } catch (e) { console.warn('Erro ao marcar como lida:', e) }
  }

  async function marcarTodasLidas() {
    setLoading(true)
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
    setNaoLidas(0)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (token) {
      try {
        await fetch('/api/notificacoes/marcar-todas-lidas', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
        })
      } catch (e) { console.warn('Erro ao marcar todas como lidas:', e) }
    }
    setLoading(false)
  }

  function abrirNotificacao(n: Notificacao) {
    if (!n.lida) marcarLida(n.id)
    if (n.link) window.location.href = n.link
    setAberto(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setAberto(a => !a)}
        aria-label="Notificações"
        style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(24,16,27,.85)', border: '1px solid #2A1A2F', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8AAB8' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {naoLidas > 0 && (
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', minWidth: '17px', height: '17px', padding: '0 4px', borderRadius: '999px', background: 'linear-gradient(135deg,#EC4899,#D946EF)', color: '#fff', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #08060A' }}>
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div style={{ position: 'absolute', top: '46px', [alinhamento]: 0, width: '340px', maxWidth: '90vw', maxHeight: '440px', overflowY: 'auto', background: '#18101B', border: '1.5px solid #2A1A2F', borderRadius: '16px', boxShadow: '0 20px 48px rgba(0,0,0,.45)', zIndex: 200 } as CSSProperties}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #2A1A2F', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#18101B', zIndex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7' }}>Notificações</p>
            {naoLidas > 0 && (
              <button onClick={marcarTodasLidas} disabled={loading} style={{ background: 'none', border: 'none', color: '#EC4899', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notificacoes.length === 0 && (
            <p style={{ padding: '28px 16px', textAlign: 'center' as const, fontSize: '13px', color: '#B8AAB8' }}>Nenhuma notificação por enquanto.</p>
          )}

          {notificacoes.length > 0 && naoLidas === 0 && (
            <p style={{ padding: '10px 16px', textAlign: 'center' as const, fontSize: '12px', color: '#B8AAB8', borderBottom: '1px solid #2A1A2F' }}>Você está em dia. ✓</p>
          )}

          {notificacoes.map(n => (
            <div
              key={n.id}
              onClick={() => abrirNotificacao(n)}
              style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', cursor: 'pointer', background: n.lida ? 'transparent' : 'rgba(236,72,153,.05)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}
            >
              {!n.lida && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EC4899', flexShrink: 0, marginTop: '5px' }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: n.lida ? 500 : 700, color: '#F8F4F7', marginBottom: '2px' }}>{n.titulo}</p>
                <p style={{ fontSize: '12px', color: '#B8AAB8', lineHeight: 1.4, marginBottom: '3px' }}>{n.mensagem}</p>
                <p style={{ fontSize: '11px', color: '#8B7A8B' }}>{tempoRelativo(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
