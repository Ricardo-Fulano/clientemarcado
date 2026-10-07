'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const MSG_PADRAO = 'Não foi possível concluir a transferência. Tente novamente.'

export default function AceitarConvite() {
  const params = useParams()
  const token = (params?.token as string) || ''

  const [carregando, setCarregando] = useState(true)
  const [valido, setValido] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [emailNovo, setEmailNovo] = useState('')

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [precisaLogin, setPrecisaLogin] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  // E-mail da sessao atual do navegador (se houver). Serve SO para avisar quando e outra
  // conta - o e-mail do convite continua vindo exclusivamente do token.
  const [emailSessao, setEmailSessao] = useState('')

  useEffect(() => {
    async function validar() {
      const res = await fetch(`/api/convite/validar?token=${encodeURIComponent(token)}`)
      const data = await res.json()
      setValido(!!data.valido)
      if (data.valido) {
        setNomeNegocio(data.nome_negocio)
        setEmailNovo(data.email_novo)
        // Se o e-mail do convite ja tem conta, vai direto para "entre para assumir".
        if (data.conta_existente) setPrecisaLogin(true)
      } else {
        setMotivo(data.motivo || 'Não foi possível validar este convite.')
      }
      setCarregando(false)
    }
    if (token) validar()
  }, [token])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmailSessao(data.session?.user?.email || ''))
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sessao) => setEmailSessao(sessao?.user?.email || ''))
    return () => sub.subscription.unsubscribe()
  }, [])

  const sessaoDeOutraConta = !!emailSessao && !!emailNovo && emailSessao.toLowerCase() !== emailNovo.toLowerCase()
  const sessaoCorreta = !!emailSessao && !!emailNovo && emailSessao.toLowerCase() === emailNovo.toLowerCase()

  async function aceitarComSenha() {
    setErro('')
    if (!senha || senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }
    setEnviando(true)
    try {
      // Sem Authorization de proposito: a conta nova e criada pelo servidor para o e-mail do
      // convite, qualquer sessao antiga do navegador e ignorada.
      const res = await fetch('/api/convite/aceitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.codigo === 'JA_TEM_CONTA') { setPrecisaLogin(true); return }
        setErro(data.error || MSG_PADRAO)
        return
      }
      // Conta criada e pagina transferida: entra direto com a senha que acabou de definir.
      const { error: erroLogin } = await supabase.auth.signInWithPassword({ email: emailNovo, password: senha })
      if (!erroLogin) { window.location.href = '/painel'; return }
      setSucesso(true)
    } catch {
      setErro(MSG_PADRAO)
    } finally {
      setEnviando(false)
    }
  }

  async function aceitarLogado() {
    setErro('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setErro('Entre primeiro com o e-mail do convite.'); return }
    setEnviando(true)
    try {
      const res = await fetch('/api/convite/aceitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErro(data.error || MSG_PADRAO); return }
      window.location.href = '/painel'
    } catch {
      setErro(MSG_PADRAO)
    } finally {
      setEnviando(false)
    }
  }

  async function sairDaConta() {
    await supabase.auth.signOut()
    setEmailSessao('')
    setErro('')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#08060A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99))', border: '1.5px solid #2A1A2F', borderRadius: '20px', padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '18px', fontWeight: 800, color: '#fff' }}>C</div>

        {carregando ? (
          <p style={{ fontSize: '14px', color: '#B8AAB8' }}>Verificando convite...</p>
        ) : sucesso ? (
          <>
            <p style={{ fontSize: '19px', fontWeight: 800, color: '#F8F4F7', marginBottom: '10px' }}>Tudo pronto!</p>
            <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '20px' }}>Você agora é responsável por esta página profissional. Já pode acessar o painel com seu e-mail e senha.</p>
            <Link href="/login" style={{ display: 'inline-block', background: G, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '14px', padding: '13px 26px', borderRadius: '12px' }}>Ir para o login</Link>
          </>
        ) : !valido ? (
          <>
            <p style={{ fontSize: '19px', fontWeight: 800, color: '#F8F4F7', marginBottom: '10px' }}>Convite indisponível</p>
            <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.6 }}>{motivo}</p>
          </>
        ) : precisaLogin ? (
          <>
            <p style={{ fontSize: '19px', fontWeight: 800, color: '#F8F4F7', marginBottom: '10px' }}>Você já tem uma conta</p>
            <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '18px' }}>Este e-mail já possui uma conta: <strong style={{ color: '#F8F4F7' }}>{emailNovo}</strong>. Entre com ele para assumir a página <strong style={{ color: '#EC4899' }}>{nomeNegocio}</strong>.</p>
            {sessaoDeOutraConta && (
              <div style={{ background: 'rgba(245,158,11,.10)', border: '1px solid rgba(245,158,11,.30)', borderRadius: '12px', padding: '12px', marginBottom: '14px', fontSize: '13px', color: '#F5C26B', lineHeight: 1.5 }}>
                Você está logado como <strong>{emailSessao}</strong>, que não é o e-mail do convite.
                <button type="button" onClick={sairDaConta} style={{ display: 'block', margin: '8px auto 0', background: 'transparent', border: '1px solid rgba(245,158,11,.40)', color: '#F5C26B', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Sair desta conta</button>
              </div>
            )}
            {erro && <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '14px' }}>{erro}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!sessaoCorreta && (
                <Link href="/login" target="_blank" style={{ background: 'rgba(24,16,27,.92)', border: '1px solid rgba(229,72,184,.28)', color: '#F8F4F7', textDecoration: 'none', fontWeight: 600, fontSize: '14px', padding: '12px', borderRadius: '12px' }}>Entrar (nova aba)</Link>
              )}
              <button type="button" onClick={aceitarLogado} disabled={enviando || sessaoDeOutraConta} style={{ background: G, color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', padding: '13px', borderRadius: '12px', cursor: sessaoDeOutraConta ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: enviando || sessaoDeOutraConta ? .6 : 1 }}>
                {enviando ? 'Confirmando...' : (sessaoCorreta ? 'Assumir a página' : 'Já entrei, assumir a página')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: '19px', fontWeight: 800, color: '#F8F4F7', marginBottom: '6px' }}>Você recebeu acesso</p>
            <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '6px' }}>Você foi convidada(o) a assumir a página profissional</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#EC4899', marginBottom: '20px' }}>{nomeNegocio}</p>
            <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '18px' }}>Crie uma senha para acessar com o e-mail <strong style={{ color: '#F8F4F7' }}>{emailNovo}</strong>:</p>

            <div style={{ textAlign: 'left', marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em' }}>Nova senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" style={{ width: '100%', background: 'rgba(24,16,27,.92)', border: '1.5px solid #2A1A2F', borderRadius: '12px', padding: '12px 14px', color: '#F8F4F7', fontSize: '14px', marginTop: '6px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em' }}>Confirmar senha</label>
              <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="Repita a senha" style={{ width: '100%', background: 'rgba(24,16,27,.92)', border: '1.5px solid #2A1A2F', borderRadius: '12px', padding: '12px 14px', color: '#F8F4F7', fontSize: '14px', marginTop: '6px', boxSizing: 'border-box' }} />
            </div>

            {erro && <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '14px' }}>{erro}</p>}

            <button type="button" onClick={aceitarComSenha} disabled={enviando} style={{ width: '100%', background: G, color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', padding: '13px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', opacity: enviando ? .7 : 1 }}>
              {enviando ? 'Criando...' : 'Criar senha e acessar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
