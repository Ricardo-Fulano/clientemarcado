const fs = require('fs')
const c = fs.readFileSync('app/painel/agendamentos/page.tsx', 'utf8')
const linhas = c.split('\n')
linhas.slice(240, 255).forEach((l,i) => console.log(i+241, l.slice(0,80)))