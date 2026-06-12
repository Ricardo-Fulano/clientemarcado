with open('app/painel/cobrancas/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Fix 1: filtros - trocar scroll por wrap
old = "          <div style={{display:'flex',gap:'6px',overflowX:'auto',scrollbarWidth:'none',paddingBottom:'4px',marginBottom:'20px'}}>"
new = "          <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'20px'}}>"
print('Achou filtros:', old in c)
c = c.replace(old, new, 1)

# Fix 2: pill - remover flex-shrink:0 que impede wrap
old2 = ".pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;flex-shrink:0;transition:all .18s;font-family:inherit}"
new2 = ".pill{padding:7px 14px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid rgba(148,163,184,.18);background:rgba(15,23,42,.86);color:#94A3B8;white-space:nowrap;transition:all .18s;font-family:inherit}"
print('Achou pill:', old2 in c)
c = c.replace(old2, new2, 1)

with open('app/painel/cobrancas/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
