import { criarDepsSupabase } from '@/app/lib/integracoes/deps-supabase'
import { processarWebhook } from '@/app/lib/integracoes/processar'

// Webhook generico de plataformas externas de venda (Kiwify e outras): POST /api/integracoes/webhook/{provider}/{publicId}
// Tudo (assinatura, plano, idempotencia, merge) e decidido em processarWebhook + no banco. Aqui so ha a ligacao com o Next.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, contexto: { params: Promise<{ provider: string; publicId: string }> }) {
  const params = await contexto.params
  const r = await processarWebhook(request, params, criarDepsSupabase())
  console.log(JSON.stringify({ evt: 'integracoes_webhook', ...r.log }))
  return Response.json(r.corpo, { status: r.status, headers: { 'Cache-Control': 'no-store', ...(r.headers ?? {}) } })
}
