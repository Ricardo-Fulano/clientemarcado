const fs = require('fs')
let c = fs.readFileSync('app/painel/servicos/page.tsx', 'utf8')

// Corrigir: remover user_id do payload e adicionar no where do update
c = c.replace(
  `const payload={user_id:userId,nome:fNome.trim(),descricao:fDesc.trim()||null,preco:parseFloat(fPreco.replace(',','.'))||null,duracao:fDur,categoria:fCat,profissional_nome:fProf.trim()||null,ativo:true}
    if(editId){await supabase.from('servicos').update(payload).eq('id',editId)}`,
  `const payload={nome:fNome.trim(),descricao:fDesc.trim()||null,preco:parseFloat(fPreco.replace(',','.'))||null,duracao:fDur,categoria:fCat,profissional_nome:fProf.trim()||null,ativo:true}
    const payloadInsert={user_id:userId,...payload}
    if(editId){await supabase.from('servicos').update(payload).eq('id',editId).eq('user_id',userId)}`
)

// Corrigir insert para usar payloadInsert
c = c.replace(
  `else{await supabase.from('servicos').insert(payload)}`,
  `else{await supabase.from('servicos').insert(payloadInsert)}`
)

fs.writeFileSync('app/painel/servicos/page.tsx', c, 'utf8')

// Verificar
const idx = c.indexOf('async function salvar')
console.log(c.slice(idx, idx+700))