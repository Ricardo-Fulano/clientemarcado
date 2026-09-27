'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown, UploadCloud, Trash2, Pencil } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
import VerMiniPageButton from '@/app/components/VerMiniPageButton'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'
const PROPORCOES = ['1:1', '4:5', '3:4', '16:9'] as const
const PROPORCAO_LABEL: Record<string, string> = { '1:1': '1:1', '4:5': '4:5', '3:4': '3:4', '16:9': '16:9' }

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#08060A}
input,select,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(139,92,246,.18),transparent 32%),linear-gradient(135deg,#08060A 0%,#120A14 45%,#08060A 100%);min-height:100vh}
.bdy{max-width:820px;margin:0 auto;padding:28px 32px 80px;width:100%}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,rgba(24,16,27,.97),rgba(18,10,20,.99));border:1.5px solid #2A1A2F;border-radius:18px}
.lbl{display:block;font-size:11px;font-weight:700;color:#B8AAB8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.inp{width:100%;background:rgba(24,16,27,.92);border:1.5px solid #2A1A2F;border-radius:10px;padding:10px 12px;color:#F8F4F7;font-size:13px;font-family:inherit}
.inp:focus{outline:none;border-color:rgba(236,72,153,.5)}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}}
`

export default function GerenciarAlbum() {
  const params = useParams()
  const albumId = params?.albumId as string
  const [userId, setUserId] = useState('')
  const [album, setAlbum] = useState<any>(null)
  const [fotos, setFotos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [msg, setMsg] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState('')
  const [salvandoProporcao, setSalvandoProporcao] = useState(false)
  const imgRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const [{ data: alb }, { data: fts }] = await Promise.all([
      supabase.from('pagina_albuns').select('*').eq('id', albumId).eq('user_id', user.id).maybeSingle(),
      supabase.from('pagina_album_fotos').select('*').eq('album_id', albumId).eq('user_id', user.id).order('ordem'),
    ])
    if (!alb) { window.location.href = '/painel/perfil/albuns'; return }
    setAlbum(alb)
    setFotos(fts || [])
    setCarregando(false)
  }

  async function validarSessao() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return false }
    if (user.id !== userId) { setMsg('A sessão mudou. Recarregue a página antes de salvar.'); return false }
    return true
  }

  async function alterarProporcao(nova: typeof PROPORCOES[number]) {
    if (!(await validarSessao())) return
    setAlbum((prev: any) => ({ ...prev, proporcao: nova }))
    setSalvandoProporcao(true)
    const { error } = await supabase.from('pagina_albuns').update({ proporcao: nova }).eq('id', albumId).eq('user_id', userId)
    if (error) setMsg('Erro ao salvar proporção.')
    setSalvandoProporcao(false)
  }

  function novaFoto() {
    const novoId = 'novo-' + Date.now()
    setFotos(prev => [...prev, { id: novoId, album_id: albumId, user_id: userId, imagem_url: '', titulo: '', descricao: '', ativo: true, ordem: prev.length, _novo: true }])
    setEditandoId(novoId)
  }
  function editarFoto(id: string, campo: string, valor: any) {
    setFotos(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f))
  }

  async function salvarFoto(f: any) {
    if (!(await validarSessao())) return
    if (!f.imagem_url) { setMsg('Envie uma imagem primeiro.'); return }
    const payload = { album_id: albumId, user_id: userId, imagem_url: f.imagem_url, titulo: f.titulo?.trim() || null, descricao: f.descricao?.trim() || null, ativo: !!f.ativo, ordem: f.ordem || 0 }
    if (f._novo) {
      const { data, error } = await supabase.from('pagina_album_fotos').insert(payload).select().single()
      if (error) { setMsg('Erro ao salvar foto: ' + error.message) }
      else { setFotos(prev => prev.map(x => x.id === f.id ? data : x)); setMsg('Foto salva!'); setEditandoId(null) }
    } else {
      const { error } = await supabase.from('pagina_album_fotos').update(payload).eq('id', f.id).eq('user_id', userId)
      if (error) { setMsg('Erro ao salvar foto: ' + error.message) }
      else { setMsg('Foto salva!'); setEditandoId(null) }
    }
    setTimeout(() => setMsg(''), 3000)
  }

  function voltarFoto(id: string) {
    if (id.startsWith('novo-')) setFotos(prev => prev.filter(f => f.id !== id))
    setEditandoId(null)
  }

  async function excluirFoto(id: string) {
    if (!(await validarSessao())) return
    if (!id.startsWith('novo-')) {
      if (!window.confirm('Excluir esta foto?')) return
      const { error } = await supabase.from('pagina_album_fotos').delete().eq('id', id).eq('user_id', userId)
      if (error) { setMsg('Erro ao excluir: ' + error.message); return }
    }
    setFotos(prev => prev.filter(f => f.id !== id))
    if (editandoId === id) setEditandoId(null)
  }

  async function toggleAtivo(f: any) {
    if (!(await validarSessao())) return
    const { error } = await supabase.from('pagina_album_fotos').update({ ativo: !f.ativo }).eq('id', f.id).eq('user_id', userId)
    if (error) { setMsg('Erro: ' + error.message); return }
    setFotos(prev => prev.map(x => x.id === f.id ? { ...x, ativo: !x.ativo } : x))
  }

  async function mover(id: string, direcao: 'up' | 'down') {
    const idx = fotos.findIndex(f => f.id === id)
    if (idx < 0) return
    const novoIdx = direcao === 'up' ? idx - 1 : idx + 1
    if (novoIdx < 0 || novoIdx >= fotos.length) return
    const copia = [...fotos]
    ;[copia[idx], copia[novoIdx]] = [copia[novoIdx], copia[idx]]
    const comOrdem = copia.map((item, i) => ({ ...item, ordem: i }))
    setFotos(comOrdem)
    for (const item of comOrdem) {
      if (!item.id.startsWith('novo-')) {
        await supabase.from('pagina_album_fotos').update({ ordem: item.ordem }).eq('id', item.id).eq('user_id', userId)
      }
    }
  }

  function abrirUpload(id: string) { setUploadingId(id); imgRef.current?.click() }

  // Mesmo padrao ja aprovado em Destaques: se a foto ainda for um rascunho novo (_novo),
  // salva um registro tecnico no banco pra obter um ID real (necessario pra manter tudo
  // organizado), MAS preserva editandoId sincronizado com o novo ID e nunca mostra mensagem
  // de conclusao - so "Imagem enviada", igual ja resolvido no bug de Destaques/Catalogo.
  async function salvarRascunhoSeNecessario(idTemporario: string, imagemUrl: string): Promise<string | null> {
    const fotoAtual = fotos.find(x => x.id === idTemporario)
    if (!fotoAtual || !fotoAtual._novo) return null
    const payload = { album_id: albumId, user_id: userId, imagem_url: imagemUrl, titulo: null, descricao: null, ativo: fotoAtual.ativo, ordem: fotoAtual.ordem || 0 }
    const { data, error } = await supabase.from('pagina_album_fotos').insert(payload).select().single()
    if (error) { setMsg('Erro ao preparar a foto: ' + error.message); return null }
    setFotos(prev => prev.map(x => x.id === idTemporario ? { ...x, ...data, ativo: x.ativo, _novo: false } : x))
    // Sincroniza editandoId pro novo ID real, se ainda apontava pro ID temporario - sem
    // isso o card pareceria fechar sozinho (mesmo bug ja corrigido em Destaques/Catalogo).
    setEditandoId(atual => atual === idTemporario ? (data.id as string) : atual)
    setMsg('Imagem enviada! Continue preenchendo e clique em "Salvar" quando terminar.')
    setTimeout(() => setMsg(''), 4000)
    return data.id as string
  }

  async function uploadImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; const id = uploadingId
    if (!file || !id) return
    if (!(await validarSessao())) return
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) { setMsg('Envie uma imagem JPG, PNG ou WEBP.'); return }
    if (file.size > 5 * 1024 * 1024) { setMsg('A imagem deve ter no máximo 5MB.'); return }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `album-fotos/${userId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('fotos').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
    if (uploadError) { setMsg('Erro no upload: ' + uploadError.message); setUploadingId(''); if (imgRef.current) imgRef.current.value = ''; return }
    const { data } = supabase.storage.from('fotos').getPublicUrl(path)
    editarFoto(id, 'imagem_url', data.publicUrl)
    if (id.startsWith('novo-')) {
      await salvarRascunhoSeNecessario(id, data.publicUrl)
    } else {
      setMsg('Imagem enviada! Clique em "Salvar" pra confirmar.')
      setTimeout(() => setMsg(''), 3500)
    }
    setUploadingId('')
    if (imgRef.current) imgRef.current.value = ''
  }

  if (carregando) return (<div style={{ minHeight: '100vh', background: '#08060A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}><p style={{ color: '#B8AAB8', fontSize: '14px' }}>Carregando...</p></div>)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar tituloMobile="Álbuns / Fotos" />
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg && (
            <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: msg.includes('rro') ? 'rgba(239,68,68,.16)' : 'rgba(34,197,94,.16)', border: `1px solid ${msg.includes('rro') ? 'rgba(239,68,68,.36)' : 'rgba(34,197,94,.36)'}`, borderRadius: '10px', padding: '10px 20px', zIndex: 99, color: msg.includes('rro') ? '#EF4444' : '#22C55E', fontSize: '13px', fontWeight: 700, backdropFilter: 'blur(20px)', maxWidth: '90vw', textAlign: 'center' }}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil/albuns" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#B8AAB8', textDecoration: 'none', marginBottom: '18px' }}><ArrowLeft size={15} /> Voltar para Álbuns</Link>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em' }}>{album?.titulo || 'Álbum'}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <VerMiniPageButton />
              <button type="button" onClick={novaFoto} style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Adicionar imagens</button>
            </div>
          </div>

          <div className="crd" style={{ padding: '16px 18px', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#F8F4F7', marginBottom: '10px' }}>Proporção das miniaturas</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PROPORCOES.map(p => (
                <button key={p} type="button" onClick={() => alterarProporcao(p)} disabled={salvandoProporcao} style={{ background: album?.proporcao === p ? G : 'rgba(24,16,27,.9)', color: album?.proporcao === p ? '#fff' : '#B8AAB8', border: album?.proporcao === p ? '1px solid rgba(255,255,255,.12)' : '1px solid #2A1A2F', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: salvandoProporcao ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{PROPORCAO_LABEL[p]}</button>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#B8AAB8', marginTop: '8px' }}>Todas as fotos deste álbum aparecem recortadas nesta proporção na faixa da página. Na visualização ampliada, a foto aparece inteira, sem cortes.</p>
          </div>

          {fotos.length === 0 && <p style={{ fontSize: '13px', color: '#B8AAB8', padding: '12px 0' }}>Nenhuma foto adicionada ainda.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {fotos.map((f, i) => {
              const emEdicao = editandoId === f.id
              return (
                <div key={f.id} className="crd" style={{ padding: emEdicao ? '16px' : '10px 14px', display: 'flex', gap: '12px', alignItems: emEdicao ? 'flex-start' : 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                    <button type="button" onClick={() => mover(f.id, 'up')} disabled={i === 0} style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: i === 0 ? '#4A3F4E' : '#B8AAB8', cursor: i === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUp size={12} /></button>
                    <button type="button" onClick={() => mover(f.id, 'down')} disabled={i === fotos.length - 1} style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: i === fotos.length - 1 ? '#4A3F4E' : '#B8AAB8', cursor: i === fotos.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowDown size={12} /></button>
                  </div>

                  {!emEdicao ? (
                    <>
                      {f.imagem_url ? (
                        <img src={f.imagem_url} alt={f.titulo || ''} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(24,16,27,.72)', border: '1px dashed #2A1A2F', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#F8F4F7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.titulo || 'Sem título'}</p>
                      </div>
                      <button type="button" onClick={() => toggleAtivo(f)} style={{ background: f.ativo ? 'rgba(34,197,94,.14)' : '#2A1A2F', border: '1px solid ' + (f.ativo ? 'rgba(34,197,94,.25)' : '#2A1A2F'), borderRadius: 10, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: f.ativo ? '#22C55E' : '#B8AAB8', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>{f.ativo ? 'Ativo' : 'Oculto'}</button>
                      <button type="button" onClick={() => setEditandoId(f.id)} title="Editar" aria-label="Editar" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#B8AAB8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Pencil size={14} /></button>
                      <button type="button" onClick={() => excluirFoto(f.id)} title="Excluir" aria-label="Excluir" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Trash2 size={14} /></button>
                    </>
                  ) : (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ marginBottom: '10px' }}>
                        <label className="lbl">Imagem</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          {f.imagem_url ? (
                            <img src={f.imagem_url} alt="" style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #2A1A2F', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '80px', height: '80px', borderRadius: '10px', background: 'rgba(24,16,27,.72)', border: '1px dashed #2A1A2F', flexShrink: 0 }} />
                          )}
                          <button type="button" onClick={() => abrirUpload(f.id)} disabled={uploadingId === f.id} style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#B8AAB8', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><UploadCloud size={13} /> {uploadingId === f.id ? 'Enviando...' : (f.imagem_url ? 'Trocar imagem' : 'Enviar imagem')}</button>
                        </div>
                      </div>
                      <div style={{ marginBottom: '10px' }}><label className="lbl">Título (opcional)</label><input className="inp" autoFocus value={f.titulo || ''} onChange={e => editarFoto(f.id, 'titulo', e.target.value)} placeholder="Aparece só quando a foto é ampliada" /></div>
                      <div style={{ marginBottom: '12px' }}><label className="lbl">Legenda (opcional)</label><textarea className="inp" value={f.descricao || ''} onChange={e => editarFoto(f.id, 'descricao', e.target.value)} placeholder="Aparece só quando a foto é ampliada" rows={2} /></div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => editarFoto(f.id, 'ativo', !f.ativo)} style={{ background: f.ativo ? 'rgba(34,197,94,.14)' : '#2A1A2F', border: '1px solid ' + (f.ativo ? 'rgba(34,197,94,.25)' : '#2A1A2F'), borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: f.ativo ? '#22C55E' : '#B8AAB8', cursor: 'pointer', fontFamily: 'inherit' }}>{f.ativo ? 'Ativo' : 'Oculto'}</button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => voltarFoto(f.id)} style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#B8AAB8', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Voltar</button>
                          <button type="button" onClick={() => excluirFoto(f.id)} style={{ background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)', color: '#EF4444', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Excluir</button>
                          <button type="button" onClick={() => salvarFoto(f)} style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Salvar</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <input ref={imgRef} type="file" accept="image/*" onChange={uploadImagem} style={{ display: 'none' }} />

        </div></div>
      </div>
    </div>
  )
}
