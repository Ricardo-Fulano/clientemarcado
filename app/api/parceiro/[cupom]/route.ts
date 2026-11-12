import { NextResponse } from 'next/server'

// A URL de cupom e publica e NAO e credencial de acesso.
// Endpoint legado desativado para impedir consulta de estatisticas financeiras
// sem login. Use GET /api/afiliado com Bearer token autenticado; o servidor
// resolve parceiros.user_id a partir do usuario validado.
export async function GET() {
  return NextResponse.json(
    { error: 'Painel antigo desativado. Acesse /painel/afiliado com sua conta MiniPage.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } }
  )
}
