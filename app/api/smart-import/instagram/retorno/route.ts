import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { abrir, selar, cookieAttrs, COOKIE_STATE, COOKIE_TOKEN, type EstadoInstagram } from '../../../../lib/instagram-smart-auth'

export const runtime = 'nodejs'
const GRAPH_VERSION = 'v25.0'
function redirect(req:NextRequest, status:string) {
  // Evita redirecionar para localhost quando o Next.js esta atras de tunel HTTPS.
  // O dominio de retorno e fixado pela configuracao do servidor, nao por cabecalhos arbitrarios.
  let origin = req.nextUrl.origin
  try {
    const configured = new URL(process.env.INSTAGRAM_REDIRECT_URI || '')
    if (configured.protocol === 'https:' && configured.pathname === '/api/smart-import/instagram/retorno' && !configured.search && !configured.hash) {
      origin = configured.origin
    }
  } catch { /* Usa o origin do Next caso a configuracao esteja ausente. */ }
  const url = new URL('/painel/criar-minipage', origin)
  url.searchParams.set('instagram',status)
  return NextResponse.redirect(url,{headers:{'Cache-Control':'no-store'}})
}
async function requestGraph(path: string, token: string) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`)
  url.searchParams.set('fields','id,username')
  url.searchParams.set('limit','100')
  const controller = new AbortController()
  const timer = setTimeout(()=>controller.abort(),10000)
  try {
    const response = await fetch(url, {headers:{Authorization:`Bearer ${token}`},signal:controller.signal,cache:'no-store'})
    if (!response.ok) throw new Error('Meta Graph indisponível ou permissões insuficientes')
    return await response.json() as {data?:Array<{id?:string;username?:string}>;paging?:{cursors?:{after?:string}}}
  } finally {clearTimeout(timer)}
}
export async function GET(req: NextRequest) {
  const auth = abrir<EstadoInstagram>(req.cookies.get(COOKIE_STATE)?.value)
  const state = req.nextUrl.searchParams.get('state') || ''
  const code = req.nextUrl.searchParams.get('code') || ''
  const valid = auth && typeof auth.uid === 'string' && typeof auth.state === 'string' &&
    typeof auth.created === 'number' && auth.created <= Date.now() && Date.now()-auth.created < 10*60*1000 &&
    state.length === auth.state.length && timingSafeEqual(Buffer.from(state),Buffer.from(auth.state))
  // Consumir o estado em qualquer resposta, inclusive recusa/erro.
  if (!valid || !code || code.length>3000) {const res=redirect(req,'falha');res.cookies.delete(COOKIE_STATE);return res}
  const appId = process.env.INSTAGRAM_APP_ID
  const secret = process.env.INSTAGRAM_APP_SECRET
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI
  if (!appId || !secret || !redirectUri) {const res=redirect(req,'configuracao');res.cookies.delete(COOKIE_STATE);return res}
  try {
    const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`)
    url.searchParams.set('client_id',appId)
    url.searchParams.set('client_secret',secret)
    url.searchParams.set('redirect_uri',redirectUri)
    url.searchParams.set('code',code.replace(/#_$/,''))
    const controller = new AbortController()
    const timeout = setTimeout(()=>controller.abort(),10000)
    let api: Response
    try {api = await fetch(url,{signal:controller.signal,cache:'no-store'})} finally {clearTimeout(timeout)}
    if (!api.ok) throw new Error('Falha na troca de código')
    const data = await api.json() as {access_token?:string}
    if (!data.access_token || data.access_token.length > 2500) throw new Error('Token ausente')
    // O token Unificado representa um USUÁRIO DO SISTEMA, não o perfil do Instagram.
    // Não conectar automaticamente uma conta se a Meta compartilhar várias.
    const accounts=new Map<string,{id:string;username:string}>()
    const cursors=new Set<string>()
    let cursor: string | undefined
    let complete=false
    for(let page=0;page<10;page++) {
      const path = 'me/assigned_instagram_accounts'+(cursor?'?after='+encodeURIComponent(cursor):'')
      const result=await requestGraph(path,data.access_token)
      if (!Array.isArray(result.data)) throw new Error('Lista de contas inválida')
      for(const item of result.data) if(typeof item.id==='string' && /^\d+$/.test(item.id)) accounts.set(item.id,{id:item.id,username:String(item.username||'')})
      const next=result.paging?.cursors?.after
      if (!result.data.length || !next || next===cursor) {complete=true;break}
      if (cursors.has(next)) throw new Error('Cursor repetido')
      cursors.add(next);cursor=next
    }
    if (!complete) throw new Error('Paginação incompleta')
    if (accounts.size!==1) {
      const res=redirect(req,accounts.size===0?'sem_conta':'varias_contas')
      res.cookies.delete(COOKIE_STATE)
      return res
    }
    const account=Array.from(accounts.values())[0]
    const res=redirect(req,'conectado')
    res.cookies.set(COOKIE_TOKEN,selar({uid:auth.uid,token:data.access_token,instagramId:account.id,username:account.username,created:Date.now()}),cookieAttrs)
    res.cookies.delete(COOKIE_STATE)
    return res
  } catch {const res=redirect(req,'falha');res.cookies.delete(COOKIE_STATE);return res}
}
