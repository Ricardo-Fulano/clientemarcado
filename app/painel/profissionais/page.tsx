'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

interface Profissional {
  id: string
  nome: string
  especialidade: string
  foto_url?: string
}

export default function Profissionais() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [nome, setNome] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [uploadando, setUploadando] = useState(false)
  const [erroUpload, setErroUpload] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [userId, setUserId] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { carregarProfissionais() }, [])

  async function carregarProfissionais() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const { data } = await supabase.from('profissionais').select('*').eq('user_id', user.id)
    if (data) setProfissionais(data)
  }

  async function handleUploadFoto(file: File) {
    setErroUpload('')
    const tiposAceitos = ['image/jpeg', 'image/png', 'image/webp']
    if (!tiposAceitos.includes(file.type)) {
      setErroUpload('Envie uma imagem em JPG, PNG ou WEBP com até 3 MB.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setErroUpload('Imagem muito grande. Máximo 3 MB.')
      return
    }
    setUploadando(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/prof-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('professional-photos').upload(path, file, { upsert: true })
    if (error) { setErroUpload('Erro ao enviar foto. Tente novamente.'); setUploadando(false); return }
    const { data: urlData } = supabase.storage.from('professional-photos').getPublicUrl(path)
    setFotoUrl(urlData.publicUrl)
    setUploadando(false)
  }

  async function handleAdicionar() {
    if (!nome) { setMensagem('Preencha o nome do profissional.'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profissionais').insert({
      user_id: user?.id, nome, especialidade, foto_url: fotoUrl || null
    })
    if (error) { setMensagem('Erro ao salvar profissional.') }
    else { setNome(''); setEspecialidade(''); setFotoUrl(''); setMensagem('Profissional adicionado!'); carregarProfissionais() }
    setLoading(false)
  }

  async function handleExcluir(id: string) {
    await supabase.from('profissionais').delete().eq('id', id)
    carregarProfissionais()
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '500' as const,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '6px',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>ClienteMarcado</span>
        <Link href="/painel" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>← Voltar ao painel</Link>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>Minha equipe</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>Cadastre os profissionais do seu negócio</p>

        {/* Formulário */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Adicionar profissional</h3>

          <div>
            <label style={labelStyle}>Nome *</label>
            <input type="text" placeholder="Ex: Carlos Silva" value={nome}
              onChange={(e) => setNome(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Especialidade (opcional)</label>
            <input type="text" placeholder="Ex: Corte masculino, barba" value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)} style={inputStyle} />
          </div>

          {/* Upload de foto */}
          <div>
            <label style={labelStyle}>Foto do profissional (opcional)</label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
              Envie uma foto de rosto ou imagem profissional. Ela aparecerá na página de agendamento.
            </p>

            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files?.[0]) handleUploadFoto(e.target.files[0]) }} />

            {!fotoUrl ? (
              <div onClick={() => inputRef.current?.click()} style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: 'var(--surface)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '20px' }}>
                  👤
                </div>
                <p style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {uploadando ? 'Enviando...' : 'Clique para enviar uma foto'}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Proporção 1:1 · JPG, PNG ou WEBP · Máx. 3 MB
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <img src={fotoUrl} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-border)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Foto selecionada</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => inputRef.current?.click()} style={{ fontSize: '12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      Trocar foto
                    </button>
                    <button onClick={() => setFotoUrl('')} style={{ fontSize: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '6px 12px', color: '#EF4444', cursor: 'pointer' }}>
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            )}

            {erroUpload && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '6px' }}>{erroUpload}</p>}
          </div>

          {mensagem && (
            <p style={{ fontSize: '13px', color: mensagem.includes('Erro') ? 'var(--danger)' : 'var(--success)', textAlign: 'center' }}>
              {mensagem}
            </p>
          )}

          <button onClick={handleAdicionar} disabled={loading || uploadando}
            style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: loading || uploadando ? 0.6 : 1 }}>
            {loading ? 'Salvando...' : 'Adicionar profissional'}
          </button>
        </div>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {profissionais.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: '14px' }}>Nenhum profissional cadastrado ainda.</p>
          )}
          {profissionais.map((p) => (
            <div key={p.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {p.foto_url ? (
                  <img src={p.foto_url} alt={p.nome} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-border)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-soft)', border: '2px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: 'var(--accent)', flexShrink: 0 }}>
                    {p.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>{p.nome}</p>
                  {p.especialidade && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.especialidade}</p>}
                </div>
              </div>
              <button onClick={() => handleExcluir(p.id)} style={{ fontSize: '12px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px' }}>
                Excluir
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}