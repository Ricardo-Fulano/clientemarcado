
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * MiniPage Pro
 *
 * Recupera reservas de comissao interrompidas.
 *
 * - Desativado por padrao.
 * - Exige CRON_SECRET.
 * - Utiliza service_role no servidor.
 * - Recupera reservas com mais de 30 minutos.
 * - Nao cria comissoes.
 * - Nao paga parceiros.
 * - Nao altera planos.
 *
 * A funcao SQL realiza a alteracao atomica
 * das reservas antigas para o estado "erro".
 *
 * A conciliacao financeira posterior e feita
 * por outra rotina, apos verificacoes adicionais.
 */

export async function POST(request: NextRequest) {
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

  // Trava independente do segredo.
  if (
    process.env.ASAAS_RECUPERACAO_RESERVAS_ENABLED
      !== 'true'
  ) {
    return NextResponse.json(
      { error: 'Recuperacao de reservas desativada.' },
      { status: 503 }
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
      'recuperar_reservas_comissao_interrompidas',
      { p_minutos: 30 }
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
        'Resposta inesperada do Supabase.'
      )
    }

    return NextResponse.json(
      {
        ok: true,
        rotina: 'recuperar-reservas-comissao',
        reservasLiberadas: data,
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
      '[Recuperacao reservas] Erro:',
      erro instanceof Error
        ? erro.message
        : 'Erro desconhecido'
    )

    return NextResponse.json(
      { error: 'Falha ao recuperar reservas.' },
      { status: 500 }
    )
  }
}
