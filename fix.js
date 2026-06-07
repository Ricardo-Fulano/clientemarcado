const fs = require('fs')
let c = fs.readFileSync('app/painel/perfil/page.tsx', 'utf8')

// Ver o console.log do update
const idx = c.indexOf('console.log(\'UPDATE resultado:\'')
console.log(c.slice(idx-50, idx+200))