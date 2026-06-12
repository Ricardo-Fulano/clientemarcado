with open('app/painel/agendamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Substituir os filtros por scroll horizontal
old_fil = '''          <div className="fil-row">
            {(['hoje','semana'] as const).map(v=>(
              <button key={v} onClick={()=>{setView(v);setDiaSel(null)}} style={{height:32,padding:'0 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(view===v?'rgba(59,130,246,.35)':'rgba(148,163,184,.15)'),background:view===v?'rgba(59,130,246,.14)':'transparent',color:view===v?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>\n                {v==='hoje'?'Hoje':'Semana'}\n              </button>\n            ))}\n            {view==='hoje'&&(\n              <div className="fil-inner">\n                {['todos','pendente','confirmado','realizado','cancelado'].map(f=>(\n                  <button key={f} onClick={()=>setFSt(f)} style={{height:30,padding:'0 10px',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt===f?'rgba(59,130,246,.28)':'rgba(148,163,184,.13)'),background:fSt===f?'rgba(59,130,246,.12)':'transparent',color:fSt===f?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>\n                    {f==='todos'?'Todos':stCfg[f]?.t||f}\n                  </button>\n                ))}\n              </div>\n            )}\n            <select value={fPr} onChange={e=>setFPr(e.target.value)} style={{background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.16)',borderRadius:8,padding:'0 10px',height:30,fontSize:11,color:'#CBD5E1',fontFamily:'inherit',cursor:'pointer',outline:'none',marginLeft:'auto',flexShrink:0}}>\n              <option value="todos">Todos profissionais</option>\n              {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}\n            </select>\n          </div>'''

new_fil = '''          <div style={{marginBottom:14}}>
            <div className="fil-scroll">
              {(['hoje','semana'] as const).map(v=>(
                <button key={v} onClick={()=>{setView(v);setDiaSel(null)}} style={{height:32,padding:'0 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(view===v?'rgba(59,130,246,.4)':'rgba(148,163,184,.15)'),background:view===v?'rgba(59,130,246,.15)':'transparent',color:view===v?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>{v==='hoje'?'Hoje':'Semana'}</button>
              ))}
              {view==='hoje'&&['todos','pendente','confirmado','realizado','cancelado'].map(f=>(
                <button key={f} onClick={()=>setFSt(f)} style={{height:32,padding:'0 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid '+(fSt===f?'rgba(59,130,246,.35)':'rgba(148,163,184,.13)'),background:fSt===f?'rgba(59,130,246,.12)':'transparent',color:fSt===f?'#60A5FA':'#64748B',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>{f==='todos'?'Todos':stCfg[f]?.t||f}</button>
              ))}
              <select value={fPr} onChange={e=>setFPr(e.target.value)} style={{height:32,background:'rgba(15,23,42,.88)',border:'1px solid rgba(148,163,184,.16)',borderRadius:8,padding:'0 10px',fontSize:11,color:'#CBD5E1',fontFamily:'inherit',cursor:'pointer',outline:'none',whiteSpace:'nowrap',flexShrink:0}}>
                <option value="todos">Todos profissionais</option>
                {profs.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>'''

c = c.replace(old_fil, new_fil, 1)
print('Filtros:', 'fil-scroll' in c and old_fil not in c)

# Substituir o card de agendamento
old_card = '''                   return(
                    <div key={a.id} className={'ag-item'+(isSel?' sel':'')} onClick={()=>setSel(a)}>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5,flexWrap:'wrap'}}>
                        <span style={{display:'inline-flex',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.28)',borderRadius:6,padding:'2px 7px',fontSize:11,fontWeight:800,color:'#60A5FA',flexShrink:0}}>{fH(a.data_hora)}</span>
                        <span style={{fontSize:13,fontWeight:800,color:'#F8FAFC',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{a.cliente_nome||'—'}</span>
                        <span style={stBadge(a.status)}>{sc.t}</span>
                      </div>
                      {tf&&<p style={{fontSize:11,color:'#CBD5E1',marginBottom:3}}>📱 {tf}</p>}
                      <p style={{fontSize:11,color:'#94A3B8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,marginBottom:4}}>
                        {a.servicos?.nome||'Servico nao informado'}{a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}
                        {a.servicos?.preco?<span style={{color:'#22C55E'}}> · R$ {a.servicos.preco}</span>:null}
                      </p>
                      <div style={{display:'flex',gap:5,flexWrap:'wrap'}} onClick={e=>e.stopPropagation()}>
                        {wW&&<a href={wW} target="_blank" rel="noreferrer" style={{borderRadius:7,padding:'4px 9px',fontSize:10,fontWeight:700,textDecoration:'none',background:'rgba(34,197,94,.12)',color:'#4ADE80',border:'1px solid rgba(34,197,94,.25)',display:'inline-flex',alignItems:'center',gap:4,whiteSpace:'nowrap' as const}}>WhatsApp</a>}
                        {wC&&(a.status==='pendente'||!a.status)&&<a href={wC} target="_blank" rel="noreferrer" style={{borderRadius:7,padding:'4px 9px',fontSize:10,fontWeight:700,textDecoration:'none',background:'rgba(59,130,246,.12)',color:'#60A5FA',border:'1px solid rgba(59,130,246,.25)',display:'inline-flex',alignItems:'center',gap:4,whiteSpace:'nowrap' as const}}>Confirmar</a>}
                        <div style={{position:'relative',display:'inline-block'}} ref={mnu===a.id?mnuRef:undefined}>
                          <button onClick={()=>setMnu(mnu===a.id?null:a.id)} style={{borderRadius:7,padding:'4px 9px',fontSize:10,fontWeight:700,cursor:'pointer',border:'1px solid rgba(148,163,184,.15)',background:'rgba(255,255,255,.04)',color:'#64748B',fontFamily:'inherit'}}>Mais</button>
                          {mnu===a.id&&(
                            <div style={{position:'absolute',top:'calc(100% + 5px)',left:0,background:'rgba(10,15,25,.98)',border:'1px solid rgba(148,163,184,.18)',borderRadius:12,padding:6,minWidth:160,zIndex:50,boxShadow:'0 16px 48px rgba(0,0,0,.6)'}}>
                              {[{l:'📋 Copiar contato',fn:()=>copiar(a)},{l:'✓ Compareceu',fn:()=>updSt(a.id,'compareceu'),skip:a.status==='compareceu'},{l:'✗ Faltou',fn:()=>updSt(a.id,'faltou'),skip:a.status==='faltou'},{l:'★ Realizado',fn:()=>updSt(a.id,'realizado'),skip:a.status==='realizado'},{l:'↩ Retorno',fn:()=>updSt(a.id,'retorno'),skip:a.status==='retorno'},{l:'✓ Confirmado',fn:()=>updSt(a.id,'confirmado'),skip:a.status==='confirmado'},{l:'✕ Cancelar',fn:()=>updSt(a.id,'cancelado'),skip:a.status==='cancelado'}].filter((i:any)=>!i.skip).map(({l,fn}:any)=>(
                                <button key={l} onClick={fn} className="mnu-item">{l}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )'''

new_card = '''                   return(
                    <div key={a.id} className={'ag-item'+(isSel?' sel':'')} onClick={()=>setSel(a)}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                        <span style={{fontSize:12,fontWeight:800,color:'#60A5FA',background:'rgba(59,130,246,.14)',border:'1px solid rgba(59,130,246,.28)',borderRadius:6,padding:'2px 7px',flexShrink:0}}>{fH(a.data_hora)}</span>
                        <span style={{fontSize:14,fontWeight:700,color:'#F8FAFC',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{a.cliente_nome||'—'}</span>
                        <span style={{...stBadge(a.status),flexShrink:0}}>{sc.t}</span>
                      </div>
                      {tf&&<p style={{fontSize:11,color:'#CBD5E1',marginBottom:2}}>📱 {tf}</p>}
                      <p style={{fontSize:11,color:'#94A3B8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,marginBottom:8}}>
                        {a.servicos?.nome||'Servico nao informado'}{a.profissionais?.nome?' · Prof. '+a.profissionais.nome:''}
                        {a.servicos?.preco?<span style={{color:'#22C55E'}}> · R$ {a.servicos.preco}</span>:null}
                      </p>
                      <div className="card-btns" onClick={e=>e.stopPropagation()}>
                        {wW&&<a href={wW} target="_blank" rel="noreferrer" className="card-btn" style={{background:'rgba(34,197,94,.13)',color:'#4ADE80',border:'1px solid rgba(34,197,94,.28)'}}>📱 WhatsApp</a>}
                        {(a.status==='pendente'||!a.status)&&<button className="card-btn" onClick={()=>updSt(a.id,'confirmado')} style={{background:'rgba(34,197,94,.10)',color:'#86EFAC',border:'1px solid rgba(34,197,94,.22)'}}>✓ Confirmar</button>}
                        <button className="card-btn" onClick={()=>setBsAg(a)} style={{background:'rgba(255,255,255,.05)',color:'#94A3B8',border:'1px solid rgba(148,163,184,.16)'}}>⋯ Mais</button>
                      </div>
                    </div>
                  )'''

c = c.replace(old_card, new_card, 1)
print('Card:', 'card-btns' in c)

# Adicionar bottom sheet antes do fechamento
old_end = '    </div>\n  )\n}'
new_end = '''    </div>

      <div className={s-ovl} onClick={()=>setBsAg(null)}/>
      <div className={s}>
        <div className="bs-handle"/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <p style={{fontSize:15,fontWeight:700,color:'#F8FAFC'}}>Acoes do atendimento</p>
            {bsAg&&<p style={{fontSize:12,color:'#64748B'}}>{bsAg.cliente_nome||'—'} · {fH(bsAg.data_hora)}</p>}
          </div>
          <button onClick={()=>setBsAg(null)} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:22,lineHeight:1}}>×</button>
        </div>
        <p className="bs-label">Contato</p>
        <button className="bs-item" style={{color:'#CBD5E1'}} onClick={()=>{bsAg&&copiar(bsAg);setBsAg(null)}}>📋 Copiar contato</button>
        <button className="bs-item" style={{color:'#60A5FA'}} onClick={()=>{
          if(!bsAg)return
          const tel=gTel(bsAg)
          if(!tel){alert('Cliente sem WhatsApp.');setBsAg(null);return}
          const ph=tel.startsWith('55')?tel:'55'+tel
          const msg=encodeURIComponent('Ola, tudo bem? Faz alguns dias que nao vemos voce por aqui. Quer que eu veja um horario disponivel para continuarmos seu atendimento?')
          window.open('https://wa.me/'+ph+'?text='+msg,'_blank')
          setBsAg(null)
        }}>🔄 Resgatar cliente</button>
        <p className="bs-label">Status</p>
        {bsAg&&[
          {l:'✓ Compareceu',s:'compareceu',c:'#4ADE80'},{l:'★ Realizado',s:'realizado',c:'#67E8F9'},
          {l:'✗ Faltou',s:'faltou',c:'#F87171'},{l:'✕ Cancelar',s:'cancelado',c:'#F87171'},
        ].filter(i=>bsAg.status!==i.s).map(({l,s,c})=>(
          <button key={s} className="bs-item" style={{color:c}} onClick={()=>{updSt(bsAg.id,s);setBsAg(null)}}>{l}</button>
        ))}
        <p className="bs-label">Continuidade</p>
        <button className="bs-item" style={{color:'#A78BFA'}} onClick={()=>{bsAg&&updSt(bsAg.id,'retorno');setBsAg(null)}}>↩ Criar retorno</button>
      </div>
    </div>
  )
}'''

c = c.replace(old_end, new_end, 1)
print('BS:', 'Resgatar cliente' in c)
print('Linhas:', c.count(chr(10)))
with open('app/painel/agendamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
