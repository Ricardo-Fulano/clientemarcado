import os

for path in [
    'app/painel/orcamentos/page.tsx',
    'app/painel/pagamentos/page.tsx', 
    'app/painel/relatorio/page.tsx'
]:
    with open(path, encoding='utf-8') as f:
        c = f.read()
    print(f'\n=== {path} ===')
    # Buscar trechos relevantes
    for kw in ['pagamentos', 'from(\'pag', 'receita', 'valor', 'data_pagamento', 'created_at', 'insert', 'select']:
        lines = [l.strip() for l in c.split('\n') if kw in l.lower() and len(l.strip()) < 120]
        if lines:
            print(f'  [{kw}]: {lines[0]}')
