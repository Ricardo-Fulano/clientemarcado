with open('app/painel/agendamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Ajustar apenas a classe .fil-scroll no CSS
old = ".fil-scroll{display:flex;align-items:center;gap:6px;margin-bottom:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}"
new = ".fil-scroll{display:flex;align-items:center;gap:8px;margin-bottom:14px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:0 0 6px 0;max-width:100%;width:100%}"

print('Achou CSS:', old in c)
c = c.replace(old, new, 1)

# Garantir flex-shrink:0 e white-space:nowrap em todos os botoes de filtro
# Os botoes ja tem flexShrink:0 e whiteSpace:'nowrap' - verificar
print('flexShrink ja presente:', 'flexShrink:0' in c)
print('whiteSpace nowrap presente:', "whiteSpace:'nowrap'" in c)

# Garantir que o select tambem tenha min-width adequado
old_sel = "style={{height:32,background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.16)',borderRadius:8,padding:'0 10px',fontSize:11,color:'#CBD5E1',fontFamily:'inherit',cursor:'pointer',outline:'none',flexShrink:0}}"
new_sel = "style={{height:32,background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.16)',borderRadius:8,padding:'0 10px',fontSize:11,color:'#CBD5E1',fontFamily:'inherit',cursor:'pointer',outline:'none',flexShrink:0,minWidth:180}}"
print('Achou select:', old_sel in c)
c = c.replace(old_sel, new_sel, 1)

with open('app/painel/agendamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
