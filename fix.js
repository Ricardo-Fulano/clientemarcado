const fs = require('fs')
let c = fs.readFileSync('app/painel/agendamentos/page.tsx', 'utf8')

const cssStart = c.indexOf('const CSS=`\n') + 11
const cssEnd = c.indexOf('\n`\nexport default', cssStart)
const cssContent = c.slice(cssStart, cssEnd)

// Escapar backticks dentro do CSS
const cssFixed = cssContent.replace(/`/g, '\\`')

c = c.slice(0, cssStart) + cssFixed + c.slice(cssEnd)

fs.writeFileSync('app/painel/agendamentos/page.tsx', c, 'utf8')

// Verificar
const c2 = fs.readFileSync('app/painel/agendamentos/page.tsx', 'utf8')
const cssStart2 = c2.indexOf('const CSS=`\n') + 11
const cssEnd2 = c2.indexOf('\n`\nexport default', cssStart2)
const cssContent2 = c2.slice(cssStart2, cssEnd2)
const btks = (cssContent2.match(/(?<!\\)`/g) || []).length
console.log('Backticks nao escapados restantes:', btks)
console.log('Corrigido!')