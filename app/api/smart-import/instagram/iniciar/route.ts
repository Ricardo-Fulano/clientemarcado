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
  const appId = process.env.INSTAGRAM_APP_ID?.trim()
  const configId = process.env.INSTAGRAM_UNIFIED_CONFIG_ID?.trim()
  const redirect = process.env.INSTAGRAM_REDIRECT_URI?.trim()
  const secret = process.env.SMART_IMPORT_COOKIE_SECRET || ''
  if (!appId || !configId || !redirect || !process.env.INSTAGRAM_APP_SECRET || secret.length < 32)
    return NextResponse.json({error:'Configure INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_UNIFIED_CONFIG_ID, INSTAGRAM_REDIRECT_URI e SMART_IMPORT_COOKIE_SECRET no servidor.'},{status:503})
  if (!/^\d+$/.test(appId) || !/^\d+$/.test(configId)) return NextResponse.json({error:'App ID ou Configuration ID inválido.'},{status:503})
  let callback: URL
  try { callback = new URL(redirect) } catch { return NextResponse.json({error:'URL de retorno inválida.'},{status:503}) }
  if (callback.pathname !== '/api/smart-import/instagram/retorno' || callback.search || callback.hash ||
      (callback.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && callback.hostname === 'localhost' && callback.protocol === 'http:')))
    return NextResponse.json({error:'O retorno precisa de HTTPS e da rota /api/smart-import/instagram/retorno.'},{status:503})
  // Em tunel HTTPS, Next.js pode enxergar o origin interno http://localhost:3000.
  // Aceitar apenas o host publico EXATO ja definido em INSTAGRAM_REDIRECT_URI.
  const hostsDaRequisicao = [req.headers.get('host'), req.headers.get('x-forwarded-host')]
  const mesmoDominio = callback.origin === req.nextUrl.origin || hostsDaRequisicao.some(
    host => host?.toLowerCase() === callback.host.toLowerCase()
  )
  if (!mesmoDominio) return NextResponse.json({error:'Abra o assistente no mesmo domínio HTTPS configurado como URL de retorno. O login não funciona em localhost com retorno de produção.'},{status:503})
  const state = randomBytes(24).toString('hex')
  const url = new URL('https://www.facebook.com/dialog/oauth')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('config_id', configId)
  url.searchParams.set('redirect_uri', redirect)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('override_default_response_type', 'true')
  url.searchParams.set('state', state)
  // Permissões são definidas na configuração da Meta, não por um scope arbitrário.
  const res = NextResponse.json({url:url.toString()},{headers:{'Cache-Control':'no-store'}})
  res.cookies.set(COOKIE_STATE, selar({uid:user.id,state,created:Date.now()}), cookieAttrs)
  return res
}
