import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  conferirPagamento,
  registrarComissaoParceiro,
} from '../../../lib/asaas-webhook'
import { processarComissoesRecuperacao } from '../../../lib/processar-comissoes-recuperacao'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Rota produtiva: injeta somente dependencias reais do servidor. */
export async function POST(request: NextRequest) {
  return processarComissoesRecuperacao(request, {
    env: process.env,
    criarCliente: createClient,
    fetchFn: fetch,
    conferirPagamentoFn: conferirPagamento,
    registrarComissaoFn: registrarComissaoParceiro,
  })
}
