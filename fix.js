const fs = require('fs')

// 1. Restaurar painel/page.tsx como HOME correta
const home = fs.readFileSync('app/painel/agendamentos/page.tsx', 'utf8')
console.log('agendamentos tem Home?', home.includes('Ola,'))
console.log('agendamentos tem Agenda?', home.includes("'Agenda'") || home.includes('"Agenda"') || home.includes('>Agenda<'))

const painel = fs.readFileSync('app/painel/page.tsx', 'utf8')
console.log('painel tem Home?', painel.includes('Ola,'))
console.log('painel tem Agenda?', painel.includes('>Agenda<'))
console.log('painel linhas:', painel.split('\n').length)