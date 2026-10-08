'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const MSG_PADRAO = 'Não foi possível concluir a transferência. Tente novamente.'
// Guarda o convite em andamento para voltar a ele depois de redefinir a senha.
const CHAVE_PENDENTE = 'cm_convite_pendente'

const campo: React.CSSProperties = { width: '100%', background: 'rgba(24,16,27,.92)', border: '1.5px solid #2A1A2F', borderRadius: '12px', padding: '12px 14px', color: '#F8F4F7', fontSize: '14px', marginTop: '6px', boxSizing: 'border-box' }
const rotulo: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: '#B8AAB8', textTransform: 'uppercase', letterSpacing: '.05em' }
const botaoPrincipal = (desabilitado: boolean): React.CSSProperties => ({ width: '100%', background: G, color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', padding: '13px', borderRadius: '12px', cursor: desabilitado ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: desabilitado ? .65 : 1 })
const botaoLink: React.CSSProperties = { background: 'transparent', border: 'none', color: '#EC4899', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '6px' }

export default function AceitarConvite() {
  const params = useParams()
  const token = (params?.token as string) || ''

  const [carregando, setCarregando] = useState(true)
  const [valido, setValido] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [nomeNegocio, setNomeNegocio] = useState('')
  // O e-mail vem SEMPRE do convite (token). Nunca da sessao nem de um campo editavel.
  const [emailNovo, setEmailNovo] = useState('')
  const [contaExistente, setContaExistente] = useState<boolean | null>(null)

  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar')
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [termos, setTermos] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState('')
  const [concluidoSemLogin, setConcluidoSemLogin] = useState(false)
  // E-mail da sessao atual do navegador: serve so para avisar quando e outra conta.
  const [emailSessao, setEmailSessao] = useState('')

  useEffect(() => {
    async function validar() {
      const res = await fetch(`/api/convite/validar?token=${encodeURIComponent(token)}`)
      const data = await res.json()
      setValido(!!data.valido)
      if (data.valido) {
        setNomeNegocio(data.nome_negocio)
        setEmailNovo(data.email_novo)
        setContaExistente(typeof data.conta_existente === 'boolean' ? data.conta_existente : null)
        // Conta existente -> entrar. E-mail sem conta -> criar. Incerto -> entrar (com link para criar).
        setModo(data.conta_existente === false ? 'criar' : 'entrar')
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

  async function assumirComSessao(accessToken: string) {
    const res = await fetch('/api/convite/aceitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
      body: JSON.stringify({ token }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setErro(data.error || MSG_PADRAO); return false }
    return true
  }

  // Cenario A: ja tem conta. Entra com o e-mail DO CONVITE (nao editavel) + senha e assume.
  async function entrarEAssumir() {
    setErro(''); setInfo('')
    if (!senha) { setErro('Digite sua senha.'); return }
    setEnviando(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailNovo, password: senha })
      if (error || !data.session) {
        const code = (error as { code?: string } | null)?.code
        setErro(code === 'email_not_confirmed'
          ? 'Seu e-mail ainda não foi confirmado. Use "Esqueci minha senha" para liberar o acesso.'
          : 'E-mail ou senha incorretos.')
        return
      }
      if (await assumirComSessao(data.session.access_token)) window.location.href = '/painel'
    } catch { setErro(MSG_PADRAO) } finally { setEnviando(false) }
  }

  // Ja logado com o e-mail certo (por exemplo, apos redefinir a senha): so confirma.
  async function assumirLogado() {
    setErro(''); setInfo('')
    setEnviando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setErro('Entre com sua senha para continuar.'); return }
      if (await assumirComSessao(session.access_token)) window.location.href = '/painel'
    } catch { setErro(MSG_PADRAO) } finally { setEnviando(false) }
  }

  // Cenario B: sem conta. Cria (nome + senha + termos), assume e entra automaticamente.
  async function criarEAssumir() {
    setErro(''); setInfo('')
    if (nome.trim().length < 2) { setErro('Informe seu nome.'); return }
    if (!senha || senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }
    if (!termos) { setErro('Aceite os termos de uso para continuar.'); return }
    setEnviando(true)
    try {
      const res = await fetch('/api/convite/aceitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nome: nome.trim(), senha, confirmar, termos: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.codigo === 'JA_TEM_CONTA') { setContaExistente(true); setModo('entrar'); setSenha(''); setInfo('Este e-mail já possui uma conta. Entre para assumir a página.'); return }
        setErro(data.error || MSG_PADRAO)
        return
      }
      if (data.session?.access_token && data.session?.refresh_token) {
        const { error: erroSessao } = await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
        if (!erroSessao) { window.location.href = '/painel'; return }
      }
      const { error: erroLogin } = await supabase.auth.signInWithPassword({ email: emailNovo, password: senha })
      if (!erroLogin) { window.location.href = '/painel'; return }
      setConcluidoSemLogin(true)
    } catch { setErro(MSG_PADRAO) } finally { setEnviando(false) }
  }

  // Recuperacao de senha dentro do convite: guarda o contexto para voltar aqui depois.
  async function esqueciSenha() {
    setErro(''); setInfo('')
    try { localStorage.setItem(CHAVE_PENDENTE, JSON.stringify({ token, ate: Date.now() + 2 * 60 * 60 * 1000 })) } catch { /* sem localStorage: segue sem contexto */ }
    const { error } = await supabase.auth.resetPasswordForEmail(emailNovo, { redirectTo: window.location.origin + '/redefinir-senha' })
    if (error) { setErro('Não foi possível enviar o e-mail agora. Tente novamente em instantes.'); return }
    setInfo(`Enviamos um link para ${emailNovo}. Depois de redefinir a senha, você volta aqui para assumir a página.`)
  }

  async function entrarComOutroEmail() { await supabase.auth.signOut(); setEmailSessao(''); setErro(''); setInfo('') }

  const Cartao = ({ children }: { children: React.ReactNode }) => (
    <div style={{ minHeight: '100vh', background: '#08060A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99))', border: '1.5px solid #2A1A2F', borderRadius: '20px', padding: '32px 28px', textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '18px', fontWeight: 800, color: '#fff' }}>C</div>
        {children}
      </div>
    </div>
  )
  const Titulo = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: '19px', fontWeight: 800, color: '#F8F4F7', marginBottom: '10px' }}>{children}</p>
  const Texto = ({ children }: { children: React.ReactNode }) => <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '18px' }}>{children}</p>

  if (carregando) return <Cartao><p style={{ fontSize: '14px', color: '#B8AAB8' }}>Verificando convite...</p></Cartao>

  if (!valido) return <Cartao><Titulo>Convite indisponível</Titulo><Texto>{motivo}</Texto></Cartao>

  if (concluidoSemLogin) return (
    <Cartao>
      <Titulo>Tudo pronto!</Titulo>
      <Texto>Você agora é responsável por esta página. Entre com seu e-mail e senha para acessar o painel.</Texto>
      <Link href="/login" style={{ display: 'inline-block', background: G, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '14px', padding: '13px 26px', borderRadius: '12px' }}>Ir para o login</Link>
    </Cartao>
  )

  // Logado em OUTRA conta: nao transfere, nao usa essa sessao. Mostra o e-mail do convite.
  if (sessaoDeOutraConta) return (
    <Cartao>
      <Titulo>Este convite é para outro e-mail</Titulo>
      <Texto>Este convite foi enviado para outro e-mail. Entre com o endereço correto para continuar.<br /><span style={{ fontSize: '12px' }}>Convite para <strong style={{ color: '#F8F4F7' }}>{emailNovo}</strong>. Você está logado como {emailSessao}.</span></Texto>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button type="button" onClick={entrarComOutroEmail} style={botaoPrincipal(false)}>Entrar com outro e-mail</button>
        <button type="button" onClick={() => { window.location.href = '/painel' }} style={{ background: 'rgba(24,16,27,.92)', border: '1px solid #2A1A2F', color: '#B8AAB8', fontWeight: 600, fontSize: '14px', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
      </div>
    </Cartao>
  )

  // Ja logado com o e-mail certo: um clique.
  if (sessaoCorreta) return (
    <Cartao>
      <Titulo>Você recebeu acesso</Titulo>
      <Texto>Você recebeu acesso à MiniPage <strong style={{ color: '#EC4899' }}>{nomeNegocio}</strong>. Você está logado como <strong style={{ color: '#F8F4F7' }}>{emailSessao}</strong>.</Texto>
      {erro && <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '14px' }}>{erro}</p>}
      <button type="button" onClick={assumirLogado} disabled={enviando} style={botaoPrincipal(enviando)}>{enviando ? 'Assumindo...' : 'Assumir MiniPage'}</button>
    </Cartao>
  )

  return (
    <Cartao>
      <Titulo>Você recebeu acesso</Titulo>
      <Texto>Você recebeu acesso à MiniPage <strong style={{ color: '#EC4899' }}>{nomeNegocio}</strong>. {modo === 'entrar' ? 'Entre na sua conta para assumir o acesso.' : 'Crie sua conta para assumir o acesso.'}</Texto>

      {modo === 'criar' && (
        <div style={{ textAlign: 'left', marginBottom: '12px' }}>
          <label style={rotulo}>Seu nome</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Como devemos te chamar" autoComplete="name" style={campo} />
        </div>
      )}
      <div style={{ textAlign: 'left', marginBottom: '12px' }}>
        <label style={rotulo}>E-mail do convite</label>
        <input type="email" value={emailNovo} readOnly aria-readonly="true" style={{ ...campo, opacity: .75, cursor: 'not-allowed' }} />
      </div>
      <div style={{ textAlign: 'left', marginBottom: modo === 'criar' ? '12px' : '8px' }}>
        <label style={rotulo}>{modo === 'criar' ? 'Crie uma senha' : 'Senha'}</label>
        <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder={modo === 'criar' ? 'Mínimo 6 caracteres' : 'Sua senha'} autoComplete={modo === 'criar' ? 'new-password' : 'current-password'} onKeyDown={e => { if (e.key === 'Enter') (modo === 'criar' ? criarEAssumir() : entrarEAssumir()) }} style={campo} />
      </div>

      {modo === 'criar' && (
        <div style={{ textAlign: 'left', marginBottom: '12px' }}>
          <label style={rotulo}>Confirmar senha</label>
          <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="Repita a senha" autoComplete="new-password" onKeyDown={e => { if (e.key === 'Enter') criarEAssumir() }} style={campo} />
        </div>
      )}

      {modo === 'criar' && (
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', textAlign: 'left', fontSize: '12px', color: '#B8AAB8', lineHeight: 1.5, marginBottom: '16px', cursor: 'pointer' }}>
          <input type="checkbox" checked={termos} onChange={e => setTermos(e.target.checked)} style={{ marginTop: '2px' }} />
          <span>Li e aceito os <Link href="/termos-de-uso" target="_blank" style={{ color: '#EC4899' }}>termos de uso</Link> e a <Link href="/politica-de-privacidade" target="_blank" style={{ color: '#EC4899' }}>política de privacidade</Link>.</span>
        </label>
      )}

      {modo === 'entrar' && (
        <div style={{ textAlign: 'right', marginBottom: '14px' }}>
          <button type="button" onClick={esqueciSenha} style={botaoLink}>Esqueci minha senha</button>
        </div>
      )}

      {info && <p style={{ fontSize: '13px', color: '#22C55E', marginBottom: '14px', lineHeight: 1.5 }}>{info}</p>}
      {erro && <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '14px' }}>{erro}</p>}

      {modo === 'entrar' ? (
        <button type="button" onClick={entrarEAssumir} disabled={enviando} style={botaoPrincipal(enviando)}>{enviando ? 'Entrando...' : 'Entrar e assumir MiniPage'}</button>
      ) : (
        <button type="button" onClick={criarEAssumir} disabled={enviando} style={botaoPrincipal(enviando)}>{enviando ? 'Criando...' : 'Criar conta e assumir MiniPage'}</button>
      )}

      {modo === 'entrar' && contaExistente !== true && (
        <p style={{ fontSize: '13px', color: '#B8AAB8', marginTop: '16px' }}>Ainda não tem conta? <button type="button" onClick={() => { setModo('criar'); setErro(''); setInfo('') }} style={botaoLink}>Criar conta</button></p>
      )}
      {modo === 'criar' && (
        <p style={{ fontSize: '13px', color: '#B8AAB8', marginTop: '16px' }}>Já tem conta? <button type="button" onClick={() => { setModo('entrar'); setErro(''); setInfo('') }} style={botaoLink}>Entrar</button></p>
      )}
    </Cartao>
  )
}
