with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    lines = f.read().split('\n')

# CSS mobile - primeiras 60 linhas
for i in range(0, 60):
    print(i+1, repr(lines[i][:100]))
