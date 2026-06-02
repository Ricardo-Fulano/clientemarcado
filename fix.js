const fs = require('fs')

const paginas = [
  'app/painel/agendamentos/page.tsx',
  'app/painel/clientes/page.tsx',
  'app/painel/orcamentos/page.tsx',
  'app/painel/cobrancas/page.tsx',
  'app/painel/pagamentos/page.tsx',
  'app/painel/servicos/page.tsx',
  'app/painel/profissionais/page.tsx',
  'app/painel/relatorio/page.tsx',
  'app/painel/perfil/page.tsx',
  'app/painel/page.tsx',
]

for (const file of paginas) {
  if (!fs.existsSync(file)) continue
  let c = fs.readFileSync(file, 'utf8')

  // Remove qualquer import AvisoAtraso existente
  c = c.replace(/import \{ AvisoAtraso \} from '[^']+'\n/g, '')

  // Adiciona import correto logo após 'use client'
  c = c.replace("'use client'\n", "'use client'\nimport { AvisoAtraso } from '../../components/AcessoGuard'\n")

  // Garante que <AvisoAtraso/> existe após o bdy
  if (!c.includes('<AvisoAtraso/>')) {
    c = c.replace(/<div className="bdy"([^>]*)>/, '<div className="bdy"$1>\n          <AvisoAtraso/>')
  }

  fs.writeFileSync(file, c, 'utf8')
  console.log('OK:', file)
}

console.log('Pronto!')