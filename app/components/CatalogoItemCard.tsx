'use client'
import { useState } from 'react'
import { registrarEvento } from '../lib/analyticsClient'

// Card compacto do carrossel + modal de detalhes ao clicar. Client Component porque a
// pagina publica (app/[slug]/page.tsx) e Server Component e nao pode ter onClick/useState.
export default function CatalogoItemCard({
  item, iconeBorder, accent, text, textMuted, cardBg, perfilId,
}: {
  item: {
    id: string
    titulo: string
    descricao_curta?: string | null
    descricao_completa?: string | null
    preco?: number | null
    imagem_url?: string | null
    botao_texto?: string | null
    tipo_destino?: string | null
    destino_url?: string | null
    whatsapp?: string | null
    mensagem_whatsapp?: string | null
  }
  iconeBorder: string
  accent: string
  text: string
  textMuted: string
  cardBg: string
  perfilId: string
}) {
  const [aberto, setAberto] = useState(false)
  const [imgComErro, setImgComErro] = useState(false)

  const fBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  function montarLinkWhatsapp(numero: string, titulo: string, mensagemCustomizada?: string | null) {
    const somenteDigitos = (numero || '').replace(/\D/g, '')
    const comDDI = somenteDigitos.startsWith('55') ? somenteDigitos : `55${somenteDigitos}`
    const textoBase = mensagemCustomizada?.trim() || `Olá! Quero saber mais sobre: ${titulo}`
    const mensagem = encodeURIComponent(textoBase)
    return `https://wa.me/${comDDI}?text=${mensagem}`
  }

  function abrirDestino() {
    const ehWhatsapp = item.tipo_destino === 'whatsapp' && !!item.whatsapp
    const linkWpp = ehWhatsapp ? montarLinkWhatsapp(item.whatsapp!, item.titulo, item.mensagem_whatsapp) : null

    // 1 catalogo_click sempre, representando o clique no botao principal do item.
    registrarEvento({
      perfil_id: perfilId,
      tipo_evento: 'catalogo_click',
      item_id: item.id,
      item_titulo: item.titulo,
      item_url: ehWhatsapp ? (linkWpp || undefined) : (item.destino_url || undefined),
      origem: 'pagina_publica',
      metadata: { acao: 'botao_principal', preco: item.preco ?? null, tipo_destino: item.tipo_destino || null },
    })

    if (ehWhatsapp && linkWpp) {
      // Evento ADICIONAL especifico de WhatsApp - nao substitui o catalogo_click acima,
      // soma a ele (permite medir cliques gerais no catalogo E cliques especificos no WhatsApp).
      registrarEvento({
        perfil_id: perfilId,
        tipo_evento: 'whatsapp_click',
        item_id: item.id,
        item_titulo: item.titulo,
        item_url: linkWpp,
        origem: 'catalogo',
        metadata: { acao: 'whatsapp_catalogo', preco: item.preco ?? null, tipo_destino: 'whatsapp' },
      })
      window.open(linkWpp, '_blank')
      return
    }
    if (item.destino_url) {
      window.open(item.destino_url, '_blank')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setAberto(true)
          registrarEvento({
            perfil_id: perfilId,
            tipo_evento: 'catalogo_click',
            item_id: item.id,
            item_titulo: item.titulo,
            item_url: item.destino_url || undefined,
            origem: 'pagina_publica',
            metadata: { acao: 'abrir_card', preco: item.preco ?? null, tipo_destino: item.tipo_destino || null },
          })
        }}
        className="catalogo-card"
        style={{ border: `1px solid ${iconeBorder}`, background: cardBg, textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', padding: 0, flexShrink: 0 }}
      >
        <div className="catalogo-card-img">
          {item.imagem_url && !imgComErro ? (
            <img src={item.imagem_url} alt={item.titulo} loading="lazy" decoding="async" onError={() => setImgComErro(true)} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textMuted, fontSize: '11px' }}>Sem imagem</div>
          )}
        </div>
        <div style={{ padding: '10px 12px' }}>
          <p className="catalogo-card-titulo" style={{ color: text }}>{item.titulo}</p>
          {item.descricao_curta && <p className="catalogo-card-desc" style={{ color: textMuted }}>{item.descricao_curta}</p>}
          {item.preco != null && item.preco !== undefined && (
            <p style={{ fontSize: '12px', fontWeight: 800, color: accent, marginTop: '4px' }}>{fBRL(item.preco)}</p>
          )}
        </div>
      </button>

      {aberto && (
        <div
          onClick={() => setAberto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: cardBg, border: `1px solid ${iconeBorder}`, borderRadius: '20px', maxWidth: '420px', width: '100%', maxHeight: '86vh', overflowY: 'auto' }}
          >
            {item.imagem_url && !imgComErro && (
              <img src={item.imagem_url} alt={item.titulo} loading="lazy" decoding="async" onError={() => setImgComErro(true)} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', objectPosition: 'center center', borderRadius: '20px 20px 0 0', display: 'block' }} />
            )}
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '17px', fontWeight: 800, color: text, marginBottom: '8px' }}>{item.titulo}</p>
              {item.descricao_completa && <p style={{ fontSize: '13px', color: textMuted, lineHeight: 1.6, marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{item.descricao_completa}</p>}
              {item.preco != null && item.preco !== undefined && (
                <p style={{ fontSize: '18px', fontWeight: 800, color: accent, marginBottom: '16px' }}>{fBRL(item.preco)}</p>
              )}
              <button
                type="button"
                onClick={abrirDestino}
                style={{ width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' }}
              >
                {item.botao_texto || 'Ver mais'}
              </button>
              <button
                type="button"
                onClick={() => setAberto(false)}
                style={{ width: '100%', background: 'transparent', color: textMuted, border: 'none', padding: '10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
