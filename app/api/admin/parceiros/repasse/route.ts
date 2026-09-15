import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Mesmos UUIDs ja usados em app/painel/parceiros/page.tsx e app/api/admin/parceiros/route.ts.
const ADMIN_IDS = [
  '618aedd1-f174-4419-b4b2-b81b8dd1c47e', // canal19horas@gmail.com
  'f2203e3c-9d23-4635-9d14-b990b5198b8a', // misteriosoviaje@gmail.com
]

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/

// Fase 3D: confirma o repasse mensal de comissoes a um parceiro. NUNCA calcula valor_total,
// qtd_comissoes ou muda status manualmente aqui - tudo isso e responsabilidade exclusiva da
// funcao SQL confirmar_repasse (Fase 3A), que trava as linhas elegiveis, calcula o total
// dentro do proprio banco e executa tudo atomicamente. Esta rota so autentica, valida o
// formato do payload e repassa a chamada.
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    if (!ADMIN_IDS.includes(user.id)) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const parceiroId = body?.parceiroId
    const competencia = body?.competencia

    // Validacao estrita de formato - nunca aceita valor_total/qtd_comissoes/status vindo do
    // client, esses campos nem existem no payload esperado.
    if (typeof parceiroId !== 'string' || !UUID_REGEX.test(parceiroId)) {
      return NextResponse.json({ error: 'parceiroId inválido' }, { status: 400 })
    }
    if (typeof competencia !== 'string' || !DATA_REGEX.test(competencia)) {
      return NextResponse.json({ error: 'competencia inválida (esperado YYYY-MM-DD)' }, { status: 400 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: repasse, error: rpcError } = await (supabaseAdmin.rpc as any)('confirmar_repasse', {
      p_parceiro_id: parceiroId,
      p_competencia: competencia,
    })

    if (rpcError) {
      // "Nenhuma comissão pendente..." e o caso esperado de double-click/competencia ja
      // paga - devolve como erro de negocio (400), nao como falha interna (500).
      console.log('[api/admin/parceiros/repasse] RPC retornou erro:', rpcError.message)
      return NextResponse.json({ error: rpcError.message || 'Não foi possível confirmar o repasse' }, { status: 400 })
    }

    // Retorna exatamente o registro criado pela RPC - unica fonte autoritativa do valor
    // total/quantidade/data, nunca recalculado aqui.
    return NextResponse.json({ repasse })
  } catch (e: any) {
    console.error('[api/admin/parceiros/repasse] Erro interno:', e?.message)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
