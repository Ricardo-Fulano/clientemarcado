with open('app/painel/orcamentos/page.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Estados do modal
old1 = "  const [showPagForm,setShowPagForm]=useState(false)
  const [modalPagOrc,setModalPagOrc]=useState<any>(null)
  const [modalValor,setModalValor]=useState('')
  const [modalForma,setModalForma]=useState('Pix')
  const [modalObs,setModalObs]=useState('')
  const [modalErro,setModalErro]=useState('')
  const [modalSaving,setModalSaving]=useState(false)"
new1 = (
    "  const [showPagForm,setShowPagForm]=useState(false)\n"
    "  const [modalPagOrc,setModalPagOrc]=useState<any>(null)\n"
    "  const [modalValor,setModalValor]=useState('')\n"
    "  const [modalForma,setModalForma]=useState('Pix')\n"
    "  const [modalObs,setModalObs]=useState('')\n"
    "  const [modalErro,setModalErro]=useState('')\n"
    "  const [modalSaving,setModalSaving]=useState(false)"
)
print('1 estados:', old1 in c)
c = c.replace(old1, new1, 1)

# 2. Funcoes - inserir antes de enviarWpp
OLD_FN = "  function abrirModalPag(orc:any){
    setModalPagOrc(orc)
    const saldo=orc.saldo_restante||0
    setModalValor(saldo.toFixed(2).replace('.',','))
    setModalForma('Pix');setModalObs('');setModalErro('')
  }
  async function confirmarPagamentoModal(){
    if(!modalPagOrc)return
    const valor=parseFloat((modalValor||'0').replace(/\./g,'').replace(',','.'))||0
    if(valor<=0){setModalErro('Informe um valor maior que zero.');return}
    const saldo=modalPagOrc.saldo_restante||0
    if(valor>saldo+0.01){setModalErro('Valor maior que o saldo restante.');return}
    setModalSaving(true);setModalErro('')
    const novoValorPago=(modalPagOrc.valor_pago||0)+valor
    const novoSaldo=Math.max(0,(modalPagOrc.total||0)-novoValorPago)
    const novoStatus=novoSaldo<0.01?'Pago':'Parcialmente pago'
    try{
      await supabase.from('orcamento_pagamentos').insert({
        orcamento_id:modalPagOrc.id,user_id:userId,
        data:new Date().toISOString().split('T')[0],
        valor,forma:modalForma,observacao:modalObs||null
      })
    }catch(e){console.log('orcamento_pagamentos:',e)}
    const{error}=await supabase.from('orcamentos').update({
      valor_pago:novoValorPago,saldo_restante:novoSaldo,
      status:novoStatus,updated_at:new Date().toISOString()
    }).eq('id',modalPagOrc.id)
    if(error){setModalErro('Erro ao registrar. Tente novamente.');setModalSaving(false);return}
    setOrcamentos(prev=>prev.map(o=>o.id===modalPagOrc.id?{...o,valor_pago:novoValorPago,saldo_restante:novoSaldo,status:novoStatus}:o))
    setModalSaving(false);setModalPagOrc(null)
    setMensagem(novoStatus==='Pago'?'Pagamento confirmado! Orçamento pago.':'Pagamento parcial registrado!')
    setTimeout(()=>setMensagem(''),4000)
  }
  function enviarWpp("
NEW_FN = (
    "  function abrirModalPag(orc:any){\n"
    "    setModalPagOrc(orc)\n"
    "    const saldo=orc.saldo_restante||0\n"
    "    setModalValor(saldo.toFixed(2).replace('.',','))\n"
    "    setModalForma('Pix');setModalObs('');setModalErro('')\n"
    "  }\n"
    "  async function confirmarPagamentoModal(){\n"
    "    if(!modalPagOrc)return\n"
    "    const valor=parseFloat((modalValor||'0').replace(/\\./g,'').replace(',','.'))||0\n"
    "    if(valor<=0){setModalErro('Informe um valor maior que zero.');return}\n"
    "    const saldo=modalPagOrc.saldo_restante||0\n"
    "    if(valor>saldo+0.01){setModalErro('Valor maior que o saldo restante.');return}\n"
    "    setModalSaving(true);setModalErro('')\n"
    "    const novoValorPago=(modalPagOrc.valor_pago||0)+valor\n"
    "    const novoSaldo=Math.max(0,(modalPagOrc.total||0)-novoValorPago)\n"
    "    const novoStatus=novoSaldo<0.01?'Pago':'Parcialmente pago'\n"
    "    try{\n"
    "      await supabase.from('orcamento_pagamentos').insert({\n"
    "        orcamento_id:modalPagOrc.id,user_id:userId,\n"
    "        data:new Date().toISOString().split('T')[0],\n"
    "        valor,forma:modalForma,observacao:modalObs||null\n"
    "      })\n"
    "    }catch(e){console.log('orcamento_pagamentos:',e)}\n"
    "    const{error}=await supabase.from('orcamentos').update({\n"
    "      valor_pago:novoValorPago,saldo_restante:novoSaldo,\n"
    "      status:novoStatus,updated_at:new Date().toISOString()\n"
    "    }).eq('id',modalPagOrc.id)\n"
    "    if(error){setModalErro('Erro ao registrar. Tente novamente.');setModalSaving(false);return}\n"
    "    setOrcamentos(prev=>prev.map(o=>o.id===modalPagOrc.id?{...o,valor_pago:novoValorPago,saldo_restante:novoSaldo,status:novoStatus}:o))\n"
    "    setModalSaving(false);setModalPagOrc(null)\n"
    "    setMensagem(novoStatus==='Pago'?'Pagamento confirmado! Orçamento pago.':'Pagamento parcial registrado!')\n"
    "    setTimeout(()=>setMensagem(''),4000)\n"
    "  }\n"
    "  function enviarWpp("
)
print('2 funcoes:', OLD_FN in c)
c = c.replace(OLD_FN, NEW_FN, 1)

# 3. Botao mobile - apos botao wpp mobile
OLD_MOB = (
    "                            <button onClick={()=>enviarWpp(orc)}\n"
    "                              style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>💬 WhatsApp</button>"
)
NEW_MOB = (
    "                            <button onClick={()=>enviarWpp(orc)}\n"
    "                              style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',fontWeight:600,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit'}}>💬 WhatsApp</button>\n"
    "                            {(orc.saldo_restante||0)>0.01&&!['Pago','Finalizado','Cancelado'].includes(orc.status)&&(\n"
    "                              <button onClick={()=>abrirModalPag(orc)}\n"
    "                                style={{gridColumn:'1/-1',background:'rgba(34,197,94,.12)',border:'1.5px solid rgba(34,197,94,.35)',borderRadius:'8px',padding:'11px',fontSize:'13px',fontWeight:700,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>\n"
    "                                Confirmar pagamento  R$ {fmtBRL(orc.saldo_restante||0)}\n"
    "                              </button>\n"
    "                            )}"
)
print('3 mobile:', OLD_MOB in c)
c = c.replace(OLD_MOB, NEW_MOB, 1)

# 4. Botao desktop - apos botao PDF desktop
OLD_DESK = (
    "                            <button onClick={()=>gerarPDF(orc)}\n"
    "                              style={{background:'rgba(6,182,212,.15)',border:'1px solid rgba(6,182,212,.3)',borderRadius:'6px',padding:'4px 6px',fontSize:'11px',fontWeight:600,color:'#22D3EE',cursor:'pointer',fontFamily:'inherit'}}>PDF</button>"
)
NEW_DESK = (
    "                            <button onClick={()=>gerarPDF(orc)}\n"
    "                              style={{background:'rgba(6,182,212,.15)',border:'1px solid rgba(6,182,212,.3)',borderRadius:'6px',padding:'4px 6px',fontSize:'11px',fontWeight:600,color:'#22D3EE',cursor:'pointer',fontFamily:'inherit'}}>PDF</button>\n"
    "                            {(orc.saldo_restante||0)>0.01&&!['Pago','Finalizado','Cancelado'].includes(orc.status)&&(\n"
    "                              <button onClick={()=>abrirModalPag(orc)}\n"
    "                                style={{background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:'6px',padding:'4px 8px',fontSize:'11px',fontWeight:700,color:'#4ADE80',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>\n"
    "                                Pgto\n"
    "                              </button>\n"
    "                            )}"
)
print('4 desktop:', OLD_DESK in c)
c = c.replace(OLD_DESK, NEW_DESK, 1)

# 5. Modal - inserir antes do fechamento final
OLD_END = "    </div>\n  )\n}"
NEW_END = (
    "    </div>\n"
    "    {modalPagOrc&&(\n"
    "      <>\n"
    "        <div onClick={()=>setModalPagOrc(null)}\n"
    "          style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',backdropFilter:'blur(6px)',zIndex:80}}/>\n"
    "        <div style={{position:'fixed',zIndex:90,background:'linear-gradient(145deg,#0B1628,#101B2D)',border:'1px solid rgba(34,197,94,.25)',borderRadius:'24px',padding:'28px',boxShadow:'0 24px 80px rgba(0,0,0,.6)',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(92vw,480px)',maxHeight:'90vh',overflowY:'auto'}}>\n"
    "          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}}>\n"
    "            <div>\n"
    "              <p style={{fontSize:'11px',fontWeight:700,color:'#4ADE80',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:'4px'}}>Orçamento</p>\n"
    "              <p style={{fontSize:'18px',fontWeight:800,color:'#F8FAFC',letterSpacing:'-0.02em'}}>Confirmar pagamento</p>\n"
    "            </div>\n"
    "            <button onClick={()=>setModalPagOrc(null)} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:'22px',lineHeight:1}}>x</button>\n"
    "          </div>\n"
    "          <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'14px',padding:'16px',marginBottom:'20px'}}>\n"
    "            {[{l:'Cliente',v:modalPagOrc.cliente_nome,c:'#F8FAFC'},{l:'Total do orçamento',v:'R$ '+fmtBRL(modalPagOrc.total),c:'#F8FAFC'},{l:'Já pago',v:'R$ '+fmtBRL(modalPagOrc.valor_pago||0),c:'#4ADE80'},{l:'Saldo restante',v:'R$ '+fmtBRL(modalPagOrc.saldo_restante||0),c:'#FBBF24'}].map(({l,v,c:cor})=>(\n"
    "              <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'8px'}}>\n"
    "                <span style={{color:'#64748B'}}>{l}</span>\n"
    "                <span style={{fontWeight:700,color:cor}}>{v}</span>\n"
    "              </div>\n"
    "            ))}\n"
    "          </div>\n"
    "          <div style={{display:'flex',flexDirection:'column',gap:'14px',marginBottom:'20px'}}>\n"
    "            <div>\n"
    "              <label style={{fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:'6px'}}>Valor recebido *</label>\n"
    "              <div style={{position:'relative'}}>\n"
    "                <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#64748B',fontWeight:600}}>R$</span>\n"
    "                <input type='text' inputMode='decimal' value={modalValor}\n"
    "                  onChange={e=>setModalValor(e.target.value.replace(/[^0-9,]/g,''))}\n"
    "                  style={{width:'100%',background:'rgba(255,255,255,.06)',border:'1.5px solid rgba(34,197,94,.35)',borderRadius:'10px',padding:'12px 14px 12px 36px',fontSize:'16px',fontWeight:700,color:'#4ADE80',outline:'none',fontFamily:'inherit',boxSizing:'border-box' as const}}/>\n"
    "              </div>\n"
    "            </div>\n"
    "            <div>\n"
    "              <label style={{fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:'6px'}}>Forma de pagamento</label>\n"
    "              <select value={modalForma} onChange={e=>setModalForma(e.target.value)}\n"
    "                style={{width:'100%',background:'rgba(255,255,255,.06)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'10px',padding:'12px 14px',fontSize:'14px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',boxSizing:'border-box' as const,cursor:'pointer'}}>\n"
    "                {['Pix','Dinheiro','Cartão de crédito','Cartão de débito','Transferência','Outro'].map(f=><option key={f} style={{background:'#0B1628'}}>{f}</option>)}\n"
    "              </select>\n"
    "            </div>\n"
    "            <div>\n"
    "              <label style={{fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase' as const,letterSpacing:'.06em',display:'block',marginBottom:'6px'}}>Observação (opcional)</label>\n"
    "              <input type='text' value={modalObs} onChange={e=>setModalObs(e.target.value)}\n"
    "                placeholder='Ex: entrada, parcela final...'\n"
    "                style={{width:'100%',background:'rgba(255,255,255,.06)',border:'1.5px solid rgba(148,163,184,.18)',borderRadius:'10px',padding:'12px 14px',fontSize:'14px',color:'#F8FAFC',outline:'none',fontFamily:'inherit',boxSizing:'border-box' as const}}/>\n"
    "            </div>\n"
    "          </div>\n"
    "          {modalErro&&<div style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'8px',padding:'10px 14px',fontSize:'13px',color:'#F87171',marginBottom:'14px'}}>{modalErro}</div>}\n"
    "          <div style={{display:'flex',gap:'10px'}}>\n"
    "            <button onClick={()=>setModalPagOrc(null)}\n"
    "              style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:'14px',padding:'14px',color:'#94A3B8',fontSize:'14px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>\n"
    "              Cancelar\n"
    "            </button>\n"
    "            <button onClick={confirmarPagamentoModal} disabled={modalSaving}\n"
    "              style={{flex:2,background:'linear-gradient(135deg,#22C55E,#16A34A)',border:'none',borderRadius:'14px',padding:'14px',color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:modalSaving?0.7:1}}>\n"
    "              {modalSaving?'Registrando...':'Confirmar recebimento'}\n"
    "            </button>\n"
    "          </div>\n"
    "        </div>\n"
    "      </>\n"
    "    )}\n"
    "  )\n"
    "}"
)
print('5 modal:', OLD_END in c)
c = c.replace(OLD_END, NEW_END, 1)

print('--- RESULTADO ---')
print('modalPagOrc:', 'modalPagOrc' in c)
print('confirmarPagamentoModal:', 'confirmarPagamentoModal' in c)
print('Confirmar pagamento btn:', 'Confirmar pagamento' in c)
print('Modal render:', 'Confirmar recebimento' in c)

with open('app/painel/orcamentos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SALVO!')
