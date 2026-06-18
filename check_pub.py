with open('app/[slug]/page.tsx', encoding='utf-8') as f:
    c = f.read()

print('CTA:', 'Pronto para escolher' in c)
print('Duracao:', '{s.duracao}' in c)
print('Rodape:', 'Agendamento via' in c)
