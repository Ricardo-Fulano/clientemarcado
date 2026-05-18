'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('agendamentos')
        .select(`
          *,
          servicos(nome, preco),
          profissionais(nome)
        `)
        .eq('user_id', user.id)
        .order('data_hora', { ascending: true })

      setAgendamentos(data || [])
      setCarregando(false)
    }
    carregar()
  }, [])

  function formatarData(dataHora: string) {
    return new Date(dataHora).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Agendamentos</h1>

      {carregando && <p className="text-gray-500">Carregando...</p>}

      {!carregando && agendamentos.length === 0 && (
        <p className="text-gray-500">Nenhum agendamento ainda.</p>
      )}

      <ul className="space-y-3">
        {agendamentos.map((a) => (
          <li key={a.id} className="border rounded p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">{a.cliente_nome}</p>
                <p className="text-sm text-gray-500">{a.cliente_telefone}</p>
                <p className="text-sm mt-1">Serviço: {a.servicos?.nome} — R$ {a.servicos?.preco}</p>
                <p className="text-sm">Profissional: {a.profissionais?.nome}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-500">{formatarData(a.data_hora)}</p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-1 inline-block">
                  {a.status}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}