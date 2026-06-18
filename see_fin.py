with open('app/painel/financeiro/page.tsx', encoding='utf-8') as f:
    lines = f.read().split('\n')
for i in range(445, 458):
    print(i+1, repr(lines[i]))
