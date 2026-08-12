'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

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

  useEffect(() => {
    async function validar() {
      const res = await fetch(`/api/convite/validar?token=${encodeURIComponent(token)}`)
      const data = await res.json()
      setValido(!!data.valido)
      if (data.valido) {
        setNomeNegocio(data.nome_negocio)
        setEmailNovo(data.email_novo)
      } else {
        setMotivo(data.motivo || 'Não foi possível validar este convite.')
      }
      setCarregando(false)
    }
    if (token) validar()
  }, [token])

  async function aceitarComSenha() {
    setErro('')
    if (!senha || senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }
    setEnviando(true)
    const res = await fetch('/api/convite/aceitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, senha }),
    })
    const data = await res.json()
    setEnviando(false)
    if (!res.ok) {
      if (data.error === 'já_tem_conta') { setPrecisaLogin(true); return }
      setErro(data.error || 'Não foi possível concluir agora.')
      return
    }
    setSucesso(true)
  }

  async function aceitarLogado() {
    setErro('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setErro('Faça login primeiro pelo link abaixo.'); return }
    setEnviando(true)
    const res = await fetch('/api/convite/aceitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    setEnviando(false)
    if (!res.ok) { setErro(data.error || 'Não foi possível concluir agora.'); return }
    setSucesso(true)
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
            <p style={{ fontSize: '14px', color: '#B8AAB8', lineHeight: 1.6, marginBottom: '18px' }}>Já existe uma conta ClienteMarcado com o e-mail <strong style={{ color: '#F8F4F7' }}>{emailNovo}</strong>. Faça login normalmente e depois volte nesta página para confirmar a transferência.</p>
            {erro && <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '14px' }}>{erro}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/login" target="_blank" style={{ background: 'rgba(24,16,27,.92)', border: '1px solid rgba(229,72,184,.28)', color: '#F8F4F7', textDecoration: 'none', fontWeight: 600, fontSize: '14px', padding: '12px', borderRadius: '12px' }}>Fazer login (nova aba)</Link>
              <button type="button" onClick={aceitarLogado} disabled={enviando} style={{ background: G, color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', padding: '13px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', opacity: enviando ? .7 : 1 }}>
                {enviando ? 'Confirmando...' : 'Já fiz login, confirmar transferência'}
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
