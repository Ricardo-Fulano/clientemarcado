with open('app/painel/agendamentos/novo/page.tsx', encoding='utf-8') as f:
    c = f.read()

print('Linhas:', c.count(chr(10)))
print('Tem Resumo:', 'Resumo lateral' in c)

old = """  async function salvar(){
    const err:string[]=[]
    if(!cNome.trim()) err.push('Informe o nome do cliente / paciente.')
    if(!data) err.push('Selecione a data.')
    if(!hora) err.push('Selecione o horario.')
    if(err.length){setErros(err);return}
    setErros([]);setSalvando(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSalvando(false);return}
    const {error}=await supabase.from('agendamentos').insert({
      user_id:user.id,cliente_nome:cNome.trim(),
      cliente_whatsapp:cWpp.replace(/\D/g,'')||null,cliente_email:cEmail||null,
      servico_id:servId||null,profissional_id:profId||null,
      data_hora:${data}T:00,status,
      observacoes:obs.trim()||null,valor:valor?parseFloat(valor):null,
    })
    if(error){console.error('Erro ao salvar agendamento:',error);setErros(['Erro ao salvar. Tente novamente.']);setSalvando(false);return}
    router.push('/painel/agendamentos')
  }"""

new = """  async function salvar(){
    const err:string[]=[]
    if(!cNome.trim()) err.push('Informe o nome do cliente / paciente.')
    if(!data) err.push('Selecione a data.')
    if(!hora) err.push('Selecione o horario.')
    if(err.length){setErros(err);return}
    setErros([]);setSalvando(true)
    try{
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){setSalvando(false);return}
      const payload:any={user_id:user.id,cliente_nome:cNome.trim(),cliente_whatsapp:cWpp.replace(/\D/g,'')||null,cliente_email:cEmail||null,servico_id:servId||null,profissional_id:profId||null,data_hora:data+'T'+hora+':00',status:'pendente',observacoes:obs.trim()||null,valor:valor?parseFloat(valor):null}
      console.log('Payload:',JSON.stringify(payload))
      const {error}=await supabase.from('agendamentos').insert(payload)
      if(error){console.error('Erro Supabase:',JSON.stringify(error));setErros(['Erro ao salvar. Tente novamente.']);setSalvando(false);return}
      router.push('/painel/agendamentos')
    }catch(e:any){console.error('Erro:',e);setErros(['Erro inesperado.']);setSalvando(false)}
  }"""

print('Achou:', old in c)
c = c.replace(old, new, 1)
print('Aplicou:', 'JSON.stringify(payload)' in c)
with open('app/painel/agendamentos/novo/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
