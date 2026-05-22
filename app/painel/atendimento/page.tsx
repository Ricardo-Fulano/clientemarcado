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
    if (!profissionalNome.trim()) { setErro('Informe o nome do profissional.'); return }
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
    } else {
      setSucesso(true)
      setProfissionalNome(''); setClienteNome(''); setClienteTelefone('')
      setServico(''); setValor(''); setObservacao('')
      setTimeout(() => setSucesso(false), 3000)
    }
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

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>Registrar atendimento</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>Registre atendimentos presenciais na hora</p>

        {sucesso && (
          <div style={{ background: 'var(--success-soft)', border: '1px solid var(--success-border)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--success)' }}>
            ✅ Atendimento registrado com sucesso!
          </div>
        )}

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          <div>
            <label style={labelStyle}>Nome do profissional *</label>
            <input type="text" placeholder="Ex: Antonio, João..." value={profissionalNome}
              onChange={(e) => setProfissionalNome(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Serviço realizado (opcional)</label>
            <input type="text" placeholder="Ex: Corte, Barba, Escova..." value={servico}
              onChange={(e) => setServico(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Nome do cliente (opcional)</label>
            <input type="text" placeholder="Ex: Carlos Silva" value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Telefone (opcional)</label>
            <input type="text" placeholder="Ex: (11) 99999-9999" value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Valor cobrado (R$)</label>
            <input type="number" placeholder="Ex: 35" value={valor}
              onChange={(e) => setValor(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Observação (opcional)</label>
            <textarea placeholder="Ex: cliente preferiu franja mais curta" value={observacao}
              onChange={(e) => setObservacao(e.target.value)} rows={3}
              style={{ ...inputStyle, resize: 'none' as const }} />
          </div>

          {erro && <p style={{ fontSize: '13px', color: 'var(--danger)' }}>{erro}</p>}

          <button onClick={handleRegistrar} disabled={loading}
            style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Registrando...' : 'Registrar atendimento'}
          </button>
        </div>
      </div>
    </main>
  )
}