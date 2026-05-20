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

  useEffect(() => {
    carregarRelatorio()
  }, [mesAtual])

  async function carregarRelatorio() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const dataInicio = mesAtual + '-01'
    const dataFim = mesAtual + '-31'

    const { data: profs } = await supabase
      .from('profissionais')
      .select('*')
      .eq('user_id', user.id)

    const { data: agendamentos } = await supabase
      .from('agendamentos')
      .select('*, servicos(nome, preco), profissionais(nome)')
      .eq('user_id', user.id)
      .gte('data_hora', dataInicio)
      .lte('data_hora', dataFim)

    const { data: atendimentos } = await supabase
      .from('atendimentos')
      .select('*, profissionais(nome)')
      .eq('user_id', user.id)
      .gte('created_at', dataInicio)
      .lte('created_at', dataFim)

    const { data: despesas } = await supabase
      .from('despesas')
      .select('*')
      .eq('user_id', user.id)
      .gte('data', dataInicio)
      .lte('data', dataFim)

    const totalDesp = despesas?.reduce((acc, d) => acc + Number(d.valor), 0) || 0
    setTotalDespesas(totalDesp)

    // Agrupa por profissional cadastrado
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
        servicosMap[nome].quantidade++
        servicosMap[nome].receita += preco
      })

      atsProf.forEach(a => {
        const nome = a.servico_livre || a.categoria || 'Atendimento presencial'
        const preco = Number(a.valor || 0)
        if (!servicosMap[nome]) servicosMap[nome] = { quantidade: 0, receita: 0 }
        servicosMap[nome].quantidade++
        servicosMap[nome].receita += preco
      })

      return {
        id: prof.id,
        nome: prof.nome,
        agendamentos: agsProf.length,
        atendimentos: atsProf.length,
        total: totalProf,
        servicos: Object.entries(servicosMap).map(([nome, dados]) => ({
          nome,
          quantidade: dados.quantidade,
          receita: dados.receita,
        }))
      }
    })

    // Atendimentos com profissional livre que não bate com nenhum cadastrado
    const nomesProfs = (profs || []).map(p => p.nome.toLowerCase())
    const atsLivres = (atendimentos || []).filter(a =>
      !a.profissional_id &&
      a.profissional_nome_livre &&
      !nomesProfs.includes(a.profissional_nome_livre.toLowerCase())
    )

    // Agrupa os livres por nome
    const livresMap: Record<string, any[]> = {}
    atsLivres.forEach(a => {
      const nome = a.profissional_nome_livre
      if (!livresMap[nome]) livresMap[nome] = []
      livresMap[nome].push(a)
    })

    const relLivres = Object.entries(livresMap).map(([nome, ats]) => {
      const servicosMap: Record<string, { quantidade: number, receita: number }> = {}
      ats.forEach(a => {
        const sNome = a.servico_livre || a.categoria || 'Atendimento presencial'
        const preco = Number(a.valor || 0)
        if (!servicosMap[sNome]) servicosMap[sNome] = { quantidade: 0, receita: 0 }
        servicosMap[sNome].quantidade++
        servicosMap[sNome].receita += preco
      })
      return {
        id: nome,
        nome,
        agendamentos: 0,
        atendimentos: ats.length,
        total: ats.reduce((acc, a) => acc + Number(a.valor || 0), 0),
        servicos: Object.entries(servicosMap).map(([n, d]) => ({ nome: n, quantidade: d.quantidade, receita: d.receita }))
      }
    })

    const todosProfs = [...relPorProfissional, ...relLivres]
    const totalRec = todosProfs.reduce((acc, p) => acc + p.total, 0)
    setTotalReceita(totalRec)
    setRelatorio(todosProfs)
    setLoading(false)
  }

  const lucro = totalReceita - totalDespesas

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-black">
        <h1 className="text-xl font-bold">ClienteMarcado</h1>
        <div className="flex gap-6 text-sm text-zinc-400">
          <Link href="/painel" className="hover:text-white transition">Painel</Link>
          <Link href="/painel/agendamentos" className="hover:text-white transition">Agenda</Link>
          <Link href="/painel/atendimento" className="hover:text-white transition">Atendimento</Link>
          <Link href="/painel/relatorio" className="text-white font-semibold">Relatório</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Relatório</h2>
            <p className="text-zinc-400">Visão completa do seu negócio</p>
          </div>
          <input
            type="month"
            value={mesAtual}
            onChange={(e) => setMesAtual(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Receita total</p>
            <p className="text-3xl font-bold text-green-400">R$ {totalReceita.toFixed(2)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Despesas</p>
            <p className="text-3xl font-bold text-red-400">R$ {totalDespesas.toFixed(2)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm mb-1">Lucro estimado</p>
            <p className={`text-3xl font-bold ${lucro >= 0 ? 'text-orange-400' : 'text-red-500'}`}>
              R$ {lucro.toFixed(2)}
            </p>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Por profissional</h3>

        {loading && <p className="text-zinc-500">Carregando...</p>}

        {!loading && relatorio.length === 0 && (
          <p className="text-zinc-500 text-center py-8">Nenhum dado encontrado para este mês.</p>
        )}

        <div className="flex flex-col gap-4">
          {relatorio.map((prof) => (
            <div key={prof.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setProfAberto(profAberto === prof.id ? null : prof.id)}
                className="w-full px-6 py-5 flex justify-between items-center hover:bg-zinc-800 transition text-left"
              >
                <div>
                  <p className="text-lg font-bold">{prof.nome}</p>
                  <p className="text-zinc-400 text-sm mt-1">
                    {prof.agendamentos} agendamento{prof.agendamentos !== 1 ? 's' : ''} online
                    · {prof.atendimentos} presencial{prof.atendimentos !== 1 ? 'is' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-xl">R$ {prof.total.toFixed(2)}</p>
                  <p className="text-zinc-500 text-sm">{profAberto === prof.id ? '▲ fechar' : '▼ ver detalhes'}</p>
                </div>
              </button>

              {profAberto === prof.id && (
                <div className="border-t border-zinc-800 px-6 py-4">
                  {prof.servicos.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Nenhum serviço registrado.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-zinc-400 border-b border-zinc-800">
                          <th className="text-left pb-2">Serviço</th>
                          <th className="text-center pb-2">Qtd</th>
                          <th className="text-right pb-2">Receita</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prof.servicos.map((s: any) => (
                          <tr key={s.nome} className="border-b border-zinc-800 last:border-0">
                            <td className="py-2">{s.nome}</td>
                            <td className="text-center py-2">{s.quantidade}x</td>
                            <td className="text-right py-2 text-green-400">R$ {s.receita.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} className="pt-3 text-zinc-400 font-semibold">Total</td>
                          <td className="pt-3 text-right text-green-400 font-bold">R$ {prof.total.toFixed(2)}</td>
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