'use client'
import { IDIOMAS, NOMES_IDIOMAS } from '../lib/i18n-global/idiomas'
import { useIdiomaGlobal } from './IdiomaProviderGlobal'

/** Seletor pronto para integrar na landing, painel ou configuracoes. Nao altera moedas nem URLs. */
export default function SeletorIdiomaGlobal({ compacto = false }: { compacto?: boolean }) {
  const { idioma, definirIdioma, t } = useIdiomaGlobal()
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {!compacto && <span>{t('account.language')}</span>}
      <select
        aria-label={t('account.language')}
        value={idioma}
        onChange={(evento) => definirIdioma(evento.target.value as typeof idioma)}
        style={{ padding: '8px 10px', borderRadius: 8, maxWidth: '100%' }}
      >
        {IDIOMAS.map((opcao) => <option key={opcao} value={opcao}>{NOMES_IDIOMAS[opcao]}</option>)}
      </select>
    </label>
  )
}
