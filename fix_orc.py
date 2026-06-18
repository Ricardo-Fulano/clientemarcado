with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. BG branco -> dark
c = c.replace("const BG='#F1F4F8'", "const BG='rgba(15,23,42,.88)'")

# 2. Itens de servico: fundo branco -> dark
c = c.replace(
    "style={{marginBottom:'12px',padding:'14px',background:'#F8FAFC',borderRadius:'12px',border:'1px solid #DCE3EA',width:'100%',maxWidth:'100%',boxSizing:'border-box'}}",
    "style={{marginBottom:'12px',padding:'14px',background:'rgba(255,255,255,.05)',borderRadius:'12px',border:'1px solid rgba(255,255,255,.10)',width:'100%',maxWidth:'100%',boxSizing:'border-box'}}"
)

# 3. Label cor cinza claro nos itens
c = c.replace(
    "style={{fontSize:'12px',fontWeight:600,color:'#667085',display:'block',marginBottom:'6px',whiteSpace:'normal',lineHeight:'1.3'}}",
    "style={{fontSize:'12px',fontWeight:600,color:'#94A3B8',display:'block',marginBottom:'6px',whiteSpace:'normal',lineHeight:'1.3'}}"
)
c = c.replace(
    "style={{fontSize:'12px',fontWeight:600,color:'#667085',display:'block',marginBottom:'6px'}}",
    "style={{fontSize:'12px',fontWeight:600,color:'#94A3B8',display:'block',marginBottom:'6px'}}"
)

# 4. Subtotal area branca
c = c.replace(
    "style={{marginTop:'16px',background:BG,borderRadius:'10px',padding:'14px 16px',width:'100%',maxWidth:'100%',boxSizing:'border-box'}}",
    "style={{marginTop:'16px',background:'rgba(255,255,255,.06)',borderRadius:'10px',padding:'14px 16px',width:'100%',maxWidth:'100%',boxSizing:'border-box',border:'1px solid rgba(255,255,255,.10)'}}"
)

# 5. Resumo mobile branco
c = c.replace(
    "style={{display:'none',background:'#fff',borderRadius:'14px',padding:'14px 16px',marginBottom:'12px',border:'1px solid #DCE3EA',boxShadow:'0 1px 3px rgba(0,0,0,.05)'}}",
    "style={{display:'none',background:'rgba(255,255,255,.06)',borderRadius:'14px',padding:'14px 16px',marginBottom:'12px',border:'1px solid rgba(255,255,255,.10)'}}"
)

# 6. Cores de texto claro no resumo mobile
c = c.replace("color:clienteNome?'#fff':'#475569'", "color:clienteNome?'#F8FAFC':'#475569'")

# 7. Accordion pagamento border clara
c = c.replace(
    "style={{padding:'0 24px 20px',borderTop:'1px solid #F1F4F8'}}",
    "style={{padding:'0 24px 20px',borderTop:'1px solid rgba(255,255,255,.08)'}}"
)

# 8. Cards resumo financeiro no accordion pagamento
c = c.replace(
    "{[{l:'Total',v:total,c:'#0F172A'},{l:'Pago',v:valorPagoLocal,c:'#16A34A'},{l:'Saldo',v:saldoLocal,c:saldoLocal>0?'#EA580C':'#16A34A'}].map(f=>(\n                          <div key={f.l} style={{background:BG,borderRadius:'8px',padding:'10px',border:'1px solid #DCE3EA'}}>",
    "{[{l:'Total',v:total,c:'#F8FAFC'},{l:'Pago',v:valorPagoLocal,c:'#4ADE80'},{l:'Saldo',v:saldoLocal,c:saldoLocal>0?'#FBBF24':'#4ADE80'}].map(f=>(\n                          <div key={f.l} style={{background:'rgba(255,255,255,.06)',borderRadius:'8px',padding:'10px',border:'1px solid rgba(255,255,255,.10)'}}>"
)

# 9. Form registrar pagamento no detalhe (branco)
c = c.replace(
    "style={{marginTop:'14px',background:'#F0F9FF',border:'1.5px solid #BAE6FD',borderRadius:'10px',padding:'16px'}}",
    "style={{marginTop:'14px',background:'rgba(59,130,246,.12)',border:'1.5px solid rgba(59,130,246,.28)',borderRadius:'10px',padding:'16px'}}"
)

# 10. Cards do detalhe financeiro (BG branco)
c = c.replace(
    "{[{l:'Total',v:orc.total,c:'#0F172A'},{l:'Pago',v:orc.valor_pago,c:'#16A34A'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#EA580C':'#16A34A'}].map(f=>(\n                    <div key={f.l} style={{background:BG,borderRadius:'8px',padding:'12px',border:'1px solid #DCE3EA'}}>",
    "{[{l:'Total',v:orc.total,c:'#F8FAFC'},{l:'Pago',v:orc.valor_pago,c:'#4ADE80'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#FBBF24':'#4ADE80'}].map(f=>(\n                    <div key={f.l} style={{background:'rgba(255,255,255,.06)',borderRadius:'8px',padding:'12px',border:'1px solid rgba(255,255,255,.10)'}}>"
)

# 11. Botoes cancelar brancos
c = c.replace(
    "style={{flex:1,background:'#F8FAFC',border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}",
    "style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}"
)
# Botao cancelar no detalhe
c = c.replace(
    "style={{flex:1,background:'#F8FAFC',border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>\n                      <button disabled={savingPag}",
    "style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>\n                      <button disabled={savingPag}"
)

# 12. Input desconto fundo claro
c = c.replace(
    "style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',outline:'none',color:'#F87171'",
    "style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(255,255,255,.12)',outline:'none',color:'#F87171'"
)

print('BG fix:', 'rgba(15,23,42,.88)' in c)
print('Item dark:', "background:'rgba(255,255,255,.05)'" in c)
print('Subtotal dark:', "background:'rgba(255,255,255,.06)'" in c)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
