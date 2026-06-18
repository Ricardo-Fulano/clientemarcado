with open('app/painel/pagamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()
# Ver campos usados no insert e select
import re
inserts = [l.strip() for l in c.split('\n') if 'insert' in l or 'from(' in l.lower()]
for l in inserts[:10]: print('PAG:', l)
print('---')
with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    r = f.read()
rel = [l.strip() for l in r.split('\n') if 'pagamento' in l.lower() or 'receita' in l.lower() or 'data' in l.lower()]
for l in rel[:15]: print('REL:', l)
