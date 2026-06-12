src = open(r'C:\Users\proft\Downloads\clientes-page.tsx', encoding='utf-8').read()
open('app/painel/clientes/page.tsx', 'w', encoding='utf-8').write(src)
print('Linhas:', src.count(chr(10)))
