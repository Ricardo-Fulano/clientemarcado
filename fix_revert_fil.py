with open('app/painel/agendamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Reverter a adicao do </div> extra que quebrou o JSX
c = c.replace('</div></div>\n          {view===\'hoje\'', '</div>\n          {view===\'hoje\'')
c = c.replace('<div className="fil-wrap"><div className="fil-scroll">', '<div className="fil-scroll">')

print('fil-wrap removido:', 'fil-wrap' not in c)
with open('app/painel/agendamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
