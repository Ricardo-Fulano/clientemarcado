const fs = require('fs')

// Corrigir especificamente o app/painel/page.tsx
let c = fs.readFileSync('app/painel/page.tsx', 'utf8')

// Remove TODOS os imports de AvisoAtraso
const linhas = c.split('\n')
const semDuplicata = []
let jaAdicionou = false

for (const linha of linhas) {
  if (linha.includes('AvisoAtraso') && linha.includes('import')) {
    if (!jaAdicionou) {
      semDuplicata.push(linha)
      jaAdicionou = true
    }
    // segunda ocorrência é ignorada
  } else {
    semDuplicata.push(linha)
  }
}

c = semDuplicata.join('\n')
fs.writeFileSync('app/painel/page.tsx', c, 'utf8')

// Verificar
const resultado = c.split('\n').slice(0, 6)
resultado.forEach((l, i) => console.log(i+1, l))
console.log('Pronto!')