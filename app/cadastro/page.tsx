'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
const TIPOS_NEGOCIO = [
  'Barbearia',
  'Salão de beleza',
  'Clínica estética',
  'Clínica odontológica',
  'Clínica médica / consultório',
  'Consultoria / atendimento profissional',
  'Outro',
]
const BENEFICIOS = [
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    titulo: 'Página de agendamento pronta',
    desc: 'Seu negócio online em minutos, com sua cara e seu horário.',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    titulo: 'Agenda organizada',
    desc: 'Receba agendamentos, evite conflitos e nunca mais perca horários.',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    titulo: 'Painel simples para acompanhar',
    desc: 'Veja agendamentos, clientes e resultados de forma clara e prática.',
  },
]
const CalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
export default function Cadastro() {
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [tipoNegocio, setTipoNegocio] = useState('')
  const [dropOpen, setDropOpen] = useState(false)
  const [cupom, setCupom] = useState('')
  const [cupomStatus, setCupomStatus] = useState<'idle'|'ok'|'erro'>('idle')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  async function validarCupom(c: string) {
    if (!c) { setCupomStatus('idle'); return }
    const { data } = await supabase.from('parceiros').select('id').eq('cupom', c).eq('ativo', true).single()
    setCupomStatus(data ? 'ok' : 'erro')
  }
  if (typeof window !== 'undefined') {
    const urlCupom = new URLSearchParams(window.location.search).get('cupom')
    if (urlCupom && !cupom) setTimeout(() => {
      setCupom(urlCupom.toUpperCase())
      validarCupom(urlCupom.toUpperCase())
    }, 0)
  }
  async function handleCadastro() {
    if (typeof window !== 'undefined' && localStorage.getItem('clienteMarcadoAceitePlano') !== 'true') {
      setMensagem('Para criar sua conta, aceite primeiro o contrato do plano.')
      return
    }
    setLoading(true)
    setMensagem('')
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'https://clientemarcado.vercel.app/auth/callback'
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: redirectTo,
        data: { nome_negocio: nomeNegocio, tipo_negocio: tipoNegocio, nome_usuario: nomeUsuario, cupom_indicacao: cupom || null }
      }
    })
    if (error) {
      setMensagem('Erro: ' + error.message)
      setLoading(false)
      return
    }
    // Salvar indicação no banco imediatamente se cupom foi usado
    if (cupom && cupom.trim()) {
      const cupomFmt = cupom.trim().toUpperCase()
      try {
        const { data: parceiro } = await supabase
          .from('parceiros')
          .select('id,comissao_fixa')
          .eq('cupom', cupomFmt)
          .eq('ativo', true)
          .single()
        console.log("PARCEIRO ENCONTRADO:", parceiro); if (parceiro) {
          // Upsert evita duplicidade por email+cupom
          await supabase.from('indicacoes_parceiros').upsert({
            parceiro_id: parceiro.id,
            cupom_codigo: cupomFmt,
            nome_negocio: nomeNegocio || null,
            nome_responsavel: nomeUsuario || null,
            email: email.toLowerCase().trim(),
            status: 'cadastrado',
            is_pagante: false,
            comissao_status: 'nenhuma',
            comissao_valor: 0,
          }, { onConflict: 'email,cupom_codigo', ignoreDuplicates: true })
        }
      } catch(e) { console.warn('Indicacao parceiro:', e) }
    }
    setMensagem('Conta criada! Verifique seu e-mail para confirmar.')
    setLoading(false)
  }
  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #08080A; }
    .pg { min-height: 100vh; background: radial-gradient(circle at 20% 20%,rgba(59,130,246,.12),transparent 30%),radial-gradient(circle at 80% 15%,rgba(124,58,237,.14),transparent 32%),#050B16;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex; flex-direction: column; }
    .col-esquerda { display: none; }
    .pg-body { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 32px 16px 40px; gap: 0; }
    .logo-bloco { width: 100%; max-width: 480px; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 24px; }
    .logo-icone { width: 34px; height: 34px; border-radius: 10px; background: #3B82F6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-texto { font-size: 18px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; }
    .headline-bloco { width: 100%; max-width: 480px; text-align: center; margin-bottom: 24px; }
    .headline-titulo { font-size: 24px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 8px; line-height: 1.2; }
    .headline-sub { font-size: 14px; color: #6B7280; line-height: 1.55; }
    .form-bloco { width: 100%; max-width: 480px; margin-bottom: 20px; }
    .beneficios-mobile { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 8px; }
    .beneficio-mobile-item { display: flex; align-items: center; gap: 12px; padding: 13px 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 11px; }
    .beneficio-mobile-icone { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.15); display: flex; align-items: center; justify-content: center; color: #3B82F6; }
    .beneficio-mobile-titulo { font-size: 13px; font-weight: 600; color: #D1D5DB; }
    @media (min-width: 900px) {
      .col-esquerda { display: flex; flex-direction: column; gap: 36px; flex: 1; }
      .logo-bloco { display: none; }
      .headline-bloco { display: none; }
      .beneficios-mobile { display: none; }
      .pg-body { flex-direction: row; align-items: center; justify-content: center; padding: 48px 48px; gap: 64px; }
      .form-bloco { flex: 1; max-width: 480px; margin-bottom: 0; }
      .pg-body > .col-esquerda, .pg-body > .form-bloco { max-width: 480px; }
    }
    .desk-logo-row { display: flex; align-items: center; gap: 10px; }
    .desk-logo-icone { width: 36px; height: 36px; border-radius: 10px; background: #3B82F6; display: flex; align-items: center; justify-content: center; }
    .desk-logo-texto { font-size: 18px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; }
    .desk-hero-titulo { font-size: 38px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 14px; }
    .desk-hero-titulo span { color: #3B82F6; }
    .desk-hero-sub { font-size: 16px; color: #6B7280; line-height: 1.6; }
    .desk-beneficios { display: flex; flex-direction: column; gap: 14px; }
    .desk-beneficio { display: flex; align-items: flex-start; gap: 14px; background: linear-gradient(180deg, rgba(18,22,30,0.92) 0%, rgba(10,12,16,0.92) 100%); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px 18px; }
    .desk-beneficio-icone { width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.2); display: flex; align-items: center; justify-content: center; color: #3B82F6; }
    .desk-beneficio-titulo { font-size: 14px; font-weight: 700; color: #F1F5F9; margin-bottom: 3px; }
    .desk-beneficio-desc { font-size: 13px; color: #6B7280; line-height: 1.45; }
    .card { background: radial-gradient(circle at top right,rgba(124,58,237,.08),transparent 35%),linear-gradient(180deg, rgba(16,20,30,0.98) 0%, rgba(10,12,18,0.98) 100%); border: 1px solid rgba(255,255,255,0.09); border-radius: 20px; padding: 24px 20px; box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03); }
    @media (min-width: 900px) { .card { padding: 36px 32px; } }
    .card-titulo { font-size: 19px; font-weight: 800; color: #F1F5F9; letter-spacing: -0.02em; margin-bottom: 3px; }
    .card-sub { font-size: 13px; color: #6B7280; margin-bottom: 22px; }
    .campos { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
    .label { display: block; font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px; }
    .hint { font-size: 11px; color: #374151; margin-top: 5px; }
    .input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 16px; color: #F1F5F9; font-size: 16px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; -webkit-appearance: none; }
    .input:focus { border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .input::placeholder { color: #374151; }
    .senha-wrap { position: relative; }
    .senha-wrap .input { padding-right: 48px; }
    .olho { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #4B5563; display: flex; align-items: center; padding: 4px; -webkit-tap-highlight-color: transparent; }
    .olho:hover { color: #9CA3AF; }
    .btn-criar { width: 100%; background: linear-gradient(135deg,#3B82F6,#7C3AED); color: #fff; font-size: 15px; font-weight: 700; padding: 15px; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 20px rgba(59,130,246,0.35); transition: background 0.15s, box-shadow 0.15s, opacity 0.15s; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; -webkit-tap-highlight-color: transparent; margin-bottom: 14px; }
    .btn-criar:hover { background: #2563EB; box-shadow: 0 4px 28px rgba(59,130,246,0.5); }
    .btn-criar:disabled { opacity: 0.6; cursor: not-allowed; }
    .link-login { text-align: center; font-size: 13px; color: #4B5563; }
    .link-login a { color: #3B82F6; font-weight: 600; text-decoration: none; }
    .link-login a:hover { text-decoration: underline; }
    .msg-ok { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #22C55E; margin-bottom: 14px; text-align: center; }
    .msg-err { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #EF4444; margin-bottom: 14px; text-align: center; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #374151; display: flex; align-items: center; justify-content: center; gap: 6px; }
  `
  return (
    <div className="pg">
      <style>{css}</style>
      <div className="pg-body">
        <div className="col-esquerda">
          <div className="desk-logo-row">
            <div className="desk-logo-icone"><CalIcon /></div>
            <span className="desk-logo-texto">ClienteMarcado</span>
          </div>
          <div>
            <h1 className="desk-hero-titulo">
              Crie sua conta no<br /><span>ClienteMarcado</span>
            </h1>
            <p className="desk-hero-sub">
              Seu cliente agenda sozinho.<br />
              Você controla tudo pelo painel.
            </p>
          </div>
          <div className="desk-beneficios">
            {BENEFICIOS.map(b => (
              <div key={b.titulo} className="desk-beneficio">
                <div className="desk-beneficio-icone">{b.icon}</div>
                <div>
                  <p className="desk-beneficio-titulo">{b.titulo}</p>
                  <p className="desk-beneficio-desc">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="logo-bloco">
          <div className="logo-icone"><CalIcon /></div>
          <span className="logo-texto">ClienteMarcado</span>
        </div>
        <div className="headline-bloco">
          <h1 className="headline-titulo">Crie sua conta grátis</h1>
          <p className="headline-sub">Configure sua Página de agendamento em poucos minutos.</p>
        </div>
        <div className="form-bloco">
          <div className="card">
            <p className="card-titulo">Criar conta grátis</p>
            <p className="card-sub">É rápido, fácil e sem compromisso.</p>
            <div className="campos">
              <div>
                <label className="label">Tipo de negócio</label>
                <div style={{position:'relative',width:'100%'}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setDropOpen(false)}}>
                  <button type="button" onClick={()=>setDropOpen(!dropOpen)}
                    style={{width:'100%',background:'rgba(15,23,42,.92)',border:`1.5px solid ${dropOpen?'#3B82F6':'rgba(148,163,184,.18)'}`,borderRadius:'14px',padding:'13px 16px',color:tipoNegocio?'#F8FAFC':'#475569',fontSize:'15px',fontFamily:'inherit',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',textAlign:'left' as const,transition:'border-color .2s',boxShadow:dropOpen?'0 0 0 3px rgba(59,130,246,.14)':'none'}}>
                    <span>{tipoNegocio||'Selecione o tipo...'}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,transition:'transform .2s',transform:dropOpen?'rotate(180deg)':'none',color:'#64748B'}}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {dropOpen&&(
                    <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,right:0,background:'#0F172A',border:'1.5px solid rgba(59,130,246,.35)',borderRadius:'14px',padding:'6px',zIndex:50,boxShadow:'0 16px 40px rgba(0,0,0,.6)',overflow:'hidden'}}>
                      {TIPOS_NEGOCIO.map(t=>(
                        <button key={t} type="button" tabIndex={0}
                          onClick={()=>{setTipoNegocio(t);setDropOpen(false)}}
                          style={{width:'100%',padding:'10px 14px',background:tipoNegocio===t?'rgba(59,130,246,.22)':'transparent',border:'none',borderRadius:'10px',color:tipoNegocio===t?'#60A5FA':'#F8FAFC',fontSize:'14px',fontFamily:'inherit',cursor:'pointer',textAlign:'left' as const,transition:'background .12s',display:'block',fontWeight:tipoNegocio===t?600:400}}
                          onMouseEnter={e=>(e.currentTarget.style.background=tipoNegocio===t?'rgba(59,130,246,.28)':'rgba(59,130,246,.10)')}
                          onMouseLeave={e=>(e.currentTarget.style.background=tipoNegocio===t?'rgba(59,130,246,.22)':'transparent')}>
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="hint">Isso ajuda a preparar sua Página de agendamento.</p>
              </div>
              <div>
                <label className="label">Nome do negócio</label>
                <input type="text" placeholder="Ex: Barbearia do João" value={nomeNegocio} onChange={e => setNomeNegocio(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Seu nome</label>
                <input type="text" placeholder="Ex: João Silva" value={nomeUsuario} onChange={e => setNomeUsuario(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input type="email" placeholder="joao@email.com" value={email} onChange={e => setEmail(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Senha</label>
                <div className="senha-wrap">
                  <input type={mostrarSenha ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={senha} onChange={e => setSenha(e.target.value)} className="input" />
                  <button className="olho" type="button" onClick={() => setMostrarSenha(!mostrarSenha)}>
                    {mostrarSenha ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>
            {mensagem && (
              <div className={mensagem.startsWith('Erro') ? 'msg-err' : 'msg-ok'}>
                {mensagem}
              </div>
            )}
            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'7px'}}>Cupom de indicação</label>
              <input type="text" placeholder="Ex: JOAO" value={cupom}
                onChange={e => { setCupom(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'')); setCupomStatus('idle') }}
                onBlur={() => validarCupom(cupom)}
                style={{width:'100%',background:'rgba(15,23,42,.92)',border:`1.5px solid ${cupomStatus==='ok'?'rgba(34,197,94,.5)':cupomStatus==='erro'?'rgba(239,68,68,.4)':'rgba(148,163,184,.18)'}`,borderRadius:'14px',padding:'13px 16px',color:'#F8FAFC',fontSize:'15px',outline:'none',fontFamily:'inherit',transition:'border-color .2s',boxSizing:'border-box' as const}} />
              {cupomStatus==='ok'&&<p style={{fontSize:'11px',color:'#4ADE80',marginTop:'5px'}}>✓ Cupom de indicação aplicado com sucesso.</p>}
              {cupomStatus==='erro'&&<p style={{fontSize:'11px',color:'#F87171',marginTop:'5px'}}>Cupom não encontrado. Você pode continuar sem cupom.</p>}
              {cupomStatus==='idle'&&<p style={{fontSize:'11px',color:'#475569',marginTop:'5px'}}>Se recebeu um cupom de um parceiro, informe aqui. Campo opcional.</p>}
            </div>
            <button onClick={handleCadastro} disabled={loading} className="btn-criar">
              {loading ? 'Criando conta...' : (
                <>
                  Criar minha conta
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>
            <p className="link-login">
              Já tem conta? <a href="/login">Entrar</a>
            </p>
          </div>
        </div>
        <div className="beneficios-mobile">
          {BENEFICIOS.map(b => (
            <div key={b.titulo} className="beneficio-mobile-item">
              <div className="beneficio-mobile-icone">{b.icon}</div>
              <span className="beneficio-mobile-titulo">{b.titulo}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="footer">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Seus dados estão protegidos com segurança de nível empresarial.
      </div>
    </div>
  )
}
