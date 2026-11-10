// Fixtures das PREVIAS (YouTube, Spotify, TikTok, paginas genericas, Shopee, Mercado Livre, eventos). Compartilhadas pelo golden (rota ORIGINAL com fetch simulado) e pelos testes da rota nova.
const html = (cabeca, corpo = '') => `<!doctype html><html><head><meta charset="utf-8">${cabeca}</head><body>${corpo}</body></html>`
const PRODUTO_JSONLD = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: 'Camiseta Azul &amp; Branca', image: ['https://cdn.exemplo.com.br/p/1.jpg', 'https://cdn.exemplo.com.br/p/2.jpg', 'https://cdn.exemplo.com.br/p/1.jpg'] })
const EVENTO_JSONLD = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Event', name: 'Show de Verao 2026', image: 'https://cdn.exemplo.com/evento.jpg' })
export const PAGINAS = {
  'loja.exemplo.com.br': html(`<title>Loja Exemplo</title><meta property="og:title" content="Camiseta Azul"><meta property="og:description" content="Algod&atilde;o 100% &amp; confort&aacute;vel"><meta property="og:image" content="https://cdn.exemplo.com.br/og.jpg"><script type="application/ld+json">${PRODUTO_JSONLD}</script>`),
  'blog.exemplo.com': html('<title>Meu Post de Blog</title>'),
  'vazio.exemplo.com': html(''),
  'produto.mercadolivre.com.br': html('<title>Camiseta | Mercado Livre</title><meta property="og:title" content="Camiseta Azul - Mercado Livre"><meta property="og:image" content="https://http2.mlstatic.com/D_NQ_NP_123-F.jpg"><meta name="description" content="Frete gratis">'),
  'eventos.exemplo.com': html(`<title>Show</title><meta property="og:title" content="Show de Verao"><script type="application/ld+json">${EVENTO_JSONLD}</script>`),
  'antigo.exemplo.com': html('<title>Produto Antigo</title><meta property="og:image" content="/img/antigo.png">'),
  'pay.kiwify.com.br': html(''),
}
export const OEMBED = {
  youtube: { dQw4w9WgXcQ: { title: 'Video de Teste', author_name: 'Canal Teste', thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' }, abc123DEF45: { title: 'Short de Teste', thumbnail_url: 'https://i.ytimg.com/vi/abc123DEF45/hqdefault.jpg' } },
  tiktok: { '7234567890123456789': { title: 'Dancinha', author_name: 'usuario', thumbnail_url: 'https://p16.tiktokcdn.com/obj/t.jpg' } },
  spotify: { '4uLU6hMCjMI75M1A2tKUQC': { title: 'Musica de Teste', thumbnail_url: 'https://i.scdn.co/image/abc' } },
}
/** Resposta simulada para uma URL de busca externa. Lanca para simular falha de rede. */
export function responder(url) {
  const u = new URL(url)
  const alvo = u.searchParams.get('url') || ''
  if (u.hostname === 'www.youtube.com' && u.pathname === '/oembed') { const id = (alvo.match(/(?:v=|shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/) || [])[1]; const d = OEMBED.youtube[id]; return d ? { status: 200, tipo: 'json', corpo: d } : { status: 404, tipo: 'json', corpo: { error: 'nao encontrado' } } }
  if (u.hostname === 'www.tiktok.com' && u.pathname === '/oembed') { const id = (alvo.match(/video\/(\d+)/) || [])[1]; const d = OEMBED.tiktok[id]; return d ? { status: 200, tipo: 'json', corpo: d } : { status: 400, tipo: 'json', corpo: {} } }
  if (u.hostname === 'open.spotify.com' && u.pathname === '/oembed') { const id = (alvo.match(/(?:track|album|episode|playlist|show)\/([A-Za-z0-9]+)/) || [])[1]; const d = OEMBED.spotify[id]; return d ? { status: 200, tipo: 'json', corpo: d } : { status: 404, tipo: 'json', corpo: {} } }
  if (u.hostname === 'shopee.com.br') return { status: 403, tipo: 'html', corpo: 'Forbidden' }
  if (u.hostname === 'grande.exemplo.com') return { status: 200, tipo: 'html', corpo: PAGINAS['loja.exemplo.com.br'], limite: true } // simula resposta ACIMA DO LIMITE (o fetcher devolve ok:false)
  if (u.hostname === 'erro.exemplo.com') return { status: 500, tipo: 'html', corpo: 'erro' }
  if (u.hostname === 'rede-fora.exemplo.com') throw new Error('falha de rede simulada')
  if (PAGINAS[u.hostname]) return { status: 200, tipo: 'html', corpo: PAGINAS[u.hostname] }
  return { status: 404, tipo: 'html', corpo: 'nao mapeado' }
}
export const CASOS = [
  { id: 'youtube-watch', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, { id: 'youtube-shorts', url: 'https://www.youtube.com/shorts/abc123DEF45' }, { id: 'youtu-be', url: 'https://youtu.be/dQw4w9WgXcQ?t=10' },
  { id: 'youtube-oembed-404', url: 'https://www.youtube.com/watch?v=naoexiste01' }, { id: 'tiktok-video', url: 'https://www.tiktok.com/@usuario/video/7234567890123456789' }, { id: 'tiktok-perfil', url: 'https://www.tiktok.com/@usuario' },
  { id: 'spotify-track', url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC' }, { id: 'spotify-404', url: 'https://open.spotify.com/album/naoexiste' },
  { id: 'generico-og-jsonld', url: 'https://loja.exemplo.com.br/produto/camiseta-azul?utm_source=x&fbclid=1' }, { id: 'generico-so-title', url: 'https://blog.exemplo.com/post' }, { id: 'generico-sem-meta', url: 'https://vazio.exemplo.com/' },
  { id: 'shopee-403', url: 'https://shopee.com.br/Camiseta-Azul-Masculina-i.123.456' }, { id: 'mercadolivre-200', url: 'https://produto.mercadolivre.com.br/MLB-123456-camiseta-_JM' },
  { id: 'evento-jsonld', url: 'https://eventos.exemplo.com/show-2026', tipo: 'evento' }, { id: 'erro-500', url: 'https://erro.exemplo.com/x' }, { id: 'rede-falha', url: 'https://rede-fora.exemplo.com/x' },
  { id: 'http-antigo', url: 'http://antigo.exemplo.com/produto' }, { id: 'kiwify-vazio', url: 'https://pay.kiwify.com.br/abc123' }, { id: 'url-com-espacos', url: '  https://blog.exemplo.com/post  ' },
]
export const CASOS_INVALIDOS = [{ id: 'url-vazia', url: '' }, { id: 'url-nula', url: null }, { id: 'url-numero', url: 123 }, { id: 'ftp', url: 'ftp://exemplo.com/x' }, { id: 'javascript', url: 'javascript:alert(1)' }, { id: 'sem-protocolo', url: 'exemplo.com/sem-protocolo' }, { id: 'objeto', url: {} }, { id: 'sem-campo', semCampo: true }]
