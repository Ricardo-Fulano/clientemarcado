import os, pathlib

if not os.path.exists('app/cadastro/page.tsx'):
    print("ERRO: Execute dentro de clientemarcado!"); import sys; sys.exit(1)

# ── 1. Criar rota auth/callback sem dependências externas ──
pathlib.Path('app/auth/callback').mkdir(parents=True, exist_ok=True)

ROUTE = """import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  // O Supabase processa automaticamente o token via PKCE no cliente.
  // Apenas redirecionar para o painel; o cliente detectará a sessão.
  return NextResponse.redirect(`${origin}/painel`)
}
"""
with open('app/auth/callback/route.ts', 'w', encoding='utf-8') as f:
    f.write(ROUTE)
print('route.ts criado')

# ── 2. Corrigir emailRedirectTo no cadastro ──
with open('app/cadastro/page.tsx', encoding='utf-8') as f:
    c = f.read()

OLD = """    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'https://clientemarcado.vercel.app/auth/callback'
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: redirectTo,
        data: { nome_negocio: nomeNegocio, tipo_negocio: tipoNegocio, nome_usuario: nomeUsuario, cupom_indicacao: cupom || null }
      }
    })"""

NEW = """    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'https://clientemarcado.vercel.app/auth/callback'
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: redirectTo,
        data: { nome_negocio: nomeNegocio, tipo_negocio: tipoNegocio, nome_usuario: nomeUsuario, cupom_indicacao: cupom || null }
      }
    })"""

print('OLD found:', OLD in c)
c = c.replace(OLD, NEW, 1)
with open('app/cadastro/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('cadastro corrigido')
print('emailRedirectTo:', 'emailRedirectTo' in c)
