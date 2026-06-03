const fs = require('fs')

let ag = fs.readFileSync('app/painel/agendamentos/page.tsx', 'utf8')

// Extrair o CSS do template literal
const cssStart = ag.indexOf('\nconst CSS=`\n') + 1
const cssEnd = ag.indexOf('\n`\n', cssStart + 100) + 3
const cssBlock = ag.slice(cssStart, cssEnd)
const cssContent = cssBlock.slice('const CSS=`\n'.length, cssBlock.length - 3)

// Salvar CSS em arquivo separado
fs.writeFileSync('app/painel/agendamentos/agenda.css', cssContent, 'utf8')
console.log('CSS salvo em agenda.css')

// Remover o CSS do page.tsx e adicionar import
const semCSS = ag.slice(0, cssStart) + ag.slice(cssEnd)

// Adicionar import do CSS após 'use client'
const comImport = semCSS.replace(
  "'use client'\n",
  "'use client'\nimport './agenda.css'\n"
)

// Remover uso do CSS inline: <style>{CSS}</style>
const semStyle = comImport.replace(/<style>\{CSS\}<\/style>\n?/g, '')

fs.writeFileSync('app/painel/agendamentos/page.tsx', semStyle, 'utf8')
console.log('page.tsx atualizado!')
console.log('Linhas:', semStyle.split('\n').length)

// Verificar primeiras linhas
semStyle.split('\n').slice(0,5).forEach((l,i) => console.log(i+1, l.slice(0,60)))