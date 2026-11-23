'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
import PainelSidebar from '@/app/components/PainelSidebar'
import VerMiniPageButton from '@/app/components/VerMiniPageButton'
import { permiteSpotify } from '../../../lib/planos'

const G = '#C9FA45'

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow-x:hidden;width:100%;max-width:100%;background:#0B0A10}
input,select,textarea{color-scheme:dark}
.pg{background:radial-gradient(circle at top left,rgba(149,82,245,.12),transparent 38%),#0B0A10;min-height:100vh}
.bdy{max-width:820px;margin:0 auto;padding:28px 32px 80px;width:100%}
.crd{background:radial-gradient(circle at top left,rgba(139,92,246,.10),transparent 38%),linear-gradient(145deg,#21182D,#21182D);border:1.5px solid #40344B;border-radius:18px}
.lbl{display:block;font-size:11px;font-weight:700;color:#C5BCD1;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.inp{width:100%;background:rgba(33,24,45,.92);border:1.5px solid #40344B;border-radius:10px;padding:10px 12px;color:#FFFFFF;font-size:13px;font-family:inherit}
.inp:focus{outline:none;border-color:rgba(201,250,69,.5)}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:767px){.psb-main .bdy{padding:14px 14px 80px!important}.fg2{grid-template-columns:1fr!important}}
`

export default function ListaSpotify() {
  const [userId, setUserId] = useState('')
  const [secoes, setSecoes] = useState<any[]>([])
  const [contagemItens, setContagemItens] = useState<Record<string, number>>({})
  const [carregando, setCarregando] = useState(true)
  const [msg, setMsg] = useState('')
  const [editando, setEditando] = useState<any>(null)
  const [tituloForm, setTituloForm] = useState('')
  const [subtituloForm, setSubtituloForm] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [importando, setImportando] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const { data: secs } = await supabase.from('pagina_spotify_secoes').select('*').eq('user_id', user.id).order('ordem')
    const listaSecoes = secs || []
    setSecoes(listaSecoes)

    if (listaSecoes.length > 0) {
      const { data: todosItens } = await supabase.from('pagina_spotify_itens').select('secao_id').eq('user_id', user.id)
      const contagem: Record<string, number> = {}
      ;(todosItens || []).forEach((it: any) => { if (it.secao_id) contagem[it.secao_id] = (contagem[it.secao_id] || 0) + 1 })
      setContagemItens(contagem)
    }
    setCarregando(false)
  }

  async function validarSessao() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return false }
    if (user.id !== userId) { setMsg('A sessão mudou. Recarregue a página antes de salvar.'); return false }
    return true
  }

  // CTA de importacao: aproveita a secao atual e abre o gerenciador real de links Spotify.
  // Para uma conta sem secao, uma unica acao cria a secao inicial e abre o mesmo gerenciador.
  // Nao solicita OAuth Spotify: a inclusao disponivel hoje e feita por link.
  async function importarSpotify() {
    if (importando) return
    setImportando(true)
    setMsg('')
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user || user.id !== userId) {
        setMsg('Sua sessão mudou. Entre novamente antes de importar conteúdo.')
        return
      }
      const { data: perfil, error: erroPlano } = await supabase.from('perfis')
        .select('plano_tipo').eq('user_id', user.id).maybeSingle()
      if (erroPlano || !perfil) { setMsg('Não foi possível verificar seu plano.'); return }
      if (!permiteSpotify(perfil.plano_tipo)) {
        setMsg('O player Spotify requer um plano compatível. No Free, adicione o link na seção Links.')
        return
      }
      // Busca no banco para evitar criar secao duplicada se o painel estiver desatualizado.
      const { data: existentes, error: erroConsulta } = await supabase.from('pagina_spotify_secoes')
        .select('id').eq('user_id', user.id).order('ordem').limit(1)
      if (erroConsulta) { setMsg('Não foi possível consultar suas seções Spotify.'); return }
      let id = existentes?.[0]?.id as string | undefined
      if (!id) {
        const { data: criada, error: erroCriacao } = await supabase.from('pagina_spotify_secoes')
          .insert({ user_id: user.id, titulo: 'Spotify', subtitulo: null, ativo: true, ordem: 0 })
          .select('id').single()
        if (erroCriacao || !criada?.id) { setMsg('Não foi possível preparar a seção Spotify. Tente novamente.'); return }
        id = String(criada.id)
      }
      window.location.assign('/painel/perfil/spotify/' + encodeURIComponent(id))
    } catch {
      setMsg('Não foi possível abrir a importação. Tente novamente.')
    } finally {
      setImportando(false)
    }
  }

  function abrirNovo() {
    setEditando({ novo: true })
    setTituloForm('')
    setSubtituloForm('')
  }
  function abrirEditar(sec: any) {
    setEditando(sec)
    setTituloForm(sec.titulo || '')
    setSubtituloForm(sec.subtitulo || '')
  }
  function fecharForm() {
    setEditando(null)
    setTituloForm('')
    setSubtituloForm('')
  }

  async function salvarSecao() {
    if (!(await validarSessao())) return
    if (!tituloForm.trim()) { setMsg('Dê um título para a seção.'); return }
    setSalvando(true)
    if (editando.novo) {
      const payload = { user_id: userId, titulo: tituloForm.trim(), subtitulo: subtituloForm.trim() || null, ativo: true, ordem: secoes.length }
      const { data, error } = await supabase.from('pagina_spotify_secoes').insert(payload).select().single()
      if (error) { setMsg('Erro ao criar seção: ' + error.message) }
      else { setSecoes(prev => [...prev, data]); setMsg('Seção criada!'); fecharForm() }
    } else {
      const payload = { titulo: tituloForm.trim(), subtitulo: subtituloForm.trim() || null }
      const { error } = await supabase.from('pagina_spotify_secoes').update(payload).eq('id', editando.id).eq('user_id', userId)
      if (error) { setMsg('Erro ao salvar: ' + error.message) }
      else { setSecoes(prev => prev.map(s => s.id === editando.id ? { ...s, ...payload } : s)); setMsg('Seção salva!'); fecharForm() }
    }
    setSalvando(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function toggleAtivo(sec: any) {
    if (!(await validarSessao())) return
    const { error } = await supabase.from('pagina_spotify_secoes').update({ ativo: !sec.ativo }).eq('id', sec.id).eq('user_id', userId)
    if (error) { setMsg('Erro: ' + error.message); return }
    setSecoes(prev => prev.map(s => s.id === sec.id ? { ...s, ativo: !s.ativo } : s))
  }

  async function excluirSecao(sec: any) {
    if (!(await validarSessao())) return
    // Itens da secao sao excluidos em cascade pelo banco (on delete cascade), mesmo
    // padrao ja usado em Cards/Albuns/Destaques.
    if (!window.confirm(`Excluir a seção "${sec.titulo}"? Todos os ${contagemItens[sec.id] || 0} itens dela também serão excluídos.`)) return
    const { error } = await supabase.from('pagina_spotify_secoes').delete().eq('id', sec.id).eq('user_id', userId)
    if (error) { setMsg('Erro ao excluir: ' + error.message); return }
    setSecoes(prev => prev.filter(s => s.id !== sec.id))
  }

  async function mover(id: string, direcao: 'up' | 'down') {
    const idx = secoes.findIndex(s => s.id === id)
    if (idx < 0) return
    const novoIdx = direcao === 'up' ? idx - 1 : idx + 1
    if (novoIdx < 0 || novoIdx >= secoes.length) return
    const copia = [...secoes]
    ;[copia[idx], copia[novoIdx]] = [copia[novoIdx], copia[idx]]
    const comOrdem = copia.map((item, i) => ({ ...item, ordem: i }))
    setSecoes(comOrdem)
    for (const item of comOrdem) {
      await supabase.from('pagina_spotify_secoes').update({ ordem: item.ordem }).eq('id', item.id).eq('user_id', userId)
    }
  }

  if (carregando) return (<div style={{ minHeight: '100vh', background: '#0B0A10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}><p style={{ color: '#C5BCD1', fontSize: '14px' }}>Carregando...</p></div>)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0B0A10', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar tituloMobile="Spotify" />
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg && (
            <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: msg.includes('rro') ? 'rgba(239,68,68,.16)' : 'rgba(34,197,94,.16)', border: `1px solid ${msg.includes('rro') ? 'rgba(239,68,68,.36)' : 'rgba(34,197,94,.36)'}`, borderRadius: '10px', padding: '10px 20px', zIndex: 99, color: msg.includes('rro') ? '#EF4444' : '#22C55E', fontSize: '13px', fontWeight: 700, backdropFilter: 'blur(20px)', maxWidth: '90vw', textAlign: 'center' }}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#C5BCD1', textDecoration: 'none', marginBottom: '18px' }}><ArrowLeft size={15} /> Voltar para Configurações</Link>

          <p style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '8px' }}>Spotify</p>
          <p style={{ fontSize: '13px', color: '#C5BCD1', marginBottom: '24px' }}>Incorpore músicas, álbuns, playlists, artistas e podcasts do Spotify na sua MiniPage.</p>

          <section className="crd" style={{padding:'18px',marginBottom:'22px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
            <div style={{flex:'1 1 240px',minWidth:0}}>
              <p style={{fontWeight:800,fontSize:16,color:'#FFFFFF',marginBottom:6}}>Importar Spotify</p>
              <p style={{fontSize:13,color:'#C5BCD1',lineHeight:1.6}}>Adicione músicas, álbuns, playlists e podcasts usando o link do Spotify. Não é necessário conectar sua conta.</p>
            </div>
            <button type="button" onClick={()=>void importarSpotify()} disabled={importando} style={{background:G,color:'#0B0A10',border:0,borderRadius:10,padding:'12px 18px',fontWeight:800,fontSize:13,cursor:importando?'wait':'pointer',opacity:importando?.65:1,fontFamily:'inherit',flexShrink:0}}>{importando?'Abrindo…':'Importar Spotify'}</button>
          </section>

          {editando && (
            <div className="crd" style={{ padding: '18px', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '14px' }}>{editando.novo ? 'Nova seção' : 'Editar seção'}</p>
              <div className="fg2" style={{ marginBottom: '14px' }}>
                <div><label className="lbl">Título *</label><input className="inp" autoFocus value={tituloForm} onChange={e => setTituloForm(e.target.value)} placeholder="Ex: Ouça agora" /></div>
                <div><label className="lbl">Subtítulo (opcional)</label><input className="inp" value={subtituloForm} onChange={e => setSubtituloForm(e.target.value)} placeholder="Ex: Meus lançamentos" /></div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={fecharForm} style={{ background: 'rgba(33,24,45,.9)', border: '1px solid #40344B', color: '#C5BCD1', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Voltar</button>
                <button type="button" onClick={salvarSecao} disabled={salvando} style={{ background: G, color: '#0B0A10', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: salvando ? .7 : 1 }}>{salvando ? 'Salvando...' : 'Salvar seção'}</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Suas seções</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <VerMiniPageButton />
              <button type="button" onClick={abrirNovo} style={{ background: G, color: '#0B0A10', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Nova seção</button>
            </div>
          </div>

          {secoes.length === 0 && <p style={{ fontSize: '13px', color: '#C5BCD1', padding: '12px 0' }}>Nenhuma seção cadastrada ainda. Use <strong>Importar Spotify</strong> para começar.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {secoes.map((sec, i) => {
              const qtdItens = contagemItens[sec.id] || 0
              return (
                <div key={sec.id} className="crd" style={{ padding: '16px', display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, paddingTop: '2px' }}>
                    <button type="button" onClick={() => mover(sec.id, 'up')} disabled={i === 0} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(33,24,45,.9)', border: '1px solid #40344B', color: i === 0 ? '#4A3F4E' : '#C5BCD1', cursor: i === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUp size={14} /></button>
                    <button type="button" onClick={() => mover(sec.id, 'down')} disabled={i === secoes.length - 1} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(33,24,45,.9)', border: '1px solid #40344B', color: i === secoes.length - 1 ? '#4A3F4E' : '#C5BCD1', cursor: i === secoes.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowDown size={14} /></button>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>{sec.titulo}</p>
                    {sec.subtitulo && <p style={{ fontSize: '12px', color: '#C5BCD1', marginBottom: '6px' }}>{sec.subtitulo}</p>}
                    <p style={{ fontSize: '12px', color: '#AEA3BC', marginBottom: '10px' }}>{qtdItens} item{qtdItens !== 1 ? 's' : ''} · <span style={{ color: sec.ativo ? '#22C55E' : '#C5BCD1' }}>{sec.ativo ? 'Ativo' : 'Oculto'}</span></p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Link href={`/painel/perfil/spotify/${sec.id}`} style={{ background: G, color: '#0B0A10', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', fontFamily: 'inherit' }}>Gerenciar conteúdos</Link>
                      <button type="button" onClick={() => abrirEditar(sec)} style={{ background: 'rgba(33,24,45,.9)', border: '1px solid #40344B', color: '#C5BCD1', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Editar</button>
                      <button type="button" onClick={() => toggleAtivo(sec)} style={{ background: sec.ativo ? 'rgba(34,197,94,.14)' : '#40344B', border: '1px solid ' + (sec.ativo ? 'rgba(34,197,94,.25)' : '#40344B'), borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: sec.ativo ? '#22C55E' : '#C5BCD1', cursor: 'pointer', fontFamily: 'inherit' }}>{sec.ativo ? 'Desativar' : 'Ativar'}</button>
                      <button type="button" onClick={() => excluirSecao(sec)} style={{ background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)', color: '#EF4444', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Excluir</button>
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
