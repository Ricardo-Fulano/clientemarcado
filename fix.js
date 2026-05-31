const fs = require('fs')
const path = require('path')

const IMPORT_LINE = `import PlanoBloqueado from '../../components/PlanoBloqueado'`
const IMPORT_LINE_NOVO = `import PlanoBloqueado from '../../../components/PlanoBloqueado'`

const pages = [
  {
    file: 'app/painel/orcamentos/page.tsx',
    import: IMPORT_LINE,
    recurso: 'Orçamentos',
  },
  {
    file: 'app/painel/cobrancas/page.tsx',
    import: IMPORT_LINE,
    recurso: 'Cobranças',
  },
  {
    file: 'app/painel/pagamentos/page.tsx',
    import: IMPORT_LINE,
    recurso: 'Pagamentos',
  },
  {
    file: 'app/painel/relatorio/page.tsx',
    import: IMPORT_LINE,
    recurso: 'Relatórios',
  },
]

for (const p of pages) {
  let c = fs.readFileSync(p.file, 'utf8')

  if (c.includes('PlanoBloqueado')) {
    console.log('Já tem bloqueio:', p.file)
    continue
  }

  // Adiciona import após a última linha de import
  const lines = c.split('\n')
  let lastImport = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) lastImport = i
  }
  lines.splice(lastImport + 1, 0, p.import)
  c = lines.join('\n')

  // Encontra o nome da função export default
  const match = c.match(/export default function (\w+)/)
  if (!match) { console.log('Não achou função em:', p.file); continue }
  const fnName = match[1]

  // Adiciona verificação de plano logo após o useState de perfil
  const bloqueio = `
  // Controle de plano
  const plano = perfil?.plano || 'essencial'
  if (!loading && plano !== 'completo') return <PlanoBloqueado recurso="${p.recurso}" />`

  // Insere antes do primeiro return da função (que não seja de loading)
  c = c.replace(
    /(\s*if\s*\(loading\)[^\n]*\n)/,
    `$1${bloqueio}\n`
  )

  fs.writeFileSync(p.file, c, 'utf8')
  console.log('Bloqueio adicionado:', p.file)
}

console.log('Concluido!')