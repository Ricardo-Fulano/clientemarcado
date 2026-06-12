import urllib.request, json
# Ler arquivo atual
with open('app/painel/agendamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()
print('Atual linhas:', c.count(chr(10)))
print('Tem bsAg:', 'bsAg' in c)
print('Tem fil-scroll:', 'fil-scroll' in c)
print('Tem Resgatar:', 'Resgatar' in c)
