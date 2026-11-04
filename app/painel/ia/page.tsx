'use client'
// Etapa 3D: conexoes de IA da conta. Usa SOMENTE mcp_grants_list e mcp_grant_revoke (identidade por auth.uid() dentro do banco).
// Nao le tabelas mcp, nao usa service_role, nao reimplementa regra de plano (o banco informa o status).
import { useCallback, useEffect, useState } from 'react'
import PainelSidebar from '@/app/components/PainelSidebar'
import { supabase } from '../../lib/supabase'
import { ESCOPOS, listarConexoes, revogarConexao, type ConsentDeps, type Conexao } from '../../lib/oauthConsent'

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

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const STATUS: Record<Conexao['status'], { texto: string; cor: string }> = {
  active: { texto: 'Ativa', cor: '#34D399' },
  suspended_beta: { texto: 'Suspensa: recurso em fase de testes para esta conta', cor: '#FCD34D' },
  suspended_plan: { texto: 'Suspensa: o plano atual não inclui este recurso', cor: '#FCD34D' },
  desconhecido: { texto: 'Status indisponível', cor: '#B8AAB8' },
}

function fmtData(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : ''
}

export default function IntegracoesIAPage() {
  const [carregando, setCarregando] = useState(true)
  const [conexoes, setConexoes] = useState<Conexao[]>([])
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [revogando, setRevogando] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      window.location.assign('/login')
      return
    }
    const r = await listarConexoes(deps)
    if (r.tipo === 'login') {
      window.location.assign('/login')
      return
    }
    if (r.tipo === 'erro') setErro('Não foi possível carregar suas conexões agora. Tente novamente em instantes.')
    else {
      setConexoes(r.conexoes)
      setErro('')
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function revogar(id: string) {
    if (revogando) return
    setRevogando(id)
    setAviso('')
    const r = await revogarConexao(id, deps)
    setRevogando(null)
    setConfirmando(null)
    if (r === 'login') {
      window.location.assign('/login')
      return
    }
    if (r === 'erro') {
      setErro('Não foi possível revogar o acesso agora. Tente novamente.')
      return
    }
    setErro('')
    setAviso(r === 'ok' ? 'Acesso revogado. O aplicativo não consegue mais ver seus dados.' : 'Este acesso já havia sido revogado.')
    await carregar()
  }

  const btn: React.CSSProperties = { borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: `.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.09),transparent 55%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px}` }} />
      <PainelSidebar tituloMobile="Integrações com IA" />
      <div className="psb-main">
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 24px 80px' }}>
          <p style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em', marginBottom: '6px' }}>Integrações com IA</p>
          <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '22px', maxWidth: '620px' }}>
            Aqui ficam os aplicativos de IA que você autorizou a consultar suas métricas. O acesso é somente leitura e você pode revogá-lo a qualquer momento.
          </p>

          {aviso && <div className="crd" role="status" style={{ padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#34D399' }}>{aviso}</div>}
          {erro && <div className="crd" role="alert" style={{ padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#F87171' }}>{erro}</div>}

          {carregando ? (
            <p style={{ fontSize: '13px', color: '#B8AAB8' }}>Carregando...</p>
          ) : conexoes.length === 0 && !erro ? (
            <div className="crd" style={{ padding: '36px 28px', textAlign: 'center' }}>
              <p style={{ fontSize: '17px', fontWeight: 800, color: '#F8F4F7', marginBottom: '8px' }}>Nenhum aplicativo conectado</p>
              <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.6, maxWidth: '460px', margin: '0 auto' }}>
                Quando você autorizar um assistente de IA compatível a consultar suas métricas, ele aparecerá aqui.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {conexoes.map((c) => (
                <div key={c.id} className="crd" style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#F8F4F7', overflowWrap: 'anywhere' }}>{c.cliente}</p>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: STATUS[c.status].cor, marginTop: '4px' }}>{STATUS[c.status].texto}</p>
                    </div>
                    {confirmando === c.id ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" disabled={revogando !== null} onClick={() => revogar(c.id)} style={{ ...btn, background: G, color: '#fff', border: 'none', opacity: revogando ? 0.6 : 1 }}>
                          {revogando === c.id ? 'Revogando...' : 'Confirmar revogação'}
                        </button>
                        <button type="button" disabled={revogando !== null} onClick={() => setConfirmando(null)} style={{ ...btn, background: 'rgba(24,16,27,.9)', color: '#F8F4F7', border: '1px solid #2A1A2F' }}>Voltar</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setConfirmando(c.id); setAviso('') }} style={{ ...btn, background: 'rgba(24,16,27,.9)', color: '#F8F4F7', border: '1px solid #2A1A2F' }}>Revogar acesso</button>
                    )}
                  </div>
                  {c.escopos.length > 0 && (
                    <ul style={{ listStyle: 'none', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {c.escopos.map((e) => (
                        <li key={e} style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.5 }}>
                          <span style={{ color: '#F8F4F7', fontWeight: 700 }}>{ESCOPOS[e].titulo}.</span> {ESCOPOS[e].texto}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p style={{ fontSize: '12px', color: '#B8AAB8', marginTop: '12px' }}>
                    {c.criadaEm ? `Conectado em ${fmtData(c.criadaEm)}` : ''}
                    {c.criadaEm ? ' · ' : ''}
                    {c.ultimoUso ? `Último uso em ${fmtData(c.ultimoUso)}` : 'Ainda não utilizado'}
                    {` · ${c.consultas7d} ${c.consultas7d === 1 ? 'consulta' : 'consultas'} nos últimos 7 dias`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
