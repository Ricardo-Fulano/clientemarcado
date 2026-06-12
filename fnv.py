with open('app/painel/agendamentos/novo/page.tsx', encoding='utf-8') as f:
    c = f.read()
s = c.find('\n            {/* Resumo lateral */}')
e = c.find('\n          </div>\n        </div></div>')
c = c[:s] + c[e:]
c = c.replace('          <div className=\"layout\" style={{display:\'flex\',gap:\'18px\',alignItems:\'flex-start\'}}>\n            <div style={{flex:1,minWidth:0}}>', '          <div style={{width:\'100%\',maxWidth:\'760px\',margin:\'0 auto\'}}>\n            <div style={{width:\'100%\'}}>')
c = c.replace('            </div>\n          </div>\n          </div>\n        </div></div>', '          </div>\n        </div></div>')
open('app/painel/agendamentos/novo/page.tsx','w',encoding='utf-8').write(c)
print('OK linhas:', c.count(chr(10)))
