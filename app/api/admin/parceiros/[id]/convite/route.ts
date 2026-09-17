import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const ADMIN_IDS = [
  '618aedd1-f174-4419-b4b2-b81b8dd1c47e', // canal19horas@gmail.com
  'f2203e3c-9d23-4635-9d14-b990b5198b8a', // misteriosoviaje@gmail.com
]

async function autenticarAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { erro: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }

  const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
  if (authError || !user) return { erro: NextResponse.json({ error: 'Sessão inválida' }, { status: 401 }) }

  if (!ADMIN_IDS.includes(user.id)) return { erro: NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 }) }

  return { user }
}

// POST /api/admin/parceiros/[id]/convite - cria (ou reenvia, cancelando o anterior) um
// convite de acesso ao painel de afiliado. NUNCA vincula automaticamente por email - o
// destinatário precisa aceitar o convite explicitamente.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await autenticarAdmin(request)
    if (auth.erro) return auth.erro

    const { id } = await params
    const body = await request.json().catch(() => null)
    const emailBruto = body?.email

    if (typeof emailBruto !== 'string' || !emailBruto.trim() || !emailBruto.includes('@')) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }
    const emailConvidado = emailBruto.trim().toLowerCase()

    const supabaseAdmin: any = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: parceiro, error: erroParceiro } = await supabaseAdmin
      .from('parceiros')
      .select('id, nome, user_id')
      .eq('id', id)
      .maybeSingle()

    if (erroParceiro) return NextResponse.json({ error: erroParceiro.message }, { status: 500 })
    if (!parceiro) return NextResponse.json({ error: 'Parceiro não encontrado.' }, { status: 404 })
    if (parceiro.user_id) {
      return NextResponse.json({ error: 'Este parceiro já possui uma conta vinculada. Desvincule antes de enviar um convite.' }, { status: 409 })
    }

    // Reenvio: cancela qualquer convite pendente anterior desse parceiro antes de criar o
    // novo - nunca reutiliza o token anterior (o UNIQUE parcial no banco tambem protege
    // contra 2 pendentes simultaneos mesmo em race condition).
    await supabaseAdmin.from('convites_parceiros').update({ status: 'cancelado' }).eq('parceiro_id', id).eq('status', 'pendente')

    const tokenCru = crypto.randomBytes(32).toString('base64url')
    const tokenHash = crypto.createHash('sha256').update(tokenCru).digest('hex')
    const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const { error: erroInsert } = await supabaseAdmin.from('convites_parceiros').insert({
      parceiro_id: id,
      criado_por: auth.user!.id,
      email_convidado: emailConvidado,
      token_hash: tokenHash,
      status: 'pendente',
      expira_em: expiraEm.toISOString(),
    })
    if (erroInsert) {
      console.error('[api/admin/parceiros/[id]/convite][POST] Erro ao salvar convite:', erroInsert.message)
      return NextResponse.json({ error: 'Não foi possível criar o convite agora.' }, { status: 500 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://minipage.pro'
    const linkConvite = `${siteUrl}/convite-afiliado/${tokenCru}`
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.error('[api/admin/parceiros/[id]/convite][POST] RESEND_API_KEY não configurada.')
      return NextResponse.json({ error: 'Convite salvo, mas envio de e-mail não configurado.' }, { status: 500 })
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #181018;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Você foi convidado(a) como afiliado</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #3f3540;">Você foi convidado(a) a acessar o painel de afiliado de <strong>${parceiro.nome}</strong> na MiniPage Pro.</p>
        <p style="font-size: 16px; line-height: 1.6; color: #3f3540;">Clique no botão abaixo para aceitar o convite e acessar suas comissões e repasses.</p>
        <p style="margin: 28px 0;">
          <a href="${linkConvite}" style="display:inline-block;background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;">Aceitar convite</a>
        </p>
        <p style="font-size: 13px; color: #6b5f6b;">Este link expira em 7 dias e só pode ser usado uma vez. Se você não esperava este convite, pode ignorar este e-mail com segurança.</p>
        <hr style="border:0;border-top:1px solid #eee2ee;margin:28px 0;" />
        <p style="font-size: 13px; color: #8a7c8a;">MiniPage Pro</p>
      </div>
    `

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'MiniPage Pro <noreply@clientemarcado.com.br>',
        to: [emailConvidado],
        subject: `Você foi convidado(a) como afiliado de ${parceiro.nome}`,
        html: emailHtml,
      }),
    })
    if (!resendRes.ok) {
      const errTxt = await resendRes.text().catch(() => '')
      console.error('[api/admin/parceiros/[id]/convite][POST] Erro ao enviar via Resend:', errTxt)
      return NextResponse.json({ error: 'Convite salvo, mas não foi possível enviar o e-mail agora.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/admin/parceiros/[id]/convite][POST] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE /api/admin/parceiros/[id]/convite - cancela o convite pendente (nunca deleta
// fisicamente, so muda status).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await autenticarAdmin(request)
    if (auth.erro) return auth.erro

    const { id } = await params
    const supabaseAdmin: any = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { error } = await supabaseAdmin
      .from('convites_parceiros')
      .update({ status: 'cancelado' })
      .eq('parceiro_id', id)
      .eq('status', 'pendente')

    if (error) {
      console.error('[api/admin/parceiros/[id]/convite][DELETE] Erro:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/admin/parceiros/[id]/convite][DELETE] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
