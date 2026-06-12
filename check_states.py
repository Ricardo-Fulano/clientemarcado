with open('app/painel/cobrancas/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Ver estados disponiveis
import re
states = re.findall(r'const \[(\w+),set\w+\]=useState', c)
print('States:', states)
