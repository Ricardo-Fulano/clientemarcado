const fs = require('fs')
let perfil = fs.readFileSync('app/painel/perfil/page.tsx', 'utf8')

// 1. Adicionar campos de promo ao payload do salvar
const payloadEnd = `    if(in`
const promoPayload = `    // Campos de promoção
    payloadBase.promocao_ativa=promoAtiva
    payloadBase.promocao_titulo=promoTitulo.trim()||null
    payloadBase.promocao_descricao=promoDesc.trim()||null
    payloadBase.promocao_preco_antigo=promoPrecoAnt?parseFloat(promoPrecoAnt.replace(',','.'))||null:null
    payloadBase.promocao_preco_novo=promoPrecoNovo?parseFloat(promoPrecoNovo.replace(',','.'))||null:null
    payloadBase.promocao_botao_texto=promoBotao.trim()||'Agendar promoção'
    payloadBase.promocao_observacao=promoObs.trim()||null
    payloadBase.promocao_data_inicio=promoInicio||null
    payloadBase.promocao_data_fim=promoFim||null
    if(in`

perfil = perfil.replace(payloadEnd, promoPayload)

// 2. Adicionar estados
const estadosMarker = `  const [salvando,setSalvando]=useState(false)`
const novosEstados = `  const [salvando,setSalvando]=useState(false)
  const [promoAtiva,setPromoAtiva]=useState(false)
  const [promoTitulo,setPromoTitulo]=useState('')
  const [promoDesc,setPromoDesc]=useState('')
  const [promoPrecoAnt,setPromoPrecoAnt]=useState('')
  const [promoPrecoNovo,setPromoPrecoNovo]=useState('')
  const [promoBotao,setPromoBotao]=useState('Agendar promoção')
  const [promoObs,setPromoObs]=useState('')
  const [promoInicio,setPromoInicio]=useState('')
  const [promoFim,setPromoFim]=useState('')`

if (!perfil.includes('promoAtiva')) {
  perfil = perfil.replace(estadosMarker, novosEstados)
  console.log('✓ Estados adicionados')
}

// 3. Carregar campos de promo no load
const loadMarker = `setPerfil(p)`
const loadPromo = `setPerfil(p)
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
    }`

if (!perfil.includes('setPromoAtiva(p.')) {
  perfil = perfil.replace(loadMarker, loadPromo)
  console.log('✓ Load da promo adicionado')
}

// 4. Adicionar seção visual antes do botão salvar perfil
const btnSalvarMarker = `{salvando?'Salvando...':'Salvar perfil'}`
const secaoPromo = `{salvando?'Salvando...':'Salvar perfil'}`

// Inserir seção de promoção antes do botao salvar - encontrar o div pai
const divAntesBotao = `        </div></div>
      </div>
    </div>
  )
}`

const secaoPromoHTML = `        </div></div>

        {/* SECAO PROMOCAO */}
        <div style={{marginTop:32,background:'radial-gradient(circle at top right,rgba(245,158,11,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.98),rgba(8,20,33,.99))',border:'1px solid rgba(245,158,11,.25)',borderRadius:20,padding:'24px 28px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap' as const,gap:10}}>
            <div>
              <h3 style={{fontSize:16,fontWeight:800,color:'#F8FAFC',marginBottom:4}}>Promoção em destaque</h3>
              <p style={{fontSize:13,color:'#64748B'}}>Cadastre uma oferta para aparecer na sua página pública.</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:999,background:promoAtiva?'rgba(34,197,94,.14)':'rgba(100,116,139,.14)',color:promoAtiva?'#4ADE80':'#64748B',border:'1px solid '+(promoAtiva?'rgba(34,197,94,.25)':'rgba(100,116,139,.2)')}}>
                {promoAtiva?'Ativa na página pública':'Oculta'}
              </span>
              <button onClick={()=>setPromoAtiva(a=>!a)} style={{background:promoAtiva?'rgba(34,197,94,.14)':'rgba(100,116,139,.10)',border:'1px solid '+(promoAtiva?'rgba(34,197,94,.25)':'rgba(100,116,139,.2)'),borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,color:promoAtiva?'#4ADE80':'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>
                {promoAtiva?'Desativar':'Ativar promoção'}
              </button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
            {[
              {lbl:'Título da promoção',val:promoTitulo,set:setPromoTitulo,ph:'Ex: Corte + Barba Especial'},
              {lbl:'Descrição curta',val:promoDesc,set:setPromoDesc,ph:'Ex: Oferta válida por tempo limitado'},
              {lbl:'Preço antigo (R$)',val:promoPrecoAnt,set:setPromoPrecoAnt,ph:'Ex: 80'},
              {lbl:'Preço promocional (R$)',val:promoPrecoNovo,set:setPromoPrecoNovo,ph:'Ex: 59.90'},
              {lbl:'Texto do botão',val:promoBotao,set:setPromoBotao,ph:'Agendar promoção'},
              {lbl:'Observação',val:promoObs,set:setPromoObs,ph:'Ex: Válido até domingo'},
              {lbl:'Data início',val:promoInicio,set:setPromoInicio,ph:'',type:'date'},
              {lbl:'Data fim',val:promoFim,set:setPromoFim,ph:'',type:'date'},
            ].map(({lbl,val,set,ph,type}:any)=>(
              <div key={lbl}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:6}}>{lbl}</label>
                <input type={type||'text'} value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={{width:'100%',background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.18)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#F8FAFC',fontFamily:'inherit',outline:'none',boxSizing:'border-box' as const}}/>
              </div>
            ))}
          </div>
          {/* Preview */}
          {promoAtiva&&promoTitulo&&(
            <div style={{marginTop:24}}>
              <p style={{fontSize:11,fontWeight:700,color:'#475569',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:12}}>Prévia na página pública</p>
              <div style={{background:'radial-gradient(circle at top right,rgba(245,158,11,.18),transparent 35%),linear-gradient(135deg,rgba(15,23,42,.98),rgba(17,24,39,.96))',border:'1px solid rgba(245,158,11,.35)',borderRadius:18,padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:20,flexWrap:'wrap' as const}}>
                <div style={{flex:1,minWidth:200}}>
                  <p style={{fontSize:10,fontWeight:800,color:'#F59E0B',letterSpacing:'.12em',textTransform:'uppercase' as const,marginBottom:6}}>Oferta da semana</p>
                  <p style={{fontSize:20,fontWeight:900,color:'#F8FAFC',marginBottom:4}}>{promoTitulo}</p>
                  {promoDesc&&<p style={{fontSize:13,color:'#CBD5E1'}}>{promoDesc}</p>}
                </div>
                <div style={{display:'flex',flexDirection:'column' as const,alignItems:'center',gap:8}}>
                  {promoPrecoAnt&&<p style={{fontSize:12,color:'#64748B',textDecoration:'line-through',margin:0}}>De R$ {promoPrecoAnt}</p>}
                  {promoPrecoNovo&&<p style={{fontSize:24,fontWeight:900,color:'#F59E0B',margin:0}}>R$ {promoPrecoNovo}</p>}
                  <div style={{background:'#F59E0B',color:'#020617',borderRadius:10,padding:'8px 18px',fontSize:13,fontWeight:800}}>{promoBotao||'Agendar promoção'} →</div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}`

if (!perfil.includes('SECAO PROMOCAO')) {
  perfil = perfil.replace(divAntesBotao, secaoPromoHTML)
  console.log('✓ Seção visual adicionada!')
} else {
  console.log('✓ Seção já existe')
}

fs.writeFileSync('app/painel/perfil/page.tsx', perfil, 'utf8')
console.log('\nLinhas perfil final:', perfil.split('\n').length)