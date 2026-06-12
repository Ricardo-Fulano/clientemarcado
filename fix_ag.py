src = open(r'C:\Users\proft\Downloads\agendamentos-page.tsx', encoding='utf-8').read()
open('app/painel/agendamentos/page.tsx', 'w', encoding='utf-8').write(src)
print('Linhas:', src.count(chr(10)))
