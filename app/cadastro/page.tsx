'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

const BENEFICIOS = [
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    titulo: 'Sua MiniPage pronta',
    desc: 'Crie sua página profissional com seus links, conteúdos e serviços.',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    titulo: 'Tudo em um só lugar',
    desc: 'Redes sociais, vídeos, eventos, serviços e muito mais.',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    titulo: 'Fácil de personalizar',
    desc: 'Escolha cores, banner, links e deixe a página com a sua identidade.',
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
  const [cupom, setCupom] = useState('')
  const [cupomStatus, setCupomStatus] = useState<'idle'|'ok'|'erro'>('idle')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aceitou, setAceitou] = useState(false)
  const [mensagem, setMensagem] = useState('')
  // Tela pós-cadastro (confirmação de e-mail) e reenvio
  const [fase, setFase] = useState<'form' | 'confirmar'>('form')
  const [emailCadastrado, setEmailCadastrado] = useState('')
  const [duplicado, setDuplicado] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [reenvioMsg, setReenvioMsg] = useState('')
  async function validarCupom(c: string) {
    if (!c) { setCupomStatus('idle'); return }
    const { data } = await supabase.from('parceiros').select('id').eq('cupom', c).eq('ativo', true).single()
    setCupomStatus(data ? 'ok' : 'erro')
  }
  // Monta o link de confirmacao sempre com o dominio real (nunca localhost em producao).
  // O fallback antigo apontava pra um subdominio vercel.app desatualizado; agora usa a var
  // ja documentada do projeto (NEXT_PUBLIC_SITE_URL), com o dominio oficial como ultimo recurso.
  function montarRedirectTo() {
    if (typeof window !== 'undefined') return `${window.location.origin}/auth/callback`
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://clientemarcado.com.br'}/auth/callback`
  }
  // Mensagens amigaveis pro cadastro (nunca mostra erro tecnico cru pro usuario)
  function erroCadastroAmigavel(msg: string) {
    const m = (msg || '').toLowerCase()
    if (m.includes('already registered') || m.includes('already exists') || m.includes('user already')) {
      return 'Esse e-mail já possui um cadastro. Verifique sua caixa de entrada ou tente reenviar o e-mail de confirmação.'
    }
    if (m.includes('rate limit') || m.includes('too many requests') || m.includes('security purposes')) {
      return 'Por segurança, aguarde alguns minutos antes de tentar novamente.'
    }
    if (m.includes('invalid') && m.includes('email')) {
      return 'Confira se o e-mail foi digitado corretamente.'
    }
    if (m.includes('password') && (m.includes('short') || m.includes('6 char'))) {
      return 'A senha precisa ter no mínimo 6 caracteres.'
    }
    return 'Não conseguimos concluir seu cadastro agora. Tente novamente ou fale com nosso suporte.'
  }
  // Mensagens amigaveis pro reenvio de confirmacao
  function erroReenvioAmigavel(msg: string) {
    const m = (msg || '').toLowerCase()
    if (m.includes('rate limit') || m.includes('too many requests') || m.includes('security purposes')) {
      return 'Por segurança, aguarde alguns minutos antes de tentar reenviar novamente.'
    }
    if (m.includes('invalid') && m.includes('email')) {
      return 'Confira se o e-mail foi digitado corretamente.'
    }
    return 'Não conseguimos reenviar agora. Entre em contato com o suporte do ClienteMarcado.'
  }
  if (typeof window !== 'undefined') {
   const urlCupom = new URLSearchParams(window.location.search).get('cupom')
    const savedCupom = localStorage.getItem('cm_cupom')
    const cupomFinal = urlCupom || savedCupom
    if (cupomFinal && !cupom) setTimeout(() => {
      setCupom(cupomFinal.toUpperCase())
      validarCupom(cupomFinal.toUpperCase())
    }, 0)
  }
  async function handleCadastro() {
    const jaAceitou = typeof window !== 'undefined' && localStorage.getItem('clienteMarcadoAceitePlano') === 'true'
    if (!aceitou && !jaAceitou) {
      setMensagem('Para criar sua conta, aceite primeiro o contrato do plano.')
      return
    }
    if (aceitou && typeof window !== 'undefined') {
      localStorage.setItem('clienteMarcadoAceitePlano', 'true')
    }
    const planoSalvo = typeof window !== 'undefined' ? localStorage.getItem('cm_plano') : null
    const planoTipo = planoSalvo === 'equipe' ? 'equipe' : planoSalvo === 'minipage' ? 'minipage' : 'essencial'
    setLoading(true)
    setMensagem('')
    const redirectTo = montarRedirectTo()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: redirectTo,
        data: { nome_negocio: nomeUsuario, nome_usuario: nomeUsuario, cupom_indicacao: cupom || null, plano_tipo: planoTipo }
      }
    })
    if (error) {
      const msgAmigavel = erroCadastroAmigavel(error.message)
      // E-mail ja cadastrado: nao cria conta duplicada, mas ja oferece a tela com o botao de reenvio
      const ehDuplicado = error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists') || error.message.toLowerCase().includes('user already')
      if (ehDuplicado) {
        setEmailCadastrado(email)
        setDuplicado(true)
        setFase('confirmar')
        setLoading(false)
        return
      }
      setMensagem('Erro: ' + msgAmigavel)
      setLoading(false)
      return
    }
    // Caso "silencioso": o Supabase, por seguranca, NAO retorna erro quando o e-mail ja existe
    // (confirmado ou nao) - so devolve o usuario com identities vazio. Sem essa checagem, a tela
    // seguia pra "confirme seu e-mail" normalmente, mas nenhum e-mail novo era enviado de verdade.
    const identitiesVazio = Array.isArray(data?.user?.identities) && data.user.identities.length === 0
    if (identitiesVazio) {
      setEmailCadastrado(email)
      setDuplicado(true)
      setFase('confirmar')
      setLoading(false)
      return
    }
    // Garante que nome_negocio/tipo_negocio/plano_tipo cheguem em `perfis`
    // (nao existe trigger no banco que faca essa copia automaticamente)
    if (data?.user?.id) {
      try {
        await fetch('/api/cadastro/criar-perfil', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: data.user.id, nome_negocio: nomeUsuario, plano_tipo: planoTipo })
        })
      } catch (e) { console.warn('Erro ao gravar perfil inicial:', e) }
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
            nome_negocio: null,
            nome_responsavel: nomeUsuario || null,
            email: email.toLowerCase().trim(),
            status: 'cadastrado',
            is_pagante: false,
            comissao_status: 'nenhuma',
            comissao_valor: 0,
            plano_tipo: planoTipo,
          }, { onConflict: 'email,cupom_codigo', ignoreDuplicates: true })
        }
      } catch(e) { console.warn('Indicacao parceiro:', e) }
    }
    setEmailCadastrado(email)
    setDuplicado(false)
    setFase('confirmar')
    setLoading(false)
  }
  async function reenviarConfirmacao() {
    if (!emailCadastrado) return
    setReenviando(true)
    setReenvioMsg('')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: emailCadastrado,
      options: { emailRedirectTo: montarRedirectTo() }
    })
    if (error) {
      // Nunca loga dado sensivel (senha nunca aparece aqui); so a mensagem de erro do Supabase
      console.warn('Erro ao reenviar confirmacao:', error.message)
      setReenvioMsg(erroReenvioAmigavel(error.message))
    } else {
      setReenvioMsg('E-mail reenviado! Verifique sua caixa de entrada e spam.')
    }
    setReenviando(false)
  }
  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #08060A; }
    .pg { min-height: 100vh; background: radial-gradient(circle at 20% 20%,rgba(236,72,153,.12),transparent 30%),radial-gradient(circle at 80% 15%,rgba(139,92,246,.14),transparent 32%),#08060A;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex; flex-direction: column; }
    .col-esquerda { display: none; }
    .pg-body { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 32px 16px 40px; gap: 0; }
    .logo-bloco { width: 100%; max-width: 480px; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 24px; }
    .logo-icone { width: 34px; height: 34px; border-radius: 10px; background: #EC4899; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-texto { font-size: 18px; font-weight: 800; color: #F8F4F7; letter-spacing: -0.02em; }
    .headline-bloco { width: 100%; max-width: 480px; text-align: center; margin-bottom: 24px; }
    .headline-titulo { font-size: 24px; font-weight: 800; color: #F8F4F7; letter-spacing: -0.02em; margin-bottom: 8px; line-height: 1.2; }
    .headline-sub { font-size: 14px; color: #B8AAB8; line-height: 1.55; }
    .form-bloco { width: 100%; max-width: 480px; margin-bottom: 20px; }
    .beneficios-mobile { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 8px; }
    .beneficio-mobile-item { display: flex; align-items: center; gap: 12px; padding: 13px 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 11px; }
    .beneficio-mobile-icone { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; background: rgba(236,72,153,0.1); border: 1px solid rgba(236,72,153,0.15); display: flex; align-items: center; justify-content: center; color: #EC4899; }
    .beneficio-mobile-titulo { font-size: 13px; font-weight: 600; color: #B8AAB8; }
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
    .desk-logo-icone { width: 36px; height: 36px; border-radius: 10px; background: #EC4899; display: flex; align-items: center; justify-content: center; }
    .desk-logo-texto { font-size: 18px; font-weight: 800; color: #F8F4F7; letter-spacing: -0.02em; }
    .desk-hero-titulo { font-size: 38px; font-weight: 800; color: #F8F4F7; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 14px; }
    .desk-hero-titulo span { color: #EC4899; }
    .desk-hero-sub { font-size: 16px; color: #B8AAB8; line-height: 1.6; }
    .desk-beneficios { display: flex; flex-direction: column; gap: 14px; }
    .desk-beneficio { display: flex; align-items: flex-start; gap: 14px; background: linear-gradient(180deg, rgba(18,22,30,0.92) 0%, rgba(10,12,16,0.92) 100%); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px 18px; }
    .desk-beneficio-icone { width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0; background: rgba(236,72,153,0.12); border: 1px solid rgba(236,72,153,0.2); display: flex; align-items: center; justify-content: center; color: #EC4899; }
    .desk-beneficio-titulo { font-size: 14px; font-weight: 700; color: #F8F4F7; margin-bottom: 3px; }
    .desk-beneficio-desc { font-size: 13px; color: #B8AAB8; line-height: 1.45; }
    .card { background: radial-gradient(circle at top right,rgba(139,92,246,.08),transparent 35%),linear-gradient(180deg, rgba(16,20,30,0.98) 0%, rgba(10,12,18,0.98) 100%); border: 1px solid rgba(255,255,255,0.09); border-radius: 20px; padding: 24px 20px; box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03); }
    @media (min-width: 900px) { .card { padding: 36px 32px; } }
    .card-titulo { font-size: 19px; font-weight: 800; color: #F8F4F7; letter-spacing: -0.02em; margin-bottom: 3px; }
    .card-sub { font-size: 13px; color: #B8AAB8; margin-bottom: 22px; }
    .campos { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
    .label { display: block; font-size: 11px; font-weight: 600; color: #B8AAB8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 7px; }
    .hint { font-size: 11px; color: #B8AAB8; margin-top: 5px; }
    .input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 16px; color: #F8F4F7; font-size: 16px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; -webkit-appearance: none; }
    .input:focus { border-color: rgba(236,72,153,0.5); box-shadow: 0 0 0 3px rgba(236,72,153,0.1); }
    .input::placeholder { color: #B8AAB8; }
    .senha-wrap { position: relative; }
    .senha-wrap .input { padding-right: 48px; }
    .olho { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #B8AAB8; display: flex; align-items: center; padding: 4px; -webkit-tap-highlight-color: transparent; }
    .olho:hover { color: #B8AAB8; }
    .btn-criar { width: 100%; background: linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6); color: #fff; font-size: 15px; font-weight: 700; padding: 15px; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 20px rgba(236,72,153,0.35); transition: background 0.15s, box-shadow 0.15s, opacity 0.15s; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; -webkit-tap-highlight-color: transparent; margin-bottom: 14px; }
    .btn-criar:hover { box-shadow: 0 4px 28px rgba(236,72,153,0.5); }
    .btn-criar:disabled { opacity: 0.6; cursor: not-allowed; }
    .link-login { text-align: center; font-size: 13px; color: #B8AAB8; }
    .link-login a { color: #EC4899; font-weight: 600; text-decoration: none; }
    .link-login a:hover { text-decoration: underline; }
    .msg-ok { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #22C55E; margin-bottom: 14px; text-align: center; }
    .msg-err { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #EF4444; margin-bottom: 14px; text-align: center; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #B8AAB8; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .confirmar-icone { width: 56px; height: 56px; border-radius: 16px; background: rgba(34,197,94,0.10); border: 1px solid rgba(34,197,94,0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
    .confirmar-email { font-weight: 700; color: #F8F4F7; word-break: break-all; }
    .btn-secundario { width: 100%; background: rgba(255,255,255,0.04); color: #F8F4F7; font-size: 14px; font-weight: 600; padding: 13px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s, opacity 0.15s; font-family: inherit; -webkit-tap-highlight-color: transparent; text-decoration: none; }
    .btn-secundario:hover { background: rgba(255,255,255,0.07); }
    .btn-secundario:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-whatsapp { width: 100%; background: rgba(34,197,94,0.1); color: #22C55E; font-size: 14px; font-weight: 600; padding: 13px; border: 1px solid rgba(34,197,94,0.25); border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; font-family: inherit; transition: background 0.15s; -webkit-tap-highlight-color: transparent; }
    .btn-whatsapp:hover { background: rgba(34,197,94,0.16); }
    .confirmar-botoes { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
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
              Crie sua página profissional<br />com a <span>MiniPage Pro</span>
            </h1>
            <p className="desk-hero-sub">
              Seus links, conteúdos e serviços<br />
              em uma página profissional.
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
            {fase === 'form' ? (
            <>
            <p className="card-titulo">Criar conta grátis</p>
            <p className="card-sub">É rápido, fácil e sem compromisso.</p>
            <div className="campos">
              <div>
                <label className="label">Seu nome</label>
                <input type="text" placeholder="Ex: Ana Carolina" value={nomeUsuario} onChange={e => setNomeUsuario(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input type="email" placeholder="ana@email.com" value={email} onChange={e => setEmail(e.target.value)} className="input" />
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
              <label style={{display:'block',fontSize:'11px',fontWeight:700,color:'#B8AAB8',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'7px'}}>Cupom de indicação</label>
              <input type="text" placeholder="Ex: ANNA10" value={cupom}
                onChange={e => { setCupom(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'')); setCupomStatus('idle') }}
                onBlur={() => validarCupom(cupom)}
                style={{width:'100%',background:'rgba(24,16,27,.92)',border:`1.5px solid ${cupomStatus==='ok'?'rgba(34,197,94,.5)':cupomStatus==='erro'?'rgba(239,68,68,.4)':'rgba(42,26,47,.18)'}`,borderRadius:'14px',padding:'13px 16px',color:'#F8F4F7',fontSize:'15px',outline:'none',fontFamily:'inherit',transition:'border-color .2s',boxSizing:'border-box' as const}} />
              {cupomStatus==='ok'&&<p style={{fontSize:'11px',color:'#22C55E',marginTop:'5px'}}>✓ Cupom de indicação aplicado com sucesso.</p>}
              {cupomStatus==='erro'&&<p style={{fontSize:'11px',color:'#EF4444',marginTop:'5px'}}>Cupom não encontrado. Você pode continuar sem cupom.</p>}
              {cupomStatus==='idle'&&<p style={{fontSize:'11px',color:'#B8AAB8',marginTop:'5px'}}>Se recebeu um cupom de um parceiro, informe aqui. Campo opcional.</p>}
            </div>
            <div style={{marginBottom:'14px',display:'flex',alignItems:'flex-start',gap:'10px'}}><input type="checkbox" id="aceite" checked={aceitou} onChange={e=>setAceitou(e.target.checked)} style={{marginTop:'2px',accentColor:'#EC4899',width:'15px',height:'15px',flexShrink:0,cursor:'pointer'}} /><label htmlFor="aceite" style={{fontSize:'12px',color:'#B8AAB8',lineHeight:1.5,cursor:'pointer'}}>Li e aceito os <a href="/contrato-de-adesao" target="_blank" rel="noreferrer" onClick={()=>{if(cupom&&typeof window!=='undefined')localStorage.setItem('cm_cupom',cupom)}} style={{color:'#EC4899',textDecoration:'none',fontWeight:600}}>termos de uso e contrato de adesão</a> do ClienteMarcado.</label></div>
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
              Já tem conta? <Link href="/login">Entrar</Link>
            </p>
            </>
            ) : (
            <>
              <div className="confirmar-icone">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <p className="card-titulo" style={{textAlign:'center'}}>
                {duplicado ? 'Esse e-mail já tem cadastro' : 'Conta criada com sucesso!'}
              </p>
              <p className="card-sub" style={{textAlign:'center'}}>
                {duplicado
                  ? 'Enviamos (ou reenviamos) o e-mail de confirmação para:'
                  : 'Enviamos um e-mail de confirmação para:'}
              </p>
              <p className="confirmar-email" style={{textAlign:'center',marginBottom:'18px'}}>{emailCadastrado}</p>
              <p style={{fontSize:'13px',color:'#B8AAB8',lineHeight:1.6,textAlign:'center',marginBottom:'6px'}}>
                Verifique sua caixa de entrada, spam, promoções ou lixo eletrônico.
              </p>
              <p style={{fontSize:'13px',color:'#B8AAB8',lineHeight:1.6,textAlign:'center',marginBottom:'18px'}}>
                Procure por <strong style={{color:'#F8F4F7'}}>ClienteMarcado</strong> ou <strong style={{color:'#F8F4F7'}}>noreply</strong>.
              </p>
              {reenvioMsg && (
                <div className={reenvioMsg.startsWith('Não') || reenvioMsg.startsWith('Por segurança') || reenvioMsg.startsWith('Confira') ? 'msg-err' : 'msg-ok'}>
                  {reenvioMsg}
                </div>
              )}
              <div className="confirmar-botoes">
                <button onClick={reenviarConfirmacao} disabled={reenviando} className="btn-criar">
                  {reenviando ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
                </button>
                <Link href="/login" className="btn-secundario">Ir para login</Link>
                <button type="button" className="btn-secundario" onClick={() => { setFase('form'); setMensagem(''); setDuplicado(false) }}>
                  Digitou o e-mail errado? Voltar para cadastro
                </button>
                <a
                  href={`https://wa.me/5511941059063?text=${encodeURIComponent('Olá! Fiz meu cadastro no ClienteMarcado, mas não recebi o e-mail de confirmação.')}`}
                  target="_blank" rel="noreferrer" className="btn-whatsapp"
                >
                  Falar com o suporte
                </a>
              </div>
            </>
            )}
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
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B8AAB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Seus dados estão protegidos com segurança de nível empresarial.
      </div>
    </div>
  )
}
