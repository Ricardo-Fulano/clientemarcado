'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import PainelSidebar from '@/app/components/PainelSidebar'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.20),transparent 32%),radial-gradient(circle at top right,rgba(236,72,153,.14),transparent 28%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh;overflow-x:hidden}
.bdy{max-width:480px;margin:0 auto;padding:28px 32px 80px;width:100%;box-sizing:border-box}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.34);padding:28px}
.lbl{font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:6px}
.inp{width:100%;background:rgba(24,16,27,.88);border:1px solid #2A1A2F;border-radius:12px;padding:12px 44px 12px 14px;color:#F8F4F7;font-size:14px;outline:none;font-family:inherit;transition:border-color .15s}
.inp:focus{border-color:#EC4899}
.inp-wrap{position:relative;margin-bottom:16px}
.olho-btn{position:absolute;right:0;top:0;height:100%;width:42px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:#B8AAB8}
.olho-btn:hover{color:#F8F4F7}
.btn-p{width:100%;background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 10px 28px rgba(236,72,153,.28)}
.btn-p:disabled{opacity:.6;cursor:not-allowed}
.msg-ok{background:rgba(34,197,94,.10);border:1px solid rgba(34,197,94,.28);border-radius:10px;padding:10px 14px;font-size:13px;color:#22C55E;margin-bottom:16px}
.msg-err{background:rgba(239,68,68,.10);border:1px solid rgba(239,68,68,.28);border-radius:10px;padding:10px 14px;font-size:13px;color:#EF4444;margin-bottom:16px}
@media(max-width:640px){.bdy{padding:20px 16px 60px}}
`

export default function AlterarSenha() {
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setErro(''); setSucesso(false)
    if (!senha || senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)
    if (error) { setErro('Não foi possível trocar a senha. Tente novamente.'); return }
    setSucesso(true)
    setSenha(''); setConfirmar('')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar tituloMobile="Alterar senha" />
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.03em', marginBottom: '5px' }}>Alterar senha</h1>
            <p style={{ fontSize: '13px', color: '#B8AAB8', lineHeight: 1.5 }}>Escolha uma nova senha para acessar sua conta.</p>
          </div>

          <div className="crd">
            {sucesso && <div className="msg-ok">Senha alterada com sucesso.</div>}
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
          </div>

        </div></div>
      </div>
    </div>
  )
}
