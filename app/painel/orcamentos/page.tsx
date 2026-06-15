
import os, sys, re

if not os.path.exists('app/painel/orcamentos/page.tsx'):
    print("ERRO: Execute dentro da pasta clientemarcado!")
    print("Pasta atual:", os.getcwd())
    sys.exit(1)

with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()
print("Lido:", len(c), "chars")

# 1. pQtd
if "pQtd" not in c:
    for old,new in [
        ("  const [pValor,setPValor]=useState('')","  const [pValor,setPValor]=useState('')\n  const [pQtd,setPQtd]=useState(1)"),
        ("  const [pStatus,setPStatus]=useState('Planejado')","  const [pQtd,setPQtd]=useState(1)\n  const [pStatus,setPStatus]=useState('Planejado')"),
    ]:
        if old in c: c=c.replace(old,new,1); print("pQtd ok"); break

# 2. dentesSelec
if "dentesSelec" not in c:
    for old,new in [
        ("const [denteSel,setDenteSel]=useState<number|null>(null)","const [dentesSelec,setDentesSelec]=useState<number[]>([])"),
        ("  const [pNome,setPNome]=useState('')","  const [dentesSelec,setDentesSelec]=useState<number[]>([])\n  const [pNome,setPNome]=useState('')"),
    ]:
        if old in c: c=c.replace(old,new,1); print("dentesSelec ok"); break

# 3. odDesconto
if "odDesconto" not in c:
    old="  const [odPagValor,setOdPagValor]=useState('')"
    new="  const [odDesconto,setOdDesconto]=useState('')\n  const [odPagValor,setOdPagValor]=useState('')"
    if old in c: c=c.replace(old,new,1); print("odDesconto ok")

# 4. odTotalFinal
if "odTotalFinal" not in c:
    for old,new in [
        ("  const odTotal=procs.reduce((a,p)=>a+parseFloat(p.valor||'0'),0)",
         "  const odTotal=procs.reduce((a,p)=>a+(p.total||0),0)\n  const odDescontoNum=parseFloat(odDesconto||'0')\n  const odTotalFinal=Math.max(0,odTotal-odDescontoNum)"),
        ("  const odPago=odHistPags.reduce",
         "  const odTotal=procs.reduce((a,p)=>a+(p.total||0),0)\n  const odDescontoNum=parseFloat(odDesconto||'0')\n  const odTotalFinal=Math.max(0,odTotal-odDescontoNum)\n  const odPago=odHistPags.reduce"),
    ]:
        if old in c: c=c.replace(old,new,1); print("odTotalFinal ok"); break

# 5. CSS tabela responsiva
CSS_EXTRA = "\n  @media(max-width:1023px){.od-tabela-hdr{display:none!important}.od-tabela-row{display:none!important}.od-tabela-card{display:block!important}}\n  @media(min-width:1024px){.od-tabela-card{display:none!important}.od-tabela-hdr{display:grid!important}.od-tabela-row{display:grid!important}}\n"
if "od-tabela-hdr" not in c:
    old="  @media(max-width:480px)"
    if old in c: c=c.replace(old,CSS_EXTRA+old,1); print("CSS tabela ok")

# 6. resetAll
if "setPQtd(1)" not in c and "pQtd" in c:
    for old,new in [
        ("    setDentesSelec([]);setProcs([]);","    setDentesSelec([]);setProcs([]);setPQtd(1);setOdDesconto('');"),
        ("    setDentesSelec([]);setProcs([])","    setDentesSelec([]);setProcs([]);setPQtd(1);setOdDesconto('')"),
    ]:
        if old in c: c=c.replace(old,new,1); print("resetAll ok"); break

print("Estados ok. Buscando view odonto...")

NOVO_ODONTO = '        {view===\'odonto\'&&(\n          <div style={{minHeight:\'100vh\',background:\'#07111F\'}}>\n            <div className="od-bdy" style={{padding:\'12px 12px 140px\',maxWidth:\'960px\',margin:\'0 auto\'}}>\n              <button onClick={()=>{resetAll();setView(editandoId?\'lista\':\'escolha\')}} style={{background:\'none\',border:\'none\',cursor:\'pointer\',fontSize:\'13px\',color:\'#64748B\',fontFamily:\'inherit\',padding:\'0\',display:\'flex\',alignItems:\'center\',gap:\'4px\',marginBottom:\'12px\'}}>\n                ← {editandoId?\'Voltar à lista\':\'Voltar\'}\n              </button>\n              <div style={{display:\'flex\',alignItems:\'center\',gap:\'10px\',marginBottom:\'3px\'}}>\n                <h1 style={{fontSize:\'20px\',fontWeight:800,color:\'#fff\',letterSpacing:\'-0.02em\'}}>Orçamento odontológico</h1>\n                <span style={{fontSize:\'10px\',fontWeight:700,background:\'rgba(124,58,237,.25)\',border:\'1px solid rgba(124,58,237,.45)\',borderRadius:\'999px\',padding:\'3px 10px\',color:\'#C4B5FD\'}}>Odontológico</span>\n              </div>\n              <p style={{fontSize:\'13px\',color:\'#94A3B8\',marginBottom:\'16px\'}}>Selecione os dentes, adicione procedimentos e acompanhe o tratamento.</p>\n              {mensagem&&<div style={{fontSize:\'13px\',padding:\'10px 14px\',borderRadius:\'8px\',marginBottom:\'12px\',color:mensagem.includes(\'rro\')?\'#F87171\':\'#4ADE80\',background:mensagem.includes(\'rro\')?\'rgba(220,38,38,.15)\':\'rgba(34,197,94,.15)\',border:`1px solid ${mensagem.includes(\'rro\')?\'rgba(220,38,38,.3)\':\'rgba(34,197,94,.3)\'}`}}>{mensagem}</div>}\n\n              <div style={card}>\n                <div style={{display:\'flex\',alignItems:\'center\',gap:\'8px\',marginBottom:\'14px\'}}>\n                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>\n                  <p style={{fontSize:\'14px\',fontWeight:700,color:\'#F8FAFC\'}}>Paciente</p>\n                </div>\n                <div style={{display:\'flex\',flexDirection:\'column\',gap:\'10px\'}}>\n                  <div><label style={lbl}>Nome *</label><input style={inp} type="text" placeholder="Nome do paciente" value={odNome} onChange={e=>setOdNome(e.target.value)}/></div>\n                  <div className="od-2col" style={{display:\'grid\',gridTemplateColumns:\'1fr 1fr\',gap:\'10px\'}}>\n                    <div><label style={lbl}>WhatsApp *</label><input style={inp} type="tel" placeholder="(11) 99999-9999" value={odWpp} onChange={e=>setOdWpp(aplicarMascaraTel(e.target.value))}/></div>\n                    <div><label style={lbl}>E-mail (opcional)</label><input style={inp} type="email" placeholder="email@exemplo.com" value={odEmail} onChange={e=>setOdEmail(e.target.value)}/></div>\n                  </div>\n                </div>\n              </div>\n\n              <div style={{...card,padding:0,overflow:\'hidden\'}}>\n                <div onClick={()=>setOdDetOpen(!odDetOpen)} style={{display:\'flex\',alignItems:\'center\',justifyContent:\'space-between\',padding:\'14px 16px\',cursor:\'pointer\',userSelect:\'none\' as const}}>\n                  <div style={{display:\'flex\',alignItems:\'center\',gap:\'8px\'}}>\n                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>\n                    <p style={{fontSize:\'13px\',fontWeight:700,color:\'#fff\'}}>Detalhes do tratamento</p>\n                  </div>\n                  <span style={{color:\'#64748B\',fontSize:\'16px\',transform:odDetOpen?\'rotate(180deg)\':\'none\',transition:\'transform .2s\'}}>⏄</span>\n                </div>\n                {odDetOpen&&(\n                  <div style={{padding:\'0 16px 16px\',borderTop:\'1px solid rgba(255,255,255,.08)\',display:\'flex\',flexDirection:\'column\',gap:\'10px\',marginTop:\'14px\'}}>\n                    <div className="od-2col" style={{display:\'grid\',gridTemplateColumns:\'1fr 1fr\',gap:\'10px\'}}>\n                      <div><label style={lbl}>Status</label>\n                        <select style={sel} value={odStatus} onChange={e=>setOdStatus(e.target.value)}>\n                          {[\'Rascunho\',\'Aguardando aprovação\',\'Em andamento\',\'Parcialmente pago\',\'Pago\',\'Finalizado\',\'Cancelado\'].map(s=><option key={s}>{s}</option>)}\n                        </select>\n                      </div>\n                      <div><label style={lbl}>Data</label><input style={inp} type="date" value={odData} onChange={e=>setOdData(e.target.value)}/></div>\n                    </div>\n                    <div><label style={lbl}>Profissional responsável</label>\n                      <select style={sel} value={odProfId} onChange={e=>setOdProfId(e.target.value)}>\n                        <option value="">Nenhum</option>\n                        {profissionais.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}\n                      </select>\n                    </div>\n                  </div>\n                )}\n              </div>\n\n              <div style={card}>\n                <div style={{display:\'flex\',alignItems:\'center\',gap:\'8px\',marginBottom:\'6px\'}}>\n                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 5 4 9c0 2.5 1 4.5 2 6 1 1.5 2 3 2 5 0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2 0-2 1-3.5 2-5 1-1.5 2-3.5 2-6 0-4-4-7-8-7z"/></svg>\n                  <p style={{fontSize:\'14px\',fontWeight:700,color:\'#F8FAFC\'}}>Odontograma</p>\n                </div>\n                <p style={{fontSize:\'12px\',color:\'#94A3B8\',marginBottom:\'14px\'}}>Toque nos dentes para selecionar. Selecione um ou mais e adicione procedimentos abaixo.</p>\n                <style dangerouslySetInnerHTML={{__html:`.dt{position:relative;width:30px;height:38px;border-radius:4px 4px 8px 8px;border:1.5px solid rgba(180,195,215,.3);background:linear-gradient(175deg,#dce8f5 0%,#c5d8ec 55%,#b8cfe8 100%);cursor:pointer;font-size:9px;font-weight:800;color:#1a2d42;display:flex;align-items:center;justify-content:center;transition:all .14s;box-shadow:0 2px 5px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.6);flex-shrink:0;font-family:inherit;padding:0}.dt:hover{transform:translateY(-3px);box-shadow:0 6px 16px rgba(99,102,241,.4);border-color:rgba(99,102,241,.6)}.dt.s{background:linear-gradient(175deg,#818cf8 0%,#6366f1 55%,#4f46e5 100%);border-color:#818cf8;color:#fff;box-shadow:0 0 0 2px rgba(99,102,241,.35),0 4px 14px rgba(99,102,241,.55);transform:translateY(-3px)}.dt.p{background:linear-gradient(175deg,#c4b5fd 0%,#a78bfa 55%,#7c3aed 100%);border-color:#a78bfa;color:#fff;box-shadow:0 0 0 2px rgba(167,139,250,.3),0 3px 10px rgba(124,58,237,.45)}.dt.a{background:linear-gradient(175deg,#fdba74 0%,#f97316 55%,#ea580c 100%);border-color:#f97316;color:#fff;box-shadow:0 0 0 2px rgba(249,115,22,.3),0 3px 10px rgba(234,88,12,.45)}.dt.c{background:linear-gradient(175deg,#86efac 0%,#4ade80 55%,#16a34a 100%);border-color:#4ade80;color:#fff;box-shadow:0 0 0 2px rgba(74,222,128,.3),0 3px 10px rgba(34,197,94,.45)}.dt .dot{position:absolute;top:2px;right:2px;width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.9)}`}}/>\n                {[{label:\'Arcada superior\',arr:DENTES_SUP},{label:\'Arcada inferior\',arr:DENTES_INF}].map(({label,arr},ai)=>{\n                  const metade=arr.length/2\n                  return(\n                    <div key={label} style={{marginBottom:ai===0?\'6px\':\'0\'}}>\n                      <p style={{fontSize:\'10px\',fontWeight:700,color:\'#475569\',textTransform:\'uppercase\' as const,letterSpacing:\'.1em\',marginBottom:\'7px\',textAlign:\'center\'}}>{label}</p>\n                      <div style={{display:\'flex\',justifyContent:\'center\',gap:\'2px\',overflowX:\'auto\',paddingBottom:\'2px\'}}>\n                        {arr.slice(0,metade).map(n=>{\n                          const pd=procs.filter(p=>p.dentes?.includes(n))\n                          const isSel=dentesSelec.includes(n)\n                          const lst=pd.length>0?pd[pd.length-1].status:\'\'\n                          const cls=isSel?\'dt s\':lst===\'Concluído\'||lst===\'Pago\'?\'dt c\':lst===\'Em andamento\'?\'dt a\':lst===\'Planejado\'?\'dt p\':\'dt\'\n                          return(<button key={n} className={cls} onClick={()=>setDentesSelec(prev=>prev.includes(n)?prev.filter(d=>d!==n):[...prev,n])}>{n}{pd.length>0&&!isSel&&<span className="dot"/>}</button>)\n                        })}\n                        <div style={{width:\'1px\',background:\'rgba(148,163,184,.25)\',margin:\'0 4px\',alignSelf:\'stretch\',flexShrink:0}}/>\n                        {arr.slice(metade).map(n=>{\n                          const pd=procs.filter(p=>p.dentes?.includes(n))\n                          const isSel=dentesSelec.includes(n)\n                          const lst=pd.length>0?pd[pd.length-1].status:\'\'\n                          const cls=isSel?\'dt s\':lst===\'Concluído\'||lst===\'Pago\'?\'dt c\':lst===\'Em andamento\'?\'dt a\':lst===\'Planejado\'?\'dt p\':\'dt\'\n                          return(<button key={n} className={cls} onClick={()=>setDentesSelec(prev=>prev.includes(n)?prev.filter(d=>d!==n):[...prev,n])}>{n}{pd.length>0&&!isSel&&<span className="dot"/>}</button>)\n                        })}\n                      </div>\n                      {ai===0&&<div style={{height:\'6px\'}}/>}\n                    </div>\n                  )\n                })}\n                <div style={{marginTop:\'12px\',display:\'flex\',alignItems:\'center\',gap:\'6px\',flexWrap:\'wrap\',minHeight:\'30px\'}}>\n                  {dentesSelec.length===0?(\n                    <span style={{fontSize:\'12px\',color:\'#475569\'}}>Nenhum dente selecionado — toque nos dentes acima.</span>\n                  ):(\n                    <>\n                      <span style={{fontSize:\'12px\',color:\'#94A3B8\',fontWeight:600,flexShrink:0}}>Selecionados:</span>\n                      {[...dentesSelec].sort((a,b)=>a-b).map(d=>(\n                        <button key={d} onClick={()=>setDentesSelec(prev=>prev.filter(x=>x!==d))}\n                          style={{fontSize:\'11px\',fontWeight:700,background:\'rgba(99,102,241,.2)\',border:\'1px solid rgba(99,102,241,.45)\',borderRadius:\'999px\',padding:\'2px 8px\',color:\'#a5b4fc\',cursor:\'pointer\',fontFamily:\'inherit\'}}>\n                          {d} ×\n                        </button>\n                      ))}\n                      <button onClick={()=>setDentesSelec([])} style={{fontSize:\'11px\',fontWeight:600,color:\'#64748B\',background:\'rgba(255,255,255,.06)\',border:\'1px solid rgba(255,255,255,.1)\',borderRadius:\'6px\',padding:\'2px 8px\',cursor:\'pointer\',fontFamily:\'inherit\',marginLeft:\'2px\'}}>Limpar</button>\n                    </>\n                  )}\n                </div>\n                <div style={{display:\'flex\',gap:\'10px\',flexWrap:\'wrap\',marginTop:\'10px\'}}>\n                  {[{cls:\'dt\',l:\'Livre\'},{cls:\'dt p\',l:\'Planejado\'},{cls:\'dt a\',l:\'Em andamento\'},{cls:\'dt c\',l:\'Concluído\'}].map(({cls,l})=>(\n                    <div key={l} style={{display:\'flex\',alignItems:\'center\',gap:\'4px\'}}>\n                      <div className={cls} style={{width:\'14px\',height:\'18px\',pointerEvents:\'none\' as const,flexShrink:0}}/>\n                      <span style={{fontSize:\'10px\',color:\'#64748B\'}}>{l}</span>\n                    </div>\n                  ))}\n                </div>\n              </div>\n\n              <div style={card}>\n                <div style={{display:\'flex\',alignItems:\'center\',gap:\'8px\',marginBottom:\'12px\'}}>\n                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>\n                  <p style={{fontSize:\'14px\',fontWeight:700,color:\'#F8FAFC\'}}>Adicionar procedimento</p>\n                </div>\n                <div style={{display:\'flex\',flexDirection:\'column\',gap:\'8px\'}}>\n                  <div><label style={lbl}>Procedimento *</label><input style={inp} type="text" placeholder="Ex: restauração, canal, extração, limpeza..." value={pNome} onChange={e=>setPNome(e.target.value)}/></div>\n                  <div style={{display:\'grid\',gridTemplateColumns:\'1fr 70px 1fr\',gap:\'8px\'}}>\n                    <div>\n                      <label style={lbl}>Dentes vinculados</label>\n                      <div style={{...inp,padding:\'6px 10px\',display:\'flex\',alignItems:\'center\',gap:\'3px\',flexWrap:\'wrap\',minHeight:\'42px\',cursor:\'default\'}}>\n                        {dentesSelec.length===0?<span style={{fontSize:\'12px\',color:\'#475569\'}}>Sem dente específico</span>\n                          :[...dentesSelec].sort((a,b)=>a-b).map(d=>(\n                            <span key={d} style={{fontSize:\'11px\',fontWeight:700,background:\'rgba(99,102,241,.2)\',border:\'1px solid rgba(99,102,241,.4)\',borderRadius:\'999px\',padding:\'1px 6px\',color:\'#a5b4fc\'}}>{d}</span>\n                          ))}\n                      </div>\n                    </div>\n                    <div>\n                      <label style={lbl}>Qtd.</label>\n                      <input style={{...inp,textAlign:\'center\'}} type="number" min="1" value={pQtd} onChange={e=>setPQtd(parseInt(e.target.value)||1)}/>\n                    </div>\n                    <div>\n                      <label style={lbl}>Valor unit. (R$)</label>\n                      <input style={inp} type="number" min="0" step="0.01" placeholder="0,00" value={pValor} onChange={e=>setPValor(e.target.value)}/>\n                    </div>\n                  </div>\n                  {pNome&&pValor&&parseFloat(pValor)>0&&(\n                    <div style={{background:\'rgba(34,197,94,.08)\',border:\'1px solid rgba(34,197,94,.2)\',borderRadius:\'8px\',padding:\'7px 12px\',display:\'flex\',justifyContent:\'space-between\',alignItems:\'center\'}}>\n                      <span style={{fontSize:\'12px\',color:\'#94A3B8\'}}>Total da linha ({pQtd||1} × R$ {fmtBRL(parseFloat(pValor)||0)})</span>\n                      <span style={{fontSize:\'15px\',fontWeight:800,color:\'#4ADE80\'}}>R$ {fmtBRL((pQtd||1)*(parseFloat(pValor)||0))}</span>\n                    </div>\n                  )}\n                  <button onClick={()=>{\n                    if(!pNome.trim()||!pValor||parseFloat(pValor)<=0)return\n                    const qtd=pQtd||1\n                    setProcs(prev=>[...prev,{nome:pNome.trim(),dentes:[...dentesSelec],qtd,valorUnit:parseFloat(pValor)||0,total:qtd*(parseFloat(pValor)||0),status:\'Planejado\',obs:\'\'}])\n                    setPNome(\'\');setPValor(\'\');setPQtd(1);setDentesSelec([])\n                  }} disabled={!pNome.trim()||!pValor||parseFloat(pValor)<=0}\n                    style={{background:\'linear-gradient(135deg,#7C3AED,#4F46E5)\',color:\'#fff\',border:\'none\',borderRadius:\'10px\',padding:\'12px\',fontSize:\'13px\',fontWeight:700,cursor:\'pointer\',fontFamily:\'inherit\',opacity:(!pNome.trim()||!pValor||parseFloat(pValor)<=0)?0.45:1,display:\'flex\',alignItems:\'center\',justifyContent:\'center\',gap:\'6px\'}}>\n                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>\n                    + Adicionar procedimento\n                  </button>\n                </div>\n              </div>\n\n              {procs.length>0&&(\n                <div style={card}>\n                  <div style={{display:\'flex\',alignItems:\'center\',justifyContent:\'space-between\',marginBottom:\'10px\'}}>\n                    <div style={{display:\'flex\',alignItems:\'center\',gap:\'8px\'}}>\n                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>\n                      <p style={{fontSize:\'13px\',fontWeight:700,color:\'#F8FAFC\'}}>Procedimentos adicionados</p>\n                    </div>\n                    <span style={{fontSize:\'12px\',fontWeight:700,color:\'#60A5FA\'}}>{procs.length} item{procs.length!==1?\'s\':\'\'}</span>\n                  </div>\n                  <div className="od-tabela-hdr" style={{display:\'grid\',gridTemplateColumns:\'2fr 1.2fr 55px 85px 85px 70px\',gap:\'6px\',padding:\'5px 8px\',marginBottom:\'4px\'}}>\n                    {[\'Procedimento\',\'Dentes\',\'Qtd.\',\'Unitário\',\'Total\',\'Ações\'].map(h=>(\n                      <p key={h} style={{fontSize:\'10px\',fontWeight:700,color:\'#475569\',textTransform:\'uppercase\' as const,letterSpacing:\'.06em\'}}>{h}</p>\n                    ))}\n                  </div>\n                  <div style={{display:\'flex\',flexDirection:\'column\',gap:\'4px\'}}>\n                    {procs.map((proc,idx)=>{\n                      const stCor=PROC_STATUS_COR[proc.status]||PROC_STATUS_COR[\'Planejado\']\n                      return(\n                        <div key={idx}>\n                          <div className="od-tabela-row" style={{display:\'grid\',gridTemplateColumns:\'2fr 1.2fr 55px 85px 85px 70px\',gap:\'6px\',padding:\'10px 8px\',background:\'rgba(255,255,255,.04)\',borderRadius:\'8px\',border:\'1px solid rgba(148,163,184,.09)\',alignItems:\'center\'}}>\n                            <div>\n                              <p style={{fontSize:\'13px\',fontWeight:600,color:\'#F8FAFC\',marginBottom:\'2px\'}}>{proc.nome}</p>\n                              <span style={{fontSize:\'10px\',fontWeight:700,padding:\'1px 6px\',borderRadius:\'999px\',background:stCor.bg,color:stCor.color,border:`1px solid ${stCor.border}`}}>{proc.status}</span>\n                            </div>\n                            <div style={{display:\'flex\',gap:\'2px\',flexWrap:\'wrap\'}}>\n                              {proc.dentes.length>0?[...proc.dentes].sort((a,b)=>a-b).map(d=>(\n                                <span key={d} style={{fontSize:\'10px\',fontWeight:700,background:\'rgba(99,102,241,.15)\',border:\'1px solid rgba(99,102,241,.3)\',borderRadius:\'999px\',padding:\'1px 5px\',color:\'#a5b4fc\'}}>{d}</span>\n                              )):<span style={{fontSize:\'11px\',color:\'#475569\'}}>Geral</span>}\n                            </div>\n                            <p style={{fontSize:\'13px\',fontWeight:600,color:\'#CBD5E1\',textAlign:\'center\' as const}}>{proc.qtd}</p>\n                            <p style={{fontSize:\'12px\',fontWeight:600,color:\'#CBD5E1\'}}>R$ {fmtBRL(proc.valorUnit||0)}</p>\n                            <p style={{fontSize:\'14px\',fontWeight:800,color:\'#4ADE80\'}}>R$ {fmtBRL(proc.total||0)}</p>\n                            <div style={{display:\'flex\',gap:\'3px\'}}>\n                              <button onClick={()=>{setPNome(proc.nome);setPValor(String(proc.valorUnit||\'\'));setPQtd(proc.qtd||1);setDentesSelec(proc.dentes||[]);setProcs(prev=>prev.filter((_,i)=>i!==idx))}}\n                                style={{background:\'rgba(59,130,246,.1)\',border:\'1px solid rgba(59,130,246,.25)\',borderRadius:\'5px\',padding:\'3px 6px\',fontSize:\'11px\',fontWeight:600,color:\'#60A5FA\',cursor:\'pointer\',fontFamily:\'inherit\'}}>Ed</button>\n                              <button onClick={()=>setProcs(prev=>prev.filter((_,i)=>i!==idx))}\n                                style={{background:\'rgba(239,68,68,.1)\',border:\'1px solid rgba(239,68,68,.22)\',borderRadius:\'5px\',padding:\'3px 6px\',fontSize:\'11px\',fontWeight:600,color:\'#F87171\',cursor:\'pointer\',fontFamily:\'inherit\'}}>Rm</button>\n                            </div>\n                          </div>\n                          <div className="od-tabela-card" style={{display:\'none\',padding:\'12px\',background:\'rgba(255,255,255,.04)\',borderRadius:\'10px\',border:\'1px solid rgba(148,163,184,.1)\'}}>\n                            <div style={{display:\'flex\',justifyContent:\'space-between\',alignItems:\'flex-start\',marginBottom:\'8px\'}}>\n                              <div>\n                                <p style={{fontSize:\'13px\',fontWeight:700,color:\'#F8FAFC\',marginBottom:\'3px\'}}>{proc.nome}</p>\n                                <span style={{fontSize:\'10px\',fontWeight:700,padding:\'1px 6px\',borderRadius:\'999px\',background:stCor.bg,color:stCor.color,border:`1px solid ${stCor.border}`}}>{proc.status}</span>\n                              </div>\n                              <p style={{fontSize:\'16px\',fontWeight:800,color:\'#4ADE80\'}}>R$ {fmtBRL(proc.total||0)}</p>\n                            </div>\n                            <div style={{display:\'grid\',gridTemplateColumns:\'1fr 1fr\',gap:\'6px\',marginBottom:\'8px\'}}>\n                              <div style={{background:\'rgba(255,255,255,.04)\',borderRadius:\'6px\',padding:\'6px 8px\'}}>\n                                <p style={{fontSize:\'10px\',color:\'#64748B\',fontWeight:600,marginBottom:\'2px\'}}>Qtd. × Unit.</p>\n                                <p style={{fontSize:\'12px\',fontWeight:600,color:\'#CBD5E1\'}}>{proc.qtd} × R$ {fmtBRL(proc.valorUnit||0)}</p>\n                              </div>\n                              <div style={{background:\'rgba(255,255,255,.04)\',borderRadius:\'6px\',padding:\'6px 8px\'}}>\n                                <p style={{fontSize:\'10px\',color:\'#64748B\',fontWeight:600,marginBottom:\'2px\'}}>Dentes</p>\n                                <p style={{fontSize:\'12px\',fontWeight:600,color:\'#a5b4fc\'}}>{proc.dentes.length>0?[...proc.dentes].sort((a,b)=>a-b).join(\', \'):\'Geral\'}</p>\n                              </div>\n                            </div>\n                            <div style={{display:\'flex\',gap:\'6px\'}}>\n                              <button onClick={()=>{setPNome(proc.nome);setPValor(String(proc.valorUnit||\'\'));setPQtd(proc.qtd||1);setDentesSelec(proc.dentes||[]);setProcs(prev=>prev.filter((_,i)=>i!==idx))}}\n                                style={{flex:1,background:\'rgba(59,130,246,.1)\',border:\'1px solid rgba(59,130,246,.25)\',borderRadius:\'7px\',padding:\'7px\',fontSize:\'12px\',fontWeight:600,color:\'#60A5FA\',cursor:\'pointer\',fontFamily:\'inherit\'}}>Editar</button>\n                              <button onClick={()=>setProcs(prev=>prev.filter((_,i)=>i!==idx))}\n                                style={{flex:1,background:\'rgba(239,68,68,.08)\',border:\'1px solid rgba(239,68,68,.2)\',borderRadius:\'7px\',padding:\'7px\',fontSize:\'12px\',fontWeight:600,color:\'#F87171\',cursor:\'pointer\',fontFamily:\'inherit\'}}>Remover</button>\n                            </div>\n                          </div>\n                        </div>\n                      )\n                    })}\n                  </div>\n                </div>\n              )}\n\n              <div style={{...card,background:\'radial-gradient(circle at top left,rgba(59,130,246,.08),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))\'}}>\n                <div style={{display:\'flex\',alignItems:\'center\',gap:\'8px\',marginBottom:\'10px\'}}>\n                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>\n                  <p style={{fontSize:\'13px\',fontWeight:700,color:\'#F8FAFC\'}}>Resumo financeiro</p>\n                </div>\n                <div style={{display:\'flex\',justifyContent:\'space-between\',fontSize:\'13px\',color:\'#94A3B8\',marginBottom:\'7px\'}}>\n                  <span>Subtotal {procs.length>0?`(${procs.length} proc.)`:\'\'}</span>\n                  <span style={{fontWeight:700,color:\'#F8FAFC\'}}>R$ {fmtBRL(odTotal)}</span>\n                </div>\n                <div style={{display:\'flex\',justifyContent:\'space-between\',alignItems:\'center\',fontSize:\'13px\',marginBottom:\'12px\',paddingBottom:\'12px\',borderBottom:\'1px solid rgba(255,255,255,.08)\'}}>\n                  <span style={{color:\'#64748B\'}}>Desconto (R$)</span>\n                  <input type="number" min="0" step="0.01" placeholder="0,00" value={odDesconto} onChange={e=>setOdDesconto(e.target.value)}\n                    style={{background:\'rgba(255,255,255,.06)\',border:\'1px solid rgba(255,255,255,.12)\',outline:\'none\',color:\'#F87171\',fontSize:\'13px\',fontWeight:700,textAlign:\'right\' as const,width:\'100px\',fontFamily:\'inherit\',borderRadius:\'7px\',padding:\'5px 10px\'}}/>\n                </div>\n                <div style={{display:\'flex\',justifyContent:\'space-between\',alignItems:\'center\'}}>\n                  <span style={{fontSize:\'15px\',fontWeight:700,color:\'#F8FAFC\'}}>Total do tratamento</span>\n                  <span style={{fontSize:\'22px\',fontWeight:800,color:\'#C4B5FD\',letterSpacing:\'-0.02em\'}}>R$ {fmtBRL(odTotalFinal)}</span>\n                </div>\n              </div>\n\n              <div style={{...card,padding:0,overflow:\'hidden\'}}>\n                <div onClick={()=>setOdPagOpen(!odPagOpen)} style={{display:\'flex\',alignItems:\'center\',justifyContent:\'space-between\',padding:\'14px 16px\',cursor:\'pointer\',userSelect:\'none\' as const}}>\n                  <div style={{display:\'flex\',alignItems:\'center\',gap:\'8px\'}}>\n                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>\n                    <div>\n                      <p style={{fontSize:\'13px\',fontWeight:700,color:\'#fff\'}}>Pagamentos</p>\n                      <p style={{fontSize:\'11px\',color:\'#64748B\'}}>Pago: R$ {fmtBRL(odPago)} · Saldo: R$ {fmtBRL(Math.max(0,odTotalFinal-odPago))}</p>\n                    </div>\n                  </div>\n                  <span style={{color:\'#64748B\',fontSize:\'16px\',transform:odPagOpen?\'rotate(180deg)\':\'none\',transition:\'transform .2s\'}}>⏄</span>\n                </div>\n                {odPagOpen&&(\n                  <div style={{padding:\'0 16px 16px\',borderTop:\'1px solid rgba(255,255,255,.08)\'}}>\n                    <div style={{display:\'grid\',gridTemplateColumns:\'repeat(3,1fr)\',gap:\'8px\',margin:\'12px 0\'}}>\n                      {[{l:\'Total\',v:odTotalFinal,c:\'#F8FAFC\'},{l:\'Pago\',v:odPago,c:\'#4ADE80\'},{l:\'Saldo\',v:Math.max(0,odTotalFinal-odPago),c:odPago<odTotalFinal?\'#FBBF24\':\'#4ADE80\'}].map(f=>(\n                        <div key={f.l} style={{background:\'rgba(255,255,255,.05)\',borderRadius:\'8px\',padding:\'8px\',border:\'1px solid rgba(148,163,184,.1)\'}}>\n                          <p style={{fontSize:\'10px\',fontWeight:600,color:\'#94A3B8\',textTransform:\'uppercase\' as const,letterSpacing:\'.05em\',marginBottom:\'2px\'}}>{f.l}</p>\n                          <p style={{fontSize:\'14px\',fontWeight:800,color:f.c}}>R$ {fmtBRL(f.v)}</p>\n                        </div>\n                      ))}\n                    </div>\n                    <div style={{display:\'flex\',flexDirection:\'column\',gap:\'8px\',marginBottom:\'8px\'}}>\n                      <div className="od-2col" style={{display:\'grid\',gridTemplateColumns:\'1fr 1fr\',gap:\'8px\'}}>\n                        <div><label style={lbl}>Valor (R$)</label><input style={inp} type="number" placeholder="0,00" value={odPagValor} onChange={e=>setOdPagValor(e.target.value)}/></div>\n                        <div><label style={lbl}>Forma</label>\n                          <select style={sel} value={odPagForma} onChange={e=>setOdPagForma(e.target.value)}>\n                            {[\'Pix\',\'Dinheiro\',\'Cartão de crédito\',\'Cartão de débito\',\'Transferência\',\'Outro\'].map(f=><option key={f}>{f}</option>)}\n                          </select>\n                        </div>\n                      </div>\n                      <div><label style={lbl}>Observação</label><input style={inp} type="text" placeholder="Ex: entrada..." value={odPagObs} onChange={e=>setOdPagObs(e.target.value)}/></div>\n                      <button onClick={adicionarPagOdonto} disabled={!odPagValor||parseFloat(odPagValor)<=0}\n                        style={{background:\'rgba(34,197,94,.15)\',border:\'1px solid rgba(34,197,94,.3)\',borderRadius:\'8px\',padding:\'10px\',fontSize:\'13px\',fontWeight:700,color:\'#4ADE80\',cursor:\'pointer\',fontFamily:\'inherit\',opacity:(!odPagValor||parseFloat(odPagValor)<=0)?0.45:1}}>\n                        Registrar pagamento\n                      </button>\n                    </div>\n                    {odHistPags.length>0&&(\n                      <div style={{display:\'flex\',flexDirection:\'column\',gap:\'5px\'}}>\n                        {odHistPags.map((p,i)=>(\n                          <div key={i} style={{background:\'rgba(255,255,255,.04)\',border:\'1px solid rgba(255,255,255,.07)\',borderRadius:\'8px\',padding:\'8px 12px\',display:\'flex\',justifyContent:\'space-between\',alignItems:\'center\'}}>\n                            <div><span style={{fontSize:\'13px\',fontWeight:700,color:\'#4ADE80\'}}>R$ {fmtBRL(p.valor)}</span><span style={{fontSize:\'11px\',color:\'#64748B\',marginLeft:\'8px\'}}>{p.forma} · {fmtData(p.data)}</span>{p.obs&&<p style={{fontSize:\'11px\',color:\'#64748B\'}}>{p.obs}</p>}</div>\n                            <button onClick={()=>setOdHistPags(prev=>prev.filter((_,j)=>j!==i))} style={{background:\'none\',border:\'none\',color:\'#F87171\',cursor:\'pointer\',fontSize:\'16px\'}}>×</button>\n                          </div>\n                        ))}\n                      </div>\n                    )}\n                  </div>\n                )}\n              </div>\n\n              <div style={{marginBottom:\'10px\'}}>\n                <label style={lbl}>Observações gerais do tratamento</label>\n                <textarea rows={2} style={{...inp,resize:\'none\' as const}} placeholder="Ex: tratamento dividido em etapas, retorno em 15 dias..." value={odObs} onChange={e=>setOdObs(e.target.value)}/>\n              </div>\n            </div>\n\n            <div className="od-footer">\n              <div style={{display:\'flex\',justifyContent:\'space-between\',alignItems:\'center\',marginBottom:\'6px\'}}>\n                <span style={{fontSize:\'12px\',color:\'#94A3B8\',fontWeight:600}}>Total do tratamento</span>\n                <span style={{fontSize:\'18px\',fontWeight:800,color:\'#C4B5FD\'}}>R$ {fmtBRL(odTotalFinal)}</span>\n              </div>\n              <div style={{display:\'grid\',gridTemplateColumns:\'2fr 3fr\',gap:\'8px\'}}>\n                <button onClick={()=>{resetAll();setView(\'lista\')}} style={{background:\'rgba(255,255,255,.08)\',color:\'#94A3B8\',border:\'1px solid rgba(255,255,255,.12)\',borderRadius:\'10px\',padding:\'12px 0\',fontSize:\'13px\',fontWeight:600,cursor:\'pointer\',fontFamily:\'inherit\'}}>Rascunho</button>\n                <button onClick={handleSalvarOdonto} style={{background:\'linear-gradient(135deg,#7C3AED,#4F46E5)\',color:\'#fff\',border:\'none\',borderRadius:\'10px\',padding:\'12px 0\',fontSize:\'13px\',fontWeight:800,cursor:\'pointer\',fontFamily:\'inherit\'}}>{editandoId?\'Salvar\':\'Criar orçamento\'}</button>\n              </div>\n            </div>\n          </div>\n        )}\n'

import re

# Encontrar e substituir view odonto
start = c.find("        {view==='odonto'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div className="od-bdy" style={{padding:'12px 12px 140px',maxWidth:'960px',margin:'0 auto'}}>
              <button onClick={()=>{resetAll();setView(editandoId?'lista':'escolha')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'12px'}}>
                ← {editandoId?'Voltar à lista':'Voltar'}
              </button>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'3px'}}>
                <h1 style={{fontSize:'20px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>Orçamento odontológico</h1>
                <span style={{fontSize:'10px',fontWeight:700,background:'rgba(124,58,237,.25)',border:'1px solid rgba(124,58,237,.45)',borderRadius:'999px',padding:'3px 10px',color:'#C4B5FD'}}>Odontológico</span>
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
                <div onClick={()=>setOdDetOpen(!odDetOpen)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',cursor:'pointer',userSelect:'none' as const}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Detalhes do tratamento</p>
                  </div>
                  <span style={{color:'#64748B',fontSize:'16px',transform:odDetOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>⏄</span>
                </div>
                {odDetOpen&&(
                  <div style={{padding:'0 16px 16px',borderTop:'1px solid rgba(255,255,255,.08)',display:'flex',flexDirection:'column',gap:'10px',marginTop:'14px'}}>
                    <div className="od-2col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                      <div><label style={lbl}>Status</label>
                        <select style={sel} value={odStatus} onChange={e=>setOdStatus(e.target.value)}>
                          {['Rascunho','Aguardando aprovação','Em andamento','Parcialmente pago','Pago','Finalizado','Cancelado'].map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div><label style={lbl}>Data</label><input style={inp} type="date" value={odData} onChange={e=>setOdData(e.target.value)}/></div>
                    </div>
                    <div><label style={lbl}>Profissional responsável</label>
                      <select style={sel} value={odProfId} onChange={e=>setOdProfId(e.target.value)}>
                        <option value="">Nenhum</option>
                        {profissionais.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 5 4 9c0 2.5 1 4.5 2 6 1 1.5 2 3 2 5 0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2 0-2 1-3.5 2-5 1-1.5 2-3.5 2-6 0-4-4-7-8-7z"/></svg>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Odontograma</p>
                </div>
                <p style={{fontSize:'12px',color:'#94A3B8',marginBottom:'14px'}}>Toque nos dentes para selecionar. Selecione um ou mais e adicione procedimentos abaixo.</p>
                <style dangerouslySetInnerHTML={{__html:`.dt{position:relative;width:30px;height:38px;border-radius:4px 4px 8px 8px;border:1.5px solid rgba(180,195,215,.3);background:linear-gradient(175deg,#dce8f5 0%,#c5d8ec 55%,#b8cfe8 100%);cursor:pointer;font-size:9px;font-weight:800;color:#1a2d42;display:flex;align-items:center;justify-content:center;transition:all .14s;box-shadow:0 2px 5px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.6);flex-shrink:0;font-family:inherit;padding:0}.dt:hover{transform:translateY(-3px);box-shadow:0 6px 16px rgba(99,102,241,.4);border-color:rgba(99,102,241,.6)}.dt.s{background:linear-gradient(175deg,#818cf8 0%,#6366f1 55%,#4f46e5 100%);border-color:#818cf8;color:#fff;box-shadow:0 0 0 2px rgba(99,102,241,.35),0 4px 14px rgba(99,102,241,.55);transform:translateY(-3px)}.dt.p{background:linear-gradient(175deg,#c4b5fd 0%,#a78bfa 55%,#7c3aed 100%);border-color:#a78bfa;color:#fff;box-shadow:0 0 0 2px rgba(167,139,250,.3),0 3px 10px rgba(124,58,237,.45)}.dt.a{background:linear-gradient(175deg,#fdba74 0%,#f97316 55%,#ea580c 100%);border-color:#f97316;color:#fff;box-shadow:0 0 0 2px rgba(249,115,22,.3),0 3px 10px rgba(234,88,12,.45)}.dt.c{background:linear-gradient(175deg,#86efac 0%,#4ade80 55%,#16a34a 100%);border-color:#4ade80;color:#fff;box-shadow:0 0 0 2px rgba(74,222,128,.3),0 3px 10px rgba(34,197,94,.45)}.dt .dot{position:absolute;top:2px;right:2px;width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.9)}`}}/>
                {[{label:'Arcada superior',arr:DENTES_SUP},{label:'Arcada inferior',arr:DENTES_INF}].map(({label,arr},ai)=>{
                  const metade=arr.length/2
                  return(
                    <div key={label} style={{marginBottom:ai===0?'6px':'0'}}>
                      <p style={{fontSize:'10px',fontWeight:700,color:'#475569',textTransform:'uppercase' as const,letterSpacing:'.1em',marginBottom:'7px',textAlign:'center'}}>{label}</p>
                      <div style={{display:'flex',justifyContent:'center',gap:'2px',overflowX:'auto',paddingBottom:'2px'}}>
                        {arr.slice(0,metade).map(n=>{
                          const pd=procs.filter(p=>p.dentes?.includes(n))
                          const isSel=dentesSelec.includes(n)
                          const lst=pd.length>0?pd[pd.length-1].status:''
                          const cls=isSel?'dt s':lst==='Concluído'||lst==='Pago'?'dt c':lst==='Em andamento'?'dt a':lst==='Planejado'?'dt p':'dt'
                          return(<button key={n} className={cls} onClick={()=>setDentesSelec(prev=>prev.includes(n)?prev.filter(d=>d!==n):[...prev,n])}>{n}{pd.length>0&&!isSel&&<span className="dot"/>}</button>)
                        })}
                        <div style={{width:'1px',background:'rgba(148,163,184,.25)',margin:'0 4px',alignSelf:'stretch',flexShrink:0}}/>
                        {arr.slice(metade).map(n=>{
                          const pd=procs.filter(p=>p.dentes?.includes(n))
                          const isSel=dentesSelec.includes(n)
                          const lst=pd.length>0?pd[pd.length-1].status:''
                          const cls=isSel?'dt s':lst==='Concluído'||lst==='Pago'?'dt c':lst==='Em andamento'?'dt a':lst==='Planejado'?'dt p':'dt'
                          return(<button key={n} className={cls} onClick={()=>setDentesSelec(prev=>prev.includes(n)?prev.filter(d=>d!==n):[...prev,n])}>{n}{pd.length>0&&!isSel&&<span className="dot"/>}</button>)
                        })}
                      </div>
                      {ai===0&&<div style={{height:'6px'}}/>}
                    </div>
                  )
                })}
                <div style={{marginTop:'12px',display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap',minHeight:'30px'}}>
                  {dentesSelec.length===0?(
                    <span style={{fontSize:'12px',color:'#475569'}}>Nenhum dente selecionado — toque nos dentes acima.</span>
                  ):(
                    <>
                      <span style={{fontSize:'12px',color:'#94A3B8',fontWeight:600,flexShrink:0}}>Selecionados:</span>
                      {[...dentesSelec].sort((a,b)=>a-b).map(d=>(
                        <button key={d} onClick={()=>setDentesSelec(prev=>prev.filter(x=>x!==d))}
                          style={{fontSize:'11px',fontWeight:700,background:'rgba(99,102,241,.2)',border:'1px solid rgba(99,102,241,.45)',borderRadius:'999px',padding:'2px 8px',color:'#a5b4fc',cursor:'pointer',fontFamily:'inherit'}}>
                          {d} ×
                        </button>
                      ))}
                      <button onClick={()=>setDentesSelec([])} style={{fontSize:'11px',fontWeight:600,color:'#64748B',background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',padding:'2px 8px',cursor:'pointer',fontFamily:'inherit',marginLeft:'2px'}}>Limpar</button>
                    </>
                  )}
                </div>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginTop:'10px'}}>
                  {[{cls:'dt',l:'Livre'},{cls:'dt p',l:'Planejado'},{cls:'dt a',l:'Em andamento'},{cls:'dt c',l:'Concluído'}].map(({cls,l})=>(
                    <div key={l} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                      <div className={cls} style={{width:'14px',height:'18px',pointerEvents:'none' as const,flexShrink:0}}/>
                      <span style={{fontSize:'10px',color:'#64748B'}}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  <p style={{fontSize:'14px',fontWeight:700,color:'#F8FAFC'}}>Adicionar procedimento</p>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  <div><label style={lbl}>Procedimento *</label><input style={inp} type="text" placeholder="Ex: restauração, canal, extração, limpeza..." value={pNome} onChange={e=>setPNome(e.target.value)}/></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 70px 1fr',gap:'8px'}}>
                    <div>
                      <label style={lbl}>Dentes vinculados</label>
                      <div style={{...inp,padding:'6px 10px',display:'flex',alignItems:'center',gap:'3px',flexWrap:'wrap',minHeight:'42px',cursor:'default'}}>
                        {dentesSelec.length===0?<span style={{fontSize:'12px',color:'#475569'}}>Sem dente específico</span>
                          :[...dentesSelec].sort((a,b)=>a-b).map(d=>(
                            <span key={d} style={{fontSize:'11px',fontWeight:700,background:'rgba(99,102,241,.2)',border:'1px solid rgba(99,102,241,.4)',borderRadius:'999px',padding:'1px 6px',color:'#a5b4fc'}}>{d}</span>
                          ))}
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Qtd.</label>
                      <input style={{...inp,textAlign:'center'}} type="number" min="1" value={pQtd} onChange={e=>setPQtd(parseInt(e.target.value)||1)}/>
                    </div>
                    <div>
                      <label style={lbl}>Valor unit. (R$)</label>
                      <input style={inp} type="number" min="0" step="0.01" placeholder="0,00" value={pValor} onChange={e=>setPValor(e.target.value)}/>
                    </div>
                  </div>
                  {pNome&&pValor&&parseFloat(pValor)>0&&(
                    <div style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',borderRadius:'8px',padding:'7px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:'12px',color:'#94A3B8'}}>Total da linha ({pQtd||1} × R$ {fmtBRL(parseFloat(pValor)||0)})</span>
                      <span style={{fontSize:'15px',fontWeight:800,color:'#4ADE80'}}>R$ {fmtBRL((pQtd||1)*(parseFloat(pValor)||0))}</span>
                    </div>
                  )}
                  <button onClick={()=>{
                    if(!pNome.trim()||!pValor||parseFloat(pValor)<=0)return
                    const qtd=pQtd||1
                    setProcs(prev=>[...prev,{nome:pNome.trim(),dentes:[...dentesSelec],qtd,valorUnit:parseFloat(pValor)||0,total:qtd*(parseFloat(pValor)||0),status:'Planejado',obs:''}])
                    setPNome('');setPValor('');setPQtd(1);setDentesSelec([])
                  }} disabled={!pNome.trim()||!pValor||parseFloat(pValor)<=0}
                    style={{background:'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:(!pNome.trim()||!pValor||parseFloat(pValor)<=0)?0.45:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    + Adicionar procedimento
                  </button>
                </div>
              </div>

              {procs.length>0&&(
                <div style={card}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC'}}>Procedimentos adicionados</p>
                    </div>
                    <span style={{fontSize:'12px',fontWeight:700,color:'#60A5FA'}}>{procs.length} item{procs.length!==1?'s':''}</span>
                  </div>
                  <div className="od-tabela-hdr" style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 55px 85px 85px 70px',gap:'6px',padding:'5px 8px',marginBottom:'4px'}}>
                    {['Procedimento','Dentes','Qtd.','Unitário','Total','Ações'].map(h=>(
                      <p key={h} style={{fontSize:'10px',fontWeight:700,color:'#475569',textTransform:'uppercase' as const,letterSpacing:'.06em'}}>{h}</p>
                    ))}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                    {procs.map((proc,idx)=>{
                      const stCor=PROC_STATUS_COR[proc.status]||PROC_STATUS_COR['Planejado']
                      return(
                        <div key={idx}>
                          <div className="od-tabela-row" style={{display:'grid',gridTemplateColumns:'2fr 1.2fr 55px 85px 85px 70px',gap:'6px',padding:'10px 8px',background:'rgba(255,255,255,.04)',borderRadius:'8px',border:'1px solid rgba(148,163,184,.09)',alignItems:'center'}}>
                            <div>
                              <p style={{fontSize:'13px',fontWeight:600,color:'#F8FAFC',marginBottom:'2px'}}>{proc.nome}</p>
                              <span style={{fontSize:'10px',fontWeight:700,padding:'1px 6px',borderRadius:'999px',background:stCor.bg,color:stCor.color,border:`1px solid ${stCor.border}`}}>{proc.status}</span>
                            </div>
                            <div style={{display:'flex',gap:'2px',flexWrap:'wrap'}}>
                              {proc.dentes.length>0?[...proc.dentes].sort((a,b)=>a-b).map(d=>(
                                <span key={d} style={{fontSize:'10px',fontWeight:700,background:'rgba(99,102,241,.15)',border:'1px solid rgba(99,102,241,.3)',borderRadius:'999px',padding:'1px 5px',color:'#a5b4fc'}}>{d}</span>
                              )):<span style={{fontSize:'11px',color:'#475569'}}>Geral</span>}
                            </div>
                            <p style={{fontSize:'13px',fontWeight:600,color:'#CBD5E1',textAlign:'center' as const}}>{proc.qtd}</p>
                            <p style={{fontSize:'12px',fontWeight:600,color:'#CBD5E1'}}>R$ {fmtBRL(proc.valorUnit||0)}</p>
                            <p style={{fontSize:'14px',fontWeight:800,color:'#4ADE80'}}>R$ {fmtBRL(proc.total||0)}</p>
                            <div style={{display:'flex',gap:'3px'}}>
                              <button onClick={()=>{setPNome(proc.nome);setPValor(String(proc.valorUnit||''));setPQtd(proc.qtd||1);setDentesSelec(proc.dentes||[]);setProcs(prev=>prev.filter((_,i)=>i!==idx))}}
                                style={{background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.25)',borderRadius:'5px',padding:'3px 6px',fontSize:'11px',fontWeight:600,color:'#60A5FA',cursor:'pointer',fontFamily:'inherit'}}>Ed</button>
                              <button onClick={()=>setProcs(prev=>prev.filter((_,i)=>i!==idx))}
                                style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.22)',borderRadius:'5px',padding:'3px 6px',fontSize:'11px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>Rm</button>
                            </div>
                          </div>
                          <div className="od-tabela-card" style={{display:'none',padding:'12px',background:'rgba(255,255,255,.04)',borderRadius:'10px',border:'1px solid rgba(148,163,184,.1)'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                              <div>
                                <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC',marginBottom:'3px'}}>{proc.nome}</p>
                                <span style={{fontSize:'10px',fontWeight:700,padding:'1px 6px',borderRadius:'999px',background:stCor.bg,color:stCor.color,border:`1px solid ${stCor.border}`}}>{proc.status}</span>
                              </div>
                              <p style={{fontSize:'16px',fontWeight:800,color:'#4ADE80'}}>R$ {fmtBRL(proc.total||0)}</p>
                            </div>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'8px'}}>
                              <div style={{background:'rgba(255,255,255,.04)',borderRadius:'6px',padding:'6px 8px'}}>
                                <p style={{fontSize:'10px',color:'#64748B',fontWeight:600,marginBottom:'2px'}}>Qtd. × Unit.</p>
                                <p style={{fontSize:'12px',fontWeight:600,color:'#CBD5E1'}}>{proc.qtd} × R$ {fmtBRL(proc.valorUnit||0)}</p>
                              </div>
                              <div style={{background:'rgba(255,255,255,.04)',borderRadius:'6px',padding:'6px 8px'}}>
                                <p style={{fontSize:'10px',color:'#64748B',fontWeight:600,marginBottom:'2px'}}>Dentes</p>
                                <p style={{fontSize:'12px',fontWeight:600,color:'#a5b4fc'}}>{proc.dentes.length>0?[...proc.dentes].sort((a,b)=>a-b).join(', '):'Geral'}</p>
                              </div>
                            </div>
                            <div style={{display:'flex',gap:'6px'}}>
                              <button onClick={()=>{setPNome(proc.nome);setPValor(String(proc.valorUnit||''));setPQtd(proc.qtd||1);setDentesSelec(proc.dentes||[]);setProcs(prev=>prev.filter((_,i)=>i!==idx))}}
                                style={{flex:1,background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.25)',borderRadius:'7px',padding:'7px',fontSize:'12px',fontWeight:600,color:'#60A5FA',cursor:'pointer',fontFamily:'inherit'}}>Editar</button>
                              <button onClick={()=>setProcs(prev=>prev.filter((_,i)=>i!==idx))}
                                style={{flex:1,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:'7px',padding:'7px',fontSize:'12px',fontWeight:600,color:'#F87171',cursor:'pointer',fontFamily:'inherit'}}>Remover</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{...card,background:'radial-gradient(circle at top left,rgba(59,130,246,.08),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#F8FAFC'}}>Resumo financeiro</p>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#94A3B8',marginBottom:'7px'}}>
                  <span>Subtotal {procs.length>0?`(${procs.length} proc.)`:''}</span>
                  <span style={{fontWeight:700,color:'#F8FAFC'}}>R$ {fmtBRL(odTotal)}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',marginBottom:'12px',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                  <span style={{color:'#64748B'}}>Desconto (R$)</span>
                  <input type="number" min="0" step="0.01" placeholder="0,00" value={odDesconto} onChange={e=>setOdDesconto(e.target.value)}
                    style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',outline:'none',color:'#F87171',fontSize:'13px',fontWeight:700,textAlign:'right' as const,width:'100px',fontFamily:'inherit',borderRadius:'7px',padding:'5px 10px'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'15px',fontWeight:700,color:'#F8FAFC'}}>Total do tratamento</span>
                  <span style={{fontSize:'22px',fontWeight:800,color:'#C4B5FD',letterSpacing:'-0.02em'}}>R$ {fmtBRL(odTotalFinal)}</span>
                </div>
              </div>

              <div style={{...card,padding:0,overflow:'hidden'}}>
                <div onClick={()=>setOdPagOpen(!odPagOpen)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',cursor:'pointer',userSelect:'none' as const}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <div>
                      <p style={{fontSize:'13px',fontWeight:700,color:'#fff'}}>Pagamentos</p>
                      <p style={{fontSize:'11px',color:'#64748B'}}>Pago: R$ {fmtBRL(odPago)} · Saldo: R$ {fmtBRL(Math.max(0,odTotalFinal-odPago))}</p>
                    </div>
                  </div>
                  <span style={{color:'#64748B',fontSize:'16px',transform:odPagOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>⏄</span>
                </div>
                {odPagOpen&&(
                  <div style={{padding:'0 16px 16px',borderTop:'1px solid rgba(255,255,255,.08)'}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',margin:'12px 0'}}>
                      {[{l:'Total',v:odTotalFinal,c:'#F8FAFC'},{l:'Pago',v:odPago,c:'#4ADE80'},{l:'Saldo',v:Math.max(0,odTotalFinal-odPago),c:odPago<odTotalFinal?'#FBBF24':'#4ADE80'}].map(f=>(
                        <div key={f.l} style={{background:'rgba(255,255,255,.05)',borderRadius:'8px',padding:'8px',border:'1px solid rgba(148,163,184,.1)'}}>
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
                            {['Pix','Dinheiro','Cartão de crédito','Cartão de débito','Transferência','Outro'].map(f=><option key={f}>{f}</option>)}
                          </select>
                        </div>
                      </div>
                      <div><label style={lbl}>Observação</label><input style={inp} type="text" placeholder="Ex: entrada..." value={odPagObs} onChange={e=>setOdPagObs(e.target.value)}/></div>
                      <button onClick={adicionarPagOdonto} disabled={!odPagValor||parseFloat(odPagValor)<=0}
                        style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:700,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',opacity:(!odPagValor||parseFloat(odPagValor)<=0)?0.45:1}}>
                        Registrar pagamento
                      </button>
                    </div>
                    {odHistPags.length>0&&(
                      <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                        {odHistPags.map((p,i)=>(
                          <div key={i} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'8px',padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div><span style={{fontSize:'13px',fontWeight:700,color:'#4ADE80'}}>R$ {fmtBRL(p.valor)}</span><span style={{fontSize:'11px',color:'#64748B',marginLeft:'8px'}}>{p.forma} · {fmtData(p.data)}</span>{p.obs&&<p style={{fontSize:'11px',color:'#64748B'}}>{p.obs}</p>}</div>
                            <button onClick={()=>setOdHistPags(prev=>prev.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'#F87171',cursor:'pointer',fontSize:'16px'}}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{marginBottom:'10px'}}>
                <label style={lbl}>Observações gerais do tratamento</label>
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
                <button onClick={handleSalvarOdonto} style={{background:'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'#fff',border:'none',borderRadius:'10px',padding:'12px 0',fontSize:'13px',fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{editandoId?'Salvar':'Criar orçamento'}</button>
              </div>
            </div>
          </div>
        )}

        {view==='detalhe'", start + 200)
modal = c.find("{/* Modal", start + 200)
ends = [x for x in [detalhe, modal] if x > 0]
if not ends:
    print("ERRO: fim do bloco nao encontrado!")
    sys.exit(1)
end = min(ends)
print(f"Substituindo: chars {start} ate {end}")

c_new = c[:start] + NOVO_ODONTO + "\n        " + c[end:]

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c_new)

print("SALVO!")
print(".dt CSS:", ".dt{" in c_new)
print("dentesSelec:", "dentesSelec" in c_new)
print("odTotalFinal:", "odTotalFinal" in c_new)
print("pQtd:", "pQtd" in c_new)
print("Linhas:", c_new.count(chr(10)))
