with open('app/painel/cobrancas/page.tsx', encoding='utf-8') as f:
    c = f.read()
c = c.replace("toastMsg('Cadastro manual de cobranca em breve.')", "alert('Cadastro manual de cobranca em breve.')")
with open('app/painel/cobrancas/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
