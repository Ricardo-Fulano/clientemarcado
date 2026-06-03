const fs = require('fs')
let c = fs.readFileSync('app/painel/servicos/page.tsx', 'utf8')

// Corrigir update
c = c.replace(
  ".update(payload).eq('id',editId)}",
  ".update(payload).eq('id',editId).eq('user_id',userId)}"
)

fs.writeFileSync('app/painel/servicos/page.tsx', c, 'utf8')

const idx = c.indexOf('async function salvar')
console.log(c.slice(idx, idx+500))