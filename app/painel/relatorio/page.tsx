'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function Relatorio() {
  const [relatorio, setRelatorio] = useState<any[]>([])
  const [totalReceita, setTotalReceita] = useState(0)
  const [totalDespesas, setTotalDespesas] = useState(0)
  const [mesAtual, setMesAtual] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)
  const [profAberto, setProfAberto] = useState<string | null>(null)

  useEffect(() => { carregarRelatorio() }, [mesAtual])

  async function carregarRelatorio() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const dataInicio = mesAtual + '-01'
    const dataFim = mesAtual + '-31'

    const { data: profs } = await supabase.from('profissionais').select('*').eq('user_id', user.id)
    const { data: agendamentos } = await supabase.from('agendamentos').select('*, servicos(nome, preco), profissionais(nome)').eq('user_id', user.id).gte('data_hora', dataInicio).lte('data_hora', dataFim)
    const { data: atendimentos } = await supabase.from('atendimentos').select('*, profissionais(nome)').eq('user_id', user.id).gte('created_at', dataInicio).lte('created_at', dataFim)
    const { data: despesas } = await supabase.from('despesas').select('*').eq('user_id', user.id).gte('data', dataInicio).lte('data', dataFim)

    const totalDesp = despesas?.reduce((acc, d) => acc + Number(d.valor), 0) || 0
    setTotalDespesas(totalDesp)

    const relPorProfissional = (profs || []).map((prof) => {
      const agsProf = (agendamentos || []).filter(a => a.profissional_id === prof.id)
      const atsProf = (atendimentos || []).filter(a =>
        a.profissional_id === prof.id ||
        a.profissional_nome_livre?.toLowerCase() === prof.nome.toLowerCase()
      )
      const receitaAgs = agsProf.reduce((acc, a) => acc + Number(a.servicos?.preco || 0), 0)
      const receitaAts = atsProf.reduce((acc, a) => acc + Number(a.valor || 0), 0)
      const totalProf = receitaAgs + receitaAts
      const servicosMap: Record<string, { quantidade: number; receita: number }> = {}
      agsProf.forEach(a => {
        const nome = a.servicos?.nome || '__sem_nome__'
        const preco = Number(a.servicos?.preco || 0)
        if (!servicosMap[nome]) servicosMap[nome] = { quantidade: 0, receita: 0 }
        servicosMap[nome].quantidade++; servicosMap[nome].receita += preco
      })
      atsProf.forEach(a => {
        const nome = a.servico_livre || a.categoria || 'Atendimento presencial'
        const preco = Number(a.valor || 0)
        if (!servicosMap[nome]) servicosMap[nome] = { quantidade: 0, receita: 0 }
        servicosMap[nome].quantidade++; servicosMap[nome].receita += preco
      })
      return {
        id: prof.id, nome: prof.nome,
        agendamentos: agsProf.length, atendimentos: atsProf.length, total: totalProf,
        servicos: Object.entries(servicosMap).map(([nome, dados]) => ({ nome, quantidade: dados.quantidade, receita: dados.receita }))
      }
    })

    const nomesProfs = (profs || []).map(p => p.nome.toLowerCase())
    const atsLivres = (atendimentos || []).filter(a =>
      !a.profissional_id && a.profissional_nome_livre &&
      !nomesProfs.includes(a.profissional_nome_livre.toLowerCase())
    )
    const livresMap: Record<string, any[]> = {}
    atsLivres.forEach(a => {
      const nome = a.profissional_nome_livre
      if (!livresMap[nome]) livresMap[nome] = []
      livresMap[nome].push(a)
    })
    const relLivres = Object.entries(livresMap).map(([nome, ats]) => {
      const servicosMap: Record<string, { quantidade: number; receita: number }> = {}
      ats.forEach(a => {
        const sNome = a.servico_livre || a.categoria || 'Atendimento presencial'
        const preco = Number(a.valor || 0)
        if (!servicosMap[sNome]) servicosMap[sNome] = { quantidade: 0, receita: 0 }
        servicosMap[sNome].quantidade++; servicosMap[sNome].receita += preco
      })
      return {
        id: nome, nome, agendamentos: 0, atendimentos: ats.length,
        total: ats.reduce((acc, a) => acc + Number(a.valor || 0), 0),
        servicos: Object.entries(servicosMap).map(([n, d]) => ({ nome: n, quantidade: d.quantidade, receita: d.receita }))
      }
    })

    const todosProfs = [...relPorProfissional, ...relLivres]
    setTotalReceita(todosProfs.reduce((acc, p) => acc + p.total, 0))
    setRelatorio(todosProfs)
    setLoading(false)
  }

  const lucro = totalReceita - totalDespesas

  function fmtBRL(v: number) {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function iniciais(nome: string) {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  function labelMes(mes: string) {
    const [ano, m] = mes.split('-')
    const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
    return `${nomes[parseInt(m) - 1]} de ${ano}`
  }

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .pg {
      min-height: 100vh;
      background: #08080A;
      color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    /* ── NAV ── */
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; height: 54px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(9,9,11,0.96);
      backdrop-filter: blur(10px);
      position: sticky; top: 0; z-index: 20;
      gap: 12px;
    }
    .nav-logo { font-size: 15px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; }
    .nav-links { display: none; gap: 20px; }
    @media (min-width: 640px) { .nav-links { display: flex; } }
    .nav-link {
      font-size: 13px; color: #6B7280; text-decoration: none;
      transition: color 0.15s;
    }
    .nav-link:hover { color: #D1D5DB; }
    .nav-link.ativo { color: #F1F5F9; font-weight: 600; }
    .nav-back { font-size: 13px; color: #6B7280; text-decoration: none; transition: color 0.15s; }
    .nav-back:hover { color: #D1D5DB; }

    /* ── BODY ── */
    .body { max-width: 960px; margin: 0 auto; padding: 28px 16px 56px; }
    @media (min-width: 720px) { .body { padding: 36px 24px 64px; } }
    @media (min-width: 1100px) { .body { max-width: 1100px; padding: 40px 40px 72px; } }

    /* ── HEADER DA PÁGINA ── */
    .page-header {
      display: flex; flex-direction: column; gap: 16px;
      margin-bottom: 28px;
    }
    @media (min-width: 640px) {
      .page-header { flex-direction: row; align-items: flex-start; justify-content: space-between; }
    }
    .page-title { font-size: 22px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 4px; }
    @media (min-width: 640px) { .page-title { font-size: 26px; } }
    .page-sub { font-size: 14px; color: #6B7280; line-height: 1.5; }

    /* Filtro mês */
    .mes-wrap { display: flex; flex-direction: column; gap: 4px; }
    .mes-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; }
    .mes-input {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 10px 14px;
      color: #F1F5F9; font-size: 14px; outline: none;
      cursor: pointer; width: 100%;
      font-family: inherit;
      transition: border-color 0.15s;
    }
    .mes-input:focus { border-color: rgba(59,130,246,0.5); }
    @media (min-width: 640px) { .mes-input { width: 180px; } }

    /* ── CARDS FINANCEIROS ── */
    .cards-financeiros {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px; margin-bottom: 32px;
    }
    @media (min-width: 540px) { .cards-financeiros { grid-template-columns: repeat(3, 1fr); gap: 14px; } }

    .card-fin {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px; padding: 20px;
      position: relative; overflow: hidden;
      display: flex; align-items: center; gap: 14px;
    }
    @media (min-width: 540px) {
      .card-fin { flex-direction: column; align-items: flex-start; gap: 0; }
    }
    .card-fin-accent {
      position: absolute; top: 0; left: 0; height: 100%; width: 3px;
    }
    @media (min-width: 540px) {
      .card-fin-accent { height: 2px; width: auto; right: 0; }
    }
    .card-fin-icon {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }
    @media (min-width: 540px) { .card-fin-icon { margin-bottom: 14px; } }
    .card-fin-label { font-size: 12px; color: #6B7280; font-weight: 500; flex: 1; }
    @media (min-width: 540px) { .card-fin-label { margin-bottom: 6px; flex: none; } }
    .card-fin-valor { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; flex-shrink: 0; }
    @media (min-width: 540px) { .card-fin-valor { font-size: 28px; margin-bottom: 4px; } }
    .card-fin-sub { font-size: 11px; color: #374151; display: none; }
    @media (min-width: 540px) { .card-fin-sub { display: block; } }

    /* ── SEÇÃO PROFISSIONAIS ── */
    .sec-titulo {
      font-size: 13px; font-weight: 700;
      letter-spacing: 0.01em; color: #9CA3AF; margin-bottom: 14px;
    }

    /* Vazio */
    .vazio {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px; padding: 40px 24px;
      text-align: center;
    }
    .vazio p:first-child { font-size: 14px; color: #6B7280; margin-bottom: 6px; font-weight: 500; }
    .vazio p:last-child  { font-size: 13px; color: #374151; }

    /* Card profissional */
    .prof-lista { display: flex; flex-direction: column; gap: 10px; }
    .prof-card {
      background: linear-gradient(180deg, rgba(18,22,30,0.97) 0%, rgba(10,12,16,0.97) 100%);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px; overflow: hidden;
      transition: border-color 0.15s;
    }
    .prof-card:hover { border-color: rgba(59,130,246,0.2); }

    .prof-header {
      width: 100%; padding: 16px 18px;
      display: flex; align-items: center; gap: 12px;
      background: none; border: none; cursor: pointer; text-align: left;
      color: #F1F5F9;
    }
    @media (min-width: 480px) { .prof-header { padding: 18px 22px; } }

    .prof-avatar {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      background: #3B82F6;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 800; color: #fff;
      letter-spacing: 0.02em;
    }
    .prof-info { flex: 1; min-width: 0; }
    .prof-nome { font-size: 14px; font-weight: 700; color: #F1F5F9; margin-bottom: 3px; }
    .prof-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
    }
    .badge-online { background: rgba(59,130,246,0.1); color: #3B82F6; border: 1px solid rgba(59,130,246,0.2); }
    .badge-presencial { background: rgba(168,85,247,0.1); color: #A855F7; border: 1px solid rgba(168,85,247,0.2); }

    .prof-right { text-align: right; flex-shrink: 0; }
    .prof-total { font-size: 18px; font-weight: 800; color: #22C55E; margin-bottom: 3px; }
    .prof-toggle { font-size: 11px; color: #4B5563; }

    /* Detalhes */
    .prof-detalhes {
      border-top: 1px solid rgba(255,255,255,0.05);
      padding: 14px 18px;
    }
    @media (min-width: 480px) { .prof-detalhes { padding: 16px 22px; } }

    .tabela { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tabela th {
      text-align: left; padding: 0 0 10px 0;
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #4B5563;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .tabela th:nth-child(2) { text-align: center; }
    .tabela th:nth-child(3) { text-align: right; }
    .tabela td {
      padding: 10px 0; color: #D1D5DB;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .tabela td:nth-child(2) { text-align: center; color: #6B7280; }
    .tabela td:nth-child(3) { text-align: right; color: #22C55E; font-weight: 600; }
    .tabela tfoot td {
      padding-top: 12px; border-bottom: none;
      font-weight: 700; color: #9CA3AF;
    }
    .tabela tfoot td:nth-child(3) { color: #22C55E; font-size: 15px; }
    .nome-servico-vazio { color: #9CA3AF; font-style: normal; }
  `

  return (
    <div className="pg">
      <style>{css}</style>

      {/* NAV */}
      <nav className="nav">
        <span className="nav-logo">ClienteMarcado</span>
        <div className="nav-links">
          <Link href="/painel" className="nav-link">Painel</Link>
          <Link href="/painel/agendamentos" className="nav-link">Agenda</Link>
          <Link href="/painel/atendimento" className="nav-link">Atendimento</Link>
          <Link href="/painel/relatorio" className="nav-link ativo">Relatório</Link>
        </div>
        <Link href="/painel" className="nav-back">← Voltar ao painel</Link>
      </nav>

      <div className="body">

        {/* HEADER */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Relatório financeiro</h1>
            <p className="page-sub">Acompanhe receita, despesas, lucro e desempenho por profissional.</p>
          </div>
          <div className="mes-wrap">
            <span className="mes-label">Mês</span>
            <input type="month" value={mesAtual}
              onChange={e => setMesAtual(e.target.value)}
              className="mes-input" />
          </div>
        </div>

        {/* CARDS FINANCEIROS */}
        <div className="cards-financeiros">
          {/* Receita */}
          <div className="card-fin">
            <div className="card-fin-accent" style={{ background: 'linear-gradient(180deg, #22C55E, transparent)' }} />
            <div className="card-fin-icon" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>$</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="card-fin-label">Receita total</p>
              <p className="card-fin-valor" style={{ color: '#22C55E' }}>R$ {fmtBRL(totalReceita)}</p>
              <p className="card-fin-sub">Agendamentos + atendimentos presenciais</p>
            </div>
          </div>

          {/* Despesas */}
          <div className="card-fin">
            <div className="card-fin-accent" style={{ background: 'linear-gradient(180deg, #EF4444, transparent)' }} />
            <div className="card-fin-icon" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>−</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="card-fin-label">Despesas</p>
              <p className="card-fin-valor" style={{ color: '#EF4444' }}>R$ {fmtBRL(totalDespesas)}</p>
              <p className="card-fin-sub">Custos registrados no período</p>
            </div>
          </div>

          {/* Lucro */}
          <div className="card-fin">
            <div className="card-fin-accent" style={{ background: `linear-gradient(180deg, ${lucro >= 0 ? '#22C55E' : '#EF4444'}, transparent)` }} />
            <div className="card-fin-icon" style={{ background: lucro >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: lucro >= 0 ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)', color: lucro >= 0 ? '#22C55E' : '#EF4444' }}>↗</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="card-fin-label">Lucro estimado</p>
              <p className="card-fin-valor" style={{ color: lucro >= 0 ? '#22C55E' : '#EF4444' }}>R$ {fmtBRL(lucro)}</p>
              <p className="card-fin-sub">Receita menos despesas</p>
            </div>
          </div>
        </div>

        {/* PROFISSIONAIS */}
        <p className="sec-titulo">Desempenho por profissional</p>

        {loading && (
          <div className="vazio">
            <p>Carregando dados...</p>
          </div>
        )}

        {!loading && relatorio.length === 0 && (
          <div className="vazio">
            <p>Nenhum resultado encontrado neste período.</p>
            <p>Quando houver agendamentos ou atendimentos registrados, eles aparecerão aqui.</p>
          </div>
        )}

        {!loading && relatorio.length > 0 && (
          <div className="prof-lista">
            {relatorio.map(prof => (
              <div key={prof.id} className="prof-card">
                <button className="prof-header"
                  onClick={() => setProfAberto(profAberto === prof.id ? null : prof.id)}>
                  <div className="prof-avatar">{iniciais(prof.nome)}</div>
                  <div className="prof-info">
                    <p className="prof-nome">{prof.nome}</p>
                    <div className="prof-badges">
                      <span className="badge badge-online">
                        📅 {prof.agendamentos} online
                      </span>
                      <span className="badge badge-presencial">
                        👤 {prof.atendimentos} presencial{prof.atendimentos !== 1 ? 'is' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="prof-right">
                    <p className="prof-total">R$ {fmtBRL(prof.total)}</p>
                    <p className="prof-toggle">
                      {profAberto === prof.id
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Fechar ∧</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>Ver detalhes ∨</span>
                      }
                    </p>
                  </div>
                </button>

                {profAberto === prof.id && (
                  <div className="prof-detalhes">
                    {prof.servicos.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#4B5563', textAlign: 'center', padding: '8px 0' }}>
                        Nenhum serviço registrado.
                      </p>
                    ) : (
                      <table className="tabela">
                        <thead>
                          <tr>
                            <th>Serviço</th>
                            <th>Quantidade</th>
                            <th>Receita</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prof.servicos.map((s: any) => (
                            <tr key={s.nome}>
                              <td>
                                {s.nome && s.nome !== 'Serviço' && s.nome !== '__sem_nome__' && s.nome !== 'Serviço não informado'
                                  ? s.nome
                                  : <span className="nome-servico-vazio">Outro serviço</span>
                                }
                              </td>
                              <td>{s.quantidade}x</td>
                              <td>R$ {fmtBRL(s.receita)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={2}>Total</td>
                            <td>R$ {fmtBRL(prof.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
