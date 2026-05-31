const fs = require('fs')
const path = require('path')
const fixes = [
  ['â\x80\x94', '—'],
  ['â\x80\x9c', '"'],
  ['â\x80\x9d', '"'],
  ['â\x86\x90', '←'],
  ['â\x8f\xb3', '⏳'],
  ['â\x9c\x93', '✓'],
  ['â\x9a\xa0', '⚠'],
  ['\xf0\x9f\x93\x85', '📅'],
  ['ðŸ"…', '📅'],
  ['â†', '←'],
  ['â³', '⏳'],
  ['âœ"', '✓'],
  ['âš ', '⚠'],
  ['â€"', '—'],
  ['â€œ', '"'],
  ['â€', '"'],
]
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.next') walk(full)
    else if (e.isFile() && e.name.endsWith('.tsx')) {
      let c = fs.readFileSync(full, 'utf8')
      const orig = c
      for (const [bad, good] of fixes) c = c.split(bad).join(good)
      if (c !== orig) {
        fs.writeFileSync(full, c, 'utf8')
        console.log('Corrigido:', full)
      }
    }
  }
}
walk('app')
console.log('Concluido!')