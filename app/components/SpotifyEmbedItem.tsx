import { getSpotifyEmbedHeight, SPOTIFY_TIPO_LABEL, type SpotifyTipo } from '../lib/spotify'

// Embed oficial do Spotify - recebe SOMENTE dados ja parseados/validados (nunca HTML ou
// iframe vindo do usuario). Altura fixa por tipo (o proprio Spotify nao suporta
// height:100% fluido no conteudo interno do iframe), largura sempre responsiva a 100% do
// container pai (quem controla a largura visual e o wrapper na pagina, nao este
// componente). loading="lazy" evita que embeds fora da primeira dobra pesem no
// carregamento inicial da pagina.
export default function SpotifyEmbedItem({ tipo, id, embedUrl }: { tipo: SpotifyTipo; id: string; embedUrl: string }) {
  const altura = getSpotifyEmbedHeight(tipo)
  return (
    <div className="spotify-embed-wrap" style={{ height: `${altura}px` }}>
      <iframe
        key={id}
        src={embedUrl}
        width="100%"
        height={altura}
        style={{ border: 0, borderRadius: '12px', display: 'block' }}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        title={`Spotify — ${SPOTIFY_TIPO_LABEL[tipo]}`}
      />
    </div>
  )
}
