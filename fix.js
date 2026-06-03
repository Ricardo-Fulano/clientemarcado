const fs = require('fs')
let c = fs.readFileSync('app/painel/servicos/page.tsx', 'utf8')

// Remover o .eq('user_id',userId) do update - a policy RLS ja cuida disso
c = c.replace(
  ".update(payload).eq('id',editId).eq('user_id',userId)",
  ".update(payload).eq('id',editId)"
)

// Tambem remover do insert o user_id e usar a session diretamente
// Verificar resultado
fs.writeFileSync('app/painel/servicos/page.tsx', c, 'utf8')

const idx = c.indexOf('async function salvar')
console.log(c.slice(idx, idx+400))