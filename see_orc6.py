with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    lines = f.read().split('\n')

# Ver ate onde vai o bloco isOdonto
for i in range(748, 820):
    print(i+1, repr(lines[i][:80]))
