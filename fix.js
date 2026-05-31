const fs = require('fs')

const pages = [
  { file: 'app/painel/orcamentos/page.tsx', recurso: 'Orçamentos' },
  { file: 'app/painel/cobrancas/page.tsx', recurso: 'Cobranças' },
  { file: 'app/painel/pagamentos/page.tsx', recurso: 'Pagamentos' },
  { file: 'app/painel/relatorio/page.tsx', recurso: 'Relatórios' },
]

for (const p of pages) {
  let c = fs.readFileSync(p.file, 'utf8')

  // Remove bloqueio mal inserido
  c = c.replace(/\n\s*\/\/ Controle de plano\n\s*const plano[^\n]*\n\s*if \(!loading[^\n]*\n/g, '\n')

  // Encontra o if(loading) return e insere o bloqueio DEPOIS dele
  c = c.replace(
    /(if\s*\(loading\)\s*return[\s\S]*?\n\s*\)\s*\n)/,
    (match) => match + '  const plano = perfil?.plano || \'essencial\'\n  if (plano !== \'completo\') return <PlanoBloqueado recurso="' + p.recurso + '" />\n'
  )

  fs.writeFileSync(p.file, c, 'utf8')
  console.log('Corrigido:', p.file)
}

console.log('Pronto!')