'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { normalizarPlano, obterNomePlano } from '../../lib/planos'

const fBRL = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fData = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('pt-BR') : '—'

function labelCompetencia(competencia: string) {
  const [ano, mes] = competencia.split('-')
  const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${nomes[parseInt(mes, 10) - 1]}/${ano}`
}

function labelStatusAcesso(s: string | null) {
  if (s === 'ativo') return { texto: 'Ativo', cor: '#22C55E', bg: 'rgba(34,197,94,.12)', borda: 'rgba(34,197,94,.24)' }
  if (s === 'em_atraso') return { texto: 'Em atraso', cor: '#FACC15', bg: 'rgba(250,204,21,.12)', borda: 'rgba(250,204,21,.28)' }
  if (s === 'cancelado') return { texto: 'Cancelado', cor: '#F87171', bg: 'rgba(248,113,113,.12)', borda: 'rgba(248,113,113,.28)' }
  return null
}

function labelStatusComissao(s: string) {
  if (s === 'paga') return { texto: 'Paga', cor: '#22C55E' }
  if (s === 'estornada') return { texto: 'Estornada', cor: '#F87171' }
  return { texto: 'Pendente', cor: '#FACC15' }
}

export default function PainelAfiliado() {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [dados, setDados] = useState<any>(null)
  const [aba, setAba] = useState<'clientes' | 'comissoes' | 'repasses'>('clientes')
  const [msgCopiado, setMsgCopiado] = useState('')
  // Ajuste 2: so mostra "Voltar ao painel" se o usuario TEM MiniPage - senao /painel
  // redirecionaria de volta pra ca (guard da Fase 4C.41-42), criando loop.
  const [temMiniPage, setTemMiniPage] = useState<boolean | null>(null)
  // Ajuste 3: filtro compartilhado entre Clientes e Comissoes; nunca filtra Repasses
  // (agregado por parceiro+competencia, pode ter varios planos misturados).
  const [filtroPlano, setFiltroPlano] = useState<'all' | 'minipage' | 'loja' | 'essencial' | 'equipe'>('all')

  useEffect(() => { carregar(); verificarMiniPage() }, [])

  async function verificarMiniPage() {
    // Mesmo padrao ja usado no PainelSidebar (supabase.from('perfis')...) - checagem do
    // proprio perfil do usuario logado, nao relacionado a seguranca de parceiros.
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setTemMiniPage(false); return }
      const { data: perfil } = await supabase.from('perfis').select('id').eq('user_id', user.id).maybeSingle()
      setTemMiniPage(!!perfil)
    } catch {
      setTemMiniPage(false)
    }
  }

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setErro('Sessão expirada. Faça login novamente.'); setCarregando(false); return }
      const res = await fetch('/api/afiliado', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (!res.ok) { setErro(json?.error || 'Não foi possível carregar seus dados.'); setCarregando(false); return }
      setDados(json)
    } catch (e: any) {
      setErro('Erro de conexão.')
    }
    setCarregando(false)
  }

  function copiar(texto: string, msg: string) {
    navigator.clipboard.writeText(texto)
    setMsgCopiado(msg)
    setTimeout(() => setMsgCopiado(''), 2500)
  }

  if (carregando) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
        <div style={{ height: '26px', width: '220px', background: 'rgba(255,255,255,.05)', borderRadius: '8px', marginBottom: '28px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px' }}>
          {[0, 1, 2, 3, 4].map(i => <div key={i} style={{ height: '84px', background: 'rgba(24,16,27,.6)', border: '1.5px solid rgba(236,72,153,.16)', borderRadius: '16px' }} />)}
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: '600px' }}>
        <p style={{ fontSize: '18px', fontWeight: 800, color: '#F8F4F7', marginBottom: '10px' }}>Meu painel de afiliado</p>
        <p style={{ fontSize: '14px', color: '#F87171' }}>{erro}</p>
      </div>
    )
  }

  if (!dados) return null

  const { parceiro, resumo, indicacoes, comissoes, repasses } = dados

  // Ajuste 5-8: desempenho por plano - so agrega dados que ja pertencem a este afiliado
  // (indicacoes/comissoes ja vieram filtradas por parceiro_id no backend). Pagante = mesma
  // regra financeira ja consolidada (comissao valida), nunca is_pagante legado.
  const comissoesValidasPorIndicacao = new Set(
    comissoes.filter((c: any) => c.status === 'pendente' || c.status === 'paga').map((c: any) => c.indicacaoId)
  )
  const desempenhoPorPlano = (['minipage', 'loja', 'essencial', 'equipe'] as const).map(chave => {
    const indicadosDoPlano = indicacoes.filter((i: any) => normalizarPlano(i.planoTipo) === chave)
    const pagantesDoPlano = indicadosDoPlano.filter((i: any) => comissoesValidasPorIndicacao.has(i.id)).length
    const comissaoDoPlano = comissoes
      .filter((c: any) => normalizarPlano(c.planoTipo) === chave && (c.status === 'pendente' || c.status === 'paga'))
      .reduce((a: number, c: any) => a + Number(c.valorComissao || 0), 0)
    return { chave, nome: obterNomePlano(chave), indicados: indicadosDoPlano.length, pagantes: pagantesDoPlano, comissao: comissaoDoPlano }
  }).filter(p => p.indicados > 0) // nao poluir com planos sem nenhum indicado

  // Ajuste 3-4: filtro compartilhado - nunca aplicado a repasses.
  const indicacoesFiltradas = filtroPlano === 'all' ? indicacoes : indicacoes.filter((i: any) => normalizarPlano(i.planoTipo) === filtroPlano)
  const comissoesFiltradas = filtroPlano === 'all' ? comissoes : comissoes.filter((c: any) => normalizarPlano(c.planoTipo) === filtroPlano)
  const linkIndicacao = `${typeof window !== 'undefined' ? window.location.origin : ''}/cadastro?cupom=${parceiro.cupom}`

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      {temMiniPage === true && (
        <Link href="/painel" style={{ display: 'inline-block', fontSize: '12.5px', color: '#B8AAB8', marginBottom: '10px', textDecoration: 'none' }}>← Voltar ao painel</Link>
      )}
      <p style={{ fontSize: '20px', fontWeight: 800, color: '#F8F4F7', marginBottom: '4px' }}>Meu painel de afiliado</p>
      <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '18px' }}>Acompanhe suas indicações, comissões e repasses.</p>

      {!parceiro.ativo && (
        <div style={{ background: 'rgba(250,204,21,.08)', border: '1px solid rgba(250,204,21,.28)', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#FACC15', marginBottom: '2px' }}>Parceria inativa</p>
          <p style={{ fontSize: '12.5px', color: '#B8AAB8' }}>Novas indicações estão desabilitadas, mas seu histórico e repasses continuam disponíveis.</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#EC4899', background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.28)', padding: '5px 12px', borderRadius: '8px' }}>Cupom: {parceiro.cupom}</span>
        <button className="btn-s" onClick={() => copiar(parceiro.cupom, 'Cupom copiado!')}>Copiar cupom</button>
        <button className="btn-s" onClick={() => copiar(linkIndicacao, 'Link copiado!')}>Copiar link de indicação</button>
        {msgCopiado && <span style={{ fontSize: '12px', color: '#22C55E' }}>{msgCopiado}</span>}
      </div>

      {/* Cards principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px', marginBottom: '14px' }}>
        {[
          { l: 'Clientes indicados', v: String(resumo.totalIndicados), c: '#B8AAB8' },
          { l: 'Pagantes', v: String(resumo.pagantes), c: '#22C55E' },
          { l: 'Comissão deste mês', v: fBRL(resumo.comissaoDesteMes), c: '#EC4899' },
          { l: 'A receber', v: fBRL(resumo.aReceber), c: '#FACC15' },
          { l: 'Total recebido', v: fBRL(resumo.totalRecebido), c: '#22C55E' },
        ].map(k => (
          <div key={k.l} style={{ background: '#18101B', border: '1.5px solid #2A1A2F', borderRadius: '14px', padding: '14px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase' as const, letterSpacing: '.05em', marginBottom: '4px' }}>{k.l}</p>
            <p style={{ fontSize: '17px', fontWeight: 800, color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Segunda linha - status dos clientes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '10px', marginBottom: '24px' }}>
        {[
          { l: 'Ativos', v: String(resumo.ativos), c: '#22C55E' },
          { l: 'Em atraso', v: String(resumo.emAtraso), c: '#FACC15' },
          { l: 'Cancelados', v: String(resumo.cancelados), c: '#F87171' },
        ].map(k => (
          <div key={k.l} style={{ background: 'rgba(24,16,27,.5)', border: '1px solid #2A1A2F', borderRadius: '12px', padding: '10px 14px' }}>
            <p style={{ fontSize: '10px', color: '#B8AAB8', marginBottom: '2px' }}>{k.l}</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Desempenho por plano - compacto, nao compete visualmente com os cards principais */}
      {desempenhoPorPlano.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase' as const, letterSpacing: '.05em', marginBottom: '8px' }}>Desempenho por plano</p>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' as const, paddingBottom: '4px' }}>
            {desempenhoPorPlano.map(p => (
              <div key={p.chave} style={{ flexShrink: 0, minWidth: '160px', background: 'rgba(24,16,27,.5)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '10px 12px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#F8F4F7', marginBottom: '4px' }}>{p.nome}</p>
                <p style={{ fontSize: '11px', color: '#B8AAB8' }}>{p.indicados} indicado{p.indicados !== 1 ? 's' : ''} · {p.pagantes} pagante{p.pagantes !== 1 ? 's' : ''}</p>
                <p style={{ fontSize: '12px', color: '#EC4899', fontWeight: 700 }}>{fBRL(p.comissao)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtro por plano - compartilhado entre Clientes e Comissoes, nunca aplicado a Repasses */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase' as const, letterSpacing: '.05em', marginBottom: '5px' }}>Plano</label>
        <select value={filtroPlano} onChange={e => setFiltroPlano(e.target.value as any)}
          style={{ background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', borderRadius: '10px', padding: '8px 12px', color: '#F8F4F7', fontSize: '13px', fontFamily: 'inherit' }}>
          <option value="all">Todos os planos</option>
          {(['minipage', 'loja', 'essencial', 'equipe'] as const).map(chave => (
            <option key={chave} value={chave}>{obterNomePlano(chave)}</option>
          ))}
        </select>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['clientes', 'comissoes', 'repasses'] as const).map(a => (
          <button key={a} onClick={() => setAba(a)}
            className={aba === a ? '' : 'btn-s'}
            style={{ padding: '8px 18px', borderRadius: '10px', border: aba === a ? 'none' : undefined, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, background: aba === a ? 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)' : undefined, color: aba === a ? '#fff' : undefined }}>
            {a === 'clientes' ? 'Clientes' : a === 'comissoes' ? 'Comissões' : 'Repasses'}
          </button>
        ))}
      </div>

      {aba === 'clientes' && (
        indicacoesFiltradas.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#B8AAB8', padding: '20px 0', textAlign: 'center' as const }}>Nenhum cliente indicado ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {indicacoesFiltradas.map((ind: any) => {
              const st = labelStatusAcesso(ind.statusAcesso)
              return (
                <div key={ind.id} style={{ border: '1px solid #2A1A2F', borderRadius: '14px', padding: '14px 16px', background: 'rgba(24,16,27,.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7' }}>{ind.nomeNegocio || ind.nomeResponsavel || '—'}</p>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.26)', color: '#C4B5FD' }}>{ind.planoTipo ? obterNomePlano(normalizarPlano(ind.planoTipo)) : '—'}</span>
                        {st && <span className="badge" style={{ background: st.bg, border: `1px solid ${st.borda}`, color: st.cor }}>{st.texto}</span>}
                      </div>
                      <p style={{ fontSize: '11px', color: '#B8AAB8', marginTop: '6px' }}>Cadastro: {fData(ind.createdAt)} · 1º pagamento: {fData(ind.primeiroPagamento)} · Último: {fData(ind.ultimoPagamento)}</p>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <p style={{ fontSize: '11px', color: '#B8AAB8' }}>{ind.comissoesValidasGeradas} comissõe{ind.comissoesValidasGeradas !== 1 ? 's' : ''} elegíveis geradas</p>
                      <p style={{ fontSize: '14px', color: '#EC4899', fontWeight: 800 }}>{fBRL(ind.comissaoAcumulada)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {aba === 'comissoes' && (
        comissoesFiltradas.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#B8AAB8', padding: '20px 0', textAlign: 'center' as const }}>Nenhuma comissão gerada ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {comissoesFiltradas.map((c: any) => {
              const st = labelStatusComissao(c.status)
              return (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '12px 14px', border: '1px solid #2A1A2F', borderRadius: '12px', background: 'rgba(24,16,27,.4)', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#F8F4F7', fontWeight: 600 }}>{fData(c.dataPagamentoCliente)} · {obterNomePlano(normalizarPlano(c.planoTipo))}</p>
                    <p style={{ fontSize: '11px', color: '#B8AAB8' }}>{labelCompetencia(c.competencia)} · Pago: {fBRL(Number(c.valorPago))}</p>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <p style={{ fontSize: '13px', color: '#EC4899', fontWeight: 700 }}>{fBRL(Number(c.valorComissao))}</p>
                    <p style={{ fontSize: '11px', color: st.cor }}>{st.texto}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {aba === 'repasses' && (
        repasses.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#B8AAB8', padding: '20px 0', textAlign: 'center' as const }}>Nenhum repasse registrado ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {repasses.map((r: any) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '12px 14px', border: '1px solid #2A1A2F', borderRadius: '12px', background: 'rgba(24,16,27,.4)', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7' }}>{labelCompetencia(r.competencia)}</p>
                  <p style={{ fontSize: '11px', color: '#B8AAB8' }}>{r.qtdComissoes} comissõe{r.qtdComissoes !== 1 ? 's' : ''} · Pago em {fData(r.dataRepasse)}</p>
                </div>
                <p style={{ fontSize: '14px', color: '#22C55E', fontWeight: 800 }}>{fBRL(Number(r.valorTotal))}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
