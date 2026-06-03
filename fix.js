const fs = require('fs')
let c = fs.readFileSync('app/painel/perfil/page.tsx', 'utf8')

const marker = `const [salvando,setSalvando]=useState(false)`
const replacement = `const [salvando,setSalvando]=useState(false)
  const [promoAtiva,setPromoAtiva]=useState(false)
  const [promoTitulo,setPromoTitulo]=useState('')
  const [promoDesc,setPromoDesc]=useState('')
  const [promoPrecoAnt,setPromoPrecoAnt]=useState('')
  const [promoPrecoNovo,setPromoPrecoNovo]=useState('')
  const [promoBotao,setPromoBotao]=useState('Agendar promoção')
  const [promoObs,setPromoObs]=useState('')
  const [promoInicio,setPromoInicio]=useState('')
  const [promoFim,setPromoFim]=useState('')`

c = c.replace(marker, replacement)

// Adicionar load dos campos de promo
const loadMarker = `setPerfil(p)`
if (!c.includes('setPromoAtiva(p.')) {
  c = c.replace(loadMarker, `setPerfil(p)
    if(p){
      setPromoAtiva(p.promocao_ativa||false)
      setPromoTitulo(p.promocao_titulo||'')
      setPromoDesc(p.promocao_descricao||'')
      setPromoPrecoAnt(p.promocao_preco_antigo?String(p.promocao_preco_antigo):'')
      setPromoPrecoNovo(p.promocao_preco_novo?String(p.promocao_preco_novo):'')
      setPromoBotao(p.promocao_botao_texto||'Agendar promoção')
      setPromoObs(p.promocao_observacao||'')
      setPromoInicio(p.promocao_data_inicio||'')
      setPromoFim(p.promocao_data_fim||'')
    }`)
  console.log('✓ Load adicionado')
}

fs.writeFileSync('app/painel/perfil/page.tsx', c, 'utf8')
console.log('✓ Estados adicionados! Linhas:', c.split('\n').length)