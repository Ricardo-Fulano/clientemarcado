'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown, UploadCloud, Trash2, Pencil } from 'lucide-react'
import CardVisualPreviewBox from '@/app/components/CardVisualPreviewBox'
import PainelSidebar from '@/app/components/PainelSidebar'
import VerMiniPageButton from '@/app/components/VerMiniPageButton'
import { detectarTipoPorUrl, TIPOS_SOCIAIS_TOPO, labelPlataforma } from '../../../../lib/plataformasLinks'

const G = 'linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6)'

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
.chk{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none}
.card-visual-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;display:block}
.card-visual-bg{position:absolute;inset:-8%;width:116%;height:116%;object-fit:cover;filter:blur(14px);transform:scale(1.05);opacity:.7;display:block}
.card-visual-bg-overlay{position:absolute;inset:0;background:rgba(0,0,0,.18)}
.card-visual-main{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;z-index:1;display:block}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}}
`

export default function GerenciarSecaoCards() {
  const params = useParams()
  const secaoId = params?.secaoId as string
  const [userId, setUserId] = useState('')
  const [secao, setSecao] = useState<any>(null)
  const [cards, setCards] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [msg, setMsg] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState('')
  const imgRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const [{ data: sec }, { data: crds }] = await Promise.all([
      supabase.from('pagina_cards_secoes').select('*').eq('id', secaoId).eq('user_id', user.id).maybeSingle(),
      supabase.from('pagina_cards').select('*').eq('secao_id', secaoId).eq('user_id', user.id).order('ordem'),
    ])
    if (!sec) { window.location.href = '/painel/perfil/cards'; return }
    setSecao(sec)
    setCards(crds || [])
    setCarregando(false)
  }

  async function validarSessao() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return false }
    if (user.id !== userId) { setMsg('A sessão mudou. Recarregue a página antes de salvar.'); return false }
    return true
  }

  function novoCard() {
    const novoId = 'novo-' + Date.now()
    setCards(prev => [...prev, { id: novoId, secao_id: secaoId, user_id: userId, imagem_url: '', titulo: '', exibir_titulo: false, url: '', exibir_no_topo: false, image_fit: 'auto', ativo: true, ordem: prev.length, _novo: true }])
    setEditandoId(novoId)
  }

  // Ao editar a URL, recalcula o tipo reconhecido em tempo real. Se a URL deixar de ser
  // uma plataforma elegivel pro topo, forca exibir_no_topo=false automaticamente - nunca
  // deixa o card com essa opcao marcada apontando pra um destino generico (inconsistencia
  // que o formulario tem que impedir, conforme pedido).
  function editarCard(id: string, campo: string, valor: any) {
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c
      const atualizado = { ...c, [campo]: valor }
      if (campo === 'url') {
        const tipo = detectarTipoPorUrl(valor)
        const elegivel = !!tipo && TIPOS_SOCIAIS_TOPO.includes(tipo)
        if (!elegivel) atualizado.exibir_no_topo = false
        else if (c._novo) atualizado.exibir_no_topo = true // card novo: default marcado quando reconhecido
      }
      return atualizado
    }))
  }

  async function salvarCard(c: any) {
    if (!(await validarSessao())) return
    if (!c.imagem_url) { setMsg('Envie uma imagem primeiro.'); return }
    if (!c.url?.trim()) { setMsg('Informe o link/destino do card.'); return }
    const payload = { secao_id: secaoId, user_id: userId, imagem_url: c.imagem_url, titulo: c.titulo?.trim() || null, exibir_titulo: !!c.exibir_titulo, url: c.url.trim(), exibir_no_topo: !!c.exibir_no_topo, image_fit: c.image_fit || 'auto', ativo: !!c.ativo, ordem: c.ordem || 0 }
    if (c._novo) {
      const { data, error } = await supabase.from('pagina_cards').insert(payload).select().single()
      if (error) { setMsg('Erro ao salvar card: ' + error.message) }
      else { setCards(prev => prev.map(x => x.id === c.id ? data : x)); setMsg('Card salvo!'); setEditandoId(null) }
    } else {
      const { error } = await supabase.from('pagina_cards').update(payload).eq('id', c.id).eq('user_id', userId)
      if (error) { setMsg('Erro ao salvar card: ' + error.message) }
      else { setMsg('Card salvo!'); setEditandoId(null) }
    }
    setTimeout(() => setMsg(''), 3000)
  }

  function voltarCard(id: string) {
    if (id.startsWith('novo-')) setCards(prev => prev.filter(c => c.id !== id))
    setEditandoId(null)
  }

  async function excluirCard(id: string) {
    if (!(await validarSessao())) return
    if (!id.startsWith('novo-')) {
      if (!window.confirm('Excluir este card?')) return
      const { error } = await supabase.from('pagina_cards').delete().eq('id', id).eq('user_id', userId)
      if (error) { setMsg('Erro ao excluir: ' + error.message); return }
    }
    setCards(prev => prev.filter(c => c.id !== id))
    if (editandoId === id) setEditandoId(null)
  }

  async function toggleAtivo(c: any) {
    if (!(await validarSessao())) return
    const { error } = await supabase.from('pagina_cards').update({ ativo: !c.ativo }).eq('id', c.id).eq('user_id', userId)
    if (error) { setMsg('Erro: ' + error.message); return }
    setCards(prev => prev.map(x => x.id === c.id ? { ...x, ativo: !x.ativo } : x))
  }

  async function mover(id: string, direcao: 'up' | 'down') {
    const idx = cards.findIndex(c => c.id === id)
    if (idx < 0) return
    const novoIdx = direcao === 'up' ? idx - 1 : idx + 1
    if (novoIdx < 0 || novoIdx >= cards.length) return
    const copia = [...cards]
    ;[copia[idx], copia[novoIdx]] = [copia[novoIdx], copia[idx]]
    const comOrdem = copia.map((item, i) => ({ ...item, ordem: i }))
    setCards(comOrdem)
    for (const item of comOrdem) {
      if (!item.id.startsWith('novo-')) {
        await supabase.from('pagina_cards').update({ ordem: item.ordem }).eq('id', item.id).eq('user_id', userId)
      }
    }
  }

  function abrirUpload(id: string) { setUploadingId(id); imgRef.current?.click() }

  // Mesmo padrao ja aprovado em Destaques/Catalogo/Albuns: se o card ainda for um
  // rascunho novo (_novo), salva um registro tecnico no banco pra obter um ID real, MAS
  // preserva editandoId sincronizado com o novo ID e nunca fecha o formulario - so
  // "Imagem enviada", igual ja resolvido no bug de upload fechando o card sozinho.
  async function salvarRascunhoSeNecessario(idTemporario: string, imagemUrl: string): Promise<string | null> {
    const cardAtual = cards.find(x => x.id === idTemporario)
    if (!cardAtual || !cardAtual._novo) return null
    if (!cardAtual.url?.trim()) return null // ainda sem URL preenchida - nao da pra criar o registro real ainda
    const payload = { secao_id: secaoId, user_id: userId, imagem_url: imagemUrl, titulo: cardAtual.titulo?.trim() || null, exibir_titulo: !!cardAtual.exibir_titulo, url: cardAtual.url.trim(), exibir_no_topo: !!cardAtual.exibir_no_topo, image_fit: cardAtual.image_fit || 'auto', ativo: cardAtual.ativo, ordem: cardAtual.ordem || 0 }
    const { data, error } = await supabase.from('pagina_cards').insert(payload).select().single()
    if (error) { setMsg('Erro ao preparar o card: ' + error.message); return null }
    setCards(prev => prev.map(x => x.id === idTemporario ? { ...x, ...data, _novo: false } : x))
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
    const path = `cards/${userId}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('fotos').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
    if (uploadError) { setMsg('Erro no upload: ' + uploadError.message); setUploadingId(''); if (imgRef.current) imgRef.current.value = ''; return }
    const { data } = supabase.storage.from('fotos').getPublicUrl(path)
    editarCard(id, 'imagem_url', data.publicUrl)
    if (id.startsWith('novo-')) {
      const salvou = await salvarRascunhoSeNecessario(id, data.publicUrl)
      if (!salvou) { setMsg('Imagem enviada! Preencha o link e clique em "Salvar".'); setTimeout(() => setMsg(''), 4000) }
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
      <PainelSidebar tituloMobile="Links visuais" />
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg && (
            <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: msg.includes('rro') ? 'rgba(239,68,68,.16)' : 'rgba(34,197,94,.16)', border: `1px solid ${msg.includes('rro') ? 'rgba(239,68,68,.36)' : 'rgba(34,197,94,.36)'}`, borderRadius: '10px', padding: '10px 20px', zIndex: 99, color: msg.includes('rro') ? '#EF4444' : '#22C55E', fontSize: '13px', fontWeight: 700, backdropFilter: 'blur(20px)', maxWidth: '90vw', textAlign: 'center' }}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil/cards" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#B8AAB8', textDecoration: 'none', marginBottom: '18px' }}><ArrowLeft size={15} /> Voltar para Links visuais</Link>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em' }}>{secao?.titulo || 'Seção'}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <VerMiniPageButton />
              <button type="button" onClick={novoCard} style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Novo card</button>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#B8AAB8', marginBottom: '24px' }}>Recomendado: 1200 × 365 px. Mantenha as informações importantes na área central da imagem.</p>

          {cards.length === 0 && <p style={{ fontSize: '13px', color: '#B8AAB8', padding: '12px 0' }}>Nenhum card adicionado ainda.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cards.map((c, i) => {
              const emEdicao = editandoId === c.id
              const tipoReconhecido = detectarTipoPorUrl(c.url)
              const elegivelParaTopo = !!tipoReconhecido && TIPOS_SOCIAIS_TOPO.includes(tipoReconhecido)
              return (
                <div key={c.id} className="crd" style={{ padding: emEdicao ? '16px' : '10px 14px', display: 'flex', gap: '12px', alignItems: emEdicao ? 'flex-start' : 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                    <button type="button" onClick={() => mover(c.id, 'up')} disabled={i === 0} style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: i === 0 ? '#4A3F4E' : '#B8AAB8', cursor: i === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUp size={12} /></button>
                    <button type="button" onClick={() => mover(c.id, 'down')} disabled={i === cards.length - 1} style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: i === cards.length - 1 ? '#4A3F4E' : '#B8AAB8', cursor: i === cards.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowDown size={12} /></button>
                  </div>

                  {!emEdicao ? (
                    <>
                      {c.imagem_url ? (
                        <img src={c.imagem_url} alt={c.titulo || ''} style={{ width: '58px', height: '32px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '58px', height: '32px', borderRadius: '8px', background: 'rgba(24,16,27,.72)', border: '1px dashed #2A1A2F', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#F8F4F7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.titulo || 'Sem título'}</p>
                        {c.exibir_no_topo && <p style={{ fontSize: '10px', color: '#8B7D8B' }}>No topo · {labelPlataforma(tipoReconhecido || '')}</p>}
                      </div>
                      <button type="button" onClick={() => toggleAtivo(c)} style={{ background: c.ativo ? 'rgba(34,197,94,.14)' : '#2A1A2F', border: '1px solid ' + (c.ativo ? 'rgba(34,197,94,.25)' : '#2A1A2F'), borderRadius: 10, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: c.ativo ? '#22C55E' : '#B8AAB8', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>{c.ativo ? 'Ativo' : 'Oculto'}</button>
                      <button type="button" onClick={() => setEditandoId(c.id)} title="Editar" aria-label="Editar" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#B8AAB8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Pencil size={14} /></button>
                      <button type="button" onClick={() => excluirCard(c.id)} title="Excluir" aria-label="Excluir" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Trash2 size={14} /></button>
                    </>
                  ) : (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ marginBottom: '10px' }}>
                        <label className="lbl">Imagem</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          {c.imagem_url ? (
                            <img src={c.imagem_url} alt="" style={{ width: '110px', height: '60px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #2A1A2F', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '110px', height: '60px', borderRadius: '10px', background: 'rgba(24,16,27,.72)', border: '1px dashed #2A1A2F', flexShrink: 0 }} />
                          )}
                          <button type="button" onClick={() => abrirUpload(c.id)} disabled={uploadingId === c.id} style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#B8AAB8', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><UploadCloud size={13} /> {uploadingId === c.id ? 'Enviando...' : (c.imagem_url ? 'Trocar imagem' : 'Enviar imagem')}</button>
                        </div>
                        <p style={{ fontSize: '10px', color: '#8B7D8B', marginTop: '6px' }}>Recomendado: 1200 × 365 px. Mantenha as informações importantes na área central da imagem.</p>
                      </div>
                      <div style={{ marginBottom: '10px' }}><label className="lbl">Título (opcional)</label><input className="inp" autoFocus value={c.titulo || ''} onChange={e => editarCard(c.id, 'titulo', e.target.value)} placeholder="Ex: Fale conosco" /></div>
                      <label className="chk" style={{ marginBottom: '12px', fontSize: '12px', color: '#B8AAB8' }}>
                        <input type="checkbox" checked={!!c.exibir_titulo} onChange={e => editarCard(c.id, 'exibir_titulo', e.target.checked)} />
                        Exibir título sobre a imagem
                      </label>
                      <div style={{ marginBottom: '12px' }}>
                        <label className="lbl">Enquadramento da imagem</label>
                        <select className="inp" value={c.image_fit || 'auto'} onChange={e => editarCard(c.id, 'image_fit', e.target.value)}>
                          <option value="auto">Automático (recomendado)</option>
                          <option value="cover">Preencher card</option>
                          <option value="contain">Mostrar imagem inteira</option>
                        </select>
                        <p style={{ fontSize: '10px', color: '#8B7D8B', marginTop: '6px', marginBottom: '10px' }}>Automático adapta a arte ao card e evita cortes importantes. Preencher card ocupa todo o espaço e pode cortar a imagem. Mostrar imagem inteira preserva toda a arte.</p>
                        {c.imagem_url && <CardVisualPreviewBox imagemUrl={c.imagem_url} titulo={c.exibir_titulo ? c.titulo : null} imageFit={c.image_fit || 'auto'} />}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <label className="lbl">Link / destino</label>
                        <input className="inp" value={c.url || ''} onChange={e => editarCard(c.id, 'url', e.target.value)} placeholder="https://..." />
                        <p style={{ fontSize: '10px', color: '#8B7D8B', marginTop: '6px' }}>Cole o link do produto, vídeo, música, página, Instagram, WhatsApp ou outra plataforma. A MiniPage tenta reconhecer automaticamente o destino.</p>
                      </div>
                      {c.url?.trim() && (
                        elegivelParaTopo ? (
                          <div style={{ marginBottom: '12px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.22)', borderRadius: '10px', padding: '10px 12px' }}>
                            <p style={{ fontSize: '11px', color: '#22C55E', fontWeight: 700, marginBottom: '6px' }}>Destino reconhecido: {labelPlataforma(tipoReconhecido || '')}</p>
                            <label className="chk" style={{ fontSize: '12px', color: '#B8AAB8' }}>
                              <input type="checkbox" checked={!!c.exibir_no_topo} onChange={e => editarCard(c.id, 'exibir_no_topo', e.target.checked)} />
                              Exibir também no topo da MiniPage
                            </label>
                          </div>
                        ) : (
                          <p style={{ fontSize: '11px', color: '#8B7D8B', marginBottom: '12px' }}>Destino: Link externo</p>
                        )
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => editarCard(c.id, 'ativo', !c.ativo)} style={{ background: c.ativo ? 'rgba(34,197,94,.14)' : '#2A1A2F', border: '1px solid ' + (c.ativo ? 'rgba(34,197,94,.25)' : '#2A1A2F'), borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: c.ativo ? '#22C55E' : '#B8AAB8', cursor: 'pointer', fontFamily: 'inherit' }}>{c.ativo ? 'Ativo' : 'Oculto'}</button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => voltarCard(c.id)} style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#B8AAB8', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Voltar</button>
                          <button type="button" onClick={() => excluirCard(c.id)} style={{ background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)', color: '#EF4444', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Excluir</button>
                          <button type="button" onClick={() => salvarCard(c)} style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Salvar</button>
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
