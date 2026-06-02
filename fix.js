const fs = require('fs')

let c = fs.readFileSync('components/AcessoGuard.tsx', 'utf8')
c = c.replace(
  "import { supabase } from '../app/lib/supabase'",
  "import { supabase } from '@/app/lib/supabase'"
)
fs.writeFileSync('components/AcessoGuard.tsx', c, 'utf8')
console.log('Caminho corrigido!')

// Verificar
const linha = c.split('\n').find(l => l.includes('supabase'))
console.log(linha)