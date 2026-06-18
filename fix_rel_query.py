with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Remover campos que nao existem na tabela agendamentos
old = "      supabase.from('agendamentos').select('id,profissional_id,cliente_nome,servico_id,servico_nome,servicos(id,nome,preco),data_hora,status,valor,valor_total').eq('user_id',user.id).order('data_hora',{ascending:false}),"
new = "      supabase.from('agendamentos').select('id,profissional_id,cliente_nome,servicos(id,nome,preco),data_hora,status,valor').eq('user_id',user.id).order('data_hora',{ascending:false}),"
print('achou:', old in c)
c = c.replace(old, new, 1)

with open('app/painel/relatorio/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
