with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Adicionar busca de orcamentos ao load()
old_load = """    const [{data:p},{data:ps},{data:pags},{data:desp},{data:ags},{data:orcs}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('id,nome,cargo,foto_url').eq('user_id',user.id).order('nome'),
      supabase.from('pagamentos').select('valor,data,status').eq('user_id',user.id),
      supabase.from('despesas').select('valor,data,categoria').eq('user_id',user.id).then(r=>{if(r.error)console.error('Despesas:',r.error);return{data:r.data||[]}}),
      supabase.from('agendamentos').select('id,profissional_id,cliente_nome,servicos(id,nome,preco),data_hora,status,valor').eq('user_id',user.id).order('data_hora',{ascending:false}),
      supabase.from('orcamentos').select('valor_pago,data,status,hist_pagamentos,tipo').eq('user_id',user.id).gt('valor_pago',0),
    ])
    // Converter pagamentos de orçamentos em entradas de pagamento
    const pagsOrc:(typeof pags extends (infer T)[]|null ? T : never)[]=[]
    ;(orcs||[]).forEach((orc:any)=>{
      // hist_pagamentos do orçamento
      if(orc.hist_pagamentos?.length){
        orc.hist_pagamentos.forEach((hp:any)=>{
          pagsOrc.push({valor:hp.valor||0,data:hp.data||orc.data,status:'confirmado'})
        })
      } else if(orc.valor_pago>0){
        // fallback: usar data do orçamento
        pagsOrc.push({valor:orc.valor_pago,data:orc.data,status:'confirmado'})
      }
    })
    const todoPags=[...(pags||[]),...pagsOrc]
    setPerfil(p);setProfs(ps||[]);setPagamentos(todoPags);setDespesas(desp||[]);setAgendamentos(ags||[]);setLoading(false)"""

new_load = """    const [{data:p},{data:ps},{data:pags},{data:desp},{data:ags},{data:orcs}]=await Promise.all([
      supabase.from('perfis').select('*').eq('user_id',user.id).single(),
      supabase.from('profissionais').select('id,nome,cargo,foto_url').eq('user_id',user.id).order('nome'),
      supabase.from('pagamentos').select('valor,data,status').eq('user_id',user.id),
      supabase.from('despesas').select('valor,data,categoria').eq('user_id',user.id).then(r=>{if(r.error)console.error('Despesas:',r.error);return{data:r.data||[]}}),
      supabase.from('agendamentos').select('id,profissional_id,cliente_nome,servicos(id,nome,preco),data_hora,status,valor').eq('user_id',user.id).order('data_hora',{ascending:false}),
      supabase.from('orcamentos').select('valor_pago,data,status,hist_pagamentos,tipo').eq('user_id',user.id).gt('valor_pago',0),
    ])
    // Converter pagamentos de orçamentos em entradas de pagamento
    const pagsOrc:(typeof pags extends (infer T)[]|null ? T : never)[]=[]
    ;(orcs||[]).forEach((orc:any)=>{
      // hist_pagamentos do orçamento
      if(orc.hist_pagamentos?.length){
        orc.hist_pagamentos.forEach((hp:any)=>{
          pagsOrc.push({valor:hp.valor||0,data:hp.data||orc.data,status:'confirmado'})
        })
      } else if(orc.valor_pago>0){
        // fallback: usar data do orçamento
        pagsOrc.push({valor:orc.valor_pago,data:orc.data,status:'confirmado'})
      }
    })
    const todoPags=[...(pags||[]),...pagsOrc]
    setPerfil(p);setProfs(ps||[]);setPagamentos(todoPags);setDespesas(desp||[]);setAgendamentos(ags||[]);setLoading(false)"""

print('1 load:', old_load in c)
c = c.replace(old_load, new_load, 1)

with open('app/painel/relatorio/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO!')
