# 1. Salvar o arquivo novo/page.tsx
import os
os.makedirs('app/painel/orcamentos/novo', exist_ok=True)
with open('app/painel/orcamentos/novo/page.tsx', 'w', encoding='utf-8') as f:
    f.write("""'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function NovoOrcamento() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/painel/orcamentos?novo=1')
  }, [router])
  return (
    <div style={{minHeight:'100vh',background:'#050B16',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <p style={{color:'#64748B',fontSize:'14px'}}>Carregando...</p>
    </div>
  )
}
""")
print('novo/page.tsx OK')

# 2. Fazer orcamentos/page.tsx ler o parametro ?novo=1 e abrir form
with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Adicionar useSearchParams e logica de abrir form
old_import = "import { useEffect, useState } from 'react'"
new_import = "import { useEffect, useState } from 'react'\nimport { useSearchParams } from 'next/navigation'"
print('Achou import:', old_import in c)
c = c.replace(old_import, new_import, 1)

# Adicionar useEffect para ler ?novo=1
old_effect = "  useEffect(()=>{init()},[])"
new_effect = """  const searchParams = useSearchParams()
  useEffect(()=>{init()},[])
  useEffect(()=>{
    if(searchParams.get('novo')==='1'){resetForm();setView('form')}
  },[searchParams])"""
print('Achou effect:', old_effect in c)
c = c.replace(old_effect, new_effect, 1)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('orcamentos/page.tsx OK')
