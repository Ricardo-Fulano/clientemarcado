with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Corrigir container de filtros - remover overflow-x auto e adicionar flex-wrap
old = "              <div className=\"cm-filtros-wrap\" style={{display:'flex',gap:'6px',marginBottom:'16px',flexWrap:'wrap'}}>"
new = "              <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap',width:'100%',maxWidth:'100%',overflow:'visible'}}>"
print('Achou filtros wrap:', old in c)
c = c.replace(old, new, 1)

# Corrigir botoes de filtro - remover white-space nowrap e ajustar padding mobile
old_btn = """                    style={{padding:'7px 14px',borderRadius:'999px',fontSize:'12px',fontWeight:600,cursor:'pointer',border:'1px solid',fontFamily:'inherit',whiteSpace:'nowrap' as const,
                      background:filtroStatus===s?'linear-gradient(135deg,#3B82F6,#7C3AED)':'rgba(255,255,255,.06)',
                      color:filtroStatus===s?'#fff':'#94A3B8',
                      borderColor:filtroStatus===s?'transparent':'rgba(255,255,255,.12)'}}>"""
new_btn = """                    style={{padding:'8px 14px',borderRadius:'999px',fontSize:'12px',fontWeight:600,cursor:'pointer',border:'1px solid',fontFamily:'inherit',minHeight:'36px',
                      background:filtroStatus===s?'linear-gradient(135deg,#3B82F6,#7C3AED)':'rgba(255,255,255,.06)',
                      color:filtroStatus===s?'#fff':'#94A3B8',
                      borderColor:filtroStatus===s?'transparent':'rgba(255,255,255,.12)'}}>"""
print('Achou btn:', old_btn in c)
c = c.replace(old_btn, new_btn, 1)

# Corrigir CSS global - garantir que cm-filtros-wrap nao use overflow-x auto no mobile
old_css = "    .cm-filtros-wrap{overflow-x:auto;flex-wrap:nowrap!important;padding-bottom:4px}"
new_css = "    .cm-filtros-wrap{display:flex!important;flex-wrap:wrap!important;overflow:visible!important;width:100%!important;max-width:100%!important;gap:8px!important}"
print('Achou css:', old_css in c)
c = c.replace(old_css, new_css, 1)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
