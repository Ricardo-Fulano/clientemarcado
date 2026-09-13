'use client'
import type { ReactNode } from 'react'

// Card visual compartilhado: miniatura da MiniPage com as cores REAIS de um tema
// (fundo, avatar, barras simulando nome/bio, botoes). Usado tanto no onboarding
// (/painel/criar-minipage) quanto em /painel/perfil/aparencia, para os 2 lugares
// mostrarem exatamente a mesma prevdefinicao visual de cada modelo - sem duplicar
// a logica de desenho do card em 2 arquivos diferentes.
//
// NAO define nem altera valores de tema - so DESENHA a partir das cores (p, s) e
// nome que ja vem de fora (TEMAS_MINIPAGE), que continua sendo a unica fonte de
// verdade dos 18 modelos.

type TemaPreview = { id: string; nome: string; p: string; s: string }

export default function ThemePreviewCard({
  tema,
  selecionado,
  onClick,
  bloqueado = false,
  badge,
}: {
  tema: TemaPreview
  selecionado: boolean
  onClick: () => void
  bloqueado?: boolean
  badge?: ReactNode
}) {
  return (
    <button
      onClick={() => { if (!bloqueado) onClick() }}
      style={{
        textAlign: 'left',
        cursor: bloqueado ? 'not-allowed' : 'pointer',
        opacity: bloqueado ? 0.45 : 1,
        border: selecionado ? '2px solid #EC4899' : '1px solid #2A1A2F',
        borderRadius: '14px',
        padding: 0,
        overflow: 'hidden',
        background: '#0B080D',
        fontFamily: 'inherit',
        position: 'relative',
      }}
    >
      {badge && <div style={{ position: 'absolute', top: '6px', right: '6px', zIndex: 1 }}>{badge}</div>}
      <div style={{ background: `linear-gradient(160deg,${tema.p}22,#0B080D 55%)`, padding: '14px 10px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '999px', background: `linear-gradient(135deg,${tema.p},${tema.s})`, marginBottom: '6px', border: '1.5px solid rgba(255,255,255,.25)' }} />
        <div style={{ width: '54%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,.55)', marginBottom: '4px' }} />
        <div style={{ width: '70%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,.22)', marginBottom: '8px' }} />
        <div style={{ width: '85%', height: '10px', borderRadius: '5px', background: tema.p, marginBottom: '4px' }} />
        <div style={{ width: '85%', height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,.10)' }} />
      </div>
      <div style={{ padding: '7px 8px', background: '#120A14' }}>
        <p style={{ fontSize: '10.5px', fontWeight: 700, color: '#F8F4F7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tema.nome}</p>
      </div>
    </button>
  )
}
