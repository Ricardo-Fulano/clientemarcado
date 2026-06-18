with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Localizar o insert em orcamento_pagamentos e adicionar insert em pagamentos logo depois
old = (
    "    try{\n"
    "      await supabase.from('orcamento_pagamentos').insert({\n"
    "        orcamento_id:modalPagOrc.id,user_id:userId,\n"
    "        data:new Date().toISOString().split('T')[0],\n"
    "        valor,forma:modalForma,observacao:modalObs||null\n"
    "      })\n"
    "    }catch(e){console.log('orcamento_pagamentos:',e)}"
)
new = (
    "    try{\n"
    "      await supabase.from('orcamento_pagamentos').insert({\n"
    "        orcamento_id:modalPagOrc.id,user_id:userId,\n"
    "        data:new Date().toISOString().split('T')[0],\n"
    "        valor,forma:modalForma,observacao:modalObs||null\n"
    "      })\n"
    "    }catch(e){console.log('orcamento_pagamentos:',e)}\n"
    "    try{\n"
    "      await supabase.from('pagamentos').insert({\n"
    "        user_id:userId,\n"
    "        valor,\n"
    "        data:new Date().toISOString().split('T')[0],\n"
    "        forma_pagamento:modalForma,\n"
    "        status:'confirmado',\n"
    "        descricao:'Orçamento — '+(modalPagOrc.cliente_nome||''),\n"
    "        cliente_nome:modalPagOrc.cliente_nome||null,\n"
    "        observacao:modalObs||null,\n"
    "        origem:'orcamento',\n"
    "        orcamento_id:modalPagOrc.id\n"
    "      })\n"
    "    }catch(e){console.error('Erro ao inserir em pagamentos:',e)}"
)
print('Achou:', old in c)
c = c.replace(old, new, 1)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
