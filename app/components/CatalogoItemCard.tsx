'use client'
import { useState, useRef } from 'react'
import { registrarEvento } from '../lib/analyticsClient'

// Card compacto do carrossel + modal de detalhes ao clicar. Client Component porque a
// pagina publica (app/[slug]/page.tsx) e Server Component e nao pode ter onClick/useState.
export default function CatalogoItemCard({
  item, iconeBorder, accent, secondary, btnText, text, textMuted, cardBg, perfilId,
}: {
  item: {
    id: string
    titulo: string
    descricao_curta?: string | null
    descricao_completa?: string | null
    preco?: number | null
    preco_exibicao?: string | null
    preco_texto_personalizado?: string | null
    imagem_url?: string | null
    botao_texto?: string | null
    tipo_destino?: string | null
    destino_url?: string | null
    whatsapp?: string | null
    mensagem_whatsapp?: string | null
    galeria?: { id: string; imagem_url: string; is_capa?: boolean }[]
  }
  iconeBorder: string
  accent: string
  secondary: string
  btnText: string
  text: string
  textMuted: string
  cardBg: string
  perfilId: string
}) {
  const [aberto, setAberto] = useState(false)
  const [imgComErro, setImgComErro] = useState(false)
  const [imagemAtivaIdx, setImagemAtivaIdx] = useState(0)
  const carrosselRef = useRef<HTMLDivElement>(null)

  // Galeria efetiva: usa a que vier do banco, ou sintetiza 1 imagem so a partir do campo de
  // sempre (imagem_url) - cobre 100% dos itens antigos, que nunca tiveram galeria cadastrada.
  const galeria = item.galeria && item.galeria.length > 0
    ? item.galeria
    : (item.imagem_url ? [{ id: 'legado', imagem_url: item.imagem_url }] : [])

  const fBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  // Decide o que aparece no lugar do preco: valor numerico (modo padrao "mostrar", tambem o
  // fallback de itens antigos que nunca tiveram esse campo preenchido), texto personalizado
  // (qualquer chamada livre - "Sob consulta", "Ouca agora", etc), ou nada.
  function infoPreco(): string | null {
    const modo = item.preco_exibicao || 'mostrar'
    if (modo === 'nao_mostrar') return null
    if (modo === 'texto_personalizado') return item.preco_texto_personalizado?.trim() || null
    return item.preco != null && item.preco !== undefined ? fBRL(item.preco) : null
  }

  function montarLinkWhatsapp(numero: string, titulo: string, mensagemCustomizada?: string | null) {
    const somenteDigitos = (numero || '').replace(/\D/g, '')
    const comDDI = somenteDigitos.startsWith('55') ? somenteDigitos : `55${somenteDigitos}`
    const padrao = `Olá! Quero saber mais sobre ${titulo}`
    // So respeita a mensagem customizada salva se ela genuinamente mencionar o titulo DESTE
    // item - protege contra o caso de mensagem_whatsapp ter sido copiada/duplicada de outro
    // item (ex: produtos criados um a partir do outro) e ter ficado com o titulo errado
    // "grudado" no texto salvo. Nesse caso, ignora o texto salvo e monta o padrao na hora,
    // sempre com o titulo do item que foi clicado agora.
    const customizadaValida = mensagemCustomizada?.trim() && titulo && mensagemCustomizada.includes(titulo)
    const textoBase = customizadaValida ? mensagemCustomizada!.trim() : padrao
    const mensagem = encodeURIComponent(textoBase)
    return `https://wa.me/${comDDI}?text=${mensagem}`
  }

  // Camada de seguranca extra: se o tipo for whatsapp mas o campo numero (item.whatsapp)
  // estiver vazio por algum motivo (ex: item salvo antes desta correcao), tenta extrair o
  // numero do proprio destino_url como fallback - nunca abre WhatsApp "vazio" se houver
  // qualquer numero identificavel em algum dos dois campos.
  // IMPORTANTE: links do tipo wa.me/message/CODIGO (WhatsApp Business, link "curto" sem
  // numero embutido de forma legivel) NUNCA tem numero extraivel de verdade - mesmo que o
  // codigo alfanumerico tenha digitos misturados, isso nao e um numero de telefone real.
  function resolverNumeroWhatsapp(): string {
    const destino = item.destino_url || ''
    if (/wa\.me\/message\//i.test(destino)) return ''
    if (item.whatsapp?.trim()) return item.whatsapp
    const doDestino = destino.match(/(?:wa\.me\/|phone=)(\d{8,15})/i)
    if (doDestino) return doDestino[1]
    const soDigitos = destino.replace(/\D/g, '')
    if (soDigitos.length >= 10 && soDigitos.length <= 13) return soDigitos
    return ''
  }

  function abrirDestino() {
    const numeroResolvido = item.tipo_destino === 'whatsapp' ? resolverNumeroWhatsapp() : ''
    const ehWhatsapp = item.tipo_destino === 'whatsapp' && !!numeroResolvido
    const linkWpp = ehWhatsapp ? montarLinkWhatsapp(numeroResolvido, item.titulo, item.mensagem_whatsapp) : null

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
          setImagemAtivaIdx(0)
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
          <p className="catalogo-card-preco" style={{ color: accent }}>{infoPreco() || ''}</p>
        </div>
      </button>

      {aberto && (
        <div
          onClick={() => setAberto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: cardBg, border: `1px solid ${iconeBorder}`, borderRadius: '20px', maxWidth: '420px', width: '100%', maxHeight: '86vh', overflowY: 'auto', position: 'relative' }}
          >
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar"
              style={{ position: 'absolute', top: '10px', right: '10px', width: '34px', height: '34px', borderRadius: '999px', background: 'rgba(0,0,0,.55)', border: '1.5px solid rgba(255,255,255,.4)', color: '#fff', fontSize: '16px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
            >
              ✕
            </button>
            {galeria.length > 0 && !imgComErro && (
              <>
                {/* Carrossel horizontal na imagem PRINCIPAL - mantem o mesmo object-fit:cover
                    e proporcao 1:1 que ja funcionavam bem (nao mexe nisso), so adiciona a
                    capacidade de arrastar/deslizar entre as fotos. scrollbar escondida via
                    classe dedicada (catalogo-carrossel-principal, CSS logo abaixo) - a
                    rolagem continua funcionando por baixo, so a barra visual some. */}
                <style>{`.catalogo-carrossel-principal::-webkit-scrollbar{display:none}
                  @media(max-width:600px){.catalogo-seta-carrossel{display:none}}`}</style>
                <div style={{ position: 'relative' }}>
                  <div
                    ref={carrosselRef}
                    className="catalogo-carrossel-principal"
                    onScroll={e => {
                      const el = e.currentTarget
                      const idx = Math.round(el.scrollLeft / el.clientWidth)
                      if (idx !== imagemAtivaIdx && idx >= 0 && idx < galeria.length) setImagemAtivaIdx(idx)
                    }}
                    style={{ display: 'flex', overflowX: galeria.length > 1 ? 'auto' : 'hidden', overflowY: 'hidden', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', width: '100%', borderRadius: '20px 20px 0 0', scrollbarWidth: 'none' }}
                  >
                    {galeria.map((img, idx) => (
                      <div key={img.id} style={{ flex: '0 0 100%', width: '100%', minWidth: '100%', aspectRatio: '1/1', background: cardBg, overflow: 'hidden', scrollSnapAlign: 'center' }}>
                        <img
                          src={img.imagem_url}
                          alt={item.titulo}
                          loading={idx === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                          onError={() => idx === imagemAtivaIdx && setImgComErro(true)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', display: 'block' }}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Setas discretas - so no desktop (escondidas via CSS em telas touch/pequenas),
                      atalho extra alem do arrastar/deslizar direto na imagem. */}
                  {galeria.length > 1 && (
                    <>
                      {imagemAtivaIdx > 0 && (
                        <button
                          type="button"
                          aria-label="Imagem anterior"
                          onClick={() => {
                            const novoIdx = imagemAtivaIdx - 1
                            setImagemAtivaIdx(novoIdx)
                            carrosselRef.current?.scrollTo({ left: novoIdx * carrosselRef.current.clientWidth, behavior: 'smooth' })
                          }}
                          className="catalogo-seta-carrossel"
                          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '999px', background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}
                        >‹</button>
                      )}
                      {imagemAtivaIdx < galeria.length - 1 && (
                        <button
                          type="button"
                          aria-label="Próxima imagem"
                          onClick={() => {
                            const novoIdx = imagemAtivaIdx + 1
                            setImagemAtivaIdx(novoIdx)
                            carrosselRef.current?.scrollTo({ left: novoIdx * carrosselRef.current.clientWidth, behavior: 'smooth' })
                          }}
                          className="catalogo-seta-carrossel"
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '999px', background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}
                        >›</button>
                      )}
                    </>
                  )}
                </div>

                {galeria.length > 1 && (
                  <div style={{ width: '100%', maxWidth: '100%', display: 'flex', flexWrap: 'nowrap', gap: '8px', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', padding: '12px 20px 8px' }}>
                    {galeria.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => {
                          setImagemAtivaIdx(idx)
                          carrosselRef.current?.scrollTo({ left: idx * carrosselRef.current.clientWidth, behavior: 'smooth' })
                        }}
                        style={{ flex: '0 0 auto', width: '64px', minWidth: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', padding: 0, cursor: 'pointer', border: idx === imagemAtivaIdx ? `2px solid ${accent}` : `1px solid ${iconeBorder}`, opacity: idx === imagemAtivaIdx ? 1 : 0.6 }}
                      >
                        <img src={img.imagem_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '17px', fontWeight: 800, color: text, marginBottom: '8px' }}>{item.titulo}</p>
              {(item.descricao_completa || item.descricao_curta) && (
                <div style={{ maxHeight: '160px', overflowY: 'auto', marginBottom: '12px' }}>
                  <p style={{ fontSize: '13px', color: textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.descricao_completa || item.descricao_curta}</p>
                </div>
              )}
              {infoPreco() && (
                <p style={{ fontSize: '18px', fontWeight: 800, color: accent, marginBottom: '16px' }}>{infoPreco()}</p>
              )}
              <button
                type="button"
                onClick={abrirDestino}
                style={{ width: '100%', background: `linear-gradient(135deg,${accent},${secondary})`, color: btnText, border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px', boxShadow: `0 8px 20px ${accent}40` }}
              >
                {item.botao_texto || (item.tipo_destino === 'whatsapp' ? 'Chamar no WhatsApp' : item.tipo_destino === 'instagram' ? 'Ver no Instagram' : 'Ver mais')}
              </button>
              <button
                type="button"
                onClick={() => setAberto(false)}
                style={{ width: '100%', background: 'transparent', color: text, border: `1px solid ${iconeBorder}`, borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: '8px' }}
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
