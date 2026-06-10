
with open('app/painel/agendamentos/novo/page.tsx', encoding='utf-8') as f:
    c = f.read()

old = '    if(err.length){setErros(err);return}\n    setErros([]);setSalvando(true)'
new = "    if(err.length){setErros(err);return}\n\n    const agora=new Date()\n    const hojeISO=agora.getFullYear()+'-'+String(agora.getMonth()+1).padStart(2,'0')+'-'+String(agora.getDate()).padStart(2,'0')\n    if(data<hojeISO){setErros(['Nao e possivel agendar em uma data que ja passou.']);return}\n    if(data===hojeISO){\n      const minAgora=agora.getHours()*60+agora.getMinutes()\n      const [hh,mm]=hora.split(':').map(Number)\n      if((hh*60+mm)<=minAgora){setErros(['Nao e possivel agendar em um horario que ja passou.']);return}\n    }\n\n    setErros([]);setSalvando(true)"

print('Achou:', old in c)
c = c.replace(old, new, 1)
print('Aplicou:', 'hojeISO' in c)
print('Linhas:', c.count(chr(10)))

with open('app/painel/agendamentos/novo/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
