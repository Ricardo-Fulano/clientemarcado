with open('app/painel/pagamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Adicionar classe fil-pag no CSS
old_css = ".pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;flex-shrink:0;transition:all .18s;font-family:inherit}"
new_css = ".pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;flex-shrink:0;transition:all .18s;font-family:inherit}.fil-pag{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;width:100%}.fil-pag .pill{flex:1 1 calc(33% - 8px);text-align:center;justify-content:center;display:flex;align-items:center}@media(max-width:480px){.fil-pag .pill{flex:1 1 calc(50% - 8px)}}"

print('Achou CSS:', old_css in c)
c = c.replace(old_css, new_css, 1)

# 2. Trocar div dos filtros para usar classe fil-pag
old_div = "          <div style={{display:'flex',gap:'6px',overflowX:'auto',scrollbarWidth:'none' as any,paddingBottom:'4px',marginBottom:'20px'}}>"
new_div = '          <div className="fil-pag">'
print('Achou div:', old_div in c)
c = c.replace(old_div, new_div, 1)

with open('app/painel/pagamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
