with open('app/painel/cobrancas/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Descobrir qual funcao de toast existe
import re
fns = re.findall(r'function (\w+)', c)
print('Funcoes:', fns)
states = [l.strip() for l in c.split('\n') if 'Toast' in l or 'toast' in l or 'msg' in l.lower()[:30]]
print('Toast lines:', states[:10])
