
with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Filtro no carregarOrcamentos
old1 = "    setOrcamentos((data||[]).filter((o:any)=>o.origem!=='cobranca_manual'))"
new1 = "    setOrcamentos((data||[]).filter((o:any)=>o.origem!=='cobranca_manual'))"
print('Achou filtro:', old1 in c)
c = c.replace(old1, new1, 1)
print('Fix filtro:', "o.origem!=='cobranca_manual'" in c)

# origem no insert
old2 = "      observacoes:observacoes||null,updated_at:new Date().toISOString(),
      origem:'orcamento',"
new2 = "      observacoes:observacoes||null,updated_at:new Date().toISOString(),\n      origem:'orcamento',"
print('Achou insert:', old2 in c)
c = c.replace(old2, new2, 1)
print("Fix insert:", "origem:'orcamento'" in c)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK orcamentos')
