'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function RegistrarAtendimento() {
  const [profissionalNome, setProfissionalNome] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [servico, setServico] = useState('')
  const [valor, setValor] = useState('')
  const [observacao, setObservacao] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
    }
    carregar()
  }, [])

  async function handleRegistrar() {
    setErro('')

    if (!profissionalNome.trim()) {
      setErro('Informe o nome do profissional.')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('atendimentos').insert({
      user_id: userId,
      profissional_nome_livre: profissionalNome.trim(),
      cliente_nome: clienteNome || null,
      cliente_telefone: clienteTelefone || null,
      servico_livre: servico || null,
      valor: valor ? parseFloat(valor) : null,
      observacao: observacao || null,
    })

    setLoading(false)

    if (error) {
      setErro('Erro ao registrar. Tente novamente.')
      console.error(error)
    } else {
      setSucesso(true)
      setProfissionalNome(''); setClienteNome(''); setClienteTelefone('')
      setServico(''); setValor(''); setObservacao('')
      setTimeout(() => setSucesso(false), 3000)
    }
  }

  const inputClass = "w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3 focus:outline-none focus:border-orange-500 placeholder-zinc-500"
  const labelClass = "block text-sm font-medium text-zinc-300 mb-1"

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-black">
        <h1 className="text-xl font-bold">ClienteMarcado</h1>
        <div className="flex gap-6 text-sm text-zinc-400">
          <Link href="/painel" className="hover:text-white transition">Painel</Link>
          <Link href="/painel/agendamentos" className="hover:text-white transition">Agenda</Link>
          <Link href="/painel/atendimento" className="text-white font-semibold">Atendimento</Link>
          <Link href="/painel/relatorio" className="hover:text-white transition">Relatório</Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-8">Registrar atendimento presencial</h2>

        {sucesso && (
          <div className="bg-green-900 text-green-300 border border-green-700 rounded-xl p-4 mb-6 text-center font-semibold">
            ✅ Atendimento registrado com sucesso!
          </div>
        )}

        <div className="space-y-5">

          <div>
            <label className={labelClass}>Nome do profissional *</label>
            <input type="text" className={inputClass} placeholder="Ex: Antonio, João..." value={profissionalNome} onChange={(e) => setProfissionalNome(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Serviço realizado (opcional)</label>
            <input type="text" className={inputClass} placeholder="Ex: Corte, Barba, Escova..." value={servico} onChange={(e) => setServico(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Nome do cliente (opcional)</label>
            <input type="text" className={inputClass} placeholder="Ex: Carlos Silva" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Telefone (opcional)</label>
            <input type="text" className={inputClass} placeholder="Ex: (11) 99999-9999" value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Valor cobrado (R$)</label>
            <input type="text" className={inputClass} placeholder="Ex: 35" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Observação (opcional)</label>
            <textarea className={inputClass} rows={2} placeholder="Ex: cliente preferiu franja mais curta" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>

          {erro && <p className="text-red-400 text-sm">{erro}</p>}

          <button
            onClick={handleRegistrar}
            disabled={loading}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition"
          >
            {loading ? 'Registrando...' : 'Registrar atendimento'}
          </button>
        </div>
      </div>
    </main>
  )
}