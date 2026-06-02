const fs = require('fs')

let c = fs.readFileSync('app/painel/page.tsx', 'utf8')
c = c.replace(
  "import { AvisoAtraso } from '../components/AcessoGuard'",
  "import { AvisoAtraso } from '../../components/AcessoGuard'"
)
fs.writeFileSync('app/painel/page.tsx', c, 'utf8')
console.log('Caminho corrigido!')
console.log(c.slice(0, 120))