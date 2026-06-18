with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. CSS: reduzir padding mobile e melhorar form-inner
old1 = "    .cm-lista-pad,.cm-form-pad,.cm-detalhe-pad{padding:8px 8px 130px!important}\n    .cm-filtros-wrap{display:flex!important;flex-wrap:wrap!important;overflow:visible!important;width:100%!important;max-width:100%!important;gap:8px!important}\n    .cm-form-inner{padding:12px!important}"
new1 = "    .cm-lista-pad,.cm-form-pad,.cm-detalhe-pad{padding:8px 8px 140px!important}\n    .cm-filtros-wrap{display:flex!important;flex-wrap:wrap!important;overflow:visible!important;width:100%!important;max-width:100%!important;gap:8px!important}\n    .cm-form-inner{padding:0!important}\n    .cm-form-topo{margin-bottom:12px!important}\n    .cm-form-titulo{font-size:20px!important;margin-bottom:2px!important}"
print('1 css:', old1 in c)
c = c.replace(old1, new1, 1)

# 2. Container form - padding menor
old2 = "            <div style={{padding:'16px 20px 60px',maxWidth:'1100px',margin:'0 auto'}}>"
new2 = "            <div style={{padding:'12px 12px 60px',maxWidth:'1100px',margin:'0 auto'}}>"
print('2 container:', old2 in c)
c = c.replace(old2, new2, 1)

# 3. Topo do form - menos espaco vertical
old3 = "                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>"
new3 = "                <div className=\"cm-form-topo\" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>"
print('3 topo:', old3 in c)
c = c.replace(old3, new3, 1)

# 4. Item servico - padding interno menor
old4 = "                        <div key={idx} style={{marginBottom:'12px',padding:'14px',background:'rgba(255,255,255,.04)',borderRadius:'12px',border:'1px solid rgba(148,163,184,.12)',width:'100%',boxSizing:'border-box'}}>"
new4 = "                        <div key={idx} style={{marginBottom:'10px',padding:'12px 10px',background:'rgba(255,255,255,.04)',borderRadius:'12px',border:'1px solid rgba(148,163,184,.12)',width:'100%',boxSizing:'border-box'}}>"
print('4 item:', old4 in c)
c = c.replace(old4, new4, 1)

# 5. Card principal - padding menor
old5 = "  const card:React.CSSProperties={background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',borderRadius:'16px',padding:'20px 24px',marginBottom:'12px',border:'1px solid rgba(148,163,184,.14)',boxShadow:'0 4px 20px rgba(0,0,0,.3)'}"
new5 = "  const card:React.CSSProperties={background:'radial-gradient(circle at top left,rgba(124,58,237,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',borderRadius:'16px',padding:'16px',marginBottom:'10px',border:'1px solid rgba(148,163,184,.14)',boxShadow:'0 4px 20px rgba(0,0,0,.3)'}"
print('5 card:', old5 in c)
c = c.replace(old5, new5, 1)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
