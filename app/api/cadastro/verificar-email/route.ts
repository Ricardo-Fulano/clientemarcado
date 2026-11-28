import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { email27, emitirCodigo27 } from '../../../lib/auth-email-27'
export async function POST(request:NextRequest){
 try{
  const body=await request.json().catch(()=>null)
  if(!body||typeof body!=='object'||body.website)return NextResponse.json({codigo:'REQUISICAO_INVALIDA'},{status:400})
  const ip=(request.headers.get('x-forwarded-for')||'').split(',')[0].trim()||request.headers.get('x-real-ip')||'unknown'
  const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})
  const r=await emitirCodigo27(s,email27(body.email),ip,body.idioma)
  return NextResponse.json(r.body,{status:r.status,headers:{'Cache-Control':'no-store'}})
 }catch{return NextResponse.json({codigo:'EMAIL_INDISPONIVEL'},{status:503})}
}
