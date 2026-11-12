
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * MiniPage Pro
 * Conciliacao de comissoes ja registradas.
 *
 * - Nao cria comissoes.
 * - Nao realiza pagamentos.
 * - Nao altera planos.
 * - Nao processa novas indicacoes.
 *
 * Apenas confirma no banco comissoes
 * que ja foram registradas corretamente.
 */
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET

  if (!segredo) {
    return NextResponse.json(
      { error: 'Rotina nao configurada.' },
      { status: 503 }
    )
  }

  if (
    request.headers.get('authorization') !==
    `Bearer ${segredo}`
  ) {
    return NextResponse.json(
      { error: 'Nao autorizado.' },
      { status: 401 }
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !chave) {
    return NextResponse.json(
      { error: 'Supabase nao configurado.' },
      { status: 503 }
    )
  }

  try {
    const supabase = createClient(url, chave, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase.rpc(
      'conciliar_comissoes_recuperacao_registradas'
    )

    if (error) {
      throw new Error(error.message)
    }

    if (
      typeof data !== 'number' ||
      !Number.isSafeInteger(data) ||
      data < 0
    ) {
      throw new Error(
        'Resultado inesperado da conciliacao'
      )
    }

    return NextResponse.json(
      {
        ok: true,
        rotina: 'conciliar-comissoes-recuperacao',
        conciliacoesConcluidas: data,
        comissoesCriadas: 0,
        pagamentosExecutados: 0,
        planosAlterados: 0,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (erro) {
    console.error(
      '[Conciliacao comissoes] Falha:',
      erro instanceof Error
        ? erro.message
        : 'Erro desconhecido'
    )

    return NextResponse.json(
      {
        error: 'Falha na conciliacao de comissoes.',
      },
      { status: 500 }
    )
  }
}
