import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Cria um convite de transferencia de acesso (Caminho B).
// So o admin dono do perfil pode chamar isso. Gera um token, salva so o HASH
// no banco (nunca o token cru), e envia o e-mail com o link via Resend.
// Roda so no servidor, com SUPABASE_SERVICE_ROLE_KEY - nunca no client.
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: admin }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const emailNovo = (body?.email_novo || '').trim().toLowerCase()
    if (!emailNovo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNovo)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }

    // So o dono (perfis.user_id) pode criar convite - nunca profissional de equipe
    const { data: perfil } = await supabase.from('perfis').select('id, user_id, nome_negocio').eq('user_id', admin.id).single()
    if (!perfil) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

    if (emailNovo === (admin.email || '').toLowerCase()) {
      return NextResponse.json({ error: 'O novo e-mail precisa ser diferente do e-mail atual.' }, { status: 400 })
    }

    // Cancela convites pendentes anteriores desse mesmo perfil, pra nao acumular tokens validos
    await supabase.from('convites_transferencia').update({ status: 'cancelado' }).eq('perfil_id', perfil.id).eq('status', 'pendente')

    // Gera o token: 32 bytes aleatorios -> base64url. So o HASH (sha256) vai pro banco.
    const tokenCru = crypto.randomBytes(32).toString('base64url')
    const tokenHash = crypto.createHash('sha256').update(tokenCru).digest('hex')
    const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias

    const { error: insertError } = await supabase.from('convites_transferencia').insert({
      perfil_id: perfil.id,
      user_id_atual: admin.id,
      email_novo: emailNovo,
      token_hash: tokenHash,
      status: 'pendente',
      expira_em: expiraEm.toISOString(),
    })
    if (insertError) {
      console.error('[convite/criar] Erro ao salvar convite:', insertError.message)
      return NextResponse.json({ error: 'Não foi possível criar o convite agora.' }, { status: 500 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clientemarcado.com.br'
    const linkConvite = `${siteUrl}/convite/${tokenCru}`
    const nomeNegocio = perfil.nome_negocio || 'ClienteMarcado'

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.error('[convite/criar] RESEND_API_KEY não configurada.')
      return NextResponse.json({ error: 'Envio de e-mail não configurado. Fale com o suporte.' }, { status: 500 })
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #181018;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Você recebeu o acesso a uma página profissional</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #3f3540;">Você foi convidada(o) a assumir o acesso da página profissional <strong>${nomeNegocio}</strong> no ClienteMarcado.</p>
        <p style="font-size: 16px; line-height: 1.6; color: #3f3540;">Clique no botão abaixo para aceitar o convite e criar sua própria senha de acesso.</p>
        <p style="margin: 28px 0;">
          <a href="${linkConvite}" style="display:inline-block;background:linear-gradient(135deg,#EC4899,#D946EF,#8B5CF6);color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;">Aceitar convite e criar senha</a>
        </p>
        <p style="font-size: 13px; color: #6b5f6b;">Este link expira em 7 dias e só pode ser usado uma vez. Se você não esperava este convite, pode ignorar este e-mail com segurança.</p>
        <hr style="border:0;border-top:1px solid #eee2ee;margin:28px 0;" />
        <p style="font-size: 13px; color: #8a7c8a;">ClienteMarcado<br/>Página profissional, agenda online e gestão para beleza e estética.</p>
      </div>
    `

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'ClienteMarcado <noreply@clientemarcado.com.br>',
        to: [emailNovo],
        subject: `Você recebeu acesso à página profissional ${nomeNegocio}`,
        html: emailHtml,
      }),
    })
    if (!resendRes.ok) {
      const errTxt = await resendRes.text().catch(() => '')
      console.error('[convite/criar] Erro ao enviar via Resend:', errTxt)
      return NextResponse.json({ error: 'Convite salvo, mas não foi possível enviar o e-mail agora.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[convite/criar] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
