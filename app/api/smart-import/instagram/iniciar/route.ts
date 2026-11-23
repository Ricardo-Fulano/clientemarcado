import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { selar, cookieAttrs, COOKIE_STATE } from '../../../../lib/instagram-smart-auth'

export const runtime = 'nodejs'
export async function POST(req: NextRequest) {
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!bearer || !supabaseUrl || !supabaseKey) return NextResponse.json({error:'Faça login para conectar o Instagram.'},{status:401})
  const { data: { user }, error } = await createClient(supabaseUrl, supabaseKey).auth.getUser(bearer)
  if (error || !user) return NextResponse.json({error:'Sessão inválida.'},{status:401})
  const cookieSecret = process.env.SMART_IMPORT_COOKIE_SECRET || ''
  if (cookieSecret.length < 32) return NextResponse.json({error:'Conexão temporariamente indisponível.'},{status:503})
  // Fluxo direto somente após habilitação explícita; preserve o fluxo empresarial já aprovado.
  const direto = process.env.MP_INSTAGRAM_DIRECT_LOGIN_ENABLED === 'true'
  const appId = (direto ? process.env.MP_INSTAGRAM_DIRECT_APP_ID : process.env.INSTAGRAM_APP_ID)?.trim()
  const redirect = (direto ? process.env.MP_INSTAGRAM_DIRECT_REDIRECT_URI : process.env.INSTAGRAM_REDIRECT_URI)?.trim()
  const secret = direto ? process.env.MP_INSTAGRAM_DIRECT_APP_SECRET : process.env.INSTAGRAM_APP_SECRET
  const configId = process.env.INSTAGRAM_UNIFIED_CONFIG_ID?.trim()
  if (!appId || !redirect || !secret || (!direto && !configId))
    return NextResponse.json({error:'A conexão com o Instagram está temporariamente indisponível.'},{status:503})
  if (!/^\d+$/.test(appId) || (!direto && !/^\d+$/.test(configId || '')))
    return NextResponse.json({error:'Configuração de autenticação inválida.'},{status:503})
  let callback: URL
  try { callback = new URL(redirect) } catch { return NextResponse.json({error:'URL de retorno inválida.'},{status:503}) }
  if (callback.pathname !== '/api/smart-import/instagram/retorno' || callback.search || callback.hash ||
      (callback.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && callback.hostname === 'localhost' && callback.protocol === 'http:')))
    return NextResponse.json({error:'Retorno do Instagram não autorizado.'},{status:503})
  // A requisição e o retorno devem compartilhar o mesmo host HTTPS, sem redirecionamento aberto.
  const requestHosts = [req.headers.get('host'),req.headers.get('x-forwarded-host')]
  const mesmoDominio = callback.origin === req.nextUrl.origin || requestHosts.some(h=>h?.toLowerCase() === callback.host.toLowerCase())
  if (!mesmoDominio) return NextResponse.json({error:'Abra a MiniPage no domínio HTTPS configurado para o Instagram.'},{status:503})
  const dados = await req.json().catch(() => null) as { destino?: unknown } | null
  const destino = dados?.destino === '/painel/perfil/albuns' ? '/painel/perfil/albuns' : undefined
  const state = randomBytes(24).toString('hex')
  const url = new URL(direto ? 'https://www.instagram.com/oauth/authorize' : 'https://www.facebook.com/dialog/oauth')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirect)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  if (direto) {
    // Escopo mínimo para leitura de dados e mídias de conta profissional.
    url.searchParams.set('scope','instagram_business_basic')
    url.searchParams.set('enable_fb_login','false')
  } else {
    url.searchParams.set('config_id',configId!)
    url.searchParams.set('override_default_response_type','true')
  }
  const res = NextResponse.json({url:url.toString()},{headers:{'Cache-Control':'no-store'}})
  res.cookies.set(COOKIE_STATE, selar({uid:user.id,state,created:Date.now(), modo: direto ? 'direto' : 'empresarial', ...(destino ? {destino} : {})}), cookieAttrs)
  return res
}
