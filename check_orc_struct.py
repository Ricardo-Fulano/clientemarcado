with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Verificar estrutura atual
print('handleRegistrarPagamento:', 'handleRegistrarPagamento' in c)
print('orcamento_pagamentos:', 'orcamento_pagamentos' in c)
print('showPagForm:', 'showPagForm' in c)
print('pagValor:', 'pagValor' in c)
print('Cards mobile botoes:', 'Ver detalhes' in c)
print('Desktop acoes:', 'gridTemplateColumns' in c)
