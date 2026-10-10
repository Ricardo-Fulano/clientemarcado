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

    // O Asaas envia o "authToken" configurado no webhook no header asaas-access-token.
    // (ASAAS_API_KEY e outra coisa: e a chave que o NOSSO servidor usa para chamar a API do Asaas.)
    const headerAsaas = request.headers.get('asaas-access-token')
    const headerAlt = request.headers.get('access-token')
    const tokenRecebido = headerAsaas || headerAlt || ''
    const tk = validarTokenWebhook(process.env as Record<string, string | undefined>, tokenRecebido)

    // LOG TEMPORARIO de diagnostico da autenticacao (aparece em TODA requisicao ao webhook, aceita ou recusada).
    // NUNCA contem o token: so presenca, tamanhos (ja sem espacos/quebras de linha/aspas), se sao iguais,
    // impressoes curtas (8 caracteres de um SHA-256), os NOMES dos headers de autenticacao e o ambiente.
    console.log('[ASAAS WEBHOOK AUTH]', JSON.stringify({
      headerExiste: tk.diagnostico.tokenRecebidoExiste,
      envExiste: tk.diagnostico.tokenEsperadoExiste,
      tamanhoHeader: tk.diagnostico.tamanhoRecebido,
      tamanhoEnv: tk.diagnostico.tamanhoEsperado,
      iguais: tk.diagnostico.tokensIguais,
      impressaoHeader: tk.diagnostico.impressaoRecebido,
      impressaoEnv: tk.diagnostico.impressaoEsperado,
      headerUsado: headerAsaas ? 'asaas-access-token' : headerAlt ? 'access-token' : 'nenhum',
      headersDeAutenticacaoRecebidos: Array.from(request.headers.keys()).filter(k => /token|auth/i.test(k)),   // so os NOMES
      vercelEnv: process.env.VERCEL_ENV || null,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
      resultado: tk.ok ? 'aceito' : 'recusado (401)',
      motivo: tk.motivo || null,
    }))
    if (!tk.ok) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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
