const fs = require('fs')
const path = require('path')

function fixFile(filePath) {
  const buf = fs.readFileSync(filePath)
  let c = buf.toString('utf8')
  const orig = c

  // Corrige emoji e simbolos corrompidos byte a byte
  c = c.replace(/\u00f0\u009f\u0094\u0085/g, '📅')
  c = c.replace(/\u00e2\u0086\u0090/g, '←')
  c = c.replace(/\u00e2\u0080\u0094/g, '—')
  c = c.replace(/\u00e2\u0080\u009c/g, '"')
  c = c.replace(/\u00e2\u0080\u009d/g, '"')
  c = c.replace(/\u00e2\u009c\u0093/g, '✓')
  c = c.replace(/\u00e2\u009a\u00a0/g, '⚠')
  c = c.replace(/\u00e2\u008f\u00b3/g, '⏳')

  if (c !== orig) {
    fs.writeFileSync(filePath, c, 'utf8')
    console.log('Corrigido:', filePath)
  }
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.next') walk(full)
    else if (e.isFile() && e.name.endsWith('.tsx')) fixFile(full)
  }
}

walk('app')
console.log('Concluido!')