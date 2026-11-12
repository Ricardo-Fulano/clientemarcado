import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const api = readFileSync('app/api/parceiro/[cupom]/route.ts', 'utf8')
const legado = readFileSync('app/parceiro/[cupom]/page.tsx', 'utf8')
const admin = readFileSync('app/painel/parceiros/page.tsx', 'utf8')
assert.match(api, /status:\s*410/)
assert.doesNotMatch(api, /SUPABASE_SERVICE_ROLE_KEY|indicacoes_parceiros|comissoes_parceiros/)
assert.match(legado, /\/painel\/afiliado/)
assert.doesNotMatch(legado, /fetch\(/)
assert.match(admin, /window\.location\.origin}\/(?:painel\/afiliado)/)
assert.doesNotMatch(admin, /\$\{base\}\/parceiro\/\$\{c\}/)
console.log('OK: painel legado fechado; link administrativo usa painel autenticado.')
