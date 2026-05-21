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
    if (!user) return

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
      const servicosMap: Record<string, { quantidade: number, receita: number }> = {}
      agsProf.forEach(a => {
        const nome = a.servicos?.nome || 'Serviço'
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
    const atsLivres = (atendimentos || []).filter(a => !a.profissional_id && a.profissional_nome_livre && !nomesProfs.includes(a.profissional_nome_livre.toLowerCase()))
    const livresMap: Record<string, any[]> = {}
    atsLivres.forEach(a => { const nome = a.profissional_nome_livre; if (!livresMap[nome]) livresMap[nome] = []; livresMap[nome].push(a) })
    const relLivres = Object.entries(livresMap).map(([nome, ats]) => {
      const servicosMap: Record<string, { quantidade: number, receita: number }> = {}
      ats.forEach(a => {
        const sNome = a.servico_livre || a.categoria || 'Atendimento presencial'
        const preco = Number(a.valor || 0)
        if (!servicosMap[sNome]) servicosMap[sNome] = { quantidade: 0, receita: 0 }
        servicosMap[sNome].quantidade++; servicosMap[sNome].receita += preco
      })
      return { id: nome, nome, agendamentos: 0, atendimentos: ats.length, total: ats.reduce((acc, a) => acc + Number(a.valor || 0), 0), servicos: Object.entries(servicosMap).map(([n, d]) => ({ nome: n, quantidade: d.quantidade, receita: d.receita })) }
    })

    const todosProfs = [...relPorProfissional, ...relLivres]
    setTotalReceita(todosProfs.reduce((acc, p) => acc + p.total, 0))
    setRelatorio(todosProfs)
    setLoading(false)
  }

  const lucro = totalReceita - totalDespesas

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>ClienteMarcado</span>
        <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
          <Link href="/painel" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Painel</Link>
          <Link href="/painel/agendamentos" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Agenda</Link>
          <Link href="/painel/atendimento" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Atendimento</Link>
          <Link href="/painel/relatorio" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none' }}>Relatório</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>Relatório</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Visão completa do seu negócio</p>
          </div>
          <input type="month" value={mesAtual} onChange={(e) => setMesAtual(e.target.value)}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
        </div>

        {/* Métricas financeiras — todas em verde */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '32px' }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--success), transparent)' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '500' }}>Receita total</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success)' }}>R$ {totalReceita.toFixed(2)}</p>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--danger), transparent)' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '500' }}>Despesas</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--danger)' }}>R$ {totalDespesas.toFixed(2)}</p>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${lucro >= 0 ? 'var(--success)' : 'var(--danger)'}, transparent)` }} />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '500' }}>Lucro estimado</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: lucro >= 0 ? 'var(--success)' : 'var(--danger)' }}>R$ {lucro.toFixed(2)}</p>
          </div>
        </div>

        <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Por profissional</h3>

        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>Carregando...</p>}
        {!loading && relatorio.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>Nenhum dado encontrado para este mês.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {relatorio.map((prof) => (
            <div key={prof.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
              <button onClick={() => setProfAberto(profAberto === prof.id ? null : prof.id)}
                style={{ width: '100%', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px' }}>{prof.nome}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {prof.agendamentos} agendamento{prof.agendamentos !== 1 ? 's' : ''} online · {prof.atendimentos} presencial{prof.atendimentos !== 1 ? 'is' : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {/* ✅ VERDE — receita por profissional */}
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--success)', marginBottom: '2px' }}>R$ {prof.total.toFixed(2)}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{profAberto === prof.id ? '▲ fechar' : '▼ detalhes'}</p>
                </div>
              </button>

              {profAberto === prof.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 22px' }}>
                  {prof.servicos.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Nenhum serviço registrado.</p>
                  ) : (
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ textAlign: 'left', paddingBottom: '8px', color: 'var(--text-muted)', fontWeight: '600' }}>Serviço</th>
                          <th style={{ textAlign: 'center', paddingBottom: '8px', color: 'var(--text-muted)', fontWeight: '600' }}>Qtd</th>
                          <th style={{ textAlign: 'right', paddingBottom: '8px', color: 'var(--text-muted)', fontWeight: '600' }}>Receita</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prof.servicos.map((s: any) => (
                          <tr key={s.nome} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                            <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>{s.nome}</td>
                            <td style={{ textAlign: 'center', padding: '8px 0', color: 'var(--text-secondary)' }}>{s.quantidade}x</td>
                            {/* ✅ VERDE — receita por serviço */}
                            <td style={{ textAlign: 'right', padding: '8px 0', color: 'var(--success)', fontWeight: '600' }}>R$ {s.receita.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} style={{ paddingTop: '10px', color: 'var(--text-secondary)', fontWeight: '600' }}>Total</td>
                          <td style={{ textAlign: 'right', paddingTop: '10px', color: 'var(--success)', fontWeight: '700' }}>R$ {prof.total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}