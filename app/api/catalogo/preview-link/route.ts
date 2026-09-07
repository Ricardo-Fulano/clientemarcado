import { NextResponse } from 'next/server'

// Gera previa automatica (titulo/descricao/imagem/tipo_destino) a partir de um link colado
// pelo administrador no cadastro de item do catalogo. E so uma AJUDA - nunca obrigatoria,
// e sempre pode ser sobrescrita manualmente depois. Sem scraping pesado: so fetch com
// timeout curto + leitura de meta tags Open Graph via regex simples (sem lib de parsing).

const TIMEOUT_MS = 6000
// User-Agent de navegador real comum (Chrome desktop) - o anterior se autodeclarava bot
// ("MiniPageBot/1.0"), o que e um sinal classico de bloqueio automatico por WAFs/CDNs de
// e-commerces grandes (Shopee, Shein, Mercado Livre). Sites com Open Graph publico
// normalmente nao se importam com QUEM esta lendo a meta tag, entao usar um UA de
// navegador real e uma pratica padrao e segura pra esse tipo de leitura de metadata.
const USER_AGENT_NAVEGADOR = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Remove parametros de tracking/afiliado comuns que podem confundir o roteamento de
// e-commerces (Shopee, Shein, Mercado Livre) sem afetar o produto em si - mantem so o
// necessario pra identificar a pagina. Se a limpeza falhar por qualquer motivo, devolve a
// URL original sem alterar nada (nunca quebra por causa disso).
function normalizarUrlPreview(url: string): string {
  try {
    const u = new URL(url)
    const paramsParaRemover = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'sp_atk', 'xptdk', 'uls_trackid', 'gclid', 'fbclid']
    paramsParaRemover.forEach(p => u.searchParams.delete(p))
    return u.toString()
  } catch {
    return url
  }
}

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
  if (u.includes('amazon.com')) return 'amazon'
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

// Fallback final: pega o conteudo puro da tag <title>, quando nenhuma meta tag OG/Twitter
// existir - ultimo recurso antes de cair no fallback por URL.
function extrairTitleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m ? m[1].trim() : null
}

// Camada 2: coleta TODAS as ocorrencias de og:image (algumas paginas de produto declaram
// varias tags og:image, uma por foto do anuncio) - mais confiavel que JSON embutido, ja
// que e um padrao Open Graph oficial, so que raramente aproveitado alem da primeira.
function extrairTodasMetaTags(html: string, propriedade: string): string[] {
  // Mesma robustez ja usada em extrairMetaTag: sites variam a ORDEM dos atributos dentro
  // da tag <meta> (property antes ou depois de content) - testar so 1 ordem fazia essa
  // funcao falhar silenciosamente em varios sites (Spotify, Shopee, Shein, Mercado Livre
  // entre eles), mesmo quando extrairMetaTag (usada pro titulo) conseguia ler normalmente.
  const regexes = [
    new RegExp(`<meta[^>]+property=["']${propriedade}["'][^>]+content=["']([^"']+)["']`, 'gi'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${propriedade}["']`, 'gi'),
  ]
  const resultados: string[] = []
  for (const regex of regexes) {
    let m
    while ((m = regex.exec(html)) !== null) resultados.push(m[1])
  }
  return resultados
}

// Camada 2b: JSON-LD (schema.org/Product) - bloco <script type="application/ld+json">
// costuma trazer "image" como string OU array de strings. E o formato mais estruturado e
// confiavel quando presente (bastante usado por lojas serias, menos comum na Shopee).
function extrairImagensJsonLd(html: string): string[] {
  const imagens: string[] = []
  const regexBlocos = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = regexBlocos.exec(html)) !== null) {
    try {
      const json = JSON.parse(m[1].trim())
      const itens = Array.isArray(json) ? json : [json]
      for (const item of itens) {
        const img = item?.image
        if (typeof img === 'string') imagens.push(img)
        else if (Array.isArray(img)) img.forEach((i: any) => typeof i === 'string' && imagens.push(i))
      }
    } catch { /* JSON-LD malformado - ignora esse bloco, tenta os outros */ }
  }
  return imagens
}

// Camada 3: paginas modernas (Shopee incluida) costumam embutir o estado inicial da
// aplicacao num <script> como JSON gigante (window.__INITIAL_STATE__ ou similar). Nao da
// pra saber o formato exato de cada site, entao a estrategia e generica e best-effort:
// procura strings de URL de imagem (.jpg/.png/.webp) dentro desses blocos JSON, sem tentar
// entender a estrutura completa. Pode nao encontrar nada (paginas 100% client-side-rendered
// sem SSR nao tem esse JSON no HTML inicial) - nesse caso, cai pro fallback normal.
function extrairImagensDeJsonEmbutido(html: string): string[] {
  const imagens: string[] = []
  const regexScripts = /<script(?![^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = regexScripts.exec(html)) !== null) {
    const conteudo = m[1]
    // So vale a pena examinar blocos que parecem ter dados de imagem de verdade (evita
    // gastar tempo processando scripts de analytics/tracking irrelevantes).
    if (!conteudo.includes('image') || conteudo.length < 200 || conteudo.length > 500000) continue
    const regexUrls = /https?:\/\/[^"'\\\s]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s]*)?/gi
    let urlMatch
    while ((urlMatch = regexUrls.exec(conteudo)) !== null) imagens.push(urlMatch[0])
    if (imagens.length >= 20) break // limite de seguranca - nao precisa varrer o documento inteiro
  }
  return imagens
}

// Junta as 3 camadas de busca de imagem, remove duplicatas (por URL exata) e devolve a
// lista final - a primeira imagem da lista sempre vira a "principal".
function coletarImagens(html: string): string[] {
  const ogImages = extrairTodasMetaTags(html, 'og:image')
  const ogImagesSecure = extrairTodasMetaTags(html, 'og:image:secure_url')
  const twitterImage = extrairMetaTag(html, 'twitter:image') || extrairMetaTag(html, 'twitter:image:src')
  const jsonLd = extrairImagensJsonLd(html)
  const embutido = extrairImagensDeJsonEmbutido(html)

  const todas = [...ogImages, ...ogImagesSecure, ...(twitterImage ? [twitterImage] : []), ...jsonLd, ...embutido]
  const vistas = new Set<string>()
  const unicas: string[] = []
  for (const img of todas) {
    const limpa = img.trim()
    if (limpa && !vistas.has(limpa)) { vistas.add(limpa); unicas.push(limpa) }
  }
  return unicas.slice(0, 8) // mesmo limite ja usado nas galerias do Catalogo/Destaques
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

    // Nome legivel extraido do proprio path da URL - usado como ultimo fallback quando o
    // site bloqueia a leitura de metadata (comum em e-commerces como Shopee). Nunca deixa o
    // titulo totalmente vazio se pelo menos o path da URL tiver algo aproveitavel.
    // Nome legivel extraido do proprio path da URL - usado como ultimo fallback quando o
    // site bloqueia a leitura de metadata (comum em e-commerces como Shopee). Nunca deixa o
    // titulo totalmente vazio se pelo menos o path da URL tiver algo aproveitavel.
    //
    // Shopee especificamente: a URL do produto segue o padrao
    // "/Nome-Do-Produto-Aqui-i.LOJA_ID.PRODUTO_ID" - tudo depois de "-i." e so codigo/
    // rastreamento, entao cortamos exatamente ali antes de limpar o resto.
    function limparTituloShopee(u: string): string | null {
      try {
        const path = new URL(u).pathname
        let slug = decodeURIComponent(path.replace(/^\//, ''))
        const idxId = slug.search(/-i\.\d/)
        if (idxId > -1) slug = slug.slice(0, idxId)
        let texto = slug.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
        if (!texto) return null
        texto = texto.charAt(0).toUpperCase() + texto.slice(1)
        return texto.length > 2 ? texto : null
      } catch { return null }
    }

    function extrairNomeDaUrl(u: string): string | null {
      try {
        const path = new URL(u).pathname
        const partes = path.split('/').filter(Boolean)
        const ultimaParte = partes[partes.length - 1]
        if (!ultimaParte) return null
        const limpo = decodeURIComponent(ultimaParte).replace(/[-_.]/g, ' ').replace(/\.(html?|php)$/i, '').trim()
        return limpo.length > 2 ? limpo : null
      } catch { return null }
    }

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

    // TikTok (video): usa o oEmbed oficial (publico, sem chave de API) - so cobre videos
    // normais (@usuario/video/ID). TikTok Shop (produtos) nao tem API publica equivalente
    // e continua no fluxo generico abaixo, com o mesmo aviso amigavel ja usado pra Shopee.
    if (tipoDestino === 'tiktok') {
      try {
        const oembedRes = await buscarComTimeout(`https://www.tiktok.com/oembed?url=${encodeURIComponent(urlLimpa)}`)
        if (oembedRes.ok) {
          const dados = await oembedRes.json()
          return NextResponse.json({
            success: true,
            tipo_destino: tipoDestino,
            titulo: dados.title || null,
            descricao: null,
            imagem_url: dados.thumbnail_url || null,
            url: urlLimpa,
          })
        }
      } catch { /* segue pro fallback generico abaixo */ }
    }

    // Spotify: usa o oEmbed oficial (publico, sem chave de API) - resolve o problema de o
    // Spotify bloquear/nao servir og:image no scraping generico abaixo. A resposta ja vem
    // com a capa do album/faixa/playlist/episodio pronta em thumbnail_url.
    if (tipoDestino === 'spotify') {
      try {
        const oembedRes = await buscarComTimeout(`https://open.spotify.com/oembed?url=${encodeURIComponent(urlLimpa)}`)
        if (oembedRes.ok) {
          const dados = await oembedRes.json()
          return NextResponse.json({
            success: true,
            tipo_destino: tipoDestino,
            titulo: dados.title || null,
            descricao: null,
            imagem_url: dados.thumbnail_url || null,
            url: urlLimpa,
          })
        }
      } catch { /* segue pro fallback generico abaixo */ }
    }

    // Demais plataformas: tenta Open Graph generico via fetch com timeout curto, usando
    // headers de navegador real (nao mais um UA que se autodeclara bot) - reduz bastante a
    // chance de bloqueio automatico por WAFs de e-commerces como Shopee/Shein/Mercado Livre.
    // Sites que MESMO ASSIM bloquearem simplesmente falham aqui e caem no fallback abaixo -
    // preenchimento manual sempre continua disponivel, nunca quebra o formulario.
    const urlParaFetch = normalizarUrlPreview(urlLimpa)
    const ehShopee = tipoDestino === 'shopee'
    const ehEcommerceComBloqueioComum = ['shopee', 'shein', 'mercadolivre', 'tiktok', 'amazon'].includes(tipoDestino)
    const NOME_PLATAFORMA: Record<string, string> = {
      shopee: 'a Shopee', shein: 'a Shein', mercadolivre: 'o Mercado Livre', tiktok: 'o TikTok', amazon: 'a Amazon',
    }
    const nomePlataformaExibicao = NOME_PLATAFORMA[tipoDestino] || 'esta plataforma'

    // Fallback de titulo pela URL: usa o limpador especifico da Shopee (corta no padrao
    // "-i.NUMERO") quando for Shopee, senao usa o generico (ultimo segmento do path).
    function gerarTituloFallback(): string | null {
      return ehShopee ? limparTituloShopee(urlLimpa) : extrairNomeDaUrl(urlLimpa)
    }

    // Monta a resposta de falha/parcial, sempre preservando o link e nunca retornando erro
    // "seco" quando pelo menos um titulo por URL for possivel - o frontend consegue
    // preencher parcialmente em vez de deixar tudo vazio.
    function respostaFallback() {
      const nomeFallback = gerarTituloFallback()
      let message: string
      if (ehEcommerceComBloqueioComum && nomeFallback) {
        message = `Conseguimos identificar o produto pelo link, mas ${nomePlataformaExibicao} não liberou a imagem automaticamente. Revise o título e envie uma imagem manualmente.`
      } else if (ehEcommerceComBloqueioComum) {
        message = `Esta plataforma (${nomePlataformaExibicao}) limitou a prévia automática deste link. O link foi mantido, mas você pode preencher título, imagem e descrição manualmente.`
      } else {
        message = 'Não foi possível gerar a prévia automaticamente. Você pode preencher manualmente.'
      }
      return NextResponse.json({
        success: false,
        partial: !!nomeFallback,
        platform: tipoDestino,
        tipo_destino: tipoDestino,
        message,
        titulo_fallback: nomeFallback,
      })
    }

    try {
      const res = await buscarComTimeout(urlParaFetch, {
        headers: {
          'User-Agent': USER_AGENT_NAVEGADOR,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
      })
      if (!res.ok) return respostaFallback()

      const html = await res.text()
      // Cadeia de fallback pra titulo: og: -> twitter: -> <title> (fallback por URL fica
      // separado na resposta parcial acima, so entra se nem isso funcionar).
      const titulo = extrairMetaTag(html, 'og:title') || extrairMetaTag(html, 'twitter:title') || extrairTitleTag(html)
      const descricao = extrairMetaTag(html, 'og:description') || extrairMetaTag(html, 'twitter:description') || extrairMetaTag(html, 'description')
      // Imagem: agora busca em 3 camadas (og:image multiplos, JSON-LD, JSON embutido) -
      // ve funcao coletarImagens() pra detalhes de cada camada.
      const imagens = coletarImagens(html)
      const imagemPrincipal = imagens[0] || null
      const imagensExtras = imagens.slice(1)

      if (!titulo && !descricao && imagens.length === 0) return respostaFallback()

      // Mensagem diferenciada conforme o que realmente foi conseguido - ajuda o usuario a
      // entender exatamente o que foi automatico e o que precisa revisar.
      let message: string
      if (imagensExtras.length > 0) {
        message = 'Prévia gerada com sucesso. Importamos título, imagem principal e imagens adicionais do item.'
      } else if (imagemPrincipal) {
        message = 'Conseguimos importar a imagem principal do item. Algumas imagens adicionais podem não ter sido liberadas pela plataforma.'
      } else if (titulo || descricao) {
        message = `Conseguimos identificar o item pelo link, mas ${nomePlataformaExibicao} não liberou a imagem automaticamente. Revise o título e envie a imagem manualmente.`
      } else {
        message = 'Prévia parcial gerada.'
      }

      return NextResponse.json({
        success: true,
        partial: !imagemPrincipal || imagensExtras.length === 0,
        platform: tipoDestino,
        tipo_destino: tipoDestino,
        message,
        titulo: titulo ? decodificarEntidadesHtml(titulo) : null,
        descricao: descricao ? decodificarEntidadesHtml(descricao) : null,
        imagem_url: imagemPrincipal,
        imagens_extras: imagensExtras,
        url: urlLimpa,
      })
    } catch {
      return respostaFallback()
    }
  } catch (e: any) {
    console.error('[preview-link] Erro:', e?.message)
    return NextResponse.json({ success: false, message: 'Não foi possível gerar a prévia automaticamente. Você pode preencher manualmente.' }, { status: 500 })
  }
}
