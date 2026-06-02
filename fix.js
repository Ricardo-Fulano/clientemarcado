const fs = require('fs')

// Adicionar AvisoAtraso APENAS na página principal do painel
// dentro do container correto, após o 'use client'

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
  if (c.includes('AvisoAtraso')) continue

  // Adiciona import após 'use client'
  c = c.replace("'use client'\n", "'use client'\nimport { AvisoAtraso } from '../../components/AcessoGuard'\n")

  // Insere <AvisoAtraso/> após o primeiro <div className="bdy"
  const bdyMatch = c.match(/<div className="bdy"[^>]*>/)
  if (bdyMatch) {
    c = c.replace(bdyMatch[0], bdyMatch[0] + '\n          <AvisoAtraso/>')
    console.log('AvisoAtraso adicionado:', file)
  } else {
    console.log('Sem .bdy encontrado:', file)
  }

  fs.writeFileSync(file, c, 'utf8')
}

console.log('Pronto!')