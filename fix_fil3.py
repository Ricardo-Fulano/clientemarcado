with open('app/painel/agendamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Adicionar classe fil-wrap que quebra o overflow do pai
old = ".fil-scroll{display:flex;align-items:center;gap:8px;margin-bottom:14px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:0 0 6px 0;max-width:100%;width:100%}"
new = ".fil-wrap{margin:0 -14px 14px;overflow:hidden}.fil-scroll{display:flex;align-items:center;gap:8px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:0 14px 6px;width:100%}.fil-scroll::-webkit-scrollbar{display:none}"

print('Achou:', old in c)
c = c.replace(old, new, 1)

# Envolver o div dos filtros com fil-wrap
old_div = '<div className="fil-scroll">'
new_div = '<div className="fil-wrap"><div className="fil-scroll">'
c = c.replace(old_div, new_div, 1)

# Fechar o fil-wrap apos o select
old_sel_end = "</select>\n          </div>"
# Nao alterar aqui - fechar logo apos o div da fil-scroll
# Localizar o fechamento correto
import re
# O fil-scroll termina antes do {view==='hoje'
old_after = "</div>\n          {view==='hoje'"
new_after = "</div></div>\n          {view==='hoje'"
c = c.replace(old_after, new_after, 1)

print('fil-wrap:', 'fil-wrap' in c)
with open('app/painel/agendamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
