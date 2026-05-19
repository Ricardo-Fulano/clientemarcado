'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function RegistrarAtendimento() {
  const [servicos, setServicos] = useState<any[]>([])
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [categoria, setCategoria] = useState('')
  const [categoriaNova, setCategoriaNova] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
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

      const { data: s } = await supabase
        .from('servicos')
        .select('*')
        .eq('user_id', user.id)
      setServicos(s || [])

      const { data: p } = await supabase
        .from('profissionais')
        .select('*')
        .eq('user_id', user.id)
      setProfissionais(p || [])

      const { data: c } = await supabase
        .from('categorias_atendimento')
        .select('nome')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      setCategorias(c?.map(x => x.nome) || [])
    }
    carregar()
  }, [])

  async function handleRegistrar() {
    setErro('')
    const categoriaFinal = categoria === 'nova' ? categoriaNova.trim() : categoria

    if (!clienteNome || !profissionalId || !servicoId) {
      setErro('Preencha nome do cliente, serviço e profissional.')
      return
    }

    setLoading(true)

    // Salva categoria nova se não existir
    if (categoria === 'nova' && categoriaFinal && !categorias.includes(categoriaFinal)) {
      await supabase.from('categorias_atendimento').insert({
        user_id: userId,
        nome: categoriaFinal,
      })
      setCategorias(prev => [...prev, categoriaFinal])
    }

    const { error } = await supabase.from('atendimentos').insert({
      user_id: userId,
      servico_id: servicoId,
      profissional_id: profissionalId,
      cliente_nome: clienteNome,
      cliente_telefone: clienteTelefone,
      valor: valor ? parseFloat(valor) : null,
      observacao: observacao,
      categoria: categoriaFinal || null,
    })

    setLoading(false)

    if (error) {
      setErro('Erro ao registrar. Tente novamente.')
    } else {
      setSucesso(true)
      setClienteNome('')
      setClienteTelefone('')
      setServicoId('')
      setProfissionalId('')
      setValor('')
      setObservacao('')
      setCategoria('')
      setCategoriaNova('')
      setTimeout(() => setSucesso(false), 3000)
    }
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <a href="/painel" className="text-gray-400 hover:text-black">← Painel</a>
        <h1 className="text-2xl font-bold">Registrar atendimento</h1>
      </div>

      {sucesso && (
        <div className="bg-green-100 text-green-700 border border-green-300 rounded p-3 mb-4 text-center font-semibold">
          ✅ Atendimento registrado com sucesso!
        </div>
      )}

      <div className="space-y-4">

        <div>
          <label className="block text-sm font-medium mb-1">Categoria do atendimento</label>
          <select
            className="w-full border rounded p-2"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Selecione ou adicione...</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="nova">+ Nova categoria</option>
          </select>
        </div>

        {categoria === 'nova' && (
          <div>
            <label className="block text-sm font-medium mb-1">Nome da nova categoria</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              placeholder="Ex: Consulta, Banho e tosa, Limpeza..."
              value={categoriaNova}
              onChange={(e) => setCategoriaNova(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Nome do cliente *</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="Ex: Carlos Silva"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Telefone</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="Ex: (11) 99999-9999"
            value={clienteTelefone}
            onChange={(e) => setClienteTelefone(e.target.value)}
          />
        </div>

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
          <label className="block text-sm font-medium mb-1">Valor cobrado (R$)</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            placeholder="Ex: 35"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Observação</label>
          <textarea
            className="w-full border rounded p-2"
            rows={2}
            placeholder="Ex: cliente preferiu franja mais curta"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </div>

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <button
          onClick={handleRegistrar}
          disabled={loading}
          className="w-full bg-orange-500 text-white font-bold py-3 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Registrando...' : 'Registrar atendimento'}
        </button>
      </div>
    </main>
  )
}