import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { criarConvite } from '../../../lib/convite-criar'
import { criarConviteStore } from '../../../lib/convite-store'
import { criarEnvioResend } from '../../../lib/resend-envio'

// Cria um convite de transferencia de acesso. So o dono do perfil pode chamar. A logica (ordem segura de envio e cancelamento,
// idempotencia, recuperacao) vive em app/lib/convite-criar.ts e e testada com falsos; esta rota so liga autenticacao, banco e Resend.
// Roda so no servidor, com SUPABASE_SERVICE_ROLE_KEY. Nunca loga token, link, chave do Resend ou e-mail completo.
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const {
      data: { user: admin },
      error: authError,
    } = await supabase.auth.getUser(authHeader.slice(7))
    if (authError || !admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const body = await request.json().catch(() => null)

    // so o dono (perfis.user_id) cria convite - nunca profissional de equipe
    const { data: perfil, error: erroPerfil } = await supabase.from('perfis').select('id, user_id, nome_negocio').eq('user_id', admin.id).single()
    if (erroPerfil || !perfil) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.error('[convite/criar] RESEND_API_KEY não configurada.')
      return NextResponse.json({ error: 'Envio de e-mail não configurado. Fale com o suporte.' }, { status: 500 })
    }

    const resposta = await criarConvite(
      {
        adminId: admin.id,
        adminEmail: admin.email || '',
        perfil: { id: perfil.id, nome_negocio: perfil.nome_negocio },
        emailNovo: body?.email_novo,
        siteUrl: process.env.MINIPAGE_DOMINIO_UNICO_ENABLED === 'true'
          ? 'https://minipage.pro'
          : (process.env.NEXT_PUBLIC_SITE_URL || 'https://clientemarcado.com.br'),
      },
      {
        store: criarConviteStore(supabase),
        email: criarEnvioResend(resendKey),
        agora: () => new Date(),
        gerarToken: () => {
          // 32 bytes aleatorios -> base64url. So o HASH (sha256) vai para o banco.
          const tokenCru = crypto.randomBytes(32).toString('base64url')
          return { tokenCru, tokenHash: crypto.createHash('sha256').update(tokenCru).digest('hex') }
        },
        esperar: (ms) => new Promise((r) => setTimeout(r, ms)),
        log: (evento, dados) => console.error('[convite/criar]', evento, dados ?? {}),
      },
    )
    return NextResponse.json(resposta.body, { status: resposta.status })
  } catch (err) {
    console.error('[convite/criar] Erro interno:', err instanceof Error ? err.message : 'desconhecido')
    return NextResponse.json({ error: 'Erro interno ao criar o convite.' }, { status: 500 })
  }
}
