with open('app/painel/financeiro/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Adicionar estado do modal apos estado msg
old_state = "  const [msg, setMsg] = useState('')"
new_state = "  const [msg, setMsg] = useState('')\n  const [pagSel, setPagSel] = useState<any>(null)"
print('1 state:', old_state in c)
c = c.replace(old_state, new_state, 1)

# 2. Melhorar card de pagamento e adicionar botao Ver detalhes
old_card = """                      <div key={p.id} className="crd" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>{p.cliente_nome || p.descricao || 'Pagamento'}</p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', color: '#64748B' }}>{p.forma || p.forma_pagamento || '—'}</span>
                              {p.data && <span style={{ fontSize: '12px', color: '#64748B' }}>· {fmtData(p.data)}</span>}
                              {p.origem && <span style={{ fontSize: '11px', color: '#94A3B8', background: 'rgba(255,255,255,.05)', padding: '2px 8px', borderRadius: '999px' }}>{p.origem}</span>}
                            </div>
                          </div>
                          <p style={{ fontSize: '20px', fontWeight: 800, color: '#4ADE80', lineHeight: 1 }}>{fmtBRL(p.valor)}</p>
                        </div>
                      </div>"""
new_card = """                      <div key={p.id} className="crd" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>{p.cliente_nome || p.descricao || 'Pagamento'}</p>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
                              {p.data && <span style={{ fontSize: '12px', color: '#64748B' }}>{fmtData(p.data)}</span>}
                              {(p.forma || p.forma_pagamento) && <span style={{ fontSize: '12px', color: '#64748B' }}>· {p.forma || p.forma_pagamento}</span>}
                              {p.origem && <span style={{ fontSize: '11px', color: '#94A3B8', background: 'rgba(255,255,255,.05)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(255,255,255,.08)' }}>{p.origem}</span>}
                            </div>
                            <button onClick={() => setPagSel(p)}
                              style={{ background: 'rgba(59,130,246,.10)', border: '1px solid rgba(59,130,246,.22)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#60A5FA', cursor: 'pointer', fontFamily: 'inherit' }}>
                              Ver detalhes
                            </button>
                          </div>
                          <p style={{ fontSize: '20px', fontWeight: 800, color: '#4ADE80', lineHeight: 1 }}>{fmtBRL(p.valor)}</p>
                        </div>
                      </div>"""
print('2 card:', old_card in c)
c = c.replace(old_card, new_card, 1)

# 3. Adicionar modal antes do fechamento do return
old_end = "    </div>\n  )\n}"
new_end = """    </div>
    {pagSel&&(
      <>
        <div onClick={()=>setPagSel(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(6px)',zIndex:80}}/>
        <div style={{position:'fixed',zIndex:90,background:'linear-gradient(145deg,#0B1628,#101B2D)',border:'1px solid rgba(59,130,246,.22)',borderRadius:'24px',padding:'28px',boxShadow:'0 24px 80px rgba(0,0,0,.6)',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(92vw,480px)',maxHeight:'90vh',overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}}>
            <div>
              <p style={{fontSize:'11px',fontWeight:700,color:'#60A5FA',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>Financeiro</p>
              <p style={{fontSize:'18px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>Detalhes do pagamento</p>
            </div>
            <button onClick={()=>setPagSel(null)} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:'22px',lineHeight:1}}>×</button>
          </div>
          <div style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.20)',borderRadius:'14px',padding:'16px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'13px',color:'#94A3B8'}}>Valor recebido</span>
            <span style={{fontSize:'24px',fontWeight:800,color:'#4ADE80'}}>{fmtBRL(pagSel.valor)}</span>
          </div>
          <div style={{display:'flex',flexDirection:'column' as const,gap:'12px',marginBottom:'24px'}}>
            {[
              {l:'Cliente', v:pagSel.cliente_nome||'Não informado'},
              {l:'Data', v:pagSel.data?fmtData(pagSel.data):'Não informada'},
              {l:'Forma de pagamento', v:pagSel.forma||pagSel.forma_pagamento||'Não informada'},
              {l:'Tipo', v:pagSel.tipo||'Completo'},
              {l:'Origem', v:pagSel.origem||'Manual'},
              {l:'Status', v:'Confirmado', c:'#4ADE80'},
              ...(pagSel.referencia?[{l:'Referência', v:pagSel.referencia}]:[]),
              ...(pagSel.observacao?[{l:'Observação', v:pagSel.observacao}]:[]),
              ...(!pagSel.observacao?[{l:'Observação', v:'Nenhuma observação', c:'#475569'}]:[]),
            ].map(({l,v,c:cor}:any)=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                <span style={{fontSize:'13px',color:'#64748B',flexShrink:0}}>{l}</span>
                <span style={{fontSize:'13px',fontWeight:600,color:cor||'#F8FAFC',textAlign:'right' as const}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <button onClick={()=>setPagSel(null)}
              style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'14px',padding:'14px',color:'#94A3B8',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              Fechar
            </button>
            {pagSel.orcamento_id&&(
              <button onClick={()=>{window.location.href='/painel/orcamentos';setPagSel(null)}}
                style={{flex:1,background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.30)',borderRadius:'14px',padding:'14px',color:'#60A5FA',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                Ver orçamento
              </button>
            )}
          </div>
        </div>
      </>
    )}
  )
}"""
print('3 modal:', old_end in c)
c = c.replace(old_end, new_end, 1)

with open('app/painel/financeiro/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO!')
