'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useParams } from 'next/navigation'

export default function Agendar() {
  const params = useParams()
  const slug = params.slug as string

  const [perfil, setPerfil] = useState<any>(null)
  const [servicos, setServicos] = useState<any[]>([])
  const [profissionais, setProfissionais] = useState<any[]>([])

  const [servicoId, setServicoId] = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [dataHora, setDataHora] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      const { data: p } = await supabase
        .from('perfis')
        .select('*')
        .eq('slug', slug)
        .single()
      setPerfil(p)

      const { data: s } = await supabase
        .from('servicos')
        .select('*')
        .eq('user_id', p.user_id)
      setServicos(s || [])

      const { data: pr } = await supabase
        .from('profissionais')
        .select('*')
        .eq('user_id', p.user_id)
      setProfissionais(pr || [])
    }
    carregar()
  }, [slug])

  async function handleAgendar() {
    setErro('')
    if (!servicoId || !profissionalId || !dataHora || !clienteNome) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }

    const { error } = await supabase.from('agendamentos').insert({
      user_id: perfil.user_id,
      servico_id: servicoId,
      profissional_id: profissionalId,
      data_hora: dataHora,
      cliente_nome: clienteNome,
      cliente_telefone: clienteTelefone,
    })

    if (error) {
      setErro('Erro ao agendar. Tente novamente.')
    } else {
      setSucesso(true)
    }
  }

  if (sucesso) return (
    <main className="max-w-lg mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold text-green-600 mb-2">Agendamento confirmado! ✅</h1>
      <p className="text-gray-600">Em breve entraremos em contato.</p>
    </main>
  )

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">{perfil?.nome_negocio}</h1>
      <p className="text-gray-500 mb-6">Faça seu agendamento</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Serviço *</label>
          <select
            className="w-full border rounded p-2"
            value={servicoId}
            onChange={(e) => setServicoId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>{s.nome} — R$ {s.preco}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Profissional *</label>
          <select
            className="w-full border rounded p-2"
            value={profissionalId}
            onChange={(e) => setProfissionalId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data e horário *</label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Seu nome *</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="Ex: Maria Silva"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Telefone (opcional)</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="Ex: (11) 99999-9999"
            value={clienteTelefone}
            onChange={(e) => setClienteTelefone(e.target.value)}
          />
        </div>

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <button
          onClick={handleAgendar}
          className="w-full bg-orange-500 text-white font-bold py-3 rounded hover:bg-orange-600"
        >
          Confirmar agendamento
        </button>
      </div>
    </main>
  )
}