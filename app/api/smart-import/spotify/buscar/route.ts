import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const TIPOS = ['track', 'album', 'artist', 'playlist', 'show', 'episode'] as const
type Tipo = typeof TIPOS[number]
type SpotifyItem = {
  id?: string
  name?: string
  type?: string
  external_urls?: { spotify?: string }
  images?: {url?: string}[]
  album?: {images?: {url?: string}[]}
  artists?: {name?: string}[]
  publisher?: string
  owner?: {display_name?: string}
  show?: {name?: string}
}

const responder = (data: unknown, status: number) => NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}})
const limitar = new Map<string, { count: number; expires: number }>()
let spotifyToken: { value: string; expires: number } | null = null

function autorizarLimite(userId: string): boolean {
  // Limite de conveniencia por instancia; nao substitui rate limiting centralizado
  const agora = Date.now()
  if (limitar.size > 1000) {
    for (const [chave,registro] of limitar) if (registro.expires < agora) limitar.delete(chave)
  }
  const anterior = limitar.get(userId)
  if (!anterior || anterior.expires <= agora) { limitar.set(userId,{count:1,expires:agora+60_000}); return true }
  if (anterior.count >= 8) return false
  anterior.count++
  return true
}

async function pegarTokenSpotify(id: string, secret: string): Promise<string> {
  if (spotifyToken && spotifyToken.expires > Date.now()) return spotifyToken.value
  const controller = new AbortController()
  const timer = setTimeout(()=>controller.abort(),7_000)
  try {
    const resposta = await fetch('https://accounts.spotify.com/api/token',{
      method:'POST',
      headers:{Authorization:'Basic '+Buffer.from(id+':'+secret).toString('base64'), 'Content-Type':'application/x-www-form-urlencoded'},
      body:'grant_type=client_credentials',signal:controller.signal,cache:'no-store',
    })
    if (!resposta.ok) throw new Error('SPOTIFY_TOKEN_UNAVAILABLE')
    const dados = await resposta.json() as {access_token?: string; expires_in?: number}
    if (typeof dados.access_token !== 'string') throw new Error('SPOTIFY_TOKEN_INVALID')
    spotifyToken={value:dados.access_token, expires:Date.now()+Math.max(30,(Number(dados.expires_in)||300)-90)*1000}
    return spotifyToken.value
  } finally { clearTimeout(timer) }
}

function normalizarResultados(tipo: Tipo, resposta: unknown) {
  if (!resposta || typeof resposta !== 'object') return []
  const dados = resposta as Record<string,unknown>
  const chave: Record<Tipo,string> = {track:'tracks',album:'albums',artist:'artists',playlist:'playlists',show:'shows',episode:'episodes'}
  const colecao = dados[chave[tipo]]
  const resultados = colecao && typeof colecao === 'object' ? (colecao as {items?: unknown[]}).items : null
  if (!Array.isArray(resultados)) return []
  return resultados.flatMap((bruto): {tipo:Tipo; titulo:string; subtitulo:string; url:string; imagem:string|null}[] => {
    if (!bruto || typeof bruto !== 'object') return []
    const item=bruto as SpotifyItem
    if (typeof item.id !== 'string' || !/^[a-zA-Z0-9]{22}$/.test(item.id) || !item.name) return []
    // URL canonica, sem aceitar hosts recebidos de terceiros
    const url=`https://open.spotify.com/${tipo}/${item.id}`
    const imagemBruta=item.images?.[0]?.url || item.album?.images?.[0]?.url
    let imagem: string | null = null
    if (typeof imagemBruta === 'string') {
      try { const u=new URL(imagemBruta); if (u.protocol==='https:' && (u.hostname==='i.scdn.co' || u.hostname.endsWith('.scdn.co'))) imagem=u.toString() } catch { /* descartar */ }
    }
    const subtitulo=tipo==='track' || tipo==='album' ? item.artists?.map(a=>a.name).filter(Boolean).join(', ') :
      tipo==='show' ? item.publisher : tipo==='episode' ? item.show?.name : tipo==='playlist' ? item.owner?.display_name : ''
    return [{tipo,titulo:item.name.slice(0,150),subtitulo:(subtitulo||'').slice(0,140),url,imagem}]
  }).slice(0,8)
}

export async function GET(req: NextRequest) {
  const texto=(req.nextUrl.searchParams.get('q') || '').trim().replace(/^@/,'')
  const tipoBruto=req.nextUrl.searchParams.get('tipo') || 'track'
  if (texto.length < 2 || texto.length > 80 || /[\u0000-\u001f]/.test(texto)) return responder({error:'Informe um nome de 2 a 80 caracteres.'},400)
  if (!TIPOS.includes(tipoBruto as Tipo)) return responder({error:'Categoria de busca invalida.'},400)
  const tipo=tipoBruto as Tipo
  const mercadoBruto=req.nextUrl.searchParams.get('mercado') || 'BR'
  const mercado=/^[A-Za-z]{2}$/.test(mercadoBruto) ? mercadoBruto.toUpperCase() : 'BR'
  const accessToken=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim()
  if (!accessToken) return responder({error:'Entre na sua conta para pesquisar no Spotify.'},401)
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return responder({error:'Autenticacao indisponivel.'},503)
  const supabase=createClient(supabaseUrl,supabaseAnonKey)
  const {data:{user},error}=await supabase.auth.getUser(accessToken)
  if (error || !user) return responder({error:'Sua sessao expirou. Entre novamente.'},401)
  const clientId=process.env.SPOTIFY_CLIENT_ID
  const clientSecret=process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) return responder({error:'A busca no Spotify ainda nao foi ativada pelo administrador. Continue utilizando o link do Spotify.',code:'SPOTIFY_NAO_CONFIGURADO'},503)
  if (!autorizarLimite(user.id)) return responder({error:'Muitas buscas em pouco tempo. Tente novamente em um minuto.'},429)
  try {
    let token=await pegarTokenSpotify(clientId,clientSecret)
    const params=new URLSearchParams({q:texto,type:tipo,limit:'8',market:mercado})
    const buscar=(access:string,signal:AbortSignal)=>fetch('https://api.spotify.com/v1/search?'+params.toString(),{headers:{Authorization:'Bearer '+access},signal,cache:'no-store'})
    const controller=new AbortController()
    const timer=setTimeout(()=>controller.abort(),8_000)
    try {
      let resultado=await buscar(token,controller.signal)
      if (resultado.status===401) {spotifyToken=null;token=await pegarTokenSpotify(clientId,clientSecret);resultado=await buscar(token,controller.signal)}
      if (resultado.status===429) return responder({error:'O Spotify limitou temporariamente as consultas. Tente novamente mais tarde.'},429)
      if (resultado.status===403) return responder({error:'O aplicativo Spotify nao tem acesso autorizado a essa busca. Continue pelo link.',code:'SPOTIFY_SEM_ACESSO'},503)
      if (!resultado.ok) return responder({error:'Nao foi possivel pesquisar no Spotify agora. Voce pode colar um link.'},502)
      const dados=await resultado.json() as unknown
      return responder({resultados:normalizarResultados(tipo,dados)},200)
    } finally {clearTimeout(timer)}
  } catch {
    return responder({error:'O Spotify nao respondeu. Cole o link do conteudo para continuar.'},502)
  }
}
