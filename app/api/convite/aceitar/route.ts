import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Aceita um convite de transferencia (rota critica).
// Dois casos:
// A) E-mail novo AINDA NAO tem conta -> a propria pessoa digita a senha aqui (nunca o admin antigo).
// B) E-mail novo JA TEM conta -> a pessoa precisa logar normalmente antes (prova de identidade real),
//    e so entao confirma a transferencia usando a sessao dela.
// So roda no servidor, com SUPABASE_SERVICE_ROLE_KEY - nunca no client.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const token = body?.token as string | undefined
    const senha = body?.senha as string | undefined
    if (!token) return NextResponse.json({ error: 'Convite inválido.' }, { status: 400 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const { data: convite } = await supabase.from('convites_transferencia').select('*').eq('token_hash', tokenHash).single()
    if (!convite) return NextResponse.json({ error: 'Este convite não existe ou já foi usado.' }, { status: 404 })
    if (convite.status !== 'pendente') return NextResponse.json({ error: 'Este convite já foi utilizado ou cancelado.' }, { status: 400 })
    if (new Date(convite.expira_em) < new Date()) {
      await supabase.from('convites_transferencia').update({ status: 'expirado' }).eq('id', convite.id)
      return NextResponse.json({ error: 'Este convite expirou. Peça um novo convite.' }, { status: 400 })
    }

    let novoUserId: string | null = null

    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      // Caso B: pessoa ja logada com uma conta existente - confirma que e o mesmo e-mail do convite
      const tokenSessao = authHeader.replace('Bearer ', '')
      const { data: { user: usuarioLogado }, error: sessErr } = await supabase.auth.getUser(tokenSessao)
      if (sessErr || !usuarioLogado) return NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 })
      if ((usuarioLogado.email || '').toLowerCase() !== convite.email_novo.toLowerCase()) {
        return NextResponse.json({ error: 'Este convite foi enviado para outro e-mail.' }, { status: 403 })
      }
      novoUserId = usuarioLogado.id
    } else {
      // Caso A: e-mail ainda nao tem conta - a propria pessoa cria a senha aqui, nunca o admin antigo
      if (!senha || senha.length < 6) return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 })

      const { data: criado, error: createError } = await supabase.auth.admin.createUser({
        email: convite.email_novo,
        password: senha,
        email_confirm: true,
      })
      if (createError) {
        if (createError.message?.toLowerCase().includes('already registered') || createError.message?.toLowerCase().includes('already exists')) {
          return NextResponse.json({ error: 'já_tem_conta' }, { status: 409 })
        }
        console.error('[convite/aceitar] Erro ao criar usuário:', createError.message)
        return NextResponse.json({ error: 'Não foi possível criar sua conta agora.' }, { status: 500 })
      }
      novoUserId = criado.user.id
    }

    if (!novoUserId) return NextResponse.json({ error: 'Erro ao identificar o novo dono.' }, { status: 500 })

    // Transfere o perfil e TUDO que esta vinculado por user_id (destaques, links, videos, eventos).
    // profissionais ja usa perfil_id, entao nao precisa transferir - continua vinculado
    // automaticamente assim que o perfil muda de dono.
    // IMPORTANTE: filtramos por convite.user_id_atual (o dono exato no momento do convite),
    // nunca por um "user_id atual generico", pra nunca arriscar mover dado de outro perfil
    // caso a mesma conta tivesse mais de uma pagina (nao e o caso hoje, mas e mais seguro).
    const userIdAntigo = convite.user_id_atual
    const { error: transferError } = await supabase.from('perfis').update({ user_id: novoUserId }).eq('id', convite.perfil_id)
    if (transferError) {
      console.error('[convite/aceitar] Erro ao transferir perfil:', transferError.message)
      return NextResponse.json({ error: 'Não foi possível concluir a transferência agora. Fale com o suporte.' }, { status: 500 })
    }

    const [destaquesRes, linksRes, videosRes, eventosRes] = await Promise.all([
      supabase.from('pagina_destaques').update({ user_id: novoUserId }).eq('user_id', userIdAntigo),
      supabase.from('pagina_links').update({ user_id: novoUserId }).eq('user_id', userIdAntigo),
      supabase.from('pagina_videos').update({ user_id: novoUserId }).eq('user_id', userIdAntigo),
      supabase.from('pagina_eventos').update({ user_id: novoUserId }).eq('user_id', userIdAntigo),
    ])
    if (destaquesRes.error) console.error('[convite/aceitar] Erro ao transferir destaques:', destaquesRes.error.message)
    if (linksRes.error) console.error('[convite/aceitar] Erro ao transferir links:', linksRes.error.message)
    if (videosRes.error) console.error('[convite/aceitar] Erro ao transferir vídeos:', videosRes.error.message)
    if (eventosRes.error) console.error('[convite/aceitar] Erro ao transferir eventos:', eventosRes.error.message)

    await supabase.from('convites_transferencia').update({ status: 'aceito', aceito_em: new Date().toISOString() }).eq('id', convite.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[convite/aceitar] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
