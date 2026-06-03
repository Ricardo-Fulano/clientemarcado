const fs = require('fs')
let c = fs.readFileSync('app/painel/servicos/page.tsx', 'utf8')

c = c.replace(
  "const durRaw=s.duracao?String(s.duracao).trim():null;const durLabel=durRaw?(/^\\d+$/.test(durRaw)?`${durRaw} min`:durRaw):null",
  "const durRaw=s.duracao?String(s.duracao).trim().replace(/ min$/,''):null;const durLabel=durRaw?durRaw+' min':null"
)

fs.writeFileSync('app/painel/servicos/page.tsx', c, 'utf8')
console.log('OK')