'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
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
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}.fg2{grid-template-columns:1fr!important}}
`

export default function ListaAlbuns() {
  const [userId, setUserId] = useState('')
  const [albuns, setAlbuns] = useState<any[]>([])
  const [contagemFotos, setContagemFotos] = useState<Record<string, number>>({})
  const [carregando, setCarregando] = useState(true)
  const [msg, setMsg] = useState('')
  const [editando, setEditando] = useState<any>(null)
  const [tituloForm, setTituloForm] = useState('')
  const [subtituloForm, setSubtituloForm] = useState('')
  const [proporcaoForm, setProporcaoForm] = useState<typeof PROPORCOES[number]>('1:1')
  const [salvando, setSalvando] = useState(false)
  const [enviandoCapaId, setEnviandoCapaId] = useState('')
  const capaFileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const { data: albs } = await supabase.from('pagina_albuns').select('*').eq('user_id', user.id).order('ordem')
    const listaAlbuns = albs || []
    setAlbuns(listaAlbuns)

    if (listaAlbuns.length > 0) {
      const { data: todasFotos } = await supabase.from('pagina_album_fotos').select('album_id').eq('user_id', user.id)
      const contagem: Record<string, number> = {}
      ;(todasFotos || []).forEach((f: any) => { if (f.album_id) contagem[f.album_id] = (contagem[f.album_id] || 0) + 1 })
      setContagemFotos(contagem)
    }
    setCarregando(false)
  }

  async function validarSessao() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return false }
    if (user.id !== userId) { setMsg('A sessão mudou. Recarregue a página antes de salvar.'); return false }
    return true
  }

  function abrirNovo() {
    setEditando({ novo: true })
    setTituloForm('')
    setSubtituloForm('')
    setProporcaoForm('1:1')
  }
  function abrirEditar(alb: any) {
    setEditando(alb)
    setTituloForm(alb.titulo || '')
    setSubtituloForm(alb.subtitulo || '')
    setProporcaoForm(alb.proporcao || '1:1')
  }
  function fecharForm() {
    setEditando(null)
    setTituloForm('')
    setSubtituloForm('')
    setProporcaoForm('1:1')
  }

  async function salvarAlbum() {
    if (!(await validarSessao())) return
    if (!tituloForm.trim()) { setMsg('Dê um título para o álbum.'); return }
    setSalvando(true)
    if (editando.novo) {
      const payload = { user_id: userId, titulo: tituloForm.trim(), subtitulo: subtituloForm.trim() || null, proporcao: proporcaoForm, ativo: true, ordem: albuns.length }
      const { data, error } = await supabase.from('pagina_albuns').insert(payload).select().single()
      if (error) { setMsg('Erro ao criar álbum: ' + error.message) }
      else { setAlbuns(prev => [...prev, data]); setMsg('Álbum criado!'); fecharForm() }
    } else {
      const payload = { titulo: tituloForm.trim(), subtitulo: subtituloForm.trim() || null, proporcao: proporcaoForm }
      const { error } = await supabase.from('pagina_albuns').update(payload).eq('id', editando.id).eq('user_id', userId)
      if (error) { setMsg('Erro ao salvar: ' + error.message) }
      else { setAlbuns(prev => prev.map(a => a.id === editando.id ? { ...a, ...payload } : a)); setMsg('Álbum salvo!'); fecharForm() }
    }
    setSalvando(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function toggleAtivo(alb: any) {
    if (!(await validarSessao())) return
    const { error } = await supabase.from('pagina_albuns').update({ ativo: !alb.ativo }).eq('id', alb.id).eq('user_id', userId)
    if (error) { setMsg('Erro: ' + error.message); return }
    setAlbuns(prev => prev.map(a => a.id === alb.id ? { ...a, ativo: !a.ativo } : a))
  }

  async function excluirAlbum(alb: any) {
    if (!(await validarSessao())) return
    // Fotos do album sao excluidas em cascade pelo banco (on delete cascade) - nao precisa
    // bloquear a exclusao pedindo pra esvaziar antes, diferente de Destaques/Catalogo.
    if (!window.confirm(`Excluir o álbum "${alb.titulo}"? Todas as ${contagemFotos[alb.id] || 0} fotos dele também serão excluídas.`)) return
    const { error } = await supabase.from('pagina_albuns').delete().eq('id', alb.id).eq('user_id', userId)
    if (error) { setMsg('Erro ao excluir: ' + error.message); return }
    setAlbuns(prev => prev.filter(a => a.id !== alb.id))
  }

  async function mover(id: string, direcao: 'up' | 'down') {
    const idx = albuns.findIndex(a => a.id === id)
    if (idx < 0) return
    const novoIdx = direcao === 'up' ? idx - 1 : idx + 1
    if (novoIdx < 0 || novoIdx >= albuns.length) return
    const copia = [...albuns]
    ;[copia[idx], copia[novoIdx]] = [copia[novoIdx], copia[idx]]
    const comOrdem = copia.map((item, i) => ({ ...item, ordem: i }))
    setAlbuns(comOrdem)
    for (const item of comOrdem) {
      await supabase.from('pagina_albuns').update({ ordem: item.ordem }).eq('id', item.id).eq('user_id', userId)
    }
  }

  function abrirUploadCapa(id: string) { setEnviandoCapaId(id); capaFileRefs.current[id]?.click() }
  async function uploadCapa(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!(await validarSessao())) return
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) { setMsg('Envie uma imagem JPG, PNG ou WEBP.'); setEnviandoCapaId(''); return }
    if (file.size > 5 * 1024 * 1024) { setMsg('A imagem deve ter no máximo 5MB.'); setEnviandoCapaId(''); return }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `albuns/${userId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('fotos').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
    if (uploadError) { setMsg('Erro no upload: ' + uploadError.message); setEnviandoCapaId(''); return }
    const { data: pub } = supabase.storage.from('fotos').getPublicUrl(path)
    const { error: updateError } = await supabase.from('pagina_albuns').update({ capa_url: pub.publicUrl }).eq('id', id).eq('user_id', userId)
    if (updateError) { setMsg('Capa enviada, mas erro ao salvar: ' + updateError.message); setEnviandoCapaId(''); return }
    setAlbuns(prev => prev.map(a => a.id === id ? { ...a, capa_url: pub.publicUrl } : a))
    setMsg('Capa atualizada!')
    setTimeout(() => setMsg(''), 3000)
    setEnviandoCapaId('')
    if (capaFileRefs.current[id]) capaFileRefs.current[id]!.value = ''
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

          <Link href="/painel/perfil" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#B8AAB8', textDecoration: 'none', marginBottom: '18px' }}><ArrowLeft size={15} /> Voltar para Configurações</Link>

          <p style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em', marginBottom: '8px' }}>Álbuns / Fotos</p>
          <p style={{ fontSize: '13px', color: '#B8AAB8', marginBottom: '24px' }}>Crie galerias de fotos que aparecem como faixas horizontais deslizáveis na sua página.</p>

          {editando && (
            <div className="crd" style={{ padding: '18px', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8F4F7', marginBottom: '14px' }}>{editando.novo ? 'Novo álbum' : 'Editar álbum'}</p>
              <div className="fg2" style={{ marginBottom: '14px' }}>
                <div><label className="lbl">Título *</label><input className="inp" autoFocus value={tituloForm} onChange={e => setTituloForm(e.target.value)} placeholder="Ex: Bastidores" /></div>
                <div><label className="lbl">Subtítulo (opcional)</label><input className="inp" value={subtituloForm} onChange={e => setSubtituloForm(e.target.value)} placeholder="Ex: Momentos especiais" /></div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label className="lbl">Proporção das miniaturas</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PROPORCOES.map(p => (
                    <button key={p} type="button" onClick={() => setProporcaoForm(p)} style={{ background: proporcaoForm === p ? G : 'rgba(24,16,27,.9)', color: proporcaoForm === p ? '#fff' : '#B8AAB8', border: proporcaoForm === p ? '1px solid rgba(255,255,255,.12)' : '1px solid #2A1A2F', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{PROPORCAO_LABEL[p]}</button>
                  ))}
                </div>
                <p style={{ fontSize: '10px', color: '#B8AAB8', marginTop: '6px' }}>Todas as fotos do álbum aparecem recortadas nessa mesma proporção na miniatura. Na visualização ampliada, a foto aparece inteira, sem cortes.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={fecharForm} style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#B8AAB8', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Voltar</button>
                <button type="button" onClick={salvarAlbum} disabled={salvando} style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: salvando ? .7 : 1 }}>{salvando ? 'Salvando...' : 'Salvar álbum'}</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7' }}>Seus álbuns</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <VerMiniPageButton />
              <button type="button" onClick={abrirNovo} style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Novo álbum</button>
            </div>
          </div>

          {albuns.length === 0 && <p style={{ fontSize: '13px', color: '#B8AAB8', padding: '12px 0' }}>Nenhum álbum cadastrado ainda.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {albuns.map((alb, i) => {
              const qtdFotos = contagemFotos[alb.id] || 0
              return (
                <div key={alb.id} className="crd" style={{ padding: '16px', display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, paddingTop: '2px' }}>
                    <button type="button" onClick={() => mover(alb.id, 'up')} disabled={i === 0} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: i === 0 ? '#4A3F4E' : '#B8AAB8', cursor: i === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUp size={14} /></button>
                    <button type="button" onClick={() => mover(alb.id, 'down')} disabled={i === albuns.length - 1} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: i === albuns.length - 1 ? '#4A3F4E' : '#B8AAB8', cursor: i === albuns.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowDown size={14} /></button>
                  </div>
                  {alb.capa_url ? (
                    <img src={alb.capa_url} alt={alb.titulo} style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #2A1A2F', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: 'rgba(24,16,27,.72)', border: '1px dashed #2A1A2F', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#F8F4F7', marginBottom: '2px' }}>{alb.titulo}</p>
                    {alb.subtitulo && <p style={{ fontSize: '12px', color: '#B8AAB8', marginBottom: '6px' }}>{alb.subtitulo}</p>}
                    <p style={{ fontSize: '12px', color: '#8B7D8B', marginBottom: '10px' }}>{qtdFotos} foto{qtdFotos !== 1 ? 's' : ''} · {alb.proporcao} · <span style={{ color: alb.ativo ? '#22C55E' : '#B8AAB8' }}>{alb.ativo ? 'Ativo' : 'Oculto'}</span></p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Link href={`/painel/perfil/albuns/${alb.id}`} style={{ background: G, color: '#fff', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', fontFamily: 'inherit' }}>Gerenciar fotos</Link>
                      <button type="button" onClick={() => abrirUploadCapa(alb.id)} disabled={enviandoCapaId === alb.id} style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#B8AAB8', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{enviandoCapaId === alb.id ? 'Enviando...' : (alb.capa_url ? 'Trocar capa' : 'Enviar capa')}</button>
                      <input ref={el => { capaFileRefs.current[alb.id] = el }} type="file" accept="image/*" onChange={e => uploadCapa(alb.id, e)} style={{ display: 'none' }} />
                      <button type="button" onClick={() => abrirEditar(alb)} style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#B8AAB8', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Editar</button>
                      <button type="button" onClick={() => toggleAtivo(alb)} style={{ background: alb.ativo ? 'rgba(34,197,94,.14)' : '#2A1A2F', border: '1px solid ' + (alb.ativo ? 'rgba(34,197,94,.25)' : '#2A1A2F'), borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: alb.ativo ? '#22C55E' : '#B8AAB8', cursor: 'pointer', fontFamily: 'inherit' }}>{alb.ativo ? 'Desativar' : 'Ativar'}</button>
                      <button type="button" onClick={() => excluirAlbum(alb)} style={{ background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)', color: '#EF4444', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Excluir</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

        </div></div>
      </div>
    </div>
  )
}
