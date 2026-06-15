import base64

# Script que substitui diretamente o bloco view=odonto
# usando indices de caractere encontrados: start=49985, detalhe=72812

NOVO_ODONTO = r"""        {view==='odonto'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div className="od-bdy" style={{padding:'12px 12px 140px',maxWidth:'900px',margin:'0 auto'}}>
              <button onClick={()=>{resetAll();setView(editandoId?'lista':'escolha')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'12px'}}>
                \u2190 {editandoId?'Voltar \u00e0 lista':'Voltar'}
              </button>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'3px'}}>
                <h1 style={{fontSize:'20px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>Or\u00e7amento odontol\u00f3gico</h1>
                <span style={{fontSize:'10px',fontWeight:700,background:'rgba(124,58,237,.25)',border:'1px solid rgba(124,58,237,.45)',borderRadius:'999px',padding:'3px 10px',color:'#C4B5FD'}}>Odontol\u00f3gico</span>
              </div>
              <p style={{fontSize:'13px',color:'#94A3B8',marginBottom:'16px'}}>Selecione os dentes, adicione procedimentos e acompanhe o tratamento.</p>
              {mensagem&&<div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'8px',marginBottom:'12px',color:mensagem.includes('rro')?'#F87171':'#4ADE80',background:mensagem.includes('rro')?'rgba(220,38,38,.15)':'rgba(34,197,94,.15)',border:`1px solid ${mensagem.includes('rro')?'rgba(220,38,38,.3)':'rgba(34,197,94,.3)'}`}}>{mensagem}</div>}

              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Paciente</p>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div><label style={lbl}>Nome *</label><input style={inp} type="text" placeholder="Nome do paciente" value={odNome} onChange={e=>setOdNome(e.target.value)}/></div>
                  <div className="od-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <div><label style={lbl}>WhatsApp *</label><input style={inp} type="tel" placeholder="(11) 99999-9999" value={odWpp} onChange={e=>setOdWpp(aplicarMascaraTel(e.target.value))}/></div>
                    <div><label style={lbl}>E-mail (opcional)</label><input style={inp} type="email" placeholder="email@exemplo.com" value={odEmail} onChange={e=>setOdEmail(e.target.value)}/></div>
                  </div>
                </div>
              </div>

              <div style={{...card,padding:0,overflow:'hidden'}}>
                <div onClick={()=>setOdDetOpen(!odDetOpen)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',cursor:'pointer',userSelect:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Detalhes do tratamento</p>
                  </div>
                  <span style={{color:'#64748B',fontSize:'16px',transform:odDetOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>\u23c4</span>
                </div>
                {odDetOpen&&(
                  <div style={{padding:'0 16px 16px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',flexDirection:'column',gap:'10px',marginTop:'14px'}}>
                    <div className="od-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                      <div><label style={lbl}>Status</label>
                        <select style={sel} value={odStatus} onChange={e=>setOdStatus(e.target.value)}>
                          {['Rascunho','Aguardando aprova\u00e7\u00e3o','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado'].map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div><label style={lbl}>Data</label><input style={inp} type="date" value={odData} onChange={e=>setOdData(e.target.value)}/></div>
                    </div>
                    <div><label style={lbl}>Profissional respons\u00e1vel</label>
                      <select style={sel} value={odProfId} onChange={e=>setOdProfId(e.target.value)}>
                        <option value="">Nenhum</option>
                        {profissionais.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 5 4 9c0 2.5 1 4.5 2 6 1 1.5 2 3 2 5 0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2 0-2 1-3.5 2-5 1-1.5 2-3.5 2-6 0-4-4-7-8-7z"/></svg>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Odontograma</p>
                </div>
                <p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'14px'}}>Toque nos dentes para selecionar. Selecione um ou mais antes de adicionar procedimento.</p>
                <style dangerouslySetInnerHTML={{__html:`.dente-btn{position:relative;width:32px;height:40px;border-radius:5px 5px 9px 9px;border:1.5px solid rgba(200,210,230,.28);background:linear-gradient(180deg,rgba(220,228,240,.92) 0%,rgba(195,208,225,.85) 100%);cursor:pointer;font-size:9px;font-weight:800;font-family:inherit;color:#1e2d45;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:all .15s;box-shadow:0 2px 4px rgba(0,0,0,.2);padding:0;flex-shrink:0}.dente-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(124,58,237,.35);border-color:rgba(124,58,237,.5)}.dente-btn.sel{background:linear-gradient(180deg,#818cf8 0%,#6366f1 100%);border-color:#818cf8;color:#fff;box-shadow:0 0 14px rgba(99,102,241,.6);transform:translateY(-2px)}.dente-btn.planejado{background:linear-gradient(180deg,#a78bfa 0%,#7c3aed 100%);border-color:#a78bfa;color:#fff;box-shadow:0 0 10px rgba(124,58,237,.5)}.dente-btn.andamento{background:linear-gradient(180deg,#fb923c 0%,#ea580c 100%);border-color:#fb923c;color:#fff;box-shadow:0 0 10px rgba(234,88,12,.5)}.dente-btn.concluido{background:linear-gradient(180deg,#4ade80 0%,#16a34a 100%);border-color:#4ade80;color:#fff;box-shadow:0 0 10px rgba(34,197,94,.5)}`}}/>
                {[{label:'Arcada superior',dentes:DENTES_SUP},{label:'Arcada inferior',dentes:DENTES_INF}].map(({label,dentes},ai)=>(
                  <div key={label} style={{marginBottom:ai===0?'8px':'0'}}>
                    <p style={{fontSize:'10px',fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'8px',textAlign:'center'}}>{label}</p>
                    <div style={{display:'flex',justifyContent:'center',gap:'3px',overflowX:'auto',paddingBottom:'4px'}}>
                      {dentes.slice(0,dentes.length/2).map(n=>{
                        const pd=procs.filter(p=>p.dentes?.includes(n))
                        const isSel=dentesSelec.includes(n)
                        const lst=pd.length>0?pd[pd.length-1].status:''
                        const cls=isSel?'dente-btn sel':lst==='Conclu\u00eddo'||lst==='Pago'?'dente-btn concluido':lst==='Em andamento'?'dente-btn andamento':lst==='Planejado'?'dente-btn planejado':'dente-btn'
                        return(<button key={n} className={cls} onClick={()=>setDentesSelec(prev=>prev.includes(n)?prev.filter(d=>d!==n):[...prev,n])}><span style={{fontSize:'9px',fontWeight:800,lineHeight:1}}>{n}</span>{pd.length>0&&<span style={{position:'absolute',top:'2px',right:'2px',width:'6px',height:'6px',borderRadius:'50%',background:'rgba(255,255,255,.9)'}}/>}</button>)
                      })}
                      <div style={{width:'2px',background:'rgba(148,163,184,.3)',margin:'0 3px',borderRadius:'1px',flexShrink:0}}/>
                      {dentes.slice(dentes.length/2).map(n=>{
                        const pd=procs.filter(p=>p.dentes?.includes(n))
                        const isSel=dentesSelec.includes(n)
                        const lst=pd.length>0?pd[pd.length-1].status:''
                        const cls=isSel?'dente-btn sel':lst==='Conclu\u00eddo'||lst==='Pago'?'dente-btn concluido':lst==='Em andamento'?'dente-btn andamento':lst==='Planejado'?'dente-btn planejado':'dente-btn'
                        return(<button key={n} className={cls} onClick={()=>setDentesSelec(prev=>prev.includes(n)?prev.filter(d=>d!==n):[...prev,n])}><span style={{fontSize:'9px',fontWeight:800,lineHeight:1}}>{n}</span>{pd.length>0&&<span style={{position:'absolute',top:'2px',right:'2px',width:'6px',height:'6px',borderRadius:'50%',background:'rgba(255,255,255,.9)'}}/>}</button>)
                      })}
                    </div>
                    {ai===0&&<div style={{height:'8px'}}/>}
                  </div>
                ))}
                {dentesSelec.length>0&&(
                  <div style={{marginTop:'10px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(99,102,241,.12)',border:'1px solid rgba(99,102,241,.3)',borderRadius:'8px',padding:'8px 12px'}}>
                    <span style={{fontSize:'12px',color:'#a5b4fc',fontWeight:600}}>Selecionados: {[...dentesSelec].sort((a,b)=>a-b).join(', ')}</span>
                    <button onClick={()=>setDentesSelec([])} style={{background:'none',border:'none',color:'#64748B',cursor:'pointer',fontSize:'12px',fontFamily:'inherit',fontWeight:600}}>Limpar</button>
                  </div>
                )}
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginTop:'12px',justifyContent:'center'}}>
                  {[{cls:'dente-btn',l:'Normal'},{cls:'dente-btn planejado',l:'Planejado'},{cls:'dente-btn andamento',l:'Em andamento'},{cls:'dente-btn concluido',l:'Conclu\u00eddo'}].map(({cls,l})=>(
                    <div key={l} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                      <div className={cls} style={{width:'14px',height:'18px',borderRadius:'2px 2px 4px 4px',pointerEvents:'none' as const,flexShrink:0}}/>
                      <span style={{fontSize:'10px',color:'#64748B'}}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={card}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Procedimentos do tratamento</p>
                  </div>
                  <button onClick={()=>{setProcs(prev=>[...prev,{nome:'',qtd:1,valorUnit:'',total:0,dentes:[...dentesSelec],status:'Planejado',obs:''}]);setDentesSelec([])}}
                    style={{background:'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'#fff',border:'none',borderRadius:'8px',padding:'7px 12px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'4px'}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Adicionar linha
                  </button>
                </div>
                {procs.length===0?(
                  <div style={{background:'rgba(255,255,255,.03)',border:'1.5px dashed rgba(148,163,184,.18)',borderRadius:'10px',padding:'20px',textAlign:'center'}}>
                    <p style={{fontSize:'13px',color:'#64748B',marginBottom:'4px'}}>Nenhum procedimento adicionado.</p>
                    <p style={{fontSize:'12px',color:'#475569'}}>Selecione dentes e clique em "Adicionar linha".</p>
                  </div>
                ):(
                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    {procs.map((proc,idx)=>{
                      const stCor=PROC_STATUS_COR[proc.status]||PROC_STATUS_COR['Planejado']
                      return(
                        <div key={idx} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(148,163,184,.14)',borderRadius:'12px',padding:'12px'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                              <span style={{fontSize:'10px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em'}}>Linha {idx+1}</span>
                              <span style={{fontSize:'11px',fontWeight:700,padding:'1px 7px',borderRadius:'999px',background:stCor.bg,color:stCor.color,border:`1px solid ${stCor.border}`}}>{proc.status}</span>
                            </div>
                            <button onClick={()=>setProcs(prev=>prev.filter((_,i)=>i!==idx))}
                              style={{background:'rgba(239,68,68,.10)',border:'1px solid rgba(239,68,68,.22)',borderRadius:'6px',padding:'2px 8px',fontSize:'11px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>Remover</button>
                          </div>
                          <div style={{marginBottom:'8px'}}>
                            <label style={lbl}>Dentes vinculados</label>
                            <div style={{display:'flex',alignItems:'center',gap:'5px',flexWrap:'wrap'}}>
                              {proc.dentes.length>0?(
                                <>
                                  {[...proc.dentes].sort((a,b)=>a-b).map(d=>(
                                    <span key={d} style={{fontSize:'11px',fontWeight:700,background:'rgba(99,102,241,.18)',border:'1px solid rgba(99,102,241,.35)',borderRadius:'999px',padding:'1px 7px',color:'#a5b4fc'}}>{d}</span>
                                  ))}
                                  {dentesSelec.length>0&&<button onClick={()=>setProcs(prev=>prev.map((p,i)=>i===idx?{...p,dentes:[...new Set([...p.dentes,...dentesSelec])]}:p))} style={{fontSize:'11px',fontWeight:600,background:'rgba(99,102,241,.12)',border:'1px solid rgba(99,102,241,.25)',borderRadius:'999px',padding:'1px 7px',color:'#a5b4fc',cursor:'pointer',fontFamily:'inherit'}}>+Add</button>}
                                  <button onClick={()=>setProcs(prev=>prev.map((p,i)=>i===idx?{...p,dentes:[]}:p))} style={{fontSize:'10px',color:'#64748B',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>Limpar</button>
                                </>
                              ):(
                                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                                  <span style={{fontSize:'12px',color:'#64748B'}}>Geral (sem dente espec\u00edfico)</span>
                                  {dentesSelec.length>0&&<button onClick={()=>setProcs(prev=>prev.map((p,i)=>i===idx?{...p,dentes:[...dentesSelec]}:p))} style={{fontSize:'11px',fontWeight:600,background:'rgba(99,102,241,.15)',border:'1px solid rgba(99,102,241,.3)',borderRadius:'999px',padding:'1px 7px',color:'#a5b4fc',cursor:'pointer',fontFamily:'inherit'}}>Vincular selecionados</button>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{marginBottom:'8px'}}>
                            <label style={lbl}>Procedimento *</label>
                            <input style={inp} type="text" placeholder="Ex: restaura\u00e7\u00e3o, canal, limpeza..." value={proc.nome}
                              onChange={e=>setProcs(prev=>prev.map((p,i)=>i===idx?{...p,nome:e.target.value}:p))}/>
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'70px 1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                            <div>
                              <label style={lbl}>Qtd.</label>
                              <input style={{...inp,textAlign:'center'}} type="number" min="1" value={proc.qtd}
                                onChange={e=>{const q=parseInt(e.target.value)||1;setProcs(prev=>prev.map((p,i)=>i===idx?{...p,qtd:q,total:q*(parseFloat(String(p.valorUnit))||0)}:p))}}/>
                            </div>
                            <div>
                              <label style={lbl}>Valor unit. (R$)</label>
                              <input style={inp} type="number" min="0" step="0.01" placeholder="0,00" value={proc.valorUnit}
                                onChange={e=>{const v=e.target.value;setProcs(prev=>prev.map((p,i)=>i===idx?{...p,valorUnit:v,total:(parseInt(String(p.qtd))||1)*(parseFloat(v)||0)}:p))}}/>
                            </div>
                            <div>
                              <label style={lbl}>Total</label>
                              <div style={{background:proc.total>0?'rgba(34,197,94,.10)':'rgba(255,255,255,.04)',border:`1px solid ${proc.total>0?'rgba(34,197,94,.25)':'rgba(255,255,255,.08)'}`,borderRadius:'8px',padding:'10px',display:'flex',alignItems:'center',justifyContent:'center',height:'42px'}}>
                                <span style={{fontSize:'14px',fontWeight:800,color:proc.total>0?'#4ADE80':'#475569'}}>R$ {fmtBRL(proc.total||0)}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                            <div>
                              <label style={lbl}>Status</label>
                              <select style={sel} value={proc.status} onChange={e=>setProcs(prev=>prev.map((p,i)=>i===idx?{...p,status:e.target.value}:p))}>
                                {['Planejado','Em andamento','Conclu\u00eddo','Pago'].map(s=><option key={s}>{s}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={lbl}>Observa\u00e7\u00e3o</label>
                              <input style={{...inp,fontSize:'12px'}} type="text" placeholder="Opcional..." value={proc.obs||''}
                                onChange={e=>setProcs(prev=>prev.map((p,i)=>i===idx?{...p,obs:e.target.value}:p))}/>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <button onClick={()=>{setProcs(prev=>[...prev,{nome:'',qtd:1,valorUnit:'',total:0,dentes:[...dentesSelec],status:'Planejado',obs:''}]);setDentesSelec([])}}
                      style={{background:'none',border:'1.5px dashed rgba(124,58,237,.3)',borderRadius:'8px',padding:'10px',color:'#A78BFA',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      + Adicionar outro procedimento
                    </button>
                  </div>
                )}
              </div>

              {procs.length>0&&(
                <div style={{...card,background:'radial-gradient(circle at top left,rgba(59,130,246,.08),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC'}}>Resumo financeiro</p>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#94A3B8',marginBottom:'6px'}}>
                    <span>Subtotal ({procs.length} procedimento{procs.length!==1?'s':''})</span>
                    <span style={{fontWeight:600,color:'#F8FAFC'}}>R$ {fmtBRL(odTotal)}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',color:'#64748B',marginBottom:'10px',paddingBottom:'10px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                    <span>Desconto</span>
                    <input type="number" min="0" step="0.01" placeholder="0,00" value={odDesconto} onChange={e=>setOdDesconto(e.target.value)}
                      style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',outline:'none',color:'#F87171',fontSize:'13px',fontWeight:600,textAlign:'right' as const,width:'90px',fontFamily:'inherit',borderRadius:'6px',padding:'4px 8px'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Total do tratamento</span>
                    <span style={{fontSize:'20px',fontWeight:800,color:'#C4B5FD'}}>R$ {fmtBRL(odTotalFinal)}</span>
                  </div>
                </div>
              )}

              <div style={{...card,padding:0,overflow:'hidden'}}>
                <div onClick={()=>setOdPagOpen(!odPagOpen)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',cursor:'pointer',userSelect:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <div>
                      <p style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Pagamentos</p>
                      <p style={{fontSize:'11px',color:'#64748B'}}>Pago: R$ {fmtBRL(odPago)} \u00b7 Saldo: R$ {fmtBRL(Math.max(0,odTotalFinal-odPago))}</p>
                    </div>
                  </div>
                  <span style={{color:'#64748B',fontSize:'16px',transform:odPagOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>\u23c4</span>
                </div>
                {odPagOpen&&(
                  <div style={{padding:'0 16px 16px',borderTop:'1px solid rgba(255,255,255,.08)'}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',margin:'12px 0'}}>
                      {[{l:'Total',v:odTotalFinal,c:'#F8FAFC'},{l:'Pago',v:odPago,c:'#4ADE80'},{l:'Saldo',v:Math.max(0,odTotalFinal-odPago),c:odPago<odTotalFinal?'#FBBF24':'#4ADE80'}].map(f=>(
                        <div key={f.l} style={{background:'rgba(255,255,255,.05)',borderRadius:'8px',padding:'8px',border:'1px solid rgba(148,163,184,.10)'}}>
                          <p style={{fontSize:'10px',fontWeight:600,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.05em',marginBottom:'2px'}}>{f.l}</p>
                          <p style={{fontSize:'14px',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'8px'}}>
                      <div className="od-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                        <div><label style={lbl}>Valor (R$)</label><input style={inp} type="number" placeholder="0,00" value={odPagValor} onChange={e=>setOdPagValor(e.target.value)}/></div>
                        <div><label style={lbl}>Forma</label>
                          <select style={sel} value={odPagForma} onChange={e=>setOdPagForma(e.target.value)}>
                            {['Pix','Dinheiro','Cart\u00e3o de cr\u00e9dito','Cart\u00e3o de d\u00e9bito','Transfer\u00eancia','Outro'].map(f=><option key={f}>{f}</option>)}
                          </select>
                        </div>
                      </div>
                      <div><label style={lbl}>Observa\u00e7\u00e3o</label><input style={inp} type="text" placeholder="Ex: entrada..." value={odPagObs} onChange={e=>setOdPagObs(e.target.value)}/></div>
                      <button onClick={adicionarPagOdonto} disabled={!odPagValor||parseFloat(odPagValor)<=0}
                        style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',opacity:(!odPagValor||parseFloat(odPagValor)<=0)?0.5:1}}>
                        Registrar pagamento
                      </button>
                    </div>
                    {odHistPags.length>0&&(
                      <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                        {odHistPags.map((p,i)=>(
                          <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'8px',padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div><span style={{fontSize:'13px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(p.valor)}</span><span style={{fontSize:'11px',color:'#64748B',marginLeft:'8px'}}>{p.forma} \u00b7 {fmtData(p.data)}</span>{p.obs&&<p style={{fontSize:'11px',color:'#64748B'}}>{p.obs}</p>}</div>
                            <button onClick={()=>setOdHistPags(prev=>prev.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'#F87171',cursor:'pointer',fontSize:'16px'}}>\u00d7</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{marginBottom:'10px'}}>
                <label style={lbl}>Observa\u00e7\u00f5es gerais do tratamento</label>
                <textarea rows={2} style={{...inp,resize:'none' as const}} placeholder="Ex: tratamento dividido em etapas, retorno em 15 dias..." value={odObs} onChange={e=>setOdObs(e.target.value)}/>
              </div>
            </div>

            <div className="od-footer">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                <span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600}}>Total do tratamento</span>
                <span style={{fontSize:'18px',fontWeight:800,color:'#C4B5FD'}}>R$ {fmtBRL(odTotalFinal)}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'8px'}}>
                <button onClick={()=>{resetAll();setView('lista')}} style={{background:'rgba(255,255,255,.08)',color:'#94A3B8',border:'1px solid rgba(255,255,255,.12)',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Rascunho</button>
                <button onClick={handleSalvarOdonto} style={{background:'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{editandoId?'Salvar':'Criar or\u00e7amento'}</button>
              </div>
            </div>
          </div>
        )}
"""

# Estados adicionais necessarios
ESTADOS_ADICIONAIS = """
  const [dentesSelec,setDentesSelec]=useState<number[]>([])
  const [odDesconto,setOdDesconto]=useState('')
"""

encoded_view = base64.b64encode(NOVO_ODONTO.encode('utf-8')).decode('ascii')
chunks = [encoded_view[i:i+76] for i in range(0, len(encoded_view), 76)]

lines = ['import base64\n']
lines.append('parts=[\n')
for chunk in chunks:
    lines.append(f'"{chunk}",\n')
lines.append(']\nnovo_odonto=base64.b64decode("".join(parts)).decode("utf-8")\n\n')
lines.append('''
with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Adicionar estados se nao existirem
if 'dentesSelec' not in c:
    old = "  const [denteSel,setDenteSel]=useState<number|null>(null)"
    new = "  const [dentesSelec,setDentesSelec]=useState<number[]>([])"
    c = c.replace(old, new, 1)
    print('dentesSelec adicionado')

if 'odDesconto' not in c:
    old = "  const [odPagValor,setOdPagValor]=useState('')"
    new = "  const [odDesconto,setOdDesconto]=useState('')\\n  const [odPagValor,setOdPagValor]=useState('')"
    c = c.replace(old, new, 1)
    print('odDesconto adicionado')

# 2. Adicionar odTotalFinal se nao existir
if 'odTotalFinal' not in c:
    old = "  const odTotal=procs.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)"
    new = "  const odTotal=procs.reduce((a,p)=>a+(p.total||parseFloat(p.valor||'0')||0),0)\\n  const odDescontoNum=parseFloat(odDesconto||'0')\\n  const odTotalFinal=Math.max(0,odTotal-odDescontoNum)"
    if old in c:
        c = c.replace(old, new, 1)
        print('odTotalFinal adicionado')
    else:
        # Tentar sem o calculo anterior
        old2 = "  const odPago=odHistPags.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)"
        new2 = "  const odTotal=procs.reduce((a,p)=>a+(p.total||0),0)\\n  const odDescontoNum=parseFloat(odDesconto||'0')\\n  const odTotalFinal=Math.max(0,odTotal-odDescontoNum)\\n  const odPago=odHistPags.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)"
        c = c.replace(old2, new2, 1)
        print('odTotalFinal adicionado v2')

# 3. Substituir view odonto
start = c.find("        {view==='odonto'&&(")
detalhe = c.find("{view==='detalhe'", start + 100)
modal = c.find("{/* Modal", start + 100)
end_candidates = [x for x in [detalhe, modal] if x > 0]
end = min(end_candidates) if end_candidates else -1

if start > 0 and end > 0:
    c_new = c[:start] + novo_odonto + "\\n        " + c[end:]
    with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
        f.write(c_new)
    print(f"SALVO! start={start} end={end} linhas={c_new.count(chr(10))}")
    print("dente-btn:", "dente-btn" in c_new)
    print("dentesSelec:", "dentesSelec" in c_new)
    print("odTotalFinal:", "odTotalFinal" in c_new)
else:
    print(f"ERRO: start={start} end={end}")
''')

with open('/mnt/user-data/outputs/fix_odonto_direto.py', 'w') as f:
    f.writelines(lines)
print("Script gerado!")
