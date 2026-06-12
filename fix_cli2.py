with open('app/painel/clientes/page.tsx', encoding='utf-8') as f:
    c = f.read()

old = '''            <div className="hdr-btns" style={{display:'flex',gap:'8px',flexShrink:0,flexWrap:'wrap'}}>
{showForm&&<button onClick={()=>setShowForm(false)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(148,163,184,.16)',borderRadius:10,padding:'7px 16px',color:'#94A3B8',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>}
            </div>'''

new = '''            <div className="hdr-btns" style={{display:'flex',gap:'8px',flexShrink:0,flexWrap:'wrap'}}>
              <button onClick={()=>setShowForm(!showForm)} style={{background:showForm?'rgba(255,255,255,.06)':'linear-gradient(135deg,#3B82F6,#7C3AED)',border:showForm?'1px solid rgba(148,163,184,.20)':'1px solid rgba(255,255,255,.10)',borderRadius:14,padding:'9px 20px',color:showForm?'#94A3B8':'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                {showForm?'Cancelar':'+ Novo cliente'}
              </button>
            </div>'''

print('Achou:', old in c)
c = c.replace(old, new, 1)
print('Aplicou:', '+ Novo cliente' in c)
with open('app/painel/clientes/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
