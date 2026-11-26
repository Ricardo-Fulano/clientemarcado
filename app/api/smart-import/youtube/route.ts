import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { shortIdOficial, youtubeFormato } from '../../../lib/smart-import-vertical'

export const runtime = 'nodejs'

type Canal = { id?: string; snippet?: { title?: string }; contentDetails?: { relatedPlaylists?: { uploads?: string } }; statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean } }
type PlaylistVideo = { snippet?: { title?: string; resourceId?: { videoId?: string }; thumbnails?: { medium?: {url?: string}; high?: {url?: string} } }; contentDetails?: {videoId?: string} }
const resposta = (body: unknown, status: number) => NextResponse.json(body, {status,headers:{'Cache-Control':'no-store'}})

function extrairCanal(valor: string): {forHandle?: string; id?: string} | null {
  const texto = valor.trim()
  if (texto.length > 200) return null
  if (/^@[a-zA-Z0-9._-]{3,30}$/.test(texto)) return {forHandle:texto}
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(texto)) return {id:texto}
  try {
    const u = new URL(texto)
    const host = u.hostname.toLowerCase().replace(/^www\./,'')
    if (!['youtube.com','m.youtube.com'].includes(host)) return null
    const p = u.pathname.split('/').filter(Boolean)
    if (p.length === 1 && /^@[a-zA-Z0-9._-]{3,30}$/.test(p[0])) return {forHandle:p[0]}
    if (p.length === 2 && p[0] === 'channel' && /^UC[a-zA-Z0-9_-]{22}$/.test(p[1])) return {id:p[1]}
  } catch { return null }
  return null
}

async function youtubeApi(endpoint: string, query: Record<string,string>, key: string) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`)
  Object.entries(query).forEach(([name,value]) => url.searchParams.set(name,value))
  url.searchParams.set('key',key)
  const controller = new AbortController()
  const timer = setTimeout(()=>controller.abort(),7000)
  try {
    const resp = await fetch(url.toString(), {signal:controller.signal,cache:'no-store'})
    if (!resp.ok) throw new Error('YOUTUBE_UNAVAILABLE')
    return await resp.json()
  } finally {clearTimeout(timer)}
}

export async function GET(req: NextRequest) {
  const valor = req.nextUrl.searchParams.get('canal') || ''
  const short = req.nextUrl.searchParams.get('short')
  const shortId = short === null ? null : shortIdOficial(short)
  if (short !== null && !shortId) return resposta({error:'INVALID_SHORT_URL'},400)
  const canal = extrairCanal(valor)
  if (!canal && !shortId) return resposta({error:'Informe @canal ou a URL oficial do canal YouTube.'},400)
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i,'').trim()
  if (!token) return resposta({error:'Faça login para importar conteúdos.'},401)
  const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!urlSupabase || !anonKey) return resposta({error:'Autenticação indisponível.'},503)
  const supabase = createClient(urlSupabase,anonKey)
  const {data:{user},error} = await supabase.auth.getUser(token)
  if (error || !user) return resposta({error:'Sessão inválida.'},401)
  const apiKey = process.env.YOUTUBE_DATA_API_KEY
  if (!apiKey) return resposta({error:'Importação do YouTube ainda não configurada. Configure YOUTUBE_DATA_API_KEY no servidor.'},503)
  try {
    if(shortId){
      const dados=await youtubeApi('videos',{part:'snippet,status',id:shortId},apiKey)
      const v=dados.items?.[0]
      if(v?.id!==shortId||v.status?.privacyStatus!=='public'||v.status?.embeddable!==true||typeof v.snippet?.title!=='string')return resposta({error:'SHORT_UNAVAILABLE'},404)
      return resposta({video:{videoId:shortId,titulo:v.snippet.title.slice(0,160),miniatura:`https://i.ytimg.com/vi/${shortId}/hqdefault.jpg`,url:youtubeFormato(shortId,true)}},200)
    }
    const canais = await youtubeApi('channels',{part:'snippet,contentDetails,statistics',...canal},apiKey)
    const encontrado: Canal | undefined = canais.items?.[0]
    const playlist = encontrado?.contentDetails?.relatedPlaylists?.uploads
    if (!playlist) return resposta({error:'Canal não encontrado ou sem vídeos públicos.'},404)
    const lista = await youtubeApi('playlistItems',{part:'snippet,contentDetails',playlistId:playlist,maxResults:'8'},apiKey)
    const videos = (Array.isArray(lista.items)?lista.items:[]).map((v: PlaylistVideo)=>{
      const id = v.contentDetails?.videoId || v.snippet?.resourceId?.videoId || ''
      const titulo = v.snippet?.title || ''
      if (!/^[a-zA-Z0-9_-]{11}$/.test(id) || !titulo || /^(Private|Deleted) video$/i.test(titulo)) return null
      return {videoId:id,titulo:titulo.slice(0,160),miniatura:v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.high?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,url:`https://www.youtube.com/watch?v=${id}`}
    }).filter(Boolean).slice(0,8)
    // O YouTube retorna um numero publico arredondado a tres algarismos significativos.
    // Se o canal ocultar inscritos, nunca mostramos uma contagem presumida.
    const estatistica = encontrado?.statistics
    const inscritosBrutos = estatistica?.subscriberCount
    const numero = typeof inscritosBrutos === 'string' && /^\d+$/.test(inscritosBrutos) ? Number(inscritosBrutos) : NaN
    const inscritosYoutube = estatistica?.hiddenSubscriberCount === true || !Number.isSafeInteger(numero) || numero < 0 ? null : numero
    return resposta({canal:encontrado?.snippet?.title || '',inscritosYoutube,videos},200)
  } catch {
    return resposta({error:'A consulta ao YouTube falhou. Verifique a chave da API, a quota e o canal informado.'},502)
  }
}
