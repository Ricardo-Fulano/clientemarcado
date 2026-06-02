const fs = require('fs')

// Criar pasta app/components se não existir
if (!fs.existsSync('app/components')) {
  fs.mkdirSync('app/components')
}

// Copiar AcessoGuard para dentro de app/components
const conteudo = fs.readFileSync('components/AcessoGuard.tsx', 'utf8')
fs.writeFileSync('app/components/AcessoGuard.tsx', conteudo, 'utf8')
console.log('Copiado para app/components!')

// Corrigir caminho supabase no novo arquivo
let c = fs.readFileSync('app/components/AcessoGuard.tsx', 'utf8')
c = c.replace(
  "import { supabase } from '@/app/lib/supabase'",
  "import { supabase } from '../lib/supabase'"
)
c = c.replace(
  "import { supabase } from '../app/lib/supabase'",
  "import { supabase } from '../lib/supabase'"
)
fs.writeFileSync('app/components/AcessoGuard.tsx', c, 'utf8')
console.log('Caminho supabase corrigido!')

// Atualizar imports nas páginas do painel
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
  c = c.replace(
    /import \{ AvisoAtraso \} from '\.\.\/\.\.\/components\/AcessoGuard'/g,
    "import { AvisoAtraso } from '../components/AcessoGuard'"
  )
  fs.writeFileSync(file, c, 'utf8')
  console.log('Atualizado:', file)
}

// Atualizar layout
let layout = fs.readFileSync('app/painel/layout.tsx', 'utf8')
layout = layout.replace(
  /from '\.\.\/\.\.\/components\/AcessoGuard'/g,
  "from '../components/AcessoGuard'"
)
fs.writeFileSync('app/painel/layout.tsx', layout, 'utf8')
console.log('Layout atualizado!')

console.log('Tudo pronto!')