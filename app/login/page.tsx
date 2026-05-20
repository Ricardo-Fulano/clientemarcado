'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')

  async function handleLogin() {
    setLoading(true)
    setMensagem('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setMensagem('E-mail ou senha incorretos.')
    } else {
      window.location.href = '/painel'
    }
    setLoading(false)
  }

  const inputStyle = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '10px',
    padding: '12px 16px',
    width: '100%',
    outline: 'none',
    fontSize: '14px',
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>ClienteMarcado</a>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Entre na sua conta</p>
        </div>

        <div className="rounded-2xl p-8 flex flex-col gap-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>E-mail</label>
            <input type="email" placeholder="joao@email.com" value={email}
              onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Senha</label>
            <input type="password" placeholder="Sua senha" value={senha}
              onChange={e => setSenha(e.target.value)} style={inputStyle} />
          </div>

          {mensagem && <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{mensagem}</p>}

          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition mt-1 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Não tem conta?{' '}
            <a href="/cadastro" className="font-semibold" style={{ color: 'var(--accent)' }}>Criar conta grátis</a>
          </p>
        </div>
      </div>
    </main>
  )
}