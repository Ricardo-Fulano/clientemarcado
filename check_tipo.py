import asyncio, sys
sys.path.insert(0, '.')

# Verificar direto no Supabase via JS - gerar script de verificacao
print('Execute no console do navegador (F12 > Console) em clientemarcado.vercel.app/painel:')
print("""
const { data: { user } } = await (await import('https://esm.sh/@supabase/supabase-js')).createClient(
  document.cookie, '').auth.getUser()
""")
print('Ou acesse o Supabase > Table Editor > perfis')
print('Verifique a coluna tipo_negocio do seu registro')
