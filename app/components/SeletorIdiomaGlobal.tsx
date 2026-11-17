'use client'
import { IDIOMAS, NOMES_IDIOMAS } from '../lib/i18n-global/idiomas'
import { useIdiomaGlobal } from './IdiomaProviderGlobal'

/** Seletor de idioma com contraste legivel tambem na lista nativa do Windows. */
export default function SeletorIdiomaGlobal({ compacto = false }: { compacto?: boolean }) {
  const { idioma, definirIdioma, t } = useIdiomaGlobal()

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {!compacto && <span>{t('account.language')}</span>}
      <select
        aria-label={t('account.language')}
        value={idioma}
        onChange={(evento) => definirIdioma(evento.target.value as typeof idioma)}
        style={{
          padding: '8px 10px',
          borderRadius: 8,
          maxWidth: '100%',
          backgroundColor: '#1d1527',
          color: '#ffffff',
          border: '1px solid #6c597c',
          colorScheme: 'dark',
          cursor: 'pointer',
        }}
      >
        {IDIOMAS.map((opcao) => (
          <option
            key={opcao}
            value={opcao}
            style={{ backgroundColor: '#1d1527', color: '#ffffff' }}
          >
            {NOMES_IDIOMAS[opcao]}
          </option>
        ))}
      </select>
    </label>
  )
}
