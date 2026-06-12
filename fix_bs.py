with open('app/painel/agendamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

old1 = 'className=s-ovl} onClick={()=>setBsAg(null)}/>'
new1 = 'className={s-ovl} onClick={()=>setBsAg(null)}/>'
old2 = 'className=s}>'
new2 = 'className={s}>'

print('Achou 1:', old1 in c)
print('Achou 2:', old2 in c)
c = c.replace(old1, new1).replace(old2, new2)
print('Depois 1:', new1 in c)
print('Depois 2:', new2 in c)

with open('app/painel/agendamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
