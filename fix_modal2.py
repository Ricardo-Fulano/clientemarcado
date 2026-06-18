with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Modal esta APOS o fechamento do return+function
# Final atual: ...    )}\n  )\n}\n
# O modal comeca em {modalPagOrc&&(
# Precisa estar DENTRO da div principal do return

# Encontrar onde o modal comeca
idx = c.find('    {modalPagOrc&&(')
print('Modal em idx:', idx)
print('Total chars:', len(c))

# Extrair o bloco do modal (do inicio ate o fim)
modal_block = c[idx:]
print('Modal block inicio:', repr(modal_block[:50]))

# Remover o modal de onde esta
c_sem_modal = c[:idx]
print('Fim sem modal:', repr(c_sem_modal[-100:]))

# Agora inserir antes do fechamento da div principal
# O return termina com: \n  )\n}
# A div principal termina com: </div>\n  )\n}
old_end = '  )\n}\n'
# Inserir modal antes do fechamento da div principal e do return
new_end = '    ' + modal_block.strip() + '\n    </div>\n  )\n}\n'
print('old_end encontrado:', c_sem_modal.endswith(old_end))

# Remover o ultimo </div> duplicado que sera adicionado
# A div principal ja existe - so precisa fechar com modal dentro
if c_sem_modal.endswith('  )\n}\n'):
    c_fixed = c_sem_modal[:-len('  )\n}\n')] + '    ' + modal_block.strip() + '\n  )\n}\n'
    with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
        f.write(c_fixed)
    print('SALVO! Linhas:', c_fixed.count(chr(10)))
else:
    print('Padrao nao encontrado, final:')
    print(repr(c_sem_modal[-200:]))
