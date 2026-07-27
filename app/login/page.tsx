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
      redirectTo: window.location.origin + '/redefinir-senha',
    })
    setRecuperando(false)
    if (error) setMsgRecuperar('Erro ao enviar. Tente novamente.')
    else setMsgRecuperar('Se esse e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin()
  }

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { overflow-x: hidden; width: 100%; max-width: 100%; }

    .pg {
      min-height: 100vh;
      background:
        radial-gradient(circle at 20% 20%, rgba(236,72,153,0.16), transparent 38%),
        radial-gradient(circle at 80% 10%, rgba(217,70,239,0.14), transparent 32%),
        radial-gradient(circle at 60% 80%, rgba(139,92,246,0.10), transparent 30%),
        linear-gradient(135deg, #08060A 0%, #120A14 50%, #08060A 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }

    .wrap {
      width: 100%;
      max-width: 460px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .logo-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
      text-decoration: none;
    }
    .logo-ic {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #EC4899, #D946EF, #8B5CF6);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 24px rgba(236,72,153,0.35);
      flex-shrink: 0;
    }
    .logo-txt {
      font-size: 18px;
      font-weight: 800;
      color: #F8F4F7;
      letter-spacing: -0.02em;
    }

    .headline {
      text-align: center;
      margin-bottom: 28px;
    }
    .headline h1 {
      font-size: 24px;
      font-weight: 800;
      color: #F8F4F7;
      letter-spacing: -0.03em;
      margin-bottom: 8px;
      line-height: 1.2;
    }
    .headline p {
      font-size: 14px;
      color: #B8AAB8;
      line-height: 1.6;
      max-width: 340px;
      margin: 0 auto;
    }

    .card {
      width: 100%;
      background: radial-gradient(circle at top left, rgba(139,92,246,0.10), transparent 40%), linear-gradient(145deg, rgba(24,16,27,0.97), rgba(18,10,20,0.99));
      border: 1.5px solid rgba(42,26,47,0.18);
      border-radius: 22px;
      padding: 32px 28px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.04);
    }
    @media(max-width:480px) {
      .card { padding: 24px 20px; border-radius: 18px; }
      .headline h1 { font-size: 20px; }
    }

    .campos { display: flex; flex-direction: column; gap: 16px; margin-bottom: 8px; }

    .lbl {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #B8AAB8;
      text-transform: uppercase;
      letter-spacing: .08em;
      margin-bottom: 7px;
    }
    .inp {
      width: 100%;
      background: rgba(24,16,27,0.92);
      border: 1.5px solid rgba(42,26,47,0.18);
      border-radius: 14px;
      padding: 13px 16px;
      color: #F8F4F7;
      font-size: 15px;
      outline: none;
      transition: border-color .2s, box-shadow .2s;
      font-family: inherit;
      -webkit-appearance: none;
      box-sizing: border-box;
    }
    .inp:focus {
      border-color: rgba(139,92,246,0.55);
      box-shadow: 0 0 0 3px rgba(236,72,153,0.14);
    }
    .inp::placeholder { color: #B8AAB8; }

    .senha-wrap { position: relative; }
    .senha-wrap .inp { padding-right: 48px; }
    .olho {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: #B8AAB8;
      display: flex;
      align-items: center;
      padding: 4px;
      transition: color .15s;
    }
    .olho:hover { color: #B8AAB8; }

    .esqueci-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
      margin-bottom: 20px;
    }
    .btn-esqueci {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      font-size: 12px;
      color: #B8AAB8;
      font-family: inherit;
      transition: color .15s;
    }
    .btn-esqueci:hover { color: #8B5CF6; }
    .btn-esqueci:disabled { opacity: 0.6; cursor: not-allowed; }

    .msg-err {
      background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.28);
      border-radius: 12px;
      padding: 11px 14px;
      font-size: 13px;
      color: #EF4444;
      margin-bottom: 16px;
      text-align: center;
    }
    .msg-ok {
      background: rgba(34,197,94,0.12);
      border: 1px solid rgba(34,197,94,0.28);
      border-radius: 12px;
      padding: 11px 14px;
      font-size: 13px;
      color: #22C55E;
      margin-bottom: 16px;
      text-align: center;
    }
    .msg-info {
      font-size: 12px;
      color: #B8AAB8;
      text-align: center;
      margin-bottom: 16px;
    }

    .btn-entrar {
      width: 100%;
      background: linear-gradient(135deg, #EC4899, #D946EF, #8B5CF6);
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      padding: 15px;
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 12px 32px rgba(236,72,153,0.28);
      transition: all .18s;
      font-family: inherit;
      margin-bottom: 18px;
      letter-spacing: -0.01em;
    }
    .btn-entrar:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 40px rgba(236,72,153,0.38);
    }
    .btn-entrar:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .link-cadastro {
      text-align: center;
      font-size: 13px;
      color: #B8AAB8;
    }
    .link-cadastro a {
      color: #8B5CF6;
      font-weight: 600;
      text-decoration: none;
      transition: color .15s;
    }
    .link-cadastro a:hover { color: #C4B5FD; }

    .beneficios {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(42,26,47,0.10);
    }
    .beneficio {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #B8AAB8;
    }
    .beneficio-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(139,92,246,0.16);
      border: 1px solid rgba(139,92,246,0.28);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 9px;
      color: #C4B5FD;
      font-weight: 700;
    }

    .seguranca {
      margin-top: 20px;
      font-size: 11px;
      color: #B8AAB8;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
  `

  return (
    <div className="pg">
      <style>{css}</style>
      <div className="wrap">

        {/* Logo */}
        <a href="/" className="logo-row">
          <div className="logo-ic">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span className="logo-txt">ClienteMarcado</span>
        </a>

        {/* Headline */}
        <div className="headline">
          <h1>Entrar no painel</h1>
          <p>Acesse sua agenda, clientes, cobranças e relatórios em um só lugar.</p>
        </div>

        {/* Card */}
        <div className="card">
          <div className="campos">
            <div>
              <label className="lbl">E-mail</label>
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="inp"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="lbl">Senha</label>
              <div className="senha-wrap">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="inp"
                  autoComplete="current-password"
                />
                <button className="olho" type="button" onClick={() => setMostrarSenha(!mostrarSenha)} aria-label="Mostrar senha">
                  {mostrarSenha
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          </div>

          <div className="esqueci-row">
            <button className="btn-esqueci" onClick={handleEsqueciSenha} disabled={recuperando} type="button">
              {recuperando ? 'Enviando...' : 'Esqueci minha senha'}
            </button>
          </div>

          {mensagem && <div className="msg-err">{mensagem}</div>}

          {msgRecuperar && (
            <div className={msgRecuperar.startsWith('Erro') ? 'msg-err' : msgRecuperar.startsWith('Digite') ? 'msg-info' : 'msg-ok'}>
              {msgRecuperar}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading} className="btn-entrar">
            {loading ? 'Entrando...' : (
              <>
                Entrar no painel
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>

          <p className="link-cadastro">
            Ainda não tem conta?{' '}
            <a href="/cadastro">Criar conta grátis</a>
          </p>

          {/* Benefícios */}
          <div className="beneficios">
            {['Agenda organizada em um só lugar','Clientes e cobranças centralizados','Relatórios e pagamentos simplificados'].map(b => (
              <div key={b} className="beneficio">
                <div className="beneficio-dot">✓</div>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="seguranca">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#B8AAB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Ambiente seguro para gestão do seu negócio.
        </p>

      </div>
    </div>
  )
}
