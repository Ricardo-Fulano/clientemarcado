'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const CATEGORIAS_DESPESA = [
  'Aluguel',
  'Luz',
  'Água',
  'Internet',
  'Produtos',
  'Salários',
  'Equipamentos',
  'Marketing',
  'Outros',
]

export default function Financeiro() {
  const [despesas, setDespesas] = useState<any[]>([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [totalMes, setTotalMes] = useState(0)

  useEffect(() => {
    carregarDespesas()
  }, [])

  async function carregarDespesas() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const mesAtual = new Date().toISOString().slice(0, 7)

    const { data } = await supabase
      .from('despesas')
      .select('*')
      .eq('user_id', user.id)
      .gte('data', mesAtual + '-01')
      .order('data', { ascending: false })

    setDespesas(data || [])
    setTotalMes(data?.reduce((acc, d) => acc + Number(d.valor), 0) || 0)
  }

  async function handleAdicionarDespesa() {
    if (!descricao || !valor) {
      setMensagem('Preencha a descrição e o valor.')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('despesas').insert({
      user_id: user!.id,
      descricao,
      valor: parseFloat(valor),
      categoria,
      data,
    })

    setLoading(false)

    if (error) {
      setMensagem('Erro ao salvar despesa.')
    } else {
      setDescricao('')
      setValor('')
      setCategoria('')
      setData(new Date().toISOString().split('T')[0])
      setMensagem('Despesa registrada!')
      carregarDespesas()
      setTimeout(() => setMensagem(''), 3000)
    }
  }

  async function handleExcluir(id: string) {
    await supabase.from('despesas').delete().eq('id', id)
    carregarDespesas()
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-black">
        <a href="/painel" className="text-xl font-bold">ClienteMarcado</a>
        <a href="/painel" className="text-zinc-400 hover:text-white text-sm transition">← Voltar ao painel</a>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-2">Financeiro</h2>
        <p className="text-zinc-400 mb-6">Controle suas despesas mensais</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <p className="text-zinc-400 text-sm mb-1">Total de despesas este mês</p>
          <p className="text-3xl font-bold text-red-400">
            R$ {totalMes.toFixed(2)}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold mb-4">Adicionar despesa</h3>
          <div className="flex flex-col gap-4">

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Descrição *</label>
              <input
                type="text"
                placeholder="Ex: Aluguel do salão"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Valor (R$) *</label>
                <input
                  type="number"
                  placeholder="Ex: 1500"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Data</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">Selecione...</option>
                {CATEGORIAS_DESPESA.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {mensagem && (
              <p className="text-sm text-orange-400">{mensagem}</p>
            )}

            <button
              onClick={handleAdicionarDespesa}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Registrar despesa'}
            </button>
          </div>
        </div>

        <h3 className="font-semibold mb-4 text-zinc-300">Despesas deste mês</h3>
        <div className="flex flex-col gap-3">
          {despesas.length === 0 && (
            <p className="text-zinc-500 text-center py-8">Nenhuma despesa registrada este mês.</p>
          )}
          {despesas.map((d) => (
            <div key={d.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{d.descricao}</p>
                <p className="text-zinc-400 text-sm">{d.categoria} · {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-red-400 font-bold">R$ {Number(d.valor).toFixed(2)}</p>
                <button
                  onClick={() => handleExcluir(d.id)}
                  className="text-zinc-500 hover:text-red-400 text-sm transition"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}