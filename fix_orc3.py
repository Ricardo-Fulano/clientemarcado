with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. BG branco -> dark
c = c.replace("const BG='#F1F4F8'", "const BG='rgba(255,255,255,.06)'")

# 2. Loading fundo branco
c = c.replace("style={{display:'flex',minHeight:'100vh',background:BG}}",
              "style={{display:'flex',minHeight:'100vh',background:'#050B16'}}")

# 3. Itens servico fundo branco -> dark
c = c.replace(
    "style={{marginBottom:'12px',padding:'14px',background:'#F8FAFC',borderRadius:'12px',border:'1px solid #DCE3EA'",
    "style={{marginBottom:'12px',padding:'14px',background:'rgba(255,255,255,.05)',borderRadius:'12px',border:'1px solid rgba(255,255,255,.10)'"
)

# 4. Subtotal borderBottom
c = c.replace("borderBottom:'1px solid #DCE3EA'", "borderBottom:'1px solid rgba(255,255,255,.10)'")

# 5. Resumo mobile branco
c = c.replace(
    "style={{display:'none',background:'#fff',borderRadius:'14px',padding:'14px 16px',marginBottom:'12px',border:'1px solid #DCE3EA',boxShadow:'0 1px 3px rgba(0,0,0,.05)'}}",
    "style={{display:'none',background:'linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',borderRadius:'14px',padding:'14px 16px',marginBottom:'12px',border:'1px solid rgba(255,255,255,.10)'}}"
)
c = c.replace("color:'#667085',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'10px'",
              "color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'10px'")

# 6. Accordion pagamento borderTop clara
c = c.replace("style={{padding:'0 24px 20px',borderTop:'1px solid #F1F4F8'}}",
              "style={{padding:'0 24px 20px',borderTop:'1px solid rgba(255,255,255,.08)'}}")

# 7. Cards financeiros no accordion - cores texto dark
c = c.replace(
    "{l:'Total',v:total,c:'#0F172A'},{l:'Pago',v:valorPagoLocal,c:'#16A34A'},{l:'Saldo',v:saldoLocal,c:saldoLocal>0?'#EA580C':'#16A34A'}].map(f=>(\n                          <div key={f.l} style={{background:BG,borderRadius:'8px',padding:'10px',border:'1px solid #DCE3EA'}}>\n                            <p style={{fontSize:'10px',fontWeight:600,color:'#667085'",
    "{l:'Total',v:total,c:'#F8FAFC'},{l:'Pago',v:valorPagoLocal,c:'#4ADE80'},{l:'Saldo',v:saldoLocal,c:saldoLocal>0?'#FBBF24':'#4ADE80'}].map(f=>(\n                          <div key={f.l} style={{background:'rgba(255,255,255,.06)',borderRadius:'8px',padding:'10px',border:'1px solid rgba(255,255,255,.10)'}}>\n                            <p style={{fontSize:'10px',fontWeight:600,color:'#94A3B8'"
)

# 8. Sinal entrada BG branco
c = c.replace(
    "style={{background:BG,borderRadius:'10px',padding:'14px',border:'1px solid #DCE3EA',display:'flex',flexDirection:'column',gap:'10px'}}",
    "style={{background:'rgba(255,255,255,.06)',borderRadius:'10px',padding:'14px',border:'1px solid rgba(255,255,255,.10)',display:'flex',flexDirection:'column',gap:'10px'}}"
)

# 9. Pagamentos hist - botoes brancos
c = c.replace(
    "style={{flex:1,background:'#F8FAFC',border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>Cancelar",
    "style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Cancelar"
)
c = c.replace(
    "style={{background:'#F8FAFC',border:'1.5px solid #DCE3EA',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>Editar",
    "style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Editar"
)
c = c.replace(
    "style={{background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#DC2626',cursor:'pointer',fontFamily:'inherit'}}>Excluir",
    "style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.24)',borderRadius:'6px',padding:'3px 8px',fontSize:'11px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>Excluir"
)

# 10. Form pag detalhe branco
c = c.replace(
    "style={{marginTop:'14px',background:'#F0F9FF',border:'1.5px solid #BAE6FD',borderRadius:'10px',padding:'16px'}}",
    "style={{marginTop:'14px',background:'rgba(59,130,246,.12)',border:'1.5px solid rgba(59,130,246,.28)',borderRadius:'10px',padding:'16px'}}"
)

# 11. Cards detalhe financeiro BG branco
c = c.replace(
    "{l:'Total',v:orc.total,c:'#0F172A'},{l:'Pago',v:orc.valor_pago,c:'#16A34A'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#EA580C':'#16A34A'}].map(f=>(\n                    <div key={f.l} style={{background:BG,borderRadius:'8px',padding:'12px',border:'1px solid #DCE3EA'}}>\n                      <p style={{fontSize:'10px',fontWeight:600,color:'#667085'",
    "{l:'Total',v:orc.total,c:'#F8FAFC'},{l:'Pago',v:orc.valor_pago,c:'#4ADE80'},{l:'Saldo',v:orc.saldo_restante,c:orc.saldo_restante>0?'#FBBF24':'#4ADE80'}].map(f=>(\n                    <div key={f.l} style={{background:'rgba(255,255,255,.06)',borderRadius:'8px',padding:'12px',border:'1px solid rgba(255,255,255,.10)'}}>\n                      <p style={{fontSize:'10px',fontWeight:600,color:'#94A3B8'"
)

# 12. Cancelar detalhe
c = c.replace(
    "style={{flex:1,background:'#F8FAFC',border:'1.5px solid #DCE3EA',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#667085',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>\n                      <button disabled={savingPag}",
    "style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:600,color:'#94A3B8',cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>\n                      <button disabled={savingPag}"
)

# 13. Mensagem detalhe verde clara
c = c.replace(
    "style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'14px',background:'#F0FDF4',border:'1px solid #BBF7D0',color:'#16A34A'}}",
    "style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'14px',background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.30)',color:'#4ADE80'}}"
)

# 14. Botao wpp verde claro detalhe
c = c.replace(
    "style={{background:'#F0FFF4',border:'1.5px solid #86EFAC',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#16A34A',cursor:'pointer',fontFamily:'inherit'}}>WhatsApp",
    "style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.28)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>WhatsApp"
)

# 15. Botao wpp verde claro form
c = c.replace(
    "style={{background:'#F0FFF4',border:'1.5px solid #86EFAC',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#16A34A',cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',opacity:clienteWpp?1:0.5}}",
    "style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.28)',borderRadius:'8px',padding:'8px 14px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:clienteWpp?'pointer':'not-allowed',fontFamily:'inherit',opacity:clienteWpp?1:0.5}}"
)

# 16. Botao + Registrar pagamento azul claro
c = c.replace(
    "style={{background:'#EFF6FF',border:'1.5px solid #BFDBFE',borderRadius:'6px',padding:'5px 12px',fontSize:'12px',fontWeight:600,color:'#2563EB',cursor:'pointer',fontFamily:'inherit'}}",
    "style={{background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.30)',borderRadius:'6px',padding:'5px 12px',fontSize:'12px',fontWeight:600,color:'#93C5FD',cursor:'pointer',fontFamily:'inherit'}}"
)

# 17. Botao remover item branco
c = c.replace(
    "style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:'6px',color:'#EF4444',cursor:'pointer',fontSize:'13px',padding:'3px 8px'}}",
    "style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.28)',borderRadius:'6px',color:'#F87171',cursor:'pointer',fontSize:'13px',padding:'3px 8px'}}"
)

# Verificar cores claras restantes
import re
claras = list(set(re.findall(r"background:'(#[Ee-Ff][0-9A-Fa-f]{5})'", c)))
print('Cores claras restantes:', claras[:10])
print('DENTES ok:', 'DENTES_SUPERIOR' in c)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
