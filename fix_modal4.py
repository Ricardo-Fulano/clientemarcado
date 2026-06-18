with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

modal_start = c.find('\n    {modalPagOrc&&(')
modal_block = c[modal_start:]
c_sem = c[:modal_start]

suffix = '\n          )\n        })()}\n      </div>\n    </div>'
print('Suffix ok:', c_sem.endswith(suffix))
print('modal_start:', modal_start)

if c_sem.endswith(suffix):
    body = c_sem[:-len(suffix)]
    modal_content = modal_block.split('{modalPagOrc&&(', 1)[1]
    # Remover o fechamento errado do final do modal
    modal_content = modal_content.rsplit('\n  )\n}\n', 1)[0]
    
    c_fixed = (body + suffix +
               '\n    {modalPagOrc&&(' + modal_content +
               '\n  )\n}\n')
    
    print('Linhas:', c_fixed.count(chr(10)))
    with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
        f.write(c_fixed)
    print('SALVO!')
else:
    print('ERRO - suffix:', repr(c_sem[-100:]))
