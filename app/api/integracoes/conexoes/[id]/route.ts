import { executarRotaConexoes } from '@/app/lib/integracoes/rotas-conexoes'

// PATCH: pausar, reativar, ativar, renomear, encerrar token anterior. DELETE: remove (revoga) a conexao.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Contexto = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, contexto: Contexto) {
  const { id } = await contexto.params
  return executarRotaConexoes(request, { id })
}
export async function DELETE(request: Request, contexto: Contexto) {
  const { id } = await contexto.params
  return executarRotaConexoes(request, { id })
}
