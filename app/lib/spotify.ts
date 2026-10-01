// Parsing e validacao de URLs do Spotify - fonte UNICA usada pelo painel (reconhecimento
// em tempo real ao colar o link) e pela slug publica (montagem do embed). Nada aqui e
// persistido no banco: tipo, id e embedUrl sao sempre derivados de spotify_url na hora,
// tanto no formulario quanto na renderizacao publica.

export type SpotifyTipo = 'track' | 'album' | 'playlist' | 'artist' | 'show' | 'episode'

export type SpotifyParseResult =
  | { valido: true; tipo: SpotifyTipo; id: string; embedUrl: string }
  | { valido: false }

const TIPOS_VALIDOS: SpotifyTipo[] = ['track', 'album', 'playlist', 'artist', 'show', 'episode']

// Label em portugues pra exibir "Destino reconhecido: Spotify — Playlist" no painel.
export const SPOTIFY_TIPO_LABEL: Record<SpotifyTipo, string> = {
  track: 'Música',
  album: 'Álbum',
  playlist: 'Playlist',
  artist: 'Artista',
  show: 'Podcast',
  episode: 'Episódio',
}

// Valida e decompoe uma URL do Spotify. So aceita o hostname EXATO open.spotify.com -
// nunca aceita dominios parecidos/falsos (open.spotify.com.evil.com, open-spotify.com,
// etc), porque new URL(...).hostname sempre retorna o host real, sem se deixar enganar
// por substrings. Ignora qualquer query string (?si=..., ?utm_source=...) ao montar a
// embedUrl - so tipo e id importam pro embed oficial.
export function parseSpotifyUrl(url?: string | null): SpotifyParseResult {
  if (!url) return { valido: false }
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return { valido: false }
  }

  if (parsed.hostname !== 'open.spotify.com') return { valido: false }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return { valido: false }

  // pathname pode vir como /track/ID, /intl-pt/track/ID (variacao de locale que o
  // Spotify as vezes usa), ou /embed/track/ID caso o usuario cole a propria URL de embed.
  const match = parsed.pathname.match(/\/(?:embed\/)?(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(track|album|playlist|artist|show|episode)\/([A-Za-z0-9]{22})/)
  if (!match) return { valido: false }

  const tipo = match[1] as SpotifyTipo
  const id = match[2]
  if (!TIPOS_VALIDOS.includes(tipo)) return { valido: false }

  return { valido: true, tipo, id, embedUrl: `https://open.spotify.com/embed/${tipo}/${id}` }
}

// Alturas oficiais do embed do Spotify por tipo de conteudo (documentacao/comportamento
// real do iframe): track usa a visualizacao compacta (capa + barra de progresso); os
// demais tipos (album, playlist, artist, show, episode) precisam da visualizacao completa
// pra caber a lista de faixas/episodios sem cortar. Nunca usar altura percentual - o
// Spotify confirma que o embed nao estica com height:100% (conteudo interno fixo).
export function getSpotifyEmbedHeight(tipo: SpotifyTipo): number {
  return tipo === 'track' ? 152 : 352
}
