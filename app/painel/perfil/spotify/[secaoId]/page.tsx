'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Pencil } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
import VerMiniPageButton from '@/app/components/VerMiniPageButton'
import { parseSpotifyUrl, SPOTIFY_TIPO_LABEL } from '../../../../lib/spotify'

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
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}}
`

export default function GerenciarSecaoSpotify() {
  const params = useParams()
  const secaoId = params?.secaoId as string
  const [userId, setUserId] = useState('')
  const [secao, setSecao] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [msg, setMsg] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const [{ data: sec }, { data: its }] = await Promise.all([
      supabase.from('pagina_spotify_secoes').select('*').eq('id', secaoId).eq('user_id', user.id).maybeSingle(),
      supabase.from('pagina_spotify_itens').select('*').eq('secao_id', secaoId).eq('user_id', user.id).order('ordem'),
    ])
    if (!sec) { window.location.href = '/painel/perfil/spotify'; return }
    setSecao(sec)
    setItens(its || [])
    setCarregando(false)
  }

  async function validarSessao() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return false }
    if (user.id !== userId) { setMsg('A sessão mudou. Recarregue a página antes de salvar.'); return false }
    return true
  }

  function novoItem() {
    const novoId = 'novo-' + Date.now()
    setItens(prev => [...prev, { id: novoId, secao_id: secaoId, user_id: userId, spotify_url: '', ativo: true, ordem: prev.length, _novo: true }])
    setEditandoId(novoId)
  }

  function editarItem(id: string, valor: string) {
    setItens(prev => prev.map(it => it.id === id ? { ...it, spotify_url: valor } : it))
  }

  async function salvarItem(it: any) {
    if (!(await validarSessao())) return
    const parse = parseSpotifyUrl(it.spotify_url)
    if (!parse.valido) { setMsg('Este link do Spotify não é compatível.'); return }
    const payload = { secao_id: secaoId, user_id: userId, spotify_url: it.spotify_url.trim(), ativo: !!it.ativo, ordem: it.ordem || 0 }
    if (it._novo) {
      const { data, error } = await supabase.from('pagina_spotify_itens').insert(payload).select().single()
      if (error) { setMsg('Erro ao salvar: ' + error.message) }
      else { setItens(prev => prev.map(x => x.id === it.id ? data : x)); setMsg('Conteúdo salvo!'); setEditandoId(null) }
    } else {
      const { error } = await supabase.from('pagina_spotify_itens').update(payload).eq('id', it.id).eq('user_id', userId)
      if (error) { setMsg('Erro ao salvar: ' + error.message) }
      else { setMsg('Conteúdo salvo!'); setEditandoId(null) }
    }
    setTimeout(() => setMsg(''), 3000)
  }

  function voltarItem(id: string) {
    if (id.startsWith('novo-')) setItens(prev => prev.filter(it => it.id !== id))
    setEditandoId(null)
  }

  async function excluirItem(id: string) {
    if (!(await validarSessao())) return
    if (!id.startsWith('novo-')) {
      if (!window.confirm('Excluir este conteúdo?')) return
      const { error } = await supabase.from('pagina_spotify_itens').delete().eq('id', id).eq('user_id', userId)
      if (error) { setMsg('Erro ao excluir: ' + error.message); return }
    }
    setItens(prev => prev.filter(it => it.id !== id))
    if (editandoId === id) setEditandoId(null)
  }

  async function toggleAtivo(it: any) {
    if (!(await validarSessao())) return
    const { error } = await supabase.from('pagina_spotify_itens').update({ ativo: !it.ativo }).eq('id', it.id).eq('user_id', userId)
    if (error) { setMsg('Erro: ' + error.message); return }
    setItens(prev => prev.map(x => x.id === it.id ? { ...x, ativo: !x.ativo } : x))
  }

  async function mover(id: string, direcao: 'up' | 'down') {
    const idx = itens.findIndex(it => it.id === id)
    if (idx < 0) return
    const novoIdx = direcao === 'up' ? idx - 1 : idx + 1
    if (novoIdx < 0 || novoIdx >= itens.length) return
    const copia = [...itens]
    ;[copia[idx], copia[novoIdx]] = [copia[novoIdx], copia[idx]]
    const comOrdem = copia.map((item, i) => ({ ...item, ordem: i }))
    setItens(comOrdem)
    for (const item of comOrdem) {
      if (!item.id.startsWith('novo-')) {
        await supabase.from('pagina_spotify_itens').update({ ordem: item.ordem }).eq('id', item.id).eq('user_id', userId)
      }
    }
  }

  if (carregando) return (<div style={{ minHeight: '100vh', background: '#08060A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}><p style={{ color: '#B8AAB8', fontSize: '14px' }}>Carregando...</p></div>)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#08060A', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar tituloMobile="Spotify" />
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg && (
            <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: msg.includes('rro') || msg.includes('compatível') ? 'rgba(239,68,68,.16)' : 'rgba(34,197,94,.16)', border: `1px solid ${msg.includes('rro') || msg.includes('compatível') ? 'rgba(239,68,68,.36)' : 'rgba(34,197,94,.36)'}`, borderRadius: '10px', padding: '10px 20px', zIndex: 99, color: msg.includes('rro') || msg.includes('compatível') ? '#EF4444' : '#22C55E', fontSize: '13px', fontWeight: 700, backdropFilter: 'blur(20px)', maxWidth: '90vw', textAlign: 'center' }}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil/spotify" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#B8AAB8', textDecoration: 'none', marginBottom: '18px' }}><ArrowLeft size={15} /> Voltar para Spotify</Link>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#F8F4F7', letterSpacing: '-0.02em' }}>{secao?.titulo || 'Seção'}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <VerMiniPageButton />
              <button type="button" onClick={novoItem} style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Novo conteúdo</button>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#B8AAB8', marginBottom: '24px' }}>Cole o link de uma música, álbum, playlist, artista ou podcast do Spotify.</p>

          {itens.length === 0 && <p style={{ fontSize: '13px', color: '#B8AAB8', padding: '12px 0' }}>Nenhum conteúdo adicionado ainda.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {itens.map((it, i) => {
              const emEdicao = editandoId === it.id
              const parse = parseSpotifyUrl(it.spotify_url)
              return (
                <div key={it.id} className="crd" style={{ padding: emEdicao ? '16px' : '10px 14px', display: 'flex', gap: '12px', alignItems: emEdicao ? 'flex-start' : 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                    <button type="button" onClick={() => mover(it.id, 'up')} disabled={i === 0} style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: i === 0 ? '#4A3F4E' : '#B8AAB8', cursor: i === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUp size={12} /></button>
                    <button type="button" onClick={() => mover(it.id, 'down')} disabled={i === itens.length - 1} style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: i === itens.length - 1 ? '#4A3F4E' : '#B8AAB8', cursor: i === itens.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowDown size={12} /></button>
                  </div>

                  {!emEdicao ? (
                    <>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(29,185,84,.12)', border: '1px solid rgba(29,185,84,.25)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🎵</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#F8F4F7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{parse.valido ? `Spotify — ${SPOTIFY_TIPO_LABEL[parse.tipo]}` : 'Link inválido'}</p>
                        <p style={{ fontSize: '10px', color: '#8B7D8B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.spotify_url}</p>
                      </div>
                      <button type="button" onClick={() => toggleAtivo(it)} style={{ background: it.ativo ? 'rgba(34,197,94,.14)' : '#2A1A2F', border: '1px solid ' + (it.ativo ? 'rgba(34,197,94,.25)' : '#2A1A2F'), borderRadius: 10, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: it.ativo ? '#22C55E' : '#B8AAB8', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>{it.ativo ? 'Ativo' : 'Oculto'}</button>
                      <button type="button" onClick={() => setEditandoId(it.id)} title="Editar" aria-label="Editar" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#B8AAB8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Pencil size={14} /></button>
                      <button type="button" onClick={() => excluirItem(it.id)} title="Excluir" aria-label="Excluir" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Trash2 size={14} /></button>
                    </>
                  ) : (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ marginBottom: '8px' }}>
                        <label className="lbl">Cole o link do Spotify</label>
                        <input className="inp" autoFocus value={it.spotify_url || ''} onChange={e => editarItem(it.id, e.target.value)} placeholder="https://open.spotify.com/..." />
                        <p style={{ fontSize: '10px', color: '#8B7D8B', marginTop: '6px' }}>Cole o link de uma música, álbum, playlist, artista ou podcast do Spotify.</p>
                      </div>
                      {it.spotify_url?.trim() && (
                        parse.valido ? (
                          <p style={{ fontSize: '11px', color: '#22C55E', fontWeight: 700, marginBottom: '12px' }}>Destino reconhecido: Spotify — {SPOTIFY_TIPO_LABEL[parse.tipo]}</p>
                        ) : (
                          <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: 700, marginBottom: '12px' }}>Este link do Spotify não é compatível.</p>
                        )
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => voltarItem(it.id)} style={{ background: 'rgba(24,16,27,.9)', border: '1px solid #2A1A2F', color: '#B8AAB8', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Voltar</button>
                          <button type="button" onClick={() => excluirItem(it.id)} style={{ background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)', color: '#EF4444', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Excluir</button>
                          <button type="button" onClick={() => salvarItem(it)} style={{ background: G, color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Salvar</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div></div>
      </div>
    </div>
  )
}
