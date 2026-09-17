import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Traduz os erros nomeados que a RPC aceitar_convite_parceiro pode lançar em respostas
// HTTP claras, sem vazar detalhes internos.
function traduzirErroRpc(mensagem: string): { status: number; error: string } {
  if (mensagem.includes('convite_nao_encontrado')) return { status: 404, error: 'Este convite não existe ou já foi usado.' }
  if (mensagem.includes('convite_nao_pendente')) return { status: 400, error: 'Este convite já foi utilizado ou cancelado.' }
  if (mensagem.includes('convite_expirado')) return { status: 400, error: 'Este convite expirou. Peça um novo convite ao administrador.' }
  if (mensagem.includes('parceiro_nao_encontrado')) return { status: 404, error: 'Parceiro não encontrado.' }
  if (mensagem.includes('parceiro_ja_vinculado')) return { status: 409, error: 'Este parceiro já possui uma conta vinculada.' }
  if (mensagem.includes('usuario_ja_vinculado_outro_parceiro')) return { status: 409, error: 'Esta conta já está vinculada a outro parceiro.' }
  return { status: 500, error: 'Não foi possível concluir o aceite agora.' }
}

// POST /api/convite-afiliado/aceitar - rota crítica.
// A) Email convidado AINDA NAO tem conta -> a propria pessoa cria a senha aqui.
// B) Email convidado JA TEM conta -> precisa logar normalmente antes (prova de identidade
//    real via sessao), e so entao confirma o aceite.
// Em ambos os casos, o email de referencia SEMPRE vem do convite salvo no banco - nunca do
// body do request, evitando que alguem force o aceite pra um email diferente do convidado.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const token = body?.token as string | undefined
    const senha = body?.senha as string | undefined
    if (!token) return NextResponse.json({ error: 'Convite inválido.' }, { status: 400 })

    const supabaseAdmin: any = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Leitura inicial so pra decidir qual caso (A ou B) seguir - a validacao AUTORITATIVA
    // (pendente/nao expirado/parceiro livre/sem conflito) acontece dentro da RPC atomica,
    // que trava as linhas com FOR UPDATE.
    const { data: convite } = await supabaseAdmin
      .from('convites_parceiros')
      .select('email_convidado, status, expira_em')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (!convite) return NextResponse.json({ error: 'Este convite não existe ou já foi usado.' }, { status: 404 })
    if (convite.status !== 'pendente') return NextResponse.json({ error: 'Este convite já foi utilizado ou cancelado.' }, { status: 400 })
    if (new Date(convite.expira_em) < new Date()) {
      await supabaseAdmin.from('convites_parceiros').update({ status: 'expirado' }).eq('token_hash', tokenHash)
      return NextResponse.json({ error: 'Este convite expirou. Peça um novo convite ao administrador.' }, { status: 400 })
    }

    let novoUserId: string | null = null

    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      // Caso B: pessoa ja logada - confirma que e o mesmo email do convite.
      const tokenSessao = authHeader.replace(/^Bearer\s+/i, '').trim()
      const { data: { user: usuarioLogado }, error: sessErr } = await supabaseAdmin.auth.getUser(tokenSessao)
      if (sessErr || !usuarioLogado) return NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 })
      if ((usuarioLogado.email || '').toLowerCase().trim() !== convite.email_convidado.toLowerCase().trim()) {
        return NextResponse.json({ error: 'Este convite foi enviado para outro e-mail.' }, { status: 403 })
      }
      novoUserId = usuarioLogado.id
    } else {
      // Caso A: e-mail ainda nao tem conta - email SEMPRE do convite, nunca do body.
      if (!senha || senha.length < 6) return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 })

      const { data: criado, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: convite.email_convidado,
        password: senha,
        email_confirm: true,
      })
      if (createError) {
        if (createError.message?.toLowerCase().includes('already registered') || createError.message?.toLowerCase().includes('already exists')) {
          return NextResponse.json({ error: 'já_tem_conta' }, { status: 409 })
        }
        console.error('[api/convite-afiliado/aceitar] Erro ao criar usuário:', createError.message)
        return NextResponse.json({ error: 'Não foi possível criar sua conta agora.' }, { status: 500 })
      }
      novoUserId = criado.user.id
    }

    if (!novoUserId) return NextResponse.json({ error: 'Erro ao identificar o novo dono.' }, { status: 500 })

    // Aceite atomico: valida pendente/nao-expirado/parceiro-livre/sem-conflito e grava
    // tudo numa unica transacao com FOR UPDATE - nunca duas operacoes independentes.
    const { error: rpcError } = await supabaseAdmin.rpc('aceitar_convite_parceiro', {
      p_token_hash: tokenHash,
      p_novo_user_id: novoUserId,
    })

    if (rpcError) {
      const { status, error } = traduzirErroRpc(rpcError.message || '')
      console.log('[api/convite-afiliado/aceitar] RPC retornou erro:', rpcError.message)
      return NextResponse.json({ error }, { status })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[api/convite-afiliado/aceitar] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
