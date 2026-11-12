import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { executarReconciliacaoPlanos } from '../../../lib/reconciliar-planos-pagos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return executarReconciliacaoPlanos(request, {
    env: process.env,
    criarCliente: createClient,
    fetchFn: fetch,
  })
}

// A Vercel Cron invoca a rota por GET; usa as mesmas verificacoes do POST.
export async function GET(request: NextRequest) {
  return POST(request)
}
