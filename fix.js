const fs = require('fs')
let c = fs.readFileSync('app/painel/servicos/page.tsx', 'utf8')

// Remover o payloadInsert que ficou na linha 120
c = c.replace(
  "else{await supabase.from('servicos').insert(payloadInsert)}",
  "else{await supabase.from('servicos').insert({user_id:userId,...payload})}"
)

fs.writeFileSync('app/painel/servicos/page.tsx', c, 'utf8')

const idx = c.indexOf('async function salvar')
console.log(c.slice(idx, idx+400))