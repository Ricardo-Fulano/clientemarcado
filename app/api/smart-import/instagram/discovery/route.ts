import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { abrir, selar } from '../../../../lib/instagram-smart-auth'
import { criarLimitadorConcorrencia, lerJsonLimitado } from '../../../../lib/preview-link-limite'
import { registrarEChecar } from '../../../../lib/integracoes/limitador'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}
const reply = (code:string,status:number) => NextResponse.json({code},{status,headers})
const slots = criarLimitadorConcorrencia(4)
type Ticket = {uid:string;url:string;created:number;kind:'photo'|'media'}
type Media = {id?:unknown;media_type?:unknown;media_url?:unknown;thumbnail_url?:unknown;permalink?:unknown;caption?:unknown}
function safeImage(value:unknown): string {
  if(typeof value !== 'string' || value.length>3000) return ''
  try { const u=new URL(value); if(u.protocol==='https:' && !u.username && !u.password && !u.port && ['fbcdn.net','cdninstagram.com'].some(d=>u.hostname===d||u.hostname.endsWith('.'+d))) return u.href } catch {}
  return ''
}
function safePost(value:unknown): string {
  if(typeof value!=='string') return ''
  try { const u=new URL(value); if(u.protocol==='https:' && ['instagram.com','www.instagram.com'].includes(u.hostname) && !u.username && !u.password && !u.port && /^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(u.pathname)) return u.origin+u.pathname } catch {}
  return ''
}
function safeSite(value:unknown): string {
  if(typeof value!=='string'||value.length>2048) return ''
  try {const u=new URL(value); if(['https:','http:'].includes(u.protocol)&&!u.username&&!u.password) return u.href} catch {}
  return ''
}
const txt=(v:unknown,n:number)=>typeof v==='string'?v.slice(0,n):''
async function authorize(req:NextRequest) {
  const token=(req.headers.get('authorization')||'').match(/^Bearer (.+)$/i)?.[1]
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if(!token||!url||!key) return null
  const {data:{user},error}=await createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}).auth.getUser(token)
  return error?null:user
}
function enabled(user:{id:string}) {
  return process.env.MP_INSTAGRAM_DISCOVERY_ENABLED==='true' || (process.env.MP_INSTAGRAM_DISCOVERY_TEST_USER_IDS||'').split(',').map(s=>s.trim()).filter(Boolean).includes(user.id)
}
function ticket(uid:string,url:string,kind:Ticket['kind']) {return url?selar({uid,url,created:Date.now(),kind}):''}
export async function POST(req:NextRequest) {
  try {
    const user=await authorize(req); if(!user) return reply('auth',401)
    if(!enabled(user)) return reply('disabled',503)
    const body=await lerJsonLimitado(req,8192); if(!body) return reply('invalid',400)
    const now=Date.now()
    if(!registrarEChecar('ig-discovery-global',now,60)||!registrarEChecar('ig-discovery:'+user.id,now,6)) return reply('rate',429)
    if(body.authorized!==true) return reply('consent',403)
    const handle=typeof body.username==='string'?body.username.trim().toLowerCase():''
    if(!/^[a-z0-9._]{1,30}$/.test(handle)||/^\.+$/.test(handle)||/^(p|reel|reels|stories|explore|accounts|direct|tv|about)$/.test(handle)) return reply('invalid',422)
    const account=process.env.MP_INSTAGRAM_DISCOVERY_ACCOUNT_ID||'', token=process.env.MP_INSTAGRAM_DISCOVERY_ACCESS_TOKEN||''
    if(!/^\d{5,40}$/.test(account)||!token||(process.env.SMART_IMPORT_COOKIE_SECRET||'').length<32) return reply('disabled',503)
    const release=slots.tentar(); if(!release) return reply('rate',429)
    try {
      const u=new URL(`https://graph.facebook.com/v27.0/${account}`)
      u.searchParams.set('fields',`business_discovery.username(${handle}){id,username,name,biography,profile_picture_url,followers_count,website,media_count,media.limit(6){id,caption,media_type,media_url,permalink,thumbnail_url}}`)
      const r=await fetch(u,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000)})
      const data=await r.json().catch(()=>null)
      if(!r.ok||data?.error) {
        const code=Number(data?.error?.code)
        if([10,190,200].includes(code)) return reply('provider',503)
        if([4,17,32,613].includes(code)||r.status===429) return reply('rate',429)
        return reply('unavailable',422)
      }
      const profile=data?.business_discovery
      if(!profile||typeof profile.username!=='string'||profile.username.toLowerCase()!==handle) return reply('unavailable',422)
      const foto=safeImage(profile.profile_picture_url)
      const midias=(Array.isArray(profile.media?.data)?profile.media.data:[]).slice(0,6).flatMap((m:Media)=>{
        const id=txt(m.id,40), tipo=txt(m.media_type,30), link=safePost(m.permalink)
        if(!/^\d{5,40}$/.test(id)||!link||!['IMAGE','CAROUSEL_ALBUM','VIDEO'].includes(tipo)) return []
        const imagem=safeImage(tipo==='VIDEO'?m.thumbnail_url:m.media_url)
        return [{id,tipo,link,imagem,legenda:txt(m.caption,160),downloadTicket:ticket(user.id,imagem,'media')}]
      })
      return NextResponse.json({perfil:{username:handle,nome:txt(profile.name,120),bio:txt(profile.biography,500),foto,seguidores:typeof profile.followers_count==='number'&&Number.isSafeInteger(profile.followers_count)?profile.followers_count:null,website:safeSite(profile.website),downloadTicket:ticket(user.id,foto,'photo')},midias},{headers})
    } finally {release()}
  } catch {return reply('provider',503)}
}
// Download exclusivamente de URL devolvida pela Meta e selada para o usuário autenticado.
export async function PUT(req:NextRequest) {
  try {
    const user=await authorize(req); if(!user) return reply('auth',401)
    if(!enabled(user)) return reply('disabled',503)
    const now=Date.now()
    if(!registrarEChecar('ig-download-global',now,180)||!registrarEChecar('ig-download:'+user.id,now,24)) return reply('rate',429)
    const body=await lerJsonLimitado(req,8192)
    const t=abrir<Ticket>(typeof body?.ticket==='string'?body.ticket:undefined)
    if(!t||t.uid!==user.id||!Number.isFinite(t.created)||t.created>now||now-t.created>60*60*1000||!['photo','media'].includes(t.kind)||!safeImage(t.url)) return reply('invalid',403)
    const max=t.kind==='photo'?5*1024*1024:8*1024*1024
    const release=slots.tentar();if(!release) return reply('rate',429)
    try {
      const r=await fetch(t.url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{Accept:'image/jpeg,image/png,image/webp'}})
      const mime=(r.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()
      if(!r.ok||!['image/jpeg','image/png','image/webp'].includes(mime)||Number(r.headers.get('content-length'))>max) return reply('image',502)
      const reader=r.body?.getReader(); if(!reader) return reply('image',502)
      const chunks:Uint8Array[]=[]; let size=0
      for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();return reply('image',413)}chunks.push(value)}
      if(!size) return reply('image',502)
      return new NextResponse(new Uint8Array(Buffer.concat(chunks)),{headers:{...headers,'Content-Type':mime,'Content-Length':String(size)}})
    } finally {release()}
  } catch {return reply('image',502)}
}
