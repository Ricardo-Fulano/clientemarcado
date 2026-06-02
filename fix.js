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

  // Remove qualquer import existente do AvisoAtraso (em qualquer lugar)
  c = c.replace(/^import \{ AvisoAtraso \}.*\n/gm, '')
  c = c.replace(/<AvisoAtraso\/>/g, '')

  fs.writeFileSync(file, c, 'utf8')
  console.log('Limpo:', file)
}

console.log('Tudo limpo! Agora sem AvisoAtraso.')