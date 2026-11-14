/** Idiomas preparados; a preferencia de idioma nao define pais, moeda nem tributacao. */
export const IDIOMAS = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'] as const
export type Idioma = (typeof IDIOMAS)[number]
export const IDIOMA_PADRAO: Idioma = 'pt-BR'
export const CHAVE_IDIOMA = 'minipage_idioma_interface_v1'

export const NOMES_IDIOMAS: Record<Idioma, string> = {
  'pt-BR': 'Português (Brasil)',
  'en-US': 'English',
  'es-ES': 'Español',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'it-IT': 'Italiano',
}

/** Suporta variantes como fr-CA e es-MX sem atribuir moeda por idioma. */
export function normalizarIdioma(valor: unknown): Idioma {
  if (typeof valor !== 'string') return IDIOMA_PADRAO
  const limpo = valor.trim().replace(/_/g, '-').toLowerCase()
  const canonico = IDIOMAS.find((idioma) => idioma.toLowerCase() === limpo)
  if (canonico) return canonico
  const raiz = limpo.split('-')[0]
  const porFamilia: Record<string, Idioma> = {
    pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT',
  }
  return porFamilia[raiz] ?? IDIOMA_PADRAO
}

/** Traduz SOMENTE elementos de interface controlados pelo MiniPage. */
export function resolverIdiomaPublico(idiomaEscolhidoPeloVisitante?: string | null, idiomaDaPagina?: string | null): Idioma {
  if (idiomaEscolhidoPeloVisitante?.trim()) return normalizarIdioma(idiomaEscolhidoPeloVisitante)
  if (idiomaDaPagina?.trim()) return normalizarIdioma(idiomaDaPagina)
  return IDIOMA_PADRAO
}
