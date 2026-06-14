with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Expandir tipo da view
old1 = "  const [view,setUserId]=useState('')" # nao existe - usar o correto
old1 = "  const [view,setView]=useState<'lista'|'escolha'|'form'|'detalhe'>('lista')
  const [tipoOrc,setTipoOrc]=useState<'comum'|'odonto'>('comum')"
new1 = "  const [view,setView]=useState<'lista'|'escolha'|'form'|'detalhe'>('lista')\n  const [tipoOrc,setTipoOrc]=useState<'comum'|'odonto'>('comum')"
print('1:', old1 in c)
c = c.replace(old1, new1, 1)

# 2. searchParams novo=1 abre escolha
old2 = "    if(searchParams.get('novo')==='1'){resetForm();setView('escolha')}"
new2 = "    if(searchParams.get('novo')==='1'){resetForm();setView('escolha')}"
print('2:', old2 in c)
c = c.replace(old2, new2, 1)

# 3. Botao principal abre escolha
old3 = "                <button onClick={()=>{resetForm();setView('escolha')}}"
new3 = "                <button onClick={()=>{resetForm();setView('escolha')}}"
print('3:', old3 in c)
c = c.replace(old3, new3, 1)

# 4. Voltar no form
old4 = "                    <button onClick={()=>{resetForm();setView('lista')}}\n                      style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'8px'}}>\n                      \u2190 Voltar \u00e0 lista\n                    </button>"
new4 = "                    <button onClick={()=>{resetForm();setView(editandoId?'lista':'escolha')}}\n                      style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'8px'}}>\n                      \u2190 {editandoId?'Voltar \u00e0 lista':'Voltar'}\n                    </button>"
print('4:', old4 in c)
c = c.replace(old4, new4, 1)

# 5. Titulo do form
old5 = "                    <h1 style={{fontSize:'22px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'2px'}}>{editandoId?'Editar or\u00e7amento':'Novo or\u00e7amento'}</h1>\n                    <p style={{fontSize:'13px',color:'#94A3B8'}}>Preencha os dados e envie para o cliente.</p>"
new5 = "                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'2px'}}>\n                      <h1 style={{fontSize:'22px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>{editandoId?'Editar or\u00e7amento':tipoOrc==='odonto'?'Or\u00e7amento odontol\u00f3gico':'Novo or\u00e7amento'}</h1>\n                      {tipoOrc==='odonto'&&!editandoId&&<span style={{fontSize:'11px',fontWeight:700,background:'rgba(124,58,237,.18)',border:'1px solid rgba(124,58,237,.35)',borderRadius:'999px',padding:'3px 10px',color:'#C4B5FD'}}>Odontol\u00f3gico</span>}\n                    </div>\n                    <p style={{fontSize:'13px',color:'#94A3B8'}}>{tipoOrc==='odonto'?'Odontograma interativo com procedimentos por dente.':'Preencha os dados e envie para o cliente.'}</p>"
print('5:', old5 in c)
c = c.replace(old5, new5, 1)

# 6. Inserir tela de escolha antes de {view==='form'&&(
ESCOLHA = """        {view==='escolha'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div style={{padding:'28px 32px 60px',maxWidth:'760px',margin:'0 auto'}}>
              <button onClick={()=>setView('lista')}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'24px'}}>
                \u2190 Voltar \u00e0 lista
              </button>
              <h1 style={{fontSize:'24px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'6px'}}>Novo or\u00e7amento</h1>
              <p style={{fontSize:'14px',color:'#94A3B8',marginBottom:'32px'}}>Escolha o tipo de or\u00e7amento que deseja criar.</p>
              <style dangerouslySetInnerHTML={{__html:'@media(max-width:600px){.orc-grid{grid-template-columns:1fr!important}}'}}/>
              <div className="orc-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                <button onClick={()=>{resetForm();setTipoOrc('comum');setView('form')}}
                  style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.10),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(59,130,246,.22)',borderRadius:'20px',padding:'28px 24px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:'14px',transition:'all .18s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(59,130,246,.55)';(e.currentTarget as HTMLButtonElement).style.boxShadow='0 0 32px rgba(59,130,246,.15)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(59,130,246,.22)';(e.currentTarget as HTMLButtonElement).style.boxShadow='none'}}>
                  <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </div>
                  <div>
                    <p style={{fontSize:'17px',fontWeight:800,color:'#F8FAFC',marginBottom:'6px'}}>Or\u00e7amento comum</p>
                    <p style={{fontSize:'13px',color:'#94A3B8',lineHeight:'1.5'}}>Crie or\u00e7amentos simples para servi\u00e7os, procedimentos e atendimentos em geral.</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{fontSize:'13px',fontWeight:700,color:'#60A5FA'}}>Criar or\u00e7amento comum</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
                <button onClick={()=>{resetForm();setTipoOrc('odonto');setUsarOdontograma(true);setView('form')}}
                  style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.12),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(124,58,237,.28)',borderRadius:'20px',padding:'28px 24px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:'14px',position:'relative',transition:'all .18s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(124,58,237,.60)';(e.currentTarget as HTMLButtonElement).style.boxShadow='0 0 32px rgba(124,58,237,.18)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(124,58,237,.28)';(e.currentTarget as HTMLButtonElement).style.boxShadow='none'}}>
                  <div style={{position:'absolute',top:'16px',right:'16px',background:'rgba(124,58,237,.18)',border:'1px solid rgba(124,58,237,.35)',borderRadius:'999px',padding:'3px 10px',fontSize:'10px',fontWeight:700,color:'#C4B5FD',letterSpacing:'.06em'}}>ODONTOL\u00d3GICO</div>
                  <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'rgba(124,58,237,.15)',border:'1px solid rgba(124,58,237,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 5 4 9c0 2.5 1 4.5 2 6 1 1.5 2 3 2 5 0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2 0-2 1-3.5 2-5 1-1.5 2-3.5 2-6 0-4-4-7-8-7z"/></svg>
                  </div>
                  <div>
                    <p style={{fontSize:'17px',fontWeight:800,color:'#F8FAFC',marginBottom:'6px'}}>Or\u00e7amento odontol\u00f3gico</p>
                    <p style={{fontSize:'13px',color:'#94A3B8',lineHeight:'1.5'}}>Monte tratamentos por dente com odontograma interativo, acompanhe pagamentos e gere PDF para o paciente.</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{fontSize:'13px',fontWeight:700,color:'#C4B5FD'}}>Criar or\u00e7amento odontol\u00f3gico</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
"""

old6 = "        {view==='escolha'&&(
          <div style={{minHeight:'100vh',background:'#07111F'}}>
            <div style={{padding:'28px 32px 60px',maxWidth:'760px',margin:'0 auto'}}>
              <button onClick={()=>setView('lista')}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:'13px',color:'#64748B',fontFamily:'inherit',padding:'0',display:'flex',alignItems:'center',gap:'4px',marginBottom:'24px'}}>
                ← Voltar à lista
              </button>
              <h1 style={{fontSize:'24px',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',marginBottom:'6px'}}>Novo orçamento</h1>
              <p style={{fontSize:'14px',color:'#94A3B8',marginBottom:'32px'}}>Escolha o tipo de orçamento que deseja criar.</p>
              <style dangerouslySetInnerHTML={{__html:'@media(max-width:600px){.orc-grid{grid-template-columns:1fr!important}}'}}/>
              <div className="orc-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                <button onClick={()=>{resetForm();setTipoOrc('comum');setView('form')}}
                  style={{background:'radial-gradient(circle at top left,rgba(59,130,246,.10),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(59,130,246,.22)',borderRadius:'20px',padding:'28px 24px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:'14px',transition:'all .18s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(59,130,246,.55)';(e.currentTarget as HTMLButtonElement).style.boxShadow='0 0 32px rgba(59,130,246,.15)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(59,130,246,.22)';(e.currentTarget as HTMLButtonElement).style.boxShadow='none'}}>
                  <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </div>
                  <div>
                    <p style={{fontSize:'17px',fontWeight:800,color:'#F8FAFC',marginBottom:'6px'}}>Orçamento comum</p>
                    <p style={{fontSize:'13px',color:'#94A3B8',lineHeight:'1.5'}}>Crie orçamentos simples para serviços, procedimentos e atendimentos em geral.</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{fontSize:'13px',fontWeight:700,color:'#60A5FA'}}>Criar orçamento comum</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
                <button onClick={()=>{resetForm();setTipoOrc('odonto');setUsarOdontograma(true);setView('form')}}
                  style={{background:'radial-gradient(circle at top left,rgba(124,58,237,.12),transparent 50%),linear-gradient(145deg,rgba(15,23,42,.97),rgba(8,20,33,.99))',border:'1.5px solid rgba(124,58,237,.28)',borderRadius:'20px',padding:'28px 24px',textAlign:'left',cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',gap:'14px',position:'relative',transition:'all .18s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(124,58,237,.60)';(e.currentTarget as HTMLButtonElement).style.boxShadow='0 0 32px rgba(124,58,237,.18)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(124,58,237,.28)';(e.currentTarget as HTMLButtonElement).style.boxShadow='none'}}>
                  <div style={{position:'absolute',top:'16px',right:'16px',background:'rgba(124,58,237,.18)',border:'1px solid rgba(124,58,237,.35)',borderRadius:'999px',padding:'3px 10px',fontSize:'10px',fontWeight:700,color:'#C4B5FD',letterSpacing:'.06em'}}>ODONTOLÓGICO</div>
                  <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'rgba(124,58,237,.15)',border:'1px solid rgba(124,58,237,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 4 5 4 9c0 2.5 1 4.5 2 6 1 1.5 2 3 2 5 0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2 0-2 1-3.5 2-5 1-1.5 2-3.5 2-6 0-4-4-7-8-7z"/></svg>
                  </div>
                  <div>
                    <p style={{fontSize:'17px',fontWeight:800,color:'#F8FAFC',marginBottom:'6px'}}>Orçamento odontológico</p>
                    <p style={{fontSize:'13px',color:'#94A3B8',lineHeight:'1.5'}}>Monte tratamentos por dente com odontograma interativo, acompanhe pagamentos e gere PDF para o paciente.</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={{fontSize:'13px',fontWeight:700,color:'#C4B5FD'}}>Criar orçamento odontológico</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
        {view==='form'&&("
print('6:', old6 in c)
c = c.replace(old6, ESCOLHA + "        {view==='form'&&(", 1)

# 7. Odontograma - ativar automaticamente quando tipoOrc=odonto
# O toggle botao deve refletir tipoOrc
old7 = "                    <div style={{marginBottom:'12px'}}>\n                      <button onClick={()=>setUsarOdontograma(!usarOdontograma)}"
new7 = "                    {tipoOrc!=='odonto'&&<div style={{marginBottom:'12px'}}>\n                      <button onClick={()=>setUsarOdontograma(!usarOdontograma)}"
print('7a:', old7 in c)
c = c.replace(old7, new7, 1)

old7b = "                        <span style={{fontSize:'12px',color:usarOdontograma?'#4ADE80':'#64748B',fontWeight:600}}>{usarOdontograma?'Ativado \u2713':'Adicionar odontograma'}</span>\n                      </button>\n                    </div>"
new7b = "                        <span style={{fontSize:'12px',color:usarOdontograma?'#4ADE80':'#64748B',fontWeight:600}}>{usarOdontograma?'Ativado \u2713':'Adicionar odontograma'}</span>\n                      </button>\n                    </div>}"
print('7b:', old7b in c)
c = c.replace(old7b, new7b, 1)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO! Linhas:', c.count('\n'))
