import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function mascararEmail(email: string): string {
  const [usuario, dominio] = email.split('@')
  if (!dominio) return email
  const primeira = usuario.slice(0, 1)
  return `${primeira}${'*'.repeat(Math.max(usuario.length - 1, 1))}@${dominio}`
}

// GET /api/convite-afiliado/validar?token=... - rota publica, sem login. So confirma se o
// token existe, esta pendente e nao expirou - nunca expoe parceiro_id, user_id, token_hash,
// criado_por ou email completo do convidado.
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ valido: false, motivo: 'Link inválido.' }, { status: 400 })

    const supabaseAdmin: any = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const { data: convite } = await supabaseAdmin
      .from('convites_parceiros')
      .select('id, status, expira_em, email_convidado, parceiro_id, parceiros(nome, user_id)')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (!convite) return NextResponse.json({ valido: false, motivo: 'Este convite não existe ou já foi usado.' })
    if (convite.status !== 'pendente') return NextResponse.json({ valido: false, motivo: 'Este convite já foi utilizado ou cancelado.' })
    if (new Date(convite.expira_em) < new Date()) {
      await supabaseAdmin.from('convites_parceiros').update({ status: 'expirado' }).eq('id', convite.id)
      return NextResponse.json({ valido: false, motivo: 'Este convite expirou. Peça um novo convite ao administrador.' })
    }

    const parceiroInfo: any = Array.isArray(convite.parceiros) ? convite.parceiros[0] : convite.parceiros
    // Se o parceiro ganhou vinculo por outro fluxo enquanto o convite estava pendente
    // (ex: vinculo manual pelo admin), o convite nao deve mais ser aceitavel.
    if (parceiroInfo?.user_id) {
      return NextResponse.json({ valido: false, motivo: 'Este parceiro já possui uma conta vinculada.' })
    }

    return NextResponse.json({
      valido: true,
      parceiro: { nome: parceiroInfo?.nome || 'um parceiro' },
      emailMascarado: mascararEmail(convite.email_convidado),
      expiraEm: convite.expira_em,
    })
  } catch (e: any) {
    console.error('[api/convite-afiliado/validar] Erro interno:', e?.message)
    return NextResponse.json({ valido: false, motivo: 'Erro ao validar o convite.' }, { status: 500 })
  }
}
