const fs = require('fs')
const p = fs.readFileSync('app/painel/page.tsx', 'utf8')

// Ver o bloco principal do return
const idx = p.lastIndexOf('return(')
console.log('RETURN PRINCIPAL:')
console.log(p.slice(idx, idx+800))
console.log('---')
console.log('Tem aside:', p.includes('<aside'))
console.log('Tem sb-logo:', p.includes('sb-logo'))