import { executarRotaConexoes } from '@/app/lib/integracoes/rotas-conexoes'

// POST: gera um novo token (o atual continua aceito por 24 h) e o devolve UMA unica vez.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, contexto: { params: Promise<{ id: string }> }) {
  const { id } = await contexto.params
  return executarRotaConexoes(request, { id, sub: 'rotacionar' })
}
