with open('app/painel/servicos/page.tsx', encoding='utf-8') as f:
    c = f.read()

old = "    setFDur(s.duracao||'30 min')"
new = "    const durVal=s.duracao||s.duracao_minutos;setFDur(durVal?String(durVal).includes('min')?String(durVal):String(durVal)+' min':'30 min')"

print('Achou:', old in c)
c = c.replace(old, new, 1)
print('Fix:', 'includes' in c)
with open('app/painel/servicos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
