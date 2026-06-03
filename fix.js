const fs = require('fs')
let c = fs.readFileSync('app/painel/agendamentos/page.tsx', 'utf8')
const linhas = c.split('\n')
console.log('Linha 1:', linhas[0])
console.log('Linha 2:', linhas[1])

// Corrigir primeira linha
if (linhas[0] !== "'use client'") {
  linhas[0] = "'use client'"
}
// Remover segunda linha se for lixo
if (linhas[1] && !linhas[1].startsWith('import') && !linhas[1].startsWith("'use") && linhas[1].trim() !== '') {
  console.log('Removendo linha 2 corrompida:', linhas[1])
  linhas.splice(1, 1)
}

c = linhas.join('\n')
fs.writeFileSync('app/painel/agendamentos/page.tsx', c, 'utf8')
console.log('Corrigido!')
console.log('Nova linha 1:', c.split('\n')[0])
console.log('Nova linha 2:', c.split('\n')[1])