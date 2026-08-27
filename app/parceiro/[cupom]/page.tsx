'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;background:#08060A}
.pg{min-height:100vh;width:100%;background:radial-gradient(circle at top left,rgba(139,92,246,.12),transparent 32%),#120A14}
.bdy{max-width:900px;margin:0 auto;padding:32px 20px 60px;width:100%}
.card{background:linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px;padding:20px}
.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700}
.inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:10px;padding:9px 12px;color:#F8F4F7;font-size:13px;outline:none;font-family:inherit}
.lbl{display:block;font-size:10px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
@media(max-width:640px){
  .kpi{grid-template-columns:1fr 1fr!important}
  .resumo-plano{grid-template-columns:1fr!important}
}
`

const PLANOS_COMISSAO: Record<string, { mensalidade: number; comissao: number; nomeComercial: string }> = {
  minipage: { mensalidade: 29.90, comissao: 14.95, nomeComercial: 'MiniPage' },
  essencial: { mensalidade: 79.90, comissao: 39.95, nomeComercial: 'Profissional' },
  equipe: { mensalidade: 149.90, comissao: 74.95, nomeComercial: 'Equipe' },
}
// 'profissional' e 'essencial' apontam pro mesmo plano comercial (Profissional). Qualquer
// coisa fora dessas 3 chaves cai no fallback 'essencial', igual ao painel admin.
function planoValido(pt: string | null | undefined) {
  if (pt === 'minipage') return 'minipage'
  if (pt === 'equipe') return 'equipe'
  return 'essencial'
}
function comissaoDoIndicado(ind: any) {
  return PLANOS_COMISSAO[planoValido(ind?.plano_tipo)].comissao
}
const ehPagante = (ind: any) => ind.is_pagante || ind.status === 'pagante'
const fBRL = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

type FiltroPeriodo = 'hoje' | 'semana' | 'mes' | 'mes_passado' | 'tudo' | 'personalizado'

function calcularIntervalo(periodo: FiltroPeriodo, ini: string, fim: string): { inicio: Date; fim: Date } | null {
  const agora = new Date()
  const hojeInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0)
  const hojeFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59)
  if (periodo === 'hoje') return { inicio: hojeInicio, fim: hojeFim }
  if (periodo === 'semana') {
    const inicioSemana = new Date(hojeInicio)
    inicioSemana.setDate(hojeInicio.getDate() - agora.getDay())
    return { inicio: inicioSemana, fim: hojeFim }
  }
  if (periodo === 'mes') return { inicio: new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0), fim: hojeFim }
  if (periodo === 'mes_passado') {
    return {
      inicio: new Date(agora.getFullYear(), agora.getMonth() - 1, 1, 0, 0, 0),
      fim: new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59),
    }
  }
  if (periodo === 'personalizado' && ini && fim) {
    const [ai, am, ad] = ini.split('-').map(Number)
    const [bi, bm, bd] = fim.split('-').map(Number)
    return { inicio: new Date(ai, am - 1, ad, 0, 0, 0), fim: new Date(bi, bm - 1, bd, 23, 59, 59) }
  }
  return null
}

export default function PainelParceiroPublico() {
  const params = useParams()
  const cupom = String(params?.cupom || '')

  const [carregando, setCarregando] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [parceiro, setParceiro] = useState<any>(null)
  const [indicacoes, setIndicacoes] = useState<any[]>([])
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('tudo')
  const [dataIni, setDataIni] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    if (!cupom) return
    fetch(`/api/parceiro/${encodeURIComponent(cupom)}`)
      .then(async (res) => {
        if (!res.ok) { setNaoEncontrado(true); return }
        const data = await res.json()
        setParceiro(data.parceiro)
        setIndicacoes(data.indicacoes || [])
      })
      .catch(() => setNaoEncontrado(true))
      .finally(() => setCarregando(false))
  }, [cupom])

  const intervalo = calcularIntervalo(filtroPeriodo, dataIni, dataFim)
  const indsFiltradas = indicacoes.filter(ind => {
    if (!intervalo) return true
    if (!ind.created_at) return false
    const d = new Date(ind.created_at)
    return d >= intervalo.inicio && d <= intervalo.fim
  })
  const pagsFiltradas = indsFiltradas.filter(ehPagante)
  const pendenteFiltrado = pagsFiltradas.filter(i => i.comissao_status !== 'paga').reduce((a, i) => a + comissaoDoIndicado(i), 0)
  const pagoFiltrado = indsFiltradas.filter(i => i.comissao_status === 'paga').reduce((a, i) => a + comissaoDoIndicado(i), 0)

  const comPlanoDefinido = indsFiltradas.filter(i => i.plano_tipo !== null && i.plano_tipo !== undefined && i.plano_tipo !== '')
  const resumoPorPlano = (['minipage', 'essencial', 'equipe'] as const).map(chave => {
    const doPlano = comPlanoDefinido.filter(i => planoValido(i.plano_tipo) === chave)
    const pagantesDoPlano = doPlano.filter(ehPagante)
    const comissao = pagantesDoPlano.reduce((a, i) => a + comissaoDoIndicado(i), 0)
    return { chave, nome: PLANOS_COMISSAO[chave].nomeComercial, cadastros: doPlano.length, pagantes: pagantesDoPlano.length, comissao }
  })

  if (carregando) {
    return (
      <div className="pg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <p style={{ color: '#B8AAB8', fontFamily: 'system-ui', fontSize: '14px' }}>Carregando...</p>
      </div>
    )
  }

  if (naoEncontrado || !parceiro) {
    return (
      <div className="pg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px 28px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
          <div style={{ fontSize: '32px', marginBottom: '14px' }}>🔍</div>
          <p style={{ fontSize: '18px', fontWeight: 800, color: '#F8F4F7', marginBottom: '8px' }}>Parceiro não encontrado</p>
          <p style={{ fontSize: '13px', color: '#B8AAB8' }}>Verifique se o link está correto.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pg" style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bdy">

        {/* Cabecalho do parceiro */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg,rgba(236,72,153,.2),rgba(139,92,246,.2))', border: '1px solid rgba(236,72,153,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: '#EC4899', flexShrink: 0 }}>
            {(parceiro.nome || '?').charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '4px' }}>{parceiro.nome}</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#EC4899', background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.28)', padding: '2px 8px', borderRadius: '6px' }}>{parceiro.cupom}</span>
              {parceiro.tipo && <span style={{ fontSize: '11px', color: '#B8AAB8' }}>{parceiro.tipo}</span>}
              <span className="badge" style={{ background: parceiro.ativo ? 'rgba(34,197,94,.14)' : 'rgba(239,68,68,.14)', border: `1px solid ${parceiro.ativo ? 'rgba(34,197,94,.28)' : 'rgba(239,68,68,.28)'}`, color: parceiro.ativo ? '#22C55E' : '#EF4444' }}>{parceiro.ativo ? 'Ativo' : 'Inativo'}</span>
            </div>
          </div>
        </div>

        {/* Filtro de periodo */}
        <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
          <label className="lbl">Período</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: filtroPeriodo === 'personalizado' ? '10px' : 0 }}>
            {([['hoje', 'Hoje'], ['semana', 'Esta semana'], ['mes', 'Este mês'], ['mes_passado', 'Mês passado'], ['tudo', 'Todo período'], ['personalizado', 'Personalizado']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFiltroPeriodo(v)} style={{ padding: '6px 12px', borderRadius: '8px', border: filtroPeriodo === v ? 'none' : '1px solid #2A1A2F', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, background: filtroPeriodo === v ? 'linear-gradient(135deg,#EC4899,#8B5CF6)' : 'rgba(24,16,27,.88)', color: filtroPeriodo === v ? '#fff' : '#B8AAB8' }}>{l}</button>
            ))}
          </div>
          {filtroPeriodo === 'personalizado' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label className="lbl">De</label><input type="date" className="inp" value={dataIni} onChange={e => setDataIni(e.target.value)} /></div>
              <div><label className="lbl">Até</label><input type="date" className="inp" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="kpi">
          {[
            { l: 'Cadastros', v: String(indsFiltradas.length), c: '#B8AAB8' },
            { l: 'Pagantes', v: String(pagsFiltradas.length), c: '#22C55E' },
            { l: 'Comissão pendente', v: fBRL(pendenteFiltrado), c: '#FACC15' },
            { l: 'Comissão paga', v: fBRL(pagoFiltrado), c: '#22C55E' },
          ].map(k => (
            <div key={k.l} style={{ background: '#18101B', border: '1.5px solid #2A1A2F', borderRadius: '14px', padding: '14px 10px' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>{k.l}</p>
              <p style={{ fontSize: '16px', fontWeight: 800, color: k.c }}>{k.v}</p>
            </div>
          ))}
        </div>

        {/* Resumo por plano */}
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '10px' }}>Resumo por plano</p>
        <div className="resumo-plano" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '24px' }}>
          {resumoPorPlano.map(r => (
            <div key={r.chave} style={{ background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.20)', borderRadius: '12px', padding: '12px 10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#C4B5FD', marginBottom: '8px' }}>{r.nome}</p>
              <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '2px' }}>Cadastros: <span style={{ color: '#F8F4F7', fontWeight: 700 }}>{r.cadastros}</span></p>
              <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '2px' }}>Pagantes: <span style={{ color: '#22C55E', fontWeight: 700 }}>{r.pagantes}</span></p>
              <p style={{ fontSize: '11px', color: '#B8AAB8' }}>Comissão: <span style={{ color: '#EC4899', fontWeight: 700 }}>{fBRL(r.comissao)}</span></p>
            </div>
          ))}
        </div>

        {/* Lista de indicacoes */}
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '10px' }}>Clientes indicados no período ({indsFiltradas.length})</p>
        {indsFiltradas.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#B8AAB8' }}>Nenhuma indicação neste período.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
            {indsFiltradas.map(ind => {
              const temPlano = ind.plano_tipo !== null && ind.plano_tipo !== undefined && ind.plano_tipo !== ''
              const infoPlano = PLANOS_COMISSAO[planoValido(ind.plano_tipo)]
              const comissao = temPlano ? comissaoDoIndicado(ind) : 0
              return (
                <div key={ind.id} style={{ padding: '14px', border: '1px solid #2A1A2F', borderRadius: '12px', background: 'rgba(24,16,27,.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '2px' }}>{ind.nome_negocio || ind.nome_responsavel || '—'}</p>
                      {ind.slug && <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '1px' }}>minipage.pro/{ind.slug}</p>}
                      <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '6px' }}>{ind.email || '—'}</p>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.26)', color: '#C4B5FD' }}>{temPlano ? infoPlano.nomeComercial : 'Não definido'}</span>
                        <span className="badge" style={{ background: ehPagante(ind) ? 'rgba(34,197,94,.12)' : 'rgba(236,72,153,.12)', border: `1px solid ${ehPagante(ind) ? 'rgba(34,197,94,.24)' : 'rgba(236,72,153,.24)'}`, color: ehPagante(ind) ? '#22C55E' : '#EC4899' }}>{ehPagante(ind) ? 'Pagante' : 'Cadastro'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                      <p style={{ fontSize: '10px', color: '#B8AAB8', marginBottom: '4px' }}>{ind.created_at ? new Date(ind.created_at).toLocaleDateString('pt-BR') : '—'}</p>
                      <p style={{ fontSize: '11px', color: '#B8AAB8', marginBottom: '2px' }}>{temPlano ? fBRL(infoPlano.mensalidade) : '—'}</p>
                      <p style={{ fontSize: '13px', color: '#EC4899', fontWeight: 800 }}>{fBRL(comissao)}</p>
                      {ehPagante(ind) && <p style={{ fontSize: '10px', color: ind.comissao_status === 'paga' ? '#22C55E' : '#FACC15' }}>{ind.comissao_status === 'paga' ? 'Comissão paga' : 'Comissão pendente'}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Rodape */}
        <div style={{ textAlign: 'center' as const, paddingTop: '20px', borderTop: '1px solid #2A1A2F' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#B8AAB8' }}>Painel de parceiro MiniPage Pro</p>
          <p style={{ fontSize: '11px', color: '#6B5F6E', marginTop: '2px' }}>Uma solução ClienteMarcado</p>
        </div>

      </div>
    </div>
  )
}
