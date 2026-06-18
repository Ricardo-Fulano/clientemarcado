with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    lines = f.read().split('\n')
# Ver inicio do form e CSS mobile
for i,l in enumerate(lines):
    if any(k in l for k in ['cm-form-pad','cm-lista-pad','padding:','maxWidth','view===.form']):
        if i < 50 or 'form' in l.lower() or 'pad' in l.lower():
            print(i+1, repr(l[:100]))
