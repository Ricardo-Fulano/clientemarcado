const fs = require('fs')

let c = fs.readFileSync('app/painel/cobrancas/page.tsx', 'utf8')
c = c.replace('recurso="Pagamentos"', 'recurso="Cobranças"')
fs.writeFileSync('app/painel/cobrancas/page.tsx', c, 'utf8')
console.log('cobrancas OK')

c = fs.readFileSync('app/painel/relatorio/page.tsx', 'utf8')
c = c.replace('recurso="Pagamentos"', 'recurso="Relatórios"')
fs.writeFileSync('app/painel/relatorio/page.tsx', c, 'utf8')
console.log('relatorio OK')