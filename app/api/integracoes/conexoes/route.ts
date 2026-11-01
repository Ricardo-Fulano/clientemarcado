import { executarRotaConexoes } from '@/app/lib/integracoes/rotas-conexoes'

// GET: lista as conexoes do usuario logado. POST: cria uma conexao (devolve o token UMA unica vez).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  return executarRotaConexoes(request, {})
}
export async function POST(request: Request) {
  return executarRotaConexoes(request, {})
}
