import os, pathlib

# ── 1. Criar app/auth/callback/route.ts ──
pathlib.Path('app/auth/callback').mkdir(parents=True, exist_ok=True)

ROUTE = """import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/painel`)
}
"""

with open('app/auth/callback/route.ts', 'w', encoding='utf-8') as f:
    f.write(ROUTE)
print('route.ts criado')

# ── 2. Corrigir emailRedirectTo no cadastro ──
with open('app/cadastro/page.tsx', encoding='utf-8') as f:
    c = f.read()

OLD_SIGNUP = """    const redirectTo = typeof window !== 'undefined'
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

NEW_SIGNUP = """    const redirectTo = typeof window !== 'undefined'
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

print('OLD found:', OLD_SIGNUP in c)
c = c.replace(OLD_SIGNUP, NEW_SIGNUP, 1)

with open('app/cadastro/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('cadastro.tsx corrigido')
print('emailRedirectTo ok:', 'emailRedirectTo' in c)
