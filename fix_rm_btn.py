with open('app/painel/cobrancas/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Remover bloco inteiro topo-btns
old = """            <div className="topo-btns" style={{display:'flex',gap:'8px',flexShrink:0}}>
              <button onClick={()=>alert('Cadastro manual de cobranca em breve.')} className="btn-p">+ Nova cobranca</button>
            </div>"""
print('Achou:', old in c)
c = c.replace(old, '', 1)
print('Removido:', 'topo-btns' not in c)
with open('app/painel/cobrancas/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
