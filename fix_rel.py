with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. useEffect dependente de mes
c = c.replace(
    "useEffect(()=>{load()},[])",
    "useEffect(()=>{load()},[mes])"
)

# 2. despesas com tratamento de erro
c = c.replace(
    "      supabase.from('despesas').select('valor,data,categoria').eq('user_id',user.id),",
    "      supabase.from('despesas').select('valor,data,categoria').eq('user_id',user.id).then(r=>{if(r.error)console.error('Despesas:',r.error);return{data:r.data||[]}}),",
)

# 3. nomeMes sem maiuscula no "de"
c = c.replace(
    "const nomeMes=new Date(mes+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})",
    "const nomeMes=(()=>{const d=new Date(mes+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return d.charAt(0).toUpperCase()+d.slice(1).replace(' De ',' de ').replace(' de ',' de ')})()"
)

# 4. nomeMesSel sem maiuscula no "de"
c = c.replace(
    "const nomeMesSel=new Date(mes+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})",
    "const nomeMesSel=(()=>{const d=new Date(mes+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return d.charAt(0).toUpperCase()+d.slice(1).replace(' De ',' de ')})()"
)

print('useEffect mes:', 'useEffect(()=>{load()},[mes])' in c)
print('despesas fix:', 'console.error' in c)
print('nomeMes fix:', 'replace' in c)

with open('app/painel/relatorio/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
