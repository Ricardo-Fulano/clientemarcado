// Meta Pixel + Google Analytics 4 na pagina publica da MiniPage.
// Este modulo concentra: (1) validacao dos IDs, (2) consentimento POR MINIPAGE, (3) textos do aviso (pt/en/es) e
// (4) a "ponte" que repassa os eventos que a pagina JA registra para os pixels - so se eles tiverem sido carregados.
// Nada aqui carrega script: quem carrega (e so depois do "Aceitar") e o componente PixelsPublicos.

// Formatos aceitos. O banco tem CHECK com exatamente a mesma regra (defesa em duas camadas).
export const REGEX_META_PIXEL = /^[0-9]{10,20}$/
export const REGEX_GA4 = /^G-[A-Z0-9]{6,12}$/
export const ehMetaPixelIdValido = (v: unknown): v is string => typeof v === 'string' && REGEX_META_PIXEL.test(v)
export const ehGa4IdValido = (v: unknown): v is string => typeof v === 'string' && REGEX_GA4.test(v)
// Entrada digitada no painel: so tira espacos nas pontas (e poe o GA4 em maiuscula). Nao "conserta" mais nada.
export const normalizarMetaPixelId = (v: string) => v.trim()
export const normalizarGa4Id = (v: string) => v.trim().toUpperCase()

// ---------------- Consentimento (por MiniPage, nunca global no dominio) ----------------
export type Decisao = 'aceito' | 'recusado'
export const chaveConsentimento = (slug: string) => `minipage_consent_${slug}`
export function lerConsentimento(slug: string): Decisao | null {
  try {
    const v = window.localStorage.getItem(chaveConsentimento(slug))
    return v === 'aceito' || v === 'recusado' ? v : null
  } catch { return null }
}
export function salvarConsentimento(slug: string, decisao: Decisao) {
  try { window.localStorage.setItem(chaveConsentimento(slug), decisao) } catch { /* navegacao privada: vale so nesta visita */ }
}

export type IdiomaConsentimento = 'pt' | 'en' | 'es'
export const TEXTOS_CONSENTIMENTO: Record<IdiomaConsentimento, { aviso: string; aceitar: string; recusar: string }> = {
  pt: { aviso: 'Esta página utiliza ferramentas de análise e marketing para medir acessos e interações. Você pode aceitar ou recusar esse rastreamento.', recusar: 'Recusar', aceitar: 'Aceitar' },
  en: { aviso: 'This page uses analytics and marketing tools to measure visits and interactions. You can accept or decline this tracking.', recusar: 'Decline', aceitar: 'Accept' },
  es: { aviso: 'Esta página utiliza herramientas de análisis y marketing para medir visitas e interacciones. Puedes aceptar o rechazar este rastreo.', recusar: 'Rechazar', aceitar: 'Aceptar' },
}
export const textosConsentimento = (idioma?: string | null) => TEXTOS_CONSENTIMENTO[(idioma as IdiomaConsentimento)] || TEXTOS_CONSENTIMENTO.pt

// ---------------- Ponte de eventos ----------------
// Eventos internos -> evento do Meta (standard = 'track', custom = 'trackCustom') e do GA4. `agendar_click` fica de fora de proposito.
const MAPA: Record<string, { meta: string; padrao: boolean; ga: string }> = {
  link_rapido_click: { meta: 'ClickLink', padrao: false, ga: 'click_link' },
  social_click: { meta: 'ClickSocial', padrao: false, ga: 'click_social' },
  destaque_click: { meta: 'ClickDestaque', padrao: false, ga: 'click_destaque' },
  video_click: { meta: 'ClickVideo', padrao: false, ga: 'click_video' },
  whatsapp_click: { meta: 'Contact', padrao: true, ga: 'click_whatsapp' },
  catalogo_click: { meta: 'ViewContent', padrao: true, ga: 'select_item' },
  lead: { meta: 'Lead', padrao: true, ga: 'generate_lead' },
}
type Janela = Window & { fbq?: (...args: unknown[]) => void; gtag?: (...args: unknown[]) => void }

// Chamada segura: se os pixels NAO foram carregados (sem ID, sem aceite ou recusado), nao faz nada. Nunca lanca erro.
// Nao envia e-mail, telefone, URL de destino nem nada do visitante: so o nome (ate 100 caracteres) do item clicado, que e conteudo do dono da pagina.
export function dispararPixels(tipoEvento: string, opcoes?: { titulo?: string | null; acao?: string | null }) {
  if (typeof window === 'undefined') return
  const m = MAPA[tipoEvento]
  if (!m) return
  // 1 produto = 1 ViewContent: o segundo catalogo_click do mesmo produto (botao principal) nao e repassado ao pixel.
  if (tipoEvento === 'catalogo_click' && opcoes?.acao === 'botao_principal') return
  const w = window as Janela
  const nome = opcoes?.titulo ? String(opcoes.titulo).slice(0, 100) : ''
  try {
    if (typeof w.fbq === 'function') w.fbq(m.padrao ? 'track' : 'trackCustom', m.meta, nome ? { content_name: nome } : {})
  } catch { /* o pixel nunca pode quebrar a pagina */ }
  try {
    if (typeof w.gtag === 'function') {
      const params = tipoEvento === 'catalogo_click'
        ? { item_list_name: 'catalogo', items: nome ? [{ item_name: nome }] : [] }
        : tipoEvento === 'lead' ? {} : nome ? { content_name: nome } : {}
      w.gtag('event', m.ga, params)
    }
  } catch { /* idem */ }
}
