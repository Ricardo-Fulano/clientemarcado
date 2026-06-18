with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()
# Ver as ultimas 20 linhas
lines = c.split('\n')
for i, l in enumerate(lines[-20:]):
    print(len(lines)-20+i, repr(l))
