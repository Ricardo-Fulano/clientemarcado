const fs = require('fs')
let c = fs.readFileSync('app/painel/servicos/page.tsx', 'utf8')

// Ver trecho exato atual
const idx = c.indexOf('async function salvar')
console.log('ATUAL:')
console.log(c.slice(idx, idx+500))
console.log('---')

// Substituicao simples: apenas remover user_id do payload e corrigir
// A linha atual tem user_id:userId no payload
// Vamos apenas garantir que update nao envia user_id

// Remover user_id do inicio do payload
c = c.replace('const payload={user_id:userId,nome:', 'const payload={nome:')

// Adicionar user_id no insert separadamente  
c = c.replace(
  "else{await supabase.from('servicos').insert(payload)}",
  "else{await supabase.from('servicos').insert({user_id:userId,...payload})}"
)

fs.writeFileSync('app/painel/servicos/page.tsx', c, 'utf8')

// Verificar resultado
const idx2 = c.indexOf('async function salvar')
console.log('RESULTADO:')
console.log(c.slice(idx2, idx2+500))