import { NextResponse } from 'next/server'

// Gera previa automatica (titulo/descricao/imagem/tipo_destino) a partir de um link colado
// pelo administrador no cadastro de item do catalogo. E so uma AJUDA - nunca obrigatoria,
// e sempre pode ser sobrescrita manualmente depois. Sem scraping pesado: so fetch com
// timeout curto + leitura de meta tags Open Graph via regex simples (sem lib de parsing).

const TIMEOUT_MS = 6000

function detectarPlataforma(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('wa.me/') || u.includes('whatsapp.com')) return 'whatsapp'
  if (u.includes('youtube.com/shorts/')) return 'youtube_shorts'
  if (u.includes('youtube.com/watch') || u.includes('youtu.be/')) return 'youtube'
  if (u.includes('open.spotify.com') || u.includes('spotify.com')) return 'spotify'
  if (u.includes('hotmart.com')) return 'hotmart'
  if (u.includes('kiwify.com')) return 'kiwify'
  if (u.includes('shopee.com')) return 'shopee'
  if (u.includes('shein.com')) return 'shein'
  if (u.includes('mercadolivre.com') || u.includes('mercadolibre.com')) return 'mercadolivre'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('tiktok.com')) return 'tiktok'
  return 'site'
}

function extrairVideoIdYoutube(url: string): string | null {
  const padroes = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
  ]
  for (const p of padroes) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

async function buscarComTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

function extrairMetaTag(html: string, propriedade: string): string | null {
  // Aceita og:title="..." ou og:title='...', em qualquer ordem de atributos
  const regexes = [
    new RegExp(`<meta[^>]+property=["']${propriedade}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${propriedade}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${propriedade}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ]
  for (const r of regexes) {
    const m = html.match(r)
    if (m) return m[1].trim()
  }
  return null
}

function decodificarEntidadesHtml(texto: string): string {
  return texto
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
      return NextResponse.json({ success: false, message: 'Informe um link válido (começando com http:// ou https://).' }, { status: 400 })
    }
    const urlLimpa = url.trim()
    const tipoDestino = detectarPlataforma(urlLimpa)

    // YouTube / YouTube Shorts: usa o oEmbed oficial (rapido, sem chave de API, sem scraping)
    // + thumbnail padrao do proprio YouTube.
    if (tipoDestino === 'youtube' || tipoDestino === 'youtube_shorts') {
      const videoId = extrairVideoIdYoutube(urlLimpa)
      if (!videoId) {
        return NextResponse.json({ success: false, message: 'Não foi possível identificar o vídeo nesse link do YouTube.' })
      }
      try {
        const oembedRes = await buscarComTimeout(`https://www.youtube.com/oembed?url=${encodeURIComponent(urlLimpa)}&format=json`)
        if (oembedRes.ok) {
          const dados = await oembedRes.json()
          return NextResponse.json({
            success: true,
            tipo_destino: tipoDestino,
            titulo: dados.title || null,
            descricao: null,
            // mqdefault.jpg e genuinamente 16:9, sem faixa preta "assada" na imagem (diferente
            // do hqdefault.jpg, que e um canvas 4:3 com letterbox embutido em muitos videos -
            // isso deixava os cards do catalogo com uma tarja preta estranha).
            imagem_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            url: urlLimpa,
          })
        }
      } catch { /* segue pro fallback abaixo */ }
      // Fallback: mesmo sem oEmbed, a thumbnail padrao quase sempre existe
      return NextResponse.json({
        success: true,
        tipo_destino: tipoDestino,
        titulo: null,
        descricao: null,
        imagem_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        url: urlLimpa,
      })
    }

    // Demais plataformas: tenta Open Graph generico via fetch com timeout curto.
    // Sites que bloqueiam (Instagram/TikTok/Shopee costumam bloquear bots) simplesmente
    // falham aqui e caem no "success:false" - preenchimento manual continua disponivel.
    try {
      const res = await buscarComTimeout(urlLimpa, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MiniPageBot/1.0; +https://minipage.pro)' },
      })
      if (!res.ok) {
        return NextResponse.json({ success: false, message: 'Não foi possível gerar a prévia automaticamente. Você pode preencher manualmente.', tipo_destino: tipoDestino })
      }
      const html = await res.text()
      const titulo = extrairMetaTag(html, 'og:title')
      const descricao = extrairMetaTag(html, 'og:description')
      const imagem = extrairMetaTag(html, 'og:image')

      if (!titulo && !descricao && !imagem) {
        return NextResponse.json({ success: false, message: 'Não foi possível gerar a prévia automaticamente. Você pode preencher manualmente.', tipo_destino: tipoDestino })
      }

      return NextResponse.json({
        success: true,
        tipo_destino: tipoDestino,
        titulo: titulo ? decodificarEntidadesHtml(titulo) : null,
        descricao: descricao ? decodificarEntidadesHtml(descricao) : null,
        imagem_url: imagem || null,
        url: urlLimpa,
      })
    } catch {
      return NextResponse.json({ success: false, message: 'Não foi possível gerar a prévia automaticamente. Você pode preencher manualmente.', tipo_destino: tipoDestino })
    }
  } catch (e: any) {
    console.error('[preview-link] Erro:', e?.message)
    return NextResponse.json({ success: false, message: 'Não foi possível gerar a prévia automaticamente. Você pode preencher manualmente.' }, { status: 500 })
  }
}
