with open('app/painel/agendamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Ajustar CSS da fil-scroll para permitir wrap no mobile
old_css = ".fil-scroll{display:flex;align-items:center;gap:8px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:0 14px 6px;width:100%}.fil-scroll::-webkit-scrollbar{display:none}"
new_css = ".fil-scroll{display:flex;align-items:center;gap:8px;margin-bottom:14px;width:100%;max-width:100%;flex-wrap:wrap}.fil-g1{display:flex;gap:8px;flex-wrap:nowrap}.fil-g2{display:flex;gap:8px;flex-wrap:wrap}.fil-g3{width:100%}@media(min-width:768px){.fil-scroll{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.fil-g1,.fil-g2{flex-wrap:nowrap}}"

print('Achou CSS:', old_css in c)
c = c.replace(old_css, new_css, 1)

# 2. Reorganizar o JSX dos filtros em grupos
old_fil = """          <div className="fil-scroll">
            {(['hoje','semana'] as const).map(v=>(
              <button key={v} onClick={()=>{setView(v);setDiaSel(null)}}
                style={{height:34,padding:'0 16px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(view===v?'rgba(59,130,246,.4)':'rgba(148,163,184,.15)'),background:view===v?'rgba(59,130,246,.15)':'transparent',color:view===v?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0,minWidth:'max-content'}}>
                {v==='hoje'?'Hoje':'Semana'}
              </button>
            ))}
            {view==='hoje'&&['todos','pendente','confirmado','realizado','cancelado'].map(f=>(
              <button key={f} onClick={()=>setFSt(f)}
                style={{height:34,padding:'0 16px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt===f?'rgba(59,130,246,.35)':'rgba(148,163,184,.13)'),background:fSt===f?'rgba(59,130,246,.12)':'transparent',color:fSt===f?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0,minWidth:'max-content'}}>
                {f==='todos'?'Todos':stCfg[f]?.t||f}
              </button>
            ))}
            <select value={fPr} onChange={e=>setFPr(e.target.value)}
              style={{height:32,background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.16)',borderRadius:8,padding:'0 10px',fontSize:11,color:'#CBD5E1',fontFamily:'inherit',cursor:'pointer',outline:'none',flexShrink:0,minWidth:180}}>
              <option value="todos">Todos profissionais</option>
              {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>"""

new_fil = """          <div className="fil-scroll">
            <div className="fil-g1">
              {(['hoje','semana'] as const).map(v=>(
                <button key={v} onClick={()=>{setView(v);setDiaSel(null)}}
                  style={{height:34,padding:'0 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(view===v?'rgba(59,130,246,.4)':'rgba(148,163,184,.15)'),background:view===v?'rgba(59,130,246,.15)':'transparent',color:view===v?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                  {v==='hoje'?'Hoje':'Semana'}
                </button>
              ))}
              {view==='hoje'&&<button onClick={()=>setFSt('todos')}
                style={{height:34,padding:'0 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt==='todos'?'rgba(59,130,246,.35)':'rgba(148,163,184,.13)'),background:fSt==='todos'?'rgba(59,130,246,.12)':'transparent',color:fSt==='todos'?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                Todos
              </button>}
            </div>
            {view==='hoje'&&<div className="fil-g2">
              {['pendente','confirmado','realizado','cancelado'].map(f=>(
                <button key={f} onClick={()=>setFSt(f)}
                  style={{height:34,padding:'0 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt===f?'rgba(59,130,246,.35)':'rgba(148,163,184,.13)'),background:fSt===f?'rgba(59,130,246,.12)':'transparent',color:fSt===f?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                  {stCfg[f]?.t||f}
                </button>
              ))}
            </div>}
            <div className="fil-g3">
              <select value={fPr} onChange={e=>setFPr(e.target.value)}
                style={{height:34,width:'100%',background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.16)',borderRadius:8,padding:'0 10px',fontSize:12,color:'#CBD5E1',fontFamily:'inherit',cursor:'pointer',outline:'none'}}>
                <option value="todos">Todos profissionais</option>
                {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>"""

print('Achou JSX:', old_fil in c)
c = c.replace(old_fil, new_fil, 1)
print('Novo JSX:', 'fil-g1' in c)
with open('app/painel/agendamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
