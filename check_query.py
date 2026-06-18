with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    c = f.read()
for i,l in enumerate(c.split('\n')):
    if 'agendamentos' in l and 'select' in l:
        print(i+1, repr(l.strip()))
