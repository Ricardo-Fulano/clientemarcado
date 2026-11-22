import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { abrir, COOKIE_TOKEN, type SessaoInstagram } from '../../../../lib/instagram-smart-auth'
export const runtime = 'nodejs'
const reply = (data:unknown,status:number) => NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}})
const VERSION='v25.0'
async function graph(path:string, fields:string, token:string, limit?:number) {
  const url = new URL(`https://graph.facebook.com/${VERSION}/${path}`)
  url.searchParams.set('fields',fields)
  if (limit) url.searchParams.set('limit',String(limit))
  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(),9000)
  try {
    const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:controller.signal,cache:'no-store'})
    if (!response.ok) throw new Error('Falha na consulta à Meta')
    return await response.json()
  } finally {clearTimeout(timer)}
}
export async function GET(req:NextRequest) {
  const authToken=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'')
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!authToken || !url || !key) return reply({error:'Faça login.'},401)
  const {data:{user},error}=await createClient(url,key).auth.getUser(authToken)
  const session=abrir<SessaoInstagram>(req.cookies.get(COOKIE_TOKEN)?.value)
  if (error || !user || !session || user.id!==session.uid || session.created>Date.now() || Date.now()-session.created>30*60*1000 ||
      !session.instagramId || !/^\d+$/.test(session.instagramId)) return reply({error:'Conecte novamente sua conta profissional do Instagram.'},401)
  try {
    const [profile,media]=await Promise.all([
      graph(session.instagramId,'id,username,name,biography,profile_picture_url,followers_count',session.token),
      graph(session.instagramId+'/media','id,media_type,media_url,thumbnail_url,permalink,caption,timestamp',session.token,12)
    ])
    const entries=Array.isArray(media?.data)?media.data:[]
    return reply({perfil:{username:String(profile.username||session.username||''),nome:String(profile.name||''),bio:String(profile.biography||''),foto:String(profile.profile_picture_url||''),seguidores:Number.isFinite(profile.followers_count)?profile.followers_count:null},midias:entries.slice(0,12).filter((m:Record<string,unknown>)=>typeof m.permalink==='string').map((m:Record<string,unknown>)=>({id:String(m.id||''),tipo:String(m.media_type||''),imagem:String(m.thumbnail_url||m.media_url||''),link:String(m.permalink||''),legenda:String(m.caption||'').slice(0,160)}))},200)
  } catch {return reply({error:'A Meta não disponibilizou o perfil ou as mídias. Verifique as permissões de leitura e a conta profissional compartilhada.'},502)}
}
