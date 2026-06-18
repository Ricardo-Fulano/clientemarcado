with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Fix 1: expandir status aceitos
old1 = "  const agsRealizados=agsMes.filter(a=>a.status==='realizado'||a.status==='compareceu')"
new1 = "  const STATUS_OK=['realizado','Realizado','compareceu','concluido','concluido','finalizado','confirmado']\n  const agsRealizados=agsMes.filter(a=>STATUS_OK.includes(a.status||''))"
print('fix1:', old1 in c)
c = c.replace(old1, new1, 1)

# Fix 2: fallback para nome do servico
old2 = "    const nomeSv=a.servicos?.nome||'Servico nao informado'"
new2 = "    const nomeSv=a.servicos?.nome||a.servico_nome||a.servico||'Servico nao informado'"
print('fix2 v1:', old2 in c)
c = c.replace(old2, new2, 1)

old2b = "    const nomeSv=a.servicos?.nome||'Serviço não informado'"
new2b = "    const nomeSv=a.servicos?.nome||a.servico_nome||a.servico||'Serviço não informado'"
print('fix2 v2:', old2b in c)
c = c.replace(old2b, new2b, 1)

# Fix 3: query - adicionar mais campos
old3 = "      supabase.from('agendamentos').select('id,profissional_id,cliente_nome,servicos(nome),data_hora,status,valor').eq('user_id',user.id).order('data_hora',{ascending:false}),"
new3 = "      supabase.from('agendamentos').select('id,profissional_id,cliente_nome,servico_id,servico_nome,servicos(id,nome,preco),data_hora,status,valor,valor_total').eq('user_id',user.id).order('data_hora',{ascending:false}),"
print('fix3:', old3 in c)
c = c.replace(old3, new3, 1)

# Adicionar debug temporario para ver o que chega
old4 = "  const agsRealizados=agsMes.filter"
new4 = "  console.log('agsMes total:',agsMes.length,'status valores:',agsMes.map(a=>a.status))\n  const agsRealizados=agsMes.filter"
print('fix4 debug:', old4 in c)
c = c.replace(old4, new4, 1)

with open('app/painel/relatorio/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO!')
