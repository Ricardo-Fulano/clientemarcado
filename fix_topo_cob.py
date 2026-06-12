with open('app/painel/cobrancas/page.tsx', encoding='utf-8') as f:
    c = f.read()

old = """            <div className="topo-btns" style={{display:'flex',gap:'8px',flexShrink:0}}>
              <Link href="/painel/orcamentos/novo" className="btn-p">+ Nova cobrança</Link>
              <Link href="/painel/orcamentos" className="btn-s">Ver orçamentos</Link>
            </div>"""

new = """            <div className="topo-btns" style={{display:'flex',gap:'8px',flexShrink:0}}>
              <button onClick={()=>toast('Cadastro manual de cobranca em breve.')} className="btn-p">+ Nova cobranca</button>
            </div>"""

print('Achou:', old in c)
c = c.replace(old, new, 1)
print('Fix:', 'Ver orçamentos' not in c)
with open('app/painel/cobrancas/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
