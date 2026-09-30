// Card visual (modulo "Links visuais") - card horizontal encorpado, nunca banner 16:9.
// Proporcao ~1.85:1 (referencia 1200x650), imagem dominante preenchendo todo o card,
// clique no card inteiro abre o destino. Titulo so aparece sobre a imagem quando o dono
// explicitamente ligou "Exibir titulo sobre a imagem" - por padrao a arte fala por si.
export default function CardVisualItem({
  imagemUrl,
  titulo,
  exibirTitulo,
  url,
}: {
  imagemUrl?: string | null
  titulo?: string | null
  exibirTitulo?: boolean
  url?: string | null
}) {
  if (!imagemUrl || !url) return null
  const externo = url.startsWith('http://') || url.startsWith('https://')

  return (
    <a
      href={url}
      target={externo ? '_blank' : '_self'}
      rel="noopener noreferrer"
      className="card-visual-item"
      aria-label={titulo || 'Abrir link'}
      data-track-tipo="card_visual_click"
      data-track-item-titulo={titulo || ''}
      data-track-item-url={url}
    >
      <img src={imagemUrl} alt={titulo || ''} loading="lazy" decoding="async" className="card-visual-img" />
      {exibirTitulo && titulo && (
        <div className="card-visual-overlay">
          <p className="card-visual-titulo">{titulo}</p>
        </div>
      )}
    </a>
  )
}
