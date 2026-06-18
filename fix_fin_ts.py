with open('app/painel/financeiro/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Corrigir style com color duplicado
old = "style={{ fontSize: '12px', color: '#64748B', marginTop: '8px', cursor: 'pointer', color: '#60A5FA' }}"
new = "style={{ fontSize: '12px', marginTop: '8px', cursor: 'pointer', color: '#60A5FA' }}"
print('Achou:', old in c)
c = c.replace(old, new)

with open('app/painel/financeiro/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
