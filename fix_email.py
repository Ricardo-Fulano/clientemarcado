with open('app/painel/agendamentos/novo/page.tsx', encoding='utf-8') as f:
    c = f.read()
old = 'cliente_whatsapp:wpp||null,cliente_email:cEmail||null,servico_id'
new = 'cliente_whatsapp:wpp||null,servico_id'
print('Achou:', old in c)
c = c.replace(old, new, 1)
print('Aplicou:', old not in c)
open('app/painel/agendamentos/novo/page.tsx', 'w', encoding='utf-8').write(c)
print('OK')
