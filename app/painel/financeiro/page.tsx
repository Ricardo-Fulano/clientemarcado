'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const CATEGORIAS_DESPESA = [
  'Aluguel', 'Luz', 'Água', 'Internet', 'Produtos',
  'Salários', 'Equipamentos', 'Marketing', 'Outros',
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

  useEffect(() => { carregarDespesas() }, [])

  async function carregarDespesas() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const mesAtual = new Date().toISOString().slice(0, 7)
    const { data } = await supabase
      .from('despesas').select('*').eq('user_id', user.id)
      .gte('data', mesAtual + '-01').order('data', { ascending: false })
    setDespesas(data || [])
    setTotalMes(data?.reduce((acc, d) => acc + Number(d.valor), 0) || 0)
  }

  async function handleAdicionarDespesa() {
    if (!descricao || !valor) { setMensagem('Preencha a descrição e o valor.'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('despesas').insert({
      user_id: user!.id, descricao, valor: parseFloat(valor), categoria, data,
    })
    setLoading(false)
    if (error) {
      setMensagem('Erro ao salvar despesa.')
    } else {
      setDescricao(''); setValor(''); setCategoria('')
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

  const inputStyle = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '12px 16px', color: 'var(--text-primary)',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    fontSize: '12px', fontWeight: '500' as const, color: 'var(--text-secondary)',
    display: 'block', marginBottom: '6px',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>ClienteMarcado</span>
        <Link href="/painel" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>← Voltar ao painel</Link>
      </nav>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>Financeiro</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Controle suas despesas mensais</p>

        {/* Total */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px 24px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--danger), transparent)' }} />
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total de despesas este mês</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--danger)' }}>R$ {totalMes.toFixed(2)}</p>
        </div>

        {/* Formulário */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Adicionar despesa</h3>

          <div>
            <label style={labelStyle}>Descrição *</label>
            <input type="text" placeholder="Ex: Aluguel do salão" value={descricao}
              onChange={(e) => setDescricao(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Valor (R$) *</label>
              <input type="number" placeholder="Ex: 1500" value={valor}
                onChange={(e) => setValor(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data</label>
              <input type="date" value={data}
                onChange={(e) => setData(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={inputStyle}>
              <option value="">Selecione...</option>
              {CATEGORIAS_DESPESA.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {mensagem && (
            <p style={{ fontSize: '13px', color: mensagem.includes('Erro') ? 'var(--danger)' : 'var(--success)' }}>
              {mensagem}
            </p>
          )}

          <button onClick={handleAdicionarDespesa} disabled={loading}
            style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Salvando...' : 'Registrar despesa'}
          </button>
        </div>

        {/* Lista */}
        <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Despesas deste mês</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {despesas.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: '14px' }}>Nenhuma despesa registrada este mês.</p>
          )}
          {despesas.map((d) => (
            <div key={d.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '3px' }}>{d.descricao}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.categoria} · {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                <p style={{ fontWeight: '700', color: 'var(--danger)', fontSize: '14px' }}>R$ {Number(d.valor).toFixed(2)}</p>
                <button onClick={() => handleExcluir(d.id)}
                  style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
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