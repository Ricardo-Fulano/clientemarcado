import { detectarOrigemDoLink, escolhaManualValida } from './marcas'

// Fonte unica das plataformas disponiveis pra Links - usada em /painel/perfil/links e no
// onboarding (/painel/criar-minipage), pra nunca mais existirem 2 listas divergentes.
// Nao inclui logica de deteccao por URL/icones da pagina publica (isso continua em
// app/[slug]/page.tsx, que ja tem sua propria funcao mais completa) - aqui e so o que o
// PAINEL precisa pra montar o seletor e os placeholders.
export const PLATAFORMAS_LINK = [
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '(11) 99999-9999 ou @studiobella' },
  { id: 'instagram', label: 'Instagram', placeholder: '@usuario ou instagram.com/usuario' },
  { id: 'threads', label: 'Threads', placeholder: 'https://threads.net/@usuario' },
  { id: 'telegram', label: 'Telegram', placeholder: 'https://t.me/usuario' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@usuario' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' },
  { id: 'youtube_music', label: 'YouTube Music', placeholder: 'https://music.youtube.com/...' },
  { id: 'x', label: 'X / Twitter', placeholder: 'https://x.com/usuario' },
  { id: 'facebook', label: 'Facebook', placeholder: '@usuario ou facebook.com/usuario' },
  { id: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/...' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/seuperfil' },
  { id: 'apple_music', label: 'Apple Music', placeholder: 'https://music.apple.com/...' },
  { id: 'deezer', label: 'Deezer', placeholder: 'https://deezer.com/...' },
  { id: 'amazon_music', label: 'Amazon Music', placeholder: 'https://music.amazon.com/...' },
  { id: 'tidal', label: 'Tidal', placeholder: 'https://tidal.com/...' },
  { id: 'tinder', label: 'Tinder', placeholder: 'URL do seu perfil/link' },
  { id: 'email', label: 'E-mail', placeholder: 'contato@seudominio.com' },
  { id: 'secreto', label: 'Secreto', placeholder: 'https://...' },
  { id: 'shopee', label: 'Shopee', placeholder: 'https://shopee.com.br/...' },
  { id: 'mercadolivre', label: 'Mercado Livre', placeholder: 'https://mercadolivre.com.br/...' },
  { id: 'amazon', label: 'Amazon', placeholder: 'https://amazon.com.br/...' },
  { id: 'aliexpress', label: 'AliExpress', placeholder: 'https://aliexpress.com/...' },
  { id: 'shein', label: 'SHEIN', placeholder: 'https://br.shein.com/...' },
  { id: 'shopify', label: 'Shopify', placeholder: 'https://sualoja.myshopify.com' },
  { id: 'tiktok_shop', label: 'TikTok Shop', placeholder: 'https://shop.tiktok.com/...' },
  { id: 'kiwify', label: 'Kiwify', placeholder: 'https://pay.kiwify.com.br/...' },
  { id: 'hotmart', label: 'Hotmart', placeholder: 'https://pay.hotmart.com/...' },
  { id: 'eduzz', label: 'Eduzz', placeholder: 'https://sun.eduzz.com/...' },
  { id: 'monetizze', label: 'Monetizze', placeholder: 'https://app.monetizze.com.br/...' },
  { id: 'braip', label: 'Braip', placeholder: 'https://...' },
  { id: 'kirvano', label: 'Kirvano', placeholder: 'https://pay.kirvano.com/...' },
  { id: 'perfectpay', label: 'Perfect Pay', placeholder: 'https://go.perfectpay.com.br/...' },
  { id: 'gumroad', label: 'Gumroad', placeholder: 'https://usuario.gumroad.com' },
  { id: 'udemy', label: 'Udemy', placeholder: 'https://udemy.com/course/...' },
  { id: 'messenger', label: 'Messenger', placeholder: 'https://m.me/usuario' },
  { id: 'snapchat', label: 'Snapchat', placeholder: 'https://snapchat.com/add/usuario' },
  { id: 'reddit', label: 'Reddit', placeholder: 'https://reddit.com/user/usuario' },
  { id: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/usuario' },
  { id: 'twitch', label: 'Twitch', placeholder: 'https://twitch.tv/usuario' },
  { id: 'discord', label: 'Discord', placeholder: 'https://discord.gg/convite' },
  { id: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/usuario' },
  { id: 'linktree', label: 'Linktree', placeholder: 'https://linktr.ee/usuario' },
  { id: 'linkme', label: 'Link.me', placeholder: 'https://link.me/usuario' },
  { id: 'beacons', label: 'Beacons', placeholder: 'https://beacons.ai/usuario' },
  { id: 'carrd', label: 'Carrd', placeholder: 'https://usuario.carrd.co' },
  { id: 'minipage', label: 'MiniPage Pro', placeholder: 'https://minipage.pro/usuario' },
  { id: 'site', label: 'Site', placeholder: 'https://seusite.com' },
  { id: 'curso', label: 'Curso', placeholder: 'https://...' },
  { id: 'mentoria', label: 'Mentoria', placeholder: 'https://...' },
  { id: 'endereco', label: 'Endereço', placeholder: 'Ex: Avenida Atlântica, 156 - São Paulo, SP' },
  { id: 'outro', label: 'Outros', placeholder: 'https://...' },
]

export function labelPlataforma(id: string): string {
  return PLATAFORMAS_LINK.find(p => p.id === id)?.label || id
}

export function placeholderPlataforma(id: string): string {
  return PLATAFORMAS_LINK.find(p => p.id === id)?.placeholder || 'https://...'
}

// Normalizacao de Instagram/Facebook: aceita @usuario, usuario ou URL completa, sempre
// devolvendo uma URL valida. Compativel com dados antigos ja salvos como URL ou como
// "@usuario" (nunca quebra o que ja existe, so passa a normalizar o que ainda nao era URL).
export function normalizarInstagram(valor: string): string {
  const v = (valor || '').trim()
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  const usuario = v.replace('@', '').trim()
  return `https://instagram.com/${usuario}`
}

export function normalizarFacebook(valor: string): string {
  const v = (valor || '').trim()
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  const usuario = v.replace('@', '').trim()
  return `https://facebook.com/${usuario}`
}

// ===================================================================================
// Deteccao de plataforma por URL/titulo - fonte UNICA usada pela slug publica
// (app/[slug]/page.tsx) e pelo modulo Cards (Links visuais). Antes desta consolidacao,
// a slug tinha sua propria copia local desta logica, com 3 lacunas: nao reconhecia
// threads.net, music.youtube.com nem soundcloud.com. Corrigido aqui, na fonte unica.
// O painel de Links (app/painel/perfil/links/page.tsx) mantem sua propria deteccao mais
// simples (so pra sugerir o tipo no seletor) - nao foi migrada pra nao ampliar o escopo
// desta rodada em um componente que ja funciona bem como esta.
// ===================================================================================
export const TIPOS_SOCIAIS_TOPO = ['whatsapp', 'instagram', 'threads', 'youtube', 'youtube_music', 'tiktok', 'spotify', 'deezer', 'soundcloud', 'shopee', 'telegram', 'facebook', 'x', 'linkedin', 'pinterest', 'twitch', 'discord', 'email', 'site', 'apple_music', 'amazon_music', 'tidal', 'tinder']

// Reconhecimento pelo HOSTNAME (parser de URL), centralizado em ./marcas. Substitui a antiga busca por texto (includes), que gerava falsos positivos
// (ex.: "dropbox.com" e "netflix.com" contem "x.com"). Nao segue redirecionamentos e nao faz rede: link encurtado de terceiros => null (icone generico / escolha manual).
export function detectarTipoPorUrl(url?: string): string | null {
  const u = (url || '').trim()
  if (!u) return null
  return detectarOrigemDoLink(u).marca
}

/**
 * Tipo usado SO para escolher o ICONE: a escolha manual do dono (coluna opcional pagina_links.icone_marca) vence; senao vale o tipo efetivo atual.
 * "generico" => 'outro' (icone padrao de link). Nao altera o comportamento do link (e-mail, endereco...), so a imagem.
 */
export function escolherTipoDoIcone(tipoEfetivo: string, iconeManual: unknown): string {
  const m = escolhaManualValida(iconeManual)
  if (!m) return tipoEfetivo
  return m === 'generico' ? 'outro' : m
}

export function detectarTipoPorTitulo(titulo?: string): string | null {
  const tMin = (titulo || '').trim().toLowerCase()
  if (!tMin) return null
  if (tMin.includes('whatsapp') || tMin.includes('zap')) return 'whatsapp'
  if (tMin.includes('instagram') || tMin.includes('insta')) return 'instagram'
  if (tMin.includes('threads')) return 'threads'
  if (tMin.includes('youtube music')) return 'youtube_music'
  if (tMin.includes('youtube') || tMin.includes('canal')) return 'youtube'
  if (tMin.includes('tiktok') || tMin.includes('tik tok')) return 'tiktok'
  if (tMin.includes('spotify')) return 'spotify'
  if (tMin.includes('deezer')) return 'deezer'
  if (tMin.includes('soundcloud')) return 'soundcloud'
  if (tMin.includes('shopee')) return 'shopee'
  if (tMin.includes('mercado livre') || tMin.includes('mercadolivre')) return 'mercadolivre'
  if (tMin.includes('facebook') || tMin === 'face') return 'facebook'
  if (tMin.includes('telegram')) return 'telegram'
  if (tMin.includes('linkedin')) return 'linkedin'
  if (tMin.includes('pinterest')) return 'pinterest'
  if (tMin.includes('twitch')) return 'twitch'
  if (tMin.includes('discord')) return 'discord'
  if (tMin.includes('apple music')) return 'apple_music'
  if (tMin.includes('amazon music')) return 'amazon_music'
  if (tMin.includes('tidal')) return 'tidal'
  if (tMin.includes('tinder')) return 'tinder'
  if (tMin.includes('e-mail') || tMin.includes('email')) return 'email'
  if (tMin.includes('telefone') || tMin.includes('ligar') || tMin.includes('celular')) return 'telefone'
  if (tMin.includes('agenda') || tMin.includes('agendar') || tMin.includes('calendário') || tMin.includes('calendario')) return 'agenda'
  if (tMin.includes('loja') || tMin.includes('comprar') || tMin.includes('catálogo') || tMin.includes('catalogo') || tMin.includes('produto')) return 'loja'
  if (tMin.includes('site') || tMin.includes('website')) return 'site'
  return null
}

// ===================================================================================
// Normaliza a ordem salva das secoes publicas da MiniPage (ordem_secoes_publicas),
// corrigindo o bug de validacao por tamanho EXATO do array: antes, se o array salvo nao
// tivesse o mesmo numero de itens da lista padrao atual, a ordem inteira do cliente era
// descartada e revertida ao padrao - o que aconteceria com TODO cliente antigo assim que
// uma secao nova (como "cards") fosse adicionada a lista padrao.
//
// Comportamento correto: mantem so chaves reconhecidas, remove duplicatas, PRESERVA a
// ordem ja salva pelo cliente, e so acrescenta ao final as chaves novas que estiverem
// ausentes - nunca reordena as que ja existiam. Usada tanto no painel (onde o cliente
// reordena) quanto na slug publica (onde a ordem e aplicada), pra nunca divergir.
// ===================================================================================
export function normalizarOrdemSecoes(ordemSalva: unknown, ordemPadrao: string[]): string[] {
  const salvaValida = Array.isArray(ordemSalva) ? (ordemSalva as unknown[]).filter((v): v is string => typeof v === 'string') : []
  const reconhecidasSemDuplicar: string[] = []
  for (const chave of salvaValida) {
    if (ordemPadrao.includes(chave) && !reconhecidasSemDuplicar.includes(chave)) {
      reconhecidasSemDuplicar.push(chave)
    }
  }
  const ausentes = ordemPadrao.filter(chave => !reconhecidasSemDuplicar.includes(chave))
  return [...reconhecidasSemDuplicar, ...ausentes]
}
