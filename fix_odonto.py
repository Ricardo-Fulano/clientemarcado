with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Trocar isOdonto para usar o toggle usarOdontograma que ja existe no estado
old = "  const isOdonto=perfil?.tipo_negocio?.toLowerCase().includes('odont')"
new = "  const [usarOdontograma,setUsarOdontograma]=useState(false)\n  const isOdonto=usarOdontograma"
print('Achou:', old in c)
c = c.replace(old, new, 1)

# Adicionar botao toggle antes do odontograma
old2 = "                    {isOdonto&&("
new2 = """                    <div style={{marginBottom:'12px'}}>
                      <button onClick={()=>setUsarOdontograma(!usarOdontograma)}
                        style={{display:'flex',alignItems:'center',gap:'8px',background:'rgba(255,255,255,.04)',border:'1px solid rgba(148,163,184,.14)',borderRadius:'10px',padding:'10px 16px',cursor:'pointer',fontFamily:'inherit',width:'100%'}}>
                        <span style={{fontSize:'16px'}}>🦷</span>
                        <span style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',flex:1,textAlign:'left'}}>Orçamento odontológico</span>
                        <span style={{fontSize:'12px',color:usarOdontograma?'#4ADE80':'#64748B',fontWeight:600}}>{usarOdontograma?'Ativado ✓':'Adicionar odontograma'}</span>
                      </button>
                    </div>
                    {isOdonto&&("""
print('Achou2:', old2 in c)
c = c.replace(old2, new2, 1)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
