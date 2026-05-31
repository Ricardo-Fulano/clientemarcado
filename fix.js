const fs = require('fs')
const path = require('path')
const fixes = [
  ['InÃcio', 'Início'],
  ['OrÃ§amentos', 'Orçamentos'],
  ['OrÃ§amento', 'Orçamento'],
  ['CobranÃ§as', 'Cobranças'],
  ['CobranÃ§a', 'Cobrança'],
  ['ServiÃ§os', 'Serviços'],
  ['ServiÃ§o', 'Serviço'],
  ['RelatÃ³rios', 'Relatórios'],
  ['ConfiguraÃ§Ãµes', 'Configurações'],
  ['configuraÃ§Ãµes', 'configurações'],
  ['ObservaÃ§Ãµes', 'Observações'],
  ['InformaÃ§Ãµes', 'Informações'],
  ['notificaÃ§Ãµes', 'notificações'],
  ['horÃ¡rio', 'horário'],
  ['HorÃ¡rio', 'Horário'],
  ['negÃ³cio', 'negócio'],
  ['avaliaÃ§Ã£o', 'avaliação'],
  ['AvaliaÃ§Ã£o', 'Avaliação'],
  ['seleÃ§Ã£o', 'seleção'],
  ['opÃ§Ã£o', 'opção'],
  ['opÃ§Ãµes', 'opções'],
  ['situaÃ§Ã£o', 'situação'],
  ['criaÃ§Ã£o', 'criação'],
  ['ediÃ§Ã£o', 'edição'],
  ['excluÃ­do', 'excluído'],
  ['Ã©', 'é'],
  ['Ã³', 'ó'],
  ['Ã¡', 'á'],
  ['Ã£', 'ã'],
  ['Ã§', 'ç'],
  ['Ãµ', 'õ'],
  ['Ã­', 'í'],
  ['Ãº', 'ú'],
  ['Ã ', 'à'],
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