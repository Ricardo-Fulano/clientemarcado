import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { abrir, COOKIE_TOKEN, type SessaoInstagram } from '../../../../lib/instagram-smart-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const responder = (data: unknown, status: number) => NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store, max-age=0'}})

type StoryMeta = {id?: unknown; media_type?: unknown; media_url?: unknown; thumbnail_url?: unknown; timestamp?: unknown}

// Consulta SOMENTE do titular autenticado, durante a sessão OAuth temporária do onboarding.
// Não existe cache público, gravação no banco, publicação na slug nem exposição de token.
export async function GET(req: NextRequest) {
  const tokenAuth=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'')
  const supaUrl=process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!tokenAuth || !supaUrl || !anonKey) return responder({error:'Entre novamente na MiniPage Pro.'},401)
  const {data:{user},error}=await createClient(supaUrl,anonKey).auth.getUser(tokenAuth)
  const sessao=abrir<SessaoInstagram>(req.cookies.get(COOKIE_TOKEN)?.value)
  const agora=Date.now()
  if (error || !user || !sessao || sessao.uid!==user.id || sessao.created>agora || agora-sessao.created>30*60*1000 || !/^\d+$/.test(sessao.instagramId || ''))
    return responder({error:'A conexão Instagram expirou. Conecte novamente para consultar seus Stories.'},401)
  try {
    const url=new URL(`https://graph.facebook.com/v25.0/${sessao.instagramId}/stories`)
    url.searchParams.set('fields','id,media_type,media_url,thumbnail_url,timestamp')
    url.searchParams.set('limit','12')
    const controller=new AbortController()
    const timer=setTimeout(()=>controller.abort(),9000)
    let resp: Response
    try { resp=await fetch(url,{headers:{Authorization:`Bearer ${sessao.token}`},signal:controller.signal,cache:'no-store'}) }
    finally { clearTimeout(timer) }
    if (!resp.ok) return responder({error:'A Meta não autorizou a leitura dos Stories desta conta ou a consulta está indisponível.'},502)
    const payload=await resp.json() as {data?: StoryMeta[]}
    const lista=Array.isArray(payload?.data)?payload.data:[]
    const stories=lista.filter(m=>typeof m.id==='string' && /^\d+$/.test(m.id))
      .filter(m=>{
        if (typeof m.timestamp!=='string') return false
        const tempo=Date.parse(m.timestamp)
        return Number.isFinite(tempo) && tempo<=agora && agora-tempo<24*60*60*1000
      }).slice(0,12).map(m=>({
        id:m.id as string,
        tipo:String(m.media_type||'IMAGE'),
        imagem:typeof m.thumbnail_url==='string'?m.thumbnail_url:typeof m.media_url==='string'?m.media_url:'',
        url:typeof m.media_url==='string'?m.media_url:'',
        timestamp:m.timestamp as string,
      })).filter(m=>/^https:\/\//i.test(m.imagem)||/^https:\/\//i.test(m.url))
    return responder({stories},200)
  } catch { return responder({error:'Falha temporária na consulta à API oficial de Stories.'},502) }
}
