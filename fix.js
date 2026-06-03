const fs = require('fs')
let c = fs.readFileSync('app/painel/servicos/page.tsx', 'utf8')

// Adicionar load() após salvar
c = c.replace(
  'resetForm();setShowForm(false);setSalvando(false);',
  'await load();resetForm();setShowForm(false);setSalvando(false);'
)

fs.writeFileSync('app/painel/servicos/page.tsx', c, 'utf8')
console.log('Corrigido!')

// Verificar
const idx = c.indexOf('async function salvar')
console.log(c.slice(idx, idx+400))