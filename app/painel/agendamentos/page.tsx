'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('agendamentos')
      .select(`*, servicos(nome, preco), profissionais(nome)`)
      .eq('user_id', user.id)
      .order('data_hora', { ascending: true })
    setAgendamentos(data || [])
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function atualizarStatus(id: string, status: string) {
    await supabase.from('agendamentos').update({ status }).eq('id', id)
    carregar()
  }

  function formatarData(dataHora: string) {
    return new Date(dataHora).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function corStatus(status: string) {
    if (status === 'confirmado') return 'bg-green-100 text-green-700'
    if (status === 'cancelado') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-black">
        <h1 className="text-xl font-bold">ClienteMarcado</h1>
        <div className="flex gap-6 text-sm text-zinc-400">
          <Link href="/painel" className="hover:text-white transition">Painel</Link>
          <Link href="/painel/agendamentos" className="text-white font-semibold">Agenda</Link>
          <Link href="/painel/atendimento" className="hover:text-white transition">Atendimento</Link>
          <Link href="/painel/relatorio" className="hover:text-white transition">Relatório</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6">Agendamentos</h2>

        {carregando && <p className="text-zinc-400">Carregando...</p>}
        {!carregando && agendamentos.length === 0 && (
          <p className="text-zinc-400">Nenhum agendamento ainda.</p>
        )}

        <ul className="space-y-3">
          {agendamentos.map((a) => (
            <li key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{a.cliente_nome}</p>
                  <p className="text-sm text-zinc-400">{a.cliente_telefone}</p>
                  <p className="text-sm mt-2 text-zinc-300">
                    {a.servicos?.nome || '—'} · R$ {a.servicos?.preco || '—'}
                  </p>
                  <p className="text-sm text-zinc-400">Prof: {a.profissionais?.nome || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-400">{formatarData(a.data_hora)}</p>
                  <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${corStatus(a.status)}`}>
                    {a.status}
                  </span>
                </div>
              </div>

              {a.status === 'pendente' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => atualizarStatus(a.id, 'confirmado')}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-2 rounded-xl transition"
                  >
                    ✓ Confirmar
                  </button>
                  <button
                    onClick={() => atualizarStatus(a.id, 'cancelado')}
                    className="flex-1 bg-zinc-700 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-xl transition"
                  >
                    ✕ Cancelar
                  </button>
                </div>
              )}

              {a.status === 'cancelado' && (
                <button
                  onClick={() => atualizarStatus(a.id, 'pendente')}
                  className="mt-4 text-xs text-zinc-400 hover:text-white underline transition"
                >
                  Desfazer cancelamento
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}