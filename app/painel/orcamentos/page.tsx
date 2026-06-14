with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Padding menor no mobile para o form
old_pad = "  @media(max-width:1023px){\n    .cm-mobile-footer{display:flex!important}\n    .cm-form-grid{grid-template-columns:1fr!important}\n    .cm-form-right{display:none!important}\n    .cm-resumo-mobile{display:block!important}\n    .cm-2col{grid-template-columns:1fr!important}\n    .cm-metrics{grid-template-columns:1fr 1fr!important}\n    .cm-kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}\n    .cm-tabela-desktop{display:none!important}\n    .cm-cards-mobile{display:flex!important;flex-direction:column!important;gap:10px!important}\n    .cm-lista-pad,.cm-form-pad,.cm-detalhe-pad{padding:16px 16px 130px!important}\n    .cm-filtros-wrap{display:flex!important;flex-wrap:wrap!important;overflow:visible!important;width:100%!important;max-width:100%!important;gap:8px!important}\n  }"
new_pad = "  @media(max-width:1023px){\n    .cm-mobile-footer{display:flex!important}\n    .cm-form-grid{grid-template-columns:1fr!important}\n    .cm-form-right{display:none!important}\n    .cm-resumo-mobile{display:block!important}\n    .cm-2col{grid-template-columns:1fr!important}\n    .cm-metrics{grid-template-columns:1fr 1fr!important}\n    .cm-kpi-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}\n    .cm-tabela-desktop{display:none!important}\n    .cm-cards-mobile{display:flex!important;flex-direction:column!important;gap:10px!important}\n    .cm-lista-pad,.cm-form-pad,.cm-detalhe-pad{padding:12px 12px 130px!important}\n    .cm-filtros-wrap{display:flex!important;flex-wrap:wrap!important;overflow:visible!important;width:100%!important;max-width:100%!important;gap:8px!important}\n    .cm-form-inner{padding:12px!important}\n  }"
print('1 pad:', old_pad in c)
c = c.replace(old_pad, new_pad, 1)

# 2. Trocar emoji 👤 por SVG no card Cliente
old_user = "                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>\n                        <span style={{fontSize:'16px'}}>👤</span>\n                        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>Cliente</p>\n                      </div>"
new_user = "                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>\n                        <div style={{width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#60A5FA\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/></svg></div>\n                        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>Cliente</p>\n                      </div>"
print('2 user:', old_user in c)
c = c.replace(old_user, new_user, 1)

# 3. Trocar emoji 📋 por SVG no card Detalhes
old_det = "                          <span style={{fontSize:'16px'}}>📋</span>\n                          <div>\n                            <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Detalhes do documento</p>"
new_det = "                          <div style={{width:'26px',height:'26px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#94A3B8\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/><line x1=\"16\" y1=\"13\" x2=\"8\" y2=\"13\"/><line x1=\"16\" y1=\"17\" x2=\"8\" y2=\"17\"/></svg></div>\n                          <div>\n                            <p style={{fontSize:'14px',fontWeight:700,color:'#fff'}}>Detalhes do documento</p>"
print('3 det:', old_det in c)
c = c.replace(old_det, new_det, 1)

# 4. Trocar emoji ✂️ por SVG no card Serviços
old_serv = "                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>\n                        <span style={{fontSize:'16px'}}>✂️</span>\n                        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>Serviços / Procedimentos</p>\n                      </div>"
new_serv = "                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>\n                        <div style={{width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#A78BFA\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><line x1=\"8\" y1=\"6\" x2=\"21\" y2=\"6\"/><line x1=\"8\" y1=\"12\" x2=\"21\" y2=\"12\"/><line x1=\"8\" y1=\"18\" x2=\"21\" y2=\"18\"/><line x1=\"3\" y1=\"6\" x2=\"3.01\" y2=\"6\"/><line x1=\"3\" y1=\"12\" x2=\"3.01\" y2=\"12\"/><line x1=\"3\" y1=\"18\" x2=\"3.01\" y2=\"18\"/></svg></div>\n                        <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>Serviços / Procedimentos</p>\n                      </div>"
print('4 serv:', old_serv in c)
c = c.replace(old_serv, new_serv, 1)

# 5. Ocultar bloco odontograma toggle quando tipoOrc==='comum' (ja tem condicao tipoOrc!=='odonto', ok)
# Ocultar card Pagamento quando tipoOrc==='comum'
old_pag_card = "                    <div style={{...card,padding:0,overflow:'hidden'}}>\n                      <div onClick={()=>setShowPagSection(!showPagSection)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',cursor:'pointer',userSelect:'none'}}>\n                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>\n                          <span style={{fontSize:'16px'}}>💳</span>"
new_pag_card = "                    {tipoOrc!=='comum'&&<div style={{...card,padding:0,overflow:'hidden'}}>\n                      <div onClick={()=>setShowPagSection(!showPagSection)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',cursor:'pointer',userSelect:'none'}}>\n                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>\n                          <span style={{fontSize:'16px'}}>💳</span>"
print('5 pag:', old_pag_card in c)
c = c.replace(old_pag_card, new_pag_card, 1)

# Fechar o condicional do card pagamento
old_pag_end = "                      )}\n                    </div>\n                    <div style={{...card,padding:0,overflow:'hidden'}}>\n                      <div onClick={()=>setShowObs(!showObs)}"
new_pag_end = "                      )}\n                    </div>}\n                    {tipoOrc!=='comum'&&<div style={{...card,padding:0,overflow:'hidden'}}>\n                      <div onClick={()=>setShowObs(!showObs)}"
print('5b pag end:', old_pag_end in c)
c = c.replace(old_pag_end, new_pag_end, 1)

# Fechar o condicional do card observacoes
old_obs_end = "                      {showObs&&<div style={{padding:'0 24px 20px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',flexDirection:'column',gap:'10px',marginTop:'16px'}}>\n                        <div><label style={lbl}>Observação do cliente</label><textarea rows={2} style={{...inp,resize:'none' as const}} placeholder=\"Alergias, preferências...\" value={clienteObs} onChange={e=>setClienteObs(e.target.value)}/></div>\n                        <div><label style={lbl}>Observações do orçamento</label><textarea rows={3} style={{...inp,resize:'none' as const}} placeholder=\"Informações adicionais...\" value={observacoes} onChange={e=>setObservacoes(e.target.value)}/></div>\n                      </div>}\n                    </div>\n                    <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px 16px',background:'rgba(59,130,246,.08)',borderRadius:'10px',border:'1px solid rgba(59,130,246,.18)'}}>"
new_obs_end = "                      {showObs&&<div style={{padding:'0 24px 20px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',flexDirection:'column',gap:'10px',marginTop:'16px'}}>\n                        <div><label style={lbl}>Observação do cliente</label><textarea rows={2} style={{...inp,resize:'none' as const}} placeholder=\"Alergias, preferências...\" value={clienteObs} onChange={e=>setClienteObs(e.target.value)}/></div>\n                        <div><label style={lbl}>Observações do orçamento</label><textarea rows={3} style={{...inp,resize:'none' as const}} placeholder=\"Informações adicionais...\" value={observacoes} onChange={e=>setObservacoes(e.target.value)}/></div>\n                      </div>}\n                    </div>}\n                    {tipoOrc==='comum'&&(\n                      <div style={{marginTop:'4px',marginBottom:'12px'}}>\n                        <label style={lbl}>Observações (opcional)</label>\n                        <textarea rows={2} style={{...inp,resize:'none' as const}} placeholder=\"Ex: cliente preferiu parcelar, combinado via Pix...\" value={observacoes} onChange={e=>setObservacoes(e.target.value)}/>\n                      </div>\n                    )}\n                    <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px 16px',background:'rgba(59,130,246,.08)',borderRadius:'10px',border:'1px solid rgba(59,130,246,.18)'}}>"
print('6 obs end:', old_obs_end in c)
c = c.replace(old_obs_end, new_obs_end, 1)

# 7. Remover emoji 💡 da dica
old_dica = "                      <span style={{fontSize:'16px'}}>💡</span>\n                      <p style={{fontSize:'12px',color:'#93C5FD'}}>Dica: você pode adicionar serviços, descontos e pagamentos parciais.</p>"
new_dica = "                      <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#93C5FD\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\" style={{flexShrink:0}}><circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"16\" x2=\"12.01\" y2=\"16\"/></svg>\n                      <p style={{fontSize:'12px',color:'#93C5FD'}}>Dica: você pode adicionar serviços, descontos e pagamentos parciais.</p>"
print('7 dica:', old_dica in c)
c = c.replace(old_dica, new_dica, 1)

# 8. Trocar emoji 📄 no botao salvar desktop
old_btn_salvar = "                        {editandoId?'Salvar alterações':'Criar orçamento'}"
new_btn_salvar = "                        {editandoId?'Salvar alterações':'Criar orçamento'}"
print('8 btn:', old_btn_salvar in c)
c = c.replace(old_btn_salvar, new_btn_salvar, 1)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO! Linhas:', c.count('\n'))
