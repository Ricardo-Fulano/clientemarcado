with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Substituir apenas o bloco de renderizacao dos cards de servico
# Manter: titulo, subtitulo, estado vazio, card destaque
# Simplificar: lista de servicos

old_grid = """                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'12px'}}>
                  {resumoServicos.map(sv=>(
                    <div key={sv.nome} style={{background:'radial-gradient(circle at top left,rgba(6,182,212,.06),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(6,182,212,.18)',borderRadius:'16px',padding:'18px'}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'8px',marginBottom:'14px'}}>
                        <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC',lineHeight:1.3,flex:1}}>{sv.nome}</p>
                        <span style={{fontSize:'11px',fontWeight:700,color:'#22D3EE',background:'rgba(6,182,212,.12)',border:'1px solid rgba(6,182,212,.22)',borderRadius:'999px',padding:'3px 10px',whiteSpace:'nowrap' as const,flexShrink:0}}>{sv.qtd} realizado{sv.qtd!==1?'s':''}</span>
                      </div>
                      <div style={{display:'flex',flexDirection:'column' as const,gap:'8px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:'12px',color:'#64748B'}}>Receita gerada</span>
                          <span style={{fontSize:'15px',fontWeight:800,color:'#4ADE80'}}>{fBRL(sv.receita)}</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:'12px',color:'#64748B'}}>Ticket médio</span>
                          <span style={{fontSize:'13px',fontWeight:600,color:'#CBD5E1'}}>{fBRL(sv.ticket)}</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'8px',borderTop:'1px solid rgba(255,255,255,.06)'}}>
                          <span style={{fontSize:'12px',color:'#64748B'}}>Mais realizado por</span>
                          <span style={{fontSize:'12px',fontWeight:600,color:'#C4B5FD'}}>{sv.topProf}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>"""

new_grid = """                <div style={{background:'radial-gradient(circle at top left,rgba(6,182,212,.04),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(148,163,184,.14)',borderRadius:'16px',overflow:'hidden'}}>
                  {resumoServicos.map((sv,i)=>(
                    <div key={sv.nome} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',padding:'13px 18px',borderBottom:i<resumoServicos.length-1?'1px solid rgba(255,255,255,.05)':'none'}}>
                      <div style={{minWidth:0,flex:1}}>
                        <p style={{fontSize:'14px',fontWeight:600,color:'#F8FAFC',marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{sv.nome}</p>
                        <p style={{fontSize:'12px',color:'#64748B'}}>{sv.qtd} realizado{sv.qtd!==1?'s':''}</p>
                      </div>
                      <p style={{fontSize:'15px',fontWeight:800,color:'#4ADE80',flexShrink:0}}>{fBRL(sv.receita)}</p>
                    </div>
                  ))}
                </div>"""

print('achou grid:', old_grid in c)
c = c.replace(old_grid, new_grid, 1)

with open('app/painel/relatorio/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
