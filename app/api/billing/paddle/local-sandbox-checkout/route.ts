import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validarAmbienteCheckoutLocal } from '../../../../lib/billing/paddle/local-e2e-config'
import { repositorioReservasSandbox } from '../../../../lib/billing/paddle/reservas-sandbox'
import { orquestrarCriacaoSandbox } from '../../../../lib/billing/paddle/orquestrador-sandbox'
import { criarTransacaoSandboxIsolada } from '../../../../lib/billing/paddle/transacoes-api-sandbox'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = {'Cache-Control': 'no-store'}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Sandbox E2E local, usa SOMENTE o projeto Supabase de testes com usuarios ficticios.
 * Nao altera os perfis de producao; nao concede acesso, nao registra comissao.
 */
export async function POST(request:NextRequest){
  try { validarAmbienteCheckoutLocal(process.env) }
  catch { return NextResponse.json({error:'CHECKOUT_LOCAL_INDISPONIVEL'},{status:503,headers}) }
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (!token || token.length>8192) return NextResponse.json({error:'NAO_AUTENTICADO'},{status:401,headers})
  let body:unknown
  try {body=await request.json()}catch{return NextResponse.json({error:'JSON_INVALIDO'},{status:400,headers})}
  const attemptId=body && typeof body==='object' && 'attemptId' in body
    ? (body as {attemptId:unknown}).attemptId:null
  if(typeof attemptId!=='string' || !UUID.test(attemptId))
    return NextResponse.json({error:'TENTATIVA_INVALIDA'},{status:422,headers})
  const url=process.env.PADDLE_TEST_SUPABASE_URL!
  const auth=createClient(url,process.env.PADDLE_TEST_SUPABASE_ANON_KEY!,
    {auth:{autoRefreshToken:false,persistSession:false}})
  const {data:{user},error:authError}=await auth.auth.getUser(token)
  if(authError || !user) return NextResponse.json({error:'SESSAO_INVALIDA'},{status:401,headers})
  const admin=createClient(url,process.env.PADDLE_TEST_SUPABASE_SERVICE_ROLE_KEY!,
    {auth:{autoRefreshToken:false,persistSession:false}})
  const {data:perfil,error:perfilError}=await admin.from('perfis')
    .select('plano_tipo,billing_cycle,status_acesso')
    .eq('user_id',user.id).maybeSingle()
  if(perfilError || !perfil) return NextResponse.json({error:'PERFIL_TESTE_NAO_ENCONTRADO'},{status:422,headers})
  try {
    const pedido={userId:user.id,attemptId,plano:perfil.plano_tipo,
      ciclo:perfil.billing_cycle,statusAcesso:perfil.status_acesso}
    const resultado=await orquestrarCriacaoSandbox(pedido,repositorioReservasSandbox(admin),
      async ()=>criarTransacaoSandboxIsolada({
        userId:pedido.userId,tentativaId:pedido.attemptId,plano:pedido.plano,
        ciclo:pedido.ciclo,statusAcesso:pedido.statusAcesso,
      },process.env.PADDLE_SANDBOX_API_KEY!,process.env))
    if(resultado.estado==='pendente_conciliacao') return NextResponse.json(
      {estado:'pendente_conciliacao',mensagem:'Resultado incerto. Nao gere outra compra ate conciliar.'},
      {status:202,headers})
    if(resultado.estado==='ja_existente'){
      if(resultado.status==='created' && resultado.transactionId)
        return NextResponse.json({estado:'pronto',transactionId:resultado.transactionId,reused:true},{headers})
      return NextResponse.json({estado:'pendente_conciliacao',mensagem:'Ja existe uma tentativa em andamento; nao repetir automaticamente.'},
        {status:202,headers})
    }
    return NextResponse.json({estado:'pronto',transactionId:resultado.transactionId,reused:false},{headers})
  }catch(err){
    const msg=err instanceof Error?err.message:''
    if(msg.includes('PLANO_')||msg.includes('CICLO_')||msg.includes('ACESSO_'))
      return NextResponse.json({error:'PLANO_OU_ACESSO_INVALIDO'},{status:422,headers})
    if(msg.includes('PADDLE_TENTATIVA_ABERTA') || msg.includes('RESERVA_NEGADA'))
      return NextResponse.json({error:'TENTATIVA_EXISTENTE_OU_RESERVA_BLOQUEADA'},{status:409,headers})
    console.error('[Paddle local e2e]',msg.slice(0,90))
    return NextResponse.json({error:'CHECKOUT_TESTE_INDISPONIVEL'},{status:503,headers})
  }
}
export async function GET(){return NextResponse.json({error:'METODO_NAO_PERMITIDO'},{status:405,headers})}
