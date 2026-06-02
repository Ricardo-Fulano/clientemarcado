const fs = require('fs')

// Verificar e mostrar as primeiras linhas de cada arquivo
const paginas = [
  'app/painel/agendamentos/page.tsx',
  'app/painel/clientes/page.tsx',
  'app/painel/cobrancas/page.tsx',
  'app/painel/pagamentos/page.tsx',
  'app/painel/servicos/page.tsx',
  'app/painel/profissionais/page.tsx',
  'app/painel/relatorio/page.tsx',
  'app/painel/perfil/page.tsx',
]

for (const file of paginas) {
  if (!fs.existsSync(file)) continue
  let c = fs.readFileSync(file, 'utf8')
  const temImport = c.includes("from '../../components/AcessoGuard'")
  const temJSX = c.includes('<AvisoAtraso')
  console.log(file, '| import:', temImport, '| jsx:', temJSX)
  
  if (temJSX && !temImport) {
    // Força adicionar import na linha 2
    const linhas = c.split('\n')
    linhas.splice(1, 0, "import { AvisoAtraso } from '../../components/AcessoGuard'")
    c = linhas.join('\n')
    fs.writeFileSync(file, c, 'utf8')
    console.log('  -> Import adicionado!')
  }
}