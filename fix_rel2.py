with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Ver o nomeMes atual
import re
m = re.search(r'const nomeMes=.+', c)
print('nomeMes atual:', m.group() if m else 'NAO ENCONTRADO')

# Fix nomeMes
old = "const nomeMes=new Date(mes+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})"
new = "const [_nmd,_nma]=new Date(mes+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).split(' de ');const nomeMes=_nmd+' de '+_nma"
print('Achou:', old in c)
c = c.replace(old, new, 1)

# Fix nomeMesSel
old2 = "const nomeMesSel=new Date(mes+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})"
new2 = "const [_nmd2,_nma2]=new Date(mes+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).split(' de ');const nomeMesSel=_nmd2+' de '+_nma2"
c = c.replace(old2, new2, 1)

print('nomeMes fix:', 'split' in c)
with open('app/painel/relatorio/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
