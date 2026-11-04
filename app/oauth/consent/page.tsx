'use client'
// Etapa 3D: tela de consentimento. Client Component, no mesmo padrao do restante do Projeto A (supabase no navegador, sem @supabase/ssr,
// sem Server Actions). A identidade vem da sessao Supabase atual e e imposta PELO BANCO (auth.uid() dentro das RPCs): o navegador nunca
// envia user_id. Nada aqui escreve o req (token da solicitacao) em console, analytics ou mensagem de erro.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { criarTrava, decidirConsentimento, iniciarConsentimento, type ConsentDeps, type ConsentDados, type Decisao } from '../../lib/oauthConsent'
import ConsentView, { type Tela } from './ConsentView'

const deps: ConsentDeps = {
  temSessao: async () => {
    const { data, error } = await supabase.auth.getUser()
    return !error && !!data.user
  },
  rpc: async (fn, args) => {
    const { data, error } = await supabase.rpc(fn, args)
    return { data, error }
  },
}

export default function ConsentimentoPage() {
  const [tela, setTela] = useState<Tela>({ tipo: 'carregando' })
  const reqRef = useRef<string | null>(null)
  const trava = useMemo(() => criarTrava<Decisao>(), [])

  // o estado inicial ja e 'carregando': nenhum setState sincrono dentro do efeito (so apos o await)
  const iniciar = useCallback(async () => {
    const r = await iniciarConsentimento(window.location.search, deps)
    if (r.tipo === 'login') {
      window.location.replace(r.url)
      return
    }
    if (r.tipo === 'invalido') setTela({ tipo: 'invalido' })
    else if (r.tipo === 'erro') setTela({ tipo: 'erro', codigo: r.codigo, retentavel: r.codigo === 'rede' })
    else {
      reqRef.current = r.req
      setTela({ tipo: 'pronto', dados: r.dados })
    }
  }, [])

  useEffect(() => {
    // StrictMode (dev) executa duas vezes: a leitura e idempotente (so consulta)
    iniciar()
  }, [iniciar])

  function tentarNovamente() {
    setTela({ tipo: 'carregando' })
    iniciar()
  }

  async function decidir(aprovar: boolean, dados: ConsentDados) {
    const req = reqRef.current
    if (!req) return
    setTela({ tipo: 'enviando', dados, acao: aprovar ? 'aprovar' : 'negar' })
    const r = await trava(() => decidirConsentimento(req, dados, aprovar, deps))
    if (r.tipo === 'redirect') {
      // tira o req do historico ANTES de sair (o botao Voltar nao reabre um pedido ja decidido)
      window.history.replaceState(null, '', '/oauth/consent')
      setTela({ tipo: 'concluido', negou: !aprovar })
      window.location.replace(r.url)
      return
    }
    if (r.tipo === 'login') {
      window.location.replace(r.url)
      return
    }
    setTela({ tipo: 'erro', codigo: r.codigo, retentavel: r.retentavel })
  }

  return (
    <>
      <meta name="referrer" content="no-referrer" />
      <meta name="robots" content="noindex, nofollow" />
      <ConsentView
        tela={tela}
        onAutorizar={() => tela.tipo === 'pronto' && decidir(true, tela.dados)}
        onCancelar={() => tela.tipo === 'pronto' && decidir(false, tela.dados)}
        onTentarNovamente={tentarNovamente}
      />
    </>
  )
}
