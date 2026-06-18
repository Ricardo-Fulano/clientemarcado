with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Separar o carregamento de pagamentos em funcao propria recarregavel por mes
# Verificar useEffect atual
effs = [l.strip() for l in c.split('\n') if 'useEffect' in l or 'carregarDados' in l or 'init' in l]
for e in effs[:10]: print(e)
print('---')
# Ver se o fetch de pagamentos esta dentro de um useEffect com dependencia de mes
idx = c.find('pagamentos')
print(c[max(0,idx-200):idx+200])
