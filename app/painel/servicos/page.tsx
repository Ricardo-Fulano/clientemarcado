'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

interface Servico {
  id: string
  nome: string
  preco: number
  duracao_minutos: number
}

export default function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [duracaoMinutos, setDuracaoMinutos] = useState('30')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => { carregarServicos() }, [])

  async function carregarServicos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data } = await supabase.from('servicos').select('*').eq('user_id', user.id)
    if (data) setServicos(data)
  }

  async function handleAdicionar() {
    if (!nome || !preco) { setMensagem('Preencha nome e preço.'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('servicos').insert({
      user_id: user?.id, nome, preco: parseFloat(preco), duracao_minutos: parseInt(duracaoMinutos),
    })
    if (error) { setMensagem('Erro ao salvar serviço.') }
    else { setNome(''); setPreco(''); setDuracaoMinutos('30'); setMensagem('Serviço adicionado!'); carregarServicos() }
    setLoading(false)
  }

  async function handleExcluir(id: string) {
    await supabase.from('servicos').delete().eq('id', id)
    carregarServicos()
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

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>Meus serviços</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>Cadastre os serviços que você oferece</p>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Adicionar serviço</h3>

          <div>
            <label style={labelStyle}>Nome do serviço *</label>
            <input type="text" placeholder="Ex: Corte de cabelo" value={nome}
              onChange={(e) => setNome(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Preço (R$) *</label>
              <input type="number" placeholder="Ex: 35" value={preco}
                onChange={(e) => setPreco(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Duração do serviço</label>
              <select value={duracaoMinutos} onChange={(e) => setDuracaoMinutos(e.target.value)} style={inputStyle}>
                <option value="10">10 minutos</option>
                <option value="15">15 minutos</option>
                <option value="20">20 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
                <option value="90">90 minutos</option>
                <option value="120">120 minutos</option>
              </select>
            </div>
          </div>

          {mensagem && (
            <p style={{ fontSize: '13px', color: mensagem.includes('Erro') ? 'var(--danger)' : 'var(--success)' }}>
              {mensagem}
            </p>
          )}

          <button onClick={handleAdicionar} disabled={loading}
            style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Salvando...' : 'Adicionar serviço'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {servicos.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: '14px' }}>Nenhum serviço cadastrado ainda.</p>
          )}
          {servicos.map((s) => (
            <div key={s.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '3px' }}>{s.nome}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>R$ {s.preco?.toFixed(2)} · {s.duracao_minutos || 30} min</p>
              </div>
              <button onClick={() => handleExcluir(s.id)}
                style={{ fontSize: '12px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Excluir
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}