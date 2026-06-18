with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Ver CSS mobile e estrutura do form
lines = c.split('\n')
# CSS mobile
for i,l in enumerate(lines):
    if 'cm-form-pad' in l or 'cm-lista-pad' in l or 'padding:' in l and 'mobile' in c[max(0,c.find(l)-200):c.find(l)]:
        print(i+1, repr(l))

print('---FORM---')
# Bloco odonto toggle
for i,l in enumerate(lines):
    if 'usarOdontograma' in l or 'odontologico' in l.lower() or 'tipoOrc' in l:
        print(i+1, l.rstrip())

print('---PADDING---')
# Padding do container do form
for i,l in enumerate(lines):
    if 'padding:' in l and ('32px' in l or '24px' in l) and 'maxWidth' in c[max(0,i*50-200):i*50+200]:
        print(i+1, l.rstrip())
