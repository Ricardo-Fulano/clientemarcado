with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# O modal foi inserido apos o fechamento do return/function
# Precisa estar DENTRO do return, antes do fechamento da div principal
# Verificar estrutura atual no final do arquivo
print(c[-800:])
