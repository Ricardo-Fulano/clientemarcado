'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CHAVE_IDIOMA, IDIOMA_PADRAO, normalizarIdioma, type Idioma } from '../lib/i18n-global/idiomas'
import { traduzir, type ChaveTraducao } from '../lib/i18n-global/traducoes'

type Contexto = { idioma: Idioma; definirIdioma: (idioma: Idioma) => void; t: (chave: ChaveTraducao) => string }
const IdiomaContexto = createContext<Contexto | null>(null)

/** Deve ser colocado em um layout compartilhado apenas quando integrarmos as telas. */
export function IdiomaProviderGlobal({ children, idiomaInicial = IDIOMA_PADRAO }: { children: ReactNode; idiomaInicial?: Idioma }) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaInicial)
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_IDIOMA)
      if (salvo) setIdioma(normalizarIdioma(salvo))
    } catch { /* navegacao privada: preferencia fica nesta visita */ }
  }, [])
  useEffect(() => {
    // Mantem o idioma semantico do documento alinhado ao seletor manual.
    document.documentElement.lang = idioma
  }, [idioma])
  const definirIdioma = useCallback((proximo: Idioma) => {
    const valido = normalizarIdioma(proximo)
    setIdioma(valido)
    try { window.localStorage.setItem(CHAVE_IDIOMA, valido) } catch { /* silencioso */ }
  }, [])
  const t = useCallback((chave: ChaveTraducao) => traduzir(idioma, chave), [idioma])
  const valor = useMemo(() => ({ idioma, definirIdioma, t }), [idioma, definirIdioma, t])
  return <IdiomaContexto.Provider value={valor}>{children}</IdiomaContexto.Provider>
}

export function useIdiomaGlobal(): Contexto {
  const valor = useContext(IdiomaContexto)
  if (!valor) throw new Error('IdiomaProviderGlobal deve envolver o componente consumidor')
  return valor
}
