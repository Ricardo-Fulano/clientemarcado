'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function Perfil() {
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [descricao, setDescricao] = useState('')
  const [slug, setSlug] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [endereco, setEndereco] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erroUpload, setErroUpload] = useState('')
  const [perfilExiste, setPerfilExiste] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [userId, setUserId] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { carregarPerfil() }, [])

  async function carregarPerfil() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const { data } = await supabase.from('perfis').select('*').eq('user_id', user.id).single()
    if (data) {
      setNomeNegocio(data.nome_negocio)
      setDescricao(data.descricao || '')
      setSlug(data.slug)
      setWhatsapp(data.whatsapp || '')
      setEndereco(data.endereco || '')
      setBannerUrl(data.banner_url || '')
      setPerfilExiste(true)
    }
  }

  function gerarSlug(nome: string) {
    return nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-')
  }

  async function handleUpload(file: File) {
    setErroUpload('')

    const tiposAceitos = ['image/jpeg', 'image/png', 'image/webp']
    if (!tiposAceitos.includes(file.type)) {
      setErroUpload('Envie uma imagem em JPG, PNG ou WEBP com até 5 MB.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErroUpload('Envie uma imagem em JPG, PNG ou WEBP com até 5 MB.')
      return
    }

    setUploadando(true)

    const ext = file.name.split('.').pop()
    const path = `${userId}/banner-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('business-banners')
      .upload(path, file, { upsert: true })

    if (error) {
      setErroUpload('Erro ao enviar imagem. Tente novamente.')
      setUploadando(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('business-banners')
      .getPublicUrl(path)

    setBannerUrl(urlData.publicUrl)
    setUploadando(false)
  }

  async function handleRemoverBanner() {
    setBannerUrl('')
  }

  async function handleSalvar() {
    if (!nomeNegocio || !slug) { setMensagem('Nome e link são obrigatórios.'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (perfilExiste) {
      const { error } = await supabase.from('perfis').update({
        nome_negocio: nomeNegocio, descricao, slug, whatsapp, endereco, banner_url: bannerUrl
      }).eq('user_id', user?.id)
      setMensagem(error ? 'Erro ao salvar.' : 'Perfil atualizado!')
    } else {
      const { error } = await supabase.from('perfis').insert({
        user_id: user?.id, nome_negocio: nomeNegocio, descricao, slug, whatsapp, endereco, banner_url: bannerUrl
      })
      if (error) { setMensagem(error.message.includes('slug') ? 'Esse link já está em uso.' : 'Erro ao salvar.') }
      else { setMensagem('Perfil criado!'); setPerfilExiste(true) }
    }
    setLoading(false)
  }

  function copiarLink() {
    navigator.clipboard.writeText('https://clientemarcado.vercel.app/' + slug)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function compartilharWhatsapp() {
    const link = 'https://clientemarcado.vercel.app/' + slug
    window.open('https://wa.me/?text=' + encodeURIComponent('Agende seu horário comigo pelo link: ' + link), '_blank')
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

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>Perfil do negócio</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>Configure como seu negócio aparece para os clientes</p>

        {/* Link de agendamento */}
        {perfilExiste && (
          <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: '8px' }}>Seu link de agendamento</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', wordBreak: 'break-all' as const }}>
              https://clientemarcado.vercel.app/{slug}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              <button onClick={copiarLink} style={{ flex: 1, minWidth: '100px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                {copiado ? '✓ Copiado!' : 'Copiar link'}
              </button>
              <button onClick={compartilharWhatsapp} style={{ flex: 1, minWidth: '100px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                WhatsApp
              </button>
              <a href={'/' + slug} target="_blank" style={{ flex: 1, minWidth: '100px', textAlign: 'center' as const, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                Ver página
              </a>
            </div>
          </div>
        )}

        {/* Formulário */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column' as const, gap: '20px' }}>

          <div>
            <label style={labelStyle}>Nome do negócio *</label>
            <input type="text" placeholder="Ex: Barbearia do João" value={nomeNegocio}
              onChange={(e) => { setNomeNegocio(e.target.value); if (!perfilExiste) setSlug(gerarSlug(e.target.value)) }}
              style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Link personalizado *</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px', whiteSpace: 'nowrap' as const }}>clientemarcado.vercel.app/</span>
              <input type="text" placeholder="barbearia-do-joao" value={slug}
                onChange={(e) => setSlug(gerarSlug(e.target.value))}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13px', flex: 1 }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Endereço (opcional)</label>
            <input type="text" placeholder="Ex: Rua das Flores, 123 - São Paulo" value={endereco}
              onChange={(e) => setEndereco(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>WhatsApp (opcional)</label>
            <input type="text" placeholder="Ex: 11999999999" value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Descrição (opcional)</label>
            <textarea placeholder="Ex: Especialistas em cortes modernos e atendimento premium." value={descricao}
              onChange={(e) => setDescricao(e.target.value)} rows={3}
              style={{ ...inputStyle, resize: 'none' as const }} />
          </div>

          {/* UPLOAD DE BANNER */}
          <div>
            <label style={labelStyle}>Imagem de capa do negócio (opcional)</label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
              Envie uma imagem horizontal da fachada, ambiente ou atendimento. Ela aparecerá no topo da sua página de agendamento.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]) }}
            />

            {!bannerUrl ? (
              <div
                onClick={() => inputRef.current?.click()}
                style={{ border: '2px dashed var(--border)', borderRadius: '14px', padding: '40px 24px', textAlign: 'center' as const, cursor: 'pointer', background: 'var(--surface)', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🖼️</div>
                <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {uploadando ? 'Enviando...' : 'Clique para enviar uma imagem'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Proporção recomendada: 16:9 · 1920×1080px<br />
                  Formatos: JPG, PNG ou WEBP · Máx. 5 MB
                </p>
              </div>
            ) : (
              <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
                <img src={bannerUrl} alt="Preview do banner" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => inputRef.current?.click()} style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    Trocar
                  </button>
                  <button onClick={handleRemoverBanner} style={{ background: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    Remover
                  </button>
                </div>
              </div>
            )}

            {erroUpload && (
              <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '8px' }}>{erroUpload}</p>
            )}
          </div>

          {mensagem && (
            <p style={{ fontSize: '13px', color: mensagem.includes('Erro') ? 'var(--danger)' : 'var(--success)', textAlign: 'center' as const }}>
              {mensagem}
            </p>
          )}

          <button onClick={handleSalvar} disabled={loading || uploadando}
            style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: loading || uploadando ? 0.6 : 1 }}>
            {loading ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>
      </div>
    </main>
  )
}