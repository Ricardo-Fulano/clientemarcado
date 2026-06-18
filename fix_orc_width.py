with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Reduzir padding do container do form no mobile
old = "    .cm-lista-pad,.cm-form-pad,.cm-detalhe-pad{padding:12px 12px 130px!important}"
new = "    .cm-lista-pad,.cm-form-pad,.cm-detalhe-pad{padding:8px 8px 130px!important}"
print('1:', old in c)
c = c.replace(old, new, 1)

# 2. Container do form - reduzir padding lateral desktop tambem
old2 = "            <div style={{padding:'24px 32px 60px',maxWidth:'1100px',margin:'0 auto'}}>"
new2 = "            <div style={{padding:'16px 20px 60px',maxWidth:'1100px',margin:'0 auto'}}>"
print('2:', old2 in c)
c = c.replace(old2, new2, 1)

# 3. Inner padding
old3 = "              <div style={{padding:'24px',width:'100%',boxSizing:'border-box' as const}}>"
new3 = "              <div style={{padding:'0px',width:'100%',boxSizing:'border-box' as const}}>"
print('3:', old3 in c)
c = c.replace(old3, new3, 1)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
