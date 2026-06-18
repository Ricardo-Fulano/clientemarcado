with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Fix 1: query - adicionar mais campos
old_q = "      supabase.from('agendamentos').select('id,profissional_id,cliente_nome,servicos(nome),data_hora,status,valor').eq('user_id',user.id).order('data_hora',{ascending:false}),"
new_q = "      supabase.from('agendamentos').select('id,profissional_id,cliente_nome,servico_id,servicos(id,nome,preco),data_hora,status,valor,valor_total').eq('user_id',user.id).order('data_hora',{ascending:false}),"
print('fix1:', old_q in c)
c = c.replace(old_q, new_q, 1)

# Fix 2: expandir status e usar fallbacks para nome e valor
old_r = "  const agsRealizados=agsMes.filter(a=>a.status==='realizado'||a.status==='compareceu')\n  const servicosMap:Record<string,{nome:string,qtd:number,receita:number,profs:Record<string,number>}>={}  \n  agsRealizados.forEach(a=>{\n    const nomeSv=a.servicos?.nome||'Servico nao informado'"
new_r = "  const STATUS_OK=['realizado','Realizado','compareceu','concluido','concluído','finalizado']\n  const agsRealizados=agsMes.filter(a=>STATUS_OK.includes(a.status||''))\n  const servicosMap:Record<string,{nome:string,qtd:number,receita:number,profs:Record<string,number>}>={}  \n  agsRealizados.forEach(a=>{\n    const nomeSv=a.servicos?.nome||a.servico_nome||'Servico nao informado'"
print('fix2:', old_r in c)
c = c.replace(old_r, new_r, 1)

# Fix 3: valor com fallback
old_v = "    servicosMap[nomeSv].receita+=(a.valor||0)"
new_v = "    servicosMap[nomeSv].receita+=(a.valor||a.valor_total||a.servicos?.preco||0)"
print('fix3:', old_v in c)
c = c.replace(old_v, new_v, 1)

with open('app/painel/relatorio/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO!')
