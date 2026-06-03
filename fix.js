const fs = require('fs')
const c = fs.readFileSync('app/painel/agendamentos/page.tsx', 'utf8')
console.log('tem aside:', c.includes('<aside'))
console.log('tem sb-logo:', c.includes('sb-logo'))
console.log('tem display flex minHeight:', c.includes('display:\'flex\''))
console.log('linhas:', c.split('\n').length)
// Ver o return principal
const idx = c.lastIndexOf('return(')
console.log(c.slice(idx, idx+200))