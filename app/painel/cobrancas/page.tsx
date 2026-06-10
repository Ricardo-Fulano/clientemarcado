
with open('app/painel/cobrancas/page.tsx', encoding='utf-8') as f:
    c = f.read()

old = "        status,vencimento:mVenc||null,\n        observacoes:mObs.trim()||null,"
new = "        status,vencimento:mVenc||null,\n        observacoes:mObs.trim()||null,\n        origem:'cobranca_manual',"

print('Achou cob:', old in c)
c = c.replace(old, new, 1)
print('Fix cob:', "origem:'cobranca_manual'" in c)

with open('app/painel/cobrancas/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK cobrancas')
