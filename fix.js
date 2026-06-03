const fs = require('fs')

let ag = fs.readFileSync('app/painel/agendamentos/page.tsx', 'utf8')

// Localizar o bloco CSS
const cssStart = ag.indexOf('\nconst CSS=`\n') + 1
const cssEnd = ag.indexOf('\n`\n', cssStart + 100) + 3

console.log('CSS vai de', cssStart, 'ate', cssEnd)
console.log('Tamanho:', cssEnd - cssStart)

// Extrair o CSS
const cssBlock = ag.slice(cssStart, cssEnd)
const cssContent = cssBlock.slice('const CSS=`\n'.length, cssBlock.length - 2)

// Substituir backticks por aspas simples ou escapar
const cssFixed = cssContent
  .replace(/`/g, '"')  // substituir backtick por aspas duplas no CSS

// Reescrever como string normal sem template literal
const novoBloco = 'const CSS=' + JSON.stringify(cssFixed) + '\n'

ag = ag.slice(0, cssStart) + novoBloco + ag.slice(cssEnd)

fs.writeFileSync('app/painel/agendamentos/page.tsx', ag, 'utf8')
console.log('CSS convertido para string normal!')

// Verificar
const ag2 = fs.readFileSync('app/painel/agendamentos/page.tsx', 'utf8')
const i = ag2.indexOf('const CSS=')
console.log('Preview:', ag2.slice(i, i+50))