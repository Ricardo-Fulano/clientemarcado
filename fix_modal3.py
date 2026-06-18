with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Estrutura atual (errada):
#   </div>   <- fecha div principal do return
#   )        <- fecha return  (linha 1051)
# }          <- fecha function (linha 1052)
# {modalPagOrc&&(...)}  <- modal FORA

# Encontrar onde o modal comeca e extrair
modal_start = c.find('\n    {modalPagOrc&&(')
modal_block = c[modal_start:]  # '\n    {modalPagOrc&&(\n...\n    )}\n  )\n}\n'
c_sem = c[:modal_start]  # tudo antes do modal

# c_sem termina com:  \n  )\n}\n  (return + function close)
# Precisamos inserir o modal ANTES do  \n  )\n}
suffix = '\n  )\n}\n'
if c_sem.endswith(suffix):
    body = c_sem[:-len(suffix)]
    modal_clean = '\n    {modalPagOrc&&(' + modal_block.split('{modalPagOrc&&(', 1)[1]
    # modal_clean termina com )}\n  )\n}\n - remover o )\n}\n do final
    modal_clean = modal_clean.replace('\n  )\n}\n', '')
    c_fixed = body + modal_clean + suffix
    print('Linhas antes:', c.count(chr(10)))
    print('Linhas depois:', c_fixed.count(chr(10)))
    print('Modal dentro:', '{modalPagOrc&&(' in c_fixed[:-200])
    with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
        f.write(c_fixed)
    print('SALVO!')
else:
    print('Suffix nao encontrado')
    print(repr(c_sem[-50:]))
