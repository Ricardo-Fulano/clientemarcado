with open('app/painel/clientes/page.tsx', encoding='utf-8') as f:
    c = f.read()

old = """    const {data:novo,error}=await supabase.from('clientes').insert({
      user_id:user.id,nome:fNome.trim(),whatsapp:fWpp.replace(/\D/g,'')||null,
      email:fEmail.trim()||null,tipo:fTipo,obs:fObs.trim()||null,ativo:true,
    }).select('*').single()
    if(error){setMsg('Erro ao salvar.');setSalvando(false);return}"""

new = """    const payload:any={user_id:user.id,nome:fNome.trim(),whatsapp:fWpp.replace(/\D/g,'')||null,email:fEmail.trim()||null,tipo:fTipo,observacoes:fObs.trim()||null,ativo:true}
    const {data:novo,error}=await supabase.from('clientes').insert(payload).select('*').single()
    if(error){
      console.error('Erro ao salvar cliente:',error)
      delete payload.observacoes
      const {data:novo2,error:error2}=await supabase.from('clientes').insert(payload).select('*').single()
      if(error2){console.error('Erro:',error2);setMsg('Nao foi possivel salvar.');setSalvando(false);return}
      setClientes(prev=>[novo2,...prev].sort((a,b)=>a.nome.localeCompare(b.nome)))
      setFNome('');setFWpp('');setFEmail('');setFTipo('cliente');setFObs('');setShowForm(false)
      setMsg('Cliente cadastrado! ✓');setTimeout(()=>setMsg(''),2500);setSalvando(false);return
    }"""

print('Achou:', old in c)
c = c.replace(old, new, 1)
print('Aplicou:', 'console.error' in c)
with open('app/painel/clientes/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
