'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
.pg{min-height:100vh;background:radial-gradient(circle at 20% 20%,rgba(236,72,153,.12),transparent 30%),radial-gradient(circle at 80% 15%,rgba(139,92,246,.14),transparent 32%),#08060A;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
.logo-row{display:flex;align-items:center;gap:10px;margin-bottom:28px}
.logo-ic{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(236,72,153,.35)}
.logo-txt{font-size:16px;font-weight:800;color:#F8F4F7;letter-spacing:-0.02em}
.card{width:100%;max-width:400px;background:radial-gradient(circle at top left,rgba(236,72,153,.06),transparent 40%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:20px;padding:32px;box-shadow:0 20px 56px rgba(0,0,0,.4)}
.titulo{font-size:19px;font-weight:800;color:#F8F4F7;margin-bottom:6px}
.sub{font-size:13px;color:#B8AAB8;line-height:1.5;margin-bottom:22px}
.lbl{font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px}
.inp{width:100%;background:rgba(24,16,27,.88);border:1px solid #2A1A2F;border-radius:12px;padding:12px 44px 12px 14px;color:#F8F4F7;font-size:14px;outline:none;font-family:inherit;transition:border-color .15s}
.inp:focus{border-color:#EC4899}
.inp-wrap{position:relative;margin-bottom:16px}
.olho-btn{position:absolute;right:0;top:0;height:100%;width:42px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:#B8AAB8}
.olho-btn:hover{color:#F8F4F7}
.btn-p{width:100%;background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 28px rgba(236,72,153,.28)}
.btn-p:disabled{opacity:.6;cursor:not-allowed}
.msg-ok{background:rgba(34,197,94,.10);border:1px solid rgba(34,197,94,.28);border-radius:10px;padding:10px 14px;font-size:13px;color:#22C55E;margin-bottom:14px}
.msg-err{background:rgba(239,68,68,.10);border:1px solid rgba(239,68,68,.28);border-radius:10px;padding:10px 14px;font-size:13px;color:#EF4444;margin-bottom:14px}
.voltar{display:block;text-align:center;margin-top:18px;font-size:13px;color:#B8AAB8;text-decoration:none}
.voltar:hover{color:#F8F4F7}
`

export default function RedefinirSenha() {
  const [pronto, setPronto] = useState(false)
  const [linkInvalido, setLinkInvalido] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPronto(true)
    })
    // Fallback: se ja existir sessao valida no momento em que a pagina carrega
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setPronto(true)
      else setTimeout(() => { if (!pronto) setLinkInvalido(true) }, 2500)
    })
    return () => { listener.subscription.unsubscribe() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function salvar() {
    setErro('')
    if (!senha || senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)
    if (error) { setErro('Não foi possível trocar a senha. Tente novamente.'); return }
    setSucesso(true)
    await supabase.auth.signOut()
    setTimeout(() => { window.location.href = '/login' }, 2000)
  }

  return (
    <div className="pg">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="logo-row">
        <div className="logo-ic">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span className="logo-txt">ClienteMarcado</span>
      </div>

      <div className="card">
        {sucesso ? (
          <>
            <p className="titulo">Senha alterada com sucesso.</p>
            <p className="sub">Você já pode entrar com sua nova senha. Redirecionando para o login...</p>
          </>
        ) : linkInvalido ? (
          <>
            <p className="titulo">Link inválido ou expirado</p>
            <p className="sub">Solicite um novo link de redefinição na tela de login.</p>
            <Link href="/login" className="voltar">← Voltar para o login</Link>
          </>
        ) : !pronto ? (
          <>
            <p className="titulo">Verificando link...</p>
            <p className="sub">Aguarde um instante.</p>
          </>
        ) : (
          <>
            <p className="titulo">Defina sua nova senha</p>
            <p className="sub">Escolha uma senha com pelo menos 6 caracteres.</p>
            {erro && <div className="msg-err">{erro}</div>}
            <label className="lbl">Nova senha</label>
            <div className="inp-wrap">
              <input type={verSenha ? 'text' : 'password'} className="inp" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" />
              <button type="button" className="olho-btn" onClick={() => setVerSenha(v => !v)} aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}>
                {verSenha ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.7 18.7 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <label className="lbl">Confirmar nova senha</label>
            <div className="inp-wrap">
              <input type={verConfirmar ? 'text' : 'password'} className="inp" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="••••••••" />
              <button type="button" className="olho-btn" onClick={() => setVerConfirmar(v => !v)} aria-label={verConfirmar ? 'Esconder senha' : 'Mostrar senha'}>
                {verConfirmar ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.7 18.7 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <button className="btn-p" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar nova senha'}</button>
          </>
        )}
      </div>
    </div>
  )
}
