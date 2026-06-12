c = open('app/painel/agendamentos/page.tsx', encoding='utf-8').read()
bt = chr(96)
dq = chr(34)
old1 = '{+chr(96)+' + chr(8) + 's-ovl\\+chr(96)+}'
old2 = '{+chr(96)+' + chr(8) + 's\\+chr(96)+}'
new1 = '{' + bt + 'bs-ovl' + bt + '}'
new2 = '{' + bt + 'bs' + bt + '}'
print('Achou1:', old1 in c)
print('Achou2:', old2 in c)
c = c.replace(old1, new1).replace(old2, new2)
open('app/painel/agendamentos/page.tsx', 'w', encoding='utf-8').write(c)
print('OK')
