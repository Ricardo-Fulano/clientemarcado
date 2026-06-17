import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  // O Supabase processa automaticamente o token via PKCE no cliente.
  // Apenas redirecionar para o painel; o cliente detectará a sessão.
  return NextResponse.redirect(`${origin}/painel`)
}
