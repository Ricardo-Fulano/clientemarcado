'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [recuperando, setRecuperando] = useState(false)
  const [msgRecuperar, setMsgRecuperar] = useState('')

  async function handleLogin() {
    setLoading(true)
    setMensagem('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setMensagem('E-mail ou senha incorretos.')
    else window.location.href = '/painel'
    setLoading(false)
  }

  async function handleEsqueciSenha() {
    if (!email) { setMsgRecuperar('Digite seu e-mail acima primeiro.'); return }
    setRecuperando(true)
    setMsgRecuperar('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/painel',
    })
    setRecuperando(false)
    if (error) setMsgRecuperar('Erro ao enviar. Tente novamente.')
    else setMsgRecuperar('Link enviado! Verifique seu e-mail.')
  }

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #08080A; }

    .pg {
      min-height: 100vh;
      background: #08080A;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px 40px;
    }

    .wrap {
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* ── Logo ── */
    .logo-row {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 20px;
      text-decoration: none;
    }
    .logo-icone {
      width: 34px; height: 34px; border-radius: 10px;
      background: #3B82F6;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .logo-texto {
      font-size: 18px; font-weight: 800;
      color: #F1F5F9; letter-spacing: -0.02em;
    }

    /* ── Headline ── */
    .headline { text-align: center; margin-bottom: 24px; }
    .headline h1 {
      font-size: 22px; font-weight: 800;
      color: #F1F5F9; letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    .headline p { font-size: 14px; color: #6B7280; line-height: 1.5; }

    /* ── Card ── */
    .card {
      width: 100%;
      background: linear-gradient(180deg, rgba(16,20,30,0.98) 0%, rgba(10,12,18,0.98) 100%);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 20px;
      padding: 28px 24px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
    }
    @media (min-width: 480px) { .card { padding: 32px 28px; } }

    /* ── Campos ── */
    .campos { display: flex; flex-direction: column; gap: 14px; margin-bottom: 8px; }
    .label {
      display: block; font-size: 11px; font-weight: 600;
      color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em;
      margin-bottom: 7px;
    }
    .input {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 14px 16px;
      color: #F1F5F9;
      font-size: 16px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-appearance: none;
    }
    .input:focus {
      border-color: rgba(59,130,246,0.5);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .input::placeholder { color: #374151; }

    .senha-wrap { position: relative; }
    .senha-wrap .input { padding-right: 48px; }
    .olho {
      position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #4B5563;
      display: flex; align-items: center; padding: 4px;
      -webkit-tap-highlight-color: transparent;
    }
    .olho:hover { color: #9CA3AF; }

    /* ── Esqueci senha ── */
    .esqueci-row {
      display: flex; justify-content: flex-end;
      margin-top: 6px; margin-bottom: 18px;
    }
    .btn-esqueci {
      background: none; border: none; cursor: pointer; padding: 0;
      font-size: 12px; color: #4B5563;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      transition: color 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-esqueci:hover { color: #3B82F6; }
    .btn-esqueci:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ── Mensagens ── */
    .msg-err { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #EF4444; margin-bottom: 14px; text-align: center; }
    .msg-ok  { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #22C55E; margin-bottom: 14px; text-align: center; }
    .msg-info { font-size: 12px; color: #6B7280; text-align: center; margin-bottom: 14px; }

    /* ── Botão ── */
    .btn-entrar {
      width: 100%;
      background: #3B82F6; color: #fff;
      font-size: 15px; font-weight: 700;
      padding: 15px;
      border: none; border-radius: 12px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 20px rgba(59,130,246,0.35);
      transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-tap-highlight-color: transparent;
      margin-bottom: 16px;
    }
    .btn-entrar:hover   { background: #2563EB; box-shadow: 0 4px 28px rgba(59,130,246,0.5); }
    .btn-entrar:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ── Link cadastro ── */
    .link-cadastro { text-align: center; font-size: 13px; color: #4B5563; }
    .link-cadastro a { color: #3B82F6; font-weight: 600; text-decoration: none; }
    .link-cadastro a:hover { text-decoration: underline; }
  `

  return (
    <div className="pg">
      <style>{css}</style>

      <div className="wrap">

        {/* Logo */}
        <a href="/" className="logo-row">
          <div className="logo-icone">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span className="logo-texto">ClienteMarcado</span>
        </a>

        {/* Headline */}
        <div className="headline">
          <h1>Entrar no ClienteMarcado</h1>
          <p>Acesse seu painel e acompanhe seus agendamentos.</p>
        </div>

        {/* Card */}
        <div className="card">
          <div className="campos">
            <div>
              <label className="label">E-mail</label>
              <input type="email" placeholder="joao@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="input" />
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="senha-wrap">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={senha} onChange={e => setSenha(e.target.value)}
                  className="input" />
                <button className="olho" type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>
                  {mostrarSenha
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Esqueci minha senha */}
          <div className="esqueci-row">
            <button className="btn-esqueci" onClick={handleEsqueciSenha} disabled={recuperando} type="button">
              {recuperando ? 'Enviando...' : 'Esqueci minha senha'}
            </button>
          </div>

          {/* Mensagem de erro de login */}
          {mensagem && <div className="msg-err">{mensagem}</div>}

          {/* Mensagem de recuperação */}
          {msgRecuperar && (
            <div className={msgRecuperar.startsWith('Erro') ? 'msg-err' : msgRecuperar.startsWith('Digite') ? 'msg-info' : 'msg-ok'}>
              {msgRecuperar}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading} className="btn-entrar">
            {loading ? 'Entrando...' : (
              <>
                Entrar
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>

          <p className="link-cadastro">
            Não tem conta?{' '}
            <a href="/cadastro">Criar conta grátis</a>
          </p>
        </div>

      </div>
    </div>
  )
}
