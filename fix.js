const fs = require('fs')
let c = fs.readFileSync('app/painel/agendamentos/page.tsx', 'utf8')

// Remover bloco CSS - buscar de forma mais abrangente
// O CSS começa com const CSS=` e termina com ` seguido de newline
let i = 0
while (true) {
  const start = c.indexOf('const CSS=`', i)
  if (start === -1) break
  
  // Encontrar o fechamento correto do template literal
  let pos = start + 11
  let depth = 1
  while (pos < c.length && depth > 0) {
    if (c[pos] === '`' && c[pos-1] !== '\\') depth--
    if (depth > 0) pos++
    else break
  }
  const end = pos + 1
  
  console.log('Removendo CSS de linha', c.slice(0,start).split('\n').length, 'ate', c.slice(0,end).split('\n').length)
  c = c.slice(0, start) + c.slice(end)
  i = start
}

// Remover usos do CSS
c = c.replace(/<style>\{CSS\}<\/style>\n?/g, '')
c = c.replace(/<style\s+jsx[^>]*>\{CSS\}<\/style>\n?/g, '')
c = c.replace(/\{CSS\}/g, '')

// Salvar
fs.writeFileSync('app/painel/agendamentos/page.tsx', c, 'utf8')
console.log('Pronto! Linhas:', c.split('\n').length)

// Verificar linha 215
c.split('\n').slice(213,220).forEach((l,i)=>console.log(i+214, l.slice(0,60)))