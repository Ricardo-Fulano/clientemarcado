with open('app/painel/servicos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Validação: remover obrigatoriedade do preço (só nome é obrigatório)
old_val = "    if(!fNome.trim()){setMsg('Informe o nome do servico.');return}
    if(!fDur){setMsg('Informe a duracao.');return}"
new_val = "    if(!fNome.trim()){setMsg('Informe o nome do servico.');return}\n    if(!fDur){setMsg('Informe a duracao.');return}"
print('1 val:', old_val in c)
c = c.replace(old_val, new_val, 1)

# 2. Payload: salvar preco como 0 em vez de null quando vazio
old_payload = "      preco:parseFloat(fPreco.replace(',','.'))||0,"
new_payload = "      preco:parseFloat(fPreco.replace(',','.'))||0,"
print('2 payload:', old_payload in c)
c = c.replace(old_payload, new_payload, 1)

# 3. Adicionar texto auxiliar abaixo do campo valor
old_valor_field = """                <div><label className="lbl">Valor (R$)</label><div style={{position:'relative'}}><span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600}}>R$</span><input className="inp" type="text" inputMode="decimal" placeholder="0,00" value={fPreco} onChange={e=>setFPreco(e.target.value)} style={{paddingLeft:'36px'}}/></div><p style={{fontSize:'11px',color:'#475569',marginTop:'5px',lineHeight:1.5}}>Deixe R$ 0,00 para retornos, avaliações ou atendimentos sem cobrança.</p></div>"""
new_valor_field = """                <div><label className="lbl">Valor (R$)</label><div style={{position:'relative'}}><span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600}}>R$</span><input className="inp" type="text" inputMode="decimal" placeholder="0,00" value={fPreco} onChange={e=>setFPreco(e.target.value)} style={{paddingLeft:'36px'}}/></div><p style={{fontSize:'11px',color:'#475569',marginTop:'5px',lineHeight:1.5}}>Deixe R$ 0,00 para retornos, avaliações ou atendimentos sem cobrança.</p></div>"""
print('3 helper:', old_valor_field in c)
c = c.replace(old_valor_field, new_valor_field, 1)

# 4. Na listagem: mostrar "Gratuito" quando preco=0, sem ocultar o valor
old_preco_display = "                    <p style={{fontSize:'20px',fontWeight:800,marginBottom:'8px',color:s.preco&&s.preco>0?'#4ADE80':'#475569'}}>{s.preco&&s.preco>0?fBRL(s.preco):'Gratuito'}</p>"
new_preco_display = "                    <p style={{fontSize:'20px',fontWeight:800,marginBottom:'8px',color:s.preco&&s.preco>0?'#4ADE80':'#475569'}}>{s.preco&&s.preco>0?fBRL(s.preco):'Gratuito'}</p>"
print('4 display:', old_preco_display in c)
c = c.replace(old_preco_display, new_preco_display, 1)

with open('app/painel/servicos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO!')
print('preco 0:', "||0," in c)
print('Gratuito:', "Gratuito" in c)
print('helper text:', "sem cobrança" in c)
