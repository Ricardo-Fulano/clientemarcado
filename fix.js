
const fs = require('fs')
let c = fs.readFileSync('app/painel/agendamentos/page.tsx', 'utf8')

// Encontrar e remover o bloco CSS inteiro
const cssStart = c.indexOf('\nconst CSS=`')
const cssEnd = c.indexOf('`\nexport default', cssStart)

if (cssStart > -1 && cssEnd > -1) {
  console.log('Removendo CSS de', cssStart, 'ate', cssEnd + 2)
  c = c.slice(0, cssStart) + '\n' + c.slice(cssEnd + 1)
  console.log('CSS removido!')
} else {
  console.log('CSS nao encontrado, cssStart:', cssStart, 'cssEnd:', cssEnd)
}

// Verificar linhas ao redor
const linhas = c.split('\n')
linhas.slice(213, 220).forEach((l,i) => console.log(i+214, l.slice(0,60)))

fs.writeFileSync('app/painel/agendamentos/page.tsx', c, 'utf8')
console.log('Total linhas:', linhas.length)