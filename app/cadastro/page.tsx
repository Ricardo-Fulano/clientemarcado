'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const TIPOS_NEGOCIO = ['Barbearia', 'Salão de cabeleireiro', 'Clínica estética', 'Clínica odontológica', 'Clínica médica', 'Petshop', 'Outro']

export default function Cadastro() {
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [tipoNegocio, setTipoNegocio] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')

  async function handleCadastro() {
    setLoading(true)
    setMensagem('')
    const { error } = await supabase.auth.signUp({
      email, password: senha,
      options: { data: { nome_negocio: nomeNegocio, tipo_negocio: tipoNegocio, nome_usuario: nomeUsuario } }
    })
    if (error) { setMensagem('Erro: ' + error.message) }
    else { setMensagem('Conta criada! Verifique seu e-mail para confirmar.') }
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

  const labelStyle = { color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '6px' }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>ClienteMarcado</a>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Crie sua conta gratuitamente</p>
        </div>

        <div className="rounded-2xl p-8 flex flex-col gap-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

          <div>
            <label style={labelStyle}>Tipo de negócio</label>
            <select value={tipoNegocio} onChange={e => setTipoNegocio(e.target.value)} style={inputStyle}>
              <option value="">Selecione o tipo...</option>
              {TIPOS_NEGOCIO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Nome do negócio</label>
            <input type="text" placeholder="Ex: Barbearia do João" value={nomeNegocio}
              onChange={e => setNomeNegocio(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Seu nome</label>
            <input type="text" placeholder="Ex: João Silva" value={nomeUsuario}
              onChange={e => setNomeUsuario(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>E-mail</label>
            <input type="email" placeholder="joao@email.com" value={email}
              onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Senha</label>
            <input type="password" placeholder="Mínimo 6 caracteres" value={senha}
              onChange={e => setSenha(e.target.value)} style={inputStyle} />
          </div>

          {mensagem && (
            <p className="text-sm text-center" style={{ color: mensagem.startsWith('Erro') ? 'var(--danger)' : 'var(--success)' }}>
              {mensagem}
            </p>
          )}

          <button onClick={handleCadastro} disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition mt-1 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            {loading ? 'Criando conta...' : 'Criar minha conta'}
          </button>

          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Já tem conta?{' '}
            <a href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>Entrar</a>
          </p>
        </div>
      </div>
    </main>
  )
}