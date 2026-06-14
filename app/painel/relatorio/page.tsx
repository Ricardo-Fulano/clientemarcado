with open('app/painel/relatorio/page.tsx', encoding='utf-8') as f:
    c = f.read()

# Verificar campos existentes nos agendamentos
print('servicos(nome):', 'servicos(nome)' in c)
print('profissional_id:', 'profissional_id' in c)
print('data_hora:', 'data_hora' in c)
print('status realizado:', "'realizado'" in c)
print('agsMes:', 'agsMes' in c)
print('profStats:', 'profStats' in c)

# O calculo de resumo por servico usa agsMes que ja existe
# agsMes = agendamentos.filter(a => a.data_hora?.startsWith(mes))
# cada agendamento tem: profissional_id, cliente_nome, servicos(nome), data_hora, status, valor

# Inserir calculo de resumo por servico apos profStats
old_calc = "  const melhorComRec=profStats.find(p=>p.rec>0)||null

  // Resumo por servico - baseado nos agendamentos do mes
  const agsRealizados=agsMes.filter(a=>a.status==='realizado'||a.status==='compareceu')
  const servicosMap:Record<string,{nome:string,qtd:number,receita:number,profs:Record<string,number>}>={}
  agsRealizados.forEach(a=>{
    const nomeSv=a.servicos?.nome||'Serviço não informado'
    if(!servicosMap[nomeSv])servicosMap[nomeSv]={nome:nomeSv,qtd:0,receita:0,profs:{}}
    servicosMap[nomeSv].qtd+=1
    servicosMap[nomeSv].receita+=(a.valor||0)
    if(a.profissional_id){
      const pid=a.profissional_id
      servicosMap[nomeSv].profs[pid]=(servicosMap[nomeSv].profs[pid]||0)+1
    }
  })
  const resumoServicos=Object.values(servicosMap)
    .map(sv=>{
      const topProfId=Object.entries(sv.profs).sort((a,b)=>b[1]-a[1])[0]?.[0]||null
      const topProf=topProfId?profs.find(p=>p.id===topProfId)?.nome||'Não informado':'Não informado'
      return{...sv,ticket:sv.qtd>0?sv.receita/sv.qtd:0,topProf}
    })
    .sort((a,b)=>b.qtd-a.qtd)
  const svMaisRealizado=resumoServicos[0]||null"
new_calc = """  const melhorComRec=profStats.find(p=>p.rec>0)||null

  // Resumo por servico - baseado nos agendamentos do mes
  const agsRealizados=agsMes.filter(a=>a.status==='realizado'||a.status==='compareceu')
  const servicosMap:Record<string,{nome:string,qtd:number,receita:number,profs:Record<string,number>}>={}
  agsRealizados.forEach(a=>{
    const nomeSv=a.servicos?.nome||'Serviço não informado'
    if(!servicosMap[nomeSv])servicosMap[nomeSv]={nome:nomeSv,qtd:0,receita:0,profs:{}}
    servicosMap[nomeSv].qtd+=1
    servicosMap[nomeSv].receita+=(a.valor||0)
    if(a.profissional_id){
      const pid=a.profissional_id
      servicosMap[nomeSv].profs[pid]=(servicosMap[nomeSv].profs[pid]||0)+1
    }
  })
  const resumoServicos=Object.values(servicosMap)
    .map(sv=>{
      const topProfId=Object.entries(sv.profs).sort((a,b)=>b[1]-a[1])[0]?.[0]||null
      const topProf=topProfId?profs.find(p=>p.id===topProfId)?.nome||'Não informado':'Não informado'
      return{...sv,ticket:sv.qtd>0?sv.receita/sv.qtd:0,topProf}
    })
    .sort((a,b)=>b.qtd-a.qtd)
  const svMaisRealizado=resumoServicos[0]||null"""
print('calc inserido:', old_calc in c)
c = c.replace(old_calc, new_calc, 1)

# Inserir secao HTML apos o grafico e antes de "Desempenho por profissional"
old_section = "          {/* Desempenho por profissional */}\n          <div>"
new_section = """          {/* Resumo por servico */}
          <div style={{marginBottom:'22px'}}>
            <div style={{marginBottom:'16px'}}>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Resumo por serviço</p>
              <p style={{fontSize:'13px',color:'#64748B'}}>Veja quais serviços foram realizados no período selecionado.</p>
            </div>
            {resumoServicos.length===0?(
              <div className="crd" style={{padding:'40px 24px',textAlign:'center'}}>
                <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>Nenhum serviço realizado neste período</p>
                <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.6}}>Quando atendimentos forem marcados como realizados, o resumo por serviço aparecerá aqui.</p>
              </div>
            ):(
              <>
                {svMaisRealizado&&(
                  <div style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.10),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(59,130,246,.22)',borderRadius:'14px',padding:'14px 18px',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'}}>
                    <div>
                      <p style={{fontSize:'10px',fontWeight:700,color:'#60A5FA',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>Serviço mais realizado</p>
                      <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>{svMaisRealizado.nome}</p>
                    </div>
                    <span style={{fontSize:'13px',fontWeight:700,color:'#60A5FA',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.22)',borderRadius:'999px',padding:'4px 12px'}}>{svMaisRealizado.qtd} atendimento{svMaisRealizado.qtd!==1?'s':''} no período</span>
                  </div>
                )}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'12px'}}>
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
                </div>
              </>
            )}
          </div>

          {/* Resumo por servico */}
          <div style={{marginBottom:'22px'}}>
            <div style={{marginBottom:'16px'}}>
              <p style={{fontSize:'16px',fontWeight:700,color:'#F8FAFC',marginBottom:'4px'}}>Resumo por serviço</p>
              <p style={{fontSize:'13px',color:'#64748B'}}>Veja quais serviços foram realizados no período selecionado.</p>
            </div>
            {resumoServicos.length===0?(
              <div className="crd" style={{padding:'40px 24px',textAlign:'center'}}>
                <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.25)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC',marginBottom:'8px'}}>Nenhum serviço realizado neste período</p>
                <p style={{fontSize:'13px',color:'#64748B',lineHeight:1.6}}>Quando atendimentos forem marcados como realizados, o resumo por serviço aparecerá aqui.</p>
              </div>
            ):(
              <>
                {svMaisRealizado&&(
                  <div style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.10),transparent 40%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(59,130,246,.22)',borderRadius:'14px',padding:'14px 18px',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'}}>
                    <div>
                      <p style={{fontSize:'10px',fontWeight:700,color:'#60A5FA',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>Serviço mais realizado</p>
                      <p style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>{svMaisRealizado.nome}</p>
                    </div>
                    <span style={{fontSize:'13px',fontWeight:700,color:'#60A5FA',background:'rgba(59,130,246,.12)',border:'1px solid rgba(59,130,246,.22)',borderRadius:'999px',padding:'4px 12px'}}>{svMaisRealizado.qtd} atendimento{svMaisRealizado.qtd!==1?'s':''} no período</span>
                  </div>
                )}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'12px'}}>
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
                </div>
              </>
            )}
          </div>

          {/* Desempenho por profissional */}
          <div>"""
print('section inserida:', old_section in c)
c = c.replace(old_section, new_section, 1)

with open('app/painel/relatorio/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO!')
