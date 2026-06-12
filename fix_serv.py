with open('app/painel/servicos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Fix 1: remover profissionais_ids do payload (coluna nao existe)
c = c.replace(
    "      profissional_nome:profNome,\n      profissionais_ids:fProfTipo==='especificos'?fProfIds:null,",
    "      profissional_nome:profNome,"
)

# Fix 2: duracao e integer - converter "30 min" para numero
# Salvar duracao_minutos no lugar de duracao
c = c.replace(
    "      duracao:fDur,",
    "      duracao_minutos:parseInt(fDur)||null,duracao:parseInt(fDur)||null,"
)

print('profissionais_ids removido:', 'profissionais_ids' not in c)
print('duracao fix:', 'parseInt(fDur)' in c)
with open('app/painel/servicos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
