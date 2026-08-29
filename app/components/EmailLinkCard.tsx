'use client'
import { useState } from 'react'
import { Mail } from 'lucide-react'

// Card de link do tipo "e-mail" na pagina publica. Precisa ser Client Component porque,
// diferente dos outros links (que so abrem um href), esse aqui copia o e-mail pro
// clipboard e mostra um toast - isso exige onClick/useState, que Server Component nao permite.
export default function EmailLinkCard({
  itemId, email, titulo, descricao, iconeBg, iconeBorder, iconeCor, setaCor, textoCopiado,
}: {
  itemId?: string
  email: string
  titulo: string
  descricao?: string | null
  iconeBg: string
  iconeBorder: string
  iconeCor: string
  setaCor: string
  textoCopiado?: string
}) {
  const [copiado, setCopiado] = useState(false)

  async function copiarEmail() {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      // Fallback pra navegadores/contextos sem permissao de clipboard (ex: http sem https)
      const temp = document.createElement('textarea')
      temp.value = email
      document.body.appendChild(temp)
      temp.select()
      document.execCommand('copy')
      document.body.removeChild(temp)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2200)
  }

  return (
    <button type="button" onClick={copiarEmail} className="crd link-card" style={{ textDecoration: 'none', color: 'inherit', border: `1px solid ${iconeBorder}`, width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit', margin: 0 }} data-track-tipo="link_rapido_click" data-track-item-id={itemId} data-track-item-titulo={titulo} data-track-item-url={`mailto:${email}`}>
      <div className="link-icon" style={{ background: iconeBg, border: `1px solid ${iconeBorder}`, color: iconeCor }}>
        <Mail size={21} color={iconeCor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="link-title">{titulo}</p>
        <p className="link-sub">{copiado ? (textoCopiado || 'E-mail copiado!') : (descricao || email)}</p>
      </div>
      <span className="link-arrow" style={{ color: setaCor }}>{copiado ? '✓' : '›'}</span>
    </button>
  )
}
