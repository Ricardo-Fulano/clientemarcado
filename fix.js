const fs = require('fs')
let c = fs.readFileSync('app/painel/servicos/page.tsx', 'utf8')

// 1. Fix visual - adicionar whitespace nowrap no span das infoItems
c = c.replace(
  "{infoItems.map((item,i)=>(<span key={i} style={{fontSize:'11px',color:'#94A3B8',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'6px',padding:'2px 8px'}}>{item}</span>))}",
  "{infoItems.map((item,i)=>(<span key={i} style={{fontSize:'11px',color:'#94A3B8',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'6px',padding:'2px 8px',whiteSpace:'nowrap',display:'inline-flex',alignItems:'center'}}>{item}</span>))}"
)

// 2. Fix save - o problema e que ativo:true sobrescreve o status atual
// Manter o ativo atual do servico ao editar
c = c.replace(
  "const payload={nome:fNome.trim(),descricao:fDesc.trim()||null,preco:parseFloat(fPreco.replace(',','.'))||null,duracao:fDur,categoria:fCat,profissional_nome:fProf.trim()||null,ativo:true}",
  "const payload={nome:fNome.trim(),descricao:fDesc.trim()||null,preco:parseFloat(fPreco.replace(',','.'))||null,duracao:fDur,categoria:fCat,profissional_nome:fProf.trim()||null}"
)

// No insert, adicionar ativo:true
c = c.replace(
  "else{await supabase.from('servicos').insert({user_id:userId,...payload})}",
  "else{await supabase.from('servicos').insert({user_id:userId,ativo:true,...payload})}"
)

fs.writeFileSync('app/painel/servicos/page.tsx', c, 'utf8')

// Verificar
const idx = c.indexOf('async function salvar')
console.log(c.slice(idx, idx+500))
console.log('\nFeito!')