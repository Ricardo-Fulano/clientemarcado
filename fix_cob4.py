with open('app/painel/cobrancas/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Adicionar classe fil-cob e media query para forcar 2 colunas no mobile
old_css = ".pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;transition:all .18s;font-family:inherit}"
new_css = ".pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;transition:all .18s;font-family:inherit}.fil-cob{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;width:100%}.fil-cob .pill{flex:1 1 calc(33% - 8px);text-align:center;justify-content:center;display:flex;align-items:center}@media(max-width:480px){.fil-cob .pill{flex:1 1 calc(50% - 8px)}}"

print('Achou CSS:', old_css in c)
c = c.replace(old_css, new_css, 1)

# Trocar o div dos filtros para usar classe fil-cob
old_div = '          <div style={{display:\'flex\',gap:\'8px\',flexWrap:\'wrap\',marginBottom:\'20px\'}}>'
new_div = '          <div className="fil-cob">'
print('Achou div:', old_div in c)
c = c.replace(old_div, new_div, 1)

with open('app/painel/cobrancas/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
