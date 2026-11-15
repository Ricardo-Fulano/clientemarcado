import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prepararTransacaoSandbox } from '../../../../lib/billing/paddle/transacao-rascunho'
import { previewCheckoutSandboxHabilitado } from '../../../../lib/billing/paddle/checkout-preview'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const headers={'Cache-Control':'no-store'}

/** Endpoint sem escrita: planeja payload autenticamente, nao cria checkout nem reserva. */
export async function POST(request:NextRequest){
  if(!previewCheckoutSandboxHabilitado(process.env)) return NextResponse.json({error:'DESABILITADO'},{status:503,headers})
  const token=(request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if(!token || token.length>8192) return NextResponse.json({error:'NAO_AUTENTICADO'},{status:401,headers})
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!url || !anon || !key) return NextResponse.json({error:'CONFIG_INCOMPLETA'},{status:503,headers})
  try{
    const auth=createClient(url,anon,{auth:{autoRefreshToken:false,persistSession:false}})
    const {data:{user},error}=await auth.auth.getUser(token)
    if(error || !user) return NextResponse.json({error:'SESSAO_INVALIDA'},{status:401,headers})
    const admin=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}})
    const {data:perfil,error:perr}=await admin.from('perfis').select('plano_tipo,billing_cycle,status_acesso').eq('user_id',user.id).maybeSingle()
    if(perr || !perfil) return NextResponse.json({error:'PERFIL_INDISPONIVEL'},{status:404,headers})
    // O cliente envia apenas a tentativa UUID aleatoria; nunca preco ou plano.
    let corpo:unknown
    try{corpo=await request.json()}catch{return NextResponse.json({error:'JSON_INVALIDO'},{status:400,headers})}
    const tentativa=corpo && typeof corpo==='object' && !Array.isArray(corpo) && 'attemptId' in corpo
      ? (corpo as {attemptId:unknown}).attemptId : null
    try{
      const p=prepararTransacaoSandbox({userId:user.id,tentativaId:tentativa,
        plano:perfil.plano_tipo,ciclo:perfil.billing_cycle,statusAcesso:perfil.status_acesso})
      return NextResponse.json({ok:true,modo:'dry-run',sandbox:true,
        priceId:p.payload.items[0].price_id,plano:p.plano,ciclo:p.ciclo,
        tentativaId:tentativa,transacaoCriada:false,planoAtivado:false},{headers})
    }catch{return NextResponse.json({error:'PERFIL_OU_TENTATIVA_INVALIDOS'},{status:422,headers})}
  }catch{return NextResponse.json({error:'SERVICO_INDISPONIVEL'},{status:503,headers})}
}
export async function GET(){return NextResponse.json({error:'METODO_NAO_PERMITIDO'},{status:405,headers})}
