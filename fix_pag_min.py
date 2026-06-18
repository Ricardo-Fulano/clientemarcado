with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Substituir o insert em pagamentos por versao minima com campos seguros
old = (
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
new = (
    "    {\n"
    "      const pagPayload:any={\n"
    "        user_id:userId,\n"
    "        valor,\n"
    "        data:new Date().toISOString().split('T')[0],\n"
    "        status:'confirmado',\n"
    "      }\n"
    "      const {error:epag}=await supabase.from('pagamentos').insert(pagPayload)\n"
    "      if(epag){\n"
    "        console.error('Erro pagamentos insert:',epag)\n"
    "        // Tentar com menos campos\n"
    "        const {error:epag2}=await supabase.from('pagamentos').insert({user_id:userId,valor,data:new Date().toISOString().split('T')[0]})\n"
    "        if(epag2)console.error('Erro pagamentos insert minimo:',epag2)\n"
    "      }\n"
    "    }"
)
print('Achou:', old in c)
c = c.replace(old, new, 1)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
