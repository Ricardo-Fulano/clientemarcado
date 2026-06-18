with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Ver exatamente como agsMes e agsRealizados estao sendo calculados
lines = c.split('\n')
for i,l in enumerate(lines):
    if any(k in l for k in ['agsMes','agsRealizados','STATUS_OK','servicosMap','nomeSv','data_hora']):
        print(i+1, l.rstrip())
