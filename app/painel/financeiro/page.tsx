with open('app/painel/financeiro/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. CSS - adicionar regras mobile para periodo e cards resumo
old_css_end = "@media(max-width:480px){\n  .kpi-grid{grid-template-columns:1fr 1fr!important}\n  .tabs-row .tab-btn{flex:1 1 calc(33% - 6px);font-size:12px;padding:8px 10px}\n}"
new_css_end = """@media(max-width:480px){
  .kpi-grid{grid-template-columns:1fr 1fr!important}
  .tabs-row .tab-btn{flex:1 1 calc(33% - 6px);font-size:12px;padding:8px 10px}
}
@media(max-width:1023px){
  .resumo-grid{grid-template-columns:1fr!important}
  .periodo-input{font-size:12px!important;padding:6px 10px!important;min-width:0!important;width:100%!important}
  .periodo-wrap{width:100%!important}
  .header-fin{flex-direction:column!important;align-items:stretch!important}
}
@media(max-width:1023px){
  .resumo-grid{grid-template-columns:1fr!important}
  .periodo-input{font-size:12px!important;padding:6px 10px!important;min-width:0!important;width:100%!important}
  .periodo-wrap{width:100%!important}
  .header-fin{flex-direction:column!important;align-items:stretch!important}
}"""
print('1 css:', old_css_end in c)
c = c.replace(old_css_end, new_css_end, 1)

# 2. Header - adicionar classes mobile ao periodo
old_header = "            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>\n              <div>\n                <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Período</p>\n                <input type=\"month\" value={mes} onChange={e => setMes(e.target.value)}\n                  style={{ background: 'rgba(15,23,42,.88)', border: '1.5px solid rgba(148,163,184,.18)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', color: '#F8FAFC', outline: 'none', fontFamily: 'inherit' }} />\n              </div>\n            </div>"
new_header = "            <div className=\"periodo-wrap\" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>\n              <div style={{ width: '100%' }}>\n                <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Período</p>\n                <input type=\"month\" value={mes} onChange={e => setMes(e.target.value)} className=\"periodo-input\"\n                  style={{ background: 'rgba(15,23,42,.88)', border: '1.5px solid rgba(148,163,184,.18)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', color: '#F8FAFC', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as any }} />\n              </div>\n            </div>"
print('2 header:', old_header in c)
c = c.replace(old_header, new_header, 1)

# 3. Header div - adicionar classe header-fin
old_hdr_div = "          <div className="header-fin" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>"
new_hdr_div = "          <div className=\"header-fin\" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>"
print('3 hdr:', old_hdr_div in c)
c = c.replace(old_hdr_div, new_hdr_div, 1)

# 4. Resumo grid - adicionar classe resumo-grid para mobile em coluna
old_resumo = "              <div className="resumo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>"
new_resumo = "              <div className=\"resumo-grid\" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>"
print('4 resumo:', old_resumo in c)
c = c.replace(old_resumo, new_resumo, 1)

with open('app/painel/financeiro/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO OK')
