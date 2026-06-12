import os, sys

# Escrever o script de construcao no disco
script = r'''
import sys
sys.path.insert(0, '.')

with open('/mnt/user-data/uploads/page.tsx', 'r', encoding='utf-8-sig') as f:
    original = f.read()
'''

print('Linhas atual:', open('app/painel/agendamentos/page.tsx', encoding='utf-8').read().count(chr(10)))
