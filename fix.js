const fs = require('fs')
let c = fs.readFileSync('app/painel/servicos/page.tsx', 'utf8')

// Corrigir visual: juntar duracao em uma unica tag
const old = `const durRaw=s.duracao?String(s.duracao).trim().replace(/ min$/,''):null;const durLabel=durRaw?durRaw+' min':null`
const novo = `const durRaw=s.duracao?String(s.duracao).trim():null;const durLabel=durRaw?(durRaw.includes('min')?durRaw:durRaw+' min'):null`

if(c.includes(old)){
  c = c.replace(old, novo)
  console.log('Visual corrigido!')
} else {
  const idx = c.indexOf('durRaw')
  console.log('Trecho atual:', c.slice(idx-5, idx+150))
}

fs.writeFileSync('app/painel/servicos/page.tsx', c, 'utf8')