with open('app/painel/agendamentos/novo/page.tsx', encoding='utf-8') as f:
    lines = f.readlines()

print('Linhas:', len(lines))

# Encontrar linha da funcao salvar
start = next(i for i,l in enumerate(lines) if 'async function salvar()' in l)
end = next(i for i in range(start+1, len(lines)) if lines[i].strip() == '}') + 1

print('Funcao linhas:', start+1, 'ate', end)
print('Conteudo:', repr(''.join(lines[start:start+3])))

nova_funcao = [
'  async function salvar(){\n',
'    const err:string[]=[]\n',
'    if(!cNome.trim()) err.push("Informe o nome.")\n',
'    if(!data) err.push("Selecione a data.")\n',
'    if(!hora) err.push("Selecione o horario.")\n',
'    if(err.length){setErros(err);return}\n',
'    setErros([]);setSalvando(true)\n',
'    try{\n',
'      const {data:{user}}=await supabase.auth.getUser()\n',
'      if(!user){setSalvando(false);return}\n',
'      const wpp=cWpp.replace(/[^0-9]/g,"")\n',
'      const payload={user_id:user.id,cliente_nome:cNome.trim(),cliente_whatsapp:wpp||null,cliente_email:cEmail||null,servico_id:servId||null,profissional_id:profId||null,data_hora:data+"T"+hora+":00",status:"pendente",observacoes:obs.trim()||null,valor:valor?parseFloat(valor):null}\n',
'      console.log("Payload:",JSON.stringify(payload))\n',
'      const {error}=await supabase.from("agendamentos").insert(payload)\n',
'      if(error){console.error("Erro Supabase:",JSON.stringify(error));setErros(["Erro ao salvar. Veja o console."]);setSalvando(false);return}\n',
'      router.push("/painel/agendamentos")\n',
'    }catch(e){console.error("Erro:",e);setErros(["Erro inesperado."]);setSalvando(false)}\n',
'  }\n',
]

new_lines = lines[:start] + nova_funcao + lines[end:]
print('Novas linhas:', len(new_lines))
print('Tem payload:', any('payload' in l for l in new_lines))

with open('app/painel/agendamentos/novo/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('OK')
