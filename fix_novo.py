with open('app/painel/agendamentos/novo/page.tsx', encoding='utf-8') as f:
    c = f.read()

print('Linhas antes:', c.count(chr(10)))
print('Tem Resumo:', 'Resumo lateral' in c)

# Remover aside do Resumo
start = c.find('\n            {/* Resumo lateral */}')
end = c.find('\n          </div>\n        </div></div>')
if start > 0 and end > 0:
    c = c[:start] + c[end:]
    print('Resumo removido!')

# Trocar layout flex por max-width simples
c = c.replace(
    '          <div className="layout" style={{display:\'flex\',gap:\'18px\',alignItems:\'flex-start\'}}>\n            <div style={{flex:1,minWidth:0}}>',
    '          <div style={{width:\'100%\',maxWidth:\'760px\',margin:\'0 auto\'}}>\n            <div style={{width:\'100%\'}}>'
)

print('Layout fix:', "maxWidth:'760px'" in c)
print('Linhas depois:', c.count(chr(10)))

with open('app/painel/agendamentos/novo/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
