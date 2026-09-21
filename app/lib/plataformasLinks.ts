// Fonte unica das plataformas disponiveis pra Links - usada em /painel/perfil/links e no
// onboarding (/painel/criar-minipage), pra nunca mais existirem 2 listas divergentes.
// Nao inclui logica de deteccao por URL/icones da pagina publica (isso continua em
// app/[slug]/page.tsx, que ja tem sua propria funcao mais completa) - aqui e so o que o
// PAINEL precisa pra montar o seletor e os placeholders.
export const PLATAFORMAS_LINK = [
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '(11) 99999-9999 ou @studiobella' },
  { id: 'instagram', label: 'Instagram', placeholder: '@usuario ou instagram.com/usuario' },
  { id: 'threads', label: 'Threads', placeholder: 'https://threads.net/@usuario' },
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
