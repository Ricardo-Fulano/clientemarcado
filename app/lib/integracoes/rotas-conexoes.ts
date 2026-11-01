import { tratarConexoes, type RotaConexoes } from './conexoes'
import { criarDepsConexoesSupabase } from './deps-conexoes-supabase'

// Liga as rotas do Next a logica (tratarConexoes). Os arquivos route.ts so chamam esta funcao.
export async function executarRotaConexoes(request: Request, rota: RotaConexoes): Promise<Response> {
  const r = await tratarConexoes(request, rota, criarDepsConexoesSupabase())
  console.log(JSON.stringify(r.log))
  return Response.json(r.corpo, { status: r.status, headers: { 'Cache-Control': 'no-store' } })
}
