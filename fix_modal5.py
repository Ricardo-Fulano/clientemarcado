with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Mover modal para dentro da div principal
# Trocar:
#   \n    </div>\n    {modalPagOrc&&(
# Por:
#   \n    {modalPagOrc&&(
# E adicionar </div> depois do modal

old = '\n    </div>\n    {modalPagOrc&&('
new = '\n    {modalPagOrc&&('
print('Achou:', old in c)
c = c.replace(old, new, 1)

# Agora o modal termina com )}\n  )\n}\n
# Precisa fechar a div antes do )\n}\n
old2 = '    )}\n  )\n}\n'
new2 = '    )}\n    </div>\n  )\n}\n'
print('Achou2:', old2 in c)
c = c.replace(old2, new2, 1)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
