const fs = require('fs')

let ag = fs.readFileSync('app/painel/agendamentos/page.tsx', 'utf8')

// Remover linha 2 corrompida
const linhas = ag.split('\n')
const linhasLimpas = linhas.filter((l, i) => {
  if (i === 1 && l.trim() === "se client'") return false
  return true
})

ag = linhasLimpas.join('\n')

fs.writeFileSync('app/painel/agendamentos/page.tsx', ag, 'utf8')

// Verificar primeiras linhas
ag.split('\n').slice(0,6).forEach((l,i) => console.log(i+1, l.slice(0,80)))