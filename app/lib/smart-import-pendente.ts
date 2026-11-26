import { supabase } from './supabase'
import { permiteAlbuns } from './planos'
import { reelUrl, formatoYoutube, youtubeFormato } from './smart-import-vertical'

const BUCKET = 'mp-smart-import-private'
const TITULO_VIDEO = 'Vídeos do YouTube'
const TITULO_ALBUM = 'Importadas do Instagram'
const MIME: Record<string,string> = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}
export type VideoImportado = {videoId:string;titulo:string;miniatura:string;url:string}
export type FotoImportada = {id:string;legenda:string;downloadTicket?:string}
type FotoPendente = {id:string;legenda:string;path:string;ext:string}
export type ReelImportado = {id:string;link:string;legenda:string;downloadTicket?:string}
type ReelPendente = {id:string;link:string;legenda:string;path?:string;ext?:string}
type Rascunho = {version:1;videos:VideoImportado[];fotos:FotoPendente[];capa:string|null;reels?:ReelPendente[]}
const idValido = (id:string) => /^[a-zA-Z0-9_-]{11}$/.test(id)
export function youtubeId(url:unknown):string|null {
  try { const u=new URL(String(url)); if(u.protocol!=='https:'&&u.protocol!=='http:')return null; const h=u.hostname.toLowerCase(); const id=h==='youtu.be'?u.pathname.slice(1):['youtube.com','www.youtube.com','m.youtube.com'].includes(h)?(u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:shorts|embed)\/([^/]+)$/)?.[1]):null;return id&&idValido(id)?id:null } catch {return null}
}
function check(e:unknown){if(e)throw e}
async function uidAtual(uid:string){const {data:{user},error}=await supabase.auth.getUser();check(error);if(user?.id!==uid)throw new Error('SESSION_CHANGED')}
// IDs determinísticos para reexecuções concorrentes, sem tocar em registros de outras contas.
async function idEstavel(uid:string,key:string){const b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(uid+'|smart-import-v12|'+key)));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b.slice(0,16),x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`}
export async function guardarSmartImport(uid:string,videos:VideoImportado[],fotos:FotoImportada[],capa:string|null,reels:ReelImportado[]=[]){
  await uidAtual(uid)
  if(videos.length>8||videos.filter(v=>formatoYoutube(v.url)==='16:9').length>4||videos.filter(v=>formatoYoutube(v.url)==='9:16').length>4||new Set(videos.map(v=>v.videoId)).size!==videos.length||fotos.length>25||reels.length>12)throw new Error('MEDIA_LIMIT')
  const selecionados=videos.map(v=>{if(!idValido(v.videoId)||youtubeId(v.url)!==v.videoId)throw new Error('INVALID_VIDEO');return {videoId:v.videoId,titulo:v.titulo.slice(0,160),miniatura:`https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,url:youtubeFormato(v.videoId,formatoYoutube(v.url)==='9:16')}})
  if(!selecionados.length&&!fotos.length&&!reels.length)return false
  const batch=crypto.randomUUID(), storage=supabase.storage.from(BUCKET), enviados:string[]=[]
  const {data:{session}}=await supabase.auth.getSession();if(!session?.access_token||session.user.id!==uid)throw new Error('SESSION_CHANGED')
  const r:Rascunho={version:1,videos:selecionados,fotos:[],capa:null}
  let manifestoIniciado=false
  try {
    for(const foto of fotos){
      if(!/^\d{1,30}$/.test(foto.id))throw new Error('INVALID_MEDIA')
      const res=await fetch(foto.downloadTicket?'/api/smart-import/instagram/discovery':`/api/smart-import/instagram/midia?midiaId=${encodeURIComponent(foto.id)}`,{...(foto.downloadTicket?{method:'PUT',body:JSON.stringify({ticket:foto.downloadTicket})}:{}),headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},cache:'no-store'})
      if(!res.ok)throw new Error('PHOTO_DOWNLOAD')
      const blob=await res.blob(),ext=MIME[blob.type];if(!ext||!blob.size||blob.size>8*1024*1024)throw new Error('PHOTO_INVALID')
      const path=`${uid}/${batch}/${foto.id}.${ext}`
      const {error}=await storage.upload(path,blob,{contentType:blob.type,upsert:false});check(error);enviados.push(path)
      r.fotos.push({id:foto.id,legenda:foto.legenda.slice(0,500),path,ext})
    }
    r.capa=r.fotos.some(f=>f.id===capa)?capa:null
    r.reels=[]
    for(const reel of reels){
      const link=reelUrl(reel.link);if(!link||!/^\d{1,40}$/.test(reel.id))throw Error('INVALID_REEL')
      const item:ReelPendente={id:reel.id,link,legenda:String(reel.legenda||'').slice(0,160)}
      if(reel.downloadTicket){
        const res=await fetch('/api/smart-import/instagram/discovery',{method:'PUT',body:JSON.stringify({ticket:reel.downloadTicket}),headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},cache:'no-store'})
        if(!res.ok)throw Error('REEL_THUMB_DOWNLOAD')
        const blob=await res.blob(),ext=MIME[blob.type];if(!ext||!blob.size||blob.size>8*1024*1024)throw Error('REEL_THUMB_INVALID')
        const path=`${uid}/${batch}/reel-${reel.id}.${ext}`
        const {error}=await storage.upload(path,blob,{contentType:blob.type,upsert:false});check(error);enviados.push(path);item.path=path;item.ext=ext
      }
      r.reels.push(item)
    }
    await uidAtual(uid)
    manifestoIniciado=true
    const {error}=await storage.upload(`${uid}/${batch}.json`,new Blob([JSON.stringify(r)],{type:'application/json'}),{contentType:'application/json',upsert:false});check(error)
    return true
  } catch(e){if(!manifestoIniciado&&enviados.length)await storage.remove(enviados);throw e}
}
async function secao(uid:string,tabela:'pagina_videos_secoes'|'pagina_albuns',titulo:string){
  const {data,error}=await supabase.from(tabela).select('id,titulo,ativo,ordem').eq('user_id',uid).order('ordem');check(error)
  const existente=(data||[]).find(x=>x.ativo&&x.titulo===titulo);if(existente)return String(existente.id)
  const id=await idEstavel(uid,tabela+'|'+titulo)
  const ordem=Math.max(-1,...(data||[]).map(x=>Number(x.ordem)||0))+1
  const {error:erro}=await supabase.from(tabela).insert({id,user_id:uid,titulo,subtitulo:null,ativo:true,ordem,...(tabela==='pagina_albuns'?{proporcao:'1:1'}:{})})
  if(erro){const {data:atual,error:e}=await supabase.from(tabela).select('id,ativo').eq('id',id).eq('user_id',uid).maybeSingle();check(e);if(!atual?.ativo)throw erro}
  return id
}
export async function organizarVideosSemSecao(uid:string){
  await uidAtual(uid)
  const {data,error}=await supabase.from('pagina_videos').select('id').eq('user_id',uid).is('secao_id',null);check(error)
  if(!data?.length)return 0
  const id=await secao(uid,'pagina_videos_secoes',TITULO_VIDEO)
  const {error:e}=await supabase.from('pagina_videos').update({secao_id:id}).eq('user_id',uid).is('secao_id',null).in('id',data.map(v=>v.id));check(e)
  return data.length
}
async function aplicarRascunho(uid:string,r:Rascunho,batch:string){
  if(r.version!==1||!Array.isArray(r.videos)||!Array.isArray(r.fotos)||r.videos.length>8||r.videos.filter(v=>formatoYoutube(v.url)==='16:9').length>4||r.videos.filter(v=>formatoYoutube(v.url)==='9:16').length>4||r.fotos.length>25||(r.reels!==undefined&&(!Array.isArray(r.reels)||r.reels.length>12)))throw new Error('INVALID_DRAFT')
  await uidAtual(uid)
  const {data:p,error:ep}=await supabase.from('perfis').select('*').eq('user_id',uid).single();check(ep)
  const {data:pub,error:epub}=await supabase.from('perfis_publicos').select('plano_tipo').eq('user_id',uid).maybeSingle();check(epub)
  if(!permiteAlbuns(p?.plano_tipo)||!permiteAlbuns(pub?.plano_tipo)||['bloqueado','cancelado','aguardando_pagamento','em_atraso'].includes(String(p?.status_acesso||'')))return false
  const {data:vv,error:ev}=await supabase.from('pagina_videos').select('id,url_video,secao_id,ordem,ativo').eq('user_id',uid);check(ev)
  let ordemV=Math.max(-1,...(vv||[]).map(v=>Number(v.ordem)||0))+1
  for(const v of r.videos){
    if(!idValido(v.videoId)||youtubeId(v.url)!==v.videoId)throw new Error('INVALID_VIDEO')
    const formato=formatoYoutube(v.url);const tituloSecao=formato==='9:16'?'YouTube Shorts':TITULO_VIDEO
    const existente=(vv||[]).find(x=>youtubeId(x.url_video)===v.videoId)
    if(existente){if(existente.secao_id||!existente.ativo)continue;const vs=await secao(uid,'pagina_videos_secoes',formatoYoutube(existente.url_video||'')==='9:16'?'YouTube Shorts':TITULO_VIDEO);const {error}=await supabase.from('pagina_videos').update({secao_id:vs}).eq('user_id',uid).eq('id',existente.id).is('secao_id',null);check(error);continue}
    const vs=await secao(uid,'pagina_videos_secoes',tituloSecao)
    const id=await idEstavel(uid,'video|'+v.videoId)
    const {error}=await supabase.from('pagina_videos').insert({id,user_id:uid,secao_id:vs,titulo:String(v.titulo||'YouTube').slice(0,160),url_video:youtubeFormato(v.videoId,formato==='9:16'),thumbnail_url:`https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,plataforma:'youtube',formato,ativo:true,ordem:ordemV++})
    if(error){const {data,error:e}=await supabase.from('pagina_videos').select('id').eq('id',id).eq('user_id',uid).maybeSingle();check(e);if(!data)throw error}
  }
  for(const reel of r.reels||[]){
    const url=reelUrl(reel.link);if(!url||!/^\d{1,40}$/.test(reel.id))throw Error('INVALID_REEL')
    if((vv||[]).some(x=>reelUrl(x.url_video)===url))continue
    let thumb:string|null=null
    if(reel.path||reel.ext){
      if(!reel.ext||!['jpg','png','webp'].includes(reel.ext)||reel.path!==`${uid}/${batch}/reel-${reel.id}.${reel.ext}`)throw Error('INVALID_REEL_THUMB')
      const {data:b,error}=await supabase.storage.from(BUCKET).download(reel.path);check(error);if(!b||MIME[b.type]!==reel.ext||!b.size||b.size>8*1024*1024)throw Error('INVALID_REEL_THUMB')
      const st=supabase.storage.from('fotos'),path=`videos/${uid}-instagram-${reel.id}.${reel.ext}`
      const {error:up}=await st.upload(path,b,{contentType:b.type,upsert:false,cacheControl:'3600'})
      if(up){const {data:old,error:e}=await st.download(path);if(e||!old||MIME[old.type]!==reel.ext||!old.size)throw up}
      thumb=st.getPublicUrl(path).data.publicUrl
    }
    const vs=await secao(uid,'pagina_videos_secoes','Instagram Reels'),id=await idEstavel(uid,'reel|'+url)
    const {error}=await supabase.from('pagina_videos').insert({id,user_id:uid,secao_id:vs,titulo:String(reel.legenda||'Instagram Reel').slice(0,160),url_video:url,thumbnail_url:thumb,plataforma:'instagram',formato:'9:16',ativo:true,ordem:ordemV++})
    if(error){const {data,error:e}=await supabase.from('pagina_videos').select('id').eq('id',id).eq('user_id',uid).maybeSingle();check(e);if(!data)throw error}
  }
  let album:string|null=null, capaUrl:string|null=null
  if(r.fotos.length){
    const {data:ff,error:ef}=await supabase.from('pagina_album_fotos').select('id,imagem_url,ordem,ativo').eq('user_id',uid);check(ef)
    let ordemF=Math.max(-1,...(ff||[]).map(f=>Number(f.ordem)||0))+1
    for(const f of r.fotos){
      if(!/^\d{1,30}$/.test(f.id)||!['jpg','png','webp'].includes(f.ext)||f.path!==`${uid}/${batch}/${f.id}.${f.ext}`)throw new Error('INVALID_PHOTO')
      const storage=supabase.storage.from('fotos'),path=`album-fotos/${uid}-instagram-${f.id}.${f.ext}`,url=storage.getPublicUrl(path).data.publicUrl
      const anterior=(ff||[]).find(x=>Object.values(MIME).some(ext=>x.imagem_url===storage.getPublicUrl(`album-fotos/${uid}-instagram-${f.id}.${ext}`).data.publicUrl))
      if(!anterior){
        album=album||await secao(uid,'pagina_albuns',TITULO_ALBUM)
        const {data:blob,error}=await supabase.storage.from(BUCKET).download(f.path);check(error);if(!blob||MIME[blob.type]!==f.ext||!blob.size||blob.size>8*1024*1024)throw new Error('INVALID_PHOTO')
        const {error:up}=await storage.upload(path,blob,{contentType:blob.type,upsert:false,cacheControl:'3600'})
        // Um retry após upload e antes do INSERT pode encontrar o mesmo objeto.
        if(up){const {data:ja,error:e}=await storage.download(path);if(e||!ja||MIME[ja.type]!==f.ext||!ja.size)throw up}
        const id=await idEstavel(uid,'foto|'+f.id+'|'+f.ext)
        const {error:e}=await supabase.from('pagina_album_fotos').insert({id,user_id:uid,album_id:album,imagem_url:url,titulo:'Instagram',descricao:String(f.legenda||'').slice(0,500)||null,ativo:true,ordem:ordemF++})
        if(e){const {data,error:ee}=await supabase.from('pagina_album_fotos').select('id').eq('id',id).eq('user_id',uid).maybeSingle();check(ee);if(!data)throw e}
      }
      if(f.id===r.capa&&(!anterior||anterior.ativo))capaUrl=anterior?.imagem_url||url
    }
  }
  // Não sobrescreve capa ou vídeo de capa que já exista. Somente a escolha elegível do onboarding.
  if(capaUrl&&!p.capa_url&&!p.imagem_capa&&!p.banner_url&&!p.banner_video_url&&!p.topo_mobile_url){const q=supabase.from('perfis').update({capa_url:capaUrl}).eq('user_id',uid);const {error}=await (p.capa_url===''?q.eq('capa_url',''):q.is('capa_url',null));check(error)}
  return true
}
async function publicarPendentes(uid:string){
  await uidAtual(uid)
  const storage=supabase.storage.from(BUCKET)
  const {data,error}=await storage.list(uid,{limit:100,sortBy:{column:'created_at',order:'asc'}});check(error)
  let publicados=0
  for(const f of (data||[]).filter(x=>/^[a-f0-9-]{36}\.json$/.test(x.name))){
    const batch=f.name.slice(0,-5),path=`${uid}/${f.name}`
    const {data:blob,error:e}=await storage.download(path);check(e);if(!blob||blob.size>100000)throw new Error('INVALID_DRAFT')
    const r=JSON.parse(await blob.text()) as Rascunho
    if(!await aplicarRascunho(uid,r,batch))throw new Error('PLAN_NOT_EFFECTIVE')
    const {error:del}=await storage.remove([path]);check(del)
    // Manifesto removido só após a publicação; limpeza das cópias privadas é best effort.
    const arquivos=[...r.fotos.map(x=>x.path),...(r.reels||[]).flatMap(x=>x.path?[x.path]:[])]
    if(arquivos.length)await storage.remove(arquivos)
    publicados++
  }
  return publicados
}

// Serialize same-origin tabs when supported; deterministic IDs also prevent duplicate inserts across devices.
export async function publicarSmartImportPendente(uid:string){
  if(typeof navigator!=='undefined'&&navigator.locks) return navigator.locks.request('mp-smart-import-'+uid,()=>publicarPendentes(uid))
  return publicarPendentes(uid)
}
