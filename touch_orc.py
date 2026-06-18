with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Adicionar espaco invisivel no final para forcar mudanca
c = c.rstrip() + '\n'

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Feito')
