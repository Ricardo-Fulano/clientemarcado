import base64, urllib.request
with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()
print('view odonto inicio:', c.find("view==='odonto'"))
print('view detalhe inicio:', c.find("view==='detalhe'"))
print('Total linhas:', c.count(chr(10)))
