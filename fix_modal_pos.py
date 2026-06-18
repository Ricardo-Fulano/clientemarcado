with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# O problema: modal foi inserido apos "  )\n}" que fecha o return+function
# Estrutura atual errada:
#   ...
#   </div>      <- fecha div principal
#   )           <- fecha return
# }             <- fecha function
# {modalPagOrc&&(...)}  <- FORA do return!

# Correcao: mover o modal para dentro da div principal, antes do fechamento
old = "    </div>\n  )\n}\n    {modalPagOrc&&("
new = "    </div>\n    {modalPagOrc&&("
print('Padrao 1:', old in c)

if old in c:
    c = c.replace(old, new, 1)
    # Agora o fechamento do modal precisa fechar corretamente
    # O modal termina com:  )}\n  )\n}
    old2 = "    )}\n  )\n}"
    new2 = "    )}\n  </div>\n  )\n}"
    print('Padrao 2:', old2 in c)
    c = c.replace(old2, new2, 1)
else:
    # Tentar outro padrao
    print('Tentando outro padrao...')
    print(repr(c[-200:]))

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
