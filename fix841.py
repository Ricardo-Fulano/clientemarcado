lines = open('app/painel/orcamentos/page.tsx', encoding='utf-8').read().split(chr(10))
bad = lines[840]
good = "                    style={{background:(!addProc.trim()||!addValor||parseFloat(addValor)<=0)?'rgba(124,58,237,.25)':'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 16px',fontSize:'13px',fontWeight:700,cursor:(!addProc.trim()||!addValor||parseFloat(addValor)<=0)?'not-allowed':'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>"
lines[840] = good
open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8').write(chr(10).join(lines))
print('OK linha 841 corrigida')
print(repr(lines[840][:100]))
