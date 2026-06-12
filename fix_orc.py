with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()
old1 = "    setOrcamentos(data||[])"
c = c.replace(old1, "    setOrcamentos((data||[]).filter((o:any)=>o.origem!=='cobranca_manual'))", 1)
old2 = "      observacoes:observacoes||null,updated_at:new Date().toISOString(),"
c = c.replace(old2, old2 + "\n      origem:'orcamento',", 1)
print('filtro:', "o.origem!='cobranca_manual'" in c or "cobranca_manual" in c)
with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
