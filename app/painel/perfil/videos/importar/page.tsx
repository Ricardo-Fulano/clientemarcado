'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { youtubeFormato } from '../../../../lib/smart-import-vertical'
import SmartShortsImport from '../../../../components/SmartShortsImport'
import { useIdiomaGlobal } from '../../../../components/IdiomaProviderGlobal'
import { supabase } from '../../../../lib/supabase'
import { obterLimiteVideos, permiteAlbuns } from '../../../../lib/planos'
import { guardarSmartImport, publicarSmartImportPendente, youtubeId } from '../../../../lib/smart-import-pendente'
import PainelSidebar from '@/app/components/PainelSidebar'

type Video = { videoId: string; titulo: string; miniatura: string; url: string }
const G = '#C9FA45'
const botao = { background: G, border: 0, borderRadius: 10, padding: '11px 15px', color: '#0B0A10', fontWeight: 800, cursor: 'pointer' as const }

export default function ImportarYoutubePainel() {
  const {idioma}=useIdiomaGlobal()
  const [shorts,setShorts]=useState<Video[]>([])
  const [canal, setCanal] = useState('')
  const [resultados, setResultados] = useState<Video[]>([])
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [consulta, setConsulta] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [userId, setUserId] = useState('')
  const [plano, setPlano] = useState('free')

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
      const { data: perfil } = await supabase.from('perfis').select('plano_tipo').eq('user_id', user.id).maybeSingle()
      setPlano(String(perfil?.plano_tipo || 'free'))
    })()
  }, [])

  async function buscar() {
    if (consulta) return
    setConsulta(true)
    setMensagem('')
    setResultados([])
    setSelecionados([])
    try {
      if (!canal.trim()) throw new Error('Informe o @canal ou o link do canal YouTube.')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Entre novamente na sua conta.')
      const r = await fetch(`/api/smart-import/youtube?canal=${encodeURIComponent(canal.trim())}`,
        { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' })
      const j = await r.json().catch(() => null)
      if (!r.ok || !Array.isArray(j?.videos)) throw new Error(j?.error || 'Não foi possível buscar esse canal.')
      setResultados((j.videos as Video[]).map(v=>({...v,url:youtubeFormato(v.videoId,false)})))
      if (!j.videos.length) setMensagem('Nenhum vídeo público disponível neste canal.')
    } catch (e) { setMensagem(e instanceof Error ? e.message : 'Falha ao consultar YouTube.') }
    finally { setConsulta(false) }
  }

  async function salvar() {
    if (salvando || !selecionados.length || !userId) return
    setSalvando(true)
    setMensagem('')
    let incluidos = 0
    let duplicados = 0
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user || user.id !== userId) throw new Error('Sua sessão mudou. Entre novamente.')
      const { data: perfil, error: erroPlano } = await supabase.from('perfis').select('plano_tipo').eq('user_id',userId).maybeSingle()
      if (erroPlano || !perfil) throw new Error('Não foi possível verificar seu plano.')
      const planoAtual = String(perfil.plano_tipo || 'free')
      if (permiteAlbuns(planoAtual)) {
        const escolhidos=resultados.filter(v=>selecionados.includes(v.videoId))
        await guardarSmartImport(userId,escolhidos,[],null)
        await publicarSmartImportPendente(userId)
        setSelecionados([])
        setMensagem('Seleção processada. Confira seus vídeos; os já existentes foram preservados.')
        return
      }
      const maximo = obterLimiteVideos(planoAtual)
      const { data: anteriores, error: erroAnterior } = await supabase.from('pagina_videos')
        .select('url_video').eq('user_id',userId)
      if (erroAnterior) throw new Error('Não foi possível verificar vídeos existentes.')
      let total = anteriores?.length || 0
      const urls = new Set((anteriores || []).map((v: { url_video: string | null })=>youtubeId(v.url_video)))
      if (total >= maximo) throw new Error('Seu plano já atingiu o limite de vídeos. Gerencie os vídeos existentes ou consulte os planos.')
      const escolhidos = resultados.filter(v=>selecionados.includes(v.videoId))
      let secaoId: string | null = null
      if (planoAtual !== 'free' && escolhidos.length) {
        const { data: secoes, error: erroSecoes } = await supabase.from('pagina_videos_secoes')
          .select('id').eq('user_id',userId).eq('ativo',true).order('ordem',{ascending:true}).limit(1)
        if (erroSecoes) throw new Error('Não foi possível consultar a seção de vídeos.')
        secaoId = secoes?.[0]?.id || null
        if (!secaoId) {
          const { data: nova, error: erroNova } = await supabase.from('pagina_videos_secoes')
            .insert({user_id:userId,titulo:'Vídeos do YouTube',subtitulo:null,ativo:true,ordem:0})
            .select('id').single()
          if (erroNova || !nova) throw new Error('Não foi possível criar a seção de vídeos.')
          secaoId = nova.id
        }
      }
      for (const video of escolhidos) {
        if(video.url!==youtubeFormato(video.videoId,false)&&video.url!==youtubeFormato(video.videoId,true)) continue
        if (urls.has(video.videoId)) { duplicados++; continue }
        if (total >= maximo) break
        const { error } = await supabase.from('pagina_videos').insert({
          user_id: userId, titulo: video.titulo.slice(0,160), url_video: youtubeFormato(video.videoId,false),
          thumbnail_url: video.miniatura, plataforma:'youtube', formato:'16:9', ativo: true, ordem: total,
          ...(secaoId ? {secao_id:secaoId} : {})
        })
        if (error) throw new Error('Não foi possível salvar um dos vídeos: ' + error.message)
        incluidos++
        total++
        urls.add(video.videoId)
      }
      setSelecionados([])
      setMensagem(`${incluidos} vídeo(s) adicionado(s).${duplicados ? ` ${duplicados} já existente(s) ignorado(s).` : ''}`)
    } catch (e) { setMensagem(`${incluidos ? `${incluidos} vídeo(s) salvo(s). ` : ''}${e instanceof Error ? e.message : 'Falha na importação.'}`) }
    finally { setSalvando(false) }
  }

  async function salvarShorts(){
    if(salvando||!shorts.length||!userId||!permiteAlbuns(plano))return
    setSalvando(true);setMensagem('')
    try{const {data:{user}}=await supabase.auth.getUser();if(user?.id!==userId)throw Error('Sessão inválida.');const {data:p,error}=await supabase.from('perfis').select('plano_tipo').eq('user_id',userId).maybeSingle();if(error||!permiteAlbuns(p?.plano_tipo))throw Error('Plano pago necessário.');await guardarSmartImport(userId,shorts,[],null);await publicarSmartImportPendente(userId);setShorts([]);setMensagem('Seleção de Shorts processada. Confira a seção YouTube Shorts.')}catch(e){setMensagem(e instanceof Error?e.message:'Falha ao importar Shorts.')}finally{setSalvando(false)}
  }
  const limite = Math.min(4, obterLimiteVideos(plano))
  return <div style={{display:'flex',minHeight:'100vh',background:'#0B0A10',color:'#FFFFFF',fontFamily:'system-ui'}}>
    <PainelSidebar tituloMobile="Importar YouTube" />
    <main className="psb-main" style={{padding:'28px 18px 80px',width:'100%',maxWidth:'100%',overflowX:'hidden'}}>
      <div style={{maxWidth:850,margin:'0 auto'}}>
        <Link href="/painel/perfil/videos" style={{color:'#C5BCD1',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:7,marginBottom:20}}><ArrowLeft size={16}/> Voltar aos vídeos</Link>
        <h1 style={{fontSize:24,margin:'0 0 8px',display:'flex',gap:10,alignItems:'center'}}><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="4.5" width="22" height="15" rx="5" fill="#FF0033"/><path d="M10 8.5L16 12L10 15.5V8.5Z" fill="white"/></svg> Importar YouTube</h1>
        <p style={{color:'#C5BCD1',fontSize:13,margin:'0 0 20px'}}>Busque seu canal, escolha os vídeos e adicione-os à seção de vídeos já existente na sua MiniPage.</p>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
          <input aria-label="Canal YouTube" value={canal} onChange={e=>setCanal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void buscar()}} placeholder="@seucanal ou link do canal" style={{flex:'1 1 230px',minWidth:0,padding:12,borderRadius:10,border:'1px solid #40344B',background:'#21182D',color:'#FFFFFF',fontSize:14}}/>
          <button disabled={consulta} type="button" onClick={()=>void buscar()} style={{...botao,opacity:consulta ? 0.6 : 1,display:'flex',alignItems:'center',gap:7}}><Search size={15}/>{consulta?'Buscando…':'Buscar vídeos'}</button>
        </div>
        {mensagem&&<p role="status" style={{color:'#D7CDE1',fontSize:13,marginBottom:15}}>{mensagem}</p>}
        {!!resultados.length && <>
          <p style={{fontSize:13,color:'#C5BCD1',marginBottom:12}}>Selecione até {limite === 4 ? '4' : limite} vídeo(s) nesta importação. Os vídeos existentes não serão removidos.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:12}}>
            {resultados.map(v=><div key={v.videoId} style={{minWidth:0}}><button type="button" disabled={shorts.some(x=>x.videoId===v.videoId)} onClick={()=>setSelecionados(prev=>prev.includes(v.videoId)?prev.filter(id=>id!==v.videoId):prev.length<limite?[...prev,v.videoId]:prev)} aria-pressed={selecionados.includes(v.videoId)} style={{width:'100%',textAlign:'left',padding:0,background:'#21182D',color:'#fff',border:selecionados.includes(v.videoId)?'2px solid #C9FA45':'1px solid #40344B',borderRadius:12,overflow:'hidden',cursor:'pointer'}}>
              <div style={{position:'relative',aspectRatio:'16 / 9',background:'#100A16'}}><img src={v.miniatura} alt="" loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/><span style={{position:'absolute',top:8,right:8,background:selecionados.includes(v.videoId)?'#C9FA45':'rgba(0,0,0,.72)',color:selecionados.includes(v.videoId)?'#0B0A10':'#FFFFFF',borderRadius:7,padding:'4px 7px',fontSize:12,fontWeight:800}}>{selecionados.includes(v.videoId)?'✓ Selecionado':'Selecionar'}</span></div>
              <p style={{fontSize:13,fontWeight:700,lineHeight:1.4,padding:'10px 12px',minHeight:57}}>{v.titulo}</p>
            </button></div>)}
          </div>
          <button type="button" disabled={!selecionados.length||salvando} onClick={()=>void salvar()} style={{...botao,opacity:(!selecionados.length || salvando) ? 0.55 : 1,marginTop:20}}>{salvando?'Importando…':`Adicionar ${selecionados.length} vídeo(s) à minha MiniPage`}</button>
        </>}
        {permiteAlbuns(plano)&&<><SmartShortsImport idioma={idioma} items={shorts} onChange={setShorts} blockedIds={selecionados} disabled={salvando}/>{shorts.length>0&&<button type="button" disabled={salvando} onClick={()=>void salvarShorts()} style={botao}>{salvando?'…':`${shorts.length} Shorts → MiniPage`}</button>}</>}
      </div>
    </main>
  </div>
}
