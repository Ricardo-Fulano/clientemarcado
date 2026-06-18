with open('app/painel/financeiro/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Modal esta apos o fechamento da div principal
# Linha 451: '    </div>'  <- fecha div psb-main
# Linha 452: '{pagSel&&('  <- modal FORA

# Mover modal para dentro da div principal
old = '\n    </div>\n    {pagSel&&('
new = '\n    {pagSel&&('
print('Achou:', old in c)
c = c.replace(old, new, 1)

# O modal termina com )}\n  )\n}\n - adicionar </div> antes de )\n}
old2 = '    )}\n  )\n}\n'
new2 = '    )}\n    </div>\n  )\n}\n'
print('Achou2:', old2 in c)
c = c.replace(old2, new2, 1)

with open('app/painel/financeiro/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
