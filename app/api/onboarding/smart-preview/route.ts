import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
const json = (body: object, status = 200) => NextResponse.json(body, {status, headers: {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})

// Never fetch a user-supplied host. Only the fixed public oEmbed endpoints below.
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url') || ''
  if (raw.length > 2048) return json({ok:false,error:'URL_INVALIDA'},400)
  let url: URL
  try { url = new URL(raw) } catch {return json({ok:false,error:'URL_INVALIDA'},400)}
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return json({ok:false,error:'URL_INVALIDA'},400)
  const host=url.hostname.toLowerCase()
  let provider: 'spotify' | 'youtube'
  let source: string
  let endpoint: string
  const spotifyPath = host === 'open.spotify.com' ? url.pathname.replace(/^\/intl-[a-z]{2}(?:-[a-z]{2})?(?=\/)/i, '') : url.pathname
  if (host === 'open.spotify.com' && /^\/(track|album|playlist|artist|episode|show)\/[a-zA-Z0-9]{15,30}\/?$/.test(spotifyPath)) {
    provider='spotify'
    source=url.origin+spotifyPath
    endpoint='https://open.spotify.com/oembed?url='+encodeURIComponent(source)
  } else if ((host === 'youtube.com' || host === 'www.youtube.com') && (/^\/(watch|shorts|embed)\/?/.test(url.pathname))) {
    let id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.split('/')[2]
    if(!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return json({ok:false,error:'URL_NAO_SUPORTADA'},400)
    provider='youtube';source='https://www.youtube.com/watch?v='+id
    endpoint='https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(source)
  } else if(host === 'youtu.be' && /^\/[a-zA-Z0-9_-]{11}\/?$/.test(url.pathname)) {
    provider='youtube';source='https://www.youtube.com/watch?v='+url.pathname.split('/')[1]
    endpoint='https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(source)
  } else return json({ok:false,error:'PLATAFORMA_NAO_SUPORTADA'},400)

  const controller=new AbortController()
  const timeout=setTimeout(()=>controller.abort(),4000)
  try {
    const response=await fetch(endpoint,{redirect:'error',signal:controller.signal,headers:{Accept:'application/json'},cache:'no-store'})
    if(!response.ok) return json({ok:false,error:'MIDIA_INDISPONIVEL'},422)
    const contentType=response.headers.get('content-type')||''
    const contentLength=Number(response.headers.get('content-length')||0)
    if(!contentType.includes('json') || contentLength>100_000) return json({ok:false,error:'RESPOSTA_INVALIDA'},422)
    const payload: unknown = await response.json()
    if(!payload || typeof payload !== 'object') return json({ok:false,error:'RESPOSTA_INVALIDA'},422)
    const data=payload as Record<string,unknown>
    const title=typeof data.title==='string'?data.title.slice(0,180):''
    if(!title) return json({ok:false,error:'MIDIA_SEM_TITULO'},422)
    const thumb=typeof data.thumbnail_url==='string' ? data.thumbnail_url : ''
    // Thumbnail is displayed from the provider CDN; never embedded as HTML.
    const thumbnail=thumb.startsWith('https://') ? thumb : null
    return json({ok:true,media:{provider,title,url:source,author:typeof data.author_name==='string'?data.author_name.slice(0,120):null,thumbnail}})
  } catch {return json({ok:false,error:'CONSULTA_FALHOU'},502)} finally {clearTimeout(timeout)}
}
