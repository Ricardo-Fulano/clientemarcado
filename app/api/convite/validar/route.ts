import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Valida um token de convite (rota publica, sem login). O e-mail devolvido vem SEMPRE do
// convite deste token - nunca da sessao. Informa tambem se esse e-mail ja tem conta, para a
// pagina mostrar logo a tela certa (entrar) em vez de falhar na hora de criar a senha.
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ valido: false, motivo: 'Link inválido.' }, { status: 400 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const { data: convite } = await supabase
      .from('convites_transferencia')
      .select('id, status, expira_em, email_novo, perfil_id, perfis(nome_negocio)')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (!convite) return NextResponse.json({ valido: false, motivo: 'Este convite não existe ou foi substituído por um mais recente.' })
    if (convite.status === 'aceito') return NextResponse.json({ valido: false, motivo: 'Este convite já foi utilizado.' })
    if (convite.status === 'cancelado') return NextResponse.json({ valido: false, motivo: 'Este convite foi substituído por um mais recente. Use o link do último e-mail enviado.' })
    if (convite.status !== 'pendente' || new Date(convite.expira_em) < new Date()) {
      if (convite.status === 'pendente') await supabase.from('convites_transferencia').update({ status: 'expirado' }).eq('id', convite.id)
      return NextResponse.json({ valido: false, motivo: 'Este convite expirou. Peça um novo convite.' })
    }

    const { data: existenteId } = await supabase.rpc('auth_user_id_por_email', { p_email: convite.email_novo })

    const perfilInfo = Array.isArray(convite.perfis) ? convite.perfis[0] : convite.perfis
    return NextResponse.json({
      valido: true,
      email_novo: convite.email_novo,
      nome_negocio: (perfilInfo as { nome_negocio?: string } | null)?.nome_negocio || 'sua página profissional',
      conta_existente: !!existenteId,
    })
  } catch (err) {
    console.error('[convite/validar] Erro interno:', err)
    return NextResponse.json({ valido: false, motivo: 'Erro ao validar o convite.' }, { status: 500 })
  }
}
