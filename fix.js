const fs = require('fs')

const pages = [
  { file: 'app/painel/pagamentos/page.tsx', recurso: 'Pagamentos' },
  { file: 'app/painel/cobrancas/page.tsx', recurso: 'Cobranças' },
  { file: 'app/painel/relatorio/page.tsx', recurso: 'Relatórios' },
]

for (const p of pages) {
  let c = fs.readFileSync(p.file, 'utf8')

  // Remove todas as linhas com plano
  const lines = c.split('\n')
  const clean = lines.filter(l => 
    !l.includes('const plano =') && 
    !l.includes("plano !== 'completo'") &&
    !l.includes('// Controle de plano')
  )
  c = clean.join('\n')

  // Verifica se limpou
  const count = (c.match(/const plano/g) || []).length
  console.log(p.file, '- planos restantes:', count)

  fs.writeFileSync(p.file, c, 'utf8')
}
console.log('Limpeza concluida!')