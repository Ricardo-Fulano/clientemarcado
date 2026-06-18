with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    lines = f.read().split('\n')
for i in range(110, 145):
    print(i+1, repr(lines[i]))
