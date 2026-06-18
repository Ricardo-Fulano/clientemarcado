with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    lines = f.read().split('\n')
for i in range(988, 1000):
    print(i+1, repr(lines[i]))
