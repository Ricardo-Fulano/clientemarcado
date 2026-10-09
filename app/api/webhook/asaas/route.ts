import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processarEventoAsaas, validarTokenWebhook } from '../../../lib/asaas-webhook'

// Webhook do Asaas. Toda a regra esta em app/lib/asaas-webhook.ts. Aqui so: validar o token
// (OBRIGATORIO em producao), ler o JSON e entregar ao processador.
//
// Respostas: 200 = tratado (inclui duplicado/ignorado/rejeitado/orfao, que ficam gravados em
// asaas_eventos); 401 = token invalido/ausente; 409 = mesmo evento em processamento agora;
// 500/503 = falha temporaria -> o Asaas reenvia.
export async function POST(request: NextRequest) {
  try {
    const bodyTexto = await request.text()

    const tokenRecebido = request.headers.get('asaas-access-token') || request.headers.get('access-token') || ''
    const tk = validarTokenWebhook(process.env as Record<string, string | undefined>, tokenRecebido)
    if (!tk.ok) {
      console.error(`[Webhook Asaas] REQUISICAO RECUSADA: ${tk.motivo}`)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let evento: any
    try { evento = JSON.parse(bodyTexto) } catch {
      console.error('[Webhook Asaas] Payload nao e JSON valido')
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const r = await processarEventoAsaas({ supabase, env: process.env as Record<string, string | undefined> }, evento, bodyTexto)
    return NextResponse.json(r.body, { status: r.status })
  } catch (err) {
    console.error('[Webhook Asaas] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
