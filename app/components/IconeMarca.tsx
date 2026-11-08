// Icone de marca (traçado do Simple Icons, ver app/lib/marcas.ts). Server/Client Component sem estado, sem rede, sem HTML dinamico.
// O traçado vem de uma tabela FIXA do codigo (nunca de dado do usuario). Usa currentColor: quem chama define a cor (cor oficial com contraste por tema).
import { ICONES_MARCAS } from '../lib/marcas'

export default function IconeMarca({ id, size = 18 }: { id: string; size?: number }) {
  if (id === 'minipage') {
    // logo proprio da MiniPage Pro (arquivo local, 96 px)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/brand-icons/minipage.png" width={size} height={size} alt="" style={{ borderRadius: Math.round(size * 0.22), display: 'block' }} />
  }
  const ic = ICONES_MARCAS[id]
  if (!ic) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d={ic.d} />
    </svg>
  )
}
