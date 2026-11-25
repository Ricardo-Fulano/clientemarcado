'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { permiteAlbuns } from '../../../lib/planos'
import PainelSidebar from '@/app/components/PainelSidebar'
import VerMiniPageButton from '@/app/components/VerMiniPageButton'

const G = '#C9FA45'
type MidiaInstagram = { id: string; tipo: string; imagem: string; link: string; legenda: string }
const PROPORCOES = ['1:1', '4:5', '3:4', '16:9'] as const
const PROPORCAO_LABEL: Record<string, string> = { '1:1': '1:1', '4:5': '4:5', '3:4': '3:4', '16:9': '16:9' }

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

export default function ListaAlbuns() {
  const [userId, setUserId] = useState('')
  const [podeEditarAlbuns, setPodeEditarAlbuns] = useState(false)
  const [igAberto, setIgAberto] = useState(false)
  const [igCarregando, setIgCarregando] = useState(false)
  const [igSalvando, setIgSalvando] = useState(false)
  const [igErro, setIgErro] = useState('')
  const [igPerfil, setIgPerfil] = useState('')
  const [igMidias, setIgMidias] = useState<MidiaInstagram[]>([])
  const [igSelecionadas, setIgSelecionadas] = useState<string[]>([])
  const [albumDestino, setAlbumDestino] = useState('')
  const [formatoForm, setFormatoForm] = useState<'carrossel'|'grade'>('carrossel')
  const [formatoDisponivel, setFormatoDisponivel] = useState(false)
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

  useEffect(() => { void load() }, [])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('instagram')
    if (!status) { if (params.get('importar') === 'instagram') window.location.replace('/painel/perfil/importar-instagram?fotos=1'); return }
    params.delete('instagram')
    window.history.replaceState(null, '', window.location.pathname + (params.toString() ? '?' + params.toString() : ''))
    setIgAberto(true)
    if (status === 'conectado') void carregarInstagram()
    else setIgErro(status === 'varias_contas' ? 'Há mais de uma conta profissional disponível. Revise as contas compartilhadas na Meta.' :
      status === 'sem_conta' ? 'Nenhuma conta profissional foi compartilhada. Confira as permissões na Meta.' : 'Não foi possível concluir a conexão. Tente novamente.')
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const { data: perfil } = await supabase.from('perfis').select('plano_tipo').eq('user_id', user.id).maybeSingle()
    setPodeEditarAlbuns(permiteAlbuns(perfil?.plano_tipo))
    // Consulta somente-leitura: permite instalar o código ANTES da migração sem quebrar a edição normal.
    const { error: erroFormato } = await supabase.from('pagina_albuns').select('formato_exibicao').eq('user_id',user.id).limit(1)
    setFormatoDisponivel(!erroFormato)
    const { data: albs } = await supabase.from('pagina_albuns').select('*').eq('user_id', user.id).order('ordem')
    const listaAlbuns = albs || []
    setAlbuns(listaAlbuns)
    setAlbumDestino(atual => listaAlbuns.some((a: any) => a.id === atual) ? atual : String(listaAlbuns[0]?.id || ''))

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

  async function obterToken() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Entre novamente na MiniPage Pro.')
    return session.access_token
  }

  async function conectarInstagram() {
    if (!podeEditarAlbuns) { setIgErro('Álbuns / Fotos está disponível a partir do plano MiniPage.'); return }
    setIgErro('')
    setIgCarregando(true)
    try {
      const token = await obterToken()
      const atual=await fetch('/api/smart-import/instagram/perfil', {headers:{Authorization:`Bearer ${token}`},cache:'no-store'})
      if (atual.ok) {
        const json=await atual.json().catch(()=>null)
        if (Array.isArray(json?.midias)) {
          setIgPerfil(typeof json?.perfil?.username === 'string' ? json.perfil.username : '')
          setIgMidias((json.midias as MidiaInstagram[]).filter(m=> /^\d+$/.test(m.id) && ['IMAGE','CAROUSEL_ALBUM'].includes(m.tipo)))
          setIgSelecionadas((json.midias as MidiaInstagram[]).filter(m=>/^\d+$/.test(m.id) && ['IMAGE','CAROUSEL_ALBUM'].includes(m.tipo)).slice(0,6).map(m=>m.id))
          setIgAberto(true)
          setIgCarregando(false)
          return
        }
      }
      const response = await fetch('/api/smart-import/instagram/iniciar', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ destino: '/painel/perfil/albuns' }), cache: 'no-store'
      })
      const json = await response.json().catch(() => null)
      if (!response.ok || typeof json?.url !== 'string') throw new Error(json?.error || 'Falha na conexão com Instagram.')
      window.location.assign(json.url)
    } catch (e) { setIgErro(e instanceof Error ? e.message : 'Não foi possível conectar o Instagram.'); setIgCarregando(false) }
  }

  async function carregarInstagram() {
    setIgAberto(true)
    setIgCarregando(true)
    setIgErro('')
    try {
      const token = await obterToken()
      const response = await fetch('/api/smart-import/instagram/perfil', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const json = await response.json().catch(() => null)
      if (!response.ok || !Array.isArray(json?.midias)) throw new Error(json?.error || 'Reconecte seu Instagram.')
      setIgPerfil(typeof json?.perfil?.username === 'string' ? json.perfil.username : '')
      setIgMidias((json.midias as MidiaInstagram[]).filter(m =>
        /^\d+$/.test(m.id) && ['IMAGE', 'CAROUSEL_ALBUM'].includes(m.tipo) && typeof m.imagem === 'string'
      ))
      setIgSelecionadas((json.midias as MidiaInstagram[]).filter(m=>/^\d+$/.test(m.id) && ['IMAGE','CAROUSEL_ALBUM'].includes(m.tipo)).slice(0,6).map(m=>m.id))
    } catch (e) { setIgErro(e instanceof Error ? e.message : 'Falha ao carregar publicações.') }
    finally { setIgCarregando(false) }
  }

  async function importarFotosInstagram() {
    if (igSalvando || !albumDestino || !igSelecionadas.length) return
    setIgSalvando(true)
    setIgErro('')
    let salvas = 0
    let ignoradas = 0
    try {
      if (!(await validarSessao())) throw new Error('Sua sessão mudou. Recarregue a página.')
      // Nunca confiar apenas na restrição de interface: consultar o plano atual antes de escrever.
      const { data: perfil, error: erroPlano } = await supabase.from('perfis').select('plano_tipo').eq('user_id', userId).maybeSingle()
      if (erroPlano || !permiteAlbuns(perfil?.plano_tipo)) throw new Error('Seu plano não permite publicar álbuns.')
      const { data: album, error: erroAlbum } = await supabase.from('pagina_albuns')
        .select('id').eq('id', albumDestino).eq('user_id', userId).maybeSingle()
      if (erroAlbum || !album) throw new Error('Selecione um álbum válido.')
      const { data: fotosExistentes, error: erroFotos } = await supabase.from('pagina_album_fotos')
        .select('imagem_url,album_id').eq('user_id', userId)
      if (erroFotos) throw new Error('Não foi possível verificar fotos existentes. Nenhuma foto foi alterada.')
      const urls = new Set((fotosExistentes || []).map((f: { imagem_url?: string | null }) => f.imagem_url || ''))
      let ordem = (fotosExistentes || []).filter((f: { album_id: string }) => f.album_id === albumDestino).length
      const token = await obterToken()
      const selected = igMidias.filter(m => igSelecionadas.includes(m.id))
      for (const post of selected) {
        const r = await fetch(`/api/smart-import/instagram/midia?midiaId=${encodeURIComponent(post.id)}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        if (!r.ok) {
          const detail = await r.json().catch(() => null)
          throw new Error(detail?.error || `Falha ao importar a publicação ${post.id}.`)
        }
        const blob = await r.blob()
        const tipos: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
        const ext = tipos[blob.type]
        if (!ext || !blob.size || blob.size > 8 * 1024 * 1024) throw new Error('Imagem recebida em formato inválido.')
        const path = `album-fotos/${userId}-instagram-${post.id}.${ext}`
        const storage = supabase.storage.from('fotos')
        const publicUrl = storage.getPublicUrl(path).data.publicUrl
        if (urls.has(publicUrl)) { ignoradas++; continue }
        const { error: uploadError } = await storage.upload(path, blob, { contentType: blob.type, upsert: false, cacheControl: '3600' })
        if (uploadError) throw new Error('Upload não concluído. A foto não foi duplicada: ' + uploadError.message)
        const { error: insertError } = await supabase.from('pagina_album_fotos').insert({
          user_id: userId, album_id: albumDestino, imagem_url: publicUrl,
          titulo: igPerfil ? `Instagram @${igPerfil}` : 'Instagram',
          descricao: post.legenda.slice(0, 500) || null, ativo: true, ordem
        })
        if (insertError) {
          await storage.remove([path]) // desfaz somente a imagem recém-enviada por esta tentativa
          throw new Error('Não foi possível salvar a foto no álbum: ' + insertError.message)
        }
        urls.add(publicUrl)
        salvas++
        ordem++
      }
      setIgSelecionadas([])
      setMsg(`${salvas} foto(s) adicionada(s) a Álbuns / Fotos.${ignoradas ? ` ${ignoradas} já existente(s) não foram duplicadas.` : ''}`)
      await load()
    } catch (e) {
      setIgErro(`${salvas ? `${salvas} foto(s) salvas. ` : ''}${e instanceof Error ? e.message : 'Falha na importação.'}`)
      await load()
    } finally { setIgSalvando(false) }
  }

  function abrirNovo() {
    setEditando({ novo: true })
    setTituloForm('')
    setSubtituloForm('')
    setProporcaoForm('1:1')
    setFormatoForm('carrossel')
  }
  function abrirEditar(alb: any) {
    setEditando(alb)
    setTituloForm(alb.titulo || '')
    setSubtituloForm(alb.subtitulo || '')
    setProporcaoForm(alb.proporcao || '1:1')
    setFormatoForm(alb.formato_exibicao === 'grade' ? 'grade' : 'carrossel')
  }
  function fecharForm() {
    setEditando(null)
    setTituloForm('')
    setSubtituloForm('')
    setProporcaoForm('1:1')
    setFormatoForm('carrossel')
  }

  async function salvarAlbum() {
    if (!(await validarSessao())) return
    if (!tituloForm.trim()) { setMsg('Dê um título para o álbum.'); return }
    setSalvando(true)
    if (editando.novo) {
      const payload = { user_id: userId, titulo: tituloForm.trim(), subtitulo: subtituloForm.trim() || null, proporcao: proporcaoForm, ...(formatoDisponivel ? {formato_exibicao:formatoForm} : {}), ativo: true, ordem: albuns.length }
      const { data, error } = await supabase.from('pagina_albuns').insert(payload).select().single()
      if (error) { setMsg('Erro ao criar álbum: ' + error.message) }
      else { setAlbuns(prev => [...prev, data]); setMsg('Álbum criado!'); fecharForm() }
    } else {
      const payload = { titulo: tituloForm.trim(), subtitulo: subtituloForm.trim() || null, proporcao: proporcaoForm, ...(formatoDisponivel ? {formato_exibicao:formatoForm} : {}) }
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

  if (carregando) return (<div style={{ minHeight: '100vh', background: '#0B0A10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}><p style={{ color: '#C5BCD1', fontSize: '14px' }}>Carregando...</p></div>)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0B0A10', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PainelSidebar tituloMobile="Álbuns / Fotos" />
      <div className="psb-main">
        <div className="pg"><div className="bdy">

          {msg && (
            <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: msg.includes('rro') ? 'rgba(239,68,68,.16)' : 'rgba(34,197,94,.16)', border: `1px solid ${msg.includes('rro') ? 'rgba(239,68,68,.36)' : 'rgba(34,197,94,.36)'}`, borderRadius: '10px', padding: '10px 20px', zIndex: 99, color: msg.includes('rro') ? '#EF4444' : '#22C55E', fontSize: '13px', fontWeight: 700, backdropFilter: 'blur(20px)', maxWidth: '90vw', textAlign: 'center' }}>
              {msg}
            </div>
          )}

          <Link href="/painel/perfil" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#C5BCD1', textDecoration: 'none', marginBottom: '18px' }}><ArrowLeft size={15} /> Voltar para Configurações</Link>

          <p style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '8px' }}>Álbuns / Fotos</p>
          <p style={{ fontSize: '13px', color: '#C5BCD1', marginBottom: '24px' }}>Organize suas fotos em álbuns. Importe publicações do Instagram sem criar uma galeria duplicada.</p>

          <div className="crd" style={{padding:'18px',marginBottom:'20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <div>
                <p style={{fontWeight:800,fontSize:15,color:'#FFFFFF',marginBottom:4}}>Importar fotos do Instagram</p>
                <p style={{fontSize:12,color:'#C5BCD1'}}>Escolha imagens da sua conta profissional e adicione a um álbum existente.</p>
              </div>
              {podeEditarAlbuns ? <Link href="/painel/perfil/importar-instagram?fotos=1" style={{background:G,color:'#0B0A10',borderRadius:10,padding:'11px 15px',fontSize:13,fontWeight:800,textDecoration:'none'}}>Importar Instagram</Link> : <Link href="/painel/plano" style={{fontSize:13,color:'#C5BCD1'}}>🔒 Disponível a partir do MiniPage</Link>}
            </div>
            {igAberto && podeEditarAlbuns && <div style={{marginTop:15,borderTop:'1px solid #40344B',paddingTop:16}}>
              <p style={{fontSize:12,color:'#C5BCD1',marginBottom:12}}>A Meta pode solicitar autorização. Nenhuma foto será publicada sem sua seleção e confirmação.</p>
              <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
                <button type="button" disabled={igCarregando||igSalvando} onClick={()=>void conectarInstagram()} style={{background:G,color:'#0B0A10',border:0,borderRadius:9,padding:'9px 14px',fontWeight:750,cursor:'pointer'}}>Conectar meu Instagram</button>
                <button type="button" disabled={igCarregando||igSalvando} onClick={()=>void carregarInstagram()} style={{background:'rgba(33,24,45,.92)',color:'#FFFFFF',border:'1px solid #40344B',borderRadius:9,padding:'9px 14px',cursor:'pointer'}}>Já conectei / Atualizar fotos</button>
              </div>
              {igCarregando && <p style={{color:'#C5BCD1',fontSize:12,marginTop:12}}>Carregando fotos autorizadas…</p>}
              {igErro && <p role="alert" style={{color:'#FCA5A5',fontSize:12,marginTop:12}}>{igErro}</p>}
              {!!igMidias.length && <>
                <p style={{color:'#FFFFFF',fontSize:13,fontWeight:700,margin:'16px 0 10px'}}>{igPerfil ? `@${igPerfil} — ` : ''}Selecione fotos ({igSelecionadas.length})</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:9}}>
                  {igMidias.map(m=><button key={m.id} type="button" aria-pressed={igSelecionadas.includes(m.id)} onClick={()=>setIgSelecionadas(prev=>prev.includes(m.id)?prev.filter(id=>id!==m.id):[...prev,m.id])} style={{border:igSelecionadas.includes(m.id)?'3px solid #C9FA45':'1px solid #40344B',borderRadius:10,overflow:'hidden',background:'#21182D',position:'relative',padding:0,aspectRatio:'1',cursor:'pointer'}}><img src={m.imagem} alt={m.legenda || 'Publicação do Instagram'} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/>{igSelecionadas.includes(m.id)&&<span style={{position:'absolute',top:4,right:4,background:'#C9FA45',color:'#0B0A10',padding:3,borderRadius:5,fontSize:11,fontWeight:800}}>✓</span>}</button>)}
                </div>
                <div style={{display:'flex',gap:9,alignItems:'end',marginTop:15,flexWrap:'wrap'}}>
                  <label style={{fontSize:12,color:'#C5BCD1',display:'flex',flexDirection:'column',gap:7,flex:1,minWidth:175}}>Adicionar ao álbum
                    <select className="inp" value={albumDestino} onChange={e=>setAlbumDestino(e.target.value)}>{albuns.length===0&&<option value="">Crie um álbum primeiro</option>}{albuns.map(a=><option key={a.id} value={a.id}>{a.titulo}</option>)}</select>
                  </label>
                  <button type="button" disabled={igSalvando||!albumDestino||!igSelecionadas.length} onClick={()=>void importarFotosInstagram()} style={{background:G,color:'#0B0A10',border:0,borderRadius:9,padding:'11px 15px',fontWeight:800,cursor:'pointer',opacity:(igSalvando||!albumDestino||!igSelecionadas.length)?0.55:1}}>{igSalvando?'Importando…':`Importar ${igSelecionadas.length} foto(s)`}</button>
                </div>
                <p style={{fontSize:11,color:'#C5BCD1',marginTop:10}}>Vídeos e Reels não são convertidos em imagens. O módulo Álbuns / Fotos guarda fotografias.</p>
              </>}
            </div>}
          </div>

          {editando && (
            <div className="crd" style={{ padding: '18px', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '14px' }}>{editando.novo ? 'Novo álbum' : 'Editar álbum'}</p>
              <div className="fg2" style={{ marginBottom: '14px' }}>
                <div><label className="lbl">Título *</label><input className="inp" autoFocus value={tituloForm} onChange={e => setTituloForm(e.target.value)} placeholder="Ex: Bastidores" /></div>
                <div><label className="lbl">Subtítulo (opcional)</label><input className="inp" value={subtituloForm} onChange={e => setSubtituloForm(e.target.value)} placeholder="Ex: Momentos especiais" /></div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label className="lbl">Proporção das miniaturas</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PROPORCOES.map(p => (
                    <button key={p} type="button" onClick={() => setProporcaoForm(p)} style={{ background: proporcaoForm === p ? G : 'rgba(33,24,45,.9)', color: proporcaoForm === p ? '#fff' : '#C5BCD1', border: proporcaoForm === p ? '1px solid rgba(255,255,255,.12)' : '1px solid #40344B', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{PROPORCAO_LABEL[p]}</button>
                  ))}
                </div>
                <p style={{ fontSize: '10px', color: '#C5BCD1', marginTop: '6px' }}>Todas as fotos do álbum aparecem recortadas nessa mesma proporção na miniatura. Na visualização ampliada, a foto aparece inteira, sem cortes.</p>
              </div>
              <div style={{marginBottom:14}}>
                <label className="lbl">Formato de exibição pública</label>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {(['carrossel','grade'] as const).map(m=><button key={m} type="button" disabled={!formatoDisponivel && m==='grade'} onClick={()=>setFormatoForm(m)} aria-pressed={formatoForm===m} style={{background:formatoForm===m?G:'#21182D',color:formatoForm===m?'#fff':'#C5BCD1',border:'1px solid #40344B',borderRadius:9,padding:'8px 15px',cursor:'pointer'}}>{m==='grade'?'Grade':'Carrossel'}</button>)}
                </div>
                {!formatoDisponivel && <p style={{color:'#F0B6D9',fontSize:11,marginTop:6}}>A exibição em Grade será liberada após a migração do banco; os álbuns continuam em Carrossel.</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={fecharForm} style={{ background: 'rgba(33,24,45,.9)', border: '1px solid #40344B', color: '#C5BCD1', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Voltar</button>
                <button type="button" onClick={salvarAlbum} disabled={salvando} style={{ background: G, color: '#0B0A10', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: salvando ? .7 : 1 }}>{salvando ? 'Salvando...' : 'Salvar álbum'}</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Seus álbuns</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <VerMiniPageButton />
              <button type="button" onClick={abrirNovo} style={{ background: G, color: '#0B0A10', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Novo álbum</button>
            </div>
          </div>

          {albuns.length === 0 && <p style={{ fontSize: '13px', color: '#C5BCD1', padding: '12px 0' }}>Nenhum álbum cadastrado ainda.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {albuns.map((alb, i) => {
              const qtdFotos = contagemFotos[alb.id] || 0
              return (
                <div key={alb.id} className="crd" style={{ padding: '16px', display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, paddingTop: '2px' }}>
                    <button type="button" onClick={() => mover(alb.id, 'up')} disabled={i === 0} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(33,24,45,.9)', border: '1px solid #40344B', color: i === 0 ? '#4A3F4E' : '#C5BCD1', cursor: i === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUp size={14} /></button>
                    <button type="button" onClick={() => mover(alb.id, 'down')} disabled={i === albuns.length - 1} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(33,24,45,.9)', border: '1px solid #40344B', color: i === albuns.length - 1 ? '#4A3F4E' : '#C5BCD1', cursor: i === albuns.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowDown size={14} /></button>
                  </div>
                  {alb.capa_url ? (
                    <img src={alb.capa_url} alt={alb.titulo} style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #40344B', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: 'rgba(33,24,45,.72)', border: '1px dashed #40344B', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>{alb.titulo}</p>
                    {alb.subtitulo && <p style={{ fontSize: '12px', color: '#C5BCD1', marginBottom: '6px' }}>{alb.subtitulo}</p>}
                    <p style={{ fontSize: '12px', color: '#AEA3BC', marginBottom: '10px' }}>{qtdFotos} foto{qtdFotos !== 1 ? 's' : ''} · {alb.proporcao} · {alb.formato_exibicao === 'grade' ? 'Grade' : 'Carrossel'} · <span style={{ color: alb.ativo ? '#22C55E' : '#C5BCD1' }}>{alb.ativo ? 'Visível' : 'Oculto'}</span></p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Link href={`/painel/perfil/albuns/${alb.id}`} style={{ background: G, color: '#0B0A10', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', fontFamily: 'inherit' }}>Gerenciar fotos</Link>
                      <button type="button" onClick={() => abrirUploadCapa(alb.id)} disabled={enviandoCapaId === alb.id} style={{ background: 'rgba(33,24,45,.9)', border: '1px solid #40344B', color: '#C5BCD1', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{enviandoCapaId === alb.id ? 'Enviando...' : (alb.capa_url ? 'Trocar capa' : 'Enviar capa')}</button>
                      <input ref={el => { capaFileRefs.current[alb.id] = el }} type="file" accept="image/*" onChange={e => uploadCapa(alb.id, e)} style={{ display: 'none' }} />
                      <button type="button" onClick={() => abrirEditar(alb)} style={{ background: 'rgba(33,24,45,.9)', border: '1px solid #40344B', color: '#C5BCD1', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Editar</button>
                      <button type="button" onClick={() => toggleAtivo(alb)} style={{ background: alb.ativo ? 'rgba(34,197,94,.14)' : '#40344B', border: '1px solid ' + (alb.ativo ? 'rgba(34,197,94,.25)' : '#40344B'), borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: alb.ativo ? '#22C55E' : '#C5BCD1', cursor: 'pointer', fontFamily: 'inherit' }}>{alb.ativo ? 'Ocultar' : 'Mostrar'}</button>
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
