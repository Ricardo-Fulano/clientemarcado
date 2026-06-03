const fs = require('fs')
let c = fs.readFileSync('app/painel/perfil/page.tsx', 'utf8')

// Encontrar onde payloadSeguro termina os campos opcionais
const marker = `    if(capUrl!==undefined) payloadSeguro.capa_url=capUrl||null`
const promoFields = `    if(capUrl!==undefined) payloadSeguro.capa_url=capUrl||null
    // Campos de promoção
    payloadSeguro.promocao_ativa=promoAtiva
    payloadSeguro.promocao_titulo=promoTitulo.trim()||null
    payloadSeguro.promocao_descricao=promoDesc.trim()||null
    payloadSeguro.promocao_preco_antigo=promoPrecoAnt?parseFloat(promoPrecoAnt.replace(',','.'))||null:null
    payloadSeguro.promocao_preco_novo=promoPrecoNovo?parseFloat(promoPrecoNovo.replace(',','.'))||null:null
    payloadSeguro.promocao_botao_texto=promoBotao.trim()||'Agendar promoção'
    payloadSeguro.promocao_observacao=promoObs.trim()||null
    payloadSeguro.promocao_data_inicio=promoInicio||null
    payloadSeguro.promocao_data_fim=promoFim||null`

c = c.replace(marker, promoFields)

// Remover os campos do payloadBase que nao existe mais
c = c.replace(`    // Campos de promoção
    payloadBase.promocao_ativa=promoAtiva
    payloadBase.promocao_titulo=promoTitulo.trim()||null
    payloadBase.promocao_descricao=promoDesc.trim()||null
    payloadBase.promocao_preco_antigo=promoPrecoAnt?parseFloat(promoPrecoAnt.replace(',','.'))||null:null
    payloadBase.promocao_preco_novo=promoPrecoNovo?parseFloat(promoPrecoNovo.replace(',','.'))||null:null
    payloadBase.promocao_botao_texto=promoBotao.trim()||'Agendar promoção'
    payloadBase.promocao_observacao=promoObs.trim()||null
    payloadBase.promocao_data_inicio=promoInicio||null
    payloadBase.promocao_data_fim=promoFim||null`, '')

fs.writeFileSync('app/painel/perfil/page.tsx', c, 'utf8')
console.log('Corrigido! Verificando...')
const idx = c.indexOf('promocao_ativa')
console.log(c.slice(idx-10, idx+100))